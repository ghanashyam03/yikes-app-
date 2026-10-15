export type QuestionSection = 'Goals' | 'Context' | 'Energy' | 'Worry' | 'Comfort' | 'Style' | 'Habit';

export type QuestionType =
  | 'multi-choice'
  | 'single-choice'
  | 'slider'
  | 'moment-form'
  | 'single-choice-with-custom';

export interface MomentAnswer {
  type: 'Meeting' | 'Party' | 'Call' | 'Networking';
  what: string;
  when: string;
}

export interface QuizQuestionBase {
  id: string;
  number: number;
  section: QuestionSection;
  title: string;
  subtitle: string;
  reason: string;
  type: QuestionType;
}

export interface MultiChoiceQuestion extends QuizQuestionBase {
  type: 'multi-choice';
  options: readonly string[];
  maxSelections: number;
}

export interface SingleChoiceQuestion extends QuizQuestionBase {
  type: 'single-choice';
  options: readonly string[];
}

export interface SliderQuestion extends QuizQuestionBase {
  type: 'slider';
  min: number;
  max: number;
  step: number;
  minLabel: string;
  maxLabel: string;
}

export interface MomentFormQuestion extends QuizQuestionBase {
  type: 'moment-form';
  momentTypes: readonly ['Meeting', 'Party', 'Call', 'Networking'];
}

export interface SingleChoiceWithCustomQuestion extends QuizQuestionBase {
  type: 'single-choice-with-custom';
  options: readonly string[];
  customOption: string;
}

export type QuizQuestion =
  | MultiChoiceQuestion
  | SingleChoiceQuestion
  | SliderQuestion
  | MomentFormQuestion
  | SingleChoiceWithCustomQuestion;

export interface QuizAnswers {
  q1?: string[];
  q2?: string[];
  q3?: MomentAnswer | null;
  q4?: string;
  q5?: number | null;
  q6?: string;
  q7?: string;
  q8?: string;
  q9?: number | null;
  q10?: string;
  q11?: string;
  q12?: string;
  q13?: string;
  q14?: string;
  q14Custom?: string;
}

export const QUIZ_QUESTIONS: readonly QuizQuestion[] = [
  {
    id: 'q1',
    number: 1,
    section: 'Goals',
    title: 'What do you most want to get better at?',
    subtitle: 'Pick up to 3',
    reason: 'We use this to choose your first scenarios and order your skills.',
    type: 'multi-choice',
    maxSelections: 3,
    options: [
      'Meetings',
      'Small talk',
      'Networking',
      'Making friends',
      'Speaking up',
      'Graceful exits',
      'Following up',
      'Groups'
    ]
  },
  {
    id: 'q2',
    number: 2,
    section: 'Goals',
    title: 'Where do conversations get hardest?',
    subtitle: 'Pick top 2',
    reason: 'We use this to calibrate practice tension and setting.',
    type: 'multi-choice',
    maxSelections: 2,
    options: [
      'Work meetings',
      'Parties',
      'Calls',
      'New groups',
      'Senior people',
      'Strangers',
      'Family',
      'Online chat'
    ]
  },
  {
    id: 'q3',
    number: 3,
    section: 'Goals',
    title: 'Is something coming up?',
    subtitle: 'Optional real-world moment',
    reason: 'We can prepare a custom rehearsal card for your event.',
    type: 'moment-form',
    momentTypes: ['Meeting', 'Party', 'Call', 'Networking']
  },
  {
    id: 'q4',
    number: 4,
    section: 'Context',
    title: 'What does your week look like?',
    subtitle: 'Choose the best match',
    reason: 'We use this to adapt scenarios to your everyday world.',
    type: 'single-choice',
    options: ['Student', 'Working', 'Both', 'Other']
  },
  {
    id: 'q5',
    number: 5,
    section: 'Energy',
    title: 'After an hour of socialising I feel...',
    subtitle: 'Slide to rate your battery',
    reason: 'We use this to pace your sessions and respect your recharge time.',
    type: 'slider',
    min: 1,
    max: 5,
    step: 1,
    minLabel: 'Charged',
    maxLabel: 'Need a day alone'
  },
  {
    id: 'q6',
    number: 6,
    section: 'Energy',
    title: 'In conversation I usually...',
    subtitle: 'Choose how you process',
    reason: 'We use this to tailor your rhythm and turn prompts.',
    type: 'single-choice',
    options: ['Think first, then speak', 'Speak as I think']
  },
  {
    id: 'q7',
    number: 7,
    section: 'Energy',
    title: 'After a conversation I tend to...',
    subtitle: 'Choose your typical reflex',
    reason: 'We use this to shape your Coach debriefs and reflections.',
    type: 'single-choice',
    options: ['Replay it', 'Forget it', 'Feel mostly fine']
  },
  {
    id: 'q8',
    number: 8,
    section: 'Worry',
    title: 'My biggest worry is...',
    subtitle: 'What makes you hesitate most',
    reason: 'We use this to address friction points early in practice.',
    type: 'single-choice',
    options: [
      'Sounding awkward',
      'Being boring',
      'Not knowing how to end',
      'Being judged',
      'Running out of things to say'
    ]
  },
  {
    id: 'q9',
    number: 9,
    section: 'Comfort',
    title: 'Starting a chat with someone I barely know feels...',
    subtitle: 'Slide from easy to very hard',
    reason: 'We use this to set your initial partner challenge level.',
    type: 'slider',
    min: 1,
    max: 5,
    step: 1,
    minLabel: 'Easy',
    maxLabel: 'Very hard'
  },
  {
    id: 'q10',
    number: 10,
    section: 'Style',
    title: 'How do you usually talk or text?',
    subtitle: 'Your natural conversational register',
    reason: 'We use this so suggestions sound like you, not a robot.',
    type: 'single-choice',
    options: ['Short and dry', 'Warm and chatty', 'Formal', 'Mixed']
  },
  {
    id: 'q11',
    number: 11,
    section: 'Style',
    title: 'How should your Coach sound?',
    subtitle: 'Choose the coaching tone that works best for you',
    reason: 'We adjust feedback delivery to match your preference.',
    type: 'single-choice',
    options: ['Gentle', 'Straight', 'Funny']
  },
  {
    id: 'q12',
    number: 12,
    section: 'Habit',
    title: 'How many sessions a week feels right?',
    subtitle: 'Your weekly rhythm goal',
    reason: 'No streaks or guilt—just a ring that fills at your pace.',
    type: 'single-choice',
    options: ['2 a week', '3 a week', '4 a week', '5 a week']
  },
  {
    id: 'q13',
    number: 13,
    section: 'Habit',
    title: 'When is a good time?',
    subtitle: 'Choose your preferred window',
    reason: 'We only nudge you during your chosen window.',
    type: 'single-choice',
    options: ['Early morning', 'Morning', 'Lunch', 'Afternoon', 'Evening']
  },
  {
    id: 'q14',
    number: 14,
    section: 'Habit',
    title: 'What will you do it after?',
    subtitle: 'Anchor practice to an existing daily routine',
    reason: 'Habits stick best when attached to an established anchor.',
    type: 'single-choice-with-custom',
    options: ['Morning coffee', 'Commute', 'Lunch', 'Evening wind-down'],
    customOption: 'Write my own'
  }
];
