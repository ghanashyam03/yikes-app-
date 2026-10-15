import * as LocalAuthentication from 'expo-local-authentication';
import {
  isQuietLocked,
  setQuietLocked,
  isQuietLockEnabled,
  setQuietLockEnabled,
  authenticateBiometrics,
  handleAppStateChange,
  subscribeQuietLock,
  resetQuietLockState
} from '../quietLock';

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(),
  isEnrolledAsync: jest.fn(),
  authenticateAsync: jest.fn()
}));

describe('quietLock', () => {
  beforeEach(() => {
    resetQuietLockState();
    jest.clearAllMocks();
  });

  it('persists enabled preference and updates internal state', async () => {
    expect(await isQuietLockEnabled()).toBe(false);
    await setQuietLockEnabled(true);
    expect(await isQuietLockEnabled()).toBe(true);

    await setQuietLockEnabled(false);
    expect(await isQuietLockEnabled()).toBe(false);
    expect(isQuietLocked()).toBe(false);
  });

  it('locks the app on background -> active transition when enabled', async () => {
    await setQuietLockEnabled(true);
    setQuietLocked(false);
    expect(isQuietLocked()).toBe(false);

    // App goes to background
    await handleAppStateChange('background');
    expect(isQuietLocked()).toBe(false);

    // App returns to foreground
    await handleAppStateChange('active');
    expect(isQuietLocked()).toBe(true);
  });

  it('does NOT lock the app on foreground transition when disabled', async () => {
    await setQuietLockEnabled(false);
    setQuietLocked(false);

    await handleAppStateChange('background');
    await handleAppStateChange('active');
    expect(isQuietLocked()).toBe(false);
  });

  it('invokes biometric challenge and unlocks on success', async () => {
    setQuietLocked(true);
    expect(isQuietLocked()).toBe(true);

    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({ success: true });

    const success = await authenticateBiometrics();
    expect(success).toBe(true);
    expect(isQuietLocked()).toBe(false);
    expect(LocalAuthentication.authenticateAsync).toHaveBeenCalledTimes(1);
  });

  it('keeps lock if biometrics fail or are cancelled', async () => {
    setQuietLocked(true);

    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({
      success: false,
      error: 'user_cancel'
    });

    const success = await authenticateBiometrics();
    expect(success).toBe(false);
    expect(isQuietLocked()).toBe(true);
  });

  it('notifies subscribers of lock state transitions', () => {
    const states: boolean[] = [];
    const unsubscribe = subscribeQuietLock((locked) => {
      states.push(locked);
    });

    setQuietLocked(true);
    setQuietLocked(false);

    expect(states).toContain(true);
    expect(states[states.length - 1]).toBe(false);
    unsubscribe();
  });
});
