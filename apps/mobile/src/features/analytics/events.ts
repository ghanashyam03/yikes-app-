import { z } from 'zod';

/**
 * Strict schema dictionary for privacy-first analytics in yikes!
 *
 * Guarantees:
 * 1. Zero free-text properties permitted under any circumstance.
 * 2. All string properties must be explicit finite enums or strict UUIDs.
 * 3. Every schema uses .strict() to reject unapproved property keys.
 */

// Banned sensitive free-text property names
export const FORBIDDEN_PROPERTY_NAMES = [
  'text',
  'message',
  'messages',
  'content',
  'prompt',
  'prompts',
  'transcript',
  'transcripts',
  'thought',
  'thoughts',
  'reply',
  'replies',
  'quote',
  'quotes',
  'body',
  'note',
  'notes',
  'description',
  'user_input',
] as const;

export const ScenarioIdEnum = z.enum([
  'smalltalk_coffee',
  'meeting_standup',
  'boundary_setting',
  'elevator_pitch',
  'lunch_invite',
  'saying_no',
  'custom_scenario',
]);

export const SessionModeEnum = z.enum(['try', 'warmup', 'rehearsal', 'free']);

export const StepTypeEnum = z.enum(['read', 'watch', 'warmup', 'try', 'debrief']);

export const MomentCategoryEnum = z.enum([
  'meeting',
  'social',
  'confrontation',
  'family',
  'dating',
  'work',
  'general',
]);

export const CheckinTypeEnum = z.enum(['energy', 'micro_rep']);

export const PlacementEnum = z.enum([
  'session_gate',
  'settings',
  'reply_helper_limit',
  'letter',
]);

export const PlanEnum = z.enum(['free', 'plus']);

export const PackageIdEnum = z.enum(['monthly', 'annual']);

export const ReplyHelperModeEnum = z.enum(['paste', 'screenshot']);

export const ConsentKindEnum = z.enum(['analytics', 'improve_ai', 'marketing']);

export const EVENT_SCHEMAS = {
  session_started: z
    .object({
      session_id: z.string().uuid(),
      scenario_id: ScenarioIdEnum,
      mode: SessionModeEnum,
    })
    .strict(),

  step_completed: z
    .object({
      session_id: z.string().uuid(),
      step_index: z.number().int().min(0).max(10),
      step_type: StepTypeEnum,
      duration_seconds: z.number().min(0),
    })
    .strict(),

  session_completed: z
    .object({
      session_id: z.string().uuid(),
      scenario_id: ScenarioIdEnum,
      turns_count: z.number().int().min(0),
      duration_seconds: z.number().min(0),
      completed_all_steps: z.boolean(),
    })
    .strict(),

  moment_added: z
    .object({
      category: MomentCategoryEnum,
      has_reminder: z.boolean(),
    })
    .strict(),

  prep_generated: z
    .object({
      category: MomentCategoryEnum,
      is_custom: z.boolean(),
    })
    .strict(),

  checkin_done: z
    .object({
      checkin_type: CheckinTypeEnum,
      energy_level: z.number().int().min(1).max(5).optional(),
      gap_forecast: z.number().int().min(1).max(5).optional(),
      gap_actual: z.number().int().min(1).max(5).optional(),
      gap_delta: z.number().optional(),
    })
    .strict(),

  paywall_viewed: z
    .object({
      placement: PlacementEnum,
      current_plan: PlanEnum,
    })
    .strict(),

  purchase_started: z
    .object({
      package_id: PackageIdEnum,
      placement: PlacementEnum,
    })
    .strict(),

  purchase_completed: z
    .object({
      package_id: PackageIdEnum,
      is_restored: z.boolean(),
    })
    .strict(),

  ladder_rung_added: z
    .object({
      rung_index: z.number().int().min(0),
      is_ai_suggested: z.boolean(),
    })
    .strict(),

  ladder_rung_completed: z
    .object({
      rung_index: z.number().int().min(0),
    })
    .strict(),

  weekly_letter_viewed: z
    .object({
      letter_id: z.string().uuid(),
      is_plus: z.boolean(),
    })
    .strict(),

  reply_helper_used: z
    .object({
      mode: ReplyHelperModeEnum,
      replies_count: z.number().int().min(1).max(3),
    })
    .strict(),

  consent_updated: z
    .object({
      kind: ConsentKindEnum,
      granted: z.boolean(),
    })
    .strict(),

  privacy_data_exported: z.object({}).strict().optional(),
  privacy_text_deleted: z.object({}).strict().optional(),
  privacy_account_deleted: z.object({}).strict().optional(),

  app_opened: z
    .object({
      is_cold_start: z.boolean(),
    })
    .strict(),
} as const;

export type AllowedEventName = keyof typeof EVENT_SCHEMAS;

export const ALLOWED_EVENT_NAMES = Object.keys(EVENT_SCHEMAS) as AllowedEventName[];

export type EventPropertiesMap = {
  [K in AllowedEventName]: z.infer<(typeof EVENT_SCHEMAS)[K]>;
};

export class AnalyticsValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AnalyticsValidationError';
  }
}

/**
 * Validates an event name and its properties against the strict schema.
 * Rejects unknown event names, unapproved properties, and any free-text fields.
 */
export function validateEvent<E extends AllowedEventName>(
  event: string,
  properties?: unknown
): { event: E; properties: EventPropertiesMap[E] } {
  if (!ALLOWED_EVENT_NAMES.includes(event as AllowedEventName)) {
    throw new AnalyticsValidationError(
      `Analytics validation error: Unknown event '${event}'. Only approved events in docs/analytics-events.md are allowed.`
    );
  }

  const typedEvent = event as E;
  const schema = EVENT_SCHEMAS[typedEvent];

  // Defensive check for any banned free-text key
  if (properties && typeof properties === 'object') {
    for (const key of Object.keys(properties)) {
      if (FORBIDDEN_PROPERTY_NAMES.includes(key.toLowerCase() as (typeof FORBIDDEN_PROPERTY_NAMES)[number])) {
        throw new AnalyticsValidationError(
          `Analytics validation error: Banned free-text property '${key}' is strictly forbidden.`
        );
      }
    }
  }

  const parseResult = schema.safeParse(properties ?? {});
  if (!parseResult.success) {
    const errorDetails = parseResult.error.errors
      .map((e) => `${e.path.join('.') || 'root'}: ${e.message}`)
      .join(', ');
    throw new AnalyticsValidationError(
      `Analytics validation error for '${event}': ${errorDetails}`
    );
  }

  return {
    event: typedEvent,
    properties: parseResult.data as EventPropertiesMap[E],
  };
}
