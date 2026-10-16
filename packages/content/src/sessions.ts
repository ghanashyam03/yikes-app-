import type { SessionRecord } from './types.js';

export const SESSIONS: SessionRecord[] = [
  // ==================== UNIT 1: FOUNDATIONS ====================
  {
    id: 'session-01',
    unit: 1,
    sessionNumber: 1,
    title: 'The Opening Line',
    skill: 'starting_chat',
    level: 'friendly_one_to_one',
    idea: {
      rule: 'Anchor your first sentence to the room, not a clever line.',
      example: [
        { speaker: 'You', text: 'Have you managed to find the coffee machine yet, or is it hidden on this floor too?' },
        { speaker: 'Priya', text: 'Haha, took me three laps this morning! It is round the corner past the print room.' },
      ],
      whyWorks: 'Observing something immediate takes the pressure off both people. You are not putting on a performance; you are just sharing the room.',
    },
    watch: {
      title: 'Near the kitchen area',
      dialogue: [
        { speaker: 'Priya', text: 'Morning! How is your week starting off?', demonstratesSkill: false },
        { speaker: 'Marcus', text: 'Pretty steady so far. Love that mug by the way—is that an illustrated skyline?', demonstratesSkill: true },
        { speaker: 'Priya', text: 'It is! Picked it up in Tokyo last autumn. I drink all my tea from it.', demonstratesSkill: false },
      ],
      targetLineIndex: 1,
      explanation: 'Marcus anchored on a physical detail right in front of him, giving Priya an effortless topic to open up about.',
    },
    read: {
      scene: 'Priya stands near the office entrance looking over a fresh welcome packet.',
      dialogue: [
        { speaker: 'You', text: 'First morning here?' },
        { speaker: 'Priya', text: 'Yes! Just trying to figure out which badge scanner is the one that actually opens this door.' },
      ],
      candidateThoughts: [
        'She is feeling judged for struggling with the lock.',
        'She is lightly amused by the awkward badge scanner and glad someone said hello.',
        'She wants to be left alone to read her handbook in quiet.',
      ],
      trueIndex: 1,
      cueNote: 'Her shoulders relaxed and she smiled ruefully while waving the plastic badge.',
    },
    try: {
      personaId: 'priya',
      scenarioBrief: 'You run into Priya near the team lounge on her second morning.',
      hiddenMoodStart: { engagement: 0.7, rapport: 0.5, patience: 0.8, exitPressure: 0.1 },
      turnLimit: 4,
    },
    coachRubric: {
      worked: 'You used a simple, grounded opener that made it easy for Priya to chime in.',
      notYet: 'The opener felt distant or didn’t offer a clear hook for her to respond to.',
      sampleChats: [
        {
          chat: [
            { speaker: 'You', text: 'Hey Priya, how is the onboarding checklist going this morning?' },
            { speaker: 'Priya', text: 'Lots of tabs open, but getting through it!' },
          ],
          expectedFeedback: 'Anchoring on her onboarding experience made your greeting warm and relevant.',
        },
        {
          chat: [
            { speaker: 'You', text: 'Hello.' },
            { speaker: 'Priya', text: 'Oh, hi there!' },
          ],
          expectedFeedback: 'A single hello leaves all the heavy lifting to the other person. Give them a tiny hook.',
        },
      ],
    },
    outThere: [
      'Say one sentence about the shared space or weather to someone waiting nearby.',
      'Ask a colleague where they found a specific snack or beverage.',
      'Greet someone in the elevator with a simple warm observation.',
    ],
  },
  {
    id: 'session-02',
    unit: 1,
    sessionNumber: 2,
    title: 'One Good Follow-Up',
    skill: 'asking_followups',
    level: 'friendly_one_to_one',
    idea: {
      rule: 'Ask about the thing they got excited about, not the thing you want to say next.',
      example: [
        { speaker: 'Maya', text: 'We spent the weekend setting up a micro-roaster in the garage.' },
        { speaker: 'You', text: 'A micro-roaster? What made you decide to roast your own beans?' },
      ],
      whyWorks: 'People remember how you listened far more than what you contributed. Following their energy proves you are genuinely present.',
    },
    watch: {
      title: 'Monday morning catch-up',
      dialogue: [
        { speaker: 'Maya', text: 'I ended up reading three whole volumes of architectural essays over the long weekend.', demonstratesSkill: false },
        { speaker: 'Elena', text: 'Three volumes? Which design school did they focus on?', demonstratesSkill: true },
        { speaker: 'Maya', text: 'Mostly mid-century brutalism in London! The photography was incredible.', demonstratesSkill: false },
      ],
      targetLineIndex: 1,
      explanation: 'Elena caught the specific topic Maya emphasized and asked an open question about it.',
    },
    read: {
      scene: 'Maya walks over to the shared bench holding a folder of sprint graphs.',
      dialogue: [
        { speaker: 'You', text: 'How did the release review go?' },
        { speaker: 'Maya', text: 'Fine. We wrapped up early.' },
      ],
      candidateThoughts: [
        'She is furious with the engineering lead and is hiding it.',
        'Her mind is already on the next sprint roadmap and she is conserving conversational energy.',
        'She thought the question was intrusive.',
      ],
      trueIndex: 1,
      cueNote: 'Maya answered smoothly without tension, but her gaze was already scanning the next chart.',
    },
    try: {
      personaId: 'maya',
      scenarioBrief: 'Maya mentions a personal project she tinkered with over the weekend.',
      hiddenMoodStart: { engagement: 0.6, rapport: 0.5, patience: 0.7, exitPressure: 0.2 },
      turnLimit: 4,
    },
    coachRubric: {
      worked: 'You zoomed in on the key detail Maya emphasized and invited her to expand.',
      notYet: 'You asked a generic question or pivoted back to your own weekend prematurely.',
      sampleChats: [
        {
          chat: [
            { speaker: 'Maya', text: 'I finally tried sourdough baking yesterday. It was chaotic.' },
            { speaker: 'You', text: 'Chaotic in what way? Did the dough rise too fast?' },
          ],
          expectedFeedback: 'Great focus on her specific word "chaotic"—it showed you caught her story.',
        },
        {
          chat: [
            { speaker: 'Maya', text: 'I finally tried sourdough baking yesterday. It was chaotic.' },
            { speaker: 'You', text: 'Cool, I played tennis on Sunday.' },
          ],
          expectedFeedback: 'Pivoting straight to tennis leaves her sourdough comment stranded.',
        },
      ],
    },
    outThere: [
      'In your next conversation, ask one question about a word the other person stressed.',
      'When someone mentions a hobby, ask how they first got into it.',
      'Reflect a curious detail before asking your follow-up.',
    ],
  },
  {
    id: 'session-03',
    unit: 1,
    sessionNumber: 3,
    title: 'Showing You Heard',
    skill: 'acknowledging',
    level: 'colleague',
    idea: {
      rule: 'Echo the core point before offering your solution.',
      example: [
        { speaker: 'Alex', text: 'The warehouse handoff is running 40 minutes late every single Tuesday.' },
        { speaker: 'You', text: 'Forty minutes every Tuesday puts immediate stress on the afternoon schedule. Let us look at that bottleneck.' },
      ],
      whyWorks: 'When people feel acknowledged first, their resistance drops. Skipping validation makes even good advice feel like an interruption.',
    },
    watch: {
      title: 'Standup planning',
      dialogue: [
        { speaker: 'Alex', text: 'If we move this milestone forward, the QA team will have zero buffer for regressions.', demonstratesSkill: false },
        { speaker: 'David', text: 'Zero buffer for regressions is a serious risk. What if we keep the release branch isolated for two days?', demonstratesSkill: true },
        { speaker: 'Alex', text: 'That could actually protect us. Let us map that out.', demonstratesSkill: false },
      ],
      targetLineIndex: 1,
      explanation: 'David named Alex’s exact concern before suggesting a branching strategy, instantly securing buy-in.',
    },
    read: {
      scene: 'Alex closes a spreadsheet window and taps his pen on the desk.',
      dialogue: [
        { speaker: 'You', text: 'Are the quarterly logistics forecasts finalized yet?' },
        { speaker: 'Alex', text: 'Almost. Just waiting on regional shipping numbers from the west coast team.' },
      ],
      candidateThoughts: [
        'He is worried that the west coast team is deliberately delaying him.',
        'He has a tight schedule and wants to ensure the dependent tasks remain on time.',
        'He regrets taking ownership of the forecasting initiative.',
      ],
      trueIndex: 1,
      cueNote: 'His tone was focused and even; he glanced at his calendar grid rather than looking frustrated.',
    },
    try: {
      personaId: 'alex',
      scenarioBrief: 'Alex explains a scheduling conflict for an upcoming project sync.',
      hiddenMoodStart: { engagement: 0.5, rapport: 0.4, patience: 0.6, exitPressure: 0.3 },
      turnLimit: 4,
    },
    coachRubric: {
      worked: 'You mirrored Alex’s operational constraints before suggesting a next step.',
      notYet: 'You jumped straight to an alternative without showing you caught his constraint.',
      sampleChats: [
        {
          chat: [
            { speaker: 'Alex', text: 'I cannot attend at 3pm because of the vendor call.' },
            { speaker: 'You', text: 'Understood on the vendor call priority. Would a summary note or a 4:30 check-in work better?' },
          ],
          expectedFeedback: 'Acknowledging the vendor call priority kept the communication respectful and clean.',
        },
        {
          chat: [
            { speaker: 'Alex', text: 'I cannot attend at 3pm because of the vendor call.' },
            { speaker: 'You', text: 'Just reschedule the vendor call.' },
          ],
          expectedFeedback: 'Dismissing his scheduling conflict risks friction. Mirror the constraint first.',
        },
      ],
    },
    outThere: [
      'In a workplace chat, say "I hear that [point]" before sharing your suggestion.',
      'Summarize a teammate’s key requirement back to them in a short sentence.',
      'Acknowledge someone’s busy week before asking for a status update.',
    ],
  },
  {
    id: 'session-04',
    unit: 1,
    sessionNumber: 4,
    title: 'The Warm Exit',
    skill: 'graceful_exits',
    level: 'friendly_one_to_one',
    idea: {
      rule: 'State your leave warmly, thank them, and step away with certainty.',
      example: [
        { speaker: 'You', text: 'Sam, I want to let you get back to your code, but really glad we caught up on the architecture proposal.' },
        { speaker: 'Sam', text: 'Same here! Thanks for stopping by. Talk soon.' },
      ],
      whyWorks: 'Introverts often drag out departures because ending feels impolite. Clear exits are a gift—they free both people cleanly.',
    },
    watch: {
      title: 'Hallway conversation',
      dialogue: [
        { speaker: 'Sam', text: 'Yeah, the new compiler flags cut our local build time down by about 15%.', demonstratesSkill: false },
        { speaker: 'Chloe', text: 'That is huge! I need to head into my 11 o’clock sync now, but let us compare notes at standup.', demonstratesSkill: true },
        { speaker: 'Sam', text: 'Definitely. Have a good sync!', demonstratesSkill: false },
      ],
      targetLineIndex: 1,
      explanation: 'Chloe validated Sam’s point, named her departure reason warmly, and set a clean boundary without apologetic rambling.',
    },
    read: {
      scene: 'Sam stands by the window holding a notebook, looking up as footsteps approach.',
      dialogue: [
        { speaker: 'You', text: 'Hey Sam, did you have a minute to look at that ticket?' },
        { speaker: 'Sam', text: 'I glanced at it. Seems straightforward, though I have to push my commits before noon.' },
      ],
      candidateThoughts: [
        'He is annoyed that you approached his desk.',
        'He wants to help, but needs a clear boundary on time so he can hit his commit deadline.',
        'He thinks the ticket is poorly written.',
      ],
      trueIndex: 1,
      cueNote: 'Sam kept his notebook open and tilted his head kindly, signaling openness with a gentle time horizon.',
    },
    try: {
      personaId: 'sam',
      scenarioBrief: 'You have been chatting with Sam about workspace monitors and now need to leave for your task.',
      hiddenMoodStart: { engagement: 0.6, rapport: 0.6, patience: 0.8, exitPressure: 0.2 },
      turnLimit: 4,
    },
    coachRubric: {
      worked: 'You closed the conversation with warmth and clarity, leaving zero awkward hesitation.',
      notYet: 'You lingered or apologized for needing to leave instead of stepping away confidently.',
      sampleChats: [
        {
          chat: [
            { speaker: 'Sam', text: 'I use a curved screen at home, makes a difference for terminal windows.' },
            { speaker: 'You', text: 'I will definitely look into those. I need to get back to my desk now, but great chatting Sam!' },
          ],
          expectedFeedback: 'Clean, warm, and definite. Both of you walk away with energy intact.',
        },
        {
          chat: [
            { speaker: 'Sam', text: 'I use a curved screen at home, makes a difference for terminal windows.' },
            { speaker: 'You', text: 'Sorry to bother you, I am so sorry, I should probably go...' },
          ],
          expectedFeedback: 'No need to apologize for leaving! A warm thank-you works much better.',
        },
      ],
    },
    outThere: [
      'Use a warm, one-sentence exit line in your next hallway chat.',
      'Wrap up a phone call with "I want to respect your time, let us catch up again soon."',
      'Step away from a coffee chat without apologizing for leaving.',
    ],
  },
  {
    id: 'session-05',
    unit: 1,
    sessionNumber: 5,
    title: 'Reading a Short Reply',
    skill: 'reading_engagement',
    level: 'colleague',
    idea: {
      rule: 'Short replies usually signal low bandwidth, not disapproval.',
      example: [
        { speaker: 'Maya', text: 'Looks okay.' },
        { speaker: 'You', text: 'Sounds good. I will drop the link in the channel and we can review when you have breathing room.' },
      ],
      whyWorks: 'When someone gives a brief answer, over-explaining makes them feel trapped. Giving them an easy out builds long-term trust.',
    },
    watch: {
      title: 'Quick kitchen interaction',
      dialogue: [
        { speaker: 'You', text: 'Maya, did you have thoughts on the slide deck redesign?', demonstratesSkill: false },
        { speaker: 'Maya', text: 'Skimmed it. Heading into client briefing right now.', demonstratesSkill: false },
        { speaker: 'Tara', text: 'Understood. Go nail the briefing, we can chat this afternoon.', demonstratesSkill: true },
      ],
      targetLineIndex: 2,
      explanation: 'Tara recognized Maya’s focus was on the immediate briefing and released her instantly.',
    },
    read: {
      scene: 'Maya quickly sets down her laptop on the counter and checks an incoming ping.',
      dialogue: [
        { speaker: 'You', text: 'Hey Maya, how did the morning standup feel to you?' },
        { speaker: 'Maya', text: 'Standard. Covered the blockers.' },
      ],
      candidateThoughts: [
        'She is displeased with how the standup was facilitated.',
        'She is mentally triaging three pressing Slack notifications and keeping answers minimal.',
        'She thinks the question was completely unnecessary.',
      ],
      trueIndex: 1,
      cueNote: 'Her eyes darted to the top right of her screen where notifications were stacking up.',
    },
    try: {
      personaId: 'maya',
      scenarioBrief: 'Maya is responding in brief three-word answers while preparing for a client call.',
      hiddenMoodStart: { engagement: 0.4, rapport: 0.5, patience: 0.5, exitPressure: 0.6 },
      turnLimit: 4,
    },
    coachRubric: {
      worked: 'You respected her brief cadence and offered a low-friction conclusion.',
      notYet: 'You pushed for deeper discussion despite her clear signals of being occupied.',
      sampleChats: [
        {
          chat: [
            { speaker: 'Maya', text: 'Got it. Thanks.' },
            { speaker: 'You', text: 'No problem at all. We will touch base when things quiet down.' },
          ],
          expectedFeedback: 'Spot-on reading of her pace. You allowed her to return to her focus cleanly.',
        },
        {
          chat: [
            { speaker: 'Maya', text: 'Got it. Thanks.' },
            { speaker: 'You', text: 'Wait, are you sure? Why only two words? Are you upset with me?' },
          ],
          expectedFeedback: 'Interrogating brevity adds emotional weight to a busy colleague.',
        },
      ],
    },
    outThere: [
      'When someone replies in brief words, give them an easy exit rather than asking more.',
      'Notice if someone checks their device and wrap up your point promptly.',
      'Send a note offering to follow up asynchronously when someone looks busy.',
    ],
  },
  {
    id: 'session-06',
    unit: 1,
    sessionNumber: 6,
    title: 'Sharing a Little',
    skill: 'pacing_sharing',
    level: 'colleague',
    idea: {
      rule: 'Offer one concrete detail about yourself, then hand the microphone back.',
      example: [
        { speaker: 'You', text: 'I spent Saturday walking the ridge trail—usually need a few quiet miles after a heavy week. How do you usually reset?' },
        { speaker: 'Dev', text: 'Honestly, Saturday morning golf if the weather holds, otherwise reading in the study.' },
      ],
      whyWorks: 'Conversations stall when one person asks all the questions. Sharing one genuine sliver makes it a dialogue, not an interrogation.',
    },
    watch: {
      title: 'Water cooler chat',
      dialogue: [
        { speaker: 'Dev', text: 'Everyone looks exhausted this week.', demonstratesSkill: false },
        { speaker: 'Nisha', text: 'I definitely felt that yesterday. I took an hour off to walk along the canal and recharge. Did you get any fresh air over the weekend?', demonstratesSkill: true },
        { speaker: 'Dev', text: 'Managed thirty minutes in the garden before the rain started. Did wonders, honestly.', demonstratesSkill: false },
      ],
      targetLineIndex: 1,
      explanation: 'Nisha shared one relatable detail about herself and cleanly redirected the prompt to Dev.',
    },
    read: {
      scene: 'Dev sips tea from a ceramic cup between executive meetings.',
      dialogue: [
        { speaker: 'You', text: 'Looks like a packed day on your calendar.' },
        { speaker: 'Dev', text: 'Five back-to-back reviews today. Good to stretch my legs for two minutes.' },
      ],
      candidateThoughts: [
        'He wishes nobody was in the break room so he could sit in total silence.',
        'He appreciates a brief human moment of connection as long as it does not demand heavy problem solving.',
        'He wants to complain about the executive committee.',
      ],
      trueIndex: 1,
      cueNote: 'He leaned back against the counter with an unhurried posture and smiled faintly.',
    },
    try: {
      personaId: 'dev',
      scenarioBrief: 'You share a casual break room moment with Dev while waiting for hot water.',
      hiddenMoodStart: { engagement: 0.5, rapport: 0.5, patience: 0.6, exitPressure: 0.3 },
      turnLimit: 4,
    },
    coachRubric: {
      worked: 'You balanced a brief personal detail with an open invitation for Dev to share.',
      notYet: 'You either turned it into a one-sided monologue or asked questions without sharing anything.',
      sampleChats: [
        {
          chat: [
            { speaker: 'Dev', text: 'Coffee runs keep me going on days like this.' },
            { speaker: 'You', text: 'Same here, I switched to pour-over recently and it has been my morning ritual. What is your go-to roast?' },
          ],
          expectedFeedback: 'Sharing your morning ritual created a comfortable, reciprocal rhythm.',
        },
        {
          chat: [
            { speaker: 'Dev', text: 'Coffee runs keep me going on days like this.' },
            { speaker: 'You', text: 'What coffee do you drink? Why that one? Where do you buy it?' },
          ],
          expectedFeedback: 'Three questions in a row can feel like a quiz. Share one small detail first.',
        },
      ],
    },
    outThere: [
      'In a casual chat, share one real preference before asking their perspective.',
      'Mention a book, podcast, or walk you enjoyed this week.',
      'Answer a "how are you" with one specific true detail rather than just "good".',
    ],
  },
  {
    id: 'session-07',
    unit: 1,
    sessionNumber: 7,
    title: 'The Quiet Moment',
    skill: 'handling_silence',
    level: 'colleague',
    idea: {
      rule: 'A pause is thinking time, not an emergency.',
      example: [
        { speaker: 'Sam', text: 'We could refactor the entire schema... [three second pause] ...or keep the dual-write layer for another sprint.' },
        { speaker: 'You', text: '[Wait quietly, nodding thoughtfully until Sam finishes].' },
      ],
      whyWorks: 'Rushing to fill every quiet second cuts off thoughtful people before their best insight lands. Silence is where ideas take shape.',
    },
    watch: {
      title: 'Design review pause',
      dialogue: [
        { speaker: 'Sam', text: 'If we drop this column, old client versions might crash.', demonstratesSkill: false },
        { speaker: 'Sam', text: '...', demonstratesSkill: false },
        { speaker: 'Liam', text: 'Take your time. Let us think through the backward compatibility.', demonstratesSkill: true },
        { speaker: 'Sam', text: 'Right. If we add a deprecation warning first, we give them six weeks.', demonstratesSkill: false },
      ],
      targetLineIndex: 2,
      explanation: 'Liam held the space calmly without jumping in with frantic solutions, giving Sam room to arrive at the deprecation plan.',
    },
    read: {
      scene: 'Sam stares at the whiteboard diagram, marker capped in hand, quiet for several seconds.',
      dialogue: [
        { speaker: 'You', text: 'Do you think option B scales to multi-region?' },
        { speaker: 'Sam', text: '... [looks at the arrows on the board, tapping his chin]' },
      ],
      candidateThoughts: [
        'He forgot the question and is too embarrassed to ask you to repeat it.',
        'He is mentally tracing database replication lag across regions before answering.',
        'He thinks option B is a foolish idea and is annoyed.',
      ],
      trueIndex: 1,
      cueNote: 'His eyes traced the data path slowly from node to node without any signs of awkwardness.',
    },
    try: {
      personaId: 'sam',
      scenarioBrief: 'Sam takes a deliberate pause while contemplating an engineering architecture tradeoff.',
      hiddenMoodStart: { engagement: 0.6, rapport: 0.6, patience: 0.9, exitPressure: 0.1 },
      turnLimit: 4,
    },
    coachRubric: {
      worked: 'You gave Sam the space to process his thoughts without rushing the conversation.',
      notYet: 'You jumped in immediately with filler chatter during the natural pause.',
      sampleChats: [
        {
          chat: [
            { speaker: 'Sam', text: 'That could work... let me think about edge cases.' },
            { speaker: 'You', text: 'Take your time, no rush.' },
          ],
          expectedFeedback: 'Your calm reassurance signaled that thoughtful pauses are welcome.',
        },
        {
          chat: [
            { speaker: 'Sam', text: 'That could work... let me think about edge cases.' },
            { speaker: 'You', text: 'Hello? Did you hear me? Or maybe we do option C or D or E?' },
          ],
          expectedFeedback: 'Filling the pause rapidly overwhelms a thoughtful collaborator.',
        },
      ],
    },
    outThere: [
      'In a meeting today, count to three in your head before answering someone who just paused.',
      'Let a comfortable silence sit during a coffee break without reaching for your phone.',
      'Say "take your time" when a colleague pauses to think.',
    ],
  },
  {
    id: 'session-08',
    unit: 1,
    sessionNumber: 8,
    title: 'Your First Real-World Step',
    skill: 'keeping_balance',
    level: 'friendly_one_to_one',
    idea: {
      rule: 'Aim for a 50/50 rhythm: match the other person’s length and investment.',
      example: [
        { speaker: 'Rohan', text: 'I spent four hours fixing SQL indices on the telemetry table. Not how I planned to spend Tuesday.' },
        { speaker: 'You', text: 'Four hours in query plans sounds grueling. Did you at least get the query response time down?' },
      ],
      whyWorks: 'When someone shares two sentences, answering with ten sentences or two words breaks rapport. Mirroring their energy creates mutual ease.',
    },
    watch: {
      title: 'Afternoon coffee break',
      dialogue: [
        { speaker: 'Rohan', text: 'The new dashboard has too many vanity metrics. We only look at retention anyway.', demonstratesSkill: false },
        { speaker: 'Anya', text: 'Retention is definitely the anchor. Which three charts would you actually keep on the top row?', demonstratesSkill: true },
        { speaker: 'Rohan', text: 'Weekly cohorts, churn by tier, and daily active minutes. The rest is just noise.', demonstratesSkill: false },
      ],
      targetLineIndex: 1,
      explanation: 'Anya matched Rohan’s focused, direct tone and asked for his top three metrics without arguing.',
    },
    read: {
      scene: 'Rohan adjusts his glasses while reviewing an anomaly report on his tablet.',
      dialogue: [
        { speaker: 'You', text: 'Hey Rohan, did the experiment metrics look normal this morning?' },
        { speaker: 'Rohan', text: 'Variance is high in cohort B. Need another 48 hours of clean logs before making a call.' },
      ],
      candidateThoughts: [
        'He thinks your experiment is inherently flawed.',
        'He is taking a rigorous data-first approach and wants to avoid premature conclusions.',
        'He is tired of answering questions about experiments.',
      ],
      trueIndex: 1,
      cueNote: 'His explanation was matter-of-fact and steady, emphasizing his commitment to statistical confidence.',
    },
    try: {
      personaId: 'rohan',
      scenarioBrief: 'Rohan shares a skeptical view about a newly rolled-out process.',
      hiddenMoodStart: { engagement: 0.5, rapport: 0.5, patience: 0.7, exitPressure: 0.2 },
      turnLimit: 4,
    },
    coachRubric: {
      worked: 'You matched Rohan’s measured, analytical tone and engaged with his points.',
      notYet: 'You either dismissed his critique or replied with overly emotional rhetoric.',
      sampleChats: [
        {
          chat: [
            { speaker: 'Rohan', text: 'I am cautious about adopting this tool without a sandbox trial.' },
            { speaker: 'You', text: 'A sandbox trial makes total sense. What would be the main metric you want to evaluate during that trial?' },
          ],
          expectedFeedback: 'Meeting his skepticism with a structured evaluation proposal established immediate rapport.',
        },
        {
          chat: [
            { speaker: 'Rohan', text: 'I am cautious about adopting this tool without a sandbox trial.' },
            { speaker: 'You', text: 'Why are you always so negative? Everyone else loves it!' },
          ],
          expectedFeedback: 'Challenging his character instead of his reasoning shuts down productive discussion.',
        },
      ],
    },
    outThere: [
      'In your next conversation, notice how many sentences they speak and match their length.',
      'Acknowledge a peer’s skeptical point with curiosity instead of defense.',
      'Check in with a colleague whose feedback helped you improve a draft.',
    ],
  },

  // ==================== UNIT 2: EXPANDING HORIZONS ====================
  {
    id: 'session-09',
    unit: 2,
    sessionNumber: 9,
    title: 'Stepping into the Group',
    skill: 'groups',
    level: 'groups',
    idea: {
      rule: 'Step into the circle first, listen for the cadence, then link to the last thought.',
      example: [
        { speaker: 'Group', text: '...so we were debating whether the new office layout actually helps focus.' },
        { speaker: 'You', text: 'On that layout point—the acoustic phone booths on the 3rd floor made a huge difference for calls.' },
      ],
      whyWorks: 'Introverts often wait for someone to introduce them to an open group. Joining physically, smiling, and latching onto the active topic feels natural.',
    },
    watch: {
      title: 'Lunch gathering in the courtyard',
      dialogue: [
        { speaker: 'Priya', text: 'I tried three different sketching apps this month, but keep going back to paper.', demonstratesSkill: false },
        { speaker: 'Dev', text: 'Paper has zero battery anxiety. That is why I carry a pocket notebook.', demonstratesSkill: false },
        { speaker: 'Kiran', text: 'Pocket notebooks are great.riya, did you try that dot-grid brand from Kyoto?', demonstratesSkill: true },
        { speaker: 'Priya', text: 'Yes! The paper weight is so smooth. Let me show you my sketchbook.', demonstratesSkill: false },
      ],
      targetLineIndex: 2,
      explanation: 'Kiran stepped into the ongoing conversation smoothly by bridging the two previous points with a specific question.',
    },
    read: {
      scene: 'Three colleagues laugh around a shared table in the lunchroom.',
      dialogue: [
        { speaker: 'Priya', text: 'We were just discussing our favorite weekend coffee spots!' },
        { speaker: 'You', text: 'Mind if I sit here?' },
        { speaker: 'Priya', text: 'Please do! We were just getting to the roaster in Hackney.' },
      ],
      candidateThoughts: [
        'They are annoyed that an outsider disrupted their private conversation.',
        'They are genuinely glad to have another person join and want to hear your thoughts.',
        'They are waiting for you to leave before sharing their real opinions.',
      ],
      trueIndex: 1,
      cueNote: 'Priya immediately pulled out the adjacent chair and turned her body toward you welcomingly.',
    },
    try: {
      personaId: 'priya',
      scenarioBrief: 'You join Priya and another colleague who are talking about weekend hobbies.',
      hiddenMoodStart: { engagement: 0.8, rapport: 0.6, patience: 0.8, exitPressure: 0.1 },
      turnLimit: 4,
    },
    coachRubric: {
      worked: 'You stepped into the circle smoothly and contributed to the active topic.',
      notYet: 'You remained silent or changed the subject abruptly upon joining.',
      sampleChats: [
        {
          chat: [
            { speaker: 'Priya', text: 'We were just debating where to get team lunch on Friday!' },
            { speaker: 'You', text: 'If everyone likes noodles, that new hand-pulled place down the street has big tables.' },
          ],
          expectedFeedback: 'Connecting directly to their active discussion made your entry seamless.',
        },
        {
          chat: [
            { speaker: 'Priya', text: 'We were just debating where to get team lunch on Friday!' },
            { speaker: 'You', text: 'My internet at home stopped working.' },
          ],
          expectedFeedback: 'Pivoting away from their topic makes the entry feel disjointed.',
        },
      ],
    },
    outThere: [
      'Stand near an open group discussion and listen for a natural moment to chime in.',
      'Add one supportive sentence to a group thread or discussion at work.',
      'Pull up a chair at a communal table and offer a warm greeting.',
    ],
  },
  {
    id: 'session-10',
    unit: 2,
    sessionNumber: 10,
    title: 'Bridging from Small Talk',
    skill: 'bridging_small_talk',
    level: 'colleague',
    idea: {
      rule: 'Use a casual observation to bridge into something genuine.',
      example: [
        { speaker: 'Alex', text: 'Weather was surprisingly dry this weekend.' },
        { speaker: 'You', text: 'Yeah, got out for a long cycle ride. I noticed your team just kicked off the supply chain overhaul—how is the transition going?' },
      ],
      whyWorks: 'Small talk is an on-ramp, not the destination. A clean bridge respects social pleasantries while shifting smoothly to real substance.',
    },
    watch: {
      title: 'Pre-meeting lobby chat',
      dialogue: [
        { speaker: 'Alex', text: 'Traffic around the ring road was backed up this morning.', demonstratesSkill: false },
        { speaker: 'You', text: 'It was rough out there. Speaking of timing, how are the vendor agreements shaping up for our pilot?', demonstratesSkill: true },
        { speaker: 'Alex', text: 'Just finalized the terms yesterday. Let me show you the key clauses.', demonstratesSkill: false },
      ],
      targetLineIndex: 1,
      explanation: 'The speaker acknowledged the traffic remark briefly, then bridged smoothly to the upcoming pilot agenda.',
    },
    read: {
      scene: 'Alex waits by the screen projector, adjusting display cables.',
      dialogue: [
        { speaker: 'You', text: 'Coffee in the lobby was surprisingly good today.' },
        { speaker: 'Alex', text: 'Yeah, they got new beans. Hey, do you know if the finance deck is loaded on this laptop?' },
      ],
      candidateThoughts: [
        'He thought your coffee comment was trivial and wants to scold you.',
        'He is ready to get to business and is politely bridging to the meeting deck.',
        'He is irritated by projector cables.',
      ],
      trueIndex: 1,
      cueNote: 'His voice remained completely pleasant, simply shifting focus to the upcoming presentation.',
    },
    try: {
      personaId: 'alex',
      scenarioBrief: 'Alex initiates small talk before a project sync; you want to steer into the agenda.',
      hiddenMoodStart: { engagement: 0.5, rapport: 0.5, patience: 0.6, exitPressure: 0.3 },
      turnLimit: 4,
    },
    coachRubric: {
      worked: 'You linked the surface observation to the project topic without an awkward jolt.',
      notYet: 'You either lingered in endless pleasantries or cut off the small talk abruptly.',
      sampleChats: [
        {
          chat: [
            { speaker: 'Alex', text: 'Busy week ahead with all these client visits.' },
            { speaker: 'You', text: 'Definitely packed. On that note, did you want to review the slide order for the 2pm client?' },
          ],
          expectedFeedback: 'Using "on that note" created a seamless pivot from calendar busywork to your presentation.',
        },
        {
          chat: [
            { speaker: 'Alex', text: 'Busy week ahead with all these client visits.' },
            { speaker: 'You', text: 'Forget that, look at this slide right now.' },
          ],
          expectedFeedback: 'Abruptly demanding focus can feel jarring. Bridge with a transitional phrase first.',
        },
      ],
    },
    outThere: [
      'Bridge from a comment about the day into a question about a project.',
      'Use "speaking of [theme]..." to pivot a chat into deeper ground.',
      'Transition a coffee talk into a 1-minute work alignment smoothly.',
    ],
  },
  {
    id: 'session-11',
    unit: 2,
    sessionNumber: 11,
    title: 'Speaking to Someone Busy',
    skill: 'starting_chat',
    level: 'senior_busy',
    idea: {
      rule: 'State your purpose and your time estimate in your very first sentence.',
      example: [
        { speaker: 'You', text: 'Dev, I have a two-minute decision on the cloud hosting contract before the end of the day. Do you have a moment now or should I ping you at 3?' },
        { speaker: 'Dev', text: 'Give it to me now while I walk to my desk.' },
      ],
      whyWorks: 'Busy leaders dread open-ended conversations with unknown endings. Giving an exact time limit and clear goal lets them say yes with relief.',
    },
    watch: {
      title: 'Executive suite corridor',
      dialogue: [
        { speaker: 'Dev', text: 'Running between strategy meetings all afternoon.', demonstratesSkill: false },
        { speaker: 'Meera', text: 'Dev, thirty seconds on the design sign-off: engineering approved the staging build, do you want to review the prototype or trust the team verdict?', demonstratesSkill: true },
        { speaker: 'Dev', text: 'Trust the team verdict. Ship it. Great job keeping this quick Meera.', demonstratesSkill: false },
      ],
      targetLineIndex: 1,
      explanation: 'Meera specified thirty seconds, framed the exact binary choice, and got an immediate decision without taking extra time.',
    },
    read: {
      scene: 'Dev glances down at his smartwatch while walking toward the elevator bank.',
      dialogue: [
        { speaker: 'You', text: 'Dev, do you have a quick second?' },
        { speaker: 'Dev', text: 'Board pre-read is due in fifteen minutes—is it urgent or can it wait until standup tomorrow?' },
      ],
      candidateThoughts: [
        'He is angry that you interrupted his walk.',
        'He is under strict deadline pressure and needs you to help him prioritize the request.',
        'He does not care about your project.',
      ],
      trueIndex: 1,
      cueNote: 'His query was practical and focused, giving you an explicit choice based on urgency.',
    },
    try: {
      personaId: 'dev',
      scenarioBrief: 'You approach Dev in the hallway to get high-level alignment on a resource request.',
      hiddenMoodStart: { engagement: 0.4, rapport: 0.4, patience: 0.5, exitPressure: 0.6 },
      turnLimit: 4,
    },
    coachRubric: {
      worked: 'You led with the headline and time constraint, making it easy for Dev to respond.',
      notYet: 'You opened with vague wandering pleasantries that increased his exit pressure.',
      sampleChats: [
        {
          chat: [
            { speaker: 'Dev', text: 'I have three minutes before my sync.' },
            { speaker: 'You', text: 'One-minute decision: we need to choose between vendor A and B for storage. Vendor A saves 15% but takes two weeks longer. Which direction do you lean?' },
          ],
          expectedFeedback: 'Crisp executive summary with clear tradeoff options. Dev could decide in seconds.',
        },
        {
          chat: [
            { speaker: 'Dev', text: 'I have three minutes before my sync.' },
            { speaker: 'You', text: 'Well, it all started back in August when we first thought about files, and then...' },
          ],
          expectedFeedback: 'Starting with back-history when someone has 3 minutes creates stress. Start with the decision.',
        },
      ],
    },
    outThere: [
      'In your next message to a senior leader, state the time required upfront ("2-minute check").',
      'Frame a decision as a clear choice between two options.',
      'Lead a status update with the headline before the supporting details.',
    ],
  },
  {
    id: 'session-12',
    unit: 2,
    sessionNumber: 12,
    title: 'Disagreeing Without Friction',
    skill: 'polite_disagreement',
    level: 'colleague',
    idea: {
      rule: 'Validate their underlying intention before offering your alternate path.',
      example: [
        { speaker: 'Rohan', text: 'We should cancel the third-party survey—nobody fills those out anyway.' },
        { speaker: 'You', text: 'I completely agree that low completion rates waste budget. What if we keep it to three SMS questions instead of a full survey?' },
      ],
      whyWorks: 'People defend their position when they feel misunderstood. Showing that you share their ultimate objective turns a conflict into a joint puzzle.',
    },
    watch: {
      title: 'Sprint retro debate',
      dialogue: [
        { speaker: 'Rohan', text: 'Moving to two-week sprints will just double our planning overhead.', demonstratesSkill: false },
        { speaker: 'Siddharth', text: 'I share your concern about meeting fatigue. What if we cap planning at 45 minutes and pilot it for two cycles?', demonstratesSkill: true },
        { speaker: 'Rohan', text: 'If we strictly enforce the 45-minute cap, I am open to testing it.', demonstratesSkill: false },
      ],
      targetLineIndex: 1,
      explanation: 'Siddharth validated Rohan’s concern about meeting fatigue before proposing a capped time pilot.',
    },
    read: {
      scene: 'Rohan leans back with his arms crossed, reviewing the revised project timeline.',
      dialogue: [
        { speaker: 'You', text: 'We were thinking of launching the beta on the 15th.' },
        { speaker: 'Rohan', text: 'That is unrealistic unless QA works over the weekend, which I will not sign off on.' },
      ],
      candidateThoughts: [
        'He dislikes the product team and wants the launch to fail.',
        'He is fiercely protective of his team’s well-being and needs a timeline that respects their working hours.',
        'He has personal plans on the 15th.',
      ],
      trueIndex: 1,
      cueNote: 'His objection was framed around team workload and sustainable execution, not hostility.',
    },
    try: {
      personaId: 'rohan',
      scenarioBrief: 'Rohan objects to a proposed change in data reporting frequency.',
      hiddenMoodStart: { engagement: 0.6, rapport: 0.4, patience: 0.6, exitPressure: 0.3 },
      turnLimit: 4,
    },
    coachRubric: {
      worked: 'You aligned with Rohan’s core priority before putting forward your alternative.',
      notYet: 'You countered his objection defensively without acknowledging his point.',
      sampleChats: [
        {
          chat: [
            { speaker: 'Rohan', text: 'Daily reporting will just create noise that nobody acts on.' },
            { speaker: 'You', text: 'I agree that vanity noise is unhelpful. What if we only alert on threshold anomalies and keep the summary weekly?' },
          ],
          expectedFeedback: 'Acknowledging the risk of noise and proposing anomaly alerts resolved his objection constructively.',
        },
        {
          chat: [
            { speaker: 'Rohan', text: 'Daily reporting will just create noise that nobody acts on.' },
            { speaker: 'You', text: 'You are wrong, executive management requested it.' },
          ],
          expectedFeedback: 'Dismissing his insight provokes defensive resistance. Align on purpose first.',
        },
      ],
    },
    outThere: [
      'Say "I agree with your goal of [X], what if we tried [Y]?" when you disagree.',
      'Acknowledge the valid piece of someone’s critique before presenting another angle.',
      'Ask a question that clarifies their concern rather than pushing your proposal.',
    ],
  },
  {
    id: 'session-13',
    unit: 2,
    sessionNumber: 13,
    title: 'Leaving a Group Conversation',
    skill: 'graceful_exits',
    level: 'groups',
    idea: {
      rule: 'Wait for a natural sentence break, wave with a smile, and step back without pausing the whole group.',
      example: [
        { speaker: 'Group', text: '...and so that is how we ended up finding the best bakery in town.' },
        { speaker: 'You', text: 'That bakery sounds incredible! I am going to slip away to grab some water, but great chatting everyone.' },
      ],
      whyWorks: 'Introverts often get trapped in circles because they feel leaving requires interrupting everyone. A quiet, warm wave lets the conversation flow on.',
    },
    watch: {
      title: 'Team reception terrace',
      dialogue: [
        { speaker: 'Maya', text: '...and the client signed off on the revised statement of work right before 5pm.', demonstratesSkill: false },
        { speaker: 'Alex', text: 'Huge relief after that three-week standstill.', demonstratesSkill: false },
        { speaker: 'Julian', text: 'Fantastic win Maya! I am going to slip over to catch the catering before it wraps up, see you all in a bit.', demonstratesSkill: true },
        { speaker: 'Maya', text: 'Go grab some food Julian! Talk soon.', demonstratesSkill: false },
      ],
      targetLineIndex: 2,
      explanation: 'Julian celebrated the win, gave a warm simple reason for stepping away, and departed without stalling the circle.',
    },
    read: {
      scene: 'Maya and two other managers stand near the exit of the presentation hall, chatting animatedly.',
      dialogue: [
        { speaker: 'Maya', text: 'The keynote speaker really nailed that point on user trust.' },
        { speaker: 'Colleague', text: 'Absolutely, especially the case study on transparency.' },
      ],
      candidateThoughts: [
        'She is testing if anyone in the circle will notice she is getting tired of standing.',
        'She is engaged with the topic, but would completely understand if someone stepped away to catch their train.',
        'She expects everyone to stay together until the reception closes.',
      ],
      trueIndex: 1,
      cueNote: 'Her body language was relaxed and open, shifting smoothly to accommodate people moving past.',
    },
    try: {
      personaId: 'maya',
      scenarioBrief: 'You are in a lively group chat with Maya and colleagues, and you need to depart for the evening.',
      hiddenMoodStart: { engagement: 0.7, rapport: 0.7, patience: 0.8, exitPressure: 0.2 },
      turnLimit: 4,
    },
    coachRubric: {
      worked: 'You stepped away from the group with warmth and confidence without derailing the discussion.',
      notYet: 'You vanished silently like a ghost or dragged out a lengthy goodbye with each person.',
      sampleChats: [
        {
          chat: [
            { speaker: 'Maya', text: 'That case study was so good!' },
            { speaker: 'You', text: 'It really was! I am going to head home for the evening, but see you all at standup tomorrow.' },
          ],
          expectedFeedback: 'Warm, gracious, and effortless. The group smiles and continues their flow.',
        },
        {
          chat: [
            { speaker: 'Maya', text: 'That case study was so good!' },
            { speaker: 'You', text: 'Excuse me everyone! Can everyone stop talking? I have an announcement: I am leaving.' },
          ],
          expectedFeedback: 'Stopping the whole group puts unnecessary spotlight on your departure.',
        },
      ],
    },
    outThere: [
      'In a group chat, give a warm wave and step away when a natural topic wraps up.',
      'Leave a social gathering after saying a warm goodbye to the host.',
      'Step away from a lunch table with a simple "Catch you all this afternoon."',
    ],
  },
  {
    id: 'session-14',
    unit: 2,
    sessionNumber: 14,
    title: 'Handling a Pause in a Meeting',
    skill: 'handling_silence',
    level: 'senior_busy',
    idea: {
      rule: 'When an executive goes quiet, let them think—do not start negotiating against yourself.',
      example: [
        { speaker: 'You', text: 'We recommend allocating the remaining budget to the backend migration.' },
        { speaker: 'Dev', text: '... [stares at the numbers for four seconds]' },
        { speaker: 'You', text: '[Hold posture calmly without rushing in to lower the budget request].' },
      ],
      whyWorks: 'Anxious speakers panic during pauses and offer concessions that nobody asked for. Holding your ground quietly projects competence.',
    },
    watch: {
      title: 'Budget allocation review',
      dialogue: [
        { speaker: 'You', text: 'That brings the total headcount need to two junior data analysts.', demonstratesSkill: false },
        { speaker: 'Dev', text: '...', demonstratesSkill: false },
        { speaker: 'You', text: '[Maintains eye contact quietly, letting Dev review the ledger].', demonstratesSkill: true },
        { speaker: 'Dev', text: 'Makes sense. Two analysts fit within our quarterly guidance. Approved.', demonstratesSkill: false },
      ],
      targetLineIndex: 2,
      explanation: 'By staying quiet rather than second-guessing the ask, the speaker allowed Dev to verify the figures and approve.',
    },
    read: {
      scene: 'Dev sits at the head of the conference table, chin in hand, reading your one-page proposal.',
      dialogue: [
        { speaker: 'You', text: 'Here is the summary of the rollout timeline.' },
        { speaker: 'Dev', text: '... [reads through the milestones without speaking for five seconds]' },
      ],
      candidateThoughts: [
        'He is formulating a harsh critique of the timeline.',
        'He is evaluating the timeline against other corporate dependencies and digesting the facts.',
        'He has stopped paying attention completely.',
      ],
      trueIndex: 1,
      cueNote: 'His pen traced the milestone dates steadily; his expression remained thoughtful, not combative.',
    },
    try: {
      personaId: 'dev',
      scenarioBrief: 'Dev goes quiet while reviewing your proposal during a one-on-one checkpoint.',
      hiddenMoodStart: { engagement: 0.5, rapport: 0.4, patience: 0.7, exitPressure: 0.3 },
      turnLimit: 4,
    },
    coachRubric: {
      worked: 'You held the silence comfortably without negotiating against your own proposal.',
      notYet: 'You interrupted Dev’s thinking time by backtracking or rambling nervously.',
      sampleChats: [
        {
          chat: [
            { speaker: 'Dev', text: 'Let me look at this chart for a second.' },
            { speaker: 'You', text: 'Sure thing, take all the time you need.' },
          ],
          expectedFeedback: 'You respected his thinking time and protected your recommendation.',
        },
        {
          chat: [
            { speaker: 'Dev', text: 'Let me look at this chart for a second.' },
            { speaker: 'You', text: 'If it is too expensive we can cut it in half or cancel it entirely please do not be mad!' },
          ],
          expectedFeedback: 'Bargaining against yourself during his quiet read undercuts your confidence.',
        },
      ],
    },
    outThere: [
      'After stating your proposal in a meeting, pause and wait for them to speak first.',
      'Count five slow breaths while someone reviews your document.',
      'Notice when an executive is reading and hold the room quietly.',
    ],
  },
  {
    id: 'session-15',
    unit: 2,
    sessionNumber: 15,
    title: 'Following Up After the Chat',
    skill: 'following_up',
    level: 'colleague',
    idea: {
      rule: 'Send a two-line note referencing one specific thought they shared, with no ask attached.',
      example: [
        { speaker: 'You', text: 'Hey Alex, really appreciated your point about the warehouse bottleneck earlier. I checked that dispatch log and you were spot on. Hope the rest of your afternoon is smooth.' },
        { speaker: 'Alex', text: 'Appreciate the note! Glad the log check verified it.' },
      ],
      whyWorks: 'Most follow-ups ask for something. A note that simply validates their insight cements connection with zero social debt.',
    },
    watch: {
      title: 'Post-sync Slack exchange',
      dialogue: [
        { speaker: 'Alex', text: 'Good sync today. Let us keep moving.', demonstratesSkill: false },
        { speaker: 'Zara', text: 'Thanks Alex! Your point on the staging migration really clarified things for the junior devs. Talk soon.', demonstratesSkill: true },
        { speaker: 'Alex', text: 'Glad it helped Zara. Appreciate the note!', demonstratesSkill: false },
      ],
      targetLineIndex: 1,
      explanation: 'Zara referenced the exact staging topic Alex highlighted, providing sincere praise with zero pressure.',
    },
    read: {
      scene: 'Alex checks his direct messages after an afternoon cross-functional sync.',
      dialogue: [
        { speaker: 'Alex', text: 'Sent the meeting notes to the channel.' },
        { speaker: 'You', text: 'Thanks Alex. That routing idea you had during Q&A made a lot of sense.' },
      ],
      candidateThoughts: [
        'He suspects you are flattering him to ask for a favor later.',
        'He feels valued that his technical contribution was recognized by a peer.',
        'He wishes you had sent an email instead.',
      ],
      trueIndex: 1,
      cueNote: 'He reacted immediately with a thumbs-up emoji and a warm one-line reply.',
    },
    try: {
      personaId: 'alex',
      scenarioBrief: 'You send a brief follow-up note to Alex after he gave you valuable feedback on a process.',
      hiddenMoodStart: { engagement: 0.6, rapport: 0.5, patience: 0.7, exitPressure: 0.2 },
      turnLimit: 4,
    },
    coachRubric: {
      worked: 'You sent a specific, appreciative follow-up that required no awkward obligations.',
      notYet: 'Your follow-up was generic or bundled with new demands.',
      sampleChats: [
        {
          chat: [
            { speaker: 'Alex', text: 'Let me know if those workflow templates made sense.' },
            { speaker: 'You', text: 'They were super clear—the checklist section especially saved us an hour this morning. Thanks for sharing!' },
          ],
          expectedFeedback: 'Naming the checklist section made your appreciation sincere and specific.',
        },
        {
          chat: [
            { speaker: 'Alex', text: 'Let me know if those workflow templates made sense.' },
            { speaker: 'You', text: 'Thanks. Also can you do my entire spreadsheet by tomorrow?' },
          ],
          expectedFeedback: 'Tacking on an immediate demand detracts from genuine follow-up appreciation.',
        },
      ],
    },
    outThere: [
      'Send a short message thanking a colleague for a specific point they made in a meeting.',
      'Share an article related to something a peer mentioned last week.',
      'Check in on a teammate’s project milestone with a zero-pressure note.',
    ],
  },
  {
    id: 'session-16',
    unit: 2,
    sessionNumber: 16,
    title: 'Holding Your Ground Calmly',
    skill: 'polite_disagreement',
    level: 'high_stakes',
    idea: {
      rule: 'Separate your tone from your conviction: gentle voice, firm boundaries.',
      example: [
        { speaker: 'Rohan', text: 'We simply cannot delay the feature branch for another security audit.' },
        { speaker: 'You', text: 'I understand the release deadline is tight, but shipping without audit verification exposes our users to real risk. I cannot approve bypassing the check.' },
      ],
      whyWorks: 'Introverts often equate firmness with aggression, so they soften until they cave. You can be deeply polite while remaining completely immovable.',
    },
    watch: {
      title: 'Steering committee debate',
      dialogue: [
        { speaker: 'Rohan', text: 'If we wait another week for customer interviews, competitor X will launch first.', demonstratesSkill: false },
        { speaker: 'Nadia', text: 'I hear the competitive urgency Rohan. However, launching with unverified assumptions will cost us more in churn. We need to complete the four remaining interviews.', demonstratesSkill: true },
        { speaker: 'Rohan', text: '...Understood. Let us expedite those four interviews by Thursday.', demonstratesSkill: false },
      ],
      targetLineIndex: 1,
      explanation: 'Nadia acknowledged Rohan’s urgency respectfully, but held the boundary on customer validation with calm clarity.',
    },
    read: {
      scene: 'Rohan sits with arms folded in a high-stakes roadmap negotiation.',
      dialogue: [
        { speaker: 'Rohan', text: 'If your team takes three weeks for documentation, our sprint velocity metrics will drop.' },
        { speaker: 'You', text: 'I understand velocity is tracked closely, but unmaintained code causes twice the tickets down the road.' },
      ],
      candidateThoughts: [
        'He is preparing to escalate the disagreement to executive leadership.',
        'He respects that you are defending code health with reasons rather than backing down nervously.',
        'He feels personally insulted by your stance.',
      ],
      trueIndex: 1,
      cueNote: 'Rohan nodded slowly as he looked at your data sheet; his posture shifted from challenging to analytical.',
    },
    try: {
      personaId: 'rohan',
      scenarioBrief: 'Rohan pushes to skip quality assurance checks before a major release.',
      hiddenMoodStart: { engagement: 0.7, rapport: 0.4, patience: 0.5, exitPressure: 0.3 },
      turnLimit: 4,
    },
    coachRubric: {
      worked: 'You maintained a gentle, professional tone while holding firm on your standard.',
      notYet: 'You either capitulated under pressure or turned aggressive and personal.',
      sampleChats: [
        {
          chat: [
            { speaker: 'Rohan', text: 'We have to skip the staging pass if we want to hit the Friday target.' },
            { speaker: 'You', text: 'I know hitting Friday is important to all of us. But skipping staging puts production stability at risk, so we need to run the suite.' },
          ],
          expectedFeedback: 'Calm, respectful, and unwavering. You demonstrated that gentleness and backbone co-exist.',
        },
        {
          chat: [
            { speaker: 'Rohan', text: 'We have to skip the staging pass if we want to hit the Friday target.' },
            { speaker: 'You', text: 'Okay fine, whatever you say, do not blame me if everything breaks.' },
          ],
          expectedFeedback: 'Passive compliance leaves everyone vulnerable. Hold the standard calmly.',
        },
      ],
    },
    outThere: [
      'In a discussion today, say "I see your perspective, but my recommendation remains [X]" without apologizing.',
      'Set one clear boundary on your availability with a calm, warm sentence.',
      'Protect an engineering or quality standard calmly in your next project review.',
    ],
  },
];

export function getSessionById(id: string): SessionRecord | undefined {
  return SESSIONS.find((s) => s.id === id);
}

export function getSessionsByUnit(unit: 1 | 2): SessionRecord[] {
  return SESSIONS.filter((s) => s.unit === unit);
}
