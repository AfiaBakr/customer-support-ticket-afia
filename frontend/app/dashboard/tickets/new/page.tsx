'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { Card } from '@/components/ui/primitives';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { api } from '@/lib/api';
import { CATEGORIES } from '@/lib/constants';
import type { Ticket } from '@/lib/types';
import { errorMessage } from '@/lib/utils';
import { createTicketSchema, type CreateTicketValues } from '@/lib/validation';
import { toast } from '@/store/toast';

const STAGES = [
  'Reading the issue',
  'Identifying category',
  'Assessing priority',
  'Generating summary',
];

export default function NewTicketPage() {
  useRequireAuth(['customer']);
  const router = useRouter();

  const [phase, setPhase] = useState<'form' | 'analyzing' | 'done'>('form');
  const [stage, setStage] = useState(0);
  const [result, setResult] = useState<{ ticket: Ticket; aiAvailable: boolean } | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateTicketValues>({ resolver: zodResolver(createTicketSchema) });

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  async function onSubmit(values: CreateTicketValues) {
    setPhase('analyzing');
    setStage(0);
    timers.current = STAGES.map((_, i) =>
      setTimeout(() => setStage(i), i * 650),
    );

    try {
      const res = await api.post('/tickets', {
        subject: values.subject,
        description: values.description,
        category: values.category || undefined,
      });
      // let the animation breathe a moment
      await new Promise((r) => setTimeout(r, 900));
      setResult({ ticket: res.data.ticket, aiAvailable: res.data.aiAvailable });
      setPhase('done');
      toast.success('Ticket created successfully.');
    } catch (err) {
      setPhase('form');
      toast.error(errorMessage(err, 'Could not create the ticket'));
    } finally {
      timers.current.forEach(clearTimeout);
    }
  }

  if (phase === 'analyzing') {
    return (
      <div className="mx-auto max-w-lg py-10">
        <Card className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/10">
            <BrainCircuit className="h-7 w-7 animate-pulse text-gold" />
          </div>
          <h1 className="mt-4 text-lg font-semibold">AI is analyzing your ticket…</h1>
          <ul className="mx-auto mt-6 max-w-xs space-y-2 text-left">
            {STAGES.map((s, i) => (
              <li key={s} className="flex items-center gap-2 text-sm">
                {i < stage ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : i === stage ? (
                  <Loader2 className="h-4 w-4 animate-spin text-gold" />
                ) : (
                  <span className="h-4 w-4 rounded-full border border-line" />
                )}
                <span className={i <= stage ? 'text-content' : 'text-muted'}>{s}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    );
  }

  if (phase === 'done' && result) {
    const t = result.ticket;
    return (
      <div className="mx-auto max-w-lg py-10">
        <Card>
          <div className="flex items-center gap-2 text-emerald-500">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-semibold">
              {result.aiAvailable ? 'AI Triage Complete' : 'Ticket Created'}
            </span>
          </div>
          <p className="mt-1 font-mono text-sm text-gold">{t.ticketNumber}</p>
          <p className="mt-1 text-sm text-content">{t.subject}</p>

          {result.aiAvailable ? (
            <div className="mt-4 rounded-xl border border-gold/40 bg-gold/[0.04] p-4">
              <div className="flex items-center gap-2 text-xs font-medium text-gold">
                <Sparkles className="h-3.5 w-3.5" />
                AI Suggested — Human Review Required
              </div>
              <div className="mt-3 grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Category</span>
                  <span className="text-content">{t.aiCategory}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Priority</span>
                  <span className="text-content">{t.aiPriority}</span>
                </div>
                <div>
                  <span className="text-muted">Summary</span>
                  <p className="mt-1 text-content">{t.aiSummary}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted">
                A support agent will review and confirm this classification before it is
                finalized.
              </p>
            </div>
          ) : (
            <p className="mt-4 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-warning">
              AI triage was temporarily unavailable. An agent will classify this ticket
              manually — your request is safely recorded.
            </p>
          )}

          <div className="mt-6 flex gap-2">
            <Link href={`/dashboard/tickets/${t.id}`} className="flex-1">
              <Button fullWidth>
                View ticket
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button variant="secondary" onClick={() => router.push('/dashboard')}>
              Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold">Create a new ticket</h1>
        <p className="text-sm text-muted">
          Describe your issue. Our AI will triage it and an agent will follow up.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Field label="Subject" required error={errors.subject?.message}>
            {(id) => (
              <Input
                id={id}
                placeholder="e.g. Charged twice for my order"
                {...register('subject')}
              />
            )}
          </Field>

          <Field
            label="Description"
            required
            error={errors.description?.message}
            hint="Include order numbers, dates and any error messages."
          >
            {(id) => (
              <Textarea
                id={id}
                className="min-h-[160px]"
                placeholder="Explain what happened and what you would like us to do…"
                {...register('description')}
              />
            )}
          </Field>

          <Field
            label="Category"
            error={errors.category?.message}
            hint="Optional — leave blank and the AI will suggest one."
          >
            {(id) => (
              <Select id={id} defaultValue="" {...register('category')}>
                <option value="">Let AI decide</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <div className="flex items-center justify-between gap-3 pt-2">
            <Link href="/dashboard" className="text-sm text-muted hover:text-content">
              Cancel
            </Link>
            <Button type="submit" loading={isSubmitting}>
              <Sparkles className="h-4 w-4" />
              Create Ticket &amp; Analyze with AI
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
