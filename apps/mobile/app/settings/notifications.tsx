/**
 * notifications.tsx — Settings Screen D2: Notification Preferences
 * 
 * PRODUCT RULES:
 * - Toggle per notification type with live sample preview.
 * - Quiet-hours slider with "Max one a day" note.
 * - "Pause everything for a week" button.
 * - Toggles actually cancel scheduled items.
 * - Zero guilt copy, zero clinical words, never red.
 */

import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { NOTIFICATIONS_COPY } from '../../src/copy/notifications';
import { NotificationPermissionModal } from '../../src/features/notifications/NotificationPermissionModal';
import { NotificationPreviewCard } from '../../src/features/notifications/NotificationPreviewCard';
import { useNotificationsStore } from '../../src/features/notifications/notificationsStore';
import type { NotificationType } from '../../src/features/notifications/types';
import { useNotificationPermission } from '../../src/features/notifications/useNotificationPermission';
import { useTheme } from '../../src/theme/useTheme';
import { BackIcon } from '../../src/ui/icons/BackIcon';
import { Button } from '../../src/ui/primitives/Button';
import { Card } from '../../src/ui/primitives/Card';
import { Screen } from '../../src/ui/primitives/Screen';
import { Text } from '../../src/ui/primitives/Text';

type ToggleableNotificationType = keyof typeof NOTIFICATIONS_COPY.types;

const NOTIFICATION_TYPES_LIST: ToggleableNotificationType[] = [
  'rhythm_nudge',
  'moment_prompt',
  'checkin_nudge',
  'review_due',
  'weekly_letter',
];

export default function SettingsNotificationsScreen(): React.JSX.Element {
  const router = useRouter();
  const { colors, accents, spacing, radii } = useTheme();

  const toggles = useNotificationsStore((state) => state.toggles);
  const quietHours = useNotificationsStore((state) => state.quietHours);
  const pausedUntil = useNotificationsStore((state) => state.pausedUntil);
  const setToggle = useNotificationsStore((state) => state.setToggle);
  const setQuietHours = useNotificationsStore((state) => state.setQuietHours);
  const pauseForAWeek = useNotificationsStore((state) => state.pauseForAWeek);
  const unpause = useNotificationsStore((state) => state.unpause);

  const {
    permissionStatus,
    showPreviewModal,
    requestPermissionWithPreview,
    confirmPermission,
    dismissPreview,
  } = useNotificationPermission();

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const copy = NOTIFICATIONS_COPY.screen;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const isPaused = Boolean(pausedUntil && new Date(pausedUntil).getTime() > Date.now());

  const formattedPausedUntil = pausedUntil
    ? new Date(pausedUntil).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : '';

  const handlePauseToggle = async () => {
    if (isPaused) {
      await unpause();
      showToast(copy.resumeSuccessToast);
    } else {
      await pauseForAWeek();
      showToast(copy.pauseWeekSuccessToast);
    }
  };

  const handleToggleChange = async (type: NotificationType, value: boolean) => {
    if (value && permissionStatus !== 'granted') {
      await requestPermissionWithPreview();
    }
    await setToggle(type, value);
  };

  const handleQuietHoursPreset = (start: string, end: string) => {
    setQuietHours({ start, end });
  };

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { padding: spacing[6] }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Navigation Bar */}
        <View style={styles.navRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <BackIcon size={24} color={colors.ink} />
          </Pressable>
          <Text role="titleMedium" style={{ color: colors.ink }}>
            {copy.title}
          </Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Toast Alert */}
        {toastMessage && (
          <View
            accessibilityRole="alert"
            style={[
              styles.toast,
              {
                backgroundColor: accents.honey.tint,
                borderColor: accents.honey.pop,
                borderRadius: radii.card ?? 16,
              },
            ]}
          >
            <Text role="bodySmall" style={{ color: colors.ink, fontWeight: '600' }}>
              {toastMessage}
            </Text>
          </View>
        )}

        {/* Max One A Day Note Card */}
        <Card
          tint="honey"
          style={styles.maxOneCard}
          accessibilityLabel={`${copy.maxOneADayBadge}: ${copy.maxOneADayNote}`}
        >
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.badgePill,
                { backgroundColor: accents.honey.pop, borderRadius: radii.pill ?? 999 },
              ]}
            >
              <Text role="labelSmall" style={{ color: '#1E1B18', fontWeight: '700' }}>
                {copy.maxOneADayBadge}
              </Text>
            </View>
          </View>
          <Text role="bodyMedium" style={{ color: colors.ink, marginTop: 4 }}>
            {copy.maxOneADayNote}
          </Text>
        </Card>

        {/* Pause Everything For A Week */}
        <Card style={styles.sectionCard}>
          <Text role="titleSmall" style={{ color: colors.ink, marginBottom: 4 }}>
            {isPaused ? copy.pauseWeekActive(formattedPausedUntil) : copy.pauseWeekButton}
          </Text>
          <Text role="bodySmall" muted style={{ marginBottom: 16 }}>
            {isPaused
              ? 'All notifications are currently muted. You will receive zero notifications until this period ends.'
              : 'Taking time off? Mute all notifications for seven days in one tap.'}
          </Text>
          <Button
            variant={isPaused ? 'secondary' : 'ghost'}
            label={isPaused ? copy.resumeButton : copy.pauseWeekButton}
            onPress={handlePauseToggle}
            accessibilityLabel={isPaused ? copy.resumeButton : copy.pauseWeekButton}
          />
        </Card>

        {/* Quiet Hours Section */}
        <Card style={styles.sectionCard}>
          <Text role="titleSmall" style={{ color: colors.ink, marginBottom: 2 }}>
            {copy.quietHoursTitle}
          </Text>
          <Text role="bodySmall" muted style={{ marginBottom: 12 }}>
            {copy.quietHoursSubtitle} Currently: {quietHours.start} – {quietHours.end}
          </Text>

          {/* Quiet Hours Preset Sliders / Selector */}
          <View style={styles.presetRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Standard quiet hours: 22:00 to 08:00"
              onPress={() => handleQuietHoursPreset('22:00', '08:00')}
              style={[
                styles.presetChip,
                {
                  backgroundColor:
                    quietHours.start === '22:00' && quietHours.end === '08:00'
                      ? accents.honey.tint
                      : colors.surface2,
                  borderRadius: radii.pill ?? 999,
                },
              ]}
            >
              <Text role="labelSmall" style={{ fontWeight: '600', color: colors.ink }}>
                22:00 – 08:00
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Early bird quiet hours: 21:00 to 07:00"
              onPress={() => handleQuietHoursPreset('21:00', '07:00')}
              style={[
                styles.presetChip,
                {
                  backgroundColor:
                    quietHours.start === '21:00' && quietHours.end === '07:00'
                      ? accents.honey.tint
                      : colors.surface2,
                  borderRadius: radii.pill ?? 999,
                },
              ]}
            >
              <Text role="labelSmall" style={{ fontWeight: '600', color: colors.ink }}>
                21:00 – 07:00
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Night owl quiet hours: 23:00 to 09:00"
              onPress={() => handleQuietHoursPreset('23:00', '09:00')}
              style={[
                styles.presetChip,
                {
                  backgroundColor:
                    quietHours.start === '23:00' && quietHours.end === '09:00'
                      ? accents.honey.tint
                      : colors.surface2,
                  borderRadius: radii.pill ?? 999,
                },
              ]}
            >
              <Text role="labelSmall" style={{ fontWeight: '600', color: colors.ink }}>
                23:00 – 09:00
              </Text>
            </Pressable>
          </View>
        </Card>

        {/* Per-Type Toggles & Live Previews */}
        <Text role="titleSmall" style={[styles.typesHeader, { color: colors.ink }]}>
          Notification categories
        </Text>

        {NOTIFICATION_TYPES_LIST.map((type) => {
          const typeMeta = NOTIFICATIONS_COPY.types[type];
          const isEnabled = toggles[type] ?? true;

          return (
            <Card key={type} style={styles.toggleCard}>
              <View style={styles.toggleHeader}>
                <View style={styles.toggleTextCol}>
                  <Text role="titleMedium" style={{ color: colors.ink, fontWeight: '600' }}>
                    {typeMeta.name}
                  </Text>
                  <Text role="bodySmall" muted style={{ marginTop: 2 }}>
                    {typeMeta.description}
                  </Text>
                </View>
                <Switch
                  value={isEnabled}
                  onValueChange={(val) => handleToggleChange(type, val)}
                  accessibilityRole="switch"
                  accessibilityLabel={`${typeMeta.name} toggle`}
                  accessibilityState={{ checked: isEnabled }}
                  trackColor={{ false: colors.surface2, true: accents.mint.tint }}
                  thumbColor={isEnabled ? accents.mint.pop : colors.muted}
                />
              </View>

              {/* Live sample preview */}
              <View style={styles.previewBox}>
                <Text role="labelSmall" muted style={styles.previewLabel}>
                  {copy.previewHeader}
                </Text>
                <View style={{ opacity: isEnabled ? 1 : 0.45 }}>
                  <NotificationPreviewCard
                    title={type === 'rhythm_nudge' ? 'yikes!' : typeMeta.name}
                    body={typeMeta.samplePreview}
                    timestamp="Sample"
                    badge={isEnabled ? copy.toggleOn : copy.toggleOff}
                  />
                </View>
              </View>
            </Card>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* JIT Permission preview modal */}
      <NotificationPermissionModal
        visible={showPreviewModal}
        onAllow={confirmPermission}
        onDismiss={dismissPreview}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 40,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toast: {
    padding: 12,
    borderWidth: 1,
    marginBottom: 16,
    alignItems: 'center',
  },
  maxOneCard: {
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  sectionCard: {
    marginBottom: 16,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typesHeader: {
    marginTop: 8,
    marginBottom: 12,
  },
  toggleCard: {
    marginBottom: 14,
  },
  toggleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  toggleTextCol: {
    flex: 1,
  },
  previewBox: {
    marginTop: 12,
  },
  previewLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontWeight: '600',
    marginBottom: 4,
  },
});
