import React, { useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Screen } from '../../src/ui/primitives/Screen';
import { Text } from '../../src/ui/primitives/Text';
import { Card } from '../../src/ui/primitives/Card';
import { Button } from '../../src/ui/primitives/Button';
import { RhythmRing } from '../../src/ui/components/RhythmRing';
import { BatteryGauge } from '../../src/ui/components/BatteryGauge';
import { CharacterAvatar } from '../../src/ui/components/CharacterAvatar';
import { EvidenceLine } from '../../src/ui/components/EvidenceLine';
import { Skeleton } from '../../src/ui/components/Skeleton';
import { useTheme } from '../../src/theme/useTheme';
import { useToday } from '../../src/features/today/useToday';
import { todayCopy } from '../../src/copy/today';

export default function TodayScreen(): React.JSX.Element {
  const router = useRouter();
  const { colors, accents, radii, spacing } = useTheme();
  const {
    greeting,
    batteryLevel,
    rhythm,
    hero,
    moment,
    checkin,
    evidence,
    isEmptyFirstDay,
    isLoading,
    error,
    isOffline,
    refresh,
  } = useToday();

  const [refreshing, setRefreshing] = useState(false);
  const [checkinSaved, setCheckinSaved] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleStartSession = () => {
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics optional
    }
    const easyQuery = hero.isTakeItEasy ? '?easy=true' : '';
    router.push(`/session/${hero.session.id}/idea${easyQuery}` as never);
  };

  const handleAnswerCheckin = async (id: string, label: string) => {
    try {
      void Haptics.selectionAsync();
    } catch {
      // Haptics optional
    }
    const landed = id !== 'skipped';
    await checkin.submit(label, landed);
    setCheckinSaved(true);
    setTimeout(() => setCheckinSaved(false), 3000);
  };

  if (isLoading && !refreshing) {
    return (
      <Screen style={styles.container}>
        <View style={styles.loadingContainer}>
          <Skeleton width="60%" height={32} />
          <View style={{ height: 16 }} />
          <Skeleton width="100%" height={200} />
          <View style={{ height: 16 }} />
          <Skeleton width="100%" height={120} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: spacing[12] }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accents.ember.base} />
        }
      >
        {/* Offline Banner if active */}
        {isOffline && (
          <Card tint="honey" style={styles.offlineBanner}>
            <Text role="bodySmall" style={{ color: accents.honey.pop, fontWeight: '600' }}>
              ⚡ {todayCopy.states.offline}
            </Text>
          </Card>
        )}

        {/* Error notification if any */}
        {error && (
          <Card tint="neutral" style={styles.errorBanner}>
            <Text role="bodySmall" style={{ color: colors.muted }}>
              {todayCopy.states.error}
            </Text>
            <Pressable onPress={() => void refresh()}>
              <Text role="labelSmall" style={{ color: accents.ember.base }}>
                {todayCopy.states.retry}
              </Text>
            </Pressable>
          </Card>
        )}

        {/* 1. Greeting Row */}
        <View style={styles.greetingRow}>
          <View style={styles.greetingTextContainer}>
            <Text role="displayMedium" style={[styles.greetingTitle, { color: colors.ink }]}>
              {greeting}
            </Text>
            <Pressable
              onPress={() => router.push('/energy' as never)}
              style={styles.batteryPill}
              accessibilityRole="button"
              accessibilityLabel={todayCopy.battery.label}
              accessibilityHint={todayCopy.battery.hint}
            >
              <BatteryGauge value={batteryLevel * 20} size="sm" />
              <Text role="labelSmall" muted style={{ marginLeft: 6 }}>
                {todayCopy.battery.label}
              </Text>
            </Pressable>
          </View>

          {/* Weekly Rhythm Ring */}
          <Pressable
            onPress={() => router.push('/settings' as never)}
            accessibilityRole="button"
            accessibilityLabel={todayCopy.rhythm.accessibilityLabel(rhythm.filled, rhythm.total)}
          >
            <RhythmRing
              filledSegments={rhythm.filled}
              totalSegments={rhythm.total}
              size={76}
              strokeWidth={7}
            />
          </Pressable>
        </View>

        {/* 2. Hero Tile (Large Next Session Card) */}
        <Card tint="lilac" style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.badgeRow}>
              <View style={[styles.badgeDot, { backgroundColor: accents.ember.base }]} />
              <Text role="labelSmall" style={{ color: accents.ember.base, fontWeight: '700' }}>
                {hero.isTakeItEasy ? todayCopy.hero.easyModeBadge : todayCopy.hero.badge}
              </Text>
            </View>

            <View style={[styles.durationPill, { backgroundColor: colors.surface2, borderRadius: radii.pill }]}>
              <Text role="labelSmall" style={{ color: colors.ink }}>
                {hero.isTakeItEasy ? todayCopy.hero.takeItEasyDuration : todayCopy.hero.normalDuration}
              </Text>
            </View>
          </View>

          <View style={styles.heroBody}>
            <View style={styles.heroDetails}>
              <Text role="titleLarge" style={[styles.heroSkillName, { color: colors.ink }]}>
                {hero.session.skillName}
              </Text>
              <Text role="bodyMedium" muted style={styles.heroWhyLine}>
                {hero.reason}
              </Text>
            </View>
            <CharacterAvatar
              character={hero.partner.id as never}
              size={58}
              expression="warm"
            />
          </View>

          <View style={styles.heroActions}>
            <Button
              variant="primary"
              label={todayCopy.hero.startButton}
              onPress={handleStartSession}
              accessibilityLabel={`${todayCopy.hero.startButton} ${hero.session.skillName}`}
              style={styles.heroStartButton}
            />

            <Pressable
              onPress={hero.toggleTakeItEasy}
              accessibilityRole="button"
              accessibilityLabel={
                hero.isTakeItEasy ? todayCopy.hero.switchBackToFull : todayCopy.hero.takeItEasyLink
              }
              style={styles.takeItEasyLink}
            >
              <Text role="bodySmall" muted style={{ textDecorationLine: 'underline' }}>
                {hero.isTakeItEasy ? todayCopy.hero.switchBackToFull : todayCopy.hero.takeItEasyLink}
              </Text>
            </Pressable>
          </View>
        </Card>

        {/* 3. Moment Tile */}
        <Card tint="honey" style={styles.tileCard}>
          <View style={styles.tileHeaderRow}>
            <View style={styles.badgeRow}>
              <View style={[styles.badgeDot, { backgroundColor: accents.honey.base }]} />
              <Text role="labelSmall" style={{ color: accents.honey.pop, fontWeight: '700' }}>
                {todayCopy.moment.badge}
              </Text>
            </View>
          </View>

          {moment.hasUpcoming && moment.upcoming ? (
            <View style={styles.momentRow}>
              <View style={styles.momentTextContainer}>
                <Text role="titleMedium" style={{ color: colors.ink }}>
                  {moment.upcoming.title}
                </Text>
                {moment.upcoming.description ? (
                  <Text role="bodySmall" muted numberOfLines={1}>
                    {moment.upcoming.description}
                  </Text>
                ) : null}
              </View>
              <Button
                variant="secondary"
                label={todayCopy.moment.prepButton}
                onPress={() => router.push(`/moments/${moment.upcoming!.id}/prep` as never)}
                accessibilityLabel={`${todayCopy.moment.prepButton} ${moment.upcoming.title}`}
              />
            </View>
          ) : (
            <View style={styles.momentEmptyRow}>
              <View style={styles.momentTextContainer}>
                <Text role="titleSmall" style={{ color: colors.ink }}>
                  {todayCopy.moment.emptyTitle}
                </Text>
                <Text role="bodySmall" muted>
                  {todayCopy.moment.emptySubtitle}
                </Text>
              </View>
              <Button
                variant="ghost"
                label={todayCopy.moment.addAction}
                onPress={() => router.push('/moments/new' as never)}
                accessibilityLabel={todayCopy.moment.addAction}
              />
            </View>
          )}
        </Card>

        {/* 4. Check-in Tile (only when due or just completed) */}
        {(checkin.due || checkinSaved) && (
          <Card tint="mint" style={styles.tileCard}>
            <View style={styles.tileHeaderRow}>
              <View style={styles.badgeRow}>
                <View style={[styles.badgeDot, { backgroundColor: accents.mint.base }]} />
                <Text role="labelSmall" style={{ color: accents.mint.pop, fontWeight: '700' }}>
                  {todayCopy.checkin.badge}
                </Text>
              </View>
            </View>

            {checkinSaved ? (
              <Text role="bodyMedium" style={{ color: accents.mint.pop, fontWeight: '600' }}>
                ✓ {todayCopy.checkin.thanks}
              </Text>
            ) : (
              <View style={styles.checkinContent}>
                <Text role="titleMedium" style={{ color: colors.ink, marginBottom: 12 }}>
                  {checkin.due ? todayCopy.checkin.dueQuestion(checkin.due.prompt) : null}
                </Text>
                <View style={styles.checkinOptionsRow}>
                  {todayCopy.checkin.options.map((opt) => (
                    <Pressable
                      key={opt.id}
                      onPress={() => void handleAnswerCheckin(opt.id, opt.label)}
                      accessibilityRole="button"
                      accessibilityLabel={opt.label}
                      style={[
                        styles.checkinFaceButton,
                        { backgroundColor: colors.surface2, borderRadius: radii.md },
                      ]}
                    >
                      <Text style={styles.checkinEmoji}>{opt.emoji}</Text>
                      <Text role="labelSmall" muted>
                        {opt.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </Card>
        )}

        {/* 5. Evidence Tile */}
        <Card tint="lilac" style={styles.tileCard}>
          <View style={styles.tileHeaderRow}>
            <View style={styles.badgeRow}>
              <View style={[styles.badgeDot, { backgroundColor: accents.lilac.base }]} />
              <Text role="labelSmall" style={{ color: accents.lilac.pop, fontWeight: '700' }}>
                {todayCopy.evidence.badge}
              </Text>
            </View>
          </View>

          {isEmptyFirstDay ? (
            <Text role="bodySmall" muted>
              {todayCopy.evidence.noEvidenceYet}
            </Text>
          ) : (
            <EvidenceLine
              quote={evidence.quote}
              contextNote={evidence.contextNote}
              tilted={false}
              triggerSwipe={false}
            />
          )}
        </Card>
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
    gap: 16,
  },
  loadingContainer: {
    padding: 24,
    gap: 16,
  },
  offlineBanner: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  errorBanner: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  greetingTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  greetingTitle: {
    fontSize: 26,
    lineHeight: 32,
    marginBottom: 6,
  },
  batteryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    minHeight: 28,
  },
  heroCard: {
    padding: 20,
    gap: 14,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  durationPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  heroBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  heroDetails: {
    flex: 1,
    gap: 4,
  },
  heroSkillName: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
  },
  heroWhyLine: {
    lineHeight: 18,
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  heroStartButton: {
    minWidth: 120,
  },
  takeItEasyLink: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    minHeight: 48,
    justifyContent: 'center',
  },
  tileCard: {
    padding: 18,
    gap: 10,
  },
  tileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  momentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  momentEmptyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  momentTextContainer: {
    flex: 1,
    gap: 4,
  },
  checkinContent: {
    gap: 8,
  },
  checkinOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  checkinFaceButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    minHeight: 56,
  },
  checkinEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
});
