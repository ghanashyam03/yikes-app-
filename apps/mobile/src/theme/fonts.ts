import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Font from 'expo-font';
import { fontFamilies, fontFallbacks } from '@yikes/shared/tokens/typography';

export { fontFamilies, fontFallbacks };

/**
 * Loads Soft Pop typography using expo-font with web @font-face / CDN injection
 * and native fallback handling.
 */
export function useSoftPopFonts(): { loaded: boolean; error: Error | null } {
  // In test environment, avoid asynchronous re-renders that cause act() warnings
  const isTest = process.env.NODE_ENV === 'test';
  const [loaded, setLoaded] = useState(isTest);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (isTest) return;

    let isMounted = true;

    async function load() {
      try {
        const webDoc = (
          typeof globalThis !== 'undefined' && 'document' in globalThis
            ? (globalThis as unknown as {
                document?: {
                  querySelector(s: string): unknown;
                  createElement(tag: string): { rel: string; href: string };
                  head: { appendChild(el: unknown): void };
                };
              }).document
            : undefined
        );

        if (Platform.OS === 'web' && webDoc) {
          const fontLinkUrl =
            'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Instrument+Serif:ital@1&family=Plus+Jakarta+Sans:ital,wght@0,400..800;1,400..800&display=swap';

          if (!webDoc.querySelector(`link[href*="fonts.googleapis.com"]`)) {
            const link = webDoc.createElement('link');
            link.rel = 'stylesheet';
            link.href = fontLinkUrl;
            webDoc.head.appendChild(link);
          }
        }

        await Font.loadAsync({});

        if (isMounted) {
          setLoaded(true);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoaded(true);
        }
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, [isTest]);

  return { loaded, error };
}

/**
 * Resolves font family for React Native style with fallback stack
 */
export function resolveFontFamily(
  role: 'display' | 'heading' | 'body'
): { fontFamily: string; fontStyle?: 'normal' | 'italic' } {
  if (Platform.OS === 'web') {
    return {
      fontFamily: fontFallbacks[role],
      fontStyle: role === 'display' ? 'italic' : 'normal'
    };
  }

  return {
    fontFamily: fontFamilies[role],
    fontStyle: role === 'display' ? 'italic' : 'normal'
  };
}
