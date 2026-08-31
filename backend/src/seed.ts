import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import type { Category, Priority, Status } from './constants.js';
import { Counter } from './models/Counter.js';
import { Message } from './models/Message.js';
import { Ticket } from './models/Ticket.js';
import { hashPassword, User } from './models/User.js';
import { triageTicket } from './services/ai.service.js';
import { nextTicketNumber } from './services/ticketNumber.service.js';

const DEMO_PASSWORD = 'Passw0rd!';

interface SeedTicket {
  customerKey: 'customer' | 'riley';
  agentKey?: 'alex' | 'jordan';
  subject: string;
  description: string;
  category?: Category;
  status: Status;
  priorityOverride?: Priority;
  reviewed?: boolean;
  resolutionNote?: string;
  messages?: { from: 'customer' | 'agent'; text: string }[];
}

const SEED_TICKETS: SeedTicket[] = [
  {
    customerKey: 'customer',
    subject: 'Charged twice for my order',
    description:
      'I was charged twice for the same order and need one payment refunded. My bank statement clearly shows two identical charges.',
    status: 'New',
    messages: [],
  },
  {
    customerKey: 'customer',
    agentKey: 'alex',
    subject: 'Cannot log in after password reset',
    description:
      "I reset my password yesterday and now I'm completely locked out of my account. The login page keeps saying invalid credentials.",
    status: 'In Progress',
    reviewed: true,
    messages: [
      { from: 'customer', text: 'This is urgent, I need access for a client demo tomorrow.' },
      { from: 'agent', text: 'Thanks for the details — I have triggered a fresh reset link to your email. Can you try again?' },
    ],
  },
  {
    customerKey: 'riley',
    agentKey: 'alex',
    subject: 'Where is my delivery?',
    description:
      "My package was supposed to arrive three days ago but the tracking page hasn't updated. Order number 55123.",
    category: 'Delivery',
    status: 'Assigned',
    reviewed: false,
    messages: [{ from: 'customer', text: 'Any update on this? It has now been 4 days.' }],
  },
  {
    customerKey: 'riley',
    agentKey: 'jordan',
    subject: 'Invoice shows the wrong billing address',
    description:
      'The latest invoice has my old billing address. I need a corrected invoice for my accounting team before month end. No rush but please fix.',
    category: 'Billing',
    status: 'Resolved',
    reviewed: true,
    resolutionNote: 'Regenerated the invoice with the updated billing address and emailed the corrected PDF to the customer.',
    messages: [
      { from: 'customer', text: 'Thanks, could you also send it to finance@rileyco.example?' },
      { from: 'agent', text: 'Done — corrected invoice sent to both addresses.' },
    ],
  },
  {
    customerKey: 'customer',
    subject: 'Dashboard charts not loading',
    description:
      "The analytics dashboard shows a blank screen with a spinner that never stops. Console shows a 500 server error. This started this morning.",
    category: 'Technical',
    status: 'New',
    messages: [],
  },
  {
    customerKey: 'riley',
    agentKey: 'jordan',
    subject: 'How do I add teammates to my account?',
    description:
      'Just wondering how I can invite two colleagues to my workspace. Not urgent, whenever you get a chance.',
    category: 'Account',
    status: 'In Progress',
    reviewed: true,
    messages: [
      { from: 'agent', text: 'You can invite teammates from Settings → Members → Invite. Want me to send you a screenshot?' },
    ],
  },
];

async function run(): Promise<void> {
  await connectDB();

  console.log('Clearing existing collections…');
  await Promise.all([
    User.deleteMany({}),
    Ticket.deleteMany({}),
    Message.deleteMany({}),
    Counter.deleteMany({}),
  ]);

  const passwordHash = await hashPassword(DEMO_PASSWORD);

  console.log('Creating demo users…');
  const [customer, riley, alex, jordan, admin] = await User.create([
    { name: 'Casey Customer', email: 'customer@supportflow.demo', passwordHash, role: 'customer' },
    { name: 'Riley Buyer', email: 'riley@supportflow.demo', passwordHash, role: 'customer' },
    { name: 'Alex Agent', email: 'agent@supportflow.demo', passwordHash, role: 'agent' },
    { name: 'Jordan Support', email: 'jordan@supportflow.demo', passwordHash, role: 'agent' },
    { name: 'Sam Admin', email: 'admin@supportflow.demo', passwordHash, role: 'admin' },
  ]);

  const customers = { customer, riley };
  const agents = { alex, jordan };

  console.log('Creating demo tickets…');
  for (const spec of SEED_TICKETS) {
    const ticketNumber = await nextTicketNumber();
    const cust = customers[spec.customerKey];
    const agent = spec.agentKey ? agents[spec.agentKey] : null;

    let aiCategory: Category | null = null;
    let aiPriority: Priority | null = null;
    let aiSummary: string | null = null;
    let category: Category = spec.category ?? 'General';
    let priority: Priority = spec.priorityOverride ?? 'Medium';

    try {
      const triage = await triageTicket({
        subject: spec.subject,
        description: spec.description,
        customerCategory: spec.category ?? null,
      });
      aiCategory = triage.category;
      aiPriority = triage.priority;
      aiSummary = triage.summary;
      if (!spec.category) category = triage.category;
      if (!spec.priorityOverride) priority = triage.priority;
    } catch {
      // AI failure is non-fatal — the ticket still gets created.
    }

    const ticket = await Ticket.create({
      ticketNumber,
      customerId: cust._id,
      assignedAgentId: agent?._id ?? null,
      subject: spec.subject,
      description: spec.description,
      category,
      priority,
      status: spec.status,
      aiCategory,
      aiPriority,
      aiSummary,
      aiReviewed: spec.reviewed ?? false,
      resolutionNote: spec.resolutionNote ?? '',
    });

    for (const msg of spec.messages ?? []) {
      const sender = msg.from === 'customer' ? cust : (agent ?? alex);
      await Message.create({
        ticketId: ticket._id,
        senderId: sender._id,
        senderRole: msg.from === 'customer' ? 'customer' : 'agent',
        message: msg.text,
      });
    }

    if (spec.status === 'Resolved' && spec.resolutionNote) {
      await Message.create({
        ticketId: ticket._id,
        senderId: (agent ?? jordan)._id,
        senderRole: 'agent',
        message: `✅ Ticket resolved — ${spec.resolutionNote}`,
      });
    }

    console.log(`  ${ticketNumber}  ${spec.status.padEnd(12)}  ${spec.subject}`);
  }

  console.log('\n✅  Seed complete.\n');
  console.log('   Demo accounts (password for all):  ' + DEMO_PASSWORD);
  console.log('   ─────────────────────────────────────────────');
  console.log('   customer@supportflow.demo   role: customer');
  console.log('   riley@supportflow.demo      role: customer');
  console.log('   agent@supportflow.demo      role: agent');
  console.log('   jordan@supportflow.demo     role: agent');
  console.log('   admin@supportflow.demo      role: admin\n');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
