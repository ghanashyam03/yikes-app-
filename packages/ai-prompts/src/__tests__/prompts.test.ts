import { describe, expect, it } from 'vitest';
import { buildCoachFeedbackPrompt } from '../coach-feedback.js';
import { buildDebriefQuestionsPrompt } from '../debrief-questions.js';
import { buildDebriefTakeawayPrompt } from '../debrief-takeaway.js';
import { buildPartnerTurnPrompt } from '../partner-turn.js';
import type { PersonaCard } from '../persona-card.js';
import { buildPrepCardPrompt } from '../prep-card.js';
import { buildReadScenePrompt } from '../read-scene.js';
import { buildReplyHelperPrompt } from '../reply-helper.js';
import { buildScenarioGeneratorPrompt } from '../scenario-generator.js';
import type { ChatMessage, PlaybookSummary, ScenarioInfo, SkillRubric } from '../types.js';
import { buildVoiceStyleSummaryPrompt } from '../voice-style-summary.js';
import { buildWatchExchangePrompt } from '../watch-exchange.js';
import { buildWeeklyLetterPrompt } from '../weekly-letter.js';

describe('Prompt Builders & Format Specifications', () => {
  const samplePlaybook: PlaybookSummary = {
    communicationStyle: 'Low-key, thoughtful, concise',
    pace: 'moderate',
    hardestPlaces: ['large group dinners', 'impromptu presentations'],
    scenarioWorld: 'Design & tech agency',
  };

  const samplePersona: PersonaCard = {
    id: 'maya-eng',
    name: 'Maya',
    role: 'Staff Frontend Engineer',
    background: 'Deeply technical, focused on web accessibility and component architecture.',
    demeanor: 'Slightly reserved, warm when talking about technical specifics.',
    speakingStyle: 'Short, clean sentences; avoids corporate jargon.',
    topicsEnjoyed: ['architecture', 'coffee brewing', 'cycling'],
    topicsAvoided: ['office politics', 'small talk about weather'],
    hiddenTendencies: ['checks watch when meetings meander'],
    fallbackLines: ['Sorry, spaced out for a second. What was that?'],
    baseMood: {
      engagement: 0.5,
      rapport: 0.4,
      patience: 0.6,
      exitPressure: 0.2,
    },
  };

  const sampleScenario: ScenarioInfo = {
    title: 'Reviewing PR #402',
    setting: 'Desk pod after daily standup',
    userGoal: 'Ask Maya for quick feedback on button contrast without lingering',
  };

  const sampleRubric: SkillRubric = {
    skill: 'starting a chat',
    description: 'Starting conversations clearly and setting up context',
    targetBehaviors: ['Acknowledge context', 'State topic upfront', 'Respect partner time'],
  };

  function assertHasAllSections(messages: ChatMessage[]) {
    expect(messages.length).toBeGreaterThanOrEqual(1);
    const content = messages.map((m) => m.content).join('\n');
    expect(content).toContain('### ROLE');
    expect(content).toContain('### CONTEXT');
    expect(content).toContain('### RULES');
    expect(content).toContain('### OUTPUT FORMAT');
    expect(content).toContain('### EXAMPLES');
  }

  it('1. buildPartnerTurnPrompt produces stable format and required rules', () => {
    const prompt = buildPartnerTurnPrompt({
      persona: samplePersona,
      scenario: sampleScenario,
      playbookSummary: samplePlaybook,
      recentTurns: [
        { speaker: 'user', text: 'Hey Maya, got a minute to look at contrast tokens?' },
      ],
      hiddenMood: {
        engagement: 0.55,
        rapport: 0.45,
        patience: 0.65,
        exitPressure: 0.35,
      },
    });

    assertHasAllSections(prompt);

    const fullText = prompt.map((m) => m.content).join('\n');
    expect(fullText).toContain('REALISTIC, NOT AGREEABLE');
    expect(fullText).toContain('RESERVED AT FIRST');
    expect(fullText).toContain('NEVER OVER-SHARE');
    expect(fullText).toContain('SOMETIMES DISTRACTED');
    expect(fullText).toContain('PRE-CLOSING AND ENDING');
    expect(fullText).toContain('NEVER CLAIM TO BE HUMAN');
    expect(fullText).toContain('STAY INSIDE SCENARIO WORLD');
    expect(fullText).toContain('PRIVATE THOUGHT IS YOUR HONEST REACTION');

    expect(prompt).toMatchSnapshot();
  });

  it('2. buildCoachFeedbackPrompt produces stable format and honesty rules', () => {
    const prompt = buildCoachFeedbackPrompt({
      transcript: [
        { role: 'user', text: 'Hey Maya, got a minute?' },
        { role: 'partner', text: 'Yeah, just wrapping a commit.' },
      ],
      thoughts: [{ turnIndex: 1, thought: 'Almost done with this push.' }],
      playbook: samplePlaybook,
      skillRubric: sampleRubric,
      toneVariant: 'gentle',
    });

    assertHasAllSections(prompt);

    const fullText = prompt.map((m) => m.content).join('\n');
    // Honesty rules presence check
    expect(fullText).toContain('QUOTES VERBATIM');
    expect(fullText).toContain('NO PRAISE WITHOUT A LINE');
    expect(fullText).toContain('NO SHAMING');
    expect(fullText).toContain('NO LABELS');
    expect(fullText).toContain('NO DIAGNOSIS OR MEDICAL WORDS');
    expect(fullText).toContain('treat');
    expect(fullText).toContain('cure');
    expect(fullText).toContain('therapy');
    expect(fullText).toContain('diagnose');
    expect(fullText).toContain('shy');
    expect(fullText).toContain('anxious');

    expect(prompt).toMatchSnapshot();
  });

  it('3. buildPrepCardPrompt produces stable format with 2 questions and exit line', () => {
    const prompt = buildPrepCardPrompt({
      moment: {
        title: 'Lunch with Tech Lead',
        context: 'Cafeteria meetup to discuss career goals',
        formality: 'semi-formal',
      },
      playbook: samplePlaybook,
    });

    assertHasAllSections(prompt);
    expect(prompt).toMatchSnapshot();
  });

  it('4. buildDebriefQuestionsPrompt produces stable format with 4-5 gentle questions', () => {
    const prompt = buildDebriefQuestionsPrompt({
      moment: {
        title: 'Team Retrospective',
        description: 'Discussing the release delay with product and design',
        energyRatingBefore: 4,
        energyRatingAfter: 6,
      },
      playbook: samplePlaybook,
    });

    assertHasAllSections(prompt);
    expect(prompt).toMatchSnapshot();
  });

  it('5. buildDebriefTakeawayPrompt produces stable format with core essence', () => {
    const prompt = buildDebriefTakeawayPrompt({
      moment: {
        title: 'Coffee chat with mentor',
        description: 'Casual catch-up',
      },
      qaPairs: [
        {
          question: 'How did it feel when you sat down?',
          answer: 'A little stiff initially, but asking about their garden broke the ice.',
        },
      ],
      playbook: samplePlaybook,
    });

    assertHasAllSections(prompt);
    expect(prompt).toMatchSnapshot();
  });

  it('6. buildReplyHelperPrompt produces stable format with mandatory disclaimer', () => {
    const prompt = buildReplyHelperPrompt({
      receivedMessage: 'Can you hop on a quick call right now?',
      context: 'Message from engineering director on Slack',
      playbook: samplePlaybook,
    });

    assertHasAllSections(prompt);

    const fullText = prompt.map((m) => m.content).join('\n');
    expect(fullText).toContain("I can't know what they meant");
    expect(prompt).toMatchSnapshot();
  });

  it('7. buildWeeklyLetterPrompt produces stable format with 150-word limit rule', () => {
    const prompt = buildWeeklyLetterPrompt({
      userName: 'Sam',
      weekSummary: {
        sessionsCompleted: 4,
        momentsLogged: 2,
        skillsPracticed: ['graceful exits', 'asking follow-ups'],
        keyObservations: ['Exits were much cleaner and warmer.'],
      },
      playbook: samplePlaybook,
    });

    assertHasAllSections(prompt);

    const fullText = prompt.map((m) => m.content).join('\n');
    expect(fullText).toContain('150 words or fewer');
    expect(fullText).toContain('NEVER use guilt');
    expect(prompt).toMatchSnapshot();
  });

  it('8. buildScenarioGeneratorPrompt produces stable format with excluded topics rule', () => {
    const prompt = buildScenarioGeneratorPrompt({
      playbook: samplePlaybook,
      targetSkill: 'polite disagreement',
      difficulty: 'intermediate',
    });

    assertHasAllSections(prompt);

    const fullText = prompt.map((m) => m.content).join('\n');
    expect(fullText).toContain('EXCLUDED TOPICS');
    expect(fullText).toContain('abuse');
    expect(fullText).toContain('bereavement');
    expect(prompt).toMatchSnapshot();
  });

  it('9. buildWatchExchangePrompt produces stable format for modelled dialogue', () => {
    const prompt = buildWatchExchangePrompt({
      skill: 'graceful exits',
      playbook: samplePlaybook,
    });

    assertHasAllSections(prompt);
    expect(prompt).toMatchSnapshot();
  });

  it('10. buildReadScenePrompt produces stable format with candidate thoughts and cue note', () => {
    const prompt = buildReadScenePrompt({
      skill: 'reading engagement',
      partnerName: 'Maya',
      setting: 'Office breakout area',
    });

    assertHasAllSections(prompt);
    expect(prompt).toMatchSnapshot();
  });

  it('11. buildVoiceStyleSummaryPrompt produces stable format for voice analysis', () => {
    const prompt = buildVoiceStyleSummaryPrompt({
      practiceSamples: [
        'Hey there, do you have two minutes to look at this?',
        'Sounds good, let us touch base after the sprint.',
      ],
      existingSummary: 'Concise and friendly.',
    });

    assertHasAllSections(prompt);
    expect(prompt).toMatchSnapshot();
  });
});
