import { render, fireEvent, waitFor } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';
import ReplyHelperScreen from '../../../../app/tools/reply-helper';
import { replyCopy } from '../../../copy/reply';
import { ThemeProvider } from '../../../theme/ThemeProvider';
import { supabase } from '../../auth/supabaseClient';
import * as replyApi from '../replyApi';
import type { ReplyHelperResult } from '../types';

// Mock expo-router
const mockBack = jest.fn();
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
  }),
}));

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: {
    Images: 'images',
  },
}));

// Mock supabaseClient
jest.mock('../../auth/supabaseClient', () => {
  const insertMock = jest.fn().mockResolvedValue({ data: null, error: null });
  return {
    supabase: {
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: {
            session: {
              access_token: 'fake-token-123',
              user: { id: 'usr-reply-tester' },
            },
          },
        }),
      },
      from: jest.fn().mockReturnValue({
        insert: insertMock,
      }),
    },
  };
});

describe('T-20: Reply Helper Mobile Screen (C11)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockSuccessResult: ReplyHelperResult = {
    readings: [
      'They are pressed for time and keeping things quick.',
      'They agreed with your point and do not need extra discussion.',
    ],
    disclaimer: "I can't know what they meant",
    replies: {
      warm: 'Sounds great! Enjoy your afternoon.',
      direct: 'Got it. Moving forward with this.',
      light: 'All good. Catch you later!',
    },
  };

  const renderScreen = () =>
    render(
      <ThemeProvider initialPreference="light">
        <ReplyHelperScreen />
      </ThemeProvider>
    );

  it('renders header, segmented controls, and paste input by default', () => {
    const { getByText, getByPlaceholderText } = renderScreen();

    expect(getByText(replyCopy.header.tag)).toBeTruthy();
    expect(getByText(replyCopy.tabs.paste)).toBeTruthy();
    expect(getByText(replyCopy.tabs.screenshot)).toBeTruthy();
    expect(getByPlaceholderText(replyCopy.pasteMode.placeholder)).toBeTruthy();
  });

  it('submits pasted message and renders readings with disclaimer and 3 reply tones', async () => {
    jest.spyOn(replyApi, 'requestReplyHelper').mockResolvedValue(mockSuccessResult);

    const { getByPlaceholderText, getByText } = renderScreen();

    const input = getByPlaceholderText(replyCopy.pasteMode.placeholder);
    fireEvent.changeText(input, 'Hey, can we talk tomorrow?');

    const generateBtn = getByText(replyCopy.actions.generate);
    fireEvent.press(generateBtn);

    await waitFor(() => {
      expect(getByText(replyCopy.readings.title)).toBeTruthy();
    });

    // Readings and disclaimer
    expect(
      getByText('• They are pressed for time and keeping things quick.')
    ).toBeTruthy();
    expect(getByText("I can't know what they meant")).toBeTruthy();

    // 3 reply tones
    expect(getByText(replyCopy.replies.tones.warm.label)).toBeTruthy();
    expect(getByText(replyCopy.replies.tones.direct.label)).toBeTruthy();
    expect(getByText(replyCopy.replies.tones.light.label)).toBeTruthy();
    expect(getByText('“Sounds great! Enjoy your afternoon.”')).toBeTruthy();
  });

  it('allows inline editing of a reply suggestion', async () => {
    jest.spyOn(replyApi, 'requestReplyHelper').mockResolvedValue(mockSuccessResult);

    const { getByPlaceholderText, getByText, getAllByText } = renderScreen();

    fireEvent.changeText(
      getByPlaceholderText(replyCopy.pasteMode.placeholder),
      'Got the update'
    );
    fireEvent.press(getByText(replyCopy.actions.generate));

    await waitFor(() => {
      expect(getByText('“Sounds great! Enjoy your afternoon.”')).toBeTruthy();
    });

    // Tap Edit on warm reply
    const editButtons = getAllByText(replyCopy.replies.editAction);
    fireEvent.press(editButtons[0]!);

    // Save edit button is now shown
    expect(getByText(replyCopy.replies.saveEditAction)).toBeTruthy();
  });

  it('saves chosen reply to journal only when Save button is pressed', async () => {
    jest.spyOn(replyApi, 'requestReplyHelper').mockResolvedValue(mockSuccessResult);

    const { getByPlaceholderText, getByText } = renderScreen();

    fireEvent.changeText(
      getByPlaceholderText(replyCopy.pasteMode.placeholder),
      'Quick sync'
    );
    fireEvent.press(getByText(replyCopy.actions.generate));

    await waitFor(() => {
      expect(getByText(replyCopy.journal.saveButton)).toBeTruthy();
    });

    // Before tapping save, supabase.from('journal_entries').insert has not been called
    expect(supabase.from).not.toHaveBeenCalled();

    // Tap Save to journal
    const saveButton = getByText(replyCopy.journal.saveButton);
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('journal_entries');
      expect(getByText(replyCopy.journal.savedFeedback)).toBeTruthy();
    });
  });

  it('handles screenshot selection and shows blur names warning with explicit skip', async () => {
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: 'file:///data/screenshot.png',
          base64: 'fakeBase64Screenshot',
          width: 800,
          height: 1200,
          fileSize: 1024 * 500,
        },
      ],
    });

    const { getByText } = renderScreen();

    // Switch to screenshot tab
    fireEvent.press(getByText(replyCopy.tabs.screenshot));
    expect(getByText(replyCopy.screenshotMode.chooseButton)).toBeTruthy();
    expect(getByText(replyCopy.screenshotMode.privacyNote)).toBeTruthy();

    // Pick image
    fireEvent.press(getByText(replyCopy.screenshotMode.chooseButton));

    await waitFor(() => {
      expect(getByText(replyCopy.screenshotMode.blurWarningTitle)).toBeTruthy();
    });

    expect(getByText(replyCopy.screenshotMode.unverifiedNotice)).toBeTruthy();

    // Skip blur
    fireEvent.press(getByText(replyCopy.screenshotMode.skipBlurAction));

    // Notice is dismissed
    await waitFor(() => {
      expect(() => getByText(replyCopy.screenshotMode.blurWarningTitle)).toThrow();
    });
  });

  it('offers calm fallback to paste mode when vision model is unavailable', async () => {
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: 'file:///data/screenshot.png',
          base64: 'fakeBase64Screenshot',
          width: 800,
          height: 1200,
          fileSize: 1024 * 500,
        },
      ],
    });

    jest.spyOn(replyApi, 'requestReplyHelper').mockRejectedValue(
      new replyApi.ReplyApiError(
        'Vision extraction is unavailable right now. Please paste the message text directly.',
        503,
        'VISION_UNAVAILABLE',
        'paste'
      )
    );

    const { getByText } = renderScreen();

    fireEvent.press(getByText(replyCopy.tabs.screenshot));
    fireEvent.press(getByText(replyCopy.screenshotMode.chooseButton));

    await waitFor(() => {
      expect(getByText(replyCopy.screenshotMode.skipBlurAction)).toBeTruthy();
    });
    fireEvent.press(getByText(replyCopy.screenshotMode.skipBlurAction));

    // Press generate
    fireEvent.press(getByText(replyCopy.actions.generate));

    await waitFor(() => {
      expect(getByText(replyCopy.fallback.title)).toBeTruthy();
      expect(getByText(replyCopy.fallback.action)).toBeTruthy();
    });

    // Tap switch to paste mode
    fireEvent.press(getByText(replyCopy.fallback.action));

    // Now in paste mode
    expect(getByText(replyCopy.tabs.paste)).toBeTruthy();
  });

  it('renders cap reached card when user reaches usage limit', async () => {
    jest.spyOn(replyApi, 'requestReplyHelper').mockRejectedValue(
      new replyApi.ReplyApiError('Limit reached', 429, 'CAP_REACHED')
    );

    const { getByPlaceholderText, getByText } = renderScreen();

    fireEvent.changeText(
      getByPlaceholderText(replyCopy.pasteMode.placeholder),
      'Another question'
    );
    fireEvent.press(getByText(replyCopy.actions.generate));

    await waitFor(() => {
      expect(getByText(replyCopy.caps.title)).toBeTruthy();
      expect(getByText(replyCopy.caps.upgradeButton)).toBeTruthy();
    });
  });
});
