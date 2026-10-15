import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/ui/primitives/Screen';
import { Text } from '../../src/ui/primitives/Text';
import { Button } from '../../src/ui/primitives/Button';
import { Card } from '../../src/ui/primitives/Card';
import { WinceMascot } from '../../src/ui/components/WinceMascot';
import { useTheme } from '../../src/theme/useTheme';
import { onboardingCopy } from '../../src/copy/onboarding';
import { useOnboardingStore } from '../../src/features/onboarding/store';

export default function OnboardingIntroScreen(): React.JSX.Element {
  const router = useRouter();
  const { colors, accents, spacing } = useTheme();
  const currentStep = useOnboardingStore((s) => s.currentStep);
  const updateDerivedPlaybook = useOnboardingStore((s) => s.updateDerivedPlaybook);

  const handleBegin = () => {
    router.push(`/(onboarding)/quiz/${currentStep || 1}` as const);
  };

  const handleSkipDefaults = () => {
    updateDerivedPlaybook();
    router.push('/(onboarding)/playbook');
  };

  const copy = onboardingCopy.intro;

  return (
    <Screen style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text
            role="labelSmall"
            style={[styles.eyebrow, { color: accents.ember.base }]}
          >
            {copy.eyebrow}
          </Text>
          <View style={styles.headlineRow}>
            <View style={styles.headlineTextContainer}>
              <Text role="displayMedium" style={[styles.headline, { color: colors.ink }]}>
                {copy.headline}
              </Text>
              <Text role="bodyMedium" muted style={styles.subtitle}>
                {copy.subtitle}
              </Text>
            </View>
            <View style={styles.mascotContainer}>
              <WinceMascot pose="proud" size={68} />
            </View>
          </View>
        </View>

        {/* Feature Preview Tiles */}
        <View style={styles.tilesContainer}>
          <Card tint="lilac" style={styles.previewCard}>
            <View style={styles.cardHeader}>
              <Text role="titleSmall" style={{ color: colors.ink }}>
                {copy.tiles.pace.title}
              </Text>
              <View style={[styles.indicatorDot, { backgroundColor: accents.lilac.base }]} />
            </View>
            <Text role="bodySmall" muted style={styles.cardDesc}>
              {copy.tiles.pace.description}
            </Text>
          </Card>

          <Card tint="mint" style={styles.previewCard}>
            <View style={styles.cardHeader}>
              <Text role="titleSmall" style={{ color: colors.ink }}>
                {copy.tiles.firstSteps.title}
              </Text>
              <View style={[styles.indicatorDot, { backgroundColor: accents.mint.base }]} />
            </View>
            <Text role="bodySmall" muted style={styles.cardDesc}>
              {copy.tiles.firstSteps.description}
            </Text>
          </Card>

          <Card tint="honey" style={styles.previewCard}>
            <View style={styles.cardHeader}>
              <Text role="titleSmall" style={{ color: colors.ink }}>
                {copy.tiles.coach.title}
              </Text>
              <View style={[styles.indicatorDot, { backgroundColor: accents.honey.base }]} />
            </View>
            <Text role="bodySmall" muted style={styles.cardDesc}>
              {copy.tiles.coach.description}
            </Text>
          </Card>

          <Card tint="neutral" style={styles.previewCard}>
            <View style={styles.cardHeader}>
              <Text role="titleSmall" style={{ color: colors.ink }}>
                {copy.tiles.privacy.title}
              </Text>
              <View style={[styles.indicatorDot, { backgroundColor: accents.ember.base }]} />
            </View>
            <Text role="bodySmall" muted style={styles.cardDesc}>
              {copy.tiles.privacy.description}
            </Text>
          </Card>
        </View>

        {/* Bottom CTA buttons */}
        <View style={[styles.footer, { paddingBottom: spacing[8] }]}>
          <Button
            variant="primary"
            label={copy.beginButton}
            onPress={handleBegin}
            accessibilityLabel={copy.beginButton}
            style={styles.actionButton}
          />

          <Pressable
            onPress={handleSkipDefaults}
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
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    justifyContent: 'space-between'
  },
  header: {
    marginBottom: 20
  },
  eyebrow: {
    letterSpacing: 1.2,
    fontWeight: '700',
    marginBottom: 8
  },
  headlineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  headlineTextContainer: {
    flex: 1,
    paddingRight: 12
  },
  headline: {
    lineHeight: 38,
    marginBottom: 8
  },
  subtitle: {
    lineHeight: 20
  },
  mascotContainer: {
    marginTop: 4
  },
  tilesContainer: {
    gap: 12,
    marginVertical: 16
  },
  previewCard: {
    padding: 16
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  cardDesc: {
    lineHeight: 18
  },
  footer: {
    marginTop: 20,
    gap: 12,
    alignItems: 'center'
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
