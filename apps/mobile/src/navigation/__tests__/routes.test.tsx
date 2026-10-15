import React from 'react';
import fs from 'fs';
import path from 'path';
import { render, fireEvent } from '@testing-library/react-native';
import { navigationCopy } from '../../copy/navigation';
import { useSession } from '../../features/auth/useSession';
import { TabBar } from '../TabBar';
import { ThemeProvider } from '../../theme/ThemeProvider';

// Static route imports to ensure static typing, compilation and zero require calls
import AuthWelcome from '../../../app/(auth)/welcome';
import AuthSignIn from '../../../app/(auth)/sign-in';
import AuthCode from '../../../app/(auth)/code';
import AuthConsent from '../../../app/(auth)/consent';
import AuthAge from '../../../app/(auth)/age';

import OnboardingIntro from '../../../app/(onboarding)/intro';
import OnboardingQuizStep from '../../../app/(onboarding)/quiz/[step]';
import OnboardingDeeper from '../../../app/(onboarding)/deeper';
import OnboardingWarmup from '../../../app/(onboarding)/warmup';
import OnboardingCoachRead from '../../../app/(onboarding)/coach-read';
import OnboardingPlaybook from '../../../app/(onboarding)/playbook';

import TabToday from '../../../app/(tabs)/index';
import TabPath from '../../../app/(tabs)/path';
import TabMoments from '../../../app/(tabs)/moments';
import TabYou from '../../../app/(tabs)/you';

import PracticeModal from '../../../app/practice';
import SupportModal from '../../../app/support';
import PaywallModal from '../../../app/paywall';

import SessionIdea from '../../../app/session/[id]/idea';
import SessionWatch from '../../../app/session/[id]/watch';
import SessionRead from '../../../app/session/[id]/read';
import SessionTry from '../../../app/session/[id]/try';
import SessionCoach from '../../../app/session/[id]/coach';
import SessionInnerVoice from '../../../app/session/[id]/inner-voice';
import SessionOutThere from '../../../app/session/[id]/out-there';
import SessionComplete from '../../../app/session/[id]/complete';

import MomentsNew from '../../../app/moments/new';
import MomentsPrep from '../../../app/moments/[id]/prep';
import MomentsRehearse from '../../../app/moments/[id]/rehearse';
import MomentsPocket from '../../../app/moments/[id]/pocket';

import EnergyScreen from '../../../app/energy';
import CheckinScreen from '../../../app/checkin/[id]';
import DebriefScreen from '../../../app/debrief/[id]';

import FreeChatScreen from '../../../app/tools/free-chat';
import ReplyHelperScreen from '../../../app/tools/reply-helper';

import JournalScreen from '../../../app/journal';
import LetterScreen from '../../../app/letter/[id]';
import SkillScreen from '../../../app/skill/[id]';
import GapScreen from '../../../app/gap';
import BatteryScreen from '../../../app/battery';
import LadderScreen from '../../../app/ladder';

import SettingsIndex from '../../../app/settings/index';
import SettingsNotifications from '../../../app/settings/notifications';
import SettingsPrivacy from '../../../app/settings/privacy';
import SettingsSubscription from '../../../app/settings/subscription';
import SettingsHelp from '../../../app/settings/help';
import SettingsAboutAi from '../../../app/settings/about-ai';

import RootLayout from '../../../app/_layout';
import TabsLayout from '../../../app/(tabs)/_layout';
import AuthLayout from '../../../app/(auth)/_layout';
import OnboardingLayout from '../../../app/(onboarding)/_layout';
import RootIndex from '../../../app/index';

// Mock expo-router
const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    replace: jest.fn(),
    navigate: jest.fn()
  }),
  Tabs: Object.assign(
    ({ children }: { children: React.ReactNode }) => <>{children}</>,
    {
      Screen: () => null
    }
  ),
  Stack: Object.assign(
    ({ children }: { children: React.ReactNode }) => <>{children}</>,
    {
      Screen: () => null
    }
  ),
  Slot: () => null,
  Redirect: ({ href }: { href: string }) => <>{href}</>
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 20, left: 0, right: 0 })
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy'
  }
}));

const ROUTE_COMPONENTS: Record<string, React.ComponentType<unknown>> = {
  '(auth)/welcome': AuthWelcome,
  '(auth)/sign-in': AuthSignIn,
  '(auth)/code': AuthCode,
  '(auth)/consent': AuthConsent,
  '(auth)/age': AuthAge,

  '(onboarding)/intro': OnboardingIntro,
  '(onboarding)/quiz/[step]': OnboardingQuizStep,
  '(onboarding)/deeper': OnboardingDeeper,
  '(onboarding)/warmup': OnboardingWarmup,
  '(onboarding)/coach-read': OnboardingCoachRead,
  '(onboarding)/playbook': OnboardingPlaybook,

  '(tabs)/index': TabToday,
  '(tabs)/path': TabPath,
  '(tabs)/moments': TabMoments,
  '(tabs)/you': TabYou,

  'practice': PracticeModal,
  'support': SupportModal,
  'paywall': PaywallModal,

  'session/[id]/idea': SessionIdea,
  'session/[id]/watch': SessionWatch,
  'session/[id]/read': SessionRead,
  'session/[id]/try': SessionTry,
  'session/[id]/coach': SessionCoach,
  'session/[id]/inner-voice': SessionInnerVoice,
  'session/[id]/out-there': SessionOutThere,
  'session/[id]/complete': SessionComplete,

  'moments/new': MomentsNew,
  'moments/[id]/prep': MomentsPrep,
  'moments/[id]/rehearse': MomentsRehearse,
  'moments/[id]/pocket': MomentsPocket,

  'energy': EnergyScreen,
  'checkin/[id]': CheckinScreen,
  'debrief/[id]': DebriefScreen,

  'tools/free-chat': FreeChatScreen,
  'tools/reply-helper': ReplyHelperScreen,

  'journal': JournalScreen,
  'letter/[id]': LetterScreen,
  'skill/[id]': SkillScreen,
  'gap': GapScreen,
  'battery': BatteryScreen,
  'ladder': LadderScreen,

  'settings/index': SettingsIndex,
  'settings/notifications': SettingsNotifications,
  'settings/privacy': SettingsPrivacy,
  'settings/subscription': SettingsSubscription,
  'settings/help': SettingsHelp,
  'settings/about-ai': SettingsAboutAi
};

const LAYOUT_COMPONENTS: Record<string, React.ComponentType<unknown>> = {
  '_layout': RootLayout,
  '(tabs)/_layout': TabsLayout,
  '(auth)/_layout': AuthLayout,
  '(onboarding)/_layout': OnboardingLayout,
  'index': RootIndex
};

describe('Route enumeration and file verification', () => {
  const appRoot = path.resolve(__dirname, '../../../app');

  it('verifies all 47 required route files exist on disk and export valid React components', () => {
    const routeKeys = Object.keys(ROUTE_COMPONENTS);
    expect(routeKeys.length).toBe(47);

    for (const route of routeKeys) {
      const fullPath = path.join(appRoot, `${route}.tsx`);
      const exists = fs.existsSync(fullPath);
      expect({ route, exists }).toEqual({ route, exists: true });

      const Component = ROUTE_COMPONENTS[route];
      expect(typeof Component).toBe('function');
    }
  });

  it('verifies all 5 required layouts and entry files exist on disk and export valid React components', () => {
    const layoutKeys = Object.keys(LAYOUT_COMPONENTS);
    expect(layoutKeys.length).toBe(5);

    for (const layout of layoutKeys) {
      const fullPath = path.join(appRoot, `${layout}.tsx`);
      const exists = fs.existsSync(fullPath);
      expect({ layout, exists }).toEqual({ layout, exists: true });

      const Component = LAYOUT_COMPONENTS[layout];
      expect(typeof Component).toBe('function');
    }
  });

  it('renders a sample route stub without crashing and displays Not built yet copy', () => {
    const { getByText, getByTestId } = render(
      <ThemeProvider initialPreference="light">
        <AuthWelcome />
      </ThemeProvider>
    );

    expect(getByTestId('route-stub-authWelcome')).toBeTruthy();
    expect(getByText(navigationCopy.routes.authWelcome.title)).toBeTruthy();
    expect(getByText(navigationCopy.notBuiltYet)).toBeTruthy();
  });
});

describe('Root auth and redirection stub', () => {
  it('useSession returns guest state without profile', () => {
    const sessionState = useSession();
    expect(sessionState.isGuest).toBe(true);
    expect(sessionState.session).toBeNull();
    expect(sessionState.profile).toBeNull();
    expect(sessionState.isLoading).toBe(false);
  });
});

describe('Floating glass TabBar', () => {
  const mockNavigate = jest.fn();
  const mockEmit = jest.fn(() => ({ defaultPrevented: false }));

  const defaultProps = {
    state: {
      index: 0,
      routes: [
        { key: 'tab-0', name: 'index' },
        { key: 'tab-1', name: 'path' },
        { key: 'tab-2', name: 'moments' },
        { key: 'tab-3', name: 'you' }
      ]
    },
    navigation: {
      navigate: mockNavigate,
      emit: mockEmit
    }
  } as unknown as Parameters<typeof TabBar>[0];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders tab bar with 4 tabs and center practice button in daylight mode', () => {
    const { getByTestId, getByText } = render(
      <ThemeProvider initialPreference="light">
        <TabBar {...defaultProps} />
      </ThemeProvider>
    );

    expect(getByTestId('floating-tab-bar')).toBeTruthy();
    expect(getByText(navigationCopy.tabs.today.label)).toBeTruthy();
    expect(getByText(navigationCopy.tabs.path.label)).toBeTruthy();
    expect(getByText(navigationCopy.tabs.moments.label)).toBeTruthy();
    expect(getByText(navigationCopy.tabs.you.label)).toBeTruthy();
    expect(getByTestId('practice-button')).toBeTruthy();
  });

  it('renders correctly in midnight mode', () => {
    const { getByTestId } = render(
      <ThemeProvider initialPreference="dark">
        <TabBar {...defaultProps} />
      </ThemeProvider>
    );

    expect(getByTestId('floating-tab-bar')).toBeTruthy();
  });

  it('has correct accessibility roles, labels and states on all tabs', () => {
    const { getByLabelText, getByTestId } = render(
      <ThemeProvider initialPreference="light">
        <TabBar {...defaultProps} />
      </ThemeProvider>
    );

    const todayTab = getByLabelText(navigationCopy.tabs.today.accessibilityLabel);
    expect(todayTab.props.accessibilityRole).toBe('tab');
    expect(todayTab.props.accessibilityState).toEqual({ selected: true });

    const pathTab = getByLabelText(navigationCopy.tabs.path.accessibilityLabel);
    expect(pathTab.props.accessibilityRole).toBe('tab');
    expect(pathTab.props.accessibilityState).toEqual({ selected: false });

    const practiceBtn = getByTestId('practice-button');
    expect(practiceBtn.props.accessibilityRole).toBe('button');
    expect(practiceBtn.props.accessibilityLabel).toBe(
      navigationCopy.practiceButton.accessibilityLabel
    );
    expect(practiceBtn.props.accessibilityHint).toBe(
      navigationCopy.practiceButton.accessibilityHint
    );
  });

  it('navigates when an inactive tab is pressed', () => {
    const { getByLabelText } = render(
      <ThemeProvider initialPreference="light">
        <TabBar {...defaultProps} />
      </ThemeProvider>
    );

    const pathTab = getByLabelText(navigationCopy.tabs.path.accessibilityLabel);
    fireEvent.press(pathTab);

    expect(mockEmit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'tabPress',
        target: 'tab-1'
      })
    );
    expect(mockNavigate).toHaveBeenCalledWith('path');
  });

  it('opens /practice modal when center practice button is pressed', () => {
    const { getByTestId } = render(
      <ThemeProvider initialPreference="light">
        <TabBar {...defaultProps} />
      </ThemeProvider>
    );

    const practiceBtn = getByTestId('practice-button');
    fireEvent.press(practiceBtn);

    expect(mockPush).toHaveBeenCalledWith('/practice');
  });
});
