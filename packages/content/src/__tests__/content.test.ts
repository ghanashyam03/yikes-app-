import { describe, expect, it } from 'vitest';
import { PERSONAS_LIST } from '../personas.js';
import { SESSIONS, getSessionById, getSessionsByUnit } from '../sessions.js';
import { SKILLS_LIST } from '../skills.js';
import {
  BANNED_CLINICAL_REGEX,
  EXCLUDED_TOPICS_REGEX,
  validateAllContent,
} from '../validate.js';

describe('Content validation and integrity', () => {
  it('validates that validateAllContent passes with zero errors', () => {
    const result = validateAllContent();
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('contains exactly 12 skills matching curriculum', () => {
    expect(SKILLS_LIST).toHaveLength(12);
    const keys = SKILLS_LIST.map((s) => s.key);
    expect(keys).toContain('starting_chat');
    expect(keys).toContain('asking_followups');
    expect(keys).toContain('acknowledging');
    expect(keys).toContain('pacing_sharing');
    expect(keys).toContain('reading_engagement');
    expect(keys).toContain('keeping_balance');
    expect(keys).toContain('handling_silence');
    expect(keys).toContain('graceful_exits');
    expect(keys).toContain('bridging_small_talk');
    expect(keys).toContain('groups');
    expect(keys).toContain('polite_disagreement');
    expect(keys).toContain('following_up');
  });

  it('contains exactly 6 personas with non-red palettes and >=12 fallback lines', () => {
    expect(PERSONAS_LIST).toHaveLength(6);
    for (const persona of PERSONAS_LIST) {
      expect(persona.fallbackLines.length).toBeGreaterThanOrEqual(12);
      expect(persona.card.fallbackLines.length).toBeGreaterThanOrEqual(12);
      expect(persona.palette.primary).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(persona.palette.secondary).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('contains exactly 16 sessions divided equally into Unit 1 and Unit 2', () => {
    expect(SESSIONS).toHaveLength(16);
    const unit1 = getSessionsByUnit(1);
    const unit2 = getSessionsByUnit(2);
    expect(unit1).toHaveLength(8);
    expect(unit2).toHaveLength(8);

    for (let i = 1; i <= 16; i++) {
      const id = i < 10 ? `session-0${i}` : `session-${i}`;
      const session = getSessionById(id);
      expect(session).toBeDefined();
      expect(session?.sessionNumber).toBe(i);
    }
  });

  it('verifies Read beat reveal logic for every session', () => {
    for (const session of SESSIONS) {
      const { read } = session;
      expect(read.candidateThoughts).toHaveLength(3);
      expect([0, 1, 2]).toContain(read.trueIndex);
      const trueThought = read.candidateThoughts[read.trueIndex];
      expect(trueThought).toBeDefined();
      expect(typeof trueThought).toBe('string');
      expect(trueThought.length).toBeGreaterThan(5);
      expect(read.cueNote).toBeDefined();
      expect(read.cueNote.length).toBeGreaterThan(10);
    }
  });

  it('verifies Watch beat target lines are within bounds for every session', () => {
    for (const session of SESSIONS) {
      const { watch } = session;
      expect(watch.dialogue.length).toBeGreaterThanOrEqual(3);
      expect(watch.targetLineIndex).toBeGreaterThanOrEqual(0);
      expect(watch.targetLineIndex).toBeLessThan(watch.dialogue.length);
      expect(watch.explanation.length).toBeGreaterThan(10);
    }
  });

  it('detects banned clinical words and excluded topics when present', () => {
    expect('We offer clinical therapy for nervousness'.match(BANNED_CLINICAL_REGEX)).not.toBeNull();
    expect('This session will diagnose your style'.match(BANNED_CLINICAL_REGEX)).not.toBeNull();
    expect('He attended a funeral during bereavement'.match(EXCLUDED_TOPICS_REGEX)).not.toBeNull();
    expect('Reporting harassment at work'.match(EXCLUDED_TOPICS_REGEX)).not.toBeNull();
  });
});
