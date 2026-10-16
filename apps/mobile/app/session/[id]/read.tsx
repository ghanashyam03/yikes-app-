import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { sessionCopy } from '../../../src/copy/session';
import { SessionBeatBar } from '../../../src/features/session-steps/SessionBeatBar';
import { useSessionStep } from '../../../src/features/session-steps/useSessionStep';
import { useTheme } from '../../../src/theme/useTheme';
import { CharacterAvatar } from '../../../src/ui/components/CharacterAvatar';
import { ChatBubble } from '../../../src/ui/components/ChatBubble';
import { Card } from '../../../src/ui/primitives/Card';
import { Screen } from '../../../src/ui/primitives/Screen';
import { Text } from '../../../src/ui/primitives/Text';

export default function SessionReadScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, accents, radii } = useTheme();

  const {
    session,
    persona,
    readStep,
    selectedThoughtIndex,
    isReadRevealed,
    handleSelectThought,
    handleNext,
    handleSkip,
  } = useSessionStep({ sessionId: id, currentBeat: 'read' });

  const trueThoughtText = readStep.candidateThoughts[readStep.trueIndex] ?? '';

  return (
    <Screen style={styles.screen}>
      <View testID="session-read-screen" style={styles.container}>
        {/* Header & Progress */}
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

        <SessionBeatBar currentBeat="read" />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Scene Context & Dialogue */}
          <View style={styles.sceneSection}>
            <Text role="labelSmall" muted style={styles.sceneLabel}>
              SCENE
            </Text>
            <Text role="bodyMedium" color={colors.ink} style={styles.sceneText}>
              {readStep.scene}
            </Text>
          </View>

          <View style={styles.dialogueSection}>
            {readStep.dialogue.map((line, idx) => {
              const isUser = line.speaker.toLowerCase() === 'you';
              return (
                <View
                  key={idx}
                  style={[
                    styles.bubbleWrapper,
                    isUser ? styles.bubbleRight : styles.bubbleLeft,
                  ]}
                >
                  <ChatBubble
                    variant={isUser ? 'user' : 'partner'}
                    senderName={line.speaker}
                    text={line.text}
                  />
                </View>
              );
            })}
          </View>

          {/* Prompt Question */}
          <View style={styles.questionSection}>
            <Text role="titleMedium" color={colors.ink} style={styles.questionTitle}>
              {sessionCopy.read.questionPrefix}
              {persona.name}
              {sessionCopy.read.questionSuffix}
            </Text>
            <Text role="bodySmall" muted>
              {sessionCopy.read.choosePrompt}
            </Text>
          </View>

          {/* Three Candidate Thought Cards */}
          <View style={styles.candidatesContainer}>
            {readStep.candidateThoughts.map((thought, idx) => {
              const isSelected = selectedThoughtIndex === idx;
              const isTrueThought = idx === readStep.trueIndex;
              const highlight = isReadRevealed && isTrueThought;

              return (
                <Pressable
                  key={idx}
                  testID={`read-candidate-${idx}`}
                  onPress={() => handleSelectThought(idx)}
                  accessibilityRole="button"
                  accessibilityLabel={`Option ${idx + 1}: ${thought}`}
                  accessibilityState={{ selected: isSelected }}
                  style={[
                    styles.candidateCard,
                    {
                      borderColor: highlight
                        ? persona.palette.primary
                        : isSelected
                          ? accents.lilac.base
                          : colors.line,
                      backgroundColor: highlight
                        ? `${persona.palette.primary}22`
                        : isSelected
                          ? accents.lilac.tint
                          : colors.surface1,
                      borderRadius: radii.lg,
                    },
                  ]}
                >
                  <View style={styles.candidateHeader}>
                    <Text
                      role="labelSmall"
                      color={highlight ? persona.palette.primary : colors.muted}
                    >
                      OPTION {idx + 1}
                    </Text>
                    {highlight && (
                      <View
                        style={[
                          styles.trueBadge,
                          { backgroundColor: persona.palette.primary, borderRadius: radii.pill },
                        ]}
                      >
                        <Text role="labelSmall" color="#FFFFFF">
                          Actual thought
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text role="bodyLarge" color={colors.ink}>
                    “{thought}”
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Reveal & Cue Section (When selected) */}
          {isReadRevealed && (
            <View testID="read-reveal-section" style={styles.revealSection}>
              {/* Partner Real Thought Bubble */}
              <View style={styles.revealHeader}>
                <CharacterAvatar
                  character={(persona.id === 'alex' || persona.id === 'sam' || persona.id === 'priya' ? persona.id : 'maya')}
                  expression="warm"
                  size={40}
                />
                <Text role="titleSmall" color={colors.ink}>
                  {persona.name}’s private thought:
                </Text>
              </View>

              <Card
                tint="neutral"
                style={[
                  styles.realThoughtCard,
                  {
                    borderColor: persona.palette.primary,
                    borderWidth: 1.5,
                    borderRadius: radii.lg,
                  },
                ]}
              >
                <Text role="bodyLarge" color={colors.ink} style={styles.italicThought}>
                  “{trueThoughtText}”
                </Text>
              </Card>

              {/* Cue Note */}
              <Card
                tint="neutral"
                style={[styles.cueCard, { borderRadius: radii.md, marginTop: 12 }]}
              >
                <Text role="labelSmall" color={persona.palette.primary} style={styles.cueTitle}>
                  {sessionCopy.read.cueHeader.toUpperCase()}:
                </Text>
                <Text role="bodyMedium" color={colors.ink}>
                  {readStep.cueNote}
                </Text>
              </Card>

              {/* Mandatory Honest Disclaimer */}
              <View testID="read-disclaimer-note" style={styles.disclaimerContainer}>
                <Text role="labelSmall" muted style={styles.disclaimerTitle}>
                  {sessionCopy.read.disclaimer}
                </Text>
                <Text role="bodySmall" muted>
                  {sessionCopy.read.disclaimerNote}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer Navigation */}
        <View style={[styles.footer, { borderTopColor: colors.line, borderTopWidth: 1 }]}>
          <Pressable
            testID="read-skip-button"
            onPress={handleSkip}
            accessibilityRole="button"
            accessibilityLabel={sessionCopy.read.skipButton}
            style={styles.skipButton}
          >
            <Text role="labelMedium" muted>
              {sessionCopy.read.skipButton}
            </Text>
          </Pressable>

          <Pressable
            testID="read-next-button"
            accessibilityRole="button"
            accessibilityLabel={sessionCopy.read.nextButton}
            onPress={handleNext}
            style={[
              styles.primaryActionButton,
              { backgroundColor: accents.ember.base, borderRadius: radii.pill },
            ]}
          >
            <Text role="labelLarge" color="#FFFFFF">
              {sessionCopy.read.nextButton}
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 12,
    paddingBottom: 24,
  },
  sceneSection: {
    marginBottom: 16,
  },
  sceneLabel: {
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  sceneText: {
    lineHeight: 22,
  },
  dialogueSection: {
    gap: 12,
    marginBottom: 20,
  },
  bubbleWrapper: {
    width: '100%',
  },
  bubbleLeft: {
    alignItems: 'flex-start',
  },
  bubbleRight: {
    alignItems: 'flex-end',
  },
  questionSection: {
    marginBottom: 16,
  },
  questionTitle: {
    marginBottom: 4,
  },
  candidatesContainer: {
    gap: 12,
    marginBottom: 20,
  },
  candidateCard: {
    padding: 16,
    borderWidth: 1.5,
  },
  candidateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trueBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  revealSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#00000010',
  },
  revealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  realThoughtCard: {
    padding: 18,
  },
  italicThought: {
    fontStyle: 'italic',
    lineHeight: 24,
  },
  cueCard: {
    padding: 16,
  },
  cueTitle: {
    marginBottom: 4,
    fontWeight: '600',
  },
  disclaimerContainer: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#00000006',
  },
  disclaimerTitle: {
    fontWeight: '600',
    marginBottom: 2,
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
