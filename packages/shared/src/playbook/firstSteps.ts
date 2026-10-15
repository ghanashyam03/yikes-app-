export interface FirstStep {
  id: string;
  title: string;
  category: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  action: string;
}

export const FIRST_STEPS_LIBRARY: readonly FirstStep[] = [
  // Difficulty 1
  {
    id: 'step-01',
    title: 'Warm greeting',
    category: 'Small talk',
    difficulty: 1,
    action: 'Say good morning or hello to a neighbour, barista, or receptionist'
  },
  {
    id: 'step-02',
    title: 'Passing acknowledgment',
    category: 'Speaking up',
    difficulty: 1,
    action: 'Give one clear nod and friendly smile to a passing colleague'
  },
  {
    id: 'step-03',
    title: 'Simple curiosity',
    category: 'Small talk',
    difficulty: 1,
    action: 'Ask a teammate one simple question about their weekend or week'
  },
  {
    id: 'step-04',
    title: 'Thank-you connection',
    category: 'Graceful exits',
    difficulty: 1,
    action: 'Hold brief eye contact and say thank you after a purchase or delivery'
  },
  {
    id: 'step-05',
    title: 'Low-stakes check-in',
    category: 'Following up',
    difficulty: 1,
    action: 'Send a warm, one-line check-in text to a friend you have not seen recently'
  },

  // Difficulty 2
  {
    id: 'step-06',
    title: 'One follow-up',
    category: 'Following up',
    difficulty: 2,
    action: 'Ask one curious follow-up question when someone shares a bit of news'
  },
  {
    id: 'step-07',
    title: 'Thirty-second remark',
    category: 'Small talk',
    difficulty: 2,
    action: 'Make a 30-second casual remark about the room, weather, or commute'
  },
  {
    id: 'step-08',
    title: 'Early arrival greeting',
    category: 'Meetings',
    difficulty: 2,
    action: 'Join a meeting or call 2 minutes early and greet the first person there'
  },
  {
    id: 'step-09',
    title: 'Lunchtime observation',
    category: 'Groups',
    difficulty: 2,
    action: 'Share one short, light observation while getting coffee or lunch'
  },
  {
    id: 'step-10',
    title: 'Specific appreciation',
    category: 'Making friends',
    difficulty: 2,
    action: 'Give a specific, genuine compliment on someone’s work or helpful idea'
  },

  // Difficulty 3
  {
    id: 'step-11',
    title: 'Early voice in meetings',
    category: 'Meetings',
    difficulty: 3,
    action: 'Speak up at least once in the first 10 minutes of a meeting'
  },
  {
    id: 'step-12',
    title: 'Self-introduction',
    category: 'Networking',
    difficulty: 3,
    action: 'Introduce yourself to one new person at an event or cross-team gathering'
  },
  {
    id: 'step-13',
    title: 'Graceful exit line',
    category: 'Graceful exits',
    difficulty: 3,
    action: 'Use a clean exit phrase: "I will let you get on, great catching up"'
  },
  {
    id: 'step-14',
    title: 'Open question in chat',
    category: 'Groups',
    difficulty: 3,
    action: 'Ask an open-ended question in a group channel to invite thoughts'
  },
  {
    id: 'step-15',
    title: 'Post-discussion note',
    category: 'Following up',
    difficulty: 3,
    action: 'Send a short follow-up note after an interesting 1-on-1 discussion'
  },

  // Difficulty 4
  {
    id: 'step-16',
    title: 'Gentle counter-perspective',
    category: 'Speaking up',
    difficulty: 4,
    action: 'Share an alternative viewpoint gently: "Another way to look at this is..."'
  },
  {
    id: 'step-17',
    title: 'Five minutes of counsel',
    category: 'Meetings',
    difficulty: 4,
    action: 'Ask a senior colleague for 5 minutes of targeted advice on a topic'
  },
  {
    id: 'step-18',
    title: 'New table connection',
    category: 'Making friends',
    difficulty: 4,
    action: 'Sit with a group of colleagues you do not know well at lunch'
  },
  {
    id: 'step-19',
    title: 'Comfortable pause',
    category: 'Graceful exits',
    difficulty: 4,
    action: 'Hold a calm, comfortable three-second pause before responding in conversation'
  },
  {
    id: 'step-20',
    title: 'Gathering icebreaker',
    category: 'Networking',
    difficulty: 4,
    action: 'Walk over and start a conversation with someone standing alone at an event'
  },

  // Difficulty 5
  {
    id: 'step-21',
    title: 'Floor question',
    category: 'Speaking up',
    difficulty: 5,
    action: 'Ask a thoughtful question from the floor in an all-hands or workshop'
  },
  {
    id: 'step-22',
    title: 'Coffee invitation',
    category: 'Networking',
    difficulty: 5,
    action: 'Reach out to a professional contact to invite them for a 15-minute coffee chat'
  },
  {
    id: 'step-23',
    title: 'Meeting proposal',
    category: 'Meetings',
    difficulty: 5,
    action: 'Propose a substantive initiative or change in a high-stakes group setting'
  },
  {
    id: 'step-24',
    title: 'Principled disagreement',
    category: 'Speaking up',
    difficulty: 5,
    action: 'Navigate a polite disagreement constructively in a formal setting'
  }
];
