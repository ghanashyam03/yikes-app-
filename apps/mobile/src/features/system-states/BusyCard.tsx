import React, { useEffect, useState } from 'react';
import {
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { systemCopy } from '../../copy/system';
import { useTheme } from '../../theme/useTheme';
import { Button } from '../../ui/primitives/Button';
import { Card } from '../../ui/primitives/Card';
import { Text } from '../../ui/primitives/Text';
import { TypingDots } from '../../ui/components/TypingDots';

export interface BusyCardProps {
  partnerName?: string;
  timeoutMs?: number;
  onRetryBackup?: () => void;
  onSwitchScripted?: () => void;
  onWait?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function BusyCard({
  partnerName = 'Maya',
  timeoutMs = 8000,
  onRetryBackup,
  onSwitchScripted,
  onWait,
  style,
  testID = 'busy-card',
}: BusyCardProps): React.JSX.Element {
  const { colors, accents, spacing, radii, reducedMotion } = useTheme();
  const [timedOut, setTimedOut] = useState(false);

  // Shimmer animation
  const shimmerTranslate = useSharedValue(-100);

  useEffect(() => {
    if (!reducedMotion) {
      shimmerTranslate.value = withRepeat(
        withTiming(200, { duration: 1600, easing: Easing.linear }),
        -1,
        false
      );
    }
  }, [reducedMotion, shimmerTranslate]);

  const shimmerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: shimmerTranslate.value }],
    };
  });

  useEffect(() => {
    if (timeoutMs <= 0) {
      setTimedOut(true);
      return undefined;
    }
    const timer = setTimeout(() => {
      setTimedOut(true);
    }, timeoutMs);

    return () => clearTimeout(timer);
  }, [timeoutMs]);

  const titleText =
    partnerName === 'Maya'
      ? systemCopy.busy.title
      : `${partnerName} is taking a moment`;

  return (
    <View testID={testID} style={[styles.container, style]}>
      <Card
        tint="neutral"
        accessibilityLabel={
          timedOut
            ? `${titleText}. ${systemCopy.busy.fallbackMessage}`
            : `${titleText}. ${systemCopy.busy.subtitle}`
        }
        style={{ padding: spacing[5] }}
      >
        <View style={styles.headerRow}>
          <Text role="titleMedium" color={colors.ink} style={{ fontWeight: '700' }}>
            {titleText}
          </Text>
          <TypingDots />
        </View>

        <Text
          role="bodyMedium"
          color={colors.muted}
          style={{ marginTop: spacing[2], marginBottom: spacing[4] }}
        >
          {timedOut ? systemCopy.busy.fallbackMessage : systemCopy.busy.subtitle}
        </Text>

        {/* Shimmer progress bar */}
        <View
          style={[
            styles.shimmerTrack,
            {
              backgroundColor: colors.surface2,
              borderColor: colors.line,
              borderRadius: radii.pill,
              marginBottom: spacing[4],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.shimmerHighlight,
              { backgroundColor: accents.honey.tint },
              shimmerStyle,
            ]}
          />
        </View>

        {timedOut && (
          <View style={styles.actionsContainer} testID="busy-card-fallback-actions">
            {onRetryBackup && (
              <Button
                label={systemCopy.busy.retryBackupAction}
                variant="primary"
                onPress={onRetryBackup}
                style={{ marginBottom: spacing[2] }}
              />
            )}

            {onSwitchScripted && (
              <Button
                label={systemCopy.busy.switchScriptedAction}
                variant="secondary"
                onPress={onSwitchScripted}
                style={{ marginBottom: spacing[2] }}
              />
            )}

            {onWait && (
              <Button
                label={systemCopy.busy.waitAction}
                variant="ghost"
                onPress={onWait}
              />
            )}
          </View>
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shimmerTrack: {
    height: 6,
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 0.5,
  },
  shimmerHighlight: {
    width: '40%',
    height: '100%',
    opacity: 0.8,
  },
  actionsContainer: {
    width: '100%',
  },
});
