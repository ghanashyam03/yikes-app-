import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { momentsCopy } from '../../src/copy/moments';
import { useSession } from '../../src/features/auth/useSession';
import { useMoments } from '../../src/features/moments/useMoments';
import type { Moment } from '../../src/features/moments/types';
import { useTheme } from '../../src/theme/useTheme';
import { BatteryGauge } from '../../src/ui/components/BatteryGauge';
import { EmptyState } from '../../src/ui/components/EmptyState';
import { Button } from '../../src/ui/primitives/Button';
import { Card } from '../../src/ui/primitives/Card';
import { Chip } from '../../src/ui/primitives/Chip';
import { Screen } from '../../src/ui/primitives/Screen';
import { Text } from '../../src/ui/primitives/Text';

export default function MomentsTab(): React.JSX.Element {
  const router = useRouter();
  const { colors, accents } = useTheme();
  const { session } = useSession();
  const userId = session?.user?.id;

  const {
    moments,
    selectedFilter,
    setFilter,
    fetchMoments,
  } = useMoments();

  const [batteryLevel] = useState<number>(65);

  useEffect(() => {
    fetchMoments(userId);
  }, [fetchMoments, userId]);

  const upcomingMoments = moments.filter((m) => m.status === 'upcoming');
  const pastMoments = moments.filter((m) => m.status === 'past' || m.status === 'completed');

  const displayedMoments = selectedFilter === 'upcoming' ? upcomingMoments : pastMoments;

  const recoveryTip =
    batteryLevel > 60
      ? momentsCopy.tab.recoveryTips.high
      : batteryLevel >= 30
      ? momentsCopy.tab.recoveryTips.mid
      : momentsCopy.tab.recoveryTips.low;

  function formatEventDate(dateStr?: string): string {
    if (!dateStr) return 'Flexible time';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  }

  return (
    <Screen style={styles.screen}>
      <View testID="moments-tab-screen" style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text role="titleLarge" style={{ color: colors.ink }}>
            {momentsCopy.tab.title}
          </Text>
        </View>

        {/* Social Battery Gauge & Recovery Tip Card */}
        <Card style={styles.batteryCard} tint="mint">
          <View style={styles.batteryRow}>
            <View style={styles.batteryGaugeContainer}>
              <BatteryGauge
                value={batteryLevel}
                testID="moments-battery-gauge"
                accessibilityLabel={momentsCopy.tab.batteryA11y(batteryLevel)}
              />
            </View>
            <View style={styles.recoveryTipContainer}>
              <Text role="labelSmall" style={{ color: accents.mint.pop, fontWeight: '700' }}>
                {momentsCopy.tab.batteryLabel.toUpperCase()} · {batteryLevel}%
              </Text>
              <Text role="bodySmall" style={{ color: colors.ink, marginTop: 4 }}>
                {recoveryTip}
              </Text>
            </View>
          </View>
        </Card>

        {/* Segmented Control: Upcoming vs Past */}
        <View
          testID="moments-segmented-control"
          style={[styles.segmentRow, { backgroundColor: colors.surface2, borderColor: colors.line }]}
        >
          <Pressable
            testID="segment-upcoming"
            accessibilityRole="tab"
            accessibilityLabel="Upcoming moments"
            accessibilityState={{ selected: selectedFilter === 'upcoming' }}
            onPress={() => setFilter('upcoming')}
            style={[
              styles.segmentButton,
              selectedFilter === 'upcoming' && [
                styles.segmentActive,
                { backgroundColor: colors.surface1 },
              ],
            ]}
          >
            <Text
              role="labelMedium"
              style={{
                color: selectedFilter === 'upcoming' ? colors.ink : colors.muted,
                fontWeight: selectedFilter === 'upcoming' ? '700' : '500',
              }}
            >
              {momentsCopy.tab.segments.upcoming} ({upcomingMoments.length})
            </Text>
          </Pressable>

          <Pressable
            testID="segment-past"
            accessibilityRole="tab"
            accessibilityLabel="Past moments"
            accessibilityState={{ selected: selectedFilter === 'past' }}
            onPress={() => setFilter('past')}
            style={[
              styles.segmentButton,
              selectedFilter === 'past' && [
                styles.segmentActive,
                { backgroundColor: colors.surface1 },
              ],
            ]}
          >
            <Text
              role="labelMedium"
              style={{
                color: selectedFilter === 'past' ? colors.ink : colors.muted,
                fontWeight: selectedFilter === 'past' ? '700' : '500',
              }}
            >
              {momentsCopy.tab.segments.past} ({pastMoments.length})
            </Text>
          </Pressable>
        </View>

        {/* Timeline Content */}
        <ScrollView
          testID="moments-timeline-scroll"
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
        >
          {displayedMoments.length === 0 ? (
            <View testID="moments-empty-state" style={styles.emptyContainer}>
              <EmptyState
                pose="curious"
                title={
                  selectedFilter === 'upcoming'
                    ? momentsCopy.tab.emptyState.title
                    : momentsCopy.tab.pastEmptyState.title
                }
                description={
                  selectedFilter === 'upcoming'
                    ? momentsCopy.tab.emptyState.description
                    : momentsCopy.tab.pastEmptyState.description
                }
                actionLabel={momentsCopy.tab.emptyState.action}
                onAction={() => router.push('/moments/new')}
              />
            </View>
          ) : (
            <View style={styles.timelineList}>
              {displayedMoments.map((moment: Moment) => {
                const hasPrep = Boolean(moment.prepPayload);
                return (
                  <Pressable
                    key={moment.id}
                    testID={`moment-card-${moment.id}`}
                    accessibilityRole="button"
                    accessibilityLabel={`${moment.title}, ${formatEventDate(moment.eventDate)}`}
                    onPress={() => router.push(`/moments/${moment.id}/prep`)}
                  >
                    <Card style={styles.momentCard}>
                      <View style={styles.momentCardHeader}>
                        <View style={styles.momentTitleCol}>
                          <Text role="titleMedium" style={{ color: colors.ink }}>
                            {moment.title}
                          </Text>
                          <Text role="labelSmall" style={{ color: colors.muted, marginTop: 2 }}>
                            {formatEventDate(moment.eventDate)}
                          </Text>
                        </View>

                        {/* Status Chip */}
                        {selectedFilter === 'upcoming' ? (
                          <Chip
                            label={
                              hasPrep
                                ? momentsCopy.tab.status.prepReady
                                : momentsCopy.tab.status.needsPrep
                            }
                            tint={hasPrep ? 'mint' : 'honey'}
                          />
                        ) : (
                          <Chip
                            label={momentsCopy.tab.status.completed}
                            tint="lilac"
                          />
                        )}
                      </View>

                      {/* Meta chips row */}
                      <View style={styles.metaRow}>
                        <Chip
                          label={momentsCopy.tab.card.batteryCost(20)}
                          tint="ember"
                          style={styles.chipMargin}
                        />
                        {moment.attendees ? (
                          <Chip
                            label={moment.attendees}
                            tint="lilac"
                            style={styles.chipMargin}
                          />
                        ) : null}
                      </View>

                      {/* Card Action Shortcuts */}
                      {selectedFilter === 'upcoming' && (
                        <View style={styles.cardActionsRow}>
                          <Button
                            label={momentsCopy.tab.card.prepAction}
                            variant="secondary"
                            style={styles.actionBtn}
                            onPress={() => router.push(`/moments/${moment.id}/prep`)}
                          />
                          {hasPrep && (
                            <>
                              <Button
                                label={momentsCopy.tab.card.rehearseAction}
                                variant="secondary"
                                style={styles.actionBtn}
                                onPress={() => router.push(`/moments/${moment.id}/rehearse`)}
                              />
                              <Button
                                label={momentsCopy.tab.card.pocketAction}
                                variant="ghost"
                                style={styles.actionBtn}
                                onPress={() => router.push(`/moments/${moment.id}/pocket`)}
                              />
                            </>
                          )}
                        </View>
                      )}

                      {selectedFilter === 'past' && (
                        <View style={styles.metaRow}>
                          <Chip
                            label={momentsCopy.tab.card.debriefChip}
                            tint="lilac"
                            style={styles.chipMargin}
                          />
                          <Chip
                            label={momentsCopy.tab.card.energyChip(moment.energyLevel ?? 3)}
                            tint="mint"
                            style={styles.chipMargin}
                          />
                        </View>
                      )}
                    </Card>
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* Floating Add Moment Button */}
        <View testID="floating-add-moment-btn" style={styles.floatingButtonContainer}>
          <Button
            label={`+ ${momentsCopy.tab.floatingAdd}`}
            accessibilityLabel={momentsCopy.tab.floatingAddA11y}
            variant="primary"
            onPress={() => router.push('/moments/new')}
            style={styles.floatingButton}
          />
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
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    marginBottom: 12,
  },
  batteryCard: {
    padding: 14,
    marginBottom: 16,
  },
  batteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  batteryGaugeContainer: {
    width: 68,
    height: 38,
    marginRight: 14,
  },
  recoveryTipContainer: {
    flex: 1,
  },
  segmentRow: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    marginBottom: 16,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
  },
  segmentActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 90,
  },
  emptyContainer: {
    marginTop: 24,
  },
  timelineList: {
    gap: 12,
  },
  momentCard: {
    padding: 16,
  },
  momentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  momentTitleCol: {
    flex: 1,
    marginRight: 12,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  chipMargin: {
    marginRight: 8,
    marginBottom: 4,
  },
  cardActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  actionBtn: {
    marginRight: 4,
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    left: 16,
    alignItems: 'center',
  },
  floatingButton: {
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
});
