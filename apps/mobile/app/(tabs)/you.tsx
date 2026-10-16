import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { youCopy } from '../../src/copy/you';
import { useYou } from '../../src/features/you/useYou';
import { useTheme } from '../../src/theme/useTheme';
import { EvidenceLine } from '../../src/ui/components/EvidenceLine';
import { Screen } from '../../src/ui/primitives/Screen';
import { Text } from '../../src/ui/primitives/Text';

export default function YouTab(): React.JSX.Element {
  const router = useRouter();
  const { colors, accents, radii } = useTheme();
  const { data } = useYou();

  const handleOpenJournal = () => router.push('/journal');
  const handleOpenGap = () => router.push('/gap');
  const handleOpenBattery = () => router.push('/battery');
  const handleOpenLadder = () => router.push('/ladder');
  const handleOpenSkill = (skillKey: string) => router.push(`/skill/${skillKey}`);
  const handleOpenSettings = () => router.push('/settings');

  return (
    <Screen style={styles.screen}>
      <ScrollView
        testID="you-screen-scroll"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Display Name & Settings Link */}
        <View style={styles.headerRow}>
          <View style={styles.nameContainer}>
            <Text role="titleLarge" style={[styles.title, { color: colors.ink }]}>
              {youCopy.bento.greeting(data.displayName)}
            </Text>
          </View>
          <Pressable
            testID="settings-link-button"
            accessibilityRole="button"
            accessibilityLabel={youCopy.bento.tiles.settings.accessibilityLabel}
            onPress={handleOpenSettings}
            style={[styles.settingsButton, { backgroundColor: colors.surface1, borderColor: colors.line }]}
          >
            <Text role="labelLarge" style={{ color: colors.ink }}>
              ⚙️
            </Text>
          </Pressable>
        </View>

        {/* Quiet Line of Evidence (Never a number / score) */}
        <View style={styles.evidenceContainer} testID="evidence-line-wrapper">
          <EvidenceLine
            quote={data.evidenceLine.quote}
            contextNote={data.evidenceLine.contextNote}
            tilted={false}
          />
        </View>

        {/* Bento Grid */}
        <View style={styles.bentoGrid}>
          {/* Row 1: Skills card with 12 rings */}
          <Pressable
            testID="skills-tile"
            onPress={() => {
              const firstSkill = data.skills[0];
              if (firstSkill) handleOpenSkill(firstSkill.skillKey);
            }}
            accessibilityRole="button"
            accessibilityLabel={`${youCopy.bento.tiles.skills.title}. ${youCopy.bento.tiles.skills.description}`}
            style={[
              styles.fullWidthCard,
              {
                backgroundColor: colors.surface1,
                borderColor: colors.line,
                borderRadius: radii.card,
                borderWidth: 1,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <Text role="titleMedium" style={{ color: colors.ink }}>
                {youCopy.bento.tiles.skills.title}
              </Text>
              <Text role="labelSmall" style={{ color: accents.honey.pop }}>
                {data.skills.filter((s) => s.isReviewDue).length > 0
                  ? `${data.skills.filter((s) => s.isReviewDue).length} ${youCopy.skill.reviewDueBadge}`
                  : `${data.skills.filter((s) => s.stage === 'natural').length} natural`}
              </Text>
            </View>
            <Text role="bodySmall" style={[styles.tileDescription, { color: colors.muted }]}>
              {youCopy.bento.tiles.skills.description}
            </Text>

            {/* 12 Skill Pills / Mini-rings */}
            <View style={styles.skillsGrid}>
              {data.skills.map((skill) => {
                const stageColor =
                  skill.stage === 'natural'
                    ? accents.mint.base
                    : skill.stage === 'growing'
                    ? accents.sky.base
                    : skill.stage === 'practicing'
                    ? accents.lilac.base
                    : colors.muted;

                return (
                  <Pressable
                    key={skill.skillKey}
                    testID={`skill-chip-${skill.skillKey}`}
                    accessibilityRole="button"
                    accessibilityLabel={`${skill.name}, stage ${skill.stage}${skill.isReviewDue ? ', review due' : ''}`}
                    onPress={() => handleOpenSkill(skill.skillKey)}
                    style={[
                      styles.skillMiniPill,
                      {
                        backgroundColor: colors.surface2,
                        borderColor: skill.isReviewDue ? accents.honey.base : colors.line,
                      },
                    ]}
                  >
                    <View style={[styles.stageDot, { backgroundColor: stageColor }]} />
                    <Text role="labelSmall" numberOfLines={1} style={{ color: colors.ink, maxWidth: 85 }}>
                      {skill.name}
                    </Text>
                    {skill.isReviewDue && (
                      <View style={[styles.dueDot, { backgroundColor: accents.honey.base }]} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </Pressable>

          {/* Row 2: Two tiles (Growth Journal & Quiet Ladder) */}
          <View style={styles.twoColumnRow}>
            {/* Growth Journal */}
            <Pressable
              testID="journal-tile"
              onPress={handleOpenJournal}
              accessibilityRole="button"
              accessibilityLabel={`${youCopy.bento.tiles.journal.title}. ${data.journalCount} entries.`}
              style={[
                styles.halfWidthCard,
                {
                  backgroundColor: colors.surface1,
                  borderColor: colors.line,
                  borderRadius: radii.card,
                  borderWidth: 1,
                },
              ]}
            >
              <Text role="titleSmall" style={{ color: colors.ink }}>
                {youCopy.bento.tiles.journal.title}
              </Text>
              <Text role="bodySmall" style={[styles.tileDescription, { color: colors.muted }]}>
                {youCopy.bento.tiles.journal.description}
              </Text>
              <View style={styles.cardFooter}>
                <Text role="labelSmall" style={{ color: accents.mint.pop }}>
                  {data.journalCount > 0
                    ? `${data.journalCount} saved entries`
                    : 'Opens with 1st session'}
                </Text>
              </View>
            </Pressable>

            {/* Quiet Ladder */}
            <Pressable
              testID="ladder-tile"
              onPress={handleOpenLadder}
              accessibilityRole="button"
              accessibilityLabel={`${youCopy.bento.tiles.ladder.title}. ${data.ladderSummary.completedCount} of ${data.ladderSummary.totalCount} completed.`}
              style={[
                styles.halfWidthCard,
                {
                  backgroundColor: colors.surface1,
                  borderColor: colors.line,
                  borderRadius: radii.card,
                  borderWidth: 1,
                },
              ]}
            >
              <Text role="titleSmall" style={{ color: colors.ink }}>
                {youCopy.bento.tiles.ladder.title}
              </Text>
              <Text role="bodySmall" style={[styles.tileDescription, { color: colors.muted }]} numberOfLines={2}>
                {data.ladderSummary.currentRungTitle || youCopy.bento.tiles.ladder.description}
              </Text>
              <View style={styles.cardFooter}>
                <Text role="labelSmall" style={{ color: accents.honey.pop }}>
                  {`${data.ladderSummary.completedCount}/${data.ladderSummary.totalCount || 8} done`}
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Row 3: Two tiles (Gap Trend & Battery Patterns) */}
          <View style={styles.twoColumnRow}>
            {/* Gap Trend */}
            <Pressable
              testID="gap-tile"
              onPress={handleOpenGap}
              accessibilityRole="button"
              accessibilityLabel={`${youCopy.bento.tiles.gap.title}. Trend ${data.gapSummary.trend}.`}
              style={[
                styles.halfWidthCard,
                {
                  backgroundColor: colors.surface1,
                  borderColor: colors.line,
                  borderRadius: radii.card,
                  borderWidth: 1,
                },
              ]}
            >
              <Text role="titleSmall" style={{ color: colors.ink }}>
                {youCopy.bento.tiles.gap.title}
              </Text>
              <Text role="bodySmall" style={[styles.tileDescription, { color: colors.muted }]}>
                {data.gapSummary.totalCheckins > 0
                  ? `Trend is ${data.gapSummary.trend}`
                  : 'Start with 1st real step'}
              </Text>
              <View style={styles.cardFooter}>
                <Text role="labelSmall" style={{ color: accents.sky.pop }}>
                  {data.gapSummary.totalCheckins > 0
                    ? `${data.gapSummary.totalCheckins} check-ins`
                    : 'Explore Gap'}
                </Text>
              </View>
            </Pressable>

            {/* Battery Patterns */}
            <Pressable
              testID="battery-tile"
              onPress={handleOpenBattery}
              accessibilityRole="button"
              accessibilityLabel={`${youCopy.bento.tiles.battery.title}. Current battery ${data.batterySummary.currentLevel} percent.`}
              style={[
                styles.halfWidthCard,
                {
                  backgroundColor: colors.surface1,
                  borderColor: colors.line,
                  borderRadius: radii.card,
                  borderWidth: 1,
                },
              ]}
            >
              <Text role="titleSmall" style={{ color: colors.ink }}>
                {youCopy.bento.tiles.battery.title}
              </Text>
              <Text role="bodySmall" style={[styles.tileDescription, { color: colors.muted }]}>
                {youCopy.bento.tiles.battery.description}
              </Text>
              <View style={styles.cardFooter}>
                <Text role="labelSmall" style={{ color: accents.mint.pop }}>
                  {data.batterySummary.hasLogs ? 'Weekly heat-grid' : 'Log battery'}
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Row 4: Playbook summary tile */}
          <Pressable
            testID="playbook-tile"
            onPress={handleOpenSettings}
            accessibilityRole="button"
            accessibilityLabel={`${youCopy.bento.tiles.playbook.title}. ${youCopy.bento.tiles.playbook.description}`}
            style={[
              styles.fullWidthCard,
              {
                backgroundColor: colors.surface1,
                borderColor: colors.line,
                borderRadius: radii.card,
                borderWidth: 1,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <Text role="titleSmall" style={{ color: colors.ink }}>
                {youCopy.bento.tiles.playbook.title}
              </Text>
              <Text role="labelSmall" style={{ color: colors.muted }}>
                Edit →
              </Text>
            </View>
            <Text role="bodySmall" style={[styles.tileDescription, { color: colors.muted }]}>
              {youCopy.bento.tiles.playbook.description}
            </Text>
          </Pressable>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  nameContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  settingsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  evidenceContainer: {
    marginBottom: 20,
  },
  bentoGrid: {
    gap: 14,
  },
  fullWidthCard: {
    padding: 16,
    minHeight: 120,
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidthCard: {
    flex: 1,
    padding: 14,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  tileDescription: {
    marginTop: 2,
    marginBottom: 8,
    lineHeight: 18,
  },
  cardFooter: {
    marginTop: 'auto',
    paddingTop: 4,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  skillMiniPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    minHeight: 32,
  },
  stageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dueDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
