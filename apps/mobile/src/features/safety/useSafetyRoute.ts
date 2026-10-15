import { useCallback } from 'react';
import { useRouter } from 'expo-router';

export interface SafetyVerdictResponse {
  verdict: 'allow' | 'block' | 'crisis';
  categories?: string[] | undefined;
  degraded?: boolean | undefined;
}

/**
 * Mobile safety hook that inspects gateway safety verdicts.
 * When the safety layer detects a crisis, it immediately redirects the user
 * to the fixed, human-written support route ('/support') and pauses practice.
 */
export function useSafetyRoute() {
  const router = useRouter();

  const handleSafetyVerdict = useCallback(
    (response: SafetyVerdictResponse): boolean => {
      if (response.verdict === 'crisis') {
        router.push('/support');
        return true;
      }
      return false;
    },
    [router]
  );

  return {
    handleSafetyVerdict,
  };
}
