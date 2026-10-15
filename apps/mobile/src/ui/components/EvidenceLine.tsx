import React, { useEffect } from 'react';
import {
  StyleProp,
  StyleSheet,
  View,
  ViewStyle
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';
import { useTheme } from '../../theme/useTheme';
import { Text } from '../primitives/Text';
import { componentsCopy } from '../../copy/components';

export interface EvidenceLineProps {
  quote: string;
  contextNote?: string;
  tilted?: boolean;
  tiltAngle?: number; // default 1.5 deg
  triggerSwipe?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function EvidenceLine({
  quote,
  contextNote,
  tilted = true,
  tiltAngle = 1.5,
  triggerSwipe = true,
  accessibilityLabel,
  style,
  testID = 'evidence-line'
}: EvidenceLineProps): React.JSX.Element {
  const { accents, colors, radii, motion, reducedMotion } = useTheme();

  // Highlighter swipe width (0% to 100%)
  const swipeProgress = useSharedValue(reducedMotion ? 1 : 0);

  useEffect(() => {
    if (reducedMotion) {
      swipeProgress.value = 1;
      return;
    }

    if (triggerSwipe) {
      swipeProgress.value = 0;
      swipeProgress.value = withTiming(1, { duration: motion.durations.reveal });
    }
  }, [triggerSwipe, reducedMotion, motion.durations.reveal, swipeProgress]);

  const animatedHighlighterStyle = useAnimatedStyle(() => ({
    width: `${swipeProgress.value * 100}%`
  }));

  const fullText = contextNote ? `${quote} — ${contextNote}` : quote;
  const a11yLabel =
    accessibilityLabel ?? componentsCopy.evidenceLine.accessibilityLabel(fullText);

  return (
    <View
      testID={testID}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={a11yLabel}
      style={[
        styles.stickerCard,
        {
          backgroundColor: colors.surface1,
          borderRadius: radii.card,
          borderColor: colors.line,
          transform: tilted ? [{ rotate: `${tiltAngle}deg` }] : []
        },
        style
      ]}
    >
      {/* 1px top-left glossy inner highlight */}
      <View
        style={[
          styles.innerHighlight,
          { borderRadius: radii.card }
        ]}
      />

      {/* Quote line with highlighter behind quote text */}
      <View style={styles.quoteRow}>
        {/* Animated Mint Highlighter Swipe */}
        <Animated.View
          testID={`${testID}-highlighter`}
          style={[
            styles.mintHighlighter,
            {
              backgroundColor: accents.mint.tint,
              borderRadius: radii.pill
            },
            animatedHighlighterStyle
          ]}
        />

        <Text role="titleMedium" style={[styles.quoteText, { color: colors.ink }]}>
          {quote}
        </Text>
      </View>

      {/* Optional Context note */}
      {contextNote && (
        <View style={styles.contextContainer}>
          <View style={[styles.thinMintRule, { backgroundColor: accents.mint.pop }]} />
          <Text role="bodyMedium" style={{ color: colors.muted }}>
            {contextNote}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stickerCard: {
    padding: 18,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
    position: 'relative',
    marginVertical: 8
  },
  innerHighlight: {
    ...StyleSheet.absoluteFillObject,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    pointerEvents: 'none'
  },
  quoteRow: {
    position: 'relative',
    alignSelf: 'flex-start',
    paddingHorizontal: 4,
    paddingVertical: 2
  },
  mintHighlighter: {
    position: 'absolute',
    left: 0,
    bottom: 2,
    height: '65%',
    opacity: 0.75
  },
  quoteText: {
    fontStyle: 'italic',
    zIndex: 1
  },
  contextContainer: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  thinMintRule: {
    width: 3,
    height: 18,
    borderRadius: 2
  }
});
