import { validateAge, handleUnder18Rejection, confirmAdultStatus } from '../ageGate';
import { supabase } from '../supabaseClient';
import { getGuestSession, createGuestSession } from '../guestStorage';

describe('ageGate', () => {
  const currentYear = 2026;

  describe('validateAge pure logic', () => {
    it('rejects users under 18 years old', () => {
      const result17 = validateAge(2009, currentYear); // 17
      expect(result17.isAdult).toBe(false);
      expect(result17.age).toBe(17);

      const result10 = validateAge(2016, currentYear); // 10
      expect(result10.isAdult).toBe(false);
      expect(result10.age).toBe(10);
    });

    it('accepts users 18 and older', () => {
      const result18 = validateAge(2008, currentYear); // 18
      expect(result18.isAdult).toBe(true);
      expect(result18.age).toBe(18);

      const result30 = validateAge(1996, currentYear); // 30
      expect(result30.isAdult).toBe(true);
      expect(result30.age).toBe(30);
    });
  });

  describe('under-18 zero-storage guarantee', () => {
    it('signs out, clears all local/guest data, and stores ZERO data', async () => {
      await createGuestSession();
      const guestBefore = await getGuestSession();
      expect(guestBefore).not.toBeNull();

      const signOutSpy = jest.spyOn(supabase.auth, 'signOut').mockResolvedValue({ error: null });
      const dbUpdateSpy = jest.spyOn(supabase, 'from');

      await handleUnder18Rejection();

      expect(signOutSpy).toHaveBeenCalled();
      const guestAfter = await getGuestSession();
      expect(guestAfter).toBeNull();

      // Ensure NO birth date, birth year, or rejection record was written to Supabase
      expect(dbUpdateSpy).not.toHaveBeenCalled();

      signOutSpy.mockRestore();
      dbUpdateSpy.mockRestore();
    });
  });

  describe('adult confirmation data safety', () => {
    it('writes adult_confirmed_at timestamp and strictly NO birth year or birth date', async () => {
      let updatedPayload: Record<string, unknown> | null = null;

      const mockFrom = jest.spyOn(supabase, 'from').mockReturnValue({
        update: jest.fn().mockImplementation((payload: Record<string, unknown>) => {
          updatedPayload = payload;
          return {
            eq: jest.fn().mockResolvedValue({ error: null })
          };
        })
      } as unknown as ReturnType<typeof supabase.from>);

      const success = await confirmAdultStatus('test-user-id');
      expect(success).toBe(true);
      expect(updatedPayload).not.toBeNull();
      expect(updatedPayload).toHaveProperty('adult_confirmed_at');
      if (updatedPayload) {
        expect(typeof updatedPayload['adult_confirmed_at']).toBe('string');
      }

      // Crucial privacy verification: No birth year or birth date allowed
      expect(updatedPayload).not.toHaveProperty('birth_year');
      expect(updatedPayload).not.toHaveProperty('birthYear');
      expect(updatedPayload).not.toHaveProperty('dob');
      expect(updatedPayload).not.toHaveProperty('date_of_birth');
      expect(updatedPayload).not.toHaveProperty('birth_date');

      mockFrom.mockRestore();
    });
  });
});
