import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Screen } from '../../../src/ui/primitives/Screen';
import { Text } from '../../../src/ui/primitives/Text';
import { Button } from '../../../src/ui/primitives/Button';
import { Chip } from '../../../src/ui/primitives/Chip';
import { NoDefaultSlider } from '../../../src/ui/components/NoDefaultSlider';
import { useTheme } from '../../../src/theme/useTheme';
import { onboardingCopy } from '../../../src/copy/onboarding';
import {
  QUIZ_QUESTIONS,
  QuizQuestion,
  MomentAnswer
} from '@yikes/shared/playbook/questions';
import { useOnboardingStore } from '../../../src/features/onboarding/store';

export default function QuizStepScreen(): React.JSX.Element {
  const { step } = useLocalSearchParams<{ step: string }>();
  const router = useRouter();
  const { colors, accents, spacing, radii } = useTheme();

  const stepNumber = Math.max(1, Math.min(14, parseInt(step || '1', 10) || 1));
  const question: QuizQuestion = (QUIZ_QUESTIONS[stepNumber - 1] ?? QUIZ_QUESTIONS[0]) as QuizQuestion;

  const answers = useOnboardingStore((s) => s.answers);
  const setAnswer = useOnboardingStore((s) => s.setAnswer);
  const setCurrentStep = useOnboardingStore((s) => s.setCurrentStep);

  React.useEffect(() => {
    setCurrentStep(stepNumber);
  }, [stepNumber, setCurrentStep]);

  const triggerHaptic = () => {
    try {
      void Haptics.selectionAsync();
    } catch {
      // Haptics optional on web / unsupported devices
    }
  };

  const handleBack = () => {
    if (stepNumber > 1) {
      router.push(`/(onboarding)/quiz/${stepNumber - 1}` as const);
    } else {
      router.push('/(onboarding)/intro');
    }
  };

  const handleNext = () => {
    if (stepNumber < 14) {
      router.push(`/(onboarding)/quiz/${stepNumber + 1}` as const);
    } else {
      router.push('/(onboarding)/deeper');
    }
  };

  const handleSkip = () => {
    if (stepNumber < 14) {
      router.push(`/(onboarding)/quiz/${stepNumber + 1}` as const);
    } else {
      router.push('/(onboarding)/deeper');
    }
  };

  // Determine if current question has an answer to enable Next button
  const isAnswered = useMemo(() => {
    switch (question.type) {
      case 'multi-choice': {
        const selected = (answers[`q${stepNumber}` as keyof typeof answers] as string[] | undefined) || [];
        return selected.length > 0;
      }
      case 'single-choice': {
        const val = answers[`q${stepNumber}` as keyof typeof answers];
        return typeof val === 'string' && val.length > 0;
      }
      case 'slider': {
        const val = answers[`q${stepNumber}` as keyof typeof answers];
        return typeof val === 'number' && val !== null;
      }
      case 'moment-form': {
        const val = answers.q3;
        return Boolean(val && (val.type || val.what?.trim() || val.when?.trim()));
      }
      case 'single-choice-with-custom': {
        const val = answers.q14;
        if (!val) return false;
        if (val === 'Write my own') {
          return Boolean(answers.q14Custom && answers.q14Custom.trim().length > 0);
        }
        return true;
      }
      default:
        return false;
    }
  }, [question.type, stepNumber, answers]);

  // Answer handlers
  const handleMultiSelect = (option: string, maxSelections: number) => {
    triggerHaptic();
    const key = `q${stepNumber}` as 'q1' | 'q2';
    const current = (answers[key] as string[] | undefined) || [];
    let updated: string[];
    if (current.includes(option)) {
      updated = current.filter((item) => item !== option);
    } else {
      if (current.length >= maxSelections) {
        updated = [...current.slice(1), option];
      } else {
        updated = [...current, option];
      }
    }
    setAnswer(key, updated);
  };

  const handleSingleSelect = (option: string) => {
    triggerHaptic();
    const key = `q${stepNumber}` as 'q4' | 'q6' | 'q7' | 'q8' | 'q10' | 'q11' | 'q12' | 'q13';
    setAnswer(key, option);
  };

  const handleSliderChange = (val: number) => {
    const key = `q${stepNumber}` as 'q5' | 'q9';
    setAnswer(key, val);
  };

  const handleMomentChange = (patch: Partial<MomentAnswer>) => {
    const prev = answers.q3 || { type: 'Meeting', what: '', when: '' };
    setAnswer('q3', { ...prev, ...patch });
  };

  const handleCustomAnchorSelect = (option: string) => {
    triggerHaptic();
    setAnswer('q14', option);
  };

  const handleCustomAnchorText = (text: string) => {
    setAnswer('q14Custom', text);
  };

  const copy = onboardingCopy.quiz;
  const progressPercent = (stepNumber / 14) * 100;

  return (
    <Screen style={styles.container}>
      {/* Top Bar: Progress Line and Back Button */}
      <View style={styles.topBar}>
        <View style={[styles.progressTrack, { backgroundColor: colors.line, borderRadius: radii.pill }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progressPercent}%`,
                backgroundColor: accents.ember.base,
                borderRadius: radii.pill
              }
            ]}
          />
        </View>

        <View style={styles.navRow}>
          <Pressable
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel={copy.backButtonLabel}
            style={styles.backButton}
          >
            <Text role="bodyLarge" style={{ color: colors.ink, fontWeight: '600' }}>
              ←
            </Text>
          </Pressable>

          <Text role="labelSmall" style={[styles.sectionBadge, { color: accents.ember.base }]}>
            {question.section.toUpperCase()} · QUESTION {stepNumber}
          </Text>

          <View style={styles.placeholderButton} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Question Header */}
        <View style={styles.questionHeader}>
          <Text
            role="displayMedium"
            style={[
              styles.questionTitle,
              {
                color: colors.ink
              }
            ]}
          >
            {question.title}
          </Text>
          <Text role="bodyMedium" muted style={styles.questionSubtitle}>
            {question.subtitle}
          </Text>
          <Text role="bodySmall" muted style={styles.reasonText}>
            {question.reason}
          </Text>
        </View>

        {/* Input Area by Question Type */}
        <View style={styles.inputArea}>
          {question.type === 'multi-choice' && (
            <View style={styles.chipsGrid}>
              {question.options.map((option) => {
                const selected =
                  ((answers[`q${stepNumber}` as keyof typeof answers] as string[] | undefined) || []).includes(option);
                return (
                  <Chip
                    key={option}
                    label={option}
                    selected={selected}
                    tint="lilac"
                    onPress={() => handleMultiSelect(option, question.maxSelections)}
                    style={styles.chipItem}
                  />
                );
              })}
            </View>
          )}

          {question.type === 'single-choice' && (
            <View style={styles.chipsGrid}>
              {question.options.map((option) => {
                const selected = answers[`q${stepNumber}` as keyof typeof answers] === option;
                return (
                  <Chip
                    key={option}
                    label={option}
                    selected={selected}
                    tint="lilac"
                    onPress={() => handleSingleSelect(option)}
                    style={styles.chipItem}
                  />
                );
              })}
            </View>
          )}

          {question.type === 'slider' && (
            <View style={styles.sliderContainer}>
              <View style={styles.sliderLabelsHeader}>
                <Text role="labelSmall" muted>
                  {question.minLabel}
                </Text>
                <Text role="labelSmall" muted>
                  {question.maxLabel}
                </Text>
              </View>
              <NoDefaultSlider
                value={answers[`q${stepNumber}` as keyof typeof answers] as number | null}
                onChange={handleSliderChange}
                min={question.min}
                max={question.max}
                step={question.step}
                accessibilityLabel={`${question.title}, scale from 1 to 5`}
              />
            </View>
          )}

          {question.type === 'moment-form' && (
            <View style={styles.momentForm}>
              <Text role="labelMedium" style={[styles.inputLabel, { color: colors.ink }]}>
                {copy.momentForm.typePrompt}
              </Text>
              <View style={styles.chipsGrid}>
                {question.momentTypes.map((type) => {
                  const selected = answers.q3?.type === type;
                  return (
                    <Chip
                      key={type}
                      label={type}
                      selected={selected}
                      tint="honey"
                      onPress={() => {
                        triggerHaptic();
                        handleMomentChange({ type });
                      }}
                      style={styles.chipItem}
                    />
                  );
                })}
              </View>

              <View style={styles.formField}>
                <Text role="labelSmall" muted style={styles.inputLabel}>
                  {copy.momentForm.whatLabel}
                </Text>
                <TextInput
                  value={answers.q3?.what || ''}
                  onChangeText={(what) => handleMomentChange({ what })}
                  placeholder={copy.momentForm.whatPlaceholder}
                  placeholderTextColor={colors.muted}
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.surface1,
                      borderColor: colors.line,
                      color: colors.ink,
                      borderRadius: radii.md
                    }
                  ]}
                  accessibilityLabel={copy.momentForm.whatLabel}
                />
              </View>

              <View style={styles.formField}>
                <Text role="labelSmall" muted style={styles.inputLabel}>
                  {copy.momentForm.whenLabel}
                </Text>
                <TextInput
                  value={answers.q3?.when || ''}
                  onChangeText={(when) => handleMomentChange({ when })}
                  placeholder={copy.momentForm.whenPlaceholder}
                  placeholderTextColor={colors.muted}
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.surface1,
                      borderColor: colors.line,
                      color: colors.ink,
                      borderRadius: radii.md
                    }
                  ]}
                  accessibilityLabel={copy.momentForm.whenLabel}
                />
              </View>
            </View>
          )}

          {question.type === 'single-choice-with-custom' && (
            <View style={styles.customAnchorContainer}>
              <View style={styles.chipsGrid}>
                {question.options.map((option) => {
                  const selected = answers.q14 === option;
                  return (
                    <Chip
                      key={option}
                      label={option}
                      selected={selected}
                      tint="lilac"
                      onPress={() => handleCustomAnchorSelect(option)}
                      style={styles.chipItem}
                    />
                  );
                })}
                <Chip
                  key={question.customOption}
                  label={question.customOption}
                  selected={answers.q14 === question.customOption}
                  tint="ember"
                  onPress={() => handleCustomAnchorSelect(question.customOption)}
                  style={styles.chipItem}
                />
              </View>

              {answers.q14 === question.customOption && (
                <View style={styles.customInputWrapper}>
                  <Text role="labelSmall" muted style={styles.inputLabel}>
                    {copy.customAnchor.label}
                  </Text>
                  <TextInput
                    value={answers.q14Custom || ''}
                    onChangeText={handleCustomAnchorText}
                    placeholder={copy.customAnchor.placeholder}
                    placeholderTextColor={colors.muted}
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: colors.surface1,
                        borderColor: colors.line,
                        color: colors.ink,
                        borderRadius: radii.md
                      }
                    ]}
                    accessibilityLabel={copy.customAnchor.label}
                    autoFocus
                  />
                </View>
              )}
            </View>
          )}
        </View>

        {/* Footer Actions */}
        <View style={[styles.footer, { paddingBottom: spacing[8] }]}>
          <Text role="bodySmall" muted style={styles.changeLaterNote}>
            {copy.changeLaterNote}
          </Text>

          <Button
            variant="primary"
            label={copy.nextButton}
            disabled={!isAnswered}
            onPress={handleNext}
            accessibilityLabel={copy.nextButton}
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8
  },
  progressTrack: {
    height: 4,
    width: '100%',
    overflow: 'hidden',
    marginBottom: 12
  },
  progressFill: {
    height: '100%'
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48
  },
  backButton: {
    minHeight: 48,
    minWidth: 48,
    justifyContent: 'center',
    alignItems: 'center'
  },
  sectionBadge: {
    letterSpacing: 1.0,
    fontWeight: '700'
  },
  placeholderButton: {
    width: 48,
    height: 48
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between'
  },
  questionHeader: {
    marginTop: 8,
    marginBottom: 24
  },
  questionTitle: {
    fontSize: 26,
    lineHeight: 32,
    marginBottom: 8
  },
  questionSubtitle: {
    marginBottom: 6
  },
  reasonText: {
    lineHeight: 18
  },
  inputArea: {
    flexGrow: 1,
    justifyContent: 'center',
    marginVertical: 16
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  chipItem: {
    marginVertical: 2
  },
  sliderContainer: {
    paddingVertical: 16
  },
  sliderLabelsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  momentForm: {
    gap: 16
  },
  formField: {
    gap: 6
  },
  inputLabel: {
    fontWeight: '600'
  },
  textInput: {
    borderWidth: 1,
    minHeight: 48,
    paddingHorizontal: 16,
    fontSize: 15
  },
  customAnchorContainer: {
    gap: 16
  },
  customInputWrapper: {
    gap: 6,
    marginTop: 8
  },
  footer: {
    marginTop: 24,
    gap: 12,
    alignItems: 'center'
  },
  changeLaterNote: {
    textAlign: 'center',
    marginBottom: 4
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
