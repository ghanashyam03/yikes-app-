import React, { useState } from 'react';
import {
  StyleProp,
  StyleSheet,
  Switch,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import { settingsCopy } from '../../copy/settings';
import { supabase } from '../auth/supabaseClient';
import { useSessionStore } from '../auth/useSession';
import { useTheme } from '../../theme/useTheme';
import { BottomSheet } from '../../ui/components/BottomSheet';
import { Button } from '../../ui/primitives/Button';
import { Card } from '../../ui/primitives/Card';
import { Text } from '../../ui/primitives/Text';

export interface ReportAiButtonProps {
  targetKind?: string;
  targetId?: string;
  messageContent?: string;
  buttonLabel?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  style?: StyleProp<ViewStyle>;
  onReportSuccess?: () => void;
  testID?: string;
}

export function ReportAiButton({
  targetKind = 'message',
  targetId,
  messageContent,
  buttonLabel = settingsCopy.help.reportSection.buttonLabel,
  variant = 'secondary',
  style,
  onReportSuccess,
  testID = 'report-ai-button',
}: ReportAiButtonProps): React.JSX.Element {
  const { colors, accents, spacing, radii } = useTheme();
  const session = useSessionStore((s) => s.session);

  const [isOpen, setIsOpen] = useState(false);
  const [consentToAttach, setConsentToAttach] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const resolvedTargetId = targetId || `msg_${Date.now()}`;

  const handleSubmit = async () => {
    setSubmitting(true);
    setFeedbackStatus('idle');

    try {
      const userId = session?.user?.id ?? '00000000-0000-0000-0000-000000000000';

      // Insert record into ai_feedback table
      const { error } = await supabase.from('ai_feedback').insert({
        user_id: userId,
        target_kind: targetKind,
        target_id: resolvedTargetId,
        rating: 1, // 1 denotes reported / flagged
      });

      if (error) {
        // If error occurred (e.g. mock or offline), log quietly and still allow graceful UX
        setFeedbackStatus('error');
      } else {
        setFeedbackStatus('success');
        setTimeout(() => {
          setIsOpen(false);
          setFeedbackStatus('idle');
          setNotes('');
          setConsentToAttach(false);
          onReportSuccess?.();
        }, 1200);
      }
    } catch {
      setFeedbackStatus('error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpen = () => {
    setFeedbackStatus('idle');
    setConsentToAttach(false);
    setNotes('');
    setIsOpen(true);
  };

  const handleClose = () => {
    if (!submitting) {
      setIsOpen(false);
    }
  };

  return (
    <>
      <View testID={testID} style={style}>
        <Button
          label={buttonLabel}
          variant={variant}
          onPress={handleOpen}
        />
      </View>

      <BottomSheet
        visible={isOpen}
        onDismiss={handleClose}
        title={settingsCopy.reportModal.title}
        testID="report-ai-modal"
      >
        <View style={styles.modalContent}>
          <Text role="bodyMedium" color={colors.muted} style={{ marginBottom: spacing[3] }}>
            {settingsCopy.reportModal.subtitle}
          </Text>

          {messageContent && (
            <Card tint="lilac" style={{ marginBottom: spacing[3] }}>
              <Text role="labelSmall" color={accents.lilac.pop} style={{ marginBottom: 4 }}>
                {settingsCopy.reportModal.targetLabel}
              </Text>
              <Text role="bodySmall" color={colors.ink} numberOfLines={4}>
                {messageContent}
              </Text>
            </Card>
          )}

          {/* Explicit consent checkbox to attach message */}
          <View
            style={[
              styles.consentRow,
              {
                borderColor: colors.line,
                backgroundColor: colors.surface2,
                borderRadius: radii.card,
              },
            ]}
          >
            <View style={{ flex: 1, marginRight: spacing[3] }}>
              <Text role="bodyMedium" color={colors.ink} style={{ fontWeight: '600' }}>
                {settingsCopy.reportModal.consentLabel}
              </Text>
              <Text role="bodySmall" color={colors.muted} style={{ marginTop: 2 }}>
                {settingsCopy.reportModal.consentHint}
              </Text>
            </View>
            <Switch
              value={consentToAttach}
              onValueChange={setConsentToAttach}
              trackColor={{ false: colors.line, true: accents.mint.base }}
              testID="report-consent-switch"
            />
          </View>

          {/* Optional notes */}
          <TextInput
            placeholder={settingsCopy.reportModal.notesPlaceholder}
            placeholderTextColor={colors.muted}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            testID="report-notes-input"
            style={[
              styles.notesInput,
              {
                borderColor: colors.line,
                color: colors.ink,
                backgroundColor: colors.surface2,
                borderRadius: radii.card,
              },
            ]}
          />

          {feedbackStatus === 'success' && (
            <Card tint="mint" style={{ marginBottom: spacing[3] }}>
              <Text role="bodySmall" color={accents.mint.pop} style={{ fontWeight: '700' }}>
                {settingsCopy.reportModal.successToast}
              </Text>
            </Card>
          )}

          {feedbackStatus === 'error' && (
            <Card tint="honey" style={{ marginBottom: spacing[3] }}>
              <Text role="bodySmall" color={accents.honey.pop}>
                {settingsCopy.reportModal.errorToast}
              </Text>
            </Card>
          )}

          <View style={styles.actionsRow}>
            <Button
              label={
                submitting
                  ? settingsCopy.reportModal.submittingButton
                  : settingsCopy.reportModal.submitButton
              }
              variant="primary"
              disabled={submitting || feedbackStatus === 'success'}
              onPress={handleSubmit}
              style={{ flex: 1, marginRight: spacing[2] }}
            />
            <Button
              label={settingsCopy.reportModal.cancelButton}
              variant="ghost"
              disabled={submitting}
              onPress={handleClose}
            />
          </View>
        </View>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    paddingBottom: 24,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  notesInput: {
    borderWidth: 1,
    padding: 12,
    minHeight: 72,
    textAlignVertical: 'top',
    fontSize: 14,
    marginBottom: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
