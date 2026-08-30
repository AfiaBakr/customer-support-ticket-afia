import { env } from '../config/env';
import { type Category, CATEGORIES, type Priority } from '../constants';
import { type AiTriageResult, aiTriageResultSchema } from '../validators/ai.schema';

export interface TriageInput {
  subject: string;
  description: string;
  /** The category the customer picked, if any. */
  customerCategory?: Category | null;
}

export interface TriageResult extends AiTriageResult {
  model: string;
  /** Always true — AI output is a suggestion, never the final value. */
  reviewRequired: true;
}

export class AiUnavailableError extends Error {
  constructor(message = 'AI triage is temporarily unavailable') {
    super(message);
    this.name = 'AiUnavailableError';
  }
}

/* --------------------------------------------------------------------------
 * Local heuristic triage engine
 *
 * A deterministic, offline classifier. It produces the same
 * { category, priority, summary } contract a remote LLM would, so the
 * calling code (validation, human-review workflow, storage) is unchanged
 * if a real provider is dropped in later.
 * ---------------------------------------------------------------------- */

const KEYWORDS: Record<
  'Billing' | 'Payment' | 'Technical' | 'Account' | 'Order' | 'Delivery',
  string[]
> = {
  Billing: [
    'bill', 'billed', 'billing', 'invoice', 'charge', 'charged', 'charges',
    'overcharge', 'over charged', 'double charge', 'charged twice', 'twice charged',
    'duplicate payment', 'duplicate charge', 'refund', 'refunded', 'subscription',
    'plan', 'receipt', 'credit note', 'statement',
  ],
  Payment: [
    'payment', 'pay ', 'paid', 'card', 'credit card', 'debit card', 'transaction',
    'checkout failed', 'declined', 'payment gateway', 'paypal', 'stripe',
  ],
  Technical: [
    'error', 'bug', 'crash', 'crashed', 'broken', 'not working', "doesn't work",
    'does not work', 'http 500', ' 500 ', ' 404 ', 'exception', 'glitch', 'freeze',
    'frozen', 'stuck loading', "won't load", 'wont load', 'blank screen', 'timeout',
    'timed out', 'server error',
  ],
  Account: [
    'login', 'log in', 'sign in', 'signin', 'sign-in', 'password', 'reset password',
    'locked out', 'account locked', 'locked', '2fa', 'two factor', 'two-factor',
    'verification code', 'verify my email', 'change email', 'username', 'my profile',
    'account access',
  ],
  Order: [
    'order', 'ordered', 'my cart', 'checkout', 'purchase', 'purchased', 'bought',
    'placed an order', 'cancel my order', 'order number', 'order id', 'order #',
  ],
  Delivery: [
    'delivery', 'deliver', 'delivered', 'shipping', 'shipment', 'shipped', 'courier',
    'package', 'parcel', 'tracking', 'track my', 'delayed', "hasn't arrived",
    'not arrived', 'never arrived', 'lost package', 'wrong address',
  ],
};

const HIGH_SIGNALS = [
  'charged twice', 'twice charged', 'double charge', 'double charged',
  'duplicate payment', 'duplicate charge', 'unauthorized', 'unauthorised', 'fraud',
  'fraudulent', 'stolen', 'urgent', 'urgently', 'asap', 'immediately',
  'as soon as possible', 'right now', 'locked out', 'cannot login', "can't login",
  "can't log in", 'cannot log in', 'cannot access', "can't access", 'data loss',
  'lost all my', 'security', 'breach', 'not working at all', 'completely down',
  'system is down', 'production down', 'losing money', 'refund', 'chargeback',
  'escalate', 'legal', 'gdpr',
];

const LOW_SIGNALS = [
  'how do i', 'how to', 'how can i', 'question about', 'just wondering',
  'feature request', 'suggestion', 'feedback', 'typo', 'minor', 'cosmetic',
  'when will', 'is it possible', 'clarification', 'no rush', 'not urgent',
  'whenever you get a chance', 'nice to have',
];

function normalize(text: string): string {
  return ` ${text.toLowerCase().replace(/\s+/g, ' ').trim()} `;
}

function scoreKeywords(haystack: string, needles: string[]): number {
  let score = 0;
  for (const needle of needles) {
    if (haystack.includes(needle)) {
      score += needle.includes(' ') ? 2 : 1;
    }
  }
  return score;
}

function detectCategory(text: string, customerCategory?: Category | null): Category {
  let best: Category = 'General';
  let bestScore = 0;
  for (const [category, needles] of Object.entries(KEYWORDS)) {
    const score = scoreKeywords(text, needles);
    if (score > bestScore) {
      bestScore = score;
      best = category as Category;
    }
  }
  if (bestScore === 0) {
    return customerCategory && CATEGORIES.includes(customerCategory) ? customerCategory : 'General';
  }
  return best;
}

function detectPriority(text: string): Priority {
  if (HIGH_SIGNALS.some((s) => text.includes(s))) return 'High';
  if (LOW_SIGNALS.some((s) => text.includes(s))) return 'Low';
  return 'Medium';
}

function firstSentence(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^(.{10,200}?[.!?])(\s|$)/);
  const lead = (match ? match[1] : trimmed).trim();
  return lead.length > 180 ? `${lead.slice(0, 177).trimEnd()}...` : lead;
}

function buildSummary(subject: string, description: string, text: string, category: Category): string {
  const duplicatePayment =
    /(charged?\s+twice|twice\s+.*charged|double\s+charge|duplicate\s+(payment|charge))/;
  if (duplicatePayment.test(text)) {
    return 'Possible duplicate payment reported by customer.';
  }
  const lead = firstSentence(description) || subject.trim();
  return `${category} issue reported by customer: ${lead}`.slice(0, 300);
}

/**
 * Runs triage on a ticket. Throws {@link AiUnavailableError} on any failure so
 * the caller can fall back to manual classification without crashing ticket
 * creation.
 */
export async function triageTicket(input: TriageInput): Promise<TriageResult> {
  try {
    // A small, deliberate delay so the "AI is analyzing…" UI stage is visible.
    await new Promise((resolve) => setTimeout(resolve, 450));

    const text = normalize(`${input.subject} . ${input.description}`);
    if (text.trim().length < 3) {
      throw new Error('Not enough ticket content to analyze');
    }

    const raw = {
      category: detectCategory(text, input.customerCategory),
      priority: detectPriority(text),
      summary: buildSummary(input.subject, input.description, text, detectCategory(text, input.customerCategory)),
    };

    // Validate our own output against the same schema a remote LLM would face.
    const parsed = aiTriageResultSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(`Triage produced invalid output: ${parsed.error.message}`);
    }

    return { ...parsed.data, model: env.AI_MODEL, reviewRequired: true };
  } catch (err) {
    throw new AiUnavailableError((err as Error).message);
  }
}
