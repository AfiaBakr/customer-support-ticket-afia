import { z } from 'zod';
import { CATEGORIES, PRIORITIES } from '../constants';

/**
 * Contract every AI triage result must satisfy before it is stored.
 * Even the local heuristic engine is validated against this schema so the
 * storage path is identical to a future remote-LLM provider.
 */
export const aiTriageResultSchema = z.object({
  category: z.enum(CATEGORIES),
  priority: z.enum(PRIORITIES),
  summary: z.string().trim().min(3).max(600),
});

export type AiTriageResult = z.infer<typeof aiTriageResultSchema>;
