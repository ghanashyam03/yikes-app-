import { describe, expect, it, beforeEach } from 'vitest';
import {
  clearInMemoryProgressStore,
  computeStageFromHistory,
  recordSkillVote,
} from '../stageTracker.js';

describe('T-13 Acceptance Check 2: Stable Growth Stages (3 Agreeing Votes)', () => {
  beforeEach(() => {
    clearInMemoryProgressStore();
  });

  it('proves a skill stage does not change with fewer than 3 votes', () => {
    const res1 = computeStageFromHistory('starting', ['practicing']);
    expect(res1.newStage).toBe('starting');
    expect(res1.changed).toBe(false);

    const res2 = computeStageFromHistory('starting', ['practicing', 'practicing']);
    expect(res2.newStage).toBe('starting');
    expect(res2.changed).toBe(false);
  });

  it('proves a skill stage does not change if the last 3 votes do not all agree', () => {
    const history = ['practicing', 'growing', 'practicing'] as const;
    const res = computeStageFromHistory('starting', [...history]);
    expect(res.newStage).toBe('starting');
    expect(res.changed).toBe(false);
  });

  it('proves a skill stage changes ONLY when the last 3 consecutive votes agree on the new stage', () => {
    // 3 agreeing votes for 'practicing'
    const history1 = ['practicing', 'practicing', 'practicing'] as const;
    const res1 = computeStageFromHistory('starting', [...history1]);
    expect(res1.newStage).toBe('practicing');
    expect(res1.changed).toBe(true);

    // After reaching 'practicing', 2 'growing' votes do not change stage
    const history2 = ['practicing', 'growing', 'growing'] as const;
    const res2 = computeStageFromHistory('practicing', [...history2]);
    expect(res2.newStage).toBe('practicing');
    expect(res2.changed).toBe(false);

    // 3 consecutive 'growing' votes change stage to 'growing'
    const history3 = ['growing', 'growing', 'growing'] as const;
    const res3 = computeStageFromHistory('practicing', [...history3]);
    expect(res3.newStage).toBe('growing');
    expect(res3.changed).toBe(true);
  });

  it('proves sequential voting with recordSkillVote transitions stage strictly after 3 consecutive agreeing votes', async () => {
    const userId = 'user_growth_test';
    const skillKey = 'starting_chat';

    // Vote 1: practicing
    const v1 = await recordSkillVote(null, userId, skillKey, {
      stage: 'practicing',
      reason: 'Good opening',
    });
    expect(v1.previousStage).toBe('starting');
    expect(v1.newStage).toBe('starting');
    expect(v1.changed).toBe(false);

    // Vote 2: practicing
    const v2 = await recordSkillVote(null, userId, skillKey, {
      stage: 'practicing',
      reason: 'Second solid opening',
    });
    expect(v2.previousStage).toBe('starting');
    expect(v2.newStage).toBe('starting');
    expect(v2.changed).toBe(false);

    // Vote 3: practicing -> Now 3 in a row!
    const v3 = await recordSkillVote(null, userId, skillKey, {
      stage: 'practicing',
      reason: 'Third consistent opening',
    });
    expect(v3.previousStage).toBe('starting');
    expect(v3.newStage).toBe('practicing');
    expect(v3.changed).toBe(true);

    // Vote 4: natural (1 vote only, should stay practicing)
    const v4 = await recordSkillVote(null, userId, skillKey, {
      stage: 'natural',
      reason: 'Flawless session',
    });
    expect(v4.previousStage).toBe('practicing');
    expect(v4.newStage).toBe('practicing');
    expect(v4.changed).toBe(false);
  });
});
