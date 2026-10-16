import { render, fireEvent, act } from '@testing-library/react-native';
import { ThemeProvider } from '../../../theme/ThemeProvider';
import SessionTryScreen from '../../../../app/session/[id]/try';
import FreeChatScreen from '../../../../app/tools/free-chat';
import * as partnerApi from '../partnerApi';

// Mock expo-router
const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: mockBack,
  }),
  useLocalSearchParams: () => ({ id: 'session_123' }),
}));

describe('Try Chat Screen Suite (T-12)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  const mockOpeningResponse: partnerApi.PartnerStartResponse = {
    attemptId: 'att_test_1',
    openingTurn: {
      role: 'partner',
      text: 'Hey! Thanks for dropping by. Did you want to review the sprint tasks?',
    },
    initialMood: {
      engagement: 0.5,
      rapport: 0.5,
      patience: 0.7,
      exitPressure: 0.2,
    },
    mode: 'try',
    turnCap: 6,
  };

  const renderTryScreen = () => {
    return render(
      <ThemeProvider initialPreference="light">
        <SessionTryScreen />
      </ThemeProvider>
    );
  };

  it('1. Normal chat flow: mounts, displays partner opening message, avatar, and Turn 1 of 6 pill', async () => {
    jest.spyOn(partnerApi, 'startPartnerAttempt').mockResolvedValueOnce(mockOpeningResponse);
    jest.spyOn(partnerApi, 'fetchSuggestedReplies').mockResolvedValueOnce([
      'Yes, I want to talk about workload.',
      'Can we shift the deadline?',
      'Let me pull up the ticket.',
    ]);

    const { getByTestId, findByText } = renderTryScreen();

    // Check opening message
    expect(await findByText('Hey! Thanks for dropping by. Did you want to review the sprint tasks?')).toBeTruthy();
    // Check avatar
    expect(getByTestId('partner-avatar')).toBeTruthy();
    // Check turn pill
    expect(getByTestId('turn-counter-pill')).toBeTruthy();
    expect(await findByText('Turn 1 of 6')).toBeTruthy();
    // Check suggestions chips
    expect(await findByText('Yes, I want to talk about workload.')).toBeTruthy();
  });

  it('2. Suggestion chip drops into input field on press and can be sent', async () => {
    jest.spyOn(partnerApi, 'startPartnerAttempt').mockResolvedValueOnce(mockOpeningResponse);
    jest.spyOn(partnerApi, 'fetchSuggestedReplies').mockResolvedValueOnce([
      'Yes, I want to talk about workload.',
      'Can we shift the deadline?',
      'Let me pull up the ticket.',
    ]);
    jest.spyOn(partnerApi, 'sendPartnerTurn').mockResolvedValueOnce({
      reply: 'Sure, what parts are looking overloaded?',
      mood: { engagement: 0.55, rapport: 0.55, patience: 0.7, exitPressure: 0.2 },
      wantsToEnd: false,
      cue: 0.6,
    });

    const { getByTestId, findByText, findAllByText } = renderTryScreen();
    const chipText = await findByText('Yes, I want to talk about workload.');

    // Tap suggestion chip
    fireEvent.press(chipText);

    // Text input now contains suggestion
    const input = getByTestId('chat-text-input');
    expect(input.props.value).toBe('Yes, I want to talk about workload.');

    // Send message
    const sendButton = getByTestId('send-message-button');
    await act(async () => {
      fireEvent.press(sendButton);
    });

    // Check that user message bubble appears (and suggestion chip exists)
    const matches = await findAllByText('Yes, I want to talk about workload.');
    expect(matches.length).toBeGreaterThanOrEqual(1);
    // Check partner reply arrives
    expect(await findByText('Sure, what parts are looking overloaded?')).toBeTruthy();
    // Counter updates to Turn 2 of 6
    expect(await findByText('Turn 2 of 6')).toBeTruthy();
  });

  it('3. Typing indicator displays while awaiting response', async () => {
    jest.spyOn(partnerApi, 'startPartnerAttempt').mockResolvedValueOnce(mockOpeningResponse);

    let resolveTurnPromise: (value: partnerApi.PartnerTurnResponse) => void;
    const turnPromise = new Promise<partnerApi.PartnerTurnResponse>((resolve) => {
      resolveTurnPromise = resolve;
    });
    jest.spyOn(partnerApi, 'sendPartnerTurn').mockReturnValueOnce(turnPromise);

    const { getByTestId, findByText } = renderTryScreen();
    await findByText('Turn 1 of 6');

    // Type and send
    const input = getByTestId('chat-text-input');
    fireEvent.changeText(input, 'We need more time.');
    const sendBtn = getByTestId('send-message-button');

    await act(async () => {
      fireEvent.press(sendBtn);
    });

    // Typing dots should now be visible
    expect(getByTestId('typing-container')).toBeTruthy();

    // Resolve the turn
    await act(async () => {
      resolveTurnPromise!({
        reply: 'Understood.',
        mood: { engagement: 0.5, rapport: 0.5, patience: 0.6, exitPressure: 0.3 },
        wantsToEnd: false,
        cue: 0.5,
      });
    });

    // Typing dots disappear
    expect(await findByText('Understood.')).toBeTruthy();
  });

  it('4. Slow reply 8s switches to calm "Maya is thinking" state', async () => {
    jest.useFakeTimers();
    jest.spyOn(partnerApi, 'startPartnerAttempt').mockResolvedValueOnce(mockOpeningResponse);

    // Hanging promise that simulates slow network/model
    const pendingPromise = new Promise<partnerApi.PartnerTurnResponse>(() => {});
    jest.spyOn(partnerApi, 'sendPartnerTurn').mockReturnValueOnce(pendingPromise);

    const { getByTestId, queryByTestId } = renderTryScreen();

    // Advance to resolve startAttempt
    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    const input = getByTestId('chat-text-input');
    fireEvent.changeText(input, 'Take your time to think.');
    const sendBtn = getByTestId('send-message-button');

    await act(async () => {
      fireEvent.press(sendBtn);
    });

    expect(getByTestId('typing-container')).toBeTruthy();
    expect(queryByTestId('thinking-state-text')).toBeNull();

    // Advance 8 seconds
    act(() => {
      jest.advanceTimersByTime(8100);
    });

    // Now calm thinking state text should be visible!
    expect(getByTestId('thinking-state-text')).toBeTruthy();
  });

  it('5. 20s idle cue fades in when user is inactive', async () => {
    jest.useFakeTimers();
    jest.spyOn(partnerApi, 'startPartnerAttempt').mockResolvedValueOnce(mockOpeningResponse);

    const { getByTestId, queryByTestId } = renderTryScreen();

    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    // Before 20s: no idle cue
    expect(queryByTestId('idle-cue-banner')).toBeNull();

    // Advance past 20 seconds
    act(() => {
      jest.advanceTimersByTime(20500);
    });

    // Faint "Take your time" banner appears
    expect(getByTestId('idle-cue-banner')).toBeTruthy();
  });

  it('6. Offline state renders offline notice card', async () => {
    // startPartnerAttempt rejects with network error
    jest.spyOn(partnerApi, 'startPartnerAttempt').mockRejectedValueOnce(new Error('Network request failed'));

    const { findByTestId } = renderTryScreen();

    expect(await findByTestId('offline-card')).toBeTruthy();
  });

  it('7. Daily cap reached state renders cap notice card', async () => {
    jest.spyOn(partnerApi, 'startPartnerAttempt').mockRejectedValueOnce(
      new partnerApi.PartnerApiError('Daily turn limit reached', 429, 'CAP_REACHED')
    );

    const { findByTestId } = renderTryScreen();

    expect(await findByTestId('cap-reached-card')).toBeTruthy();
  });

  it('8. Free Chat screen mounts and renders free chat mode with no turn limit', async () => {
    jest.spyOn(partnerApi, 'startPartnerAttempt').mockResolvedValueOnce({
      ...mockOpeningResponse,
      mode: 'free',
      turnCap: 0,
      openingTurn: { role: 'partner', text: 'Hey there! How has your week been?' },
    });

    const { getByTestId, findByText } = render(
      <ThemeProvider initialPreference="light">
        <FreeChatScreen />
      </ThemeProvider>
    );

    expect(await findByText('Hey there! How has your week been?')).toBeTruthy();
    expect(getByTestId('free-turn-pill')).toBeTruthy();
    expect(await findByText('Turn 1')).toBeTruthy();
  });
});
