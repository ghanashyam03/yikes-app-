import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ThemeProvider } from '../../../theme/ThemeProvider';
import SessionCoachScreen from '../../../../app/session/[id]/coach';
import SessionInnerVoiceScreen from '../../../../app/session/[id]/inner-voice';
import { coachCopy } from '../../../copy/coach';
import * as coachApi from '../coachApi';

// Mock expo-router
const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: mockBack,
  }),
  useLocalSearchParams: () => ({ id: 'session_123', attemptId: 'att_test_123' }),
}));

describe('T-13 Acceptance Check 5: Coach & Inner Voice UI States', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  const mockFeedbackResponse: coachApi.CoachFeedbackResponse = {
    id: 'fb_test_123',
    attemptId: 'att_test_123',
    model: 'test-coach',
    promptVersion: 'v1',
    verified: true,
    createdAt: new Date().toISOString(),
    feedback: {
      intro: 'Here is what showed up in your conversation.',
      worked: [
        {
          quote: 'Good morning! Quick question for you.',
          why: 'Clear, low-pressure opener.',
        },
      ],
      pivot: {
        quote: 'Just wondered if you like pizza.',
        whatHappened: 'The topic shifted abruptly.',
        rewrite: 'Could you take a quick look at row 14 when you have a second?',
      },
      tryNext: 'Stay with the topic you opened before pivoting.',
      skillVotes: [
        {
          skill: 'Starting a chat',
          stage: 'practicing',
          reason: 'Clear opener followed by topic shift.',
        },
      ],
      partnerArc: 'Maya was ready to help but got slightly confused.',
    },
  };

  const mockThoughtsResponse: coachApi.ThoughtsResponse = {
    attemptId: 'att_test_123',
    thoughts: [
      {
        turnIndex: 0,
        role: 'partner',
        thought: 'Wonder who this is.',
      },
      {
        turnIndex: 2,
        role: 'partner',
        thought: 'Hope it is quick.',
      },
    ],
  };

  const renderCoachScreen = () => {
    return render(
      <ThemeProvider initialPreference="light">
        <SessionCoachScreen />
      </ThemeProvider>
    );
  };

  const renderInnerVoiceScreen = () => {
    return render(
      <ThemeProvider initialPreference="light">
        <SessionInnerVoiceScreen />
      </ThemeProvider>
    );
  };

  it('1. Loading skeleton: mounts and displays loading skeleton while feedback is in flight', async () => {
    jest.spyOn(coachApi, 'fetchCoachFeedback').mockReturnValueOnce(new Promise(() => {}));

    const { getByTestId, queryByTestId } = renderCoachScreen();

    expect(getByTestId('coach-loading-skeleton')).toBeTruthy();
    expect(queryByTestId('tile-what-worked')).toBeNull();
  });

  it('2. Progressive reveal: reveals What worked, Pivot moment, and Try this next time tiles', async () => {
    jest.spyOn(coachApi, 'fetchCoachFeedback').mockResolvedValueOnce(mockFeedbackResponse);

    const { findByTestId, findByText, getByText } = renderCoachScreen();

    expect(await findByTestId('session-coach-screen')).toBeTruthy();
    expect(getByText('Coach feedback')).toBeTruthy();

    expect(await findByTestId('tile-what-worked')).toBeTruthy();
    expect(await findByTestId('tile-pivot-moment', {}, { timeout: 3000 })).toBeTruthy();
    expect(await findByTestId('tile-try-next', {}, { timeout: 3000 })).toBeTruthy();

    expect(await findByText('"Good morning! Quick question for you."')).toBeTruthy();
    expect(getByText('Clear, low-pressure opener.')).toBeTruthy();
  });

  it('3. Error state: displays calm error card with retry button when API fails', async () => {
    jest
      .spyOn(coachApi, 'fetchCoachFeedback')
      .mockRejectedValueOnce(new Error('Network request failed'));

    const { findByTestId, getByText } = renderCoachScreen();

    expect(await findByTestId('coach-error-state')).toBeTruthy();
    expect(getByText('Coach temporarily quiet')).toBeTruthy();
    expect(findByTestId('coach-retry-button')).toBeTruthy();
  });

  it('4. AI-down fallback: renders authored rubric fallback seamlessly', async () => {
    const fallbackResponse: coachApi.CoachFeedbackResponse = {
      ...mockFeedbackResponse,
      verified: false,
      feedback: {
        intro: 'You stepped into the practice conversation.',
        worked: [
          {
            quote: '...',
            why: 'You offered an easy, low-pressure opener tied to the shared environment.',
          },
        ],
        pivot: {
          quote: '...',
          whatHappened: 'The opening felt abrupt.',
          rewrite: 'Take a calm breath and ask an open question tied to their last sentence.',
        },
        tryNext: 'Keep practicing starting a chat by focusing on leaving space for their reply.',
        skillVotes: [
          {
            skill: 'Starting a chat',
            stage: 'starting',
            reason: 'Baseline practice attempt evaluated against authored rubric.',
          },
        ],
        partnerArc: 'The partner stayed engaged and responded to each move in the dialogue.',
      },
    };

    jest.spyOn(coachApi, 'fetchCoachFeedback').mockResolvedValueOnce(fallbackResponse);

    const { findByTestId, findByText } = renderCoachScreen();

    expect(await findByTestId('tile-what-worked')).toBeTruthy();
    expect(
      await findByText('You offered an easy, low-pressure opener tied to the shared environment.')
    ).toBeTruthy();
    expect(
      await findByText(
        'Keep practicing starting a chat by focusing on leaving space for their reply.',
        {},
        { timeout: 3000 }
      )
    ).toBeTruthy();
  });

  it('5. Fairness rating: sends thumbs feedback to ai_feedback endpoint', async () => {
    jest.spyOn(coachApi, 'fetchCoachFeedback').mockResolvedValueOnce(mockFeedbackResponse);
    const feedbackSpy = jest.spyOn(coachApi, 'submitAiFeedback').mockResolvedValueOnce();

    const { findByTestId } = renderCoachScreen();

    const thumbsUp = await findByTestId('thumbs-up-button');
    fireEvent.press(thumbsUp);

    await waitFor(() => {
      expect(feedbackSpy).toHaveBeenCalledWith(null, 'coach', 'fb_test_123', 1);
    });
  });

  it('6. Try it action: rewinds and routes with prefilled rewrite text', async () => {
    jest.spyOn(coachApi, 'fetchCoachFeedback').mockResolvedValueOnce(mockFeedbackResponse);
    jest.spyOn(coachApi, 'rewindAttempt').mockResolvedValueOnce({
      newAttemptId: 'att_rewound_456',
      parentAttemptId: 'att_test_123',
      turns: [],
    });

    const { findByLabelText } = renderCoachScreen();

    const tryItButton = await findByLabelText(coachCopy.tiles.pivot.tryItA11y, {}, { timeout: 3000 });
    fireEvent.press(tryItButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/session/session_123/try',
        params: {
          attemptId: 'att_rewound_456',
          prefillText: 'Could you take a quick look at row 14 when you have a second?',
        },
      });
    });
  });

  it('7. Inner voice screen: displays scrubber, turns, and thought bubbles', async () => {
    jest.spyOn(coachApi, 'fetchAttemptThoughts').mockResolvedValueOnce(mockThoughtsResponse);

    const { findByTestId, findByLabelText, getByText } = renderInnerVoiceScreen();

    expect(await findByTestId('session-inner-voice-screen')).toBeTruthy();
    expect(getByText("Maya's Inner Voice")).toBeTruthy();

    expect(await findByTestId('active-thought-bubble')).toBeTruthy();
    expect(getByText('Wonder who this is.')).toBeTruthy();

    expect(await findByTestId('turn-scrubber-pill-0')).toBeTruthy();

    const doneButton = await findByLabelText(coachCopy.innerVoice.doneA11y);
    fireEvent.press(doneButton);
    expect(mockBack).toHaveBeenCalled();
  });
});
