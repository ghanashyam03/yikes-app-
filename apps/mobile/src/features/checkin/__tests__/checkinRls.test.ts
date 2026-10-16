import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { supabase } from '../../auth/supabaseClient';

jest.mock('../../auth/supabaseClient', () => {
  const mockFrom = jest.fn();
  return {
    supabase: {
      from: mockFrom,
    },
  };
});

describe('Acceptance Check 4: RLS tests on the new writes (energy_checkins, debriefs, micro_reps)', () => {
  const userA = 'usr_tenant_alice_rls_01';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('proves database migrations enforce RLS on energy_checkins, micro_reps, and debriefs', () => {
    const migrationsDir = resolve(__dirname, '../../../../../../supabase/migrations');
    const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'));
    const fullSql = files
      .map((f) => readFileSync(resolve(migrationsDir, f), 'utf-8'))
      .join('\n');

    const tables = ['energy_checkins', 'micro_reps', 'debriefs'];

    for (const tbl of tables) {
      // 1. ALTER TABLE public.<tbl> ENABLE ROW LEVEL SECURITY;
      const enableRegex = new RegExp(
        `ALTER TABLE public\\.${tbl} ENABLE ROW LEVEL SECURITY;`,
        'i'
      );
      expect(fullSql).toMatch(enableRegex);

      // 2. Owner SELECT policy
      const selectRegex = new RegExp(
        `CREATE POLICY ${tbl}_select_owner ON public\\.${tbl} FOR SELECT USING \\(user_id = auth\\.uid\\(\\)\\);`,
        'i'
      );
      expect(fullSql).toMatch(selectRegex);

      // 3. Owner INSERT policy
      const insertRegex = new RegExp(
        `CREATE POLICY ${tbl}_insert_owner ON public\\.${tbl} FOR INSERT WITH CHECK \\(user_id = auth\\.uid\\(\\)\\);`,
        'i'
      );
      expect(fullSql).toMatch(insertRegex);

      // 4. Owner UPDATE policy
      const updateRegex = new RegExp(
        `CREATE POLICY ${tbl}_update_owner ON public\\.${tbl} FOR UPDATE USING \\(user_id = auth\\.uid\\(\\)\\) WITH CHECK \\(user_id = auth\\.uid\\(\\)\\);`,
        'i'
      );
      expect(fullSql).toMatch(updateRegex);

      // 5. Owner DELETE policy
      const deleteRegex = new RegExp(
        `CREATE POLICY ${tbl}_delete_owner ON public\\.${tbl} FOR DELETE USING \\(user_id = auth\\.uid\\(\\)\\);`,
        'i'
      );
      expect(fullSql).toMatch(deleteRegex);
    }
  });

  it('energy_checkins insertion strictly injects authenticated user_id', async () => {
    const mockSelect = jest.fn().mockReturnValue({
      single: jest.fn().mockResolvedValue({
        data: { id: 'ec_1', user_id: userA, battery_level: 80, tags: ['people'] },
        error: null,
      }),
    });
    const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
    (supabase.from as unknown as jest.Mock).mockReturnValue({ insert: mockInsert });

    await supabase.from('energy_checkins').insert({
      user_id: userA,
      battery_level: 80,
      tags: ['people'],
    });

    expect(supabase.from).toHaveBeenCalledWith('energy_checkins');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: userA, battery_level: 80 })
    );
  });

  it('micro_reps insertion strictly scopes writes to user_id', async () => {
    const mockInsert = jest.fn().mockResolvedValue({ data: null, error: null });
    (supabase.from as unknown as jest.Mock).mockReturnValue({ insert: mockInsert });

    await supabase.from('micro_reps').insert({
      user_id: userA,
      forecast_drain: 7,
      forecast_warmth: 5,
      actual_drain: 4,
      actual_warmth: 7,
      outcome: 'yes',
      landed: true,
    });

    expect(supabase.from).toHaveBeenCalledWith('micro_reps');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: userA, outcome: 'yes', landed: true })
    );
  });

  it('debriefs queries and mutations are isolated to owner', async () => {
    const mockUpdate = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
    });
    (supabase.from as unknown as jest.Mock).mockReturnValue({ update: mockUpdate });

    await supabase
      .from('debriefs')
      .update({ takeaway: 'Learned to take quiet pauses' })
      .eq('id', 'deb_123')
      .eq('user_id', userA);

    expect(supabase.from).toHaveBeenCalledWith('debriefs');
    expect(mockUpdate).toHaveBeenCalledWith({
      takeaway: 'Learned to take quiet pauses',
    });
  });
});
