import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { checkinsCopy } from '../../src/copy/checkins';
import { useSession } from '../../src/features/auth/useSession';
import { useCheckin } from '../../src/features/checkin/useCheckin';
import type {
  CheckinOutcome,
  WarmthRating,
} from '../../src/features/checkin/types';
import { useMoments } from '../../src/features/moments/useMoments';
import { useTheme } from '../../src/theme/useTheme';
import { BatteryGauge } from '../../src/ui/components/BatteryGauge';
import { Button } from '../../src/ui/primitives/Button';
import { Card } from '../../src/ui/primitives/Card';
import { Chip } from '../../src/ui/primitives/Chip';
import { Screen } from '../../src/ui/primitives/Screen';
import { Text } from '../../src/ui/primitives/Text';

export default function MicroRepCheckinScreen(): React.JSX.Element {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, accents, radii } = useTheme();
  const { session } = useSession();
  const userId = session?.user?.id;

  const { getMoment } = useMoments();
  const moment = id ? getMoment(id) : undefined;

  const {
    step,
    setStep,
    outcome,
    setOutcome,
    warmth,
    setWarmth,
    actualDrain,
    setActualDrain,
    forecast,
    setForecast,
    coachReflection,
    isLoading,
    submitCheckin,
    resetFlow,
  } = useCheckin();

  const [batteryValue, setBatteryValue] = useState<number>(actualDrain * 10);

  useEffect(() => {
    // If the moment has custom forecast, configure it
    if (moment?.formality !== undefined) {
      setForecast({
        draining: Math.max(1, Math.min(10, moment.formality)),
        warmth: 5,
      });
    }
  }, [moment, setForecast]);

  const handleStep1Select = (opt: CheckinOutcome) => {
    setOutcome(opt);
    setStep(2);
  };

  const handleStep2Select = (w: WarmthRating) => {
    setWarmth(w);
    setStep(3);
  };

  const handleStep3BatteryChange = (pct: number) => {
    setBatteryValue(pct);
    setActualDrain(Math.round(pct / 10));
  };

  const handleStep3Submit = async () => {
    await submitCheckin(id, userId);
  };

  const handleDone = () => {
    resetFlow();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/moments');
    }
  };

  return (
    <Screen style={styles.screen}>
      <View testID="checkin-screen" style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            testID="checkin-back-button"
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => {
              if (step > 1 && step < 4) {
                setStep((step - 1) as 1 | 2 | 3);
              } else {
                handleDone();
              }
            }}
            style={styles.backButton}
          >
            <Text role="labelLarge" style={{ color: colors.ink }}>
              ← Back
            </Text>
          </Pressable>

          <Text role="labelSmall" style={{ color: accents.lilac.pop, fontWeight: '700' }}>
            {checkinsCopy.microRep.stepIndicator(step, 4).toUpperCase()}
          </Text>
          <Text role="titleLarge" style={[styles.title, { color: colors.ink }]}>
            {step === 4 ? checkinsCopy.gap.title : checkinsCopy.microRep.title}
          </Text>
          <Text role="bodyMedium" style={{ color: colors.muted, marginTop: 4 }}>
            {step === 4 ? checkinsCopy.gap.subtitle : checkinsCopy.microRep.subtitle}
          </Text>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* STEP 1: Did you ask the follow-up? */}
          {step === 1 && (
            <View testID="step-1-options" style={styles.stepContainer}>
              <Text role="titleMedium" style={[styles.questionText, { color: colors.ink }]}>
                {checkinsCopy.microRep.questionStep1}
              </Text>

              <View style={styles.optionsList}>
                {checkinsCopy.microRep.optionsStep1.map((opt) => {
                  const isSelected = outcome === opt.id;
                  return (
                    <Pressable
                      key={opt.id}
                      testID={`option-step1-${opt.id}`}
                      accessibilityRole="button"
                      accessibilityLabel={`${opt.label}: ${opt.description}`}
                      onPress={() => handleStep1Select(opt.id as CheckinOutcome)}
                      style={[
                        styles.optionCard,
                        {
                          backgroundColor: isSelected ? accents.lilac.tint : colors.surface1,
                          borderColor: isSelected ? accents.lilac.base : colors.line,
                          borderRadius: radii.card,
                        },
                      ]}
                    >
                      <Text
                        role="titleSmall"
                        style={{
                          color: isSelected ? accents.lilac.pop : colors.ink,
                          fontWeight: '700',
                        }}
                      >
                        {opt.label}
                      </Text>
                      <Text role="bodySmall" style={{ color: colors.muted, marginTop: 4 }}>
                        {opt.description}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* STEP 2: How did it land? */}
          {step === 2 && (
            <View testID="step-2-options" style={styles.stepContainer}>
              <Text role="titleMedium" style={[styles.questionText, { color: colors.ink }]}>
                {checkinsCopy.microRep.questionStep2}
              </Text>

              <View style={styles.optionsList}>
                {checkinsCopy.microRep.optionsStep2.map((opt) => {
                  const isSelected = warmth === opt.id;
                  return (
                    <Pressable
                      key={opt.id}
                      testID={`option-step2-${opt.id}`}
                      accessibilityRole="button"
                      accessibilityLabel={`${opt.label}: ${opt.description}`}
                      onPress={() => handleStep2Select(opt.id as WarmthRating)}
                      style={[
                        styles.optionCard,
                        {
                          backgroundColor: isSelected ? accents.mint.tint : colors.surface1,
                          borderColor: isSelected ? accents.mint.base : colors.line,
                          borderRadius: radii.card,
                        },
                      ]}
                    >
                      <Text
                        role="titleSmall"
                        style={{
                          color: isSelected ? accents.mint.pop : colors.ink,
                          fontWeight: '700',
                        }}
                      >
                        {opt.label}
                      </Text>
                      <Text role="bodySmall" style={{ color: colors.muted, marginTop: 4 }}>
                        {opt.description}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* STEP 3: Energy rating battery */}
          {step === 3 && (
            <View testID="step-3-battery" style={styles.stepContainer}>
              <Text role="titleMedium" style={[styles.questionText, { color: colors.ink }]}>
                {checkinsCopy.microRep.questionStep3}
              </Text>
              <Text role="bodySmall" style={{ color: colors.muted, textAlign: 'center', marginBottom: 20 }}>
                {checkinsCopy.microRep.step3Helper}
              </Text>

              <View style={styles.batteryContainer}>
                <BatteryGauge
                  testID="checkin-battery-gauge"
                  value={batteryValue}
                  onChange={handleStep3BatteryChange}
                  mode="drag"
                  size="lg"
                  accessibilityLabel="Current battery level slider"
                />
                <Text role="titleMedium" style={[styles.batteryValLabel, { color: colors.ink }]}>
                  {actualDrain} / 10 draining
                </Text>
              </View>

              <View testID="checkin-step3-submit" style={styles.step3Button}>
                <Button
                  label={
                    isLoading
                      ? checkinsCopy.microRep.submitting
                      : checkinsCopy.microRep.finishButton
                  }
                  variant="primary"
                  disabled={isLoading}
                  onPress={handleStep3Submit}
                  style={{ width: '100%' }}
                />
              </View>
            </View>
          )}

          {/* STEP 4: Gap Reveal */}
          {step === 4 && (
            <View testID="step-4-gap-reveal" style={styles.stepContainer}>
              {/* Gap Comparison Card */}
              <Card style={styles.gapCard} tint="mint">
                <Text
                  testID="gap-reveal-headline"
                  role="titleLarge"
                  style={{ color: colors.ink, fontWeight: '700', textAlign: 'center' }}
                >
                  {checkinsCopy.gap.revealHeadline(forecast.draining, actualDrain)}
                </Text>

                <View style={styles.gapPillsRow}>
                  <Chip
                    label={`Expected: ${forecast.draining}/10`}
                    tint="neutral"
                    style={styles.gapPill}
                  />
                  <Chip
                    label={`Actual: ${actualDrain}/10`}
                    tint="mint"
                    style={styles.gapPill}
                  />
                  {warmth && (
                    <Chip
                      label={checkinsCopy.gap.landedLine(warmth)}
                      tint="lilac"
                      style={styles.gapPill}
                    />
                  )}
                </View>
              </Card>

              {/* Coach Reflection */}
              <View testID="coach-reflection-card" style={styles.reflectionSection}>
                <Text
                  role="titleSmall"
                  style={{ color: accents.honey.pop, fontWeight: '700', marginBottom: 6 }}
                >
                  {checkinsCopy.gap.coachHeading.toUpperCase()}
                </Text>
                <Card style={styles.reflectionCard}>
                  <Text role="bodyLarge" style={{ color: colors.ink, fontStyle: 'italic' }}>
                    "{coachReflection || checkinsCopy.gap.defaultReflection}"
                  </Text>
                </Card>
              </View>

              <Text role="labelSmall" style={{ color: colors.muted, textAlign: 'center', marginTop: 12 }}>
                {checkinsCopy.gap.neutralNotice}
              </Text>

              <View testID="checkin-done-button" style={styles.doneButton}>
                <Button
                  label={checkinsCopy.gap.doneButton}
                  variant="primary"
                  onPress={handleDone}
                  style={{ width: '100%' }}
                />
              </View>
            </View>
          )}
        </ScrollView>
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
  header: {
    marginBottom: 16,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    paddingVertical: 4,
  },
  title: {
    fontWeight: '700',
    marginTop: 2,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  stepContainer: {
    width: '100%',
  },
  questionText: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  optionsList: {
    gap: 12,
  },
  optionCard: {
    padding: 16,
    borderWidth: 1.5,
  },
  batteryContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  batteryValLabel: {
    marginTop: 12,
    fontWeight: '700',
  },
  step3Button: {
    marginTop: 24,
    width: '100%',
  },
  gapCard: {
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  gapPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
  },
  gapPill: {
    marginHorizontal: 2,
  },
  reflectionSection: {
    width: '100%',
    marginVertical: 10,
  },
  reflectionCard: {
    padding: 16,
  },
  doneButton: {
    marginTop: 24,
    width: '100%',
  },
});
