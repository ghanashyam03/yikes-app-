import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { momentsCopy } from '../../src/copy/moments';
import { useSession } from '../../src/features/auth/useSession';
import {
  convertEventsToMoments,
  fetchCandidateEvents,
  requestCalendarPermission,
} from '../../src/features/moments/calendarSync';
import type { CalendarEvent, MomentType } from '../../src/features/moments/types';
import { useMoments } from '../../src/features/moments/useMoments';
import { useTheme } from '../../src/theme/useTheme';
import { NoDefaultSlider } from '../../src/ui/components/NoDefaultSlider';
import { Button } from '../../src/ui/primitives/Button';
import { Card } from '../../src/ui/primitives/Card';
import { Chip } from '../../src/ui/primitives/Chip';
import { Screen } from '../../src/ui/primitives/Screen';
import { Text } from '../../src/ui/primitives/Text';

export default function MomentsNewScreen(): React.JSX.Element {
  const router = useRouter();
  const { colors, accents } = useTheme();
  const { session } = useSession();
  const userId = session?.user?.id;
  const { addMoment } = useMoments();

  // Form states
  const [selectedType, setSelectedType] = useState<MomentType>('meeting');
  const [title, setTitle] = useState<string>('');
  const [attendees, setAttendees] = useState<string>('');
  const [eventDate, setEventDate] = useState<string>(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] ?? ''
  );
  const [formality, setFormality] = useState<number | null>(5);
  const [successVision, setSuccessVision] = useState<string>('');
  const [remindEveningBefore, setRemindEveningBefore] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Calendar sync modal states
  const [calendarModalVisible, setCalendarModalVisible] = useState<boolean>(false);
  const [candidateEvents, setCandidateEvents] = useState<CalendarEvent[]>([]);

  async function handleOpenCalendarSync(): Promise<void> {
    setCalendarModalVisible(true);
    const granted = await requestCalendarPermission();
    if (granted) {
      const events = await fetchCandidateEvents();
      setCandidateEvents(events);
    }
  }

  function handleToggleCalendarEvent(id: string): void {
    setCandidateEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, selected: !e.selected } : e))
    );
  }

  async function handleImportCalendarEvents(): Promise<void> {
    const drafts = convertEventsToMoments(candidateEvents);
    if (drafts.length === 0) {
      setCalendarModalVisible(false);
      return;
    }

    let lastCreatedId = '';
    for (const draft of drafts) {
      const m = await addMoment(draft, userId);
      lastCreatedId = m.id;
    }

    setCalendarModalVisible(false);
    if (lastCreatedId) {
      router.replace(`/moments/${lastCreatedId}/prep`);
    } else {
      router.back();
    }
  }

  async function handleSaveAndPrep(): Promise<void> {
    const finalTitle = title.trim();
    if (!finalTitle) {
      setErrorMsg(momentsCopy.addSheet.errors.titleRequired);
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const moment = await addMoment(
        {
          title: finalTitle,
          momentType: selectedType,
          attendees: attendees.trim() || undefined,
          eventDate: eventDate.trim() || undefined,
          formality: formality ?? 5,
          successVision: successVision.trim() || undefined,
          description: successVision.trim() || undefined,
          remindEveningBefore,
          status: 'upcoming',
        },
        userId
      );

      // Navigate directly into prep generation
      router.replace(`/moments/${moment.id}/prep`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save moment');
      setIsSubmitting(false);
    }
  }

  return (
    <Screen style={styles.screen}>
      <View testID="moments-new-screen" style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            testID="new-moment-back-btn"
            accessibilityRole="button"
            accessibilityLabel="Back to moments"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text role="titleMedium" style={{ color: colors.ink }}>
              ←
            </Text>
          </Pressable>
          <View style={styles.headerTitleContainer}>
            <Text role="titleLarge" style={{ color: colors.ink }}>
              {momentsCopy.addSheet.title}
            </Text>
            <Text role="labelSmall" style={{ color: colors.muted }}>
              {momentsCopy.addSheet.subtitle}
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.formScroll}
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Field 1: What is it? (chips) */}
          <View style={styles.fieldSection}>
            <Text role="labelMedium" style={[styles.fieldLabel, { color: colors.ink }]}>
              {momentsCopy.addSheet.fields.typeLabel}
            </Text>
            <View style={styles.chipsRow}>
              {momentsCopy.addSheet.fields.types.map((type) => {
                const isSelected = selectedType === type.id;
                return (
                  <Chip
                    key={type.id}
                    label={type.label}
                    tint={isSelected ? 'mint' : 'lilac'}
                    selected={isSelected}
                    onPress={() => setSelectedType(type.id as MomentType)}
                    style={styles.typeChip}
                  />
                );
              })}
            </View>
          </View>

          {/* Title Field */}
          <View style={styles.fieldSection}>
            <Text role="labelMedium" style={[styles.fieldLabel, { color: colors.ink }]}>
              {momentsCopy.addSheet.fields.titleLabel} *
            </Text>
            <TextInput
              testID="moment-title-input"
              value={title}
              onChangeText={setTitle}
              placeholder={momentsCopy.addSheet.fields.titlePlaceholder}
              placeholderTextColor={colors.muted}
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.surface1,
                  color: colors.ink,
                  borderColor: errorMsg ? accents.ember.pop : colors.line,
                },
              ]}
            />
            {errorMsg ? (
              <Text role="labelSmall" style={{ color: accents.ember.pop, marginTop: 4 }}>
                {errorMsg}
              </Text>
            ) : null}
          </View>

          {/* Field 2: Who will be there? */}
          <View style={styles.fieldSection}>
            <Text role="labelMedium" style={[styles.fieldLabel, { color: colors.ink }]}>
              {momentsCopy.addSheet.fields.attendeesLabel}
            </Text>
            <TextInput
              testID="moment-attendees-input"
              value={attendees}
              onChangeText={setAttendees}
              placeholder={momentsCopy.addSheet.fields.attendeesPlaceholder}
              placeholderTextColor={colors.muted}
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.surface1,
                  color: colors.ink,
                  borderColor: colors.line,
                },
              ]}
            />
          </View>

          {/* Field 3: When is it? */}
          <View style={styles.fieldSection}>
            <Text role="labelMedium" style={[styles.fieldLabel, { color: colors.ink }]}>
              {momentsCopy.addSheet.fields.dateLabel}
            </Text>
            <TextInput
              testID="moment-date-input"
              value={eventDate}
              onChangeText={setEventDate}
              placeholder={momentsCopy.addSheet.fields.datePlaceholder}
              placeholderTextColor={colors.muted}
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.surface1,
                  color: colors.ink,
                  borderColor: colors.line,
                },
              ]}
            />
          </View>

          {/* Field 4: How formal? (NoDefaultSlider) */}
          <View style={styles.fieldSection}>
            <View style={styles.sliderHeader}>
              <Text role="labelMedium" style={[styles.fieldLabel, { color: colors.ink }]}>
                {momentsCopy.addSheet.fields.formalityLabel}
              </Text>
              <Text role="labelSmall" style={{ color: colors.muted }}>
                {formality !== null ? `${formality} / 10` : 'Not set'}
              </Text>
            </View>
            <Text role="bodySmall" style={{ color: colors.muted, marginBottom: 8 }}>
              {momentsCopy.addSheet.fields.formalityDescription}
            </Text>
            <NoDefaultSlider
              testID="formality-slider"
              value={formality}
              onChange={setFormality}
              min={0}
              max={10}
              step={1}
            />
          </View>

          {/* Field 5: What would make it go well? */}
          <View style={styles.fieldSection}>
            <Text role="labelMedium" style={[styles.fieldLabel, { color: colors.ink }]}>
              {momentsCopy.addSheet.fields.successVisionLabel}
            </Text>
            <TextInput
              testID="moment-vision-input"
              value={successVision}
              onChangeText={setSuccessVision}
              placeholder={momentsCopy.addSheet.fields.successVisionPlaceholder}
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={3}
              style={[
                styles.textInput,
                styles.multilineInput,
                {
                  backgroundColor: colors.surface1,
                  color: colors.ink,
                  borderColor: colors.line,
                },
              ]}
            />
          </View>

          {/* Toggle: Remind me the evening before */}
          <View
            style={[
              styles.toggleRow,
              { backgroundColor: colors.surface2, borderColor: colors.line },
            ]}
          >
            <View style={styles.toggleTextContainer}>
              <Text role="labelMedium" style={{ color: colors.ink }}>
                {momentsCopy.addSheet.fields.remindToggle}
              </Text>
            </View>
            <Switch
              testID="remind-evening-toggle"
              value={remindEveningBefore}
              onValueChange={setRemindEveningBefore}
              trackColor={{ false: colors.line, true: accents.mint.pop }}
              accessibilityLabel={momentsCopy.addSheet.fields.remindToggleA11y}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonSection}>
            <Button
              label={
                isSubmitting
                  ? momentsCopy.addSheet.buttons.saving
                  : momentsCopy.addSheet.buttons.saveAndPrep
              }
              variant="primary"
              disabled={isSubmitting}
              onPress={handleSaveAndPrep}
              style={styles.primaryActionBtn}
            />

            <Button
              label={momentsCopy.addSheet.buttons.addFromCalendar}
              variant="secondary"
              onPress={handleOpenCalendarSync}
              style={styles.secondaryActionBtn}
            />
          </View>
        </ScrollView>

        {/* Just-In-Time Calendar Permission & Event Picker Modal */}
        <Modal
          visible={calendarModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setCalendarModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <Card style={styles.modalCard}>
              <Text role="titleMedium" style={{ color: colors.ink }}>
                {momentsCopy.addSheet.calendarModal.title}
              </Text>

              {/* Strict Privacy Rationale */}
              <Text
                role="bodySmall"
                style={{ color: colors.muted, marginTop: 8, lineHeight: 18 }}
              >
                {momentsCopy.addSheet.calendarModal.rationale}
              </Text>

              <Text
                role="labelMedium"
                style={{ color: colors.ink, marginTop: 16, marginBottom: 8 }}
              >
                {momentsCopy.addSheet.calendarModal.selectEventsTitle}
              </Text>

              {candidateEvents.length === 0 ? (
                <Text role="bodySmall" style={{ color: colors.muted, marginVertical: 12 }}>
                  {momentsCopy.addSheet.calendarModal.noEvents}
                </Text>
              ) : (
                <View style={styles.calendarEventList}>
                  {candidateEvents.map((evt) => (
                    <Pressable
                      key={evt.id}
                      testID={`calendar-event-item-${evt.id}`}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: Boolean(evt.selected) }}
                      onPress={() => handleToggleCalendarEvent(evt.id)}
                      style={[
                        styles.calendarEventItem,
                        {
                          backgroundColor: evt.selected ? accents.mint.tint : colors.surface2,
                          borderColor: evt.selected ? accents.mint.pop : colors.line,
                        },
                      ]}
                    >
                      <View style={styles.checkboxIndicator}>
                        <Text role="labelMedium" style={{ color: accents.mint.pop }}>
                          {evt.selected ? '✓' : '○'}
                        </Text>
                      </View>
                      <View style={styles.calendarEventDetails}>
                        <Text role="labelMedium" style={{ color: colors.ink }}>
                          {evt.title}
                        </Text>
                        <Text role="labelSmall" style={{ color: colors.muted }}>
                          {evt.startDate.split('T')[0]} {evt.location ? `· ${evt.location}` : ''}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}

              <View style={styles.modalButtonsRow}>
                <Button
                  label={momentsCopy.addSheet.calendarModal.close}
                  variant="ghost"
                  onPress={() => setCalendarModalVisible(false)}
                />
                <Button
                  label={momentsCopy.addSheet.calendarModal.importButton(
                    candidateEvents.filter((e) => e.selected).length
                  )}
                  variant="primary"
                  disabled={candidateEvents.filter((e) => e.selected).length === 0}
                  onPress={handleImportCalendarEvents}
                />
              </View>
            </Card>
          </View>
        </Modal>
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
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
  },
  formScroll: {
    flex: 1,
  },
  formContent: {
    paddingBottom: 40,
  },
  fieldSection: {
    marginBottom: 20,
  },
  fieldLabel: {
    marginBottom: 6,
    fontWeight: '600',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
  },
  toggleTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  buttonSection: {
    gap: 12,
  },
  primaryActionBtn: {
    width: '100%',
  },
  secondaryActionBtn: {
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    padding: 20,
    maxHeight: '85%',
  },
  calendarEventList: {
    gap: 8,
    marginVertical: 10,
  },
  calendarEventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
  },
  checkboxIndicator: {
    marginRight: 10,
  },
  calendarEventDetails: {
    flex: 1,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
});
