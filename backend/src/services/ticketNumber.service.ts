import { Counter } from '../models/Counter';

/**
 * Returns the next unique, human-readable ticket number, e.g. `SF-2026-000042`.
 * Uses an atomic `$inc` upsert on a per-year counter document so concurrent
 * ticket creation never produces a duplicate.
 */
export async function nextTicketNumber(date = new Date()): Promise<string> {
  const year = date.getFullYear();
  const doc = await Counter.findByIdAndUpdate(
    `ticket-${year}`,
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  ).lean();
  const seq = doc?.seq ?? 1;
  return `SF-${year}-${String(seq).padStart(6, '0')}`;
}
