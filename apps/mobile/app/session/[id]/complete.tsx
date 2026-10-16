import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Screen } from '../../../src/ui/primitives/Screen';
import { Text } from '../../../src/ui/primitives/Text';
import { Card } from '../../../src/ui/primitives/Card';
import { Button } from '../../../src/ui/primitives/Button';
import { RhythmRing } from '../../../src/ui/components/RhythmRing';
import { EvidenceLine } from '../../../src/ui/components/EvidenceLine';
import { useTheme } from '../../../src/theme/useTheme';
import { useSession } from '../../../src/features/auth/useSession';
import { useGuestProgressStore } from '../../../src/features/today/guestProgress';
import { getSessionData } from '../../../src/features/session-steps/sessionCatalog';
import { countSessionsInWeek } from '../../../src/features/today/useToday';
import { clearSessionRunnerState } from '../../../src/features/session-runner/runnerStorage';
import { supabase } from '../../../src/features/auth/supabaseClient';
import { todayCopy } from '../../../src/copy/today';

export default function SessionCompleteScreen(): React.JSX.Element {
  const router = useRouter();
  const { id, easy } = useLocalSearchParams<{ id: string; easy?: string }>();
  const isTakeItEasy = easy === 'true';
  const { colors, accents, spacing } = useTheme();
  const { session: authSession, isGuest } = useSession();
  const guestProgress = useGuestProgressStore();

  const session = useMemo(() => getSessionData(id), [id]);

  // Current session log count before advancing
  const priorCompleted = useMemo(() => {
    return countSessionsInWeek(guestProgress.sessionsLog);
  }, [guestProgress.sessionsLog]);

  const [ringFilled, setRingFilled] = useState(priorCompleted);
  const totalRhythm = 3;

  useEffect(() => {
    let isCancelled = false;

    async function recordCompletion() {
      // 1. Soft haptic feedback
      try {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // Haptics optional
      }

      // 2. Animate rhythm ring segment advance after a brief calm moment
      const timer = setTimeout(() => {
        if (!isCancelled) {
          setRingFilled((prev) => prev + 1);
        }
      }, 400);

      // 3. Record session in local store
      guestProgress.recordSessionComplete(session.id, isTakeItEasy ? 'take_it_easy' : 'full');

      // 4. Record session in Supabase if logged in
      if (!isGuest && authSession?.user?.id) {
        try {
          await supabase.from('sessions_log').insert({
            user_id: authSession.user.id,
            session_id: session.id,
            mode: isTakeItEasy ? 'take_it_easy' : 'full',
          });
        } catch {
          // Local storage handles fallback
        }
      }

      // 5. Clear saved runner mid-session state
      await clearSessionRunnerState();

      return () => clearTimeout(timer);
    }

    void recordCompletion();

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleDone = () => {
    router.replace('/(tabs)');
  };

  const handleAnotherOne = () => {
    router.replace('/(tabs)/path' as never);
  };

  const evidenceQuote = useMemo(() => {
    if (guestProgress.evidenceQuotes.length > 0) {
      return guestProgress.evidenceQuotes[0]!;
    }
    return {
      quote: session.idea.example[0]?.text || todayCopy.evidence.fallbackQuote,
      contextNote: 'Demonstrated clear practice and intentional connection',
    };
  }, [guestProgress.evidenceQuotes, session]);

  return (
    <Screen style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: spacing[12] }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Thin ambient light line across the screen */}
        <View style={styles.ambientLightLine}>
          <View
            style={[
              styles.ambientLightCore,
              { backgroundColor: accents.mint.base, shadowColor: accents.mint.base },
            ]}
          />
        </View>

        {/* Quiet headline */}
        <View style={styles.header}>
          <Text role="displayMedium" style={[styles.title, { color: colors.ink }]}>
            {todayCopy.complete.title}
          </Text>
          <Text role="bodyLarge" muted style={styles.subtitle}>
            {todayCopy.complete.subtitle}
          </Text>
        </View>

        {/* Weekly Rhythm Ring Progress */}
        <Card tint="mint" style={styles.rhythmCard}>
          <View style={styles.rhythmRow}>
            <RhythmRing
              filledSegments={ringFilled}
              totalSegments={totalRhythm}
              size={90}
              strokeWidth={9}
            />
            <View style={styles.rhythmTextContainer}>
              <Text role="labelSmall" style={{ color: accents.mint.pop, fontWeight: '700' }}>
                {todayCopy.complete.rhythmAdvance.toUpperCase()}
              </Text>
              <Text role="titleMedium" style={{ color: colors.ink }}>
                {todayCopy.complete.rhythmMessage(ringFilled, totalRhythm)}
              </Text>
              <Text role="bodySmall" muted>
                {todayCopy.rhythm.easyCountsNote}
              </Text>
            </View>
          </View>
        </Card>

        {/* Single Evidence Line Tile */}
        <View style={styles.evidenceSection}>
          <Text role="labelSmall" muted style={styles.evidenceHeader}>
            {todayCopy.complete.evidenceTitle.toUpperCase()}
          </Text>
          <EvidenceLine
            quote={evidenceQuote.quote}
            contextNote={evidenceQuote.contextNote}
            tilted={true}
            triggerSwipe={true}
          />
        </View>

        {/* No points / no confetti reassuring note */}
        <View style={styles.quietProgressNote}>
          <Text role="bodySmall" muted style={{ textAlign: 'center' }}>
            {todayCopy.complete.noConfettiNotice}
          </Text>
        </View>

        {/* Bottom Actions */}
        <View style={styles.footerActions}>
          <Button
            variant="primary"
            label={todayCopy.complete.doneButton}
            onPress={handleDone}
            accessibilityLabel={todayCopy.complete.doneButton}
            style={styles.actionButton}
          />
          <Button
            variant="secondary"
            label={todayCopy.complete.anotherOneButton}
            onPress={handleAnotherOne}
            accessibilityLabel={todayCopy.complete.anotherOneButton}
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 24,
  },
  ambientLightLine: {
    width: '100%',
    height: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  ambientLightCore: {
    width: '80%',
    height: 2,
    borderRadius: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  rhythmCard: {
    padding: 20,
  },
  rhythmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  rhythmTextContainer: {
    flex: 1,
    gap: 4,
  },
  evidenceSection: {
    gap: 8,
  },
  evidenceHeader: {
    fontWeight: '600',
    letterSpacing: 1.0,
  },
  quietProgressNote: {
    marginVertical: 4,
  },
  footerActions: {
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    width: '100%',
  },
});
