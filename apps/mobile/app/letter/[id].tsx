import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { letterCopy } from '../../src/copy/letter';
import { useWeeklyLetter } from '../../src/features/letter/useWeeklyLetter';
import { useTheme } from '../../src/theme/useTheme';
import { BackIcon } from '../../src/ui/icons/BackIcon';
import { Button } from '../../src/ui/primitives/Button';
import { Card } from '../../src/ui/primitives/Card';
import { Screen } from '../../src/ui/primitives/Screen';
import { Text } from '../../src/ui/primitives/Text';

export default function WeeklyLetterScreen(): React.JSX.Element {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, accents, spacing } = useTheme();

  const {
    letter,
    isLoading,
    isOffline,
    error,
    optedOut,
    loadLetter,
    toggleOptOut,
  } = useWeeklyLetter();

  useEffect(() => {
    void loadLetter(id);
  }, [id, loadLetter]);

  const handlePlanIt = () => {
    // Route to moments or path to plan next week's focus
    router.push('/(tabs)/moments');
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <Screen edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={letterCopy.header.backLabel}
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <BackIcon size={24} color={colors.ink} />
          </Pressable>
          <Text role="titleLarge" color={colors.ink}>
            {letterCopy.header.title}
          </Text>
        </View>
        <View style={[styles.centeredContainer, { padding: spacing[4] }]}>
          <Text role="bodyLarge" color={colors.muted} style={{ textAlign: 'center' }}>
            {letterCopy.states.loading}
          </Text>
        </View>
      </Screen>
    );
  }

  // 2. Error State (No letter and active error)
  if (error && !letter) {
    return (
      <Screen edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={letterCopy.header.backLabel}
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <BackIcon size={24} color={colors.ink} />
          </Pressable>
          <Text role="titleLarge" color={colors.ink}>
            {letterCopy.header.title}
          </Text>
        </View>
        <View style={[styles.centeredContainer, { padding: spacing[4] }]}>
          <Card tint="honey" style={styles.errorCard}>
            <Text role="titleMedium" color={colors.ink} style={{ fontWeight: '700' }}>
              {letterCopy.states.errorTitle}
            </Text>
            <Text role="bodyMedium" color={colors.muted} style={{ marginVertical: spacing[2] }}>
              {letterCopy.states.errorMessage}
            </Text>
            <Button
              variant="secondary"
              label={letterCopy.states.retryButton}
              onPress={() => void loadLetter(id)}
              accessibilityLabel={letterCopy.states.retryButton}
              style={{ marginTop: spacing[2] }}
            />
          </Card>
        </View>
      </Screen>
    );
  }

  // 3. Empty State (No letter available)
  if (!letter) {
    return (
      <Screen edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={letterCopy.header.backLabel}
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <BackIcon size={24} color={colors.ink} />
          </Pressable>
          <Text role="titleLarge" color={colors.ink}>
            {letterCopy.header.title}
          </Text>
        </View>
        <View style={[styles.centeredContainer, { padding: spacing[6] }]}>
          <Card style={styles.emptyCard}>
            <Text role="titleMedium" color={colors.ink} style={{ fontWeight: '700', textAlign: 'center' }}>
              {letterCopy.states.emptyTitle}
            </Text>
            <Text
              role="bodyMedium"
              color={colors.muted}
              style={{ marginTop: spacing[2], textAlign: 'center', lineHeight: 22 }}
            >
              {letterCopy.states.emptyMessage}
            </Text>
          </Card>
        </View>
      </Screen>
    );
  }

  // 4. Main Letter Presentation (Screen C14)
  const serifFontFamily = Platform.select({
    ios: 'Georgia',
    android: 'serif',
    web: "'Instrument Serif', Georgia, serif",
    default: 'serif',
  });

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={letterCopy.header.backLabel}
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <BackIcon size={24} color={colors.ink} />
        </Pressable>
        <View style={styles.headerTitleCol}>
          <Text role="titleLarge" color={colors.ink}>
            {letterCopy.header.title}
          </Text>
          <Text role="bodySmall" color={colors.muted}>
            {letterCopy.header.subtitle}
          </Text>
        </View>
        <View style={[styles.aiBadge, { backgroundColor: accents.lilac.tint }]}>
          <Text role="labelSmall" color={accents.lilac.pop} style={{ fontWeight: '700' }}>
            {letterCopy.header.aiLabel}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: spacing[8] }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Offline Banner */}
        {isOffline && (
          <Card tint="honey" style={styles.offlineCard}>
            <Text role="bodySmall" color={colors.ink} style={{ fontWeight: '600' }}>
              {letterCopy.states.offlineBanner}
            </Text>
          </Card>
        )}

        {/* Serif Letter Body */}
        <Card style={styles.letterContainer}>
          <Text
            role="displayMedium"
            color={colors.ink}
            style={[
              styles.serifText,
              {
                fontFamily: serifFontFamily,
                color: colors.ink,
                lineHeight: 34,
                fontStyle: 'italic',
              },
            ]}
          >
            {letter.content}
          </Text>
        </Card>

        {/* Section: One pattern noticed */}
        {letter.metadata?.patternNoticed ? (
          <Card tint="mint" style={styles.sectionCard}>
            <Text role="labelMedium" color={accents.mint.pop} style={styles.sectionLabel}>
              {letterCopy.sections.patternNoticedTitle.toUpperCase()}
            </Text>
            <Text role="bodyMedium" color={colors.ink} style={{ marginTop: spacing[1], lineHeight: 22 }}>
              {letter.metadata.patternNoticed}
            </Text>
          </Card>
        ) : null}

        {/* Section: Focus for next week & Plan it */}
        {letter.metadata?.nextFocus ? (
          <Card tint="lilac" style={styles.sectionCard}>
            <Text role="labelMedium" color={accents.lilac.pop} style={styles.sectionLabel}>
              {letterCopy.sections.focusNextTitle.toUpperCase()}
            </Text>
            <Text role="bodyMedium" color={colors.ink} style={{ marginTop: spacing[1], lineHeight: 22 }}>
              {letter.metadata.nextFocus}
            </Text>
            <Button
              variant="primary"
              label={letterCopy.sections.planButtonLabel}
              onPress={handlePlanIt}
              accessibilityLabel={letterCopy.sections.planButtonLabel}
              style={{ marginTop: spacing[3] }}
            />
          </Card>
        ) : null}

        {/* Opt-out Toggle Row */}
        <Card style={styles.optOutCard}>
          <View style={styles.optOutRow}>
            <View style={styles.optOutTextCol}>
              <Text role="bodyMedium" color={colors.ink} style={{ fontWeight: '600' }}>
                {letterCopy.optOut.title}
              </Text>
              <Text role="bodySmall" color={colors.muted} style={{ marginTop: 2 }}>
                {letterCopy.optOut.description}
              </Text>
            </View>
            <Switch
              value={optedOut}
              onValueChange={(val) => {
                void toggleOptOut(val);
              }}
              accessibilityLabel={letterCopy.optOut.toggleLabel}
              trackColor={{ false: colors.surface1, true: accents.mint.base }}
              thumbColor={colors.surface1}
            />
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginRight: 8,
  },
  headerTitleCol: {
    flex: 1,
  },
  aiBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  offlineCard: {
    padding: 12,
    marginBottom: 16,
  },
  errorCard: {
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  emptyCard: {
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  letterContainer: {
    padding: 24,
    marginBottom: 16,
    borderRadius: 20,
  },
  serifText: {
    fontSize: 22,
    letterSpacing: 0.2,
  },
  sectionCard: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 16,
  },
  sectionLabel: {
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  optOutCard: {
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  optOutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optOutTextCol: {
    flex: 1,
    paddingRight: 16,
  },
});
