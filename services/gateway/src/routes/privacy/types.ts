import { z } from 'zod';

export const ExportRequestSchema = z.object({}).optional();

export const DeleteTextRequestSchema = z.object({
  confirm: z.boolean().default(true),
});

export const DeleteAccountRequestSchema = z.object({
  otpToken: z.string().min(6, 'Verification code must be 6 digits'),
  target: z.string().optional(),
  type: z.enum(['email', 'phone']).default('email').optional(),
});

export const UpdateConsentRequestSchema = z.object({
  kind: z.enum(['required', 'analytics', 'improve_ai', 'marketing']),
  granted: z.boolean(),
});

export interface ExportResponse {
  downloadUrl: string;
  expiresAt: string;
  exportId: string;
}

export interface DeleteTextResponse {
  ok: boolean;
  deletedTurns: number;
  clearedDebriefs: number;
  clearedJournals: number;
  message: string;
}

export interface DeleteAccountResponse {
  ok: boolean;
  message: string;
}

export interface PurgeResponse {
  ok: boolean;
  purgedCount: number;
}
