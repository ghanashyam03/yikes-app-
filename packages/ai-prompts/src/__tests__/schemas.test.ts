import { describe, expect, it } from 'vitest';
import { CoachFeedbackSchema } from '../coach-feedback.js';
import { DebriefQuestionsSchema } from '../debrief-questions.js';
import { DebriefTakeawaySchema } from '../debrief-takeaway.js';
import { PartnerTurnOutputSchema } from '../partner-turn.js';
import { PersonaCardSchema } from '../persona-card.js';
import { PrepCardSchema } from '../prep-card.js';
import { ReadSceneSchema } from '../read-scene.js';
import { ReplyHelperSchema } from '../reply-helper.js';
import { ScenarioGeneratorSchema } from '../scenario-generator.js';
import { VoiceStyleSummarySchema } from '../voice-style-summary.js';
import { WatchExchangeSchema } from '../watch-exchange.js';
import { WeeklyLetterSchema } from '../weekly-letter.js';

describe('Zod Schemas Unit Tests', () => {
  describe('PersonaCardSchema', () => {
    const validPersona = {
      id: 'maya-eng',
      name: 'Maya Lin',
      role: 'Staff Frontend Engineer',
      background: 'Experienced engineer who values concise technical discussions.',
      demeanor: 'Slightly reserved, warm once comfortable.',
      speakingStyle: 'Brisk, thoughtful, minimal fluff.',
      topicsEnjoyed: ['architecture', 'coffee', 'cycling'],
      topicsAvoided: ['office politics', 'small talk about weather'],
      hiddenTendencies: ['glances at watch when meetings stall'],
      fallbackLines: ['Sorry, had a distraction. What was that?'],
      baseMood: {
        engagement: 0.5,
        rapport: 0.4,
        patience: 0.6,
        exitPressure: 0.2,
      },
    };

    it('accepts valid persona card', () => {
      expect(PersonaCardSchema.safeParse(validPersona).success).toBe(true);
    });

    it('rejects persona card missing required fields', () => {
      const invalid = { ...validPersona, name: undefined };
      expect(PersonaCardSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe('PartnerTurnOutputSchema', () => {
    const validPartnerTurn = {
      reply: 'Sounds like a plan. Let us review tab 3.',
      thought: 'Glad we stayed focused on the spreadsheet.',
      mood: {
        engagement: 0.6,
        rapport: 0.5,
        patience: 0.7,
        exitPressure: 0.3,
      },
      wantsToEnd: false,
      cue: 0.65,
    };

    it('accepts valid partner turn output', () => {
      expect(PartnerTurnOutputSchema.safeParse(validPartnerTurn).success).toBe(true);
    });

    it('rejects mood values outside [0, 1]', () => {
      const invalid = {
        ...validPartnerTurn,
        mood: { ...validPartnerTurn.mood, engagement: 1.5 },
      };
      expect(PartnerTurnOutputSchema.safeParse(invalid).success).toBe(false);
    });

    it('rejects negative cue', () => {
      const invalid = { ...validPartnerTurn, cue: -0.1 };
      expect(PartnerTurnOutputSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe('CoachFeedbackSchema', () => {
    const validFeedback = {
      intro: 'Solid practice session navigating a quick standup.',
      worked: [
        {
          quote: 'Got a minute to check this?',
          why: 'Clear, direct ask that gave context immediately.',
        },
      ],
      pivot: {
        quote: 'Never mind then.',
        whatHappened: 'Closed the door abruptly when the partner hesitated.',
        rewrite: 'No worries if you are swamped—let us catch up after standup.',
      },
      tryNext: 'Keep the door open even when someone is pressed for time.',
      skillVotes: [
        {
          skill: 'starting a chat',
          stage: 'practicing' as const,
          reason: 'Showed good intent and direct phrasing.',
        },
      ],
      partnerArc: 'Partner started reserved and stayed cautious.',
    };

    it('accepts valid coach feedback', () => {
      expect(CoachFeedbackSchema.safeParse(validFeedback).success).toBe(true);
    });

    it('accepts valid coach feedback with null pivot', () => {
      const noPivot = { ...validFeedback, pivot: null };
      expect(CoachFeedbackSchema.safeParse(noPivot).success).toBe(true);
    });

    it('rejects invalid skill stage', () => {
      const invalid = {
        ...validFeedback,
        skillVotes: [{ skill: 'exits', stage: 'expert', reason: 'Too good' }],
      };
      expect(CoachFeedbackSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe('PrepCardSchema', () => {
    const validPrepCard = {
      openers: ['Hey, how is your afternoon going?', 'Mind if I sit here?'],
      questions: ['How did that demo go?', 'What are you working on this sprint?'] as [string, string],
      exitLine: 'I will let you get back to it—great catching up!',
      recoverySuggestion: 'Take a sip of water if a pause happens.',
      quietBreakIdea: 'Step into the quiet lounge for 3 minutes.',
    };

    it('accepts valid prep card', () => {
      expect(PrepCardSchema.safeParse(validPrepCard).success).toBe(true);
    });

    it('rejects prep card with only 1 question (requires exactly 2)', () => {
      const invalid = {
        ...validPrepCard,
        questions: ['Only one question'],
      };
      expect(PrepCardSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe('DebriefQuestionsSchema', () => {
    it('accepts 4 questions', () => {
      const data = {
        questions: ['Q1?', 'Q2?', 'Q3?', 'Q4?'],
      };
      expect(DebriefQuestionsSchema.safeParse(data).success).toBe(true);
    });

    it('accepts 5 questions', () => {
      const data = {
        questions: ['Q1?', 'Q2?', 'Q3?', 'Q4?', 'Q5?'],
      };
      expect(DebriefQuestionsSchema.safeParse(data).success).toBe(true);
    });

    it('rejects fewer than 4 or more than 5 questions', () => {
      expect(DebriefQuestionsSchema.safeParse({ questions: ['Q1?', 'Q2?'] }).success).toBe(false);
      expect(
        DebriefQuestionsSchema.safeParse({
          questions: ['Q1?', 'Q2?', 'Q3?', 'Q4?', 'Q5?', 'Q6?'],
        }).success
      ).toBe(false);
    });
  });

  describe('DebriefTakeawaySchema', () => {
    it('accepts valid takeaway card', () => {
      const data = {
        takeaway: 'The conversation flowed better once you asked about their project.',
        coreEssence: 'Asking about their project did the heavy lifting.',
        oneNextFocus: 'Use a similar opener next time.',
      };
      expect(DebriefTakeawaySchema.safeParse(data).success).toBe(true);
    });
  });

  describe('ReplyHelperSchema', () => {
    const validReplyHelper = {
      readings: [
        'They are busy and acknowledged the update quickly.',
        'They have no further questions right now.',
      ] as [string, string],
      disclaimer: "I can't know what they meant" as const,
      replies: {
        warm: 'Thanks for letting me know! Have a great afternoon.',
        direct: 'Understood. Proceeding with the rollout.',
        light: 'Sounds good! Talk soon.',
      },
    };

    it('accepts valid reply helper output', () => {
      expect(ReplyHelperSchema.safeParse(validReplyHelper).success).toBe(true);
    });

    it('rejects invalid or missing disclaimer', () => {
      const invalid = {
        ...validReplyHelper,
        disclaimer: 'They probably meant they were angry',
      };
      expect(ReplyHelperSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe('WeeklyLetterSchema', () => {
    it('accepts valid weekly letter under 150 words', () => {
      const valid = {
        letter: 'You practiced three times this week and your exits were much cleaner.',
        wordCount: 12,
        patternNoticed: 'Cleaner exits.',
        nextFocus: 'Keep practicing warm exits.',
      };
      expect(WeeklyLetterSchema.safeParse(valid).success).toBe(true);
    });

    it('rejects weekly letter exceeding 150 words', () => {
      const longLetter = Array(160).fill('word').join(' ');
      const invalid = {
        letter: longLetter,
        wordCount: 160,
        patternNoticed: 'Too long.',
        nextFocus: 'Be concise.',
      };
      expect(WeeklyLetterSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe('ScenarioGeneratorSchema', () => {
    it('accepts valid scenario generation output', () => {
      const valid = {
        title: 'Hallway Chat',
        setting: 'Hallway near coffee machine',
        situation: 'Running into teammate',
        userGoal: 'Ask about the project',
        partnerPersona: {
          id: 'p-1',
          name: 'Sam',
          role: 'Designer',
          background: 'Creative and observant',
          demeanor: 'Calm',
          speakingStyle: 'Relaxed',
          topicsEnjoyed: ['design', 'typography'],
          topicsAvoided: ['spreadsheets'],
          hiddenTendencies: ['fiddles with pen'],
          fallbackLines: ['Yeah, definitely.'],
          baseMood: {
            engagement: 0.5,
            rapport: 0.5,
            patience: 0.5,
            exitPressure: 0.5,
          },
        },
        difficulty: 'intermediate' as const,
        openingLine: 'Hey, did you catch the presentation?',
      };
      expect(ScenarioGeneratorSchema.safeParse(valid).success).toBe(true);
    });
  });

  describe('WatchExchangeSchema', () => {
    it('accepts valid watch exchange', () => {
      const valid = {
        title: 'Coffee machine exit',
        skillDemonstrated: 'graceful exits',
        dialogue: [
          { speaker: 'A', text: 'Good morning.', demonstratesSkill: false },
          { speaker: 'B', text: 'Hey! Catch you after standup.', demonstratesSkill: true },
          { speaker: 'A', text: 'Sounds good.', demonstratesSkill: false },
        ],
        targetLineIndex: 1,
        explanation: 'Line 2 demonstrated the exit clearly.',
      };
      expect(WatchExchangeSchema.safeParse(valid).success).toBe(true);
    });
  });

  describe('ReadSceneSchema', () => {
    it('accepts valid read scene', () => {
      const valid = {
        scene: 'Conference room doorway',
        dialogue: [
          { speaker: 'You', text: 'Was that slide clear?' },
          { speaker: 'Maya', text: 'Yeah, pretty much.' },
        ],
        candidateThoughts: ['Thought A', 'Thought B', 'Thought C'] as [string, string, string],
        trueIndex: 1,
        cueNote: 'Her eyes darted to the clock.',
      };
      expect(ReadSceneSchema.safeParse(valid).success).toBe(true);
    });

    it('rejects trueIndex outside [0, 2]', () => {
      const invalid = {
        scene: 'Doorway',
        dialogue: [
          { speaker: 'A', text: 'Hi' },
          { speaker: 'B', text: 'Hello' },
        ],
        candidateThoughts: ['1', '2', '3'],
        trueIndex: 4,
        cueNote: 'None',
      };
      expect(ReadSceneSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe('VoiceStyleSummarySchema', () => {
    it('accepts valid voice style summary', () => {
      const valid = {
        summary: 'Direct and courteous with short, punchy questions.',
        toneMarkers: ['understated', 'thoughtful'],
        vocabularyTraits: ['everyday idioms'],
        sentenceRhythm: 'Brisk cadence',
        samplePhrases: ['Makes sense.', 'Fair enough.'],
      };
      expect(VoiceStyleSummarySchema.safeParse(valid).success).toBe(true);
    });
  });
});
