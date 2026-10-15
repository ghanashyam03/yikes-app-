import { registerGuestMerger } from '../auth/guestStorage';
import { supabase } from '../auth/supabaseClient';
import { useOnboardingStore } from './store';
import { derivePlaybook } from '@yikes/shared/playbook/derivePlaybook';

export async function mergeOnboardingGuestData(userId: string): Promise<void> {
  const state = useOnboardingStore.getState();
  const answers = state.answers;
  const deeperAnswers = state.deeperAnswers;
  const derived = state.derivedPlaybook ?? derivePlaybook(answers, deeperAnswers);

  const payload = {
    user_id: userId,
    version: 1,
    answers: {
      quiz: answers,
      deeper: deeperAnswers
    },
    derived: derived as unknown as Record<string, unknown>,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase.from('playbooks').upsert(payload, { onConflict: 'user_id' });
  if (error) {
    // Redacted error for data safety
    throw error;
  }
}

export function registerOnboardingGuestMerger(): () => void {
  return registerGuestMerger(mergeOnboardingGuestData);
}

// Register automatically on module load
registerOnboardingGuestMerger();
