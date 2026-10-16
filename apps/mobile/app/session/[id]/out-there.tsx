import React, { useMemo, useState } from 'react';
import {
  Pressable,
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
import { NoDefaultSlider } from '../../../src/ui/components/NoDefaultSlider';
import { useTheme } from '../../../src/theme/useTheme';
import { useSession } from '../../../src/features/auth/useSession';
import { useGuestProgressStore } from '../../../src/features/today/guestProgress';
import { getSessionData } from '../../../src/features/session-steps/sessionCatalog';
import { supabase } from '../../../src/features/auth/supabaseClient';
import { todayCopy } from '../../../src/copy/today';

const DEFAULT_MICRO_REPS: [string, string, string] = [
  'Ask one follow-up question in your next conversation.',
  'Observe the room for five seconds before answering.',
  'Share one specific personal detail before asking their view.',
];

export default function SessionOutThereScreen(): React.JSX.Element {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, accents, radii, spacing } = useTheme();
  const { session: authSession, isGuest } = useSession();
  const guestProgress = useGuestProgressStore();

  const session = useMemo(() => getSessionData(id), [id]);

  // Step 1: selecting micro-rep card; Step 2: Forecast
  const [selectedRep, setSelectedRep] = useState<string | null>(null);
  const [drainForecast, setDrainForecast] = useState<number | null>(null);
  const [warmthForecast, setWarmthForecast] = useState<number | null>(null);
  const [chosenAnchor, setChosenAnchor] = useState<string>(todayCopy.outThere.defaultAnchor);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const microReps = useMemo(() => {
    return DEFAULT_MICRO_REPS;
  }, []);

  const triggerHaptic = () => {
    try {
      void Haptics.selectionAsync();
    } catch {
      // Haptics optional
    }
  };

  const handleSelectRep = (rep: string) => {
    triggerHaptic();
    setSelectedRep(rep);
  };

  const handleSkip = () => {
    triggerHaptic();
    router.replace(`/session/${session.id}/complete` as never);
  };

  const handleCommit = async () => {
    if (!selectedRep || isSubmitting) return;
    setIsSubmitting(true);
    triggerHaptic();

    // 1. Save locally in guestProgress store
    guestProgress.addMicroRep({
      prompt: selectedRep,
      forecastDrain: drainForecast,
      forecastWarmth: warmthForecast,
      anchor: chosenAnchor,
    });

    // 2. Save in Supabase if logged in
    if (!isGuest && authSession?.user?.id) {
      try {
        await supabase.from('micro_reps').insert({
          user_id: authSession.user.id,
          forecast_drain: drainForecast,
          forecast_warmth: warmthForecast,
          outcome: selectedRep,
        });
      } catch {
        // Redacted error for data safety
      }
    }

    setIsSubmitting(false);
    router.replace(`/session/${session.id}/complete` as never);
  };

  return (
    <Screen style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: spacing[12] }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Step Indicator Header */}
        <View style={styles.header}>
          <Text role="labelSmall" style={[styles.eyebrow, { color: accents.ember.base }]}>
            {todayCopy.outThere.title.toUpperCase()} · STEP 6 OF 7
          </Text>
          <Text role="displayMedium" style={[styles.headline, { color: colors.ink }]}>
            {todayCopy.outThere.subtitle}
          </Text>
        </View>

        {/* 1. Micro-Rep Selection */}
        <View style={styles.section}>
          <Text role="titleMedium" style={[styles.sectionTitle, { color: colors.ink }]}>
            {todayCopy.outThere.pickPrompt}
          </Text>

          <View style={styles.cardsList}>
            {microReps.map((rep, idx) => {
              const isSelected = selectedRep === rep;
              return (
                <Pressable
                  key={`rep-${idx}`}
                  onPress={() => handleSelectRep(rep)}
                  accessibilityRole="button"
                  accessibilityLabel={rep}
                  accessibilityState={{ selected: isSelected }}
                >
                  <Card
                    tint={isSelected ? 'ember' : 'neutral'}
                    style={[
                      styles.repCard,
                      isSelected && { borderColor: accents.ember.base, borderWidth: 2 },
                    ]}
                  >
                    <View style={styles.repRow}>
                      <View
                        style={[
                          styles.radioDot,
                          {
                            borderColor: isSelected ? accents.ember.base : colors.muted,
                            backgroundColor: isSelected ? accents.ember.base : 'transparent',
                          },
                        ]}
                      />
                      <Text
                        role="bodyMedium"
                        style={[
                          styles.repText,
                          { color: colors.ink, fontWeight: isSelected ? '600' : '400' },
                        ]}
                      >
                        {rep}
                      </Text>
                    </View>
                  </Card>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 2. Forecast Section (appears when a rep is selected) */}
        {selectedRep && (
          <View style={styles.forecastSection}>
            <View style={styles.forecastHeader}>
              <Text role="titleMedium" style={{ color: colors.ink }}>
                {todayCopy.outThere.forecastTitle}
              </Text>
              <Text role="bodySmall" muted style={styles.forecastSubtitle}>
                {todayCopy.outThere.forecastSubtitle}
              </Text>
            </View>

            {/* Slider 1: Drain forecast */}
            <Card tint="lilac" style={styles.sliderCard}>
              <Text role="labelMedium" style={[styles.sliderLabel, { color: colors.ink }]}>
                {todayCopy.outThere.sliderDrainLabel}
              </Text>
              <View style={styles.sliderBoundaryLabels}>
                <Text role="labelSmall" muted>
                  {todayCopy.outThere.sliderDrainMin}
                </Text>
                <Text role="labelSmall" muted>
                  {todayCopy.outThere.sliderDrainMax}
                </Text>
              </View>
              <NoDefaultSlider
                value={drainForecast}
                onChange={setDrainForecast}
                min={1}
                max={5}
                step={1}
                accessibilityLabel={todayCopy.outThere.sliderDrainLabel}
              />
            </Card>

            {/* Slider 2: Warmth forecast */}
            <Card tint="honey" style={styles.sliderCard}>
              <Text role="labelMedium" style={[styles.sliderLabel, { color: colors.ink }]}>
                {todayCopy.outThere.sliderWarmthLabel}
              </Text>
              <View style={styles.sliderBoundaryLabels}>
                <Text role="labelSmall" muted>
                  {todayCopy.outThere.sliderWarmthMin}
                </Text>
                <Text role="labelSmall" muted>
                  {todayCopy.outThere.sliderWarmthMax}
                </Text>
              </View>
              <NoDefaultSlider
                value={warmthForecast}
                onChange={setWarmthForecast}
                min={1}
                max={5}
                step={1}
                accessibilityLabel={todayCopy.outThere.sliderWarmthLabel}
              />
            </Card>

            {/* Reminder anchor */}
            <View style={styles.anchorContainer}>
              <Text role="labelSmall" muted>
                {todayCopy.outThere.anchorLabel}
              </Text>
              <View style={styles.anchorChipsRow}>
                {['After lunch today', 'During standup', 'Tomorrow morning'].map((anchor) => (
                  <Pressable
                    key={anchor}
                    onPress={() => {
                      triggerHaptic();
                      setChosenAnchor(anchor);
                    }}
                    style={[
                      styles.anchorChip,
                      {
                        backgroundColor: chosenAnchor === anchor ? accents.mint.tint : colors.surface1,
                        borderColor: chosenAnchor === anchor ? accents.mint.base : colors.line,
                        borderRadius: radii.pill,
                      },
                    ]}
                  >
                    <Text
                      role="labelSmall"
                      style={{
                        color: chosenAnchor === anchor ? accents.mint.pop : colors.muted,
                        fontWeight: chosenAnchor === anchor ? '700' : '500',
                      }}
                    >
                      {anchor}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Action Buttons: Skip and Commit are equal in weight */}
        <View style={styles.actionsFooter}>
          {selectedRep ? (
            <Button
              variant="primary"
              label={todayCopy.outThere.chooseButton}
              onPress={handleCommit}
              disabled={isSubmitting}
              accessibilityLabel={todayCopy.outThere.chooseButton}
              style={styles.actionButton}
            />
          ) : null}

          <Button
            variant="secondary"
            label={todayCopy.outThere.skipButton}
            onPress={handleSkip}
            accessibilityLabel={todayCopy.outThere.skipButton}
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
    gap: 20,
  },
  header: {
    gap: 6,
  },
  eyebrow: {
    fontWeight: '700',
    letterSpacing: 1.0,
  },
  headline: {
    fontSize: 26,
    lineHeight: 32,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
  },
  cardsList: {
    gap: 12,
  },
  repCard: {
    padding: 16,
  },
  repRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  repText: {
    flex: 1,
    lineHeight: 22,
  },
  forecastSection: {
    gap: 16,
    marginTop: 8,
  },
  forecastHeader: {
    gap: 4,
  },
  forecastSubtitle: {
    lineHeight: 18,
  },
  sliderCard: {
    padding: 16,
    gap: 8,
  },
  sliderLabel: {
    fontWeight: '600',
  },
  sliderBoundaryLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  anchorContainer: {
    gap: 8,
  },
  anchorChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  anchorChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    minHeight: 38,
    justifyContent: 'center',
  },
  actionsFooter: {
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    width: '100%',
  },
});
