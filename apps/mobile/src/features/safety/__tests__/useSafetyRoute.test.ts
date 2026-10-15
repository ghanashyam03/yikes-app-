import { renderHook, act } from '@testing-library/react-native';
import { useSafetyRoute } from '../useSafetyRoute';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('useSafetyRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('navigates to /support when verdict is crisis', () => {
    const { result } = renderHook(() => useSafetyRoute());

    let navigated = false;
    act(() => {
      navigated = result.current.handleSafetyVerdict({
        verdict: 'crisis',
        categories: ['suicide'],
      });
    });

    expect(navigated).toBe(true);
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/support');
  });

  it('does NOT navigate when verdict is allow', () => {
    const { result } = renderHook(() => useSafetyRoute());

    let navigated = false;
    act(() => {
      navigated = result.current.handleSafetyVerdict({
        verdict: 'allow',
        categories: [],
      });
    });

    expect(navigated).toBe(false);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('does NOT navigate to /support when verdict is block', () => {
    const { result } = renderHook(() => useSafetyRoute());

    let navigated = false;
    act(() => {
      navigated = result.current.handleSafetyVerdict({
        verdict: 'block',
        categories: ['hate_speech'],
      });
    });

    expect(navigated).toBe(false);
    expect(mockPush).not.toHaveBeenCalled();
  });
});
