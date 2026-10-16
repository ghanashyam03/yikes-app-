import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  createMomentInSupabase,
  deleteMomentInSupabase,
  fetchMomentsFromSupabase,
  updateMomentInSupabase,
} from '../momentsApi';
import { supabase } from '../../auth/supabaseClient';

jest.mock('../../auth/supabaseClient', () => {
  const mockFrom = jest.fn();
  return {
    supabase: {
      from: mockFrom,
    },
  };
});

describe('Acceptance Check 1: Moment CRUD multi-tenant RLS enforcement', () => {
  const userA = 'usr_tenant_alice_123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('proves database migrations define full RLS coverage on public.moments', () => {
    // Read the supabase migrations directory
    const migrationsDir = resolve(__dirname, '../../../../../../supabase/migrations');
    const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'));
    const fullSql = files
      .map((f) => readFileSync(resolve(migrationsDir, f), 'utf-8'))
      .join('\n');

    // 1. Must enable RLS on moments
    expect(fullSql).toMatch(/ALTER TABLE public\.moments ENABLE ROW LEVEL SECURITY;/i);

    // 2. Must define SELECT policy filtering by auth.uid()
    expect(fullSql).toMatch(
      /CREATE POLICY moments_select_owner ON public\.moments FOR SELECT USING \(user_id = auth\.uid\(\)\);/i
    );

    // 3. Must define INSERT policy with check auth.uid()
    expect(fullSql).toMatch(
      /CREATE POLICY moments_insert_owner ON public\.moments FOR INSERT WITH CHECK \(user_id = auth\.uid\(\)\);/i
    );

    // 4. Must define UPDATE policy with using & check auth.uid()
    expect(fullSql).toMatch(
      /CREATE POLICY moments_update_owner ON public\.moments FOR UPDATE USING \(user_id = auth\.uid\(\)\) WITH CHECK \(user_id = auth\.uid\(\)\);/i
    );

    // 5. Must define DELETE policy with using auth.uid()
    expect(fullSql).toMatch(
      /CREATE POLICY moments_delete_owner ON public\.moments FOR DELETE USING \(user_id = auth\.uid\(\)\);/i
    );
  });

  it('fetchMomentsFromSupabase queries exclusively with user_id = auth user', async () => {
    const mockOrder = jest.fn().mockResolvedValue({
      data: [
        {
          id: 'm1',
          user_id: userA,
          title: 'Alice Meeting',
          status: 'upcoming',
        },
      ],
      error: null,
    });

    const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
    (supabase.from as unknown as jest.Mock).mockReturnValue({ select: mockSelect });

    const results = await fetchMomentsFromSupabase(userA);

    expect(supabase.from).toHaveBeenCalledWith('moments');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockEq).toHaveBeenCalledWith('user_id', userA);
    expect(results).toHaveLength(1);
    expect(results[0]?.title).toBe('Alice Meeting');
  });

  it('createMomentInSupabase guarantees insertion scoped to the requesting tenant', async () => {
    const mockSingle = jest.fn().mockResolvedValue({
      data: {
        id: 'new_m1',
        user_id: userA,
        title: 'Project Kickoff',
        status: 'upcoming',
      },
      error: null,
    });

    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
    (supabase.from as unknown as jest.Mock).mockReturnValue({ insert: mockInsert });

    const created = await createMomentInSupabase(
      {
        title: 'Project Kickoff',
        status: 'upcoming',
      },
      userA
    );

    expect(supabase.from).toHaveBeenCalledWith('moments');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: userA,
        title: 'Project Kickoff',
      })
    );
    expect(created.id).toBe('new_m1');
  });

  it('updateMomentInSupabase rejects updates outside tenant scope', async () => {
    const mockSingle = jest.fn().mockResolvedValue({
      data: {
        id: 'm_alice',
        user_id: userA,
        title: 'Updated Title',
        status: 'upcoming',
      },
      error: null,
    });

    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    const mockEqUser = jest.fn().mockReturnValue({ select: mockSelect });
    const mockEqId = jest.fn().mockReturnValue({ eq: mockEqUser });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEqId });
    (supabase.from as unknown as jest.Mock).mockReturnValue({ update: mockUpdate });

    await updateMomentInSupabase('m_alice', { title: 'Updated Title' }, userA);

    expect(mockEqId).toHaveBeenCalledWith('id', 'm_alice');
    expect(mockEqUser).toHaveBeenCalledWith('user_id', userA);
  });

  it('deleteMomentInSupabase scopes deletion strictly by moment id and tenant id', async () => {
    const mockEqUser = jest.fn().mockResolvedValue({ error: null });
    const mockEqId = jest.fn().mockReturnValue({ eq: mockEqUser });
    const mockDelete = jest.fn().mockReturnValue({ eq: mockEqId });
    (supabase.from as unknown as jest.Mock).mockReturnValue({ delete: mockDelete });

    await deleteMomentInSupabase('m_alice', userA);

    expect(mockDelete).toHaveBeenCalled();
    expect(mockEqId).toHaveBeenCalledWith('id', 'm_alice');
    expect(mockEqUser).toHaveBeenCalledWith('user_id', userA);
  });
});
