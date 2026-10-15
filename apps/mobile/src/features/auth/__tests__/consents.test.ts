import { saveConsents, DEFAULT_CONSENTS } from '../consentManager';
import { supabase } from '../supabaseClient';

describe('consentManager', () => {
  const userId = 'user-test-consent';

  it('provides sensible default consents with required strictly true', () => {
    expect(DEFAULT_CONSENTS.required).toBe(true);
    expect(DEFAULT_CONSENTS.analytics).toBe(false);
    expect(DEFAULT_CONSENTS.improve_ai).toBe(false);
    expect(DEFAULT_CONSENTS.marketing).toBe(false);
  });

  it('persists consents and enforces required: true', async () => {
    const writtenRows: Array<{ kind: string; granted: boolean }> = [];

    const mockFrom = jest.spyOn(supabase, 'from').mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
          })
        })
      }),
      insert: jest.fn().mockImplementation((payload: { kind: string; granted: boolean }) => {
        writtenRows.push(payload);
        return Promise.resolve({ error: null });
      })
    } as unknown as ReturnType<typeof supabase.from>);

    const result = await saveConsents(userId, {
      required: false, // Attempt to disable required
      analytics: true,
      improve_ai: false,
      marketing: true
    });

    expect(result.ok).toBe(true);
    expect(writtenRows.length).toBe(4);

    const requiredRow = writtenRows.find((r) => r.kind === 'required');
    expect(requiredRow).toBeDefined();
    // Enforced to true
    expect(requiredRow?.granted).toBe(true);

    const analyticsRow = writtenRows.find((r) => r.kind === 'analytics');
    expect(analyticsRow?.granted).toBe(true);

    const improveAiRow = writtenRows.find((r) => r.kind === 'improve_ai');
    expect(improveAiRow?.granted).toBe(false);

    const marketingRow = writtenRows.find((r) => r.kind === 'marketing');
    expect(marketingRow?.granted).toBe(true);

    mockFrom.mockRestore();
  });
});
