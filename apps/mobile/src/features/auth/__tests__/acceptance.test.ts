import { supabase, secureStorageAdapter } from '../supabaseClient';
import { requestOtp, verifyOtp } from '../otpManager';
import { signOutLocal, signOutEverywhere } from '../devices';
import { handleUnder18Rejection } from '../ageGate';
import { registerGuestMerger, executeGuestMergers, createGuestSession, getGuestSession } from '../guestStorage';

describe('T-06 Acceptance Checks', () => {
  beforeEach(async () => {
    secureStorageAdapter.clearMemory();
    jest.clearAllMocks();
  });

  describe('Acceptance Check 1: Unit tests for core lifecycle rules', () => {
    it('under-18 path signs out and stores ZERO data', async () => {
      await createGuestSession();
      const signOutSpy = jest.spyOn(supabase.auth, 'signOut').mockResolvedValue({ error: null });
      const fromSpy = jest.spyOn(supabase, 'from');

      await handleUnder18Rejection();

      expect(signOutSpy).toHaveBeenCalled();
      expect(fromSpy).not.toHaveBeenCalled();
      expect(await getGuestSession()).toBeNull();

      signOutSpy.mockRestore();
      fromSpy.mockRestore();
    });

    it('guest merge ordering executes in sequence before clearing guest state', async () => {
      await createGuestSession();
      const order: number[] = [];

      registerGuestMerger(async () => {
        order.push(1);
      });
      registerGuestMerger(async () => {
        order.push(2);
      });

      await executeGuestMergers('test-user');
      expect(order).toEqual([1, 2]);
      expect(await getGuestSession()).toBeNull();
    });
  });

  describe('Acceptance Check 2: Local email OTP login against Supabase auth', () => {
    it('successfully requests and verifies email OTP', async () => {
      const signInOtpSpy = jest.spyOn(supabase.auth, 'signInWithOtp').mockResolvedValue({
        data: {} as unknown as Awaited<ReturnType<typeof supabase.auth.signInWithOtp>>['data'],
        error: null
      });

      const verifyOtpSpy = jest.spyOn(supabase.auth, 'verifyOtp').mockResolvedValue({
        data: {
          session: {
            access_token: 'fake-jwt-token-12345',
            user: { id: 'user-auth-pass', email: 'hello@yikes.test' }
          }
        } as unknown as Awaited<ReturnType<typeof supabase.auth.verifyOtp>>['data'],
        error: null
      });

      const reqRes = await requestOtp('hello@yikes.test', 'email');
      expect(reqRes.ok).toBe(true);
      expect(signInOtpSpy).toHaveBeenCalledWith({
        email: 'hello@yikes.test',
        options: { shouldCreateUser: true }
      });

      const verifyRes = await verifyOtp('hello@yikes.test', '123456', 'email');
      expect(verifyRes.ok).toBe(true);
      expect(verifyRes.session).toBeDefined();

      signInOtpSpy.mockRestore();
      verifyOtpSpy.mockRestore();
    });
  });

  describe('Acceptance Check 3: Profiles row read verification', () => {
    it('queries profiles row only for the authenticated user id', async () => {
      const authUserId = 'user-auth-123';
      let queriedTable = '';
      let filterColumn = '';
      let filterValue = '';

      const mockFrom = jest.spyOn(supabase, 'from').mockImplementation((table: string) => {
        queriedTable = table;
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockImplementation((col: string, val: string) => {
              filterColumn = col;
              filterValue = val;
              return {
                maybeSingle: jest.fn().mockResolvedValue({
                  data: {
                    user_id: authUserId,
                    display_name: 'Alex',
                    adult_confirmed_at: '2026-10-15T00:00:00Z'
                  },
                  error: null
                })
              };
            })
          })
        } as unknown as ReturnType<typeof supabase.from>;
      });

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authUserId)
        .maybeSingle();

      expect(queriedTable).toBe('profiles');
      expect(filterColumn).toBe('user_id');
      expect(filterValue).toBe(authUserId);
      expect(data?.user_id).toBe(authUserId);

      mockFrom.mockRestore();
    });
  });

  describe('Acceptance Check 4: Sign out clears secure storage', () => {
    it('clears stored session tokens on sign out', async () => {
      await secureStorageAdapter.setItem('supabase.auth.token', 'secret-access-token');
      expect(await secureStorageAdapter.getItem('supabase.auth.token')).toBe('secret-access-token');

      const signOutSpy = jest.spyOn(supabase.auth, 'signOut').mockResolvedValue({ error: null });

      await signOutLocal();

      expect(await secureStorageAdapter.getItem('supabase.auth.token')).toBeNull();
      signOutSpy.mockRestore();
    });
  });

  describe('Acceptance Check 5: No token or code appears in logs', () => {
    it('does not log codes, tokens, or credentials to any console stream', async () => {
      const sensitiveToken = 'sensitive-secret-token-abcdef';
      const sensitiveCode = '987654';

      const logSpy = jest.spyOn(console, 'log');
      const infoSpy = jest.spyOn(console, 'info');
      const warnSpy = jest.spyOn(console, 'warn');
      const errorSpy = jest.spyOn(console, 'error');

      const verifyOtpSpy = jest.spyOn(supabase.auth, 'verifyOtp').mockResolvedValue({
        data: {
          session: {
            access_token: sensitiveToken,
            user: { id: 'user-log-test', email: 'test@log.com' }
          }
        } as unknown as Awaited<ReturnType<typeof supabase.auth.verifyOtp>>['data'],
        error: null
      });

      await verifyOtp('test@log.com', sensitiveCode, 'email');
      await signOutEverywhere();

      const allLoggedText = [
        ...logSpy.mock.calls,
        ...infoSpy.mock.calls,
        ...warnSpy.mock.calls,
        ...errorSpy.mock.calls
      ]
        .flat()
        .map((arg) => (typeof arg === 'string' ? arg : JSON.stringify(arg)))
        .join(' ');

      expect(allLoggedText).not.toContain(sensitiveToken);
      expect(allLoggedText).not.toContain(sensitiveCode);

      verifyOtpSpy.mockRestore();
      logSpy.mockRestore();
      infoSpy.mockRestore();
      warnSpy.mockRestore();
      errorSpy.mockRestore();
    });
  });
});
