import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { sessionCopy } from '../../../src/copy/session';
import { SessionBeatBar } from '../../../src/features/session-steps/SessionBeatBar';
import { useSessionStep } from '../../../src/features/session-steps/useSessionStep';
import { useTheme } from '../../../src/theme/useTheme';
import { CharacterAvatar } from '../../../src/ui/components/CharacterAvatar';
import { Card } from '../../../src/ui/primitives/Card';
import { Screen } from '../../../src/ui/primitives/Screen';
import { Text } from '../../../src/ui/primitives/Text';

export default function SessionWatchScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, accents, radii } = useTheme();

  const {
    session,
    persona,
    watchStep,
    selectedWatchLine,
    watchFeedback,
    showWatchTarget,
    handleTapWatchLine,
    handleShowMe,
    handleNext,
    handleSkip,
  } = useSessionStep({ sessionId: id, currentBeat: 'watch' });

  const isSolved = watchFeedback === 'correct' || showWatchTarget;

  return (
    <Screen style={styles.screen}>
      <View testID="session-watch-screen" style={styles.container}>
        {/* Top Header & Progress */}
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={sessionCopy.navigation.back}
            hitSlop={12}
            style={styles.backButton}
          >
            <Text role="labelMedium" color={colors.muted}>
              ← {sessionCopy.navigation.back}
            </Text>
          </Pressable>
          <Text role="labelSmall" muted>
            {session.title}
          </Text>
        </View>

        <SessionBeatBar currentBeat="watch" />

        {/* Character Info & Instruction */}
        <View style={styles.partnerRow}>
          <CharacterAvatar
            character={(persona.id === 'alex' || persona.id === 'sam' || persona.id === 'priya' ? persona.id : 'maya')}
            expression="warm"
            size={48}
          />
          <View style={styles.partnerTextCol}>
            <Text role="titleSmall" color={colors.ink}>
              {persona.name}
            </Text>
            <Text role="labelSmall" muted>
              {sessionCopy.watch.instruction}
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Dialogue Lines */}
          <View style={styles.dialogueList}>
            {watchStep.dialogue.map((line, idx) => {
              const isSelected = selectedWatchLine === idx;
              const isTarget = idx === watchStep.targetLineIndex;
              const isCorrectGlow = (isSelected && isTarget) || (showWatchTarget && isTarget);
              const isWrongTap = isSelected && !isTarget;

              return (
                <Pressable
                  key={idx}
                  testID={`watch-line-${idx}`}
                  onPress={() => handleTapWatchLine(idx)}
                  accessibilityRole="button"
                  accessibilityLabel={`${line.speaker}: ${line.text}`}
                  accessibilityState={{ selected: isSelected }}
                  style={[
                    styles.lineCard,
                    {
                      borderColor: isCorrectGlow
                        ? accents.mint.base
                        : isWrongTap
                          ? accents.honey.base
                          : colors.line,
                      backgroundColor: isCorrectGlow
                        ? accents.mint.tint
                        : isWrongTap
                          ? accents.honey.tint
                          : colors.surface1,
                      borderRadius: radii.lg,
                    },
                  ]}
                >
                  <View style={styles.lineHeader}>
                    <Text
                      role="labelSmall"
                      color={isCorrectGlow ? accents.mint.pop : colors.muted}
                    >
                      {line.speaker}
                    </Text>
                    {isCorrectGlow && (
                      <View
                        style={[
                          styles.correctPill,
                          { backgroundColor: accents.mint.base, borderRadius: radii.pill },
                        ]}
                      >
                        <Text role="labelSmall" color="#FFFFFF">
                          {sessionCopy.watch.correctFeedback}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text role="bodyLarge" color={colors.ink} style={styles.lineBody}>
                    {line.text}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Feedback & Explanation Card */}
          {watchFeedback === 'wrong' && (
            <View testID="watch-wrong-feedback">
              <Card
                tint="honey"
                style={[styles.feedbackCard, { borderRadius: radii.md }]}
              >
                <Text role="bodyMedium" color={colors.ink}>
                  {sessionCopy.watch.wrongFeedback}
                </Text>
              </Card>
            </View>
          )}

          {isSolved && (
            <View testID="watch-correct-feedback">
              <Card
                tint="mint"
                style={[styles.feedbackCard, { borderRadius: radii.md }]}
              >
                <Text role="labelMedium" color={accents.mint.pop} style={styles.explanationTitle}>
                  {sessionCopy.watch.revealedNote}
                </Text>
                <Text role="bodyMedium" color={colors.ink}>
                  {watchStep.explanation}
                </Text>
              </Card>
            </View>
          )}

          {/* "Show me" Button */}
          {!isSolved && (
            <View style={styles.showMeRow}>
              <Pressable
                testID="watch-show-me-button"
                accessibilityRole="button"
                accessibilityLabel={sessionCopy.watch.showMeButton}
                onPress={handleShowMe}
                style={[
                  styles.secondaryActionButton,
                  { borderColor: colors.line, borderRadius: radii.pill },
                ]}
              >
                <Text role="labelMedium" color={colors.ink}>
                  {sessionCopy.watch.showMeButton}
                </Text>
              </Pressable>
            </View>
          )}
        </ScrollView>

        {/* Footer Navigation */}
        <View style={[styles.footer, { borderTopColor: colors.line, borderTopWidth: 1 }]}>
          <Pressable
            testID="watch-skip-button"
            onPress={handleSkip}
            accessibilityRole="button"
            accessibilityLabel={sessionCopy.watch.skipButton}
            style={styles.skipButton}
          >
            <Text role="labelMedium" muted>
              {sessionCopy.watch.skipButton}
            </Text>
          </Pressable>

          <Pressable
            testID="watch-next-button"
            accessibilityRole="button"
            accessibilityLabel={sessionCopy.watch.nextButton}
            onPress={handleNext}
            style={[
              styles.primaryActionButton,
              { backgroundColor: accents.ember.base, borderRadius: radii.pill },
            ]}
          >
            <Text role="labelLarge" color="#FFFFFF">
              {sessionCopy.watch.nextButton}
            </Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    paddingVertical: 4,
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 12,
  },
  partnerTextCol: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 12,
    paddingBottom: 24,
  },
  dialogueList: {
    gap: 12,
  },
  lineCard: {
    padding: 16,
    borderWidth: 1.5,
  },
  lineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  lineBody: {
    lineHeight: 24,
  },
  correctPill: {
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  feedbackCard: {
    marginTop: 16,
    padding: 16,
  },
  explanationTitle: {
    marginBottom: 4,
    fontWeight: '600',
  },
  showMeRow: {
    alignItems: 'center',
    marginTop: 20,
  },
  secondaryActionButton: {
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    gap: 16,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  primaryActionButton: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
});
