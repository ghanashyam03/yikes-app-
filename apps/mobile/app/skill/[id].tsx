import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { youCopy } from '../../src/copy/you';
import { useYou } from '../../src/features/you/useYou';
import { useTheme } from '../../src/theme/useTheme';
import { EmptyState } from '../../src/ui/components/EmptyState';
import { EvidenceLine } from '../../src/ui/components/EvidenceLine';
import { Button } from '../../src/ui/primitives/Button';
import { Card } from '../../src/ui/primitives/Card';
import { Screen } from '../../src/ui/primitives/Screen';
import { Text } from '../../src/ui/primitives/Text';

export default function SkillDetailScreen(): React.JSX.Element {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const skillKey = params.id || 'starting_chat';
  const { colors, accents } = useTheme();
  const { getSkillDetail } = useYou();

  const skill = getSkillDetail(skillKey);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/you');
    }
  };

  const handlePractice = () => {
    router.push('/(tabs)');
  };

  if (!skill) {
    return (
      <Screen style={styles.screen}>
        <View style={styles.container} testID="skill-empty-screen">
          <Pressable
            testID="skill-back-button"
            accessibilityRole="button"
            accessibilityLabel={youCopy.skill.backButton}
            onPress={handleBack}
            style={[styles.backButton, { backgroundColor: colors.surface1, borderColor: colors.line }]}
          >
            <Text role="labelLarge" style={{ color: colors.ink }}>
              ←
            </Text>
          </Pressable>
          <EmptyState
            pose="thinking"
            title="Skill not found"
            description="The requested skill was not found in your playbook."
            actionLabel={youCopy.skill.backButton}
            onAction={handleBack}
          />
        </View>
      </Screen>
    );
  }

  const stageLabel =
    youCopy.skill.stages[skill.stage] || youCopy.skill.stages.starting;

  const stageColor =
    skill.stage === 'natural'
      ? accents.mint.base
      : skill.stage === 'growing'
      ? accents.sky.base
      : skill.stage === 'practicing'
      ? accents.lilac.base
      : colors.muted;

  return (
    <Screen style={styles.screen}>
      <ScrollView
        testID="skill-detail-scroll"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            testID="skill-back-button"
            accessibilityRole="button"
            accessibilityLabel={youCopy.skill.backButton}
            onPress={handleBack}
            style={[styles.backButton, { backgroundColor: colors.surface1, borderColor: colors.line }]}
          >
            <Text role="labelLarge" style={{ color: colors.ink }}>
              ←
            </Text>
          </Pressable>
          <View style={styles.headerInfo}>
            <Text role="titleLarge" style={[styles.title, { color: colors.ink }]}>
              {skill.name}
            </Text>
            <Text role="bodySmall" style={{ color: colors.muted }}>
              {skill.description}
            </Text>
          </View>
        </View>

        {/* Stage Ring & Review Due Indicator */}
        <View testID="skill-stage-card">
          <Card style={styles.stageCard}>
            <View style={styles.stageRingContainer}>
              <View style={[styles.largeRing, { borderColor: stageColor }]}>
                <View style={[styles.innerRing, { backgroundColor: colors.surface1 }]}>
                  <Text role="titleMedium" style={{ color: stageColor, fontWeight: '700' }}>
                    {stageLabel}
                  </Text>
                  <Text role="labelSmall" style={{ color: colors.muted }}>
                    {youCopy.skill.stageLabel}
                  </Text>
                </View>
              </View>
            </View>

            {/* Review Due Badge (Honey, never red!) */}
            {skill.isReviewDue && (
              <View
                testID="review-due-badge"
                style={[
                  styles.reviewDueContainer,
                  {
                    backgroundColor: accents.honey.tint,
                    borderColor: accents.honey.base,
                  },
                ]}
                accessibilityRole="alert"
                accessibilityLabel={`${youCopy.skill.reviewDueBadge}. ${youCopy.skill.reviewDueHelper}`}
              >
                <Text role="labelMedium" style={{ color: accents.honey.pop, fontWeight: '700' }}>
                  🍯 {youCopy.skill.reviewDueBadge}
                </Text>
                <Text role="bodySmall" style={{ color: colors.ink, marginTop: 4 }}>
                  {youCopy.skill.reviewDueHelper}
                </Text>
              </View>
            )}
          </Card>
        </View>

        {/* "Why I think so" Section: 3 Verbatim Evidence Quotes */}
        <View style={styles.section} testID="why-i-think-so-section">
          <Text role="titleMedium" style={[styles.sectionTitle, { color: colors.ink }]}>
            {youCopy.skill.whyIThinkSo}
          </Text>
          <Text role="bodySmall" style={[styles.sectionSubtitle, { color: colors.muted }]}>
            {youCopy.skill.whyIThinkSoHelper}
          </Text>

          <View style={styles.evidenceList}>
            {skill.evidenceQuotes.map((eq, i) => (
              <View key={`${eq.sessionId}_${i}`} style={styles.evidenceItem} testID={`evidence-quote-${i}`}>
                <EvidenceLine
                  quote={eq.quote}
                  contextNote={eq.sessionTitle ?? ''}
                  tilted={i % 2 === 1}
                  tiltAngle={i % 2 === 1 ? -1 : 1}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Recent Sessions */}
        <View style={styles.section} testID="recent-sessions-section">
          <Text role="titleMedium" style={[styles.sectionTitle, { color: colors.ink }]}>
            {youCopy.skill.recentSessions}
          </Text>
          {skill.evidenceQuotes.length > 0 ? (
            skill.evidenceQuotes.map((eq, idx) => (
              <View key={`recent_${idx}`} testID={`recent-session-card-${idx}`}>
                <Card
                  style={styles.recentSessionCard}
                >
                  <View style={styles.recentSessionRow}>
                    <Text role="labelMedium" style={{ color: colors.ink }}>
                      {eq.sessionTitle || `Practice Session ${idx + 1}`}
                    </Text>
                    <Text role="labelSmall" style={{ color: colors.muted }}>
                      {new Date(eq.date).toLocaleDateString()}
                    </Text>
                  </View>
                </Card>
              </View>
            ))
          ) : (
            <Text role="bodySmall" style={{ color: colors.muted }}>
              {youCopy.skill.noRecentSessions}
            </Text>
          )}
        </View>

        {/* CTA Button */}
        <View style={styles.ctaContainer} testID="practice-skill-button">
          <Button
            label={youCopy.skill.practiceCta}
            onPress={handlePractice}
            variant="primary"
            accessibilityLabel={`${youCopy.skill.practiceCta} ${skill.name}`}
          />
        </View>
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
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  stageCard: {
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  stageRingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  largeRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewDueContainer: {
    width: '100%',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 4,
    fontWeight: '600',
  },
  sectionSubtitle: {
    marginBottom: 14,
  },
  evidenceList: {
    gap: 12,
  },
  evidenceItem: {
    marginVertical: 4,
  },
  recentSessionCard: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  recentSessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ctaContainer: {
    marginTop: 12,
  },
});
