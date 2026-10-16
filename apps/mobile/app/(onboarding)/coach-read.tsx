import React, { useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Screen } from '../../src/ui/primitives/Screen';
import { Text } from '../../src/ui/primitives/Text';
import { Card } from '../../src/ui/primitives/Card';
import { Button } from '../../src/ui/primitives/Button';
import { WinceMascot } from '../../src/ui/components/WinceMascot';
import { useTheme } from '../../src/theme/useTheme';
import { useOnboardingStore } from '../../src/features/onboarding/store';
import { useSession } from '../../src/features/auth/useSession';
import { useGuestProgressStore } from '../../src/features/today/guestProgress';
import { supabase } from '../../src/features/auth/supabaseClient';
import { todayCopy } from '../../src/copy/today';

export default function CoachReadScreen(): React.JSX.Element {
  const router = useRouter();
  const { colors, accents, spacing, reducedMotion } = useTheme();
  const answers = useOnboardingStore((s) => s.answers);
  const coachTone = answers.q11 || 'Gentle';

  const { session: authSession, isGuest } = useSession();
  const guestProgress = useGuestProgressStore();

  // Lilac glow pulse animation for Coach avatar
  const glowScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.4);

  useEffect(() => {
    if (!reducedMotion) {
      glowScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 1200 }),
          withTiming(1, { duration: 1200 })
        ),
        -1,
        true
      );
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1200 }),
          withTiming(0.3, { duration: 1200 })
        ),
        -1,
        true
      );
    }

    // Save baseline skill votes on mount
    const baselineVotes = async () => {
      // 1. Local progress store
      guestProgress.updateSkillStage('starting_chat', 'starting');
      guestProgress.updateSkillStage('asking_followups', 'starting');
      guestProgress.addEvidenceQuote(
        '“Pretty steady, just getting started.”',
        'Grounded the exchange cleanly with Priya'
      );

      // 2. Supabase if authenticated
      if (!isGuest && authSession?.user?.id) {
        try {
          await supabase.from('skills_progress').upsert([
            {
              user_id: authSession.user.id,
              skill_key: 'starting_chat',
              stage: 'starting',
              stage_history: [{ stage: 'starting', timestamp: new Date().toISOString() }],
            },
            {
              user_id: authSession.user.id,
              skill_key: 'asking_followups',
              stage: 'starting',
              stage_history: [{ stage: 'starting', timestamp: new Date().toISOString() }],
            },
          ]);
        } catch {
          // Local storage handles fallback
        }
      }
    };

    void baselineVotes();
  }, [reducedMotion]);

  const animatedGlowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: glowOpacity.value,
  }));

  const handleContinue = () => {
    try {
      void Haptics.selectionAsync();
    } catch {
      // Haptics optional
    }
    router.push('/(onboarding)/playbook');
  };

  // Tone-specific welcome paragraphs
  const welcomeMessage =
    coachTone === 'Straight'
      ? 'You stepped in and answered without hesitation. When you said “Pretty steady, just getting started,” you gave Priya something clear to hold onto. That grounded starting point makes conversations simple.'
      : coachTone === 'Funny'
        ? 'No awkward elevator silence detected! When you said “Pretty steady, just getting started,” you passed the small-talk survival test with flying colours.'
        : 'Welcome to yikes! When you answered Priya with “Pretty steady, just getting started,” you kept the door open with warmth. No performance needed—just two humans meeting where they are.';

  return (
    <Screen style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: spacing[12] }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text role="labelSmall" style={[styles.eyebrow, { color: accents.ember.base }]}>
            {todayCopy.coachRead.eyebrow}
          </Text>

          <View style={styles.avatarRow}>
            <View style={styles.avatarWrapper}>
              {/* Lilac Glow Pulse */}
              <Animated.View
                style={[
                  styles.lilacGlow,
                  { backgroundColor: accents.lilac.pop },
                  animatedGlowStyle,
                ]}
              />
              <WinceMascot pose="proud" size={60} />
            </View>

            <View style={styles.headlineTextContainer}>
              <Text role="displayMedium" style={[styles.headline, { color: colors.ink }]}>
                {todayCopy.coachRead.headline}
              </Text>
              <View style={[styles.toneBadge, { backgroundColor: accents.honey.tint }]}>
                <Text role="labelSmall" style={{ color: accents.honey.pop, fontWeight: '700' }}>
                  {todayCopy.coachRead.toneBadge(coachTone)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bento Tile 1: Coach Welcome Paragraph */}
        <Card tint="lilac" style={styles.bentoTile}>
          <View style={styles.tileHeader}>
            <View style={[styles.badgeDot, { backgroundColor: accents.lilac.base }]} />
            <Text role="labelSmall" style={{ color: accents.lilac.pop, fontWeight: '700' }}>
              {todayCopy.coachRead.tile1Title.toUpperCase()}
            </Text>
          </View>
          <Text role="bodyLarge" style={[styles.quoteText, { color: colors.ink }]}>
            {welcomeMessage}
          </Text>
        </Card>

        {/* Bento Tile 2: What I Noticed (2 Strengths) */}
        <Card tint="mint" style={styles.bentoTile}>
          <View style={styles.tileHeader}>
            <View style={[styles.badgeDot, { backgroundColor: accents.mint.base }]} />
            <Text role="labelSmall" style={{ color: accents.mint.pop, fontWeight: '700' }}>
              {todayCopy.coachRead.tile2Title.toUpperCase()}
            </Text>
          </View>

          <View style={styles.strengthsList}>
            <View style={styles.strengthItem}>
              <Text role="labelMedium" style={{ color: accents.mint.pop, fontWeight: '700' }}>
                1. Grounded pacing
              </Text>
              <Text role="bodySmall" muted>
                You didn’t rush or over-explain. You gave a measured, honest answer that felt natural.
              </Text>
            </View>

            <View style={styles.strengthItem}>
              <Text role="labelMedium" style={{ color: accents.mint.pop, fontWeight: '700' }}>
                2. Low conversational debt
              </Text>
              <Text role="bodySmall" muted>
                Your response made it effortless for Priya to chime in without feeling socially trapped.
              </Text>
            </View>
          </View>
        </Card>

        {/* Bento Tile 3: One Thing to Try (Rewrite in user voice) */}
        <Card tint="honey" style={styles.bentoTile}>
          <View style={styles.tileHeader}>
            <View style={[styles.badgeDot, { backgroundColor: accents.honey.base }]} />
            <Text role="labelSmall" style={{ color: accents.honey.pop, fontWeight: '700' }}>
              {todayCopy.coachRead.tile3Title.toUpperCase()}
            </Text>
          </View>

          <View style={styles.rewriteSection}>
            <Text role="bodyMedium" style={{ color: colors.ink, lineHeight: 22 }}>
              Next time, follow up with one curious observation about her coffee ritual:
            </Text>
            <View
              style={[
                styles.rewriteCard,
                { backgroundColor: colors.surface1, borderColor: colors.line },
              ]}
            >
              <Text role="titleSmall" style={{ color: accents.honey.pop, fontStyle: 'italic' }}>
                “Pretty steady. Is that coffee machine on the blink again, or did you crack the code?”
              </Text>
            </View>
            <Text role="bodySmall" muted>
              One tiny hook turns an answer into a shared smile.
            </Text>
          </View>
        </Card>

        {/* Bottom Continue Action */}
        <View style={styles.footerActions}>
          <Button
            variant="primary"
            label={todayCopy.coachRead.continueButton}
            onPress={handleContinue}
            accessibilityLabel={todayCopy.coachRead.continueButton}
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
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
  },
  header: {
    gap: 8,
    marginBottom: 4,
  },
  eyebrow: {
    fontWeight: '700',
    letterSpacing: 1.0,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarWrapper: {
    position: 'relative',
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lilacGlow: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  headlineTextContainer: {
    flex: 1,
    gap: 6,
  },
  headline: {
    fontSize: 22,
    lineHeight: 28,
  },
  toneBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bentoTile: {
    padding: 18,
    gap: 12,
  },
  tileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  quoteText: {
    lineHeight: 24,
  },
  strengthsList: {
    gap: 10,
  },
  strengthItem: {
    gap: 2,
  },
  rewriteSection: {
    gap: 8,
  },
  rewriteCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  footerActions: {
    marginTop: 8,
  },
  actionButton: {
    width: '100%',
  },
});
