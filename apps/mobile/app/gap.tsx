import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import Svg, { Circle, Line, Path, Polygon } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { youCopy } from '../src/copy/you';
import { computeWeeklyTrend } from '../src/features/checkin/computeGap';
import type { CheckinSubmission } from '../src/features/checkin/types';
import { useCheckin } from '../src/features/checkin/useCheckin';
import { useTheme } from '../src/theme/useTheme';
import { EmptyState } from '../src/ui/components/EmptyState';
import { Card } from '../src/ui/primitives/Card';
import { Screen } from '../src/ui/primitives/Screen';
import { Text } from '../src/ui/primitives/Text';

export default function GapScreen(): React.JSX.Element {
  const router = useRouter();
  const { colors, accents } = useTheme();
  const { width } = useWindowDimensions();
  const { submissions } = useCheckin();

  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/you');
    }
  };

  const gaps = (submissions || []).map((s) => {
    const diff = s.forecastDrain - s.actualDrain;
    return {
      drainingGap: diff,
      absoluteDrainingGap: Math.abs(diff),
    };
  });
  const trendResult = computeWeeklyTrend(gaps);

  const trendCaption =
    trendResult.trendDirection === 'closing'
      ? youCopy.gap.trendClosing
      : trendResult.trendDirection === 'widening'
      ? youCopy.gap.trendWidening
      : youCopy.gap.trendStable;

  const chartWidth = Math.min(width - 40, 360);
  const chartHeight = 200;
  const paddingX = 24;
  const paddingY = 24;
  const plotWidth = chartWidth - paddingX * 2;
  const plotHeight = chartHeight - paddingY * 2;

  // Render SVG Line Chart
  const renderChart = () => {
    if (submissions.length === 0) return null;

    // Submissions in chronological order for chart display
    const chronPoints = [...submissions].reverse();

    const coords = chronPoints.map((s, i) => {
      const x =
        chronPoints.length === 1
          ? paddingX + plotWidth / 2
          : paddingX + (i / (chronPoints.length - 1)) * plotWidth;

      // Drain is 0-10, invert Y so 10 is at top
      const yForecast = paddingY + plotHeight - (s.forecastDrain / 10) * plotHeight;
      const yActual = paddingY + plotHeight - (s.actualDrain / 10) * plotHeight;

      return { x, yForecast, yActual, submission: s };
    });

    const firstCoord = coords[0];
    if (!firstCoord) return null;

    // Build forecast line path
    let forecastPath = `M ${firstCoord.x} ${firstCoord.yForecast}`;
    for (let i = 1; i < coords.length; i++) {
      const pt = coords[i];
      if (pt) forecastPath += ` L ${pt.x} ${pt.yForecast}`;
    }

    // Build actual line path
    let actualPath = `M ${firstCoord.x} ${firstCoord.yActual}`;
    for (let i = 1; i < coords.length; i++) {
      const pt = coords[i];
      if (pt) actualPath += ` L ${pt.x} ${pt.yActual}`;
    }

    // Build shaded polygon between forecast and actual
    // Forward along forecast, then backward along actual
    const forwardPoints = coords.map((c) => `${c.x},${c.yForecast}`).join(' ');
    const backwardPoints = [...coords].reverse().map((c) => `${c.x},${c.yActual}`).join(' ');
    const polygonPoints = `${forwardPoints} ${backwardPoints}`;

    return (
      <View
        style={styles.chartWrapper}
        testID="gap-chart-container"
        accessible={true}
        accessibilityRole="image"
        accessibilityLabel={youCopy.gap.chartA11y(
          submissions.length,
          trendResult.trendDirection
        )}
      >
        <Svg width={chartWidth} height={chartHeight} style={styles.svg}>
          {/* Background grid lines */}
          <Line
            x1={paddingX}
            y1={paddingY}
            x2={chartWidth - paddingX}
            y2={paddingY}
            stroke={colors.line}
            strokeDasharray="4 4"
            strokeWidth={1}
          />
          <Line
            x1={paddingX}
            y1={paddingY + plotHeight / 2}
            x2={chartWidth - paddingX}
            y2={paddingY + plotHeight / 2}
            stroke={colors.line}
            strokeDasharray="4 4"
            strokeWidth={1}
          />
          <Line
            x1={paddingX}
            y1={paddingY + plotHeight}
            x2={chartWidth - paddingX}
            y2={paddingY + plotHeight}
            stroke={colors.line}
            strokeWidth={1}
          />

          {/* Shaded Area between Forecast and Actual */}
          {coords.length > 1 && (
            <Polygon
              points={polygonPoints}
              fill={accents.honey.tint}
              fillOpacity={0.45}
            />
          )}

          {/* Forecast Path (Sky accent) */}
          {coords.length > 1 && (
            <Path
              d={forecastPath}
              stroke={accents.sky.base}
              strokeWidth={2.5}
              fill="none"
            />
          )}

          {/* Actual Path (Mint accent) */}
          {coords.length > 1 && (
            <Path
              d={actualPath}
              stroke={accents.mint.base}
              strokeWidth={2.5}
              fill="none"
            />
          )}

          {/* Data Points */}
          {coords.map((c, i) => (
            <React.Fragment key={`point_${i}`}>
              {/* Forecast Point */}
              <Circle
                cx={c.x}
                cy={c.yForecast}
                r={selectedPointIndex === i ? 6 : 4}
                fill={accents.sky.base}
              />
              {/* Actual Point */}
              <Circle
                cx={c.x}
                cy={c.yActual}
                r={selectedPointIndex === i ? 6 : 4}
                fill={accents.mint.base}
              />
            </React.Fragment>
          ))}
        </Svg>

        {/* Clickable Tap Overlay for each data point */}
        <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
          {coords.map((c, i) => (
            <Pressable
              key={`tap_target_${i}`}
              testID={`gap-point-${i}`}
              accessibilityRole="button"
              accessibilityLabel={`Check-in ${i + 1}: expected ${c.submission.forecastDrain}, actual ${c.submission.actualDrain}`}
              onPress={() => setSelectedPointIndex(i)}
              style={[
                styles.touchTarget,
                {
                  left: c.x - 24,
                  top: Math.min(c.yForecast, c.yActual) - 10,
                  height: Math.abs(c.yForecast - c.yActual) + 30,
                },
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

  const selectedSubmission: CheckinSubmission | null =
    selectedPointIndex !== null && submissions[selectedPointIndex]
      ? submissions[selectedPointIndex]
      : null;

  return (
    <Screen style={styles.screen}>
      <ScrollView
        testID="gap-screen-scroll"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            testID="gap-back-button"
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
              {youCopy.gap.title}
            </Text>
            <Text role="bodySmall" style={{ color: colors.muted }}>
              {youCopy.gap.subtitle}
            </Text>
          </View>
        </View>

        {/* Empty State */}
        {submissions.length === 0 ? (
          <View style={styles.emptyContainer} testID="gap-empty-state">
            <EmptyState
              pose="thinking"
              title={youCopy.gap.title}
              description={youCopy.gap.emptyState}
              actionLabel={youCopy.gap.emptyAction}
              onAction={() => router.push('/ladder')}
            />
          </View>
        ) : (
          <>
            {/* Chart Card */}
            <Card style={styles.chartCard}>
              <View style={styles.captionContainer}>
                <Text role="titleSmall" style={[styles.captionText, { color: colors.ink }]}>
                  {youCopy.gap.caption}
                </Text>
                <Text role="bodySmall" style={[styles.trendHelper, { color: colors.muted }]}>
                  {trendCaption}
                </Text>
              </View>

              {renderChart()}

              {/* Legend */}
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: accents.sky.base }]} />
                  <Text role="labelSmall" style={{ color: colors.muted }}>
                    {youCopy.gap.forecastLegend}
                  </Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: accents.mint.base }]} />
                  <Text role="labelSmall" style={{ color: colors.muted }}>
                    {youCopy.gap.actualLegend}
                  </Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendShade, { backgroundColor: accents.honey.tint }]} />
                  <Text role="labelSmall" style={{ color: colors.muted }}>
                    Shaded Gap
                  </Text>
                </View>
              </View>
            </Card>

            {/* Selected Check-in Detail Card */}
            {selectedSubmission && (
              <View testID="selected-checkin-card">
                <Card style={styles.detailCard}>
                  <Text role="titleSmall" style={{ color: colors.ink, marginBottom: 8 }}>
                    {youCopy.gap.checkinDetailTitle}
                  </Text>
                  <View style={styles.detailStatsRow}>
                    <Text role="bodyMedium" style={{ color: accents.sky.base }}>
                      {youCopy.gap.forecastVal(selectedSubmission.forecastDrain)}
                    </Text>
                    <Text role="bodyMedium" style={{ color: accents.mint.base }}>
                      {youCopy.gap.actualVal(selectedSubmission.actualDrain)}
                    </Text>
                  </View>
                  <Text role="bodySmall" style={{ color: colors.muted, marginTop: 8 }}>
                    Outcome: {selectedSubmission.outcome || 'Completed'} • Landed: {selectedSubmission.landed ? 'Yes' : 'No'}
                  </Text>
                </Card>
              </View>
            )}

            {/* Explanatory Caption Card */}
            <Card style={styles.infoCard}>
              <Text role="bodySmall" style={{ color: colors.muted }}>
                ℹ️ The Gap reflects the difference between what your nervous system expected and what conversation actually cost. Over time, introverts find their forecasts drawing closer to reality.
              </Text>
            </Card>
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
  chartCard: {
    padding: 18,
    borderRadius: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  captionContainer: {
    width: '100%',
    marginBottom: 16,
  },
  captionText: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 4,
  },
  trendHelper: {
    lineHeight: 18,
  },
  chartWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  svg: {
    overflow: 'visible',
  },
  touchTarget: {
    position: 'absolute',
    width: 48,
    minHeight: 48,
    zIndex: 10,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendShade: {
    width: 12,
    height: 10,
    borderRadius: 2,
  },
  detailCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  detailStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoCard: {
    padding: 14,
    borderRadius: 14,
  },
});
