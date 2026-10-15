import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Screen } from '../../src/ui/primitives/Screen';
import { Text } from '../../src/ui/primitives/Text';
import { Button } from '../../src/ui/primitives/Button';
import { Card } from '../../src/ui/primitives/Card';
import { WinceMascot } from '../../src/ui/components/WinceMascot';
import { useTheme } from '../../src/theme/useTheme';
import { onboardingCopy } from '../../src/copy/onboarding';
import { DEEPER_STATEMENTS } from '@yikes/shared/playbook/deeper';
import { useOnboardingStore } from '../../src/features/onboarding/store';

export default function DeeperProfileScreen(): React.JSX.Element {
  const router = useRouter();
  const { colors, accents, spacing } = useTheme();

  const [statementIndex, setStatementIndex] = useState(0);
  const deeperAnswers = useOnboardingStore((s) => s.deeperAnswers);
  const setDeeperAnswer = useOnboardingStore((s) => s.setDeeperAnswer);
  const updateDerivedPlaybook = useOnboardingStore((s) => s.updateDerivedPlaybook);

  const currentStatement = (DEEPER_STATEMENTS[statementIndex] ?? DEEPER_STATEMENTS[0]) as (typeof DEEPER_STATEMENTS)[number];
  const currentValue = deeperAnswers[currentStatement.id] ?? null;

  const triggerHaptic = () => {
    try {
      void Haptics.selectionAsync();
    } catch {
      // Haptic fallback
    }
  };

  const handleSelectScore = (score: number) => {
    triggerHaptic();
    setDeeperAnswer(currentStatement.id, score);
  };

  const handleBack = () => {
    if (statementIndex > 0) {
      setStatementIndex((prev) => prev - 1);
    } else {
      router.push('/(onboarding)/quiz/14');
    }
  };

  const handleContinue = () => {
    if (statementIndex < DEEPER_STATEMENTS.length - 1) {
      setStatementIndex((prev) => prev + 1);
    } else {
      updateDerivedPlaybook();
      router.push('/(onboarding)/playbook');
    }
  };

  const handleSkip = () => {
    updateDerivedPlaybook();
    router.push('/(onboarding)/playbook');
  };

  const copy = onboardingCopy.deeper;

  return (
    <Screen style={styles.container}>
      {/* Top Bar with Back Navigation */}
      <View style={styles.topBar}>
        <Pressable
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backButton}
        >
          <Text role="bodyLarge" style={{ color: colors.ink, fontWeight: '600' }}>
            ←
          </Text>
        </Pressable>
        <Text role="labelSmall" style={[styles.eyebrow, { color: accents.ember.base }]}>
          {copy.eyebrow}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text
            role="displayMedium"
            style={[
              styles.headline,
              {
                color: colors.ink
              }
            ]}
          >
            {copy.headline}
          </Text>
          <Text role="bodyMedium" muted style={styles.subtitle}>
            {copy.subtitle}
          </Text>
        </View>

        {/* Statement Card */}
        <Card tint="lilac" style={styles.statementCard}>
          <View style={styles.cardTopRow}>
            <Text role="labelSmall" style={{ color: accents.ember.base, fontWeight: '700' }}>
              {copy.progressText(statementIndex + 1, DEEPER_STATEMENTS.length)}
            </Text>
            <View style={[styles.cardDot, { backgroundColor: accents.lilac.base }]} />
          </View>

          <Text role="titleMedium" style={[styles.statementText, { color: colors.ink }]}>
            "{currentStatement.text}"
          </Text>

          <Text role="labelSmall" muted style={styles.promptText}>
            {copy.promptText}
          </Text>

          {/* 1 to 5 scale buttons */}
          <View style={styles.scaleRow} accessibilityRole="radiogroup">
            {[1, 2, 3, 4, 5].map((score) => {
              const isSelected = currentValue === score;
              return (
                <Pressable
                  key={score}
                  onPress={() => handleSelectScore(score)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`Score ${score} of 5`}
                  style={[
                    styles.scoreButton,
                    {
                      backgroundColor: isSelected ? accents.lilac.base : colors.surface1,
                      borderColor: isSelected ? accents.lilac.base : colors.line
                    }
                  ]}
                >
                  <Text
                    role="labelLarge"
                    style={{
                      color: isSelected ? colors.surface1 : colors.ink,
                      fontWeight: '700'
                    }}
                  >
                    {score}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.scaleLabels}>
            <Text role="labelSmall" muted>
              {copy.minLabel}
            </Text>
            <Text role="labelSmall" muted>
              {copy.maxLabel}
            </Text>
          </View>
        </Card>

        {/* Mascot */}
        <View style={styles.mascotContainer}>
          <WinceMascot pose="thinking" size={68} />
        </View>

        {/* Footer Actions */}
        <View style={[styles.footer, { paddingBottom: spacing[8] }]}>
          <Button
            variant="primary"
            label={copy.continueButton}
            onPress={handleContinue}
            accessibilityLabel={copy.continueButton}
            style={styles.actionButton}
          />

          <Pressable
            onPress={handleSkip}
            accessibilityRole="button"
            accessibilityLabel={copy.skipButton}
            style={styles.skipButton}
          >
            <Text role="bodyMedium" muted style={styles.skipText}>
              {copy.skipButton}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    minHeight: 48
  },
  backButton: {
    minHeight: 48,
    minWidth: 48,
    justifyContent: 'center',
    alignItems: 'center'
  },
  eyebrow: {
    letterSpacing: 1.0,
    fontWeight: '700'
  },
  placeholder: {
    width: 48,
    height: 48
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between'
  },
  header: {
    marginTop: 8,
    marginBottom: 20
  },
  headline: {
    fontSize: 28,
    lineHeight: 34,
    marginBottom: 8
  },
  subtitle: {
    lineHeight: 20
  },
  statementCard: {
    padding: 20,
    marginVertical: 12
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  cardDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  statementText: {
    lineHeight: 24,
    marginBottom: 16
  },
  promptText: {
    marginBottom: 12
  },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8
  },
  scoreButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center'
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8
  },
  mascotContainer: {
    alignItems: 'center',
    marginVertical: 12
  },
  footer: {
    marginTop: 16,
    gap: 12,
    alignItems: 'center'
  },
  actionButton: {
    width: '100%'
  },
  skipButton: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16
  },
  skipText: {
    fontWeight: '600'
  }
});
