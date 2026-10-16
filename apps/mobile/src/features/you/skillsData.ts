export interface SkillDefinition {
  key: string;
  name: string;
  description: string;
  coachRubric: {
    worked: string;
    notYet: string;
  };
}

export const TWELVE_SKILLS: Record<string, SkillDefinition> = {
  starting_chat: {
    key: 'starting_chat',
    name: 'Starting a chat',
    description: 'Open a conversation naturally without feeling intrusive or forced.',
    coachRubric: {
      worked: 'You offered an easy, low-pressure opener tied to the shared environment.',
      notYet: 'The opening felt abrupt or placed too heavy a burden on the other person.',
    },
  },
  asking_followups: {
    key: 'asking_followups',
    name: 'Asking follow-ups',
    description: 'Ask about the specific detail they lit up around rather than shifting to your next point.',
    coachRubric: {
      worked: 'You picked up on their specific cue and invited them to expand on what mattered.',
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
      notYet: 'The conversation drifted into back-to-back questions without sharing your context.',
    },
  },
  handling_silence: {
    key: 'handling_silence',
    name: 'Handling silence',
    description: 'Hold comfortable pauses without rushing to fill every gap with nervous chatter.',
    coachRubric: {
      worked: 'You allowed a natural pause to breathe without awkwardly cutting in.',
      notYet: 'You jumped in immediately during a thoughtful silence, disrupting their reflection.',
    },
  },
  graceful_exits: {
    key: 'graceful_exits',
    name: 'Graceful exits',
    description: 'Wrap up conversations smoothly on a high note without feeling clumsy.',
    coachRubric: {
      worked: 'You referenced a genuine highlight of the chat and exited warmly on your terms.',
      notYet: 'The exit felt abrupt or apologetic rather than intentional and warm.',
    },
  },
  bridging_small_talk: {
    key: 'bridging_small_talk',
    name: 'Bridging from small talk',
    description: 'Move smoothly from weather and pleasantries into meaningful common ground.',
    coachRubric: {
      worked: 'You connected an everyday comment to a shared project or genuine curiosity.',
      notYet: 'You stayed on surface pleasantries long after an opening appeared.',
    },
  },
  stepping_into_groups: {
    key: 'stepping_into_groups',
    name: 'Stepping into groups',
    description: 'Enter existing conversations without awkward interruptions or waiting indefinitely.',
    coachRubric: {
      worked: 'You listened for a natural pause and entered by building on what was just said.',
      notYet: 'You hesitated until the topic passed or tried to change the subject abruptly.',
    },
  },
  polite_disagreement: {
    key: 'polite_disagreement',
    name: 'Polite disagreement',
    description: 'Express a different viewpoint while keeping the connection warm and collaborative.',
    coachRubric: {
      worked: 'You validated their perspective before presenting an alternative angle with curiosity.',
      notYet: 'The disagreement felt adversarial rather than exploring possibilities together.',
    },
  },
  following_up: {
    key: 'following_up',
    name: 'Following up afterwards',
    description: 'Send thoughtful, low-pressure follow-ups that turn brief encounters into relationships.',
    coachRubric: {
      worked: 'You referenced a specific detail from your conversation with no heavy obligation attached.',
      notYet: 'The follow-up was generic and did not reference anything specific you discussed.',
    },
  },
};
