import { describe, expect, it } from 'vitest';
import { checkCrisisRules } from '../crisis-terms.js';

describe('crisis-terms rule engine', () => {
  // 30 benign awkward-conversation fixtures that must be allowed without false positives
  const BENIGN_AWKWARD_MESSAGES = [
    'I completely froze when my manager asked me a question in front of everyone.',
    'I said "you too" when the waiter told me to enjoy my meal.',
    'I died of embarrassment during my standup when my voice cracked.',
    'I made eye contact with a stranger in the elevator and had no idea where to look.',
    'I waved back at someone who was actually waving to someone behind me.',
    'That joke killed me, it was so funny.',
    'My shoes are killing me after standing at that networking mixer for two hours.',
    'I wanted to die of shame when I forgot my coworker\'s name.',
    'Bringing up that topic in the team meeting felt like social suicide.',
    'I accidentally called my boss "Mom" on the Zoom call.',
    'There was an awkward 10-second silence and I panicked and started rambling.',
    'I tried to make small talk by asking about the weather and ran out of things to say in 5 seconds.',
    'I spilled coffee on my shirt right before the presentation.',
    'The commute traffic was killing me this morning, barely made it to the meeting.',
    'I arrived 30 minutes early to the party and waited in my car.',
    'I gave a limp handshake and now I cannot stop overthinking it.',
    'I laughed at a joke I did not understand just to be polite.',
    'I walked into the wrong conference room and sat there for 5 minutes before noticing.',
    'I had food stuck in my teeth through the entire client lunch.',
    'I practiced my order five times in line and still stuttered when it was my turn.',
    'I walked into a glass door while looking at my phone in the lobby.',
    'I accidentally replied-all with an awkward typo to the entire department.',
    'I pretended to check my phone to avoid making eye contact in the hallway.',
    'I tried to tell a story at dinner and everyone stopped talking and stared.',
    'I hesitated so long before speaking that someone else took my point.',
    'I left the gathering without saying goodbye because saying bye to everyone felt overwhelming.',
    'I am dead tired after three back-to-back social events this weekend.',
    'I was dead silent when the speaker asked for volunteers.',
    'That presentation schedule is killing me, but I will get through it.',
    'I wore formal clothes to a casual Friday hangout and stood out like a sore thumb.',
  ];

  // 20 crisis phrases (English and Hinglish) that must be flagged with 100% recall
  const CRISIS_MESSAGES = [
    'I want to kill myself',
    'I want to die',
    'I am going to end my life tonight',
    'Thinking about suicide every single day',
    'mar jaana chahta hoon',
    'zindagi khatam karni hai mujhe',
    'I am planning to hang myself in my room',
    'I feel like taking my own life',
    'khatam karna chahta hoon sab kuch',
    'jaan de dunga agar ye nahi hua',
    'zeher kha lunga mai',
    'I am going to slit my wrists',
    'khudkushi karne ka man kar raha hai',
    'aatmahatya karna chahta hoon',
    'I have no reason to live anymore',
    'Everyone would be better off dead without me',
    'I can\'t go on living like this',
    'I am going to overdose on pills tonight',
    'I wish I was dead already',
    'ab jeena nahi chahta mai',
  ];

  it('allows all 30 benign awkward-conversation messages without false positives', () => {
    expect(BENIGN_AWKWARD_MESSAGES).toHaveLength(30);

    const falsePositives: { index: number; text: string; category?: string | undefined }[] = [];
    BENIGN_AWKWARD_MESSAGES.forEach((msg, idx) => {
      const result = checkCrisisRules(msg);
      if (result.isCrisis) {
        falsePositives.push({ index: idx + 1, text: msg, category: result.category });
      }
    });

    expect(falsePositives).toEqual([]);
  });

  it('flags all 20 crisis phrases with 100% recall', () => {
    expect(CRISIS_MESSAGES).toHaveLength(20);

    const missedPhrases: { index: number; text: string }[] = [];
    CRISIS_MESSAGES.forEach((msg, idx) => {
      const result = checkCrisisRules(msg);
      if (!result.isCrisis) {
        missedPhrases.push({ index: idx + 1, text: msg });
      }
    });

    expect(missedPhrases).toEqual([]);
  });
});
