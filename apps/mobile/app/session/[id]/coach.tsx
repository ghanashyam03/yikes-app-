import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { coachCopy } from '../../../src/copy/coach';
import { rewindAttempt } from '../../../src/features/coach/coachApi';
import { useCoachFeedback } from '../../../src/features/coach/useCoachFeedback';
import { useTheme } from '../../../src/theme/useTheme';
import { CharacterAvatar } from '../../../src/ui/components/CharacterAvatar';
import { Skeleton } from '../../../src/ui/components/Skeleton';
import { Button } from '../../../src/ui/primitives/Button';
import { Card } from '../../../src/ui/primitives/Card';
import { Screen } from '../../../src/ui/primitives/Screen';
import { HighlighterSwipe, Text } from '../../../src/ui/primitives/Text';

export default function SessionCoachScreen(): React.JSX.Element {
  const { id, attemptId, skillKey } = useLocalSearchParams<{
    id: string;
    attemptId?: string;
    skillKey?: string;
  }>();

  const router = useRouter();
  const { colors, accents, radii, reducedMotion } = useTheme();

  const effectiveAttemptId = attemptId || 'att_sample_session';

  const {
    feedback,
    isLoading,
    isRevealing,
    revealedWorkedCount,
    revealedPivot,
    revealedTryNext,
    isError,
    isOffline,
    errorMessage,
    fairnessRating,
    isSubmittingFairness,
    refetch,
    rateFeedback,
    saveQuoteToJournal,
  } = useCoachFeedback({
    attemptId: effectiveAttemptId,
    skillKey,
  });

  const [isRewinding, setIsRewinding] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleTryIt = async (rewriteText: string) => {
    setIsRewinding(true);
    try {
      const rewindRes = await rewindAttempt(null, effectiveAttemptId, 1);
      router.push({
        pathname: `/session/${id}/try`,
        params: {
          attemptId: rewindRes.newAttemptId,
          prefillText: rewriteText,
        },
      });
    } catch {
      router.push({
        pathname: `/session/${id}/try`,
        params: {
          attemptId: effectiveAttemptId,
          prefillText: rewriteText,
        },
      });
    } finally {
      setIsRewinding(false);
    }
  };

  const handleRewind = async () => {
    setIsRewinding(true);
    try {
      const rewindRes = await rewindAttempt(null, effectiveAttemptId, 1);
      router.push(`/session/${id}/try?attemptId=${rewindRes.newAttemptId}`);
    } catch {
      router.push(`/session/${id}/try?attemptId=${effectiveAttemptId}`);
    } finally {
      setIsRewinding(false);
    }
  };

  const handleQuoteLongPress = async (quote: string, why: string) => {
    await saveQuoteToJournal(quote, why);
    setToastMessage(coachCopy.actions.saveQuoteSuccess);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleSeeThoughts = () => {
    router.push(`/session/${id}/inner-voice?attemptId=${effectiveAttemptId}`);
  };

  const handleContinue = () => {
    router.push(`/session/${id}/out-there`);
  };

  return (
    <Screen style={styles.screen}>
      <ScrollView
        testID="session-coach-screen"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Coach Avatar */}
        <View style={styles.headerContainer}>
          <CharacterAvatar
            character="coach"
            size="lg"
            accessibilityLabel="Coach avatar"
          />
          <View style={styles.headerTextContainer}>
            <Text role="titleLarge" color={colors.ink}>
              {coachCopy.header.title}
            </Text>
            <Text role="bodySmall" color={colors.muted} style={{ marginTop: 4 }}>
              {coachCopy.header.subtitle}
            </Text>
          </View>
        </View>

        {/* Toast announcement */}
        {toastMessage && (
          <View style={[styles.toast, { backgroundColor: accents.mint.tint }]}>
            <Text role="labelMedium" color={accents.mint.base} style={{ fontWeight: '600' }}>
              ✓ {toastMessage}
            </Text>
          </View>
        )}

        {/* Offline Banner */}
        {isOffline && (
          <View style={[styles.banner, { backgroundColor: accents.honey.tint, borderColor: accents.honey.base }]}>
            <Text role="bodySmall" color={accents.honey.base}>
              {coachCopy.states.offline}
            </Text>
          </View>
        )}

        {/* SKELETON LOADING STATE */}
        {isLoading && (
          <View testID="coach-loading-skeleton" style={styles.skeletonContainer}>
            <Card tint="neutral" style={styles.tileCard}>
              <Skeleton width="40%" height={24} style={styles.skeletonMargin} />
              <Skeleton width="85%" height={16} style={styles.skeletonMargin} />
              <Skeleton shape="bubble" width="100%" height={56} style={styles.skeletonMargin} />
            </Card>
            <Card tint="neutral" style={styles.tileCard}>
              <Skeleton width="45%" height={24} style={styles.skeletonMargin} />
              <Skeleton width="75%" height={16} style={styles.skeletonMargin} />
              <Skeleton shape="card" width="100%" height={68} style={styles.skeletonMargin} />
            </Card>
            <Card tint="neutral" style={styles.tileCard}>
              <Skeleton width="50%" height={24} style={styles.skeletonMargin} />
              <Skeleton width="90%" height={16} style={styles.skeletonMargin} />
            </Card>
          </View>
        )}

        {/* ERROR STATE */}
        {isError && !isLoading && (
          <View testID="coach-error-state">
            <Card tint="honey" style={styles.errorCard}>
              <Text role="titleMedium" color={accents.honey.base}>
                {coachCopy.states.errorTitle}
              </Text>
              <Text role="bodyMedium" color={colors.muted} style={{ marginTop: 8 }}>
                {errorMessage || coachCopy.states.errorMessage}
              </Text>
              <View testID="coach-retry-button" style={{ marginTop: 16 }}>
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

        {/* LOADED TILES WITH PROGRESSIVE REVEAL */}
        {!isLoading && feedback && (
          <View style={styles.tilesContainer}>
            {/* TILE 1: WHAT WORKED (Mint Rule) */}
            {(reducedMotion || revealedWorkedCount > 0 || !isRevealing) && (
              <View testID="tile-what-worked">
                <Card
                  tint="mint"
                  style={[
                    styles.tileCard,
                    { borderLeftWidth: 4, borderLeftColor: accents.mint.base },
                  ]}
                >
                  <View style={styles.tileHeader}>
                    <HighlighterSwipe tint={accents.mint.tint}>
                      <Text role="titleMedium" color={accents.mint.base} style={{ fontWeight: '700' }}>
                        {coachCopy.tiles.worked.title}
                      </Text>
                    </HighlighterSwipe>
                  </View>

                  <Text role="bodySmall" color={colors.muted} style={{ marginBottom: 12 }}>
                    {coachCopy.tiles.worked.subtitle}
                  </Text>

                  {feedback.worked.length === 0 ? (
                    <Text role="bodyMedium" color={colors.muted} style={{ fontStyle: 'italic' }}>
                      {coachCopy.tiles.worked.noQuotesKindly}
                    </Text>
                  ) : (
                    feedback.worked.map((item, index) => (
                      <Pressable
                        key={index}
                        testID={`worked-quote-${index}`}
                        onLongPress={() => handleQuoteLongPress(item.quote, item.why)}
                        accessibilityRole="button"
                        accessibilityLabel={`${coachCopy.actions.saveQuoteA11y}: "${item.quote}"`}
                        style={[
                          styles.quoteBubble,
                          {
                            backgroundColor: accents.mint.tint,
                            borderColor: accents.mint.base,
                            borderRadius: radii.md,
                          },
                        ]}
                      >
                        <Text
                          role="bodyMedium"
                          color={accents.mint.base}
                          style={{
                            fontWeight: '600',
                            marginBottom: 4,
                          }}
                        >
                          "{item.quote}"
                        </Text>
                        <Text role="bodySmall" color={colors.ink}>
                          {item.why}
                        </Text>
                      </Pressable>
                    ))
                  )}
                </Card>
              </View>
            )}

            {/* TILE 2: A PIVOT MOMENT (Honey Rule) */}
            {(reducedMotion || revealedPivot || !isRevealing) && feedback.pivot && (
              <View testID="tile-pivot-moment">
                <Card
                  tint="honey"
                  style={[
                    styles.tileCard,
                    { borderLeftWidth: 4, borderLeftColor: accents.honey.base },
                  ]}
                >
                  <View style={styles.tileHeader}>
                    <HighlighterSwipe tint={accents.honey.tint}>
                      <Text role="titleMedium" color={accents.honey.base} style={{ fontWeight: '700' }}>
                        {coachCopy.tiles.pivot.title}
                      </Text>
                    </HighlighterSwipe>
                  </View>

                  <Text role="bodySmall" color={colors.muted} style={{ marginBottom: 12 }}>
                    {coachCopy.tiles.pivot.subtitle}
                  </Text>

                  <View
                    style={[
                      styles.quoteBubble,
                      {
                        backgroundColor: accents.honey.tint,
                        borderColor: accents.honey.base,
                        borderRadius: radii.md,
                      },
                    ]}
                  >
                    <Text role="labelSmall" color={colors.muted} style={{ fontWeight: '600' }}>
                      "{feedback.pivot.quote}"
                    </Text>
                    <Text role="bodyMedium" color={colors.ink} style={{ marginTop: 4 }}>
                      {feedback.pivot.whatHappened}
                    </Text>
                  </View>

                  <View style={[styles.rewriteBox, { backgroundColor: colors.surface1 }]}>
                    <Text role="labelSmall" color={accents.honey.base} style={{ fontWeight: '700' }}>
                      {coachCopy.tiles.pivot.rewriteLabel}
                    </Text>
                    <Text role="bodyMedium" color={colors.ink} style={{ marginTop: 2, fontStyle: 'italic' }}>
                      "{feedback.pivot.rewrite}"
                    </Text>

                    <View testID="try-it-button" style={{ marginTop: 10, alignSelf: 'flex-start' }}>
                      <Button
                        variant="secondary"
                        disabled={isRewinding}
                        onPress={() => handleTryIt(feedback.pivot!.rewrite)}
                        accessibilityLabel={coachCopy.tiles.pivot.tryItA11y}
                      >
                        {coachCopy.tiles.pivot.tryItButton}
                      </Button>
                    </View>
                  </View>
                </Card>
              </View>
            )}

            {/* TILE 3: TRY THIS NEXT TIME (Lilac Rule) */}
            {(reducedMotion || revealedTryNext || !isRevealing) && (
              <View testID="tile-try-next">
                <Card
                  tint="lilac"
                  style={[
                    styles.tileCard,
                    { borderLeftWidth: 4, borderLeftColor: accents.lilac.base },
                  ]}
                >
                  <View style={styles.tileHeader}>
                    <HighlighterSwipe tint={accents.lilac.tint}>
                      <Text role="titleMedium" color={accents.lilac.base} style={{ fontWeight: '700' }}>
                        {coachCopy.tiles.tryNext.title}
                      </Text>
                    </HighlighterSwipe>
                  </View>

                  <Text role="bodySmall" color={colors.muted} style={{ marginBottom: 12 }}>
                    {coachCopy.tiles.tryNext.subtitle}
                  </Text>

                  <Text role="bodyMedium" color={colors.ink} style={{ lineHeight: 22 }}>
                    {feedback.tryNext}
                  </Text>
                </Card>
              </View>
            )}

            {/* FAIRNESS THUMBS ("Was this fair?") */}
            <View testID="fairness-section" style={styles.fairnessContainer}>
              <Text role="bodySmall" color={colors.muted}>
                {coachCopy.actions.fairness}
              </Text>
              <View style={styles.thumbsRow}>
                <Pressable
                  testID="thumbs-up-button"
                  onPress={() => rateFeedback(1)}
                  disabled={isSubmittingFairness}
                  accessibilityRole="button"
                  accessibilityLabel={coachCopy.actions.thumbsUp}
                  style={[
                    styles.thumbButton,
                    fairnessRating === 1 && { backgroundColor: accents.mint.tint },
                  ]}
                >
                  <Text style={{ fontSize: 18 }}>👍</Text>
                  <Text role="labelSmall" color={colors.ink} style={{ marginLeft: 6 }}>
                    {coachCopy.actions.thumbsUp}
                  </Text>
                </Pressable>

                <Pressable
                  testID="thumbs-down-button"
                  onPress={() => rateFeedback(-1)}
                  disabled={isSubmittingFairness}
                  accessibilityRole="button"
                  accessibilityLabel={coachCopy.actions.thumbsDown}
                  style={[
                    styles.thumbButton,
                    fairnessRating === -1 && { backgroundColor: accents.honey.tint },
                  ]}
                >
                  <Text style={{ fontSize: 18 }}>👎</Text>
                  <Text role="labelSmall" color={colors.ink} style={{ marginLeft: 6 }}>
                    {coachCopy.actions.thumbsDown}
                  </Text>
                </Pressable>
              </View>

              {fairnessRating !== null && (
                <Text role="labelSmall" color={colors.muted} style={{ marginTop: 4 }}>
                  {coachCopy.actions.feedbackRecorded}
                </Text>
              )}
            </View>

            {/* NAVIGATION ACTIONS */}
            <View style={styles.actionButtonsContainer}>
              <View testID="see-thoughts-button" style={styles.navButton}>
                <Button
                  variant="secondary"
                  onPress={handleSeeThoughts}
                  accessibilityLabel={coachCopy.actions.seeThoughtsA11y('Maya')}
                >
                  {coachCopy.actions.seeThoughts('Maya')}
                </Button>
              </View>

              <View testID="rewind-button" style={styles.navButton}>
                <Button
                  variant="secondary"
                  disabled={isRewinding}
                  onPress={handleRewind}
                  accessibilityLabel={coachCopy.actions.rewindA11y}
                >
                  {coachCopy.actions.rewind}
                </Button>
              </View>

              <View testID="continue-button" style={styles.navButton}>
                <Button
                  variant="primary"
                  onPress={handleContinue}
                  accessibilityLabel={coachCopy.actions.continueA11y}
                >
                  {coachCopy.actions.continue}
                </Button>
              </View>
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
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  toast: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  banner: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  skeletonContainer: {
    gap: 16,
  },
  skeletonMargin: {
    marginBottom: 10,
  },
  errorCard: {
    padding: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  tilesContainer: {
    gap: 16,
  },
  tileCard: {
    padding: 18,
    marginBottom: 8,
  },
  tileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  quoteBubble: {
    padding: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  rewriteBox: {
    padding: 12,
    borderRadius: 8,
    marginTop: 6,
  },
  fairnessContainer: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  thumbsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  thumbButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 48,
    minWidth: 80,
    justifyContent: 'center',
  },
  actionButtonsContainer: {
    gap: 12,
    marginTop: 16,
  },
  navButton: {
    width: '100%',
  },
});
