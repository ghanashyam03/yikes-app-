import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../../../theme/ThemeProvider';
import { Screen, AmbientBubbleBackdrop, isAmbientDriftActive } from '../Screen';
import { Text } from '../Text';

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('Screen Ambient Bubble Backdrop Reduced Motion', () => {
  it('logic proves ambient drifting halts when Reduced Motion is enabled', () => {
    // When Reduced Motion is ON, drift MUST be inactive (stopped)
    expect(isAmbientDriftActive(true)).toBe(false);
    // When Reduced Motion is OFF, drift is active
    expect(isAmbientDriftActive(false)).toBe(true);
  });

  it('renders ambient-drift-stopped element when Reduced Motion is forced on', () => {
    const { getByTestId, queryByTestId } = render(
      <ThemeProvider initialPreference="light">
        <AmbientBubbleBackdrop forceReducedMotion={true} />
      </ThemeProvider>
    );

    expect(getByTestId('ambient-bubble-backdrop')).toBeTruthy();
    expect(getByTestId('ambient-drift-stopped')).toBeTruthy();
    expect(queryByTestId('ambient-drift-running')).toBeNull();
    expect(getByTestId('ambient-bubble-1')).toBeTruthy();
    expect(getByTestId('ambient-bubble-2')).toBeTruthy();
  });

  it('renders ambient-drift-running element when Reduced Motion is false', () => {
    const { getByTestId, queryByTestId } = render(
      <ThemeProvider initialPreference="light">
        <AmbientBubbleBackdrop forceReducedMotion={false} />
      </ThemeProvider>
    );

    expect(getByTestId('ambient-bubble-backdrop')).toBeTruthy();
    expect(getByTestId('ambient-drift-running')).toBeTruthy();
    expect(queryByTestId('ambient-drift-stopped')).toBeNull();
  });

  it('renders Screen container with child text and backdrop', () => {
    const { getByText, getByTestId } = render(
      <ThemeProvider initialPreference="light">
        <Screen>
          <Text role="titleLarge">Screen Title</Text>
        </Screen>
      </ThemeProvider>
    );

    expect(getByText('Screen Title')).toBeTruthy();
    expect(getByTestId('ambient-bubble-backdrop')).toBeTruthy();
  });
});
