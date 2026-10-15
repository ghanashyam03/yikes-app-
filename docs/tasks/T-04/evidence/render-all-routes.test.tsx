import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../../../../apps/mobile/src/theme/ThemeProvider';

import AuthWelcome from '../../../../apps/mobile/app/(auth)/welcome';
import AuthSignIn from '../../../../apps/mobile/app/(auth)/sign-in';
import AuthCode from '../../../../apps/mobile/app/(auth)/code';
import AuthConsent from '../../../../apps/mobile/app/(auth)/consent';
import AuthAge from '../../../../apps/mobile/app/(auth)/age';

import OnboardingIntro from '../../../../apps/mobile/app/(onboarding)/intro';
import OnboardingQuizStep from '../../../../apps/mobile/app/(onboarding)/quiz/[step]';
import OnboardingDeeper from '../../../../apps/mobile/app/(onboarding)/deeper';
import OnboardingWarmup from '../../../../apps/mobile/app/(onboarding)/warmup';
import OnboardingCoachRead from '../../../../apps/mobile/app/(onboarding)/coach-read';
import OnboardingPlaybook from '../../../../apps/mobile/app/(onboarding)/playbook';

import TabToday from '../../../../apps/mobile/app/(tabs)/index';
import TabPath from '../../../../apps/mobile/app/(tabs)/path';
import TabMoments from '../../../../apps/mobile/app/(tabs)/moments';
import TabYou from '../../../../apps/mobile/app/(tabs)/you';

import PracticeModal from '../../../../apps/mobile/app/practice';
import SupportModal from '../../../../apps/mobile/app/support';
import PaywallModal from '../../../../apps/mobile/app/paywall';

import SessionIdea from '../../../../apps/mobile/app/session/[id]/idea';
import SessionWatch from '../../../../apps/mobile/app/session/[id]/watch';
import SessionRead from '../../../../apps/mobile/app/session/[id]/read';
import SessionTry from '../../../../apps/mobile/app/session/[id]/try';
import SessionCoach from '../../../../apps/mobile/app/session/[id]/coach';
import SessionInnerVoice from '../../../../apps/mobile/app/session/[id]/inner-voice';
import SessionOutThere from '../../../../apps/mobile/app/session/[id]/out-there';
import SessionComplete from '../../../../apps/mobile/app/session/[id]/complete';

import MomentsNew from '../../../../apps/mobile/app/moments/new';
import MomentsPrep from '../../../../apps/mobile/app/moments/[id]/prep';
import MomentsRehearse from '../../../../apps/mobile/app/moments/[id]/rehearse';
import MomentsPocket from '../../../../apps/mobile/app/moments/[id]/pocket';

import EnergyScreen from '../../../../apps/mobile/app/energy';
import CheckinScreen from '../../../../apps/mobile/app/checkin/[id]';
import DebriefScreen from '../../../../apps/mobile/app/debrief/[id]';

import FreeChatScreen from '../../../../apps/mobile/app/tools/free-chat';
import ReplyHelperScreen from '../../../../apps/mobile/app/tools/reply-helper';

import JournalScreen from '../../../../apps/mobile/app/journal';
import LetterScreen from '../../../../apps/mobile/app/letter/[id]';
import SkillScreen from '../../../../apps/mobile/app/skill/[id]';
import GapScreen from '../../../../apps/mobile/app/gap';
import BatteryScreen from '../../../../apps/mobile/app/battery';
import LadderScreen from '../../../../apps/mobile/app/ladder';

import SettingsIndex from '../../../../apps/mobile/app/settings/index';
import SettingsNotifications from '../../../../apps/mobile/app/settings/notifications';
import SettingsPrivacy from '../../../../apps/mobile/app/settings/privacy';
import SettingsSubscription from '../../../../apps/mobile/app/settings/subscription';
import SettingsHelp from '../../../../apps/mobile/app/settings/help';
import SettingsAboutAi from '../../../../apps/mobile/app/settings/about-ai';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
    navigate: jest.fn()
  }),
  Tabs: Object.assign(
    ({ children }: { children: React.ReactNode }) => <>{children}</>,
    { Screen: () => null }
  ),
  Stack: Object.assign(
    ({ children }: { children: React.ReactNode }) => <>{children}</>,
    { Screen: () => null }
  ),
  Slot: () => null,
  Redirect: ({ href }: { href: string }) => <>{href}</>
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 20, left: 0, right: 0 })
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' }
}));

const ALL_ROUTES: Record<string, React.ComponentType<unknown>> = {
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

describe('Verifier Independent Route Render Audit', () => {
  const routeEntries = Object.entries(ALL_ROUTES);

  it('verifies exact route count matches 47', () => {
    expect(routeEntries.length).toBe(47);
  });

  describe('Light (Daylight) Mode Rendering', () => {
    for (const [routeName, Component] of routeEntries) {
      it(`renders route ${routeName} cleanly in light mode`, () => {
        const { getByText } = render(
          <ThemeProvider initialPreference="light">
            <Component />
          </ThemeProvider>
        );
        expect(getByText('Not built yet')).toBeTruthy();
      });
    }
  });

  describe('Dark (Midnight) Mode Rendering', () => {
    for (const [routeName, Component] of routeEntries) {
      it(`renders route ${routeName} cleanly in dark mode`, () => {
        const { getByText } = render(
          <ThemeProvider initialPreference="dark">
            <Component />
          </ThemeProvider>
        );
        expect(getByText('Not built yet')).toBeTruthy();
      });
    }
  });
});
