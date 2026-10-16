export type SessionBeat =
  | 'idea'
  | 'watch'
  | 'read'
  | 'try'
  | 'coach'
  | 'out_there'
  | 'complete';

export interface DialogueLine {
  speaker: string;
  text: string;
  demonstratesSkill?: boolean;
}

export interface SessionIdeaStep {
  rule: string;
  example: DialogueLine[];
  whyWorks: string;
}

export interface SessionWatchStep {
  title: string;
  dialogue: DialogueLine[];
  targetLineIndex: number;
  explanation: string;
}

export interface SessionReadStep {
  scene: string;
  dialogue: DialogueLine[];
  candidateThoughts: [string, string, string];
  trueIndex: 0 | 1 | 2;
  cueNote: string;
}

export interface PersonaInfo {
  id: string;
  name: string;
  role: string;
  palette: {
    primary: string;
    secondary: string;
  };
}

export interface SessionData {
  id: string;
  unit: 1 | 2;
  sessionNumber: number;
  title: string;
  skillKey: string;
  skillName: string;
  persona: PersonaInfo;
  idea: SessionIdeaStep;
  watch: SessionWatchStep;
  read: SessionReadStep;
}
