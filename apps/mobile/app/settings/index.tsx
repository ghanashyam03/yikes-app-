import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { settingsCopy } from '../../src/copy/settings';
import { useSettings } from '../../src/features/settings/useSettings';
import { type AppearancePreference, type CoachTone } from '../../src/features/settings/types';
import { useTheme } from '../../src/theme/useTheme';
import { BackIcon } from '../../src/ui/icons/BackIcon';
import { Button } from '../../src/ui/primitives/Button';
import { Card } from '../../src/ui/primitives/Card';
import { Chip } from '../../src/ui/primitives/Chip';
import { Screen } from '../../src/ui/primitives/Screen';
import { Text } from '../../src/ui/primitives/Text';

export default function SettingsIndexScreen(): React.JSX.Element {
  const router = useRouter();
  const { colors, accents, spacing, radii, setPreference, setReducedMotionOverride } = useTheme();

  const {
    streakEnabled,
    setStreakEnabled,
    weeklyGoal,
    setWeeklyGoal,
    isPaused,
    setIsPaused,
    appearance,
    setAppearance,
    reducedMotionOverride,
    setReducedMotionOverride: setStoreReducedMotion,
    textScale,
    setTextScale,
    hapticsEnabled,
    setHapticsEnabled,
    soundEnabled,
    setSoundEnabled,
    coachTone,
    setCoachTone,
  } = useSettings();

  const [searchQuery, setSearchQuery] = useState('');
  const [quietLockEnabled, setQuietLockEnabled] = useState(false);

  const handleAppearanceChange = (pref: AppearancePreference) => {
    setAppearance(pref);
    setPreference(pref);
  };

  const handleReducedMotionChange = (val: boolean) => {
    setStoreReducedMotion(val);
    setReducedMotionOverride(val);
  };

  const query = searchQuery.trim().toLowerCase();

  const isVisible = (id: string, text: string) => {
    if (!query) return true;
    return (
      id.toLowerCase().includes(query) ||
      text.toLowerCase().includes(query)
    );
  };

  const sectionsVisible = useMemo(() => {
    return {
      playbook: isVisible('playbook', 'Playbook core communication answers'),
      coach: isVisible('coach', 'Coach tone gentle direct playful humour Maya'),
      rhythm: isVisible('rhythm', 'Practice rhythm weekly target streak consecutive days pause'),
      reminders: isVisible('reminders', 'Reminders notifications quiet hours nudges'),
      appearance: isVisible('appearance', 'Appearance theme daylight midnight dark light font text motion sound haptics'),
      quietLock: isVisible('quietLock', 'Quiet lock face id passcode biometrics security'),
      account: isVisible('account', 'Account email phone devices passkeys'),
      privacy: isVisible('privacy', 'Privacy centre consent export delete data'),
      subscription: isVisible('subscription', 'Subscription Plus billing plan cancel'),
      help: isVisible('help', 'Help feedback faq contact questions report'),
      aboutAi: isVisible('aboutAi', 'About the AI artificial intelligence models disclaimer not therapy'),
    };
  }, [query]);

  const anySectionVisible = Object.values(sectionsVisible).some(Boolean);

  return (
    <Screen>
      <View testID="settings-index-screen" style={{ flex: 1 }}>
      <View style={[styles.header, { borderBottomColor: colors.line, paddingHorizontal: spacing[4], paddingVertical: spacing[3] }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.surface2, borderRadius: radii.pill }]}
          testID="settings-back-button"
        >
          <BackIcon size={20} color={colors.ink} />
        </Pressable>
        <Text role="titleLarge" color={colors.ink} style={{ fontWeight: '700', marginLeft: spacing[2] }}>
          {settingsCopy.header.title}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { padding: spacing[4] }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: colors.surface2,
              borderColor: colors.line,
              borderRadius: radii.pill,
              marginBottom: spacing[4],
            },
          ]}
        >
          <TextInput
            placeholder={settingsCopy.header.searchPlaceholder}
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: colors.ink }]}
            testID="settings-search-input"
            clearButtonMode="while-editing"
          />
        </View>

        {!anySectionVisible && (
          <View style={styles.noResultsContainer}>
            <Text role="bodyMedium" color={colors.muted} style={{ textAlign: 'center' }}>
              {settingsCopy.header.noResults}
            </Text>
          </View>
        )}

        {/* Playbook Card */}
        {sectionsVisible.playbook && (
          <View testID="settings-playbook-card" style={{ marginBottom: spacing[3] }}>
            <Card tint="neutral" style={styles.sectionCard}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text role="titleMedium" color={colors.ink} style={{ fontWeight: '700' }}>
                    {settingsCopy.sections.playbook.title}
                  </Text>
                  <Text role="bodySmall" color={colors.muted} style={{ marginTop: 2 }}>
                    {settingsCopy.sections.playbook.subtitle}
                  </Text>
                </View>
                <Button
                  label="Edit"
                  variant="secondary"
                  onPress={() => router.push('/(onboarding)/playbook')}
                />
              </View>
            </Card>
          </View>
        )}

        {/* Coach Tone Card */}
        {sectionsVisible.coach && (
          <View testID="settings-coach-card" style={{ marginBottom: spacing[3] }}>
            <Card tint="neutral" style={styles.sectionCard}>
              <Text role="titleMedium" color={colors.ink} style={{ fontWeight: '700', marginBottom: 4 }}>
                {settingsCopy.sections.coach.title}
              </Text>
              <Text role="bodySmall" color={colors.muted} style={{ marginBottom: spacing[3] }}>
                {settingsCopy.sections.coach.subtitle}
              </Text>

              <View style={styles.chipRow}>
                {(['gentle', 'straight', 'funny'] as CoachTone[]).map((tone) => (
                  <Chip
                    key={tone}
                    label={settingsCopy.sections.coach.tones[tone].label}
                    selected={coachTone === tone}
                    onPress={() => setCoachTone(tone)}
                    style={{ marginRight: spacing[2], marginBottom: spacing[2] }}
                  />
                ))}
              </View>
              <Text role="bodySmall" color={colors.muted}>
                {settingsCopy.sections.coach.tones[coachTone].description}
              </Text>
            </Card>
          </View>
        )}

        {/* Rhythm & Streak Card */}
        {sectionsVisible.rhythm && (
          <View testID="settings-rhythm-card" style={{ marginBottom: spacing[3] }}>
            <Card tint="neutral" style={styles.sectionCard}>
              <Text role="titleMedium" color={colors.ink} style={{ fontWeight: '700', marginBottom: 4 }}>
                {settingsCopy.sections.rhythm.title}
              </Text>
              <Text role="bodySmall" color={colors.muted} style={{ marginBottom: spacing[3] }}>
                {settingsCopy.sections.rhythm.subtitle}
              </Text>

              {/* Weekly Target Stepper */}
              <View style={[styles.settingRow, { borderBottomColor: colors.line, borderBottomWidth: 1, paddingBottom: spacing[3], marginBottom: spacing[3] }]}>
                <View style={{ flex: 1 }}>
                  <Text role="bodyMedium" color={colors.ink} style={{ fontWeight: '600' }}>
                    {settingsCopy.sections.rhythm.weeklyGoalLabel}
                  </Text>
                  <Text role="bodySmall" color={colors.muted}>
                    {settingsCopy.sections.rhythm.weeklyGoalFormat(weeklyGoal)}
                  </Text>
                </View>
                <View style={styles.stepperContainer}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Decrease weekly goal"
                    onPress={() => setWeeklyGoal(Math.max(1, weeklyGoal - 1))}
                    style={[styles.stepperBtn, { backgroundColor: colors.surface2, borderRadius: radii.pill }]}
                    testID="weekly-goal-decrease"
                  >
                    <Text role="titleMedium" color={colors.ink}>-</Text>
                  </Pressable>
                  <Text role="titleSmall" color={colors.ink} style={{ marginHorizontal: 12 }}>
                    {weeklyGoal}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Increase weekly goal"
                    onPress={() => setWeeklyGoal(Math.min(7, weeklyGoal + 1))}
                    style={[styles.stepperBtn, { backgroundColor: colors.surface2, borderRadius: radii.pill }]}
                    testID="weekly-goal-increase"
                  >
                    <Text role="titleMedium" color={colors.ink}>+</Text>
                  </Pressable>
                </View>
              </View>

              {/* Streak Toggle (strictly defaults to false per Rule #2) */}
              <View style={[styles.settingRow, { borderBottomColor: colors.line, borderBottomWidth: 1, paddingBottom: spacing[3], marginBottom: spacing[3] }]}>
                <View style={{ flex: 1, paddingRight: spacing[2] }}>
                  <Text role="bodyMedium" color={colors.ink} style={{ fontWeight: '600' }}>
                    {settingsCopy.sections.rhythm.streakToggle.title}
                  </Text>
                  <Text role="bodySmall" color={colors.muted} style={{ marginTop: 2 }}>
                    {settingsCopy.sections.rhythm.streakToggle.description}
                  </Text>
                </View>
                <Switch
                  value={streakEnabled}
                  onValueChange={setStreakEnabled}
                  trackColor={{ false: colors.line, true: accents.mint.base }}
                  testID="streak-toggle-switch"
                />
              </View>

              {/* Pause for a busy week */}
              <View style={styles.settingRow}>
                <View style={{ flex: 1, paddingRight: spacing[2] }}>
                  <Text role="bodyMedium" color={colors.ink} style={{ fontWeight: '600' }}>
                    {settingsCopy.sections.rhythm.pauseToggle.title}
                  </Text>
                  <Text role="bodySmall" color={colors.muted} style={{ marginTop: 2 }}>
                    {settingsCopy.sections.rhythm.pauseToggle.description}
                  </Text>
                </View>
                <Switch
                  value={isPaused}
                  onValueChange={setIsPaused}
                  trackColor={{ false: colors.line, true: accents.honey.base }}
                  testID="pause-toggle-switch"
                />
              </View>
            </Card>
          </View>
        )}

        {/* Reminders Card */}
        {sectionsVisible.reminders && (
          <View testID="settings-reminders-card" style={{ marginBottom: spacing[3] }}>
            <Card tint="neutral" style={styles.sectionCard}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1, paddingRight: spacing[2] }}>
                  <Text role="titleMedium" color={colors.ink} style={{ fontWeight: '700' }}>
                    {settingsCopy.sections.reminders.title}
                  </Text>
                  <Text role="bodySmall" color={colors.muted} style={{ marginTop: 2 }}>
                    {settingsCopy.sections.reminders.subtitle}
                  </Text>
                </View>
                <Button
                  label="Configure"
                  variant="secondary"
                  onPress={() => router.push('/settings/notifications')}
                />
              </View>
            </Card>
          </View>
        )}

        {/* Appearance Card */}
        {sectionsVisible.appearance && (
          <View testID="settings-appearance-card" style={{ marginBottom: spacing[3] }}>
            <Card tint="neutral" style={styles.sectionCard}>
              <Text role="titleMedium" color={colors.ink} style={{ fontWeight: '700', marginBottom: 4 }}>
                {settingsCopy.sections.appearance.title}
              </Text>
              <Text role="bodySmall" color={colors.muted} style={{ marginBottom: spacing[3] }}>
                {settingsCopy.sections.appearance.subtitle}
              </Text>

              {/* Theme mode chips */}
              <View style={[styles.chipRow, { marginBottom: spacing[3] }]}>
                {(['auto', 'light', 'dark'] as AppearancePreference[]).map((pref) => (
                  <Chip
                    key={pref}
                    label={settingsCopy.sections.appearance.themeOptions[pref]}
                    selected={appearance === pref}
                    onPress={() => handleAppearanceChange(pref)}
                    style={{ marginRight: spacing[2], marginBottom: spacing[2] }}
                  />
                ))}
              </View>

              {/* Text Scale */}
              <View style={[styles.settingRow, { borderBottomColor: colors.line, borderBottomWidth: 1, paddingBottom: spacing[3], marginBottom: spacing[3] }]}>
                <View style={{ flex: 1 }}>
                  <Text role="bodyMedium" color={colors.ink} style={{ fontWeight: '600' }}>
                    {settingsCopy.sections.appearance.textScaleLabel}
                  </Text>
                  <Text role="bodySmall" color={colors.muted}>
                    {`${Math.round(textScale * 100)}%`}
                  </Text>
                </View>
                <View style={styles.stepperContainer}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Decrease text scale"
                    onPress={() => setTextScale(Math.max(0.85, Number((textScale - 0.1).toFixed(2))))}
                    style={[styles.stepperBtn, { backgroundColor: colors.surface2, borderRadius: radii.pill }]}
                    testID="text-scale-decrease"
                  >
                    <Text role="titleMedium" color={colors.ink}>-</Text>
                  </Pressable>
                  <Text role="titleSmall" color={colors.ink} style={{ marginHorizontal: 12 }}>
                    {`${textScale.toFixed(1)}x`}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Increase text scale"
                    onPress={() => setTextScale(Math.min(1.5, Number((textScale + 0.1).toFixed(2))))}
                    style={[styles.stepperBtn, { backgroundColor: colors.surface2, borderRadius: radii.pill }]}
                    testID="text-scale-increase"
                  >
                    <Text role="titleMedium" color={colors.ink}>+</Text>
                  </Pressable>
                </View>
              </View>

              {/* Reduced motion override */}
              <View style={[styles.settingRow, { borderBottomColor: colors.line, borderBottomWidth: 1, paddingBottom: spacing[3], marginBottom: spacing[3] }]}>
                <View style={{ flex: 1, paddingRight: spacing[2] }}>
                  <Text role="bodyMedium" color={colors.ink} style={{ fontWeight: '600' }}>
                    {settingsCopy.sections.appearance.reducedMotion.title}
                  </Text>
                  <Text role="bodySmall" color={colors.muted}>
                    {settingsCopy.sections.appearance.reducedMotion.description}
                  </Text>
                </View>
                <Switch
                  value={reducedMotionOverride}
                  onValueChange={handleReducedMotionChange}
                  trackColor={{ false: colors.line, true: accents.mint.base }}
                  testID="reduced-motion-switch"
                />
              </View>

              {/* Haptics */}
              <View style={[styles.settingRow, { borderBottomColor: colors.line, borderBottomWidth: 1, paddingBottom: spacing[3], marginBottom: spacing[3] }]}>
                <View style={{ flex: 1, paddingRight: spacing[2] }}>
                  <Text role="bodyMedium" color={colors.ink} style={{ fontWeight: '600' }}>
                    {settingsCopy.sections.appearance.haptics.title}
                  </Text>
                  <Text role="bodySmall" color={colors.muted}>
                    {settingsCopy.sections.appearance.haptics.description}
                  </Text>
                </View>
                <Switch
                  value={hapticsEnabled}
                  onValueChange={setHapticsEnabled}
                  trackColor={{ false: colors.line, true: accents.mint.base }}
                  testID="haptics-switch"
                />
              </View>

              {/* Sound */}
              <View style={styles.settingRow}>
                <View style={{ flex: 1, paddingRight: spacing[2] }}>
                  <Text role="bodyMedium" color={colors.ink} style={{ fontWeight: '600' }}>
                    {settingsCopy.sections.appearance.sound.title}
                  </Text>
                  <Text role="bodySmall" color={colors.muted}>
                    {settingsCopy.sections.appearance.sound.description}
                  </Text>
                </View>
                <Switch
                  value={soundEnabled}
                  onValueChange={setSoundEnabled}
                  trackColor={{ false: colors.line, true: accents.mint.base }}
                  testID="sound-switch"
                />
              </View>
            </Card>
          </View>
        )}

        {/* Quiet Lock Card */}
        {sectionsVisible.quietLock && (
          <View testID="settings-quiet-lock-card" style={{ marginBottom: spacing[3] }}>
            <Card tint="neutral" style={styles.sectionCard}>
              <View style={styles.settingRow}>
                <View style={{ flex: 1, paddingRight: spacing[2] }}>
                  <Text role="titleMedium" color={colors.ink} style={{ fontWeight: '700' }}>
                    {settingsCopy.sections.quietLock.title}
                  </Text>
                  <Text role="bodySmall" color={colors.muted} style={{ marginTop: 2 }}>
                    {settingsCopy.sections.quietLock.subtitle}
                  </Text>
                </View>
                <Switch
                  value={quietLockEnabled}
                  onValueChange={setQuietLockEnabled}
                  trackColor={{ false: colors.line, true: accents.mint.base }}
                  testID="quiet-lock-switch"
                />
              </View>
            </Card>
          </View>
        )}

        {/* Account Card */}
        {sectionsVisible.account && (
          <View testID="settings-account-card" style={{ marginBottom: spacing[3] }}>
            <Card tint="neutral" style={styles.sectionCard}>
              <Text role="titleMedium" color={colors.ink} style={{ fontWeight: '700', marginBottom: 4 }}>
                {settingsCopy.sections.account.title}
              </Text>
              <Text role="bodySmall" color={colors.muted}>
                {settingsCopy.sections.account.subtitle}
              </Text>
            </Card>
          </View>
        )}

        {/* Navigation Link Cards */}
        {sectionsVisible.privacy && (
          <Pressable onPress={() => router.push('/settings/privacy')} testID="settings-privacy-link">
            <Card tint="neutral" style={[styles.sectionCard, { marginBottom: spacing[3] }]}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text role="titleMedium" color={colors.ink} style={{ fontWeight: '700' }}>
                    {settingsCopy.sections.privacy.title}
                  </Text>
                  <Text role="bodySmall" color={colors.muted} style={{ marginTop: 2 }}>
                    {settingsCopy.sections.privacy.subtitle}
                  </Text>
                </View>
                <Text role="titleMedium" color={colors.muted}>→</Text>
              </View>
            </Card>
          </Pressable>
        )}

        {sectionsVisible.subscription && (
          <Pressable onPress={() => router.push('/settings/subscription')} testID="settings-subscription-link">
            <Card tint="neutral" style={[styles.sectionCard, { marginBottom: spacing[3] }]}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text role="titleMedium" color={colors.ink} style={{ fontWeight: '700' }}>
                    {settingsCopy.sections.subscription.title}
                  </Text>
                  <Text role="bodySmall" color={colors.muted} style={{ marginTop: 2 }}>
                    {settingsCopy.sections.subscription.subtitle}
                  </Text>
                </View>
                <Text role="titleMedium" color={colors.muted}>→</Text>
              </View>
            </Card>
          </Pressable>
        )}

        {sectionsVisible.help && (
          <Pressable onPress={() => router.push('/settings/help')} testID="settings-help-link">
            <Card tint="neutral" style={[styles.sectionCard, { marginBottom: spacing[3] }]}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text role="titleMedium" color={colors.ink} style={{ fontWeight: '700' }}>
                    {settingsCopy.sections.help.title}
                  </Text>
                  <Text role="bodySmall" color={colors.muted} style={{ marginTop: 2 }}>
                    {settingsCopy.sections.help.subtitle}
                  </Text>
                </View>
                <Text role="titleMedium" color={colors.muted}>→</Text>
              </View>
            </Card>
          </Pressable>
        )}

        {sectionsVisible.aboutAi && (
          <Pressable onPress={() => router.push('/settings/about-ai')} testID="settings-about-ai-link">
            <Card tint="neutral" style={[styles.sectionCard, { marginBottom: spacing[6] }]}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text role="titleMedium" color={colors.ink} style={{ fontWeight: '700' }}>
                    {settingsCopy.sections.aboutAi.title}
                  </Text>
                  <Text role="bodySmall" color={colors.muted} style={{ marginTop: 2 }}>
                    {settingsCopy.sections.aboutAi.subtitle}
                  </Text>
                </View>
                <Text role="titleMedium" color={colors.muted}>→</Text>
              </View>
            </Card>
          </Pressable>
        )}
      </ScrollView>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
  },
  searchInput: {
    fontSize: 15,
  },
  noResultsContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  sectionCard: {
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
