import React from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Circle, Path as SvgPath } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Screen } from '../../src/ui/primitives/Screen';
import { Text } from '../../src/ui/primitives/Text';
import { Card } from '../../src/ui/primitives/Card';
import { Button } from '../../src/ui/primitives/Button';
import { BottomSheet } from '../../src/ui/components/BottomSheet';
import { EvidenceLine } from '../../src/ui/components/EvidenceLine';
import { Skeleton } from '../../src/ui/components/Skeleton';
import { useTheme } from '../../src/theme/useTheme';
import { usePath, type GrowthStage, type PathNode } from '../../src/features/path/usePath';
import { todayCopy } from '../../src/copy/today';

const NODE_RADIUS = 26;
const ROW_HEIGHT = 88;
const CURVE_OFFSET = 54;

export default function PathScreen(): React.JSX.Element {
  const router = useRouter();
  const { colors, accents, radii, spacing } = useTheme();
  const {
    unit1Nodes,
    unit2Nodes,
    selectedNodeInfo,
    selectedSession,
    isLoading,
    error,
    isOffline,
    selectNode,
    dismissDetail,
    startSelectedSession,
  } = usePath();

  const screenWidth = Dimensions.get('window').width || 380;
  const centerX = screenWidth / 2;

  const triggerHaptic = () => {
    try {
      void Haptics.selectionAsync();
    } catch {
      // Haptics optional
    }
  };

  const getStageColor = (stage: GrowthStage) => {
    switch (stage) {
      case 'starting':
        return accents.honey.base;
      case 'practicing':
        return accents.lilac.base;
      case 'growing':
        return accents.mint.base;
      case 'natural':
        return accents.ember.base;
    }
  };

  // Build curved SVG path connecting nodes
  const buildSvgPath = (nodes: PathNode[]) => {
    if (nodes.length < 2) return '';
    let d = '';
    nodes.forEach((_, idx) => {
      const isLeft = idx % 2 === 0;
      const x = isLeft ? centerX - CURVE_OFFSET : centerX + CURVE_OFFSET;
      const y = idx * ROW_HEIGHT + ROW_HEIGHT / 2;

      if (idx === 0) {
        d += `M ${x} ${y}`;
      } else {
        const prevIsLeft = (idx - 1) % 2 === 0;
        const prevX = prevIsLeft ? centerX - CURVE_OFFSET : centerX + CURVE_OFFSET;
        const prevY = (idx - 1) * ROW_HEIGHT + ROW_HEIGHT / 2;
        const midY = (prevY + y) / 2;
        d += ` C ${prevX} ${midY}, ${x} ${midY}, ${x} ${y}`;
      }
    });
    return d;
  };

  if (isLoading) {
    return (
      <Screen style={styles.container}>
        <View style={styles.loadingContainer}>
          <Skeleton width="40%" height={28} />
          <View style={{ height: 20 }} />
          <Skeleton width="100%" height={300} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: spacing[16] }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Offline Banner if active */}
        {isOffline && (
          <Card tint="honey" style={styles.offlineBanner}>
            <Text role="bodySmall" style={{ color: accents.honey.pop, fontWeight: '600' }}>
              ⚡ {todayCopy.states.offline}
            </Text>
          </Card>
        )}

        {/* Error Banner */}
        {error && (
          <Card tint="neutral" style={styles.errorBanner}>
            <Text role="bodySmall" style={{ color: colors.muted }}>
              {todayCopy.states.error}
            </Text>
          </Card>
        )}

        {/* Header & Mini Gap Trend */}
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <Text role="displayMedium" style={[styles.title, { color: colors.ink }]}>
              {todayCopy.path.title}
            </Text>
            <Text role="bodyMedium" muted>
              {todayCopy.path.subtitle}
            </Text>
          </View>

          {/* Gap trend mini-card */}
          <Pressable
            onPress={() => router.push('/gap' as never)}
            style={[styles.gapMiniCard, { backgroundColor: colors.surface1, borderColor: colors.line }]}
            accessibilityRole="button"
            accessibilityLabel={todayCopy.path.gapTrend}
            accessibilityHint="Opens the Gap screen"
          >
            <View style={styles.gapHeaderRow}>
              <View style={[styles.gapDot, { backgroundColor: accents.mint.base }]} />
              <Text role="labelSmall" style={{ color: accents.mint.pop, fontWeight: '700' }}>
                {todayCopy.path.gapTrend.toUpperCase()}
              </Text>
            </View>
            <Text role="bodySmall" muted numberOfLines={1}>
              {todayCopy.path.gapTrendSubtitle}
            </Text>
          </Pressable>
        </View>

        {/* UNIT 1: FOUNDATIONS */}
        <View style={styles.unitSection}>
          <Text role="titleMedium" style={[styles.unitTitle, { color: colors.ink }]}>
            {todayCopy.path.unit1Title}
          </Text>

          <View style={[styles.nodesCanvas, { height: unit1Nodes.length * ROW_HEIGHT }]}>
            <Svg style={StyleSheet.absoluteFill}>
              <SvgPath
                d={buildSvgPath(unit1Nodes)}
                stroke={colors.surface2}
                strokeWidth={3}
                fill="none"
                strokeDasharray="6 4"
              />
            </Svg>

            {unit1Nodes.map((node, idx) => {
              const isLeft = idx % 2 === 0;
              const x = isLeft ? centerX - CURVE_OFFSET : centerX + CURVE_OFFSET;
              const y = idx * ROW_HEIGHT + ROW_HEIGHT / 2;
              const stageColor = getStageColor(node.stage);

              return (
                <View
                  key={node.session.id}
                  style={[
                    styles.nodePositioner,
                    { left: x - NODE_RADIUS - 6, top: y - NODE_RADIUS - 6 },
                  ]}
                >
                  <Pressable
                    onPress={() => {
                      triggerHaptic();
                      selectNode(node);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`${node.session.title}, ${node.stage} stage, ${
                      node.isLocked ? 'locked' : 'unlocked'
                    }`}
                    style={[
                      styles.nodeTouchTarget,
                      node.isLocked && styles.dimmedNode,
                    ]}
                  >
                    <Svg width={NODE_RADIUS * 2 + 12} height={NODE_RADIUS * 2 + 12}>
                      {/* Outer growth stage ring */}
                      <Circle
                        cx={NODE_RADIUS + 6}
                        cy={NODE_RADIUS + 6}
                        r={NODE_RADIUS + 2}
                        stroke={stageColor}
                        strokeWidth={node.isNext ? 4 : 2}
                        fill="none"
                        opacity={node.isLocked ? 0.35 : 0.9}
                      />
                      {/* Inner glass node */}
                      <Circle
                        cx={NODE_RADIUS + 6}
                        cy={NODE_RADIUS + 6}
                        r={NODE_RADIUS - 3}
                        fill={node.isCompleted ? accents.mint.tint : colors.surface1}
                      />
                    </Svg>

                    <View style={styles.nodeCenterContent} pointerEvents="none">
                      <Text
                        role="labelMedium"
                        style={{
                          color: node.isCompleted ? accents.mint.pop : colors.ink,
                          fontWeight: '700',
                        }}
                      >
                        {node.isCompleted ? '✓' : `${node.session.sessionNumber}`}
                      </Text>
                    </View>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>

        {/* UNIT 2: EXPANDING HORIZONS */}
        <View style={styles.unitSection}>
          <Text role="titleMedium" style={[styles.unitTitle, { color: colors.ink }]}>
            {todayCopy.path.unit2Title}
          </Text>

          <View style={[styles.nodesCanvas, { height: unit2Nodes.length * ROW_HEIGHT }]}>
            <Svg style={StyleSheet.absoluteFill}>
              <SvgPath
                d={buildSvgPath(unit2Nodes)}
                stroke={colors.surface2}
                strokeWidth={3}
                fill="none"
                strokeDasharray="6 4"
              />
            </Svg>

            {unit2Nodes.map((node, idx) => {
              const isLeft = idx % 2 === 0;
              const x = isLeft ? centerX - CURVE_OFFSET : centerX + CURVE_OFFSET;
              const y = idx * ROW_HEIGHT + ROW_HEIGHT / 2;
              const stageColor = getStageColor(node.stage);

              return (
                <View
                  key={node.session.id}
                  style={[
                    styles.nodePositioner,
                    { left: x - NODE_RADIUS - 6, top: y - NODE_RADIUS - 6 },
                  ]}
                >
                  <Pressable
                    onPress={() => {
                      triggerHaptic();
                      selectNode(node);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`${node.session.title}, ${node.stage} stage, ${
                      node.isLocked ? 'locked' : 'unlocked'
                    }`}
                    style={[
                      styles.nodeTouchTarget,
                      node.isLocked && styles.dimmedNode,
                    ]}
                  >
                    <Svg width={NODE_RADIUS * 2 + 12} height={NODE_RADIUS * 2 + 12}>
                      <Circle
                        cx={NODE_RADIUS + 6}
                        cy={NODE_RADIUS + 6}
                        r={NODE_RADIUS + 2}
                        stroke={stageColor}
                        strokeWidth={node.isNext ? 4 : 2}
                        fill="none"
                        opacity={node.isLocked ? 0.35 : 0.9}
                      />
                      <Circle
                        cx={NODE_RADIUS + 6}
                        cy={NODE_RADIUS + 6}
                        r={NODE_RADIUS - 3}
                        fill={node.isCompleted ? accents.mint.tint : colors.surface1}
                      />
                    </Svg>

                    <View style={styles.nodeCenterContent} pointerEvents="none">
                      <Text
                        role="labelMedium"
                        style={{
                          color: node.isCompleted ? accents.mint.pop : colors.ink,
                          fontWeight: '700',
                        }}
                      >
                        {node.isCompleted ? '✓' : `${node.session.sessionNumber}`}
                      </Text>
                    </View>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Session Node Bottom Sheet Inspector */}
      <BottomSheet
        visible={selectedSession !== null}
        onDismiss={dismissDetail}
        title={selectedNodeInfo?.session.title ?? ''}
      >
        {selectedNodeInfo && (
          <View style={styles.sheetBody}>
            <View style={styles.sheetBadgeRow}>
              <View
                style={[
                  styles.stagePill,
                  { backgroundColor: colors.surface2, borderRadius: radii.pill },
                ]}
              >
                <Text role="labelSmall" style={{ color: getStageColor(selectedNodeInfo.stage) }}>
                  ● {todayCopy.path.bottomSheet.skillStage(selectedNodeInfo.stage)}
                </Text>
              </View>

              {selectedNodeInfo.isLocked && (
                <Text role="labelSmall" muted>
                  {todayCopy.path.bottomSheet.lockedNote}
                </Text>
              )}
            </View>

            <Text role="titleLarge" style={[styles.sheetSkillName, { color: colors.ink }]}>
              {selectedNodeInfo.session.skillName}
            </Text>

            <Text role="bodyMedium" muted style={styles.sheetIdeaRule}>
              {selectedNodeInfo.session.idea.rule}
            </Text>

            {/* Evidence Line if present */}
            {selectedNodeInfo.evidenceQuote && (
              <View style={styles.sheetEvidenceSection}>
                <Text role="labelSmall" muted style={{ marginBottom: 4 }}>
                  {todayCopy.path.bottomSheet.evidenceHeader}
                </Text>
                <EvidenceLine
                  quote={selectedNodeInfo.evidenceQuote}
                  contextNote={selectedNodeInfo.contextNote ?? ''}
                  tilted={false}
                  triggerSwipe={false}
                />
              </View>
            )}

            <View style={styles.sheetActions}>
              <Button
                variant="primary"
                label={
                  selectedNodeInfo.isLocked
                    ? todayCopy.path.bottomSheet.tryAhead
                    : todayCopy.path.bottomSheet.startSession
                }
                onPress={() => startSelectedSession(selectedNodeInfo.session.id)}
                accessibilityLabel={
                  selectedNodeInfo.isLocked
                    ? `${todayCopy.path.bottomSheet.tryAhead} ${selectedNodeInfo.session.title}`
                    : `${todayCopy.path.bottomSheet.startSession} ${selectedNodeInfo.session.title}`
                }
                style={{ width: '100%' }}
              />
            </View>
          </View>
        )}
      </BottomSheet>
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
  },
  loadingContainer: {
    padding: 24,
    gap: 16,
  },
  offlineBanner: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  errorBanner: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  header: {
    marginBottom: 20,
    gap: 12,
  },
  headerTitleContainer: {
    gap: 4,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
  },
  gapMiniCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
    alignSelf: 'flex-start',
    minWidth: 200,
  },
  gapHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gapDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  unitSection: {
    marginBottom: 28,
  },
  unitTitle: {
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  nodesCanvas: {
    position: 'relative',
    width: '100%',
  },
  nodePositioner: {
    position: 'absolute',
    width: NODE_RADIUS * 2 + 12,
    height: NODE_RADIUS * 2 + 12,
  },
  nodeTouchTarget: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
    minHeight: 48,
  },
  dimmedNode: {
    opacity: 0.45,
  },
  nodeCenterContent: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetBody: {
    gap: 12,
    paddingVertical: 8,
  },
  sheetBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  stagePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  sheetSkillName: {
    fontSize: 22,
    lineHeight: 28,
  },
  sheetIdeaRule: {
    lineHeight: 20,
  },
  sheetEvidenceSection: {
    marginVertical: 4,
  },
  sheetActions: {
    marginTop: 12,
  },
});
