import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import {
  ReadSceneSchema,
  buildReadScenePrompt,
  type ReadScene,
} from '@yikes/ai-prompts/read-scene';
import {
  WatchExchangeSchema,
  buildWatchExchangePrompt,
  type WatchExchange,
} from '@yikes/ai-prompts/watch-exchange';
import { loadEnv, type GatewayEnv } from '../config/env.js';
import { createAuthMiddleware } from '../middleware/auth.js';
import { NvidiaProvider } from '../providers/nvidia.js';
import type { AiProvider } from '../providers/types.js';
import { logger } from '../telemetry/logger.js';

export const WatchContentRequestSchema = z.object({
  sessionId: z.string().min(1),
  scenarioWorld: z.string().optional(),
  tone: z.string().optional(),
  playbook: z
    .object({
      pace: z.string().optional(),
      coachTone: z.string().optional(),
      scenarioWorld: z.string().optional(),
    })
    .optional(),
});
export type WatchContentRequest = z.infer<typeof WatchContentRequestSchema>;

export const ReadContentRequestSchema = z.object({
  sessionId: z.string().min(1),
  scenarioWorld: z.string().optional(),
  tone: z.string().optional(),
});
export type ReadContentRequest = z.infer<typeof ReadContentRequestSchema>;

export interface AuthoredSessionDefault {
  sessionId: string;
  skillName: string;
  partnerName: string;
  watch: WatchExchange;
  read: ReadScene;
}

export const AUTHORED_CONTENT_DEFAULTS: Record<string, AuthoredSessionDefault> = {
  'session-01': {
    sessionId: 'session-01',
    skillName: 'Starting a chat',
    partnerName: 'Priya',
    watch: {
      title: 'Near the kitchen area',
      skillDemonstrated: 'Starting a chat',
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
    sessionId: 'session-02',
    skillName: 'Asking follow-ups',
    partnerName: 'Maya',
    watch: {
      title: 'Monday morning catch-up',
      skillDemonstrated: 'Asking follow-ups',
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
    sessionId: 'session-03',
    skillName: 'Acknowledging what was said',
    partnerName: 'Alex',
    watch: {
      title: 'Standup planning',
      skillDemonstrated: 'Acknowledging what was said',
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
    sessionId: 'session-04',
    skillName: 'Graceful exits',
    partnerName: 'Sam',
    watch: {
      title: 'Hallway conversation',
      skillDemonstrated: 'Graceful exits',
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
    sessionId: 'session-05',
    skillName: 'Reading engagement',
    partnerName: 'Maya',
    watch: {
      title: 'Quick kitchen interaction',
      skillDemonstrated: 'Reading engagement',
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
    sessionId: 'session-06',
    skillName: 'Pacing what you share',
    partnerName: 'Dev',
    watch: {
      title: 'Water cooler chat',
      skillDemonstrated: 'Pacing what you share',
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
    sessionId: 'session-07',
    skillName: 'Handling silence',
    partnerName: 'Sam',
    watch: {
      title: 'Design review pause',
      skillDemonstrated: 'Handling silence',
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
    sessionId: 'session-08',
    skillName: 'Keeping balance',
    partnerName: 'Rohan',
    watch: {
      title: 'Afternoon coffee break',
      skillDemonstrated: 'Keeping balance',
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
    sessionId: 'session-09',
    skillName: 'Stepping into groups',
    partnerName: 'Priya',
    watch: {
      title: 'Lunch gathering in the courtyard',
      skillDemonstrated: 'Stepping into groups',
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
    sessionId: 'session-10',
    skillName: 'Bridging from small talk',
    partnerName: 'Alex',
    watch: {
      title: 'Pre-meeting lobby chat',
      skillDemonstrated: 'Bridging from small talk',
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
    sessionId: 'session-11',
    skillName: 'Starting a chat',
    partnerName: 'Dev',
    watch: {
      title: 'Executive suite corridor',
      skillDemonstrated: 'Starting a chat',
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
    sessionId: 'session-12',
    skillName: 'Polite disagreement',
    partnerName: 'Rohan',
    watch: {
      title: 'Sprint retro debate',
      skillDemonstrated: 'Polite disagreement',
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
    sessionId: 'session-13',
    skillName: 'Graceful exits',
    partnerName: 'Maya',
    watch: {
      title: 'Team reception terrace',
      skillDemonstrated: 'Graceful exits',
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
    sessionId: 'session-14',
    skillName: 'Handling silence',
    partnerName: 'Dev',
    watch: {
      title: 'Budget allocation review',
      skillDemonstrated: 'Handling silence',
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
    sessionId: 'session-15',
    skillName: 'Following up afterwards',
    partnerName: 'Alex',
    watch: {
      title: 'Post-sync Slack exchange',
      skillDemonstrated: 'Following up afterwards',
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
    sessionId: 'session-16',
    skillName: 'Polite disagreement',
    partnerName: 'Rohan',
    watch: {
      title: 'Steering committee debate',
      skillDemonstrated: 'Polite disagreement',
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

// In-memory cache per (sessionId, world, tone)
const watchExchangeCache = new Map<string, WatchExchange>();
const readSceneCache = new Map<string, ReadScene>();

export function clearContentCache(): void {
  watchExchangeCache.clear();
  readSceneCache.clear();
}

export function buildCacheKey(sessionId: string, world?: string, tone?: string): string {
  return `${sessionId}:${world ?? 'default'}:${tone ?? 'default'}`;
}

export interface RegisterContentRoutesOptions {
  env?: GatewayEnv | undefined;
  provider?: AiProvider | undefined;
}

export async function register(
  app: FastifyInstance,
  options?: RegisterContentRoutesOptions
): Promise<void> {
  let env: GatewayEnv;
  try {
    env = options?.env ?? loadEnv();
  } catch {
    env = {
      NVIDIA_API_KEY: 'test_key',
      NVIDIA_BASE_URL: 'https://integrate.api.nvidia.com/v1',
      MODEL_PARTNER: 'test-partner',
      MODEL_PARTNER_FALLBACK: 'test-fallback',
      MODEL_COACH: 'test-coach',
      MODEL_COACH_FALLBACK: 'test-coach-fallback',
      MODEL_JUDGE: 'test-judge',
      MODEL_SAFETY: 'test-safety',
      MODEL_VISION: 'test-vision',
      MODEL_LONG: 'test-long',
      MODEL_ALT: 'test-alt',
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service_role_key',
      AI_PROVIDER: 'fake',
      HOST: '0.0.0.0',
      PORT: 3000,
      REQUEST_TIMEOUT_MS: 8000,
      RPM_LIMIT: 35,
    };
  }

  const provider: AiProvider = options?.provider ?? new NvidiaProvider(env);
  const authMiddleware = createAuthMiddleware(env);

  // Helper to run auth only if an Authorization header was provided
  const optionalAuth = async (request: FastifyRequest, reply: FastifyReply) => {
    if (request.headers.authorization) {
      await authMiddleware(request, reply);
    }
  };

  // POST /v1/content/watch
  app.post(
    '/v1/content/watch',
    { preHandler: [optionalAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parseResult = WatchContentRequestSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Invalid request body',
          details: parseResult.error.flatten(),
        });
      }

      const { sessionId, scenarioWorld, tone, playbook } = parseResult.data;
      const authored = AUTHORED_CONTENT_DEFAULTS[sessionId];
      if (!authored) {
        return reply.status(404).send({ error: `Session not found: ${sessionId}` });
      }

      const cacheKey = buildCacheKey(sessionId, scenarioWorld, tone);
      const cached = watchExchangeCache.get(cacheKey);
      if (cached) {
        return reply.status(200).send({
          ...cached,
          personalized: true,
          cached: true,
        });
      }

      // If no personalization parameters requested, return authored default directly
      if (!scenarioWorld && !tone && !playbook) {
        return reply.status(200).send({
          ...authored.watch,
          personalized: false,
          cached: false,
        });
      }

      // Attempt AI personalization with failover to authored default
      try {
        const messages = buildWatchExchangePrompt({
          skill: authored.skillName,
          scenarioWorld,
          playbook: {
            scenarioWorld,
            pace: playbook?.pace,
            coachTone: (playbook?.coachTone as 'gentle' | 'straight' | 'funny') ?? (tone as 'gentle' | 'straight' | 'funny') ?? 'gentle',
          },
        });

        const completion = await provider.complete({
          model: env.MODEL_PARTNER,
          messages,
          temperature: 0.7,
          timeoutMs: env.REQUEST_TIMEOUT_MS,
        });

        const json = JSON.parse(completion.text);
        const validated = WatchExchangeSchema.parse(json);

        watchExchangeCache.set(cacheKey, validated);
        return reply.status(200).send({
          ...validated,
          personalized: true,
          cached: false,
        });
      } catch (err) {
        logger.warn(
          { sessionId, error: err instanceof Error ? err.message : String(err) },
          'Failed to personalize watch exchange, falling back to authored default'
        );
        return reply.status(200).send({
          ...authored.watch,
          personalized: false,
          cached: false,
          degraded: true,
        });
      }
    }
  );

  // POST /v1/content/read
  app.post(
    '/v1/content/read',
    { preHandler: [optionalAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parseResult = ReadContentRequestSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Invalid request body',
          details: parseResult.error.flatten(),
        });
      }

      const { sessionId, scenarioWorld, tone } = parseResult.data;
      const authored = AUTHORED_CONTENT_DEFAULTS[sessionId];
      if (!authored) {
        return reply.status(404).send({ error: `Session not found: ${sessionId}` });
      }

      const cacheKey = buildCacheKey(sessionId, scenarioWorld, tone);
      const cached = readSceneCache.get(cacheKey);
      if (cached) {
        return reply.status(200).send({
          ...cached,
          personalized: true,
          cached: true,
        });
      }

      // If no personalization parameters requested, return authored default directly
      if (!scenarioWorld && !tone) {
        return reply.status(200).send({
          ...authored.read,
          personalized: false,
          cached: false,
        });
      }

      // Attempt AI personalization with failover to authored default
      try {
        const messages = buildReadScenePrompt({
          skill: authored.skillName,
          partnerName: authored.partnerName,
          setting: scenarioWorld ?? authored.read.scene,
        });

        const completion = await provider.complete({
          model: env.MODEL_PARTNER,
          messages,
          temperature: 0.7,
          timeoutMs: env.REQUEST_TIMEOUT_MS,
        });

        const json = JSON.parse(completion.text);
        const validated = ReadSceneSchema.parse(json);

        readSceneCache.set(cacheKey, validated);
        return reply.status(200).send({
          ...validated,
          personalized: true,
          cached: false,
        });
      } catch (err) {
        logger.warn(
          { sessionId, error: err instanceof Error ? err.message : String(err) },
          'Failed to personalize read scene, falling back to authored default'
        );
        return reply.status(200).send({
          ...authored.read,
          personalized: false,
          cached: false,
          degraded: true,
        });
      }
    }
  );
}
