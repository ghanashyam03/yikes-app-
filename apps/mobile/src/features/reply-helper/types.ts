export type ReplyTone = 'warm' | 'direct' | 'light';

export interface ReplySuggestions {
  warm: string;
  direct: string;
  light: string;
}

export interface ReplyHelperResult {
  readings: [string, string];
  disclaimer: "I can't know what they meant";
  replies: ReplySuggestions;
  extractedText?: string | undefined;
}

export type ReplyHelperMode = 'paste' | 'screenshot';

export interface ImagePickerData {
  uri: string;
  base64?: string | null | undefined;
  width: number;
  height: number;
  fileSize?: number | null | undefined;
}

export interface ReplyHelperState {
  mode: ReplyHelperMode;
  pastedText: string;
  image: ImagePickerData | null;
  blurSkipped: boolean;
  showBlurNotice: boolean;
  isLoading: boolean;
  loadingStep: 'idle' | 'reading_image' | 'generating_replies';
  result: ReplyHelperResult | null;
  editedReplies: Partial<ReplySuggestions>;
  editingTone: ReplyTone | null;
  activeTone: ReplyTone;
  error: string | null;
  errorCode: string | null;
  suggestFallback: boolean;
  savedToJournal: boolean;
  isSavingToJournal: boolean;
  capReached: boolean;
}
