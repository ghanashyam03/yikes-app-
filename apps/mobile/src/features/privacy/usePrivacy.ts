import { create } from 'zustand';
import {
  DEFAULT_CONSENTS,
  getConsents,
  saveConsents,
  type ConsentKind,
  type ConsentsState,
} from '../auth/consentManager';
import { requestOtp } from '../auth/otpManager';
import { supabase } from '../auth/supabaseClient';
import { useSessionStore } from '../auth/useSession';
import {
  checkCanUseImprovement,
  requestDataExport,
  requestDeleteAccount,
  requestDeleteText,
} from './privacyApi';

export interface ExportState {
  status: 'idle' | 'requesting' | 'ready' | 'error';
  downloadUrl?: string | undefined;
  expiresAt?: string | undefined;
  exportId?: string | undefined;
  error?: string | undefined;
}

export interface ActionState {
  status: 'idle' | 'in_progress' | 'success' | 'error';
  error?: string | undefined;
}

export interface PrivacyStore {
  consents: ConsentsState;
  isLoadingConsents: boolean;
  canUseForImprovement: boolean;
  exportState: ExportState;
  deleteTextState: ActionState;
  deleteAccountState: ActionState;
  isConfirmTextModalOpen: boolean;
  isDeleteAccountModalOpen: boolean;
  otpCode: string;

  // Actions
  loadConsents: () => Promise<void>;
  toggleConsent: (kind: ConsentKind, granted: boolean) => Promise<boolean>;
  requestExport: () => Promise<void>;
  openDeleteTextModal: () => void;
  closeDeleteTextModal: () => void;
  executeDeleteText: () => Promise<boolean>;
  openDeleteAccountModal: () => Promise<void>;
  closeDeleteAccountModal: () => void;
  setOtpCode: (code: string) => void;
  executeDeleteAccount: () => Promise<boolean>;
  resetExportState: () => void;
}

async function getAuthToken(): Promise<string | null> {
  try {
    const sessionState = useSessionStore.getState();
    if (sessionState.session?.accessToken) {
      return sessionState.session.accessToken;
    }

    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  } catch {
    return null;
  }
}

export const usePrivacy = create<PrivacyStore>((set, get) => ({
  consents: { ...DEFAULT_CONSENTS },
  isLoadingConsents: false,
  canUseForImprovement: false,
  exportState: { status: 'idle' },
  deleteTextState: { status: 'idle' },
  deleteAccountState: { status: 'idle' },
  isConfirmTextModalOpen: false,
  isDeleteAccountModalOpen: false,
  otpCode: '',

  loadConsents: async () => {
    const session = useSessionStore.getState();
    const userId = session.session?.user?.id;
    if (!userId) {
      set({ consents: { ...DEFAULT_CONSENTS }, isLoadingConsents: false });
      return;
    }

    set({ isLoadingConsents: true });
    try {
      const fetched = await getConsents(userId);
      const token = await getAuthToken();
      let canUse = fetched.improve_ai;
      if (token) {
        canUse = await checkCanUseImprovement(token).catch(() => fetched.improve_ai);
      }
      set({
        consents: fetched,
        canUseForImprovement: canUse,
        isLoadingConsents: false,
      });
    } catch {
      set({ isLoadingConsents: false });
    }
  },

  toggleConsent: async (kind: ConsentKind, granted: boolean) => {
    if (kind === 'required') {
      return false; // Required is strictly non-negotiable
    }

    const prevConsents = get().consents;
    const updatedConsents = { ...prevConsents, [kind]: granted };

    // Optimistic update
    set({
      consents: updatedConsents,
      canUseForImprovement: kind === 'improve_ai' ? granted : get().canUseForImprovement,
    });

    const session = useSessionStore.getState();
    const userId = session.session?.user?.id;
    if (!userId) {
      return true; // Stored in memory for guest
    }

    const saveResult = await saveConsents(userId, updatedConsents);
    if (!saveResult.ok) {
      // Rollback on failure
      set({
        consents: prevConsents,
        canUseForImprovement: prevConsents.improve_ai,
      });
      return false;
    }

    return true;
  },

  requestExport: async () => {
    set({ exportState: { status: 'requesting' } });
    try {
      const token = await getAuthToken();
      if (!token) {
        set({
          exportState: {
            status: 'error',
            error: 'You need to be signed in to export your account data.',
          },
        });
        return;
      }

      const res = await requestDataExport(token);
      set({
        exportState: {
          status: 'ready',
          downloadUrl: res.downloadUrl,
          expiresAt: res.expiresAt,
          exportId: res.exportId,
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Export failed';
      set({
        exportState: {
          status: 'error',
          error: msg,
        },
      });
    }
  },

  resetExportState: () => {
    set({ exportState: { status: 'idle' } });
  },

  openDeleteTextModal: () => {
    set({ isConfirmTextModalOpen: true, deleteTextState: { status: 'idle' } });
  },

  closeDeleteTextModal: () => {
    set({ isConfirmTextModalOpen: false });
  },

  executeDeleteText: async () => {
    set({ deleteTextState: { status: 'in_progress' } });
    try {
      const token = await getAuthToken();
      if (!token) {
        set({
          deleteTextState: {
            status: 'error',
            error: 'You need to be signed in to manage practice text.',
          },
        });
        return false;
      }

      await requestDeleteText(token);
      set({
        deleteTextState: { status: 'success' },
        isConfirmTextModalOpen: false,
      });
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to clear text';
      set({
        deleteTextState: {
          status: 'error',
          error: msg,
        },
      });
      return false;
    }
  },

  openDeleteAccountModal: async () => {
    set({
      isDeleteAccountModalOpen: true,
      deleteAccountState: { status: 'idle' },
      otpCode: '',
    });

    // Automatically send fresh OTP code to user's registered destination
    const session = useSessionStore.getState();
    const userEmail = session.session?.user?.email;
    const userPhone = session.session?.user?.phone;

    if (userEmail) {
      await requestOtp(userEmail, 'email');
    } else if (userPhone) {
      await requestOtp(userPhone, 'phone');
    }
  },

  closeDeleteAccountModal: () => {
    set({ isDeleteAccountModalOpen: false, otpCode: '' });
  },

  setOtpCode: (code: string) => {
    set({ otpCode: code });
  },

  executeDeleteAccount: async () => {
    const { otpCode } = get();
    if (!otpCode || otpCode.trim().length < 6) {
      set({
        deleteAccountState: {
          status: 'error',
          error: 'Please enter the complete 6-digit code',
        },
      });
      return false;
    }

    set({ deleteAccountState: { status: 'in_progress' } });
    try {
      const token = await getAuthToken();
      if (!token) {
        set({
          deleteAccountState: {
            status: 'error',
            error: 'Session not found. Please sign in again.',
          },
        });
        return false;
      }

      await requestDeleteAccount(token, otpCode.trim());

      set({
        deleteAccountState: { status: 'success' },
        isDeleteAccountModalOpen: false,
      });

      // Clear local session after deletion
      await supabase.auth.signOut().catch(() => {});
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Account deletion failed';
      set({
        deleteAccountState: {
          status: 'error',
          error: msg,
        },
      });
      return false;
    }
  },
}));
