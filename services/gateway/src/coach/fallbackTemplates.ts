import type { CoachFeedback } from '@yikes/ai-prompts/coach-feedback';

export interface SkillRubricItem {
  key: string;
  name: string;
  description: string;
  coachRubric: {
    worked: string;
    notYet: string;
  };
}

export const DEFAULT_SKILL_RUBRICS: Record<string, SkillRubricItem> = {
  starting_chat: {
    key: 'starting_chat',
    name: 'Starting a chat',
    description: 'Open a conversation naturally without feeling intrusive or forced.',
    coachRubric: {
      worked: 'You offered an easy, low-pressure opener tied to the shared environment.',
      notYet: 'The opening felt abrupt or placed too heavy a burden on the other person to carry.',
    },
  },
  asking_followups: {
    key: 'asking_followups',
    name: 'Asking follow-ups',
    description: 'Ask about the specific detail they lit up around rather than shifting to your next point.',
    coachRubric: {
      worked: 'You picked up on their specific cue and invited them to expand on what mattered to them.',
      notYet: 'You moved on to a fresh topic before exploring the detail they had just offered.',
    },
  },
  acknowledging: {
    key: 'acknowledging',
    name: 'Acknowledging what was said',
    description: 'Signal that their words landed before adding your own thought.',
    coachRubric: {
      worked: 'You reflected their main point with a brief validation before contributing.',
      notYet: 'You replied immediately with your own story without showing you registered theirs.',
    },
  },
  pacing_sharing: {
    key: 'pacing_sharing',
    name: 'Pacing what you share',
    description: 'Share in small, digestible pieces that leave room for dialogue rather than monologue.',
    coachRubric: {
      worked: 'You shared a crisp thought and tossed the ball back cleanly.',
      notYet: 'You packed several complex points into one turn, making it harder to respond.',
    },
  },
  reading_engagement: {
    key: 'reading_engagement',
    name: 'Reading engagement',
    description: 'Notice subtle cues in pacing and response length so you adjust smoothly.',
    coachRubric: {
      worked: 'You noticed their brief reply and gave them space or adjusted your approach.',
      notYet: 'You pushed for more detail when their tone signaled they needed a lighter exchange.',
    },
  },
  keeping_balance: {
    key: 'keeping_balance',
    name: 'Keeping balance',
    description: 'Maintain an equal exchange where neither person feels interrogated or ignored.',
    coachRubric: {
      worked: 'You paired your question with a brief personal touch, keeping the exchange symmetrical.',
      notYet: 'The conversation drifted into back-to-back questions without sharing your own context.',
    },
  },
  handling_silence: {
    key: 'handling_silence',
    name: 'Handling silence',
    description: 'Let comfortable pauses breathe instead of rushing to fill every quiet second.',
    coachRubric: {
      worked: 'You held space comfortably during the pause and allowed them time to gather thoughts.',
      notYet: 'You rushed in with filler words the moment a natural pause appeared.',
    },
  },
  graceful_exits: {
    key: 'graceful_exits',
    name: 'Graceful exits',
    description: 'Wrap up warmly and clearly without lingering awkwardly or apologizing for leaving.',
    coachRubric: {
      worked: 'You stated your leave warmly, appreciated the conversation, and closed cleanly.',
      notYet: 'You let the farewell drag on across multiple turns instead of stepping away with certainty.',
    },
  },
  bridging_small_talk: {
    key: 'bridging_small_talk',
    name: 'Bridging from small talk',
    description: 'Transition smoothly from surface pleasantries into meaningful substance.',
    coachRubric: {
      worked: 'You used a casual observation to bridge into a genuine question about their work.',
      notYet: 'The jump from pleasantries to deeper discussion felt sudden and ungrounded.',
    },
  },
  groups: {
    key: 'groups',
    name: 'Stepping into groups',
    description: 'Enter an active group discussion and contribute without waiting for an invitation.',
    coachRubric: {
      worked: 'You joined the circle quietly, listened for a natural pause, and added a warm, relevant thought.',
      notYet: 'You spoke over an active point or stayed completely silent in the background.',
    },
  },
  polite_disagreement: {
    key: 'polite_disagreement',
    name: 'Polite disagreement',
    description: 'Express a differing view calmly without sounding confrontational or defensive.',
    coachRubric: {
      worked: 'You validated their perspective first, then framed your alternate view with curiosity.',
      notYet: 'You contradicted their statement bluntly without recognizing their underlying intent.',
    },
  },
  following_up: {
    key: 'following_up',
    name: 'Following up afterwards',
    description: 'Send a thoughtful note or mention a shared topic later to solidify connection.',
    coachRubric: {
      worked: 'You referenced a specific shared thought from earlier, reinforcing rapport effortlessly.',
      notYet: 'The follow-up was generic and did not connect to anything specific discussed before.',
    },
  },
};

/**
 * Returns an authored rubric fallback feedback structure when model output
 * fails or when all model-suggested quotes are invalid and must be dropped.
 */
export function getAuthoredRubricFallback(
  skillKey: string,
  userTranscriptLine?: string
): CoachFeedback {
  const skill = DEFAULT_SKILL_RUBRICS[skillKey] ?? DEFAULT_SKILL_RUBRICS.starting_chat!;
  const quote = userTranscriptLine ?? '...';

  return {
    intro: 'You stepped into the practice conversation and put the scenario into motion.',
    worked: userTranscriptLine
      ? [
          {
            quote,
            why: skill.coachRubric.worked,
          },
        ]
      : [],
    pivot: {
      quote,
      whatHappened: skill.coachRubric.notYet,
      rewrite: 'Take a calm breath and ask an open question tied to their last sentence.',
    },
    tryNext: `Keep practicing ${skill.name.toLowerCase()} by focusing on leaving space for their reply.`,
    skillVotes: [
      {
        skill: skill.name,
        stage: 'starting',
        reason: 'Baseline practice attempt evaluated against authored rubric.',
      },
    ],
    partnerArc: 'The partner stayed engaged and responded to each move in the dialogue.',
  };
}
