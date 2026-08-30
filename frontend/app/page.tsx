import Link from 'next/link';
import {
  BarChart3,
  Bot,
  Gauge,
  MessagesSquare,
  ShieldCheck,
  LayoutDashboard,
  ArrowRight,
} from 'lucide-react';
import { PublicNav } from '@/components/landing/PublicNav';
import { DashboardMockup } from '@/components/landing/DashboardMockup';
import { Button } from '@/components/ui/Button';

const FEATURES = [
  {
    icon: Bot,
    title: 'AI Ticket Triage',
    body: 'Every new ticket is analyzed the moment it is submitted — category, priority and a concise summary, ready for a human to confirm.',
  },
  {
    icon: Gauge,
    title: 'Smart Prioritization',
    body: 'Duplicate payments, lockouts and outages are surfaced as High priority so agents always work the right ticket next.',
  },
  {
    icon: MessagesSquare,
    title: 'Real-Time Conversations',
    body: 'Customer and agent messages sync instantly over WebSockets — no refresh, no lost context.',
  },
  {
    icon: LayoutDashboard,
    title: 'Agent Dashboard',
    body: 'Filter by status, priority and category, search by ticket number or customer, and resolve with an auditable note.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Authentication',
    body: 'JWT sessions, bcrypt-hashed passwords and strict server-side role checks on every protected route.',
  },
  {
    icon: BarChart3,
    title: 'Ticket Analytics',
    body: 'Dashboard statistics are computed live from MongoDB — never hard-coded, always current.',
  },
];

const STEPS = [
  ['Customer Creates Ticket', 'A subject, a description, an optional category. That is all it takes.'],
  ['AI Triages Ticket', 'The triage engine suggests category, priority and a summary in seconds.'],
  ['Agent Reviews', 'A human confirms or edits the AI suggestion before it becomes final.'],
  ['Customer & Agent Communicate', 'A threaded, real-time conversation keeps everyone aligned.'],
  ['Agent Resolves', 'A resolution note is required — then the ticket is closed and stats update.'],
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <PublicNav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-grid opacity-40" aria-hidden />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/5 px-3 py-1 text-xs font-medium text-gold">
              <Bot className="h-3.5 w-3.5" />
              AI-Powered Support. Human-Driven Resolution.
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Resolve Support Faster with{' '}
              <span className="text-gradient-gold">AI + Human Expertise</span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted sm:text-lg">
              SupportFlow intelligently triages customer tickets, helps agents prioritize
              issues, and keeps every conversation organized from first message to final
              resolution.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup">
                <Button size="lg">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="secondary">
                  Explore Features
                </Button>
              </a>
            </div>
            <p className="mt-4 text-xs text-muted">
              Demo accounts:{' '}
              <code className="text-gold">customer@supportflow.demo</code> ·{' '}
              <code className="text-gold">agent@supportflow.demo</code> ·{' '}
              password <code className="text-gold">Passw0rd!</code>
            </p>
          </div>

          <div className="animate-slide-up">
            <DashboardMockup />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">Everything a support team needs</h2>
          <p className="mt-3 text-muted">
            Built for the full lifecycle — intake, triage, conversation and resolution.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-line bg-surface p-6 transition hover:border-gold/40 hover:shadow-card"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 text-gold">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-y border-line bg-surface/40">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">How It Works</h2>
            <p className="mt-3 text-muted">Five steps from first message to final resolution.</p>
          </div>
          <ol className="mt-12 space-y-4">
            {STEPS.map(([title, body], i) => (
              <li
                key={title}
                className="flex gap-4 rounded-xl border border-line bg-surface p-5"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold-strong to-gold-soft text-sm font-bold text-black">
                  {i + 1}
                </span>
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="mt-1 text-sm text-muted">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* About / CTA */}
      <section id="about" className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight">
          AI that assists. People who decide.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-muted">
          SupportFlow never lets the AI have the final word. Triage suggestions are always
          marked for human review, so your team stays accountable for every classification
          and every resolution.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/signup">
            <Button size="lg">Create your account</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">
              Login
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line bg-surface/40">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          <div>
            <p className="text-lg font-semibold">
              Support<span className="text-gradient-gold">Flow</span>
            </p>
            <p className="mt-2 text-sm text-muted">
              AI-assisted customer support ticket management. AI-Powered Support.
              Human-Driven Resolution.
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">Navigation</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>
                <Link href="/" className="hover:text-content">
                  Home
                </Link>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-content">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-content">
                  About
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium">Features</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>AI Ticket Triage</li>
              <li>Real-Time Conversations</li>
              <li>Ticket Analytics</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium">Account</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li>
                <Link href="/login" className="hover:text-content">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-content">
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-line py-6 text-center text-xs text-muted">
          © {new Date().getFullYear()} SupportFlow. Built for the AI Factory 2.0 hackathon.
        </div>
      </footer>
    </div>
  );
}
