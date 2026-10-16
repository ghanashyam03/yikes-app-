import type { PersonaInfo, SessionData } from './types';

export const PERSONAS: Record<string, PersonaInfo> = {
  maya: {
    id: 'maya',
    name: 'Maya',
    role: 'Senior product colleague',
    palette: { primary: '#AFCDB8', secondary: '#E6C278' },
  },
  alex: {
    id: 'alex',
    name: 'Alex',
    role: 'Operations manager',
    palette: { primary: '#7BB3D6', secondary: '#B9A8D9' },
  },
  sam: {
    id: 'sam',
    name: 'Sam',
    role: 'Lead engineer',
    palette: { primary: '#B9A8D9', secondary: '#AFCDB8' },
  },
  dev: {
    id: 'dev',
    name: 'Dev',
    role: 'Vice President of Strategy',
    palette: { primary: '#E6C278', secondary: '#7BB3D6' },
  },
  priya: {
    id: 'priya',
    name: 'Priya',
    role: 'Associate product designer',
    palette: { primary: '#B9A8D9', secondary: '#E6C278' },
  },
  rohan: {
    id: 'rohan',
    name: 'Rohan',
    role: 'Senior data analyst',
    palette: { primary: '#7BB3D6', secondary: '#AFCDB8' },
  },
};

export const SESSIONS_CATALOG: Record<string, SessionData> = {
  'session-01': {
    id: 'session-01',
    unit: 1,
    sessionNumber: 1,
    title: 'The Opening Line',
    skillKey: 'starting_chat',
    skillName: 'Starting a chat',
    persona: PERSONAS.priya!,
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
  },
  'session-02': {
    id: 'session-02',
    unit: 1,
    sessionNumber: 2,
    title: 'One Good Follow-Up',
    skillKey: 'asking_followups',
    skillName: 'Asking follow-ups',
    persona: PERSONAS.maya!,
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
  },
  'session-03': {
    id: 'session-03',
    unit: 1,
    sessionNumber: 3,
    title: 'Showing You Heard',
    skillKey: 'acknowledging',
    skillName: 'Acknowledging what was said',
    persona: PERSONAS.alex!,
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
  },
  'session-04': {
    id: 'session-04',
    unit: 1,
    sessionNumber: 4,
    title: 'The Warm Exit',
    skillKey: 'graceful_exits',
    skillName: 'Graceful exits',
    persona: PERSONAS.sam!,
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
  },
  'session-05': {
    id: 'session-05',
    unit: 1,
    sessionNumber: 5,
    title: 'Reading a Short Reply',
    skillKey: 'reading_engagement',
    skillName: 'Reading engagement',
    persona: PERSONAS.maya!,
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
        'She is mentally triaging three pressing notifications and keeping answers minimal.',
        'She thinks the question was completely unnecessary.',
      ],
      trueIndex: 1,
      cueNote: 'Her eyes darted to the top right of her screen where notifications were stacking up.',
    },
  },
  'session-06': {
    id: 'session-06',
    unit: 1,
    sessionNumber: 6,
    title: 'Sharing a Little',
    skillKey: 'pacing_sharing',
    skillName: 'Pacing what you share',
    persona: PERSONAS.dev!,
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
  },
  'session-07': {
    id: 'session-07',
    unit: 1,
    sessionNumber: 7,
    title: 'The Quiet Moment',
    skillKey: 'handling_silence',
    skillName: 'Handling silence',
    persona: PERSONAS.sam!,
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
  },
  'session-08': {
    id: 'session-08',
    unit: 1,
    sessionNumber: 8,
    title: 'Your First Real-World Step',
    skillKey: 'keeping_balance',
    skillName: 'Keeping balance',
    persona: PERSONAS.rohan!,
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
  },
  'session-09': {
    id: 'session-09',
    unit: 2,
    sessionNumber: 9,
    title: 'Stepping into the Group',
    skillKey: 'groups',
    skillName: 'Stepping into groups',
    persona: PERSONAS.priya!,
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
        { speaker: 'Kiran', text: 'Pocket notebooks are great. Priya, did you try that dot-grid brand from Kyoto?', demonstratesSkill: true },
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
  },
  'session-10': {
    id: 'session-10',
    unit: 2,
    sessionNumber: 10,
    title: 'Bridging from Small Talk',
    skillKey: 'bridging_small_talk',
    skillName: 'Bridging from small talk',
    persona: PERSONAS.alex!,
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
  },
  'session-11': {
    id: 'session-11',
    unit: 2,
    sessionNumber: 11,
    title: 'Speaking to Someone Busy',
    skillKey: 'starting_chat',
    skillName: 'Starting a chat',
    persona: PERSONAS.dev!,
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
  },
  'session-12': {
    id: 'session-12',
    unit: 2,
    sessionNumber: 12,
    title: 'Disagreeing Without Friction',
    skillKey: 'polite_disagreement',
    skillName: 'Polite disagreement',
    persona: PERSONAS.rohan!,
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
  },
  'session-13': {
    id: 'session-13',
    unit: 2,
    sessionNumber: 13,
    title: 'Leaving a Group Conversation',
    skillKey: 'graceful_exits',
    skillName: 'Graceful exits',
    persona: PERSONAS.maya!,
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
  },
  'session-14': {
    id: 'session-14',
    unit: 2,
    sessionNumber: 14,
    title: 'Handling a Pause in a Meeting',
    skillKey: 'handling_silence',
    skillName: 'Handling silence',
    persona: PERSONAS.dev!,
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
  },
  'session-15': {
    id: 'session-15',
    unit: 2,
    sessionNumber: 15,
    title: 'Following Up After the Chat',
    skillKey: 'following_up',
    skillName: 'Following up afterwards',
    persona: PERSONAS.alex!,
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
  },
  'session-16': {
    id: 'session-16',
    unit: 2,
    sessionNumber: 16,
    title: 'Holding Your Ground Calmly',
    skillKey: 'polite_disagreement',
    skillName: 'Polite disagreement',
    persona: PERSONAS.rohan!,
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
  },
};

export function getSessionData(sessionId?: string): SessionData {
  if (sessionId && SESSIONS_CATALOG[sessionId]) {
    return SESSIONS_CATALOG[sessionId]!;
  }
  return SESSIONS_CATALOG['session-01']!;
}
