import { useOnboardingStore, ONBOARDING_STORAGE_KEY } from '../store';
import { secureStorageAdapter } from '../../auth/supabaseClient';

describe('useOnboardingStore', () => {
  beforeEach(() => {
    secureStorageAdapter.clearMemory();
    useOnboardingStore.getState().reset();
  });

  it('acceptance check 4: proves sliders start strictly null', () => {
    const state = useOnboardingStore.getState();
    expect(state.answers.q5).toBeNull();
    expect(state.answers.q9).toBeNull();
    expect(state.deeperAnswers).toEqual({});
  });

  it('sets and autosaves answers and derives playbook', () => {
    const store = useOnboardingStore.getState();
    store.setAnswer('q1', ['Meetings', 'Speaking up']);
    store.setAnswer('q5', 4);
    store.setAnswer('q11', 'Funny');

    const updated = useOnboardingStore.getState();
    expect(updated.answers.q1).toEqual(['Meetings', 'Speaking up']);
    expect(updated.answers.q5).toBe(4);
    expect(updated.answers.q11).toBe('Funny');
    expect(updated.derivedPlaybook).not.toBeNull();
    expect(updated.derivedPlaybook?.coachTone).toBe('Funny');
  });

  it('acceptance check 2: reload resumes at the same question with the same answers', async () => {
    // 1. Simulate user completing questions 1 to 5
    const store = useOnboardingStore.getState();
    store.setCurrentStep(5);
    store.setAnswer('q1', ['Meetings']);
    store.setAnswer('q2', ['Parties']);
    store.setAnswer('q4', 'Student');
    store.setAnswer('q5', 3);

    // Persisted state payload in storage
    const rawStored = await secureStorageAdapter.getItem(ONBOARDING_STORAGE_KEY);
    expect(rawStored).not.toBeNull();
    const parsed = JSON.parse(rawStored!);
    expect(parsed.state.currentStep).toBe(5);
    expect(parsed.state.answers.q1).toEqual(['Meetings']);
    expect(parsed.state.answers.q5).toBe(3);

    // 2. Simulate fresh app reload: reset in-memory state and rehydrate from storage
    useOnboardingStore.setState({
      currentStep: parsed.state.currentStep,
      answers: parsed.state.answers,
      deeperAnswers: parsed.state.deeperAnswers,
      derivedPlaybook: parsed.state.derivedPlaybook,
      isCompleted: parsed.state.isCompleted,
      hasSeenDeeper: parsed.state.hasSeenDeeper
    });

    const resumedState = useOnboardingStore.getState();
    expect(resumedState.currentStep).toBe(5);
    expect(resumedState.answers.q1).toEqual(['Meetings']);
    expect(resumedState.answers.q2).toEqual(['Parties']);
    expect(resumedState.answers.q4).toBe('Student');
    expect(resumedState.answers.q5).toBe(3);
  });

  it('supports updating deeper profile answers and updates derived playbook', () => {
    const store = useOnboardingStore.getState();
    store.setDeeperAnswer('d1', 5);
    store.setDeeperAnswer('d3', 4);

    const updated = useOnboardingStore.getState();
    expect(updated.deeperAnswers.d1).toBe(5);
    expect(updated.deeperAnswers.d3).toBe(4);
    expect(updated.derivedPlaybook).not.toBeNull();
  });

  it('supports editing a specific derived playbook field', () => {
    const store = useOnboardingStore.getState();
    store.updateDerivedPlaybook();
    store.updatePlaybookField('coachTone', 'Straight');

    const updated = useOnboardingStore.getState();
    expect(updated.derivedPlaybook?.coachTone).toBe('Straight');
  });
});
