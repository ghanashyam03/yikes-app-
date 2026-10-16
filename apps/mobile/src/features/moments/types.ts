export interface PrepCard {
  openerOptions: string[];
  questions: [string, string];
  exitLine: string;
  quietBreak: string;
  recoveryPlan: string;
}

export function validatePrepCard(card: unknown): card is PrepCard {
  if (!card || typeof card !== 'object') return false;
  const c = card as Partial<PrepCard>;
  return (
    Array.isArray(c.openerOptions) &&
    c.openerOptions.length >= 2 &&
    c.openerOptions.every((o) => typeof o === 'string' && o.length > 0) &&
    Array.isArray(c.questions) &&
    c.questions.length === 2 &&
    typeof c.questions[0] === 'string' &&
    c.questions[0].length > 0 &&
    typeof c.questions[1] === 'string' &&
    c.questions[1].length > 0 &&
    typeof c.exitLine === 'string' &&
    c.exitLine.length > 0 &&
    typeof c.quietBreak === 'string' &&
    c.quietBreak.length > 0 &&
    typeof c.recoveryPlan === 'string' &&
    c.recoveryPlan.length > 0
  );
}

export const prepCardOutputSchema = {
  safeParse: (data: unknown) => {
    const valid = validatePrepCard(data);
    return valid
      ? { success: true as const, data: data as PrepCard }
      : { success: false as const, error: new Error('Invalid PrepCard schema') };
  },
  parse: (data: unknown): PrepCard => {
    if (!validatePrepCard(data)) {
      throw new Error('Invalid PrepCard schema');
    }
    return data;
  },
};

export type MomentType =
  | 'meeting'
  | 'party'
  | 'call'
  | 'networking'
  | 'one-to-one'
  | 'other';

export type MomentStatus = 'upcoming' | 'past' | 'completed';

export interface Moment {
  id: string;
  userId?: string | undefined;
  title: string;
  description?: string | undefined;
  eventDate?: string | undefined;
  prepPayload?: PrepCard | null | undefined;
  status: MomentStatus;
  createdAt?: string | undefined;
  formality?: number | undefined; // 0 to 10
  momentType?: MomentType | undefined;
  attendees?: string | undefined;
  successVision?: string | undefined;
  remindEveningBefore?: boolean | undefined;
  energyLevel?: number | undefined;
  debriefSummary?: string | undefined;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startDate: string;
  endDate?: string | undefined;
  location?: string | undefined;
  selected?: boolean | undefined;
}

export interface PrepRequestPayload {
  momentId?: string | undefined;
  title: string;
  description?: string | undefined;
  formality?: number | string | undefined;
  eventDate?: string | undefined;
  context?: string | undefined;
  playbook?: {
    communicationStyle?: string | undefined;
    scenarioWorld?: string | undefined;
    pace?: string | undefined;
    coachTone?: 'gentle' | 'straight' | 'funny' | undefined;
  } | undefined;
}

export interface PrepResponseSuccess {
  ok: true;
  openerOptions: string[];
  questions: [string, string];
  exitLine: string;
  quietBreak: string;
  recoveryPlan: string;
}

export interface PrepResponseBlocked {
  ok: false;
  reason: string;
  category?: string | undefined;
}

export type PrepApiResponse = PrepResponseSuccess | PrepResponseBlocked;
