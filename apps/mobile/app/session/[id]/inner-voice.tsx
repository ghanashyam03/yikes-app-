import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { coachCopy } from '../../../src/copy/coach';
import { useInnerVoice } from '../../../src/features/coach/useInnerVoice';
import { useTheme } from '../../../src/theme/useTheme';
import { CharacterAvatar } from '../../../src/ui/components/CharacterAvatar';
import { Skeleton } from '../../../src/ui/components/Skeleton';
import { ThoughtBubble } from '../../../src/ui/components/ThoughtBubble';
import { Button } from '../../../src/ui/primitives/Button';
import { Card } from '../../../src/ui/primitives/Card';
import { Screen } from '../../../src/ui/primitives/Screen';
import { Text } from '../../../src/ui/primitives/Text';

export default function SessionInnerVoiceScreen(): React.JSX.Element {
  const { attemptId, partnerName = 'Maya' } = useLocalSearchParams<{
    id: string;
    attemptId?: string;
    partnerName?: string;
  }>();

  const router = useRouter();
  const { colors, accents } = useTheme();

  const effectiveAttemptId = attemptId || 'att_sample_session';

  const {
    thoughts,
    isLoading,
    isError,
    errorMessage,
    activeTurnIndex,
    totalTurns,
    selectedThoughtIndex,
    isPlaying,
    setActiveTurnIndex,
    selectThought,
    toggleReplay,
    refetch,
  } = useInnerVoice({
    attemptId: effectiveAttemptId,
  });

  const activeThought = thoughts.find((t) => t.turnIndex === activeTurnIndex) ?? thoughts[0];

  const handleDone = () => {
    router.back();
  };

  return (
    <Screen style={styles.screen}>
      <ScrollView
        testID="session-inner-voice-screen"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Partner Avatar & Title */}
        <View style={styles.header}>
          <CharacterAvatar
            character="maya"
            expression="warm"
            size="lg"
            accessibilityLabel={`${partnerName} portrait`}
          />
          <View style={styles.headerTitles}>
            <Text role="titleLarge" color={colors.ink}>
              {coachCopy.innerVoice.title(partnerName)}
            </Text>
            <Text role="bodySmall" color={colors.muted} style={{ marginTop: 4 }}>
              {coachCopy.innerVoice.subtitle}
            </Text>
          </View>
        </View>

        {/* LOADING STATE */}
        {isLoading && (
          <View testID="inner-voice-loading" style={styles.skeletonBox}>
            <Skeleton shape="bubble" width="100%" height={100} />
            <Skeleton width="60%" height={24} style={{ marginTop: 16 }} />
          </View>
        )}

        {/* ERROR STATE */}
        {isError && !isLoading && (
          <View testID="inner-voice-error">
            <Card tint="honey" style={styles.errorCard}>
              <Text role="titleMedium" color={accents.honey.base}>
                {coachCopy.states.errorTitle}
              </Text>
              <Text role="bodyMedium" color={colors.muted} style={{ marginTop: 8 }}>
                {errorMessage || coachCopy.states.errorMessage}
              </Text>
              <View style={{ marginTop: 16 }}>
                <Button
                  variant="secondary"
                  onPress={refetch}
                  accessibilityLabel={coachCopy.states.retry}
                >
                  {coachCopy.states.retry}
                </Button>
              </View>
            </Card>
          </View>
        )}

        {/* ACTIVE THOUGHT REVEAL */}
        {!isLoading && !isError && (
          <View style={styles.thoughtSection}>
            {activeThought ? (
              <View key={activeThought.turnIndex} style={styles.bubbleWrapper}>
                <ThoughtBubble
                  testID="active-thought-bubble"
                  thought={activeThought.thought}
                  accentColor={accents.lilac.base}
                  accessibilityLabel={`Private thought at turn ${activeTurnIndex + 1}: "${activeThought.thought}"`}
                  onPop={() => selectThought(activeThought.turnIndex)}
                />

                <Text
                  role="bodySmall"
                  color={colors.muted}
                  style={{
                    marginTop: 8,
                    textAlign: 'center',
                    fontStyle: 'italic',
                  }}
                >
                  {coachCopy.innerVoice.tapThoughtHint}
                </Text>
              </View>
            ) : (
              <Card tint="neutral" style={styles.emptyThoughtCard}>
                <Text role="bodyMedium" color={colors.muted} style={{ textAlign: 'center' }}>
                  No private thought recorded for this turn.
                </Text>
              </Card>
            )}

            {/* SCRUBBER TIMELINE */}
            <View style={styles.scrubberContainer}>
              <View style={styles.scrubberHeader}>
                <Text role="bodySmall" color={colors.ink} style={{ fontWeight: '600' }}>
                  {coachCopy.innerVoice.scrubberLabel(activeTurnIndex, totalTurns)}
                </Text>

                <Pressable
                  testID="toggle-replay-button"
                  onPress={toggleReplay}
                  accessibilityRole="button"
                  accessibilityLabel={isPlaying ? 'Pause slow replay' : 'Start slow replay'}
                  style={[
                    styles.replayButton,
                    {
                      backgroundColor: isPlaying ? accents.mint.tint : colors.surface1,
                      borderColor: isPlaying ? accents.mint.base : colors.muted,
                    },
                  ]}
                >
                  <Text role="labelSmall" color={colors.ink} style={{ fontWeight: '600' }}>
                    {isPlaying ? '⏸ Pause' : '▶ Slow Replay'}
                  </Text>
                </Pressable>
              </View>

              {/* Turn selector chips */}
              <View style={styles.turnChipsRow}>
                {Array.from({ length: totalTurns }).map((_, idx) => {
                  const isSelected = idx === activeTurnIndex;
                  return (
                    <Pressable
                      key={idx}
                      testID={`turn-scrubber-pill-${idx}`}
                      onPress={() => setActiveTurnIndex(idx)}
                      accessibilityRole="button"
                      accessibilityLabel={`Jump to turn ${idx + 1}`}
                      style={[
                        styles.turnPill,
                        {
                          backgroundColor: isSelected ? accents.lilac.base : colors.surface1,
                          borderColor: isSelected ? accents.lilac.base : '#CBD5E1',
                        },
                      ]}
                    >
                      <Text
                        role="labelSmall"
                        color={isSelected ? '#FFFFFF' : colors.ink}
                        style={{
                          fontWeight: isSelected ? '700' : '500',
                        }}
                      >
                        {idx + 1}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* MATCHING COACH NOTE (If thought tapped) */}
            {selectedThoughtIndex !== null && (
              <View testID="matching-coach-note">
                <Card
                  tint="mint"
                  style={styles.matchingNoteCard}
                >
                  <Text role="labelSmall" color={accents.mint.base} style={{ fontWeight: '700' }}>
                    COACH OBSERVATION (TURN {selectedThoughtIndex + 1})
                  </Text>
                  <Text role="bodyMedium" color={colors.ink} style={{ marginTop: 4 }}>
                    Notice how this private thought aligned directly with your conversational tone.
                  </Text>
                </Card>
              </View>
            )}

            {/* HONESTY DISCLAIMER */}
            <View style={[styles.disclaimerBox, { backgroundColor: colors.surface1 }]}>
              <Text role="bodySmall" color={colors.muted} style={{ textAlign: 'center', lineHeight: 18 }}>
                {coachCopy.innerVoice.disclaimer}
              </Text>
            </View>

            {/* DONE BUTTON */}
            <View testID="inner-voice-done-button" style={{ marginTop: 24 }}>
              <Button
                variant="primary"
                onPress={handleDone}
                accessibilityLabel={coachCopy.innerVoice.doneA11y}
              >
                {coachCopy.innerVoice.done}
              </Button>
            </View>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitles: {
    marginLeft: 16,
    flex: 1,
  },
  skeletonBox: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  errorCard: {
    padding: 20,
    alignItems: 'center',
  },
  thoughtSection: {
    gap: 16,
  },
  bubbleWrapper: {
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 12,
  },
  emptyThoughtCard: {
    padding: 20,
    alignItems: 'center',
  },
  scrubberContainer: {
    marginTop: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  scrubberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  replayButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: 'center',
  },
  turnChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  turnPill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchingNoteCard: {
    padding: 14,
  },
  disclaimerBox: {
    padding: 14,
    borderRadius: 12,
    marginTop: 8,
  },
});
