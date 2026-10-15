import type { ReactNode } from 'react';
import { render } from '@testing-library/react-native';
import RootLayout from '../../app/_layout';

jest.mock('expo-router', () => ({
  Slot: () => null,
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('RootLayout smoke test', () => {
  it('renders root layout without crashing', () => {
    const { getByTestId } = render(<RootLayout />);
    expect(getByTestId('root-layout')).toBeTruthy();
  });

  it('resolves @yikes/shared/version in mobile', () => {
    const { getByTestId } = render(<RootLayout />);
    expect(getByTestId('app-version-tag').props.children).toBe('0.0.1');
  });
});
