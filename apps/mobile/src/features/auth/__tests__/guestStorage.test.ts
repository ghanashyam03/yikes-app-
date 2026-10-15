import {
  createGuestSession,
  getGuestSession,
  isGuestExpired,
  clearGuestSession,
  registerGuestMerger,
  executeGuestMergers,
  clearRegisteredMergers,
  GUEST_LIFETIME_MS
} from '../guestStorage';

describe('guestStorage', () => {
  beforeEach(async () => {
    await clearGuestSession();
    clearRegisteredMergers();
  });

  it('creates and retrieves a guest session with 7-day expiration', async () => {
    const session = await createGuestSession();
    expect(session.deviceId).toBeTruthy();
    expect(session.expiresAt - session.createdAt).toBe(GUEST_LIFETIME_MS);

    const retrieved = await getGuestSession();
    expect(retrieved).not.toBeNull();
    expect(retrieved?.deviceId).toBe(session.deviceId);
  });

  it('correctly evaluates 7-day expiration', async () => {
    const session = await createGuestSession();

    // 6 days later: not expired
    const sixDaysLater = session.createdAt + 6 * 24 * 60 * 60 * 1000;
    expect(isGuestExpired(session, sixDaysLater)).toBe(false);

    // 7 days and 1 second later: expired
    const sevenDaysLater = session.createdAt + 7 * 24 * 60 * 60 * 1000 + 1000;
    expect(isGuestExpired(session, sevenDaysLater)).toBe(true);

    // Null session is considered expired
    expect(isGuestExpired(null)).toBe(true);
  });

  it('executes guest mergers in registration order and clears guest storage', async () => {
    await createGuestSession();
    expect(await getGuestSession()).not.toBeNull();

    const executionLog: string[] = [];

    const unregister1 = registerGuestMerger(async (userId) => {
      executionLog.push(`merger1:${userId}`);
    });

    const unregister2 = registerGuestMerger(async (userId) => {
      executionLog.push(`merger2:${userId}`);
    });

    await executeGuestMergers('user-123');

    expect(executionLog).toEqual(['merger1:user-123', 'merger2:user-123']);
    expect(await getGuestSession()).toBeNull();

    // Test unregistering
    unregister1();
    unregister2();
    executionLog.length = 0;
    await executeGuestMergers('user-123');
    expect(executionLog).toEqual([]);
  });
});
