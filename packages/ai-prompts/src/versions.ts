export const PROMPT_VERSIONS = {
  partnerTurn: '1.0.0',
  coachFeedback: '1.0.0',
  prepCard: '1.0.0',
  debriefQuestions: '1.0.0',
  debriefTakeaway: '1.0.0',
  replyHelper: '1.0.0',
  weeklyLetter: '1.0.0',
  scenarioGenerator: '1.0.0',
  watchExchange: '1.0.0',
  readScene: '1.0.0',
  voiceStyleSummary: '1.0.0',
} as const;

export type PromptName = keyof typeof PROMPT_VERSIONS;

export const PARTNER_TURN_VERSION = PROMPT_VERSIONS.partnerTurn;
export const COACH_FEEDBACK_VERSION = PROMPT_VERSIONS.coachFeedback;
export const PREP_CARD_VERSION = PROMPT_VERSIONS.prepCard;
export const DEBRIEF_QUESTIONS_VERSION = PROMPT_VERSIONS.debriefQuestions;
export const DEBRIEF_TAKEAWAY_VERSION = PROMPT_VERSIONS.debriefTakeaway;
export const REPLY_HELPER_VERSION = PROMPT_VERSIONS.replyHelper;
export const WEEKLY_LETTER_VERSION = PROMPT_VERSIONS.weeklyLetter;
export const SCENARIO_GENERATOR_VERSION = PROMPT_VERSIONS.scenarioGenerator;
export const WATCH_EXCHANGE_VERSION = PROMPT_VERSIONS.watchExchange;
export const READ_SCENE_VERSION = PROMPT_VERSIONS.readScene;
export const VOICE_STYLE_SUMMARY_VERSION = PROMPT_VERSIONS.voiceStyleSummary;
