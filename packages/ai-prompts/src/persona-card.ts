import { z } from 'zod';

export const PersonaCardSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.string().min(1),
  background: z.string().min(1),
  demeanor: z.string().min(1),
  speakingStyle: z.string().min(1),
  topicsEnjoyed: z.array(z.string().min(1)),
  topicsAvoided: z.array(z.string().min(1)),
  hiddenTendencies: z.array(z.string().min(1)),
  fallbackLines: z.array(z.string().min(1)),
  baseMood: z
    .object({
      engagement: z.number().min(0).max(1),
      rapport: z.number().min(0).max(1),
      patience: z.number().min(0).max(1),
      exitPressure: z.number().min(0).max(1),
    })
    .optional(),
});

export type PersonaCard = z.infer<typeof PersonaCardSchema>;
