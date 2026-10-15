import type { CoachFeedback } from '../coach-feedback.js';
import type {
  CoachToneVariant,
  PlaybookSummary,
  ScenarioInfo,
  SkillRubric,
  TranscriptTurn,
} from '../types.js';

export interface EvalFixture {
  id: string;
  name: string;
  style: string;
  toneVariant: CoachToneVariant;
  scenario: ScenarioInfo;
  transcript: TranscriptTurn[];
  thoughts: Array<{ turnIndex: number; thought: string }>;
  playbook: PlaybookSummary;
  skillRubric: SkillRubric;
  expectedPivot: boolean;
  simulatedFeedback: CoachFeedback;
}

export const EVAL_FIXTURES: EvalFixture[] = [
  // 1. Awkward elevator small talk (expects pivot)
  {
    id: 'fixture-01',
    name: 'Awkward Elevator Small Talk',
    style: 'Short brief encounter with abrupt pause',
    toneVariant: 'gentle',
    scenario: {
      title: 'Elevator Encounter',
      setting: 'Elevator ride from floor 1 to 14',
      userGoal: 'Make comfortable small talk before exiting',
    },
    transcript: [
      { role: 'user', text: 'Going all the way up?' },
      { role: 'partner', text: 'Yeah, 14th floor today. Big client presentation.' },
      { role: 'user', text: 'Weather outside is really gray and depressing.' },
      { role: 'partner', text: 'Uh... yeah, looks like rain.' },
      { role: 'user', text: 'Have a good presentation on 14!' },
      { role: 'partner', text: 'Thanks, appreciate it.' },
    ],
    thoughts: [
      { turnIndex: 1, thought: 'A little nervous about this deck.' },
      { turnIndex: 3, thought: 'Oof, that killed the mood instantly.' },
      { turnIndex: 5, thought: 'Nice send-off at least.' },
    ],
    playbook: {
      communicationStyle: 'Low-key, thoughtful',
      scenarioWorld: 'Corporate office',
    },
    skillRubric: {
      skill: 'starting a chat',
      description: 'Opening and carrying short situational small talk',
      targetBehaviors: ['Acknowledge context', 'Keep mood light', 'Graceful exit'],
    },
    expectedPivot: true,
    simulatedFeedback: {
      intro: 'You stepped in and greeted someone headed up to a big meeting.',
      worked: [
        {
          quote: 'Going all the way up?',
          why: 'A simple, natural opener that matched the elevator setting without forcing conversation.',
        },
        {
          quote: 'Have a good presentation on 14!',
          why: 'Warm closing wish that recalled their destination and ended on a positive note.',
        },
      ],
      pivot: {
        quote: 'Weather outside is really gray and depressing.',
        whatHappened: 'The negative shift introduced a heavy note while the other person was already feeling presentation tension.',
        rewrite: 'Big client pitch—hope the prep pays off smoothly!',
      },
      tryNext: 'When someone shares an upcoming event, lean into that topic instead of pivoting to the weather.',
      skillVotes: [
        {
          skill: 'starting a chat',
          stage: 'practicing',
          reason: 'Solid opener and warm closing, with room to connect more directly on what the partner volunteered.',
        },
      ],
      partnerArc: 'The partner started open, hesitated after the weather comment, then warmed up again at your kind exit.',
    },
  },

  // 2. Friendly one-to-one coffee chat (no pivot)
  {
    id: 'fixture-02',
    name: 'Coffee Chat Catch-up',
    style: 'Friendly one-to-one with natural flow',
    toneVariant: 'straight',
    scenario: {
      title: 'Cafe Catch-up',
      setting: 'Quiet coffee shop near campus',
      userGoal: 'Catch up on recent projects and listen actively',
    },
    transcript: [
      { role: 'user', text: 'How was your weekend after that launch sprint?' },
      { role: 'partner', text: 'Honestly slept for twelve hours Saturday, but finally tried making sourdough.' },
      { role: 'user', text: 'Sourdough is tricky—how did the crust turn out?' },
      { role: 'partner', text: 'Surprisingly crispy! The starter took forever though.' },
      { role: 'user', text: 'Patience pays off. I need to grab my laptop for a standup, but keep me posted on batch two.' },
      { role: 'partner', text: 'Will do! Good luck with your standup.' },
    ],
    thoughts: [
      { turnIndex: 1, thought: 'Glad they asked about something outside work.' },
      { turnIndex: 3, thought: 'They actually know about baking! Fun.' },
      { turnIndex: 5, thought: 'Clean exit, enjoyed chatting.' },
    ],
    playbook: {
      communicationStyle: 'Direct and curious',
      scenarioWorld: 'Tech studio',
    },
    skillRubric: {
      skill: 'asking follow-ups',
      description: 'Asking follow-up questions that build directly on what the speaker shared',
      targetBehaviors: ['Pick up on enthusiasm', 'Ask specific questions', 'Clean wrap-up'],
    },
    expectedPivot: false,
    simulatedFeedback: {
      intro: 'Clear, balanced exchange where you tracked their interest smoothly.',
      worked: [
        {
          quote: 'Sourdough is tricky—how did the crust turn out?',
          why: 'Specific follow-up that homed in on the detail they were genuinely excited about.',
        },
        {
          quote: 'Patience pays off. I need to grab my laptop for a standup, but keep me posted on batch two.',
          why: 'Affirmed their achievement, stated a real reason to leave, and left an open door.',
        },
      ],
      pivot: null,
      tryNext: 'Maintain this pattern of following their energy cues in larger groups.',
      skillVotes: [
        {
          skill: 'asking follow-ups',
          stage: 'growing',
          reason: 'Consistently engaged with what the partner highlighted rather than steering back to self.',
        },
      ],
      partnerArc: 'The partner visibly relaxed and enjoyed sharing their weekend hobby.',
    },
  },

  // 3. Sprint Planning Update (expects pivot)
  {
    id: 'fixture-03',
    name: 'Sprint Planning Update',
    style: 'Fast-paced colleague discussion with balance friction',
    toneVariant: 'funny',
    scenario: {
      title: 'Sprint Scope Alignment',
      setting: 'Standing desk pod after standup',
      userGoal: 'Align on task ownership without monopolizing the chat',
    },
    transcript: [
      { role: 'user', text: 'Hey Priya, do you have two minutes to check the auth tickets?' },
      { role: 'partner', text: 'Yeah, I just pulled them up on Jira.' },
      { role: 'user', text: 'I already reviewed all 8 tickets and wrote three pages of documentation and refactored the tokens module this morning so you do not have to worry about anything.' },
      { role: 'partner', text: 'Oh... wow, okay. I had actually already started on ticket 204 yesterday.' },
      { role: 'user', text: 'My bad, let us divide 204 and compare notes after lunch.' },
      { role: 'partner', text: 'Sounds fair. Let us do that.' },
    ],
    thoughts: [
      { turnIndex: 1, thought: 'Ready to coordinate.' },
      { turnIndex: 3, thought: 'Whoa, steamrolled before I could even speak.' },
      { turnIndex: 5, thought: 'Good recovery though.' },
    ],
    playbook: {
      communicationStyle: 'Detailed, technical',
      scenarioWorld: 'Software engineering',
    },
    skillRubric: {
      skill: 'keeping balance',
      description: 'Balancing conversational airtime and allowing collaborative space',
      targetBehaviors: ['Share incrementally', 'Check in before declaring decisions', 'Recover gracefully'],
    },
    expectedPivot: true,
    simulatedFeedback: {
      intro: 'You came in ready to conquer the backlog, though the conversational sprint got ahead of the teammate.',
      worked: [
        {
          quote: 'Hey Priya, do you have two minutes to check the auth tickets?',
          why: 'Pitched a bounded, clear request for time and context.',
        },
        {
          quote: 'My bad, let us divide 204 and compare notes after lunch.',
          why: 'Quick, zero-drama recovery that handed agency right back to Priya.',
        },
      ],
      pivot: {
        quote: 'I already reviewed all 8 tickets and wrote three pages of documentation and refactored the tokens module this morning so you do not have to worry about anything.',
        whatHappened: 'A tidal wave of solved problems landed before the other person could mention what they were already holding.',
        rewrite: 'I took an initial pass at the auth batch, but wanted to see which ones you had your eye on first.',
      },
      tryNext: 'Share one milestone at a time so your colleague has room to jump in.',
      skillVotes: [
        {
          skill: 'keeping balance',
          stage: 'practicing',
          reason: 'Quick to acknowledge the overlap and course-correct, but initial share overwhelmed the exchange.',
        },
      ],
      partnerArc: 'Priya felt momentarily sidelined by the wall of updates, but appreciated the prompt recalibration.',
    },
  },

  // 4. Design Disagreement (no pivot)
  {
    id: 'fixture-04',
    name: 'Design Disagreement',
    style: 'Constructive workplace discussion with polite disagreement',
    toneVariant: 'straight',
    scenario: {
      title: 'Reviewing Color Palette',
      setting: 'Design review table',
      userGoal: 'Disagree with a color choice constructively',
    },
    transcript: [
      { role: 'partner', text: 'I think bright orange buttons will maximize contrast and conversions on every screen.' },
      { role: 'user', text: 'I see why high visibility matters for conversion.' },
      { role: 'partner', text: 'Exactly, we need people noticing the CTA right away.' },
      { role: 'user', text: 'My concern is orange might clash with our calming brand tone on error screens. What if we tested warm amber on primary actions only?' },
      { role: 'partner', text: 'That is a solid point. Let us test amber against orange in the prototype.' },
    ],
    thoughts: [
      { turnIndex: 0, thought: 'Hoping they see the logic here.' },
      { turnIndex: 2, thought: 'Glad they get the conversion angle.' },
      { turnIndex: 4, thought: 'Good nuance, amber makes much more sense.' },
    ],
    playbook: {
      communicationStyle: 'Analytical, quiet',
      scenarioWorld: 'Product design agency',
    },
    skillRubric: {
      skill: 'polite disagreement',
      description: 'Disagreeing constructively while validating the underlying intent',
      targetBehaviors: ['Acknowledge validity of prior point', 'State concern neutrally', 'Offer alternative'],
    },
    expectedPivot: false,
    simulatedFeedback: {
      intro: 'You handled a design disagreement with precision and zero defensiveness.',
      worked: [
        {
          quote: 'I see why high visibility matters for conversion.',
          why: 'Validated the intent before presenting your counter-argument.',
        },
        {
          quote: 'My concern is orange might clash with our calming brand tone on error screens. What if we tested warm amber on primary actions only?',
          why: 'Framed the critique around the product experience and offered a workable compromise.',
        },
      ],
      pivot: null,
      tryNext: 'Carry this same pattern—validate then offer alternative—into group review sessions.',
      skillVotes: [
        {
          skill: 'polite disagreement',
          stage: 'growing',
          reason: 'Seamlessly combined acknowledgment of goals with an actionable counter-proposal.',
        },
      ],
      partnerArc: 'The partner felt heard rather than contradicted, and enthusiastically agreed to test the idea.',
    },
  },

  // 5. Networking Mixer Intro (no pivot)
  {
    id: 'fixture-05',
    name: 'Networking Mixer Intro',
    style: 'Casual networking with reserved partner',
    toneVariant: 'gentle',
    scenario: {
      title: 'Community Meetup Mingling',
      setting: 'Standing reception room with badge table',
      userGoal: 'Introduce yourself to someone standing alone',
    },
    transcript: [
      { role: 'user', text: 'Hi, mind if I join you at this high table?' },
      { role: 'partner', text: 'Sure, go ahead. It is pretty loud in here.' },
      { role: 'user', text: 'It really is! Are you local or did you travel in for the talk?' },
      { role: 'partner', text: 'I drove down from Seattle this morning.' },
      { role: 'user', text: 'That drive through the pass can be intense. How was the traffic?' },
      { role: 'partner', text: 'Clear until Tacoma, actually. Glad to be off the road.' },
    ],
    thoughts: [
      { turnIndex: 1, thought: 'A bit drained from the crowd.' },
      { turnIndex: 3, thought: 'Appreciate a simple, low-pressure question.' },
      { turnIndex: 5, thought: 'They are easy to talk to.' },
    ],
    playbook: {
      communicationStyle: 'Warm, low-pressure',
      scenarioWorld: 'Tech meetup',
    },
    skillRubric: {
      skill: 'starting a chat',
      description: 'Low-friction openers and follow-ups in social gatherings',
      targetBehaviors: ['Ask permission before joining', 'Validate shared environment', 'Gentle follow-up'],
    },
    expectedPivot: false,
    simulatedFeedback: {
      intro: 'You stepped into a noisy room and gave someone standing by themselves a calm harbor.',
      worked: [
        {
          quote: 'Hi, mind if I join you at this high table?',
          why: 'Courteous question that respected their personal space before settling in.',
        },
        {
          quote: 'That drive through the pass can be intense. How was the traffic?',
          why: 'Demonstrated empathy for their morning travel without putting them on the spot.',
        },
      ],
      pivot: null,
      tryNext: 'When the other person reaches a relaxed point, introduce your name casually.',
      skillVotes: [
        {
          skill: 'starting a chat',
          stage: 'growing',
          reason: 'Approached with consideration, matched the noise context, and asked an easy question.',
        },
      ],
      partnerArc: 'The partner started slightly guarded from sensory overwhelm and opened up quickly.',
    },
  },

  // 6. Senior Manager 1:1 (expects pivot)
  {
    id: 'fixture-06',
    name: 'Senior Manager 1:1',
    style: 'High stakes check-in with tense start',
    toneVariant: 'funny',
    scenario: {
      title: 'Quarterly Check-in with VP',
      setting: 'Corner conference room',
      userGoal: 'Present quarterly highlights without apologizing unnecessarily',
    },
    transcript: [
      { role: 'partner', text: 'Thanks for coming by. What did you want to cover first?' },
      { role: 'user', text: 'Sorry to bother you, I know you are super busy and probably do not have time for this.' },
      { role: 'partner', text: 'I booked this slot specifically for us. Let us dive in.' },
      { role: 'user', text: 'Got it. The two highlights are the database migration being complete and our latency dropping 30%.' },
      { role: 'partner', text: 'Now that is what I wanted to hear. Tell me about the latency win.' },
    ],
    thoughts: [
      { turnIndex: 0, thought: 'Curious what progress they made.' },
      { turnIndex: 2, thought: 'No need to apologize for being on my calendar!' },
      { turnIndex: 4, thought: '30% drop is impressive. Good work.' },
    ],
    playbook: {
      communicationStyle: 'Direct, technical',
      scenarioWorld: 'Enterprise tech',
    },
    skillRubric: {
      skill: 'starting a chat',
      description: 'Starting conversations with senior leaders with grounded clarity',
      targetBehaviors: ['Own the scheduled time', 'Lead with value', 'Avoid apologetic openers'],
    },
    expectedPivot: true,
    simulatedFeedback: {
      intro: 'You had great news in your pocket, even if you knocked on the door with an apology.',
      worked: [
        {
          quote: 'Got it. The two highlights are the database migration being complete and our latency dropping 30%.',
          why: 'Crisp, data-driven summary that instantly rewarded the manager attention.',
        },
      ],
      pivot: {
        quote: 'Sorry to bother you, I know you are super busy and probably do not have time for this.',
        whatHappened: 'Apologizing for a scheduled meeting shrinks your presence and puts management work on the other person.',
        rewrite: 'Thanks for making time today. I have two concrete updates on performance to walk through.',
      },
      tryNext: 'Step straight into your agenda headline without asking permission for time already granted.',
      skillVotes: [
        {
          skill: 'starting a chat',
          stage: 'practicing',
          reason: 'Strong recovery into core metrics after an overly apologetic opener.',
        },
      ],
      partnerArc: 'The VP brushed off the hesitant apology and locked right into the positive technical metrics.',
    },
  },

  // 7. Dinner Party Group (no pivot)
  {
    id: 'fixture-07',
    name: 'Dinner Party Group Dynamic',
    style: 'Group conversation with shared banter',
    toneVariant: 'gentle',
    scenario: {
      title: 'Friends of Friends Dinner',
      setting: 'Dining table with five people',
      userGoal: 'Join group conversation without interrupting abruptly',
    },
    transcript: [
      { role: 'partner', text: 'We were just debating whether physical books or e-readers are better for travel.' },
      { role: 'user', text: 'Physical books never run out of battery, but e-readers definitely save suitcase weight.' },
      { role: 'partner', text: 'Exactly the trade-off! What do you usually pack when flying?' },
      { role: 'user', text: 'One paperback for takeoff and landing, and an e-reader for the rest.' },
      { role: 'partner', text: 'Best of both worlds. I love that approach.' },
    ],
    thoughts: [
      { turnIndex: 0, thought: 'Hoping to bring everyone into the debate.' },
      { turnIndex: 2, thought: 'Balanced take that bridged both sides.' },
      { turnIndex: 4, thought: 'Practical solution, fit right into our banter.' },
    ],
    playbook: {
      communicationStyle: 'Observant, balanced',
      scenarioWorld: 'Casual weekend gathering',
    },
    skillRubric: {
      skill: 'bridging from small talk',
      description: 'Contributing naturally to group topics and offering balanced points',
      targetBehaviors: ['Bridge viewpoints', 'Answer with personal touch', 'Maintain warm rhythm'],
    },
    expectedPivot: false,
    simulatedFeedback: {
      intro: 'You entered an existing group discussion with an observant, balanced angle.',
      worked: [
        {
          quote: 'Physical books never run out of battery, but e-readers definitely save suitcase weight.',
          why: 'Connected the two competing opinions in the circle without taking a harsh stance.',
        },
        {
          quote: 'One paperback for takeoff and landing, and an e-reader for the rest.',
          why: 'Shared an authentic habit with good humor that kept the banter flowing.',
        },
      ],
      pivot: null,
      tryNext: 'In your next group setting, ask one person across the table their favorite read.',
      skillVotes: [
        {
          skill: 'bridging from small talk',
          stage: 'natural',
          reason: 'Integrated into the group dynamic effortlessly and offered a bridge everyone enjoyed.',
        },
      ],
      partnerArc: 'The group felt immediate ease welcoming you into the debate.',
    },
  },

  // 8. Pacing Personal Share (expects pivot)
  {
    id: 'fixture-08',
    name: 'Pacing Personal Share',
    style: 'New acquaintance chat with overshare friction',
    toneVariant: 'straight',
    scenario: {
      title: 'Waiting for Workshop to Start',
      setting: 'Classroom seating area',
      userGoal: 'Get to know a seatmate with balanced pacing',
    },
    transcript: [
      { role: 'partner', text: 'Have you taken workshops with this instructor before?' },
      { role: 'user', text: 'No, my entire life has been in shambles lately and my therapist suggested I get out more.' },
      { role: 'partner', text: 'Oh... I see. Well, hopefully the class is helpful.' },
      { role: 'user', text: 'Thanks. What brought you to this session?' },
      { role: 'partner', text: 'Just looking to sharpen my presentation slides for work.' },
    ],
    thoughts: [
      { turnIndex: 0, thought: 'Just making friendly pre-class chit-chat.' },
      { turnIndex: 2, thought: 'Whoa, that was very personal for minute one.' },
      { turnIndex: 4, thought: 'Better, now on neutral ground.' },
    ],
    playbook: {
      communicationStyle: 'Direct, honest',
      scenarioWorld: 'Adult learning center',
    },
    skillRubric: {
      skill: 'pacing what you share',
      description: 'Pacing vulnerability and personal details to match the relationship depth',
      targetBehaviors: ['Match intimacy level', 'Keep early turns lightweight', 'Recover smoothly'],
    },
    expectedPivot: true,
    simulatedFeedback: {
      intro: 'You were willing to be candid, but the depth jumped several stages ahead of the setting.',
      worked: [
        {
          quote: 'Thanks. What brought you to this session?',
          why: 'Good pivot back to a shared, relevant topic that put your seatmate at ease.',
        },
      ],
      pivot: {
        quote: 'No, my entire life has been in shambles lately and my therapist suggested I get out more.',
        whatHappened: 'Deep personal vulnerability in an opening turn creates an awkward burden on a stranger.',
        rewrite: 'First time for me. I wanted to stretch my comfort zone and try something new this weekend.',
      },
      tryNext: 'Share motivations at an activity level first before touching personal struggles.',
      skillVotes: [
        {
          skill: 'pacing what you share',
          stage: 'starting',
          reason: 'Over-shared significant personal hardship on turn one, followed by a decent topic recovery.',
        },
      ],
      partnerArc: 'The seatmate was startled by the sudden vulnerability, but relaxed when you asked about the class.',
    },
  },

  // 9. Awkward Silence at Lunch (no pivot)
  {
    id: 'fixture-09',
    name: 'Handling Silence at Lunch',
    style: 'Colleague lunch with peaceful pause',
    toneVariant: 'funny',
    scenario: {
      title: 'Cafeteria Table for Two',
      setting: 'Office lunchroom with sandwiches',
      userGoal: 'Allow silence comfortably without emergency filler',
    },
    transcript: [
      { role: 'user', text: 'These toasted panini sandwiches are surprisingly good today.' },
      { role: 'partner', text: 'Yeah, the pesto actually tastes fresh.' },
      { role: 'user', text: 'Mmm, definitely.' },
      { role: 'partner', text: '...' },
      { role: 'user', text: 'Nice to just sit and chew for a minute without looking at Slack.' },
      { role: 'partner', text: 'Amen to that. My screen time alert this morning was horrifying.' },
    ],
    thoughts: [
      { turnIndex: 1, thought: 'Good food, hungry.' },
      { turnIndex: 3, thought: 'Nice quiet pause, not stressed.' },
      { turnIndex: 5, thought: 'Haha, totally agree.' },
    ],
    playbook: {
      communicationStyle: 'Quiet, observant',
      scenarioWorld: 'Company cafeteria',
    },
    skillRubric: {
      skill: 'handling silence',
      description: 'Normalizing quiet moments without rushing to fill them with anxious chatter',
      targetBehaviors: ['Accept pauses comfortably', 'Re-enter with light observation', 'Keep pressure low'],
    },
    expectedPivot: false,
    simulatedFeedback: {
      intro: 'You let a quiet moment breathe over lunch instead of calling the conversational fire department.',
      worked: [
        {
          quote: 'Mmm, definitely.',
          why: 'Allowed the meal and pause to stand without rushing to invent an artificial prompt.',
        },
        {
          quote: 'Nice to just sit and chew for a minute without looking at Slack.',
          why: 'Reframed the quiet as a welcome sensory pause, which resonated with your colleague.',
        },
      ],
      pivot: null,
      tryNext: 'Keep trusting pauses when eating with coworkers; eating requires mouth downtime anyway.',
      skillVotes: [
        {
          skill: 'handling silence',
          stage: 'growing',
          reason: 'Handled silence with composure and rejoined the conversation organically.',
        },
      ],
      partnerArc: 'The colleague appreciated a quiet breather from a screen-heavy workday.',
    },
  },

  // 10. Follow-up message after meeting (no pivot)
  {
    id: 'fixture-10',
    name: 'Project Wrap Exit',
    style: 'Graceful ending after productive meeting',
    toneVariant: 'straight',
    scenario: {
      title: 'Post-Meeting Wrap-up',
      setting: 'Conference room door after a planning review',
      userGoal: 'Wrap up conversation promptly without lingering',
    },
    transcript: [
      { role: 'user', text: 'Looks like we have our action items for the migration plan.' },
      { role: 'partner', text: 'Yes, I will handle the staging dry run tomorrow afternoon.' },
      { role: 'user', text: 'Sounds solid. I am heading to prep my notes before my 3pm, but I will ping you on staging.' },
      { role: 'partner', text: 'Perfect. Talk soon!' },
    ],
    thoughts: [
      { turnIndex: 1, thought: 'Clear on my next steps.' },
      { turnIndex: 3, thought: 'Efficient, friendly wrap-up. Love that.' },
    ],
    playbook: {
      communicationStyle: 'Structured, direct',
      scenarioWorld: 'Tech consultancy',
    },
    skillRubric: {
      skill: 'graceful exits',
      description: 'Ending a conversation cleanly with warmth and forward connection',
      targetBehaviors: ['Summarize next steps', 'State reason for moving on', 'Friendly sign-off'],
    },
    expectedPivot: false,
    simulatedFeedback: {
      intro: 'You brought the meeting to a crisp, warm conclusion with zero lingering.',
      worked: [
        {
          quote: 'Looks like we have our action items for the migration plan.',
          why: 'Signaled the transition from discussion into action items clearly.',
        },
        {
          quote: 'Sounds solid. I am heading to prep my notes before my 3pm, but I will ping you on staging.',
          why: 'Gave a specific reason for leaving, reaffirmed collaboration, and closed with warmth.',
        },
      ],
      pivot: null,
      tryNext: 'Use this exact three-part formula (affirm, reason, forward ping) in remote video calls.',
      skillVotes: [
        {
          skill: 'graceful exits',
          stage: 'natural',
          reason: 'Executed a flawless wrap-up respecting both parties schedule.',
        },
      ],
      partnerArc: 'The partner felt organized and appreciated the prompt wrap-up.',
    },
  },
];
