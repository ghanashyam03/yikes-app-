import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { GatewayEnv } from '../config/env.js';
import type { AiProvider } from '../providers/types.js';
import { callStructured } from '../structured/call-structured.js';
import { logger } from '../telemetry/logger.js';
import type { CompareResponse, RewoundTurn } from './types.js';

export const CompareSummaryOutputSchema = z.object({
  summary: z.string(),
  differences: z.array(
    z.object({
      turnIdx: z.number(),
      originalText: z.string(),
      newPathText: z.string(),
      takeaway: z.string(),
    })
  ),
  partnerShift: z.string(),
});

export async function compareAttempts(
  supabase: SupabaseClient | null | undefined,
  _userId: string,
  attemptId1: string,
  attemptId2: string,
  env?: GatewayEnv,
  provider?: AiProvider
): Promise<CompareResponse> {
  let turns1: RewoundTurn[] = [];
  let turns2: RewoundTurn[] = [];

  if (supabase) {
    try {
      const [res1, res2] = await Promise.all([
        supabase.from('turns').select('*').eq('attempt_id', attemptId1).order('idx', { ascending: true }),
        supabase.from('turns').select('*').eq('attempt_id', attemptId2).order('idx', { ascending: true }),
      ]);
      if (res1.data) turns1 = res1.data.map((t) => ({ id: t.id, idx: t.idx, role: t.role, text: t.text, thought: t.thought }));
      if (res2.data) turns2 = res2.data.map((t) => ({ id: t.id, idx: t.idx, role: t.role, text: t.text, thought: t.thought }));
    } catch {
      // Fall through
    }
  }

  // Fallback differences computation
  const differences: Array<{ turnIdx: number; originalText: string; newPathText: string; takeaway: string }> = [];
  const maxIdx = Math.max(turns1.length, turns2.length);

  for (let i = 0; i < maxIdx; i++) {
    const t1 = turns1[i];
    const t2 = turns2[i];
    if (t1 && t2 && t1.text !== t2.text && t1.role === 'user') {
      differences.push({
        turnIdx: i,
        originalText: t1.text,
        newPathText: t2.text,
        takeaway: 'Taking a more open approach led to a warmer response.',
      });
    }
  }

  const defaultSummary: CompareResponse = {
    attemptId1,
    attemptId2,
    summary:
      differences.length > 0
        ? `In your retried path, changing turn ${differences[0]!.turnIdx + 1} gave the exchange a noticeably calmer rhythm.`
        : 'Both paths tested different phrasing while maintaining conversational momentum.',
    differences:
      differences.length > 0
        ? differences
        : [
            {
              turnIdx: 0,
              originalText: turns1[0]?.text ?? 'Initial exchange',
              newPathText: turns2[0]?.text ?? 'Retried exchange',
              takeaway: 'Testing alternate lines builds real-time flexibility.',
            },
          ],
    partnerShift: 'The partner responded with more openness and shared context on the second path.',
  };

  if (!env || !provider) {
    return defaultSummary;
  }

  try {
    const prompt = [
      {
        role: 'system' as const,
        content: `You are the Coach in yikes!. Compare these two conversation paths from a practice session.
Path 1 is the original; Path 2 is the retry from a rewind point.
Highlight what shifted in tone, how the partner reacted differently, and one key takeaway.
Rules: Warm, encouraging, strictly no shaming, no personality labels, no clinical words.
Return JSON matching the schema.`,
      },
      {
        role: 'user' as const,
        content: `Path 1 turns:
${turns1.map((t) => `Turn ${t.idx + 1} (${t.role}): "${t.text}"`).join('\n')}

Path 2 turns:
${turns2.map((t) => `Turn ${t.idx + 1} (${t.role}): "${t.text}"`).join('\n')}`,
      },
    ];

    const result = await callStructured({
      job: 'coach',
      messages: prompt,
      schema: CompareSummaryOutputSchema,
      provider,
      env,
      priority: 'background',
    });

    return {
      attemptId1,
      attemptId2,
      summary: result.summary,
      differences: result.differences,
      partnerShift: result.partnerShift,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn({ errorMsg: msg }, 'Comparative model call failed; returning deterministic summary');
    return defaultSummary;
  }
}
