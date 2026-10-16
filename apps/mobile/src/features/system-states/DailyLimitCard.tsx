import React from 'react';
import {
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { systemCopy } from '../../copy/system';
import { useTheme } from '../../theme/useTheme';
import { Button } from '../../ui/primitives/Button';
import { Card } from '../../ui/primitives/Card';
import { Text } from '../../ui/primitives/Text';

export interface DailyLimitCardProps {
  isPlus?: boolean;
  onSwitchScripted?: () => void;
  onLearnPlus?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function DailyLimitCard({
  isPlus = false,
  onSwitchScripted,
  onLearnPlus,
  style,
  testID = 'daily-limit-card',
}: DailyLimitCardProps): React.JSX.Element {
  const { colors, accents, spacing } = useTheme();

  return (
    <View testID={testID} style={[styles.container, style]}>
      <Card
        tint="honey"
        accessibilityLabel={`${systemCopy.dailyLimit.title}. ${systemCopy.dailyLimit.subtitle}`}
        style={{ padding: spacing[5] }}
      >
        <Text
          role="titleMedium"
          color={accents.honey.pop}
          style={{ fontWeight: '700', marginBottom: spacing[2] }}
        >
          {systemCopy.dailyLimit.title}
        </Text>

        <Text
          role="bodyMedium"
          color={colors.ink}
          style={{ marginBottom: spacing[4], lineHeight: 22 }}
        >
          {systemCopy.dailyLimit.subtitle}
        </Text>

        <View style={styles.actionsContainer}>
          {onSwitchScripted && (
            <Button
              label={systemCopy.dailyLimit.switchScriptedAction}
              variant="primary"
              onPress={onSwitchScripted}
              style={{ marginBottom: spacing[2] }}
            />
          )}

          {!isPlus && onLearnPlus && (
            <Button
              label={systemCopy.dailyLimit.learnPlusAction}
              variant="ghost"
              onPress={onLearnPlus}
            />
          )}
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  actionsContainer: {
    width: '100%',
  },
});
