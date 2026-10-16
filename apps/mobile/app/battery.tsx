import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { youCopy } from '../src/copy/you';
import { useSession } from '../src/features/auth/useSession';
import { useEnergy } from '../src/features/energy/useEnergy';
import {
  aggregateEnergyLogs,
  type TimeSlot,
} from '../src/features/you/heatGrid';
import { useTheme } from '../src/theme/useTheme';
import { EmptyState } from '../src/ui/components/EmptyState';
import { Card } from '../src/ui/primitives/Card';
import { Chip } from '../src/ui/primitives/Chip';
import { Screen } from '../src/ui/primitives/Screen';
import { Text } from '../src/ui/primitives/Text';

interface BatteryInsight {
  id: string;
  title: string;
  takeaway: string;
  category: 'pattern' | 'cost' | 'recharge';
}

interface PlanMyWeekData {
  headline: string;
  recommendation: string;
  heavyDays?: string[];
  recoveryWindows?: string[];
}

export default function BatteryScreen(): React.JSX.Element {
  const router = useRouter();
  const { colors, accents } = useTheme();
  const { session } = useSession();
  const { logs, fetchLogs } = useEnergy();
  const userId = session?.user?.id;

  const [insights, setInsights] = useState<BatteryInsight[]>([]);
  const [planMyWeek, setPlanMyWeek] = useState<PlanMyWeekData | null>(null);
  const [_isLoadingInsights, setIsLoadingInsights] = useState(false);

  useEffect(() => {
    if (userId) {
      void fetchLogs(userId);
    }
  }, [userId, fetchLogs]);

  const stats = aggregateEnergyLogs(logs);

  // Fetch AI insights from gateway (sends ONLY aggregated stats)
  useEffect(() => {
    async function loadInsights() {
      setIsLoadingInsights(true);
      const gatewayUrl =
        process.env.EXPO_PUBLIC_GATEWAY_URL || 'http://127.0.0.1:3000';

      const payload = {
        dayTimeAverages: stats.dayTimeAverages,
        topCostTags: stats.topCostTags,
        topRechargeTags: stats.topRechargeTags,
      };

      try {
        const res = await fetch(`${gatewayUrl}/v1/insights/battery`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.accessToken
              ? { Authorization: `Bearer ${session.accessToken}` }
              : {}),
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data = await res.json();
          setInsights(data.insights);
          setPlanMyWeek(data.planMyWeek);
        } else {
          // Client authored fallback
          applyAuthoredFallbacks();
        }
      } catch {
        applyAuthoredFallbacks();
      } finally {
        setIsLoadingInsights(false);
      }
    }

    function applyAuthoredFallbacks() {
      const topCost = stats.topCostTags[0]?.tag ?? 'Large groups';
      const topRecharge = stats.topRechargeTags[0]?.tag ?? 'Solo quiet time';

      setInsights([
        {
          id: 'insight-1',
          title: 'Midweek rhythm',
          takeaway:
            'Wednesday and Thursday afternoons show your steepest energy drop. Guarding 15 quiet minutes between chats keeps your focus steady.',
          category: 'pattern',
        },
        {
          id: 'insight-2',
          title: `${topCost} cost`,
          takeaway: `${topCost} cost you the most; plan a quiet hour right after them.`,
          category: 'cost',
        },
        {
          id: 'insight-3',
          title: `${topRecharge} recharge`,
          takeaway: `${topRecharge} reliably restore your balance. Placing one after a heavy conversation helps you recover smoothly.`,
          category: 'recharge',
        },
      ]);

      setPlanMyWeek({
        headline: 'Protect a quiet recovery window',
        recommendation:
          'Midweek conversation load is heaviest. Keep Friday evening clear of optional obligations so you enter the weekend recharged.',
        heavyDays: ['Thursday', 'Wednesday'],
        recoveryWindows: ['Friday evening', 'Sunday morning'],
      });
    }

    if (logs.length > 0) {
      void loadInsights();
    }
  }, [logs.length, session?.accessToken]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/you');
    }
  };

  const getCellBgColor = (level: number | null): string => {
    if (level === null) return colors.surface2;
    if (level >= 65) return accents.mint.tint;
    if (level >= 35) return accents.honey.tint;
    return accents.lilac.tint;
  };

  const getCellTextColor = (level: number | null): string => {
    if (level === null) return colors.muted;
    if (level >= 65) return accents.mint.base;
    if (level >= 35) return accents.honey.pop;
    return accents.lilac.base;
  };

  const timeSlots: TimeSlot[] = ['morning', 'afternoon', 'evening'];

  return (
    <Screen style={styles.screen}>
      <ScrollView
        testID="battery-screen-scroll"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            testID="battery-back-button"
            accessibilityRole="button"
            accessibilityLabel={youCopy.skill.backButton}
            onPress={handleBack}
            style={[styles.backButton, { backgroundColor: colors.surface1, borderColor: colors.line }]}
          >
            <Text role="labelLarge" style={{ color: colors.ink }}>
              ←
            </Text>
          </Pressable>
          <View style={styles.headerTitles}>
            <Text role="titleLarge" style={[styles.title, { color: colors.ink }]}>
              {youCopy.battery.title}
            </Text>
            <Text role="bodySmall" style={{ color: colors.muted }}>
              {youCopy.battery.subtitle}
            </Text>
          </View>
        </View>

        {logs.length === 0 ? (
          <View style={styles.emptyContainer} testID="battery-empty-state">
            <EmptyState
              pose="sleepy"
              title={youCopy.battery.title}
              description={youCopy.battery.emptyState}
              actionLabel={youCopy.battery.emptyAction}
              onAction={() => router.push('/energy')}
            />
          </View>
        ) : (
          <>
            {/* Heat-grid Card */}
            <View testID="battery-heatgrid-card">
              <Card style={styles.heatGridCard}>
              <Text role="titleSmall" style={[styles.sectionTitle, { color: colors.ink }]}>
                {youCopy.battery.heatGridTitle}
              </Text>
              <Text role="bodySmall" style={[styles.sectionSubtitle, { color: colors.muted }]}>
                {youCopy.battery.gridDescription}
              </Text>

              {/* Weekly Heat-Grid Table */}
              <View
                style={styles.gridContainer}
                testID="battery-heatgrid"
                accessible={true}
                accessibilityRole="image"
                accessibilityLabel="Weekly energy heat-grid across 7 days and 3 time slots"
              >
                {/* Header Row: Days */}
                <View style={styles.gridRow}>
                  <View style={styles.slotLabelHeader} />
                  {youCopy.battery.dayNames.map((dayName, dayIdx) => (
                    <View key={`header_${dayIdx}`} style={styles.dayColHeader}>
                      <Text role="labelSmall" style={{ color: colors.muted }}>
                        {dayName}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Slots Rows */}
                {timeSlots.map((slot) => {
                  const slotLabel =
                    slot === 'morning'
                      ? youCopy.battery.morning
                      : slot === 'afternoon'
                      ? youCopy.battery.afternoon
                      : youCopy.battery.evening;

                  return (
                    <View key={`slot_${slot}`} style={styles.gridRow}>
                      <View style={styles.slotLabelHeader}>
                        <Text role="labelSmall" style={{ color: colors.ink, fontWeight: '600' }}>
                          {slotLabel.slice(0, 3)}
                        </Text>
                      </View>

                      {youCopy.battery.dayNames.map((dayName, dayIdx) => {
                        const cell = stats.gridCells.find(
                          (c) => c.dayOfWeek === dayIdx && c.timeSlot === slot
                        );
                        const avg = cell?.avgEnergy ?? null;
                        const cellBg = getCellBgColor(avg);
                        const cellColor = getCellTextColor(avg);

                        return (
                          <View
                            key={`cell_${dayIdx}_${slot}`}
                            testID={`heatgrid-cell-${dayIdx}-${slot}`}
                            accessible={true}
                            accessibilityRole="text"
                            accessibilityLabel={youCopy.battery.cellA11y(dayName, slotLabel, avg)}
                            style={[
                              styles.gridCell,
                              {
                                backgroundColor: cellBg,
                                borderColor: colors.line,
                              },
                            ]}
                          >
                            <Text role="labelSmall" style={{ color: cellColor, fontWeight: '700' }}>
                              {avg !== null ? `${avg}%` : '–'}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  );
                })}
              </View>
            </Card>
            </View>

            {/* Coach Insight Cards (3 cards) */}
            <View style={styles.insightsSection} testID="battery-insights-section">
              <Text role="titleSmall" style={[styles.sectionTitle, { color: colors.ink }]}>
                {youCopy.battery.insightsTitle}
              </Text>
              <Text role="bodySmall" style={[styles.sectionSubtitle, { color: colors.muted }]}>
                {youCopy.battery.insightsHelper}
              </Text>

              <View style={styles.insightCardsList}>
                {insights.map((insight) => {
                  const badgeColor =
                    insight.category === 'cost'
                      ? accents.honey.base
                      : insight.category === 'recharge'
                      ? accents.mint.base
                      : accents.sky.base;

                  return (
                    <View
                      key={insight.id}
                      testID={`battery-insight-card-${insight.id}`}
                    >
                      <Card
                        style={styles.insightCard}
                      >
                        <View style={styles.insightHeaderRow}>
                          <Text role="titleSmall" style={[styles.insightTitle, { color: colors.ink }]}>
                            {insight.title}
                          </Text>
                          <View style={[styles.categoryPill, { backgroundColor: badgeColor }]}>
                            <Text role="labelSmall" style={{ color: colors.surface1, fontWeight: '700' }}>
                              {insight.category}
                            </Text>
                          </View>
                        </View>
                        <Text role="bodyMedium" style={[styles.insightTakeaway, { color: colors.ink }]}>
                          {insight.takeaway}
                        </Text>
                      </Card>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Plan My Week Recovery Suggestion */}
            {planMyWeek && (
              <View testID="plan-my-week-card">
                <Card style={styles.planCard}>
                  <Text role="titleMedium" style={{ color: colors.ink, fontWeight: '700', marginBottom: 6 }}>
                    {youCopy.battery.planMyWeekTitle}: {planMyWeek.headline}
                  </Text>
                  <Text role="bodyMedium" style={{ color: colors.ink, lineHeight: 22, marginBottom: 12 }}>
                    {planMyWeek.recommendation}
                  </Text>

                  {planMyWeek.heavyDays && planMyWeek.heavyDays.length > 0 && (
                    <View style={styles.tagsBlock}>
                      <Text role="labelSmall" style={{ color: colors.muted, marginBottom: 4 }}>
                        {youCopy.battery.heavyDaysLabel}
                      </Text>
                      <View style={styles.chipRow}>
                        {planMyWeek.heavyDays.map((hd, i) => (
                          <Chip key={`hd_${i}`} label={hd} selected={false} />
                        ))}
                      </View>
                    </View>
                  )}

                  {planMyWeek.recoveryWindows && planMyWeek.recoveryWindows.length > 0 && (
                    <View style={styles.tagsBlock}>
                      <Text role="labelSmall" style={{ color: accents.mint.base, marginBottom: 4, fontWeight: '600' }}>
                        {youCopy.battery.recoveryWindowsLabel}
                      </Text>
                      <View style={styles.chipRow}>
                        {planMyWeek.recoveryWindows.map((rw, i) => (
                          <Chip key={`rw_${i}`} label={rw} selected={true} />
                        ))}
                      </View>
                    </View>
                  )}
                </Card>
              </View>
            )}
          </>
        )}
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
  headerTitles: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
  },
  emptyContainer: {
    paddingVertical: 40,
  },
  heatGridCard: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionSubtitle: {
    marginBottom: 14,
  },
  gridContainer: {
    marginTop: 6,
    gap: 6,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  slotLabelHeader: {
    width: 42,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  dayColHeader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 4,
  },
  gridCell: {
    flex: 1,
    minHeight: 40,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightsSection: {
    marginBottom: 20,
  },
  insightCardsList: {
    gap: 12,
  },
  insightCard: {
    padding: 16,
    borderRadius: 16,
  },
  insightHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightTitle: {
    fontWeight: '600',
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  insightTakeaway: {
    lineHeight: 22,
  },
  planCard: {
    padding: 18,
    borderRadius: 18,
    marginBottom: 20,
  },
  tagsBlock: {
    marginTop: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
});
