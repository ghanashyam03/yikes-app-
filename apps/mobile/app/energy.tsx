import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { checkinsCopy } from '../src/copy/checkins';
import { useSession } from '../src/features/auth/useSession';
import { useEnergy } from '../src/features/energy/useEnergy';
import { useTheme } from '../src/theme/useTheme';
import { BatteryGauge } from '../src/ui/components/BatteryGauge';
import { Button } from '../src/ui/primitives/Button';
import { Chip } from '../src/ui/primitives/Chip';
import { Screen } from '../src/ui/primitives/Screen';
import { Text } from '../src/ui/primitives/Text';

export default function EnergyScreen(): React.JSX.Element {
  const router = useRouter();
  const { colors, accents } = useTheme();
  const { session } = useSession();
  const userId = session?.user?.id;

  const {
    currentLevel,
    setLevel,
    selectedTags,
    toggleTag,
    logEnergy,
  } = useEnergy();

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const levelTip =
    currentLevel > 60
      ? checkinsCopy.energy.levels.high
      : currentLevel >= 30
      ? checkinsCopy.energy.levels.mid
      : checkinsCopy.energy.levels.low;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await logEnergy(currentLevel, selectedTags, userId);
      setSavedSuccess(true);
      setTimeout(() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(tabs)/moments');
        }
      }, 600);
    } catch {
      setIsSaving(false);
    }
  };

  return (
    <Screen style={styles.screen}>
      <View testID="energy-screen" style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            testID="energy-back-button"
            accessibilityRole="button"
            accessibilityLabel={checkinsCopy.energy.backButton}
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace('/(tabs)/moments');
            }}
            style={styles.backButton}
          >
            <Text role="labelLarge" style={{ color: colors.ink }}>
              ← {checkinsCopy.energy.backButton}
            </Text>
          </Pressable>

          <Text role="titleLarge" style={[styles.title, { color: colors.ink }]}>
            {checkinsCopy.energy.title}
          </Text>
          <Text role="bodyMedium" style={{ color: colors.muted, marginTop: 4 }}>
            {checkinsCopy.energy.subtitle}
          </Text>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Draggable Battery Gauge */}
          <View style={styles.gaugeSection}>
            <View style={styles.gaugeWrapper}>
              <BatteryGauge
                testID="energy-battery-gauge"
                value={currentLevel}
                onChange={setLevel}
                mode="drag"
                size="lg"
                accessibilityLabel={checkinsCopy.energy.dragHint}
              />
            </View>

            <Text
              role="titleLarge"
              style={[styles.percentageLabel, { color: colors.ink }]}
            >
              {checkinsCopy.energy.levelLabel(currentLevel)}
            </Text>

            <Text
              role="bodyMedium"
              style={[styles.levelDescription, { color: colors.ink }]}
            >
              {levelTip}
            </Text>

            <Text role="labelSmall" style={{ color: colors.muted, marginTop: 6 }}>
              {checkinsCopy.energy.helperText}
            </Text>
          </View>

          {/* Optional Tag Chips */}
          <View style={styles.tagsSection}>
            <Text
              role="titleSmall"
              style={[styles.tagsHeader, { color: colors.ink }]}
            >
              {checkinsCopy.energy.tagsTitle}
            </Text>

            <View style={styles.tagChipsRow}>
              {checkinsCopy.energy.tags.map((tag) => {
                const isSelected = selectedTags.includes(tag.id);
                return (
                  <View key={tag.id} testID={`energy-tag-${tag.id}`}>
                    <Chip
                      label={tag.label}
                      selected={isSelected}
                      tint={isSelected ? 'mint' : 'neutral'}
                      onPress={() => toggleTag(tag.id)}
                      style={styles.chipMargin}
                    />
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Bottom Save Action */}
        <View style={styles.footer}>
          {savedSuccess ? (
            <View
              testID="energy-saved-toast"
              style={[
                styles.successBanner,
                { backgroundColor: accents.mint.tint },
              ]}
            >
              <Text role="labelMedium" style={{ color: accents.mint.pop }}>
                ✓ {checkinsCopy.energy.savedToast}
              </Text>
            </View>
          ) : (
            <View testID="energy-save-button" style={styles.saveButton}>
              <Button
                label={
                  isSaving
                    ? checkinsCopy.energy.saving
                    : checkinsCopy.energy.saveButton
                }
                variant="primary"
                disabled={isSaving}
                onPress={handleSave}
                style={{ width: '100%' }}
              />
            </View>
          )}
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
  header: {
    marginBottom: 16,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  title: {
    fontWeight: '700',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 24,
  },
  gaugeSection: {
    alignItems: 'center',
    marginVertical: 20,
    width: '100%',
  },
  gaugeWrapper: {
    marginVertical: 12,
  },
  percentageLabel: {
    marginTop: 10,
    fontWeight: '700',
  },
  levelDescription: {
    marginTop: 8,
    textAlign: 'center',
    maxWidth: 280,
  },
  tagsSection: {
    width: '100%',
    marginTop: 16,
  },
  tagsHeader: {
    marginBottom: 10,
    fontWeight: '600',
  },
  tagChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chipMargin: {
    marginBottom: 8,
  },
  footer: {
    paddingVertical: 16,
    width: '100%',
  },
  saveButton: {
    width: '100%',
  },
  successBanner: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
});
