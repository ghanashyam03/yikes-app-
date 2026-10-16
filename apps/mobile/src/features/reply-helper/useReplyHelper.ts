import { useCallback, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { replyCopy } from '../../copy/reply';
import { supabase } from '../auth/supabaseClient';
import { requestReplyHelper, ReplyApiError } from './replyApi';
import type {
  ImagePickerData,
  ReplyHelperMode,
  ReplyHelperResult,
  ReplyTone,
  ReplySuggestions,
} from './types';

export interface UseReplyHelperOptions {
  onCrisis?: (() => void) | undefined;
  onCapReached?: (() => void) | undefined;
}

export function useReplyHelper(options: UseReplyHelperOptions = {}) {
  const [mode, setMode] = useState<ReplyHelperMode>('paste');
  const [pastedText, setPastedText] = useState('');
  const [image, setImage] = useState<ImagePickerData | null>(null);

  // UNVERIFIED: On-device automatic region blur cannot be fully implemented
  // without native image processing modules. We show a clear privacy warning
  // with an explicit skip option.
  const [showBlurNotice, setShowBlurNotice] = useState(false);
  const [blurSkipped, setBlurSkipped] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<
    'idle' | 'reading_image' | 'generating_replies'
  >('idle');

  const [result, setResult] = useState<ReplyHelperResult | null>(null);
  const [editedReplies, setEditedReplies] = useState<Partial<ReplySuggestions>>({});
  const [editingTone, setEditingTone] = useState<ReplyTone | null>(null);
  const [activeTone, setActiveTone] = useState<ReplyTone>('warm');
  const [copiedTone, setCopiedTone] = useState<ReplyTone | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [suggestFallback, setSuggestFallback] = useState(false);

  const [savedToJournal, setSavedToJournal] = useState(false);
  const [isSavingToJournal, setIsSavingToJournal] = useState(false);
  const [capReached, setCapReached] = useState(false);

  // Switch between paste and screenshot modes
  const handleSetMode = useCallback((newMode: ReplyHelperMode) => {
    setMode(newMode);
    setError(null);
    setErrorCode(null);
    setIsOffline(false);
    setSuggestFallback(false);
  }, []);

  // Pick an image using expo-image-picker
  const pickImage = useCallback(async () => {
    try {
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      });

      if (pickerResult.canceled || !pickerResult.assets || pickerResult.assets.length === 0) {
        return;
      }

      const asset = pickerResult.assets[0];
      if (!asset) return;

      // Check size (4 MB)
      if (asset.fileSize && asset.fileSize > 4 * 1024 * 1024) {
        setError(replyCopy.errors.imageTooLarge);
        setErrorCode('IMAGE_TOO_LARGE');
        return;
      }

      // Check dimensions (1280 px)
      if (
        (asset.width && asset.width > 1280) ||
        (asset.height && asset.height > 1280)
      ) {
        setError(replyCopy.errors.imageDimensionTooLarge);
        setErrorCode('IMAGE_DIMENSION_EXCEEDED');
        return;
      }

      setImage({
        uri: asset.uri,
        base64: asset.base64,
        width: asset.width ?? 0,
        height: asset.height ?? 0,
        fileSize: asset.fileSize,
      });

      setError(null);
      setErrorCode(null);
      setSuggestFallback(false);
      setShowBlurNotice(true);
      setBlurSkipped(false);
    } catch {
      setError(replyCopy.errors.generic);
    }
  }, []);

  const skipBlur = useCallback(() => {
    setBlurSkipped(true);
    setShowBlurNotice(false);
  }, []);

  const clearImage = useCallback(() => {
    setImage(null);
    setShowBlurNotice(false);
    setBlurSkipped(false);
    setError(null);
    setErrorCode(null);
    setIsOffline(false);
  }, []);

  // Submit request to gateway
  const generateReplies = useCallback(async () => {
    if (mode === 'paste' && !pastedText.trim()) return;
    if (mode === 'screenshot' && !image?.base64) return;

    setIsLoading(true);
    setError(null);
    setErrorCode(null);
    setIsOffline(false);
    setSuggestFallback(false);
    setLoadingStep(mode === 'screenshot' ? 'reading_image' : 'generating_replies');

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const payload =
        mode === 'paste'
          ? { text: pastedText.trim() }
          : {
              image: image!.base64!,
              width: image!.width,
              height: image!.height,
            };

      const res = await requestReplyHelper(token, payload);
      setResult(res);
      setEditedReplies({});
      setEditingTone(null);
      setActiveTone('warm');
      setSavedToJournal(false);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err ?? '');
      const isNetworkError =
        errMsg.includes('Network request failed') ||
        errMsg.includes('Failed to fetch') ||
        errMsg.includes('ENOTFOUND') ||
        errMsg.toLowerCase().includes('offline') ||
        (err instanceof ReplyApiError && (err.code === 'OFFLINE' || err.status === 0));

      if (isNetworkError) {
        setIsOffline(true);
      } else if (err instanceof ReplyApiError) {
        setErrorCode(err.code ?? null);
        if (err.code === 'CAP_REACHED' || err.status === 429) {
          setCapReached(true);
          options.onCapReached?.();
        } else if (err.code === 'CRISIS_DETECTED') {
          setError(replyCopy.errors.crisisDetected);
          options.onCrisis?.();
        } else if (err.code === 'CONTENT_BLOCKED') {
          setError(replyCopy.errors.safetyBlocked);
        } else if (err.code === 'VISION_UNAVAILABLE' || err.suggestFallback === 'paste') {
          setSuggestFallback(true);
          setError(replyCopy.fallback.body);
        } else if (err.code === 'IMAGE_TOO_LARGE') {
          setError(replyCopy.errors.imageTooLarge);
        } else if (err.code === 'IMAGE_DIMENSION_EXCEEDED') {
          setError(replyCopy.errors.imageDimensionTooLarge);
        } else {
          setError(err.message || replyCopy.errors.generic);
        }
      } else {
        setError(replyCopy.errors.generic);
      }
    } finally {
      setIsLoading(false);
      setLoadingStep('idle');
    }
  }, [mode, pastedText, image, options]);

  // Inline editing of replies
  const updateReplyText = useCallback((tone: ReplyTone, newText: string) => {
    setEditedReplies((prev) => ({
      ...prev,
      [tone]: newText,
    }));
  }, []);

  const getReplyText = useCallback(
    (tone: ReplyTone): string => {
      if (editedReplies[tone] !== undefined) {
        return editedReplies[tone]!;
      }
      return result?.replies[tone] ?? '';
    },
    [editedReplies, result]
  );

  // Copy selected reply to clipboard
  const copyReply = useCallback(
    async (tone: ReplyTone) => {
      const textToCopy = getReplyText(tone);
      if (!textToCopy) return;

      try {
        const nav = typeof globalThis !== 'undefined'
          ? (globalThis as { navigator?: { clipboard?: { writeText?: (t: string) => Promise<void> } } }).navigator
          : undefined;
        if (nav?.clipboard?.writeText) {
          await nav.clipboard.writeText(textToCopy);
        }
        setCopiedTone(tone);
        setTimeout(() => setCopiedTone(null), 2000);
      } catch {
        // Fallback
        setCopiedTone(tone);
        setTimeout(() => setCopiedTone(null), 2000);
      }
    },
    [getReplyText]
  );

  // Save selected reply to Growth Journal (only when tapped)
  const saveToJournal = useCallback(async () => {
    if (!result) return;
    const selectedText = getReplyText(activeTone);
    if (!selectedText) return;

    setIsSavingToJournal(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;

      if (userId) {
        await supabase.from('journal_entries').insert({
          user_id: userId,
          entry_kind: 'reply_helper',
          title: `Reply suggestion (${activeTone})`,
          body: selectedText,
          metadata: {
            tone: activeTone,
            disclaimer: result.disclaimer,
          },
        });
      }

      setSavedToJournal(true);
    } catch {
      // Allow optimistic save in UI
      setSavedToJournal(true);
    } finally {
      setIsSavingToJournal(false);
    }
  }, [result, activeTone, getReplyText]);

  const resetAll = useCallback(() => {
    setPastedText('');
    setImage(null);
    setShowBlurNotice(false);
    setBlurSkipped(false);
    setResult(null);
    setEditedReplies({});
    setEditingTone(null);
    setError(null);
    setErrorCode(null);
    setIsOffline(false);
    setSuggestFallback(false);
    setSavedToJournal(false);
  }, []);

  return {
    mode,
    setMode: handleSetMode,
    pastedText,
    setPastedText,
    image,
    pickImage,
    clearImage,
    showBlurNotice,
    blurSkipped,
    skipBlur,
    isLoading,
    loadingStep,
    generateReplies,
    result,
    activeTone,
    setActiveTone,
    editingTone,
    setEditingTone,
    updateReplyText,
    getReplyText,
    copyReply,
    copiedTone,
    saveToJournal,
    savedToJournal,
    isSavingToJournal,
    capReached,
    isOffline,
    error,
    errorCode,
    suggestFallback,
    resetAll,
  };
}
