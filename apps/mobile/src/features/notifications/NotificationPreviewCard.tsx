/**
 * NotificationPreviewCard.tsx — Realistic live preview component of a yikes! notification banner
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { Text } from '../../ui/primitives/Text';

export interface NotificationPreviewCardProps {
  title?: string;
  body: string;
  timestamp?: string;
  badge?: string;
  testID?: string;
}

export function NotificationPreviewCard({
  title = 'yikes!',
  body,
  timestamp = 'Now',
  badge,
  testID = 'notification-preview-card',
}: NotificationPreviewCardProps): React.JSX.Element {
  const { colors, radii, spacing, accents } = useTheme();

  return (
    <View
      testID={testID}
      accessibilityRole="summary"
      accessibilityLabel={`Sample notification: ${title}. ${body}`}
      style={[
        styles.container,
        {
          backgroundColor: colors.surface1,
          borderColor: colors.surface2,
          borderRadius: radii.card ?? 20,
          padding: spacing[4],
        },
      ]}
    >
      {/* Top row: App icon badge, App name, Timestamp */}
      <View style={styles.headerRow}>
        <View style={styles.appIdent}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: accents.honey.tint ?? '#FDE68A' },
            ]}
          >
            <Text role="labelSmall" style={{ fontWeight: '700', color: colors.ink }}>
              y!
            </Text>
          </View>
          <Text role="labelSmall" style={[styles.appName, { color: colors.muted }]}>
            yikes!
          </Text>
          {badge && (
            <View
              style={[
                styles.badgePill,
                { backgroundColor: accents.lilac.tint ?? '#E9D5FF' },
              ]}
            >
              <Text role="labelSmall" style={{ color: colors.ink, fontSize: 10, fontWeight: '600' }}>
                {badge}
              </Text>
            </View>
          )}
        </View>

        <Text role="labelSmall" muted style={styles.timeText}>
          {timestamp}
        </Text>
      </View>

      {/* Title */}
      {title && (
        <Text
          role="bodyMedium"
          style={[styles.titleText, { color: colors.ink }]}
          numberOfLines={1}
        >
          {title}
        </Text>
      )}

      {/* Body text */}
      <Text
        role="bodySmall"
        style={[styles.bodyText, { color: colors.muted }]}
        numberOfLines={3}
      >
        {body}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  appIdent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
    fontSize: 11,
  },
  badgePill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    marginLeft: 4,
  },
  timeText: {
    fontSize: 11,
  },
  titleText: {
    fontWeight: '600',
    marginBottom: 2,
  },
  bodyText: {
    lineHeight: 18,
  },
});
