import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '../../../theme/ThemeProvider';
import DebriefScreen from '../../../../app/debrief/[id]';
import { checkinsCopy } from '../../../copy/checkins';
import { useDebrief } from '../useDebrief';
import * as debriefApi from '../debriefApi';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    replace: mockReplace,
    canGoBack: () => true,
  }),
  useLocalSearchParams: () => ({ id: 'moment_mock_debrief_1' }),
}));

describe('Acceptance Checks 2 & 3: Screen C7 Debrief Chat & Safety Routing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useDebrief.getState().resetDebrief();
  });

  afterEach(() => {
    useDebrief.getState().resetDebrief();
  });

  it('renders Debrief chat with Lilac aesthetic, interviewer message, and suggested chips', async () => {
    jest.spyOn(debriefApi, 'apiStartDebrief').mockResolvedValue({
      ok: true,
      debriefId: 'debrief_123',
      questions: [
        'How did the opening few minutes feel?',
        'Was there a moment your energy felt lower?',
      ],
    });

    const { getByTestId, getByText } = render(
      <ThemeProvider initialPreference="light">
        <DebriefScreen />
      </ThemeProvider>
    );

    expect(getByTestId('debrief-screen')).toBeTruthy();
    expect(getByText(checkinsCopy.debrief.title)).toBeTruthy();
    expect(getByText(checkinsCopy.debrief.aestheticBadge)).toBeTruthy();

    await waitFor(() => {
      expect(getByText('How did the opening few minutes feel?')).toBeTruthy();
    });

    // Verify chips and input
    expect(getByTestId('debrief-suggested-chips')).toBeTruthy();
    expect(getByTestId('debrief-input-field')).toBeTruthy();
    expect(getByTestId('debrief-send-button')).toBeTruthy();
  });

  it('completes conversation and displays Takeaway card with editable core essence', async () => {
    jest.spyOn(debriefApi, 'apiStartDebrief').mockResolvedValue({
      ok: true,
      debriefId: 'debrief_123',
      questions: ['How did the opening few minutes feel?'],
    });

    jest.spyOn(debriefApi, 'apiAnswerDebrief').mockResolvedValue({
      crisis: false,
      done: true,
    });

    jest.spyOn(debriefApi, 'apiFinishDebrief').mockResolvedValue({
      ok: true,
      takeaway: {
        headline: 'You found an easy shared hook early on.',
        coreEssence: 'A simple curiosity question did the heavy lifting.',
        quoteContext: 'Next time, let their answer lead to one natural follow-up.',
      },
    });

    const { getByTestId, getByText } = render(
      <ThemeProvider initialPreference="light">
        <DebriefScreen />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(getByText('How did the opening few minutes feel?')).toBeTruthy();
    });

    const input = getByTestId('debrief-input-field');
    fireEvent.changeText(input, 'I felt great once we started talking about books.');

    const sendBtn = getByText(checkinsCopy.debrief.sendButton);
    fireEvent.press(sendBtn);

    // Wait for Takeaway card
    await waitFor(() => {
      expect(getByTestId('debrief-takeaway-card')).toBeTruthy();
    });

    expect(getByText('You found an easy shared hook early on.')).toBeTruthy();

    // Verify core essence is editable
    const essenceInput = getByTestId('takeaway-core-essence-input');
    expect(essenceInput.props.value).toBe(
      'A simple curiosity question did the heavy lifting.'
    );

    fireEvent.changeText(essenceInput, 'Curiosity questions broke the ice effortlessly.');
    expect(useDebrief.getState().takeaway?.coreEssence).toBe(
      'Curiosity questions broke the ice effortlessly.'
    );

    // Verify Save to Journal and Discard buttons
    expect(getByTestId('debrief-save-journal-btn')).toBeTruthy();
    expect(getByTestId('debrief-discard-btn')).toBeTruthy();
  });

  it('CRITICAL ACCEPTANCE CHECK 3: Crisis phrase in debrief answer routes to /support with NO AI text', async () => {
    jest.spyOn(debriefApi, 'apiStartDebrief').mockResolvedValue({
      ok: true,
      debriefId: 'debrief_crisis_123',
      questions: ['How did the meeting go?'],
    });

    jest.spyOn(debriefApi, 'apiAnswerDebrief').mockResolvedValue({
      crisis: true,
    });

    const { getByTestId, getByText } = render(
      <ThemeProvider initialPreference="light">
        <DebriefScreen />
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(getByText('How did the meeting go?')).toBeTruthy();
    });

    const input = getByTestId('debrief-input-field');
    fireEvent.changeText(input, 'I want to kill myself, I cannot go on');

    const sendBtn = getByText(checkinsCopy.debrief.sendButton);
    fireEvent.press(sendBtn);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/support');
    });

    // Ensure state marked isCrisis and no AI text was added to messages
    const state = useDebrief.getState();
    expect(state.isCrisis).toBe(true);
    // Messages should only have initial question and user text, NO AI reply text!
    const aiRepliesAfterCrisis = state.messages.filter(
      (m, idx) => idx > 1 && m.role === 'assistant'
    );
    expect(aiRepliesAfterCrisis).toHaveLength(0);
  });
});
