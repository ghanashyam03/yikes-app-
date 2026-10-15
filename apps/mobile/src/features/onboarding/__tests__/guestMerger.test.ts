import { mergeOnboardingGuestData } from '../guestMerger';
import { useOnboardingStore } from '../store';
import { supabase } from '../../auth/supabaseClient';
import { executeGuestMergers, clearRegisteredMergers, registerGuestMerger } from '../../auth/guestStorage';

// Mock Supabase
jest.mock('../../auth/supabaseClient', () => {
  const original = jest.requireActual('../../auth/supabaseClient');
  return {
    ...original,
    supabase: {
      from: jest.fn().mockReturnValue({
        upsert: jest.fn().mockResolvedValue({ error: null })
      })
    }
  };
});

describe('guestMerger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useOnboardingStore.getState().reset();
  });

  it('merges guest answers and derived playbook into Supabase playbooks table', async () => {
    const store = useOnboardingStore.getState();
    store.setAnswer('q1', ['Small talk']);
    store.setAnswer('q11', 'Funny');
    store.setDeeperAnswer('d1', 4);

    const testUserId = 'test-user-uuid-123';
    await mergeOnboardingGuestData(testUserId);

    expect(supabase.from).toHaveBeenCalledWith('playbooks');
    const upsertMock = (supabase.from as jest.Mock)().upsert;
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: testUserId,
        version: 1,
        answers: expect.objectContaining({
          quiz: expect.objectContaining({
            q1: ['Small talk'],
            q11: 'Funny'
          }),
          deeper: { d1: 4 }
        }),
        derived: expect.objectContaining({
          coachTone: 'Funny'
        })
      }),
      { onConflict: 'user_id' }
    );
  });

  it('runs automatically when executeGuestMergers is triggered on login', async () => {
    clearRegisteredMergers();
    registerGuestMerger(mergeOnboardingGuestData);

    const testUserId = 'authenticated-user-456';
    await executeGuestMergers(testUserId);

    expect(supabase.from).toHaveBeenCalledWith('playbooks');
  });
});
