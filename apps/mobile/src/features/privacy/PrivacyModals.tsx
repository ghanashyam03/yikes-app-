import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { privacyCopy } from '../../copy/privacy';
import { usePrivacy } from './usePrivacy';
import { useTheme } from '../../theme/useTheme';
import { BottomSheet } from '../../ui/components/BottomSheet';
import { Button } from '../../ui/primitives/Button';
import { Card } from '../../ui/primitives/Card';
import { Text } from '../../ui/primitives/Text';

export interface PrivacyModalsProps {
  onConfirmDeleteText: () => Promise<void>;
  onConfirmDeleteAccount: () => Promise<void>;
}

export function PrivacyModals({
  onConfirmDeleteText,
  onConfirmDeleteAccount,
}: PrivacyModalsProps): React.JSX.Element {
  const { colors, accents, spacing, radii } = useTheme();

  const {
    deleteTextState,
    closeDeleteTextModal,
    isConfirmTextModalOpen,
    deleteAccountState,
    closeDeleteAccountModal,
    isDeleteAccountModalOpen,
    otpCode,
    setOtpCode,
  } = usePrivacy();

  return (
    <>
      {/* Confirmation Modal: Delete Practice Text */}
      <BottomSheet
        visible={isConfirmTextModalOpen}
        onDismiss={closeDeleteTextModal}
        title={privacyCopy.deleteText.modalTitle}
      >
        <View style={styles.modalContent}>
          <Text role="bodyMedium" color={colors.ink} style={{ marginBottom: spacing[3] }}>
            {privacyCopy.deleteText.modalExplanation}
          </Text>
          <Card tint="mint" style={{ marginBottom: spacing[4] }}>
            <Text role="bodySmall" color={accents.mint.pop} style={{ fontWeight: '700' }}>
              {privacyCopy.deleteText.keptGuarantee}
            </Text>
          </Card>
          {deleteTextState.error && (
            <Text role="bodySmall" color={accents.honey.pop} style={{ marginBottom: spacing[2] }}>
              {deleteTextState.error}
            </Text>
          )}
          <Button
            variant="primary"
            label={
              deleteTextState.status === 'in_progress'
                ? privacyCopy.deleteText.deleting
                : privacyCopy.deleteText.confirmButton
            }
            loading={deleteTextState.status === 'in_progress'}
            onPress={onConfirmDeleteText}
            accessibilityLabel={privacyCopy.deleteText.confirmButton}
          />
          <Button
            variant="ghost"
            label={privacyCopy.deleteText.cancelButton}
            onPress={closeDeleteTextModal}
            accessibilityLabel={privacyCopy.deleteText.cancelButton}
            style={{ marginTop: spacing[2] }}
          />
        </View>
      </BottomSheet>

      {/* Confirmation Modal: Delete Account with OTP */}
      <BottomSheet
        visible={isDeleteAccountModalOpen}
        onDismiss={closeDeleteAccountModal}
        title={privacyCopy.deleteAccount.modalTitle}
      >
        <View style={styles.modalContent}>
          <Text role="bodyMedium" color={colors.ink} style={{ marginBottom: spacing[2] }}>
            {privacyCopy.deleteAccount.notice30Days}
          </Text>
          <Text role="bodySmall" color={colors.muted} style={{ marginBottom: spacing[3] }}>
            {privacyCopy.deleteAccount.otpPrompt}
          </Text>
          <TextInput
            value={otpCode}
            onChangeText={setOtpCode}
            placeholder={privacyCopy.deleteAccount.otpPlaceholder}
            placeholderTextColor={colors.muted}
            keyboardType="number-pad"
            maxLength={6}
            accessibilityLabel={privacyCopy.deleteAccount.otpPrompt}
            style={[
              styles.otpInput,
              {
                color: colors.ink,
                borderColor: colors.line,
                backgroundColor: colors.surface1,
                borderRadius: radii.md,
              },
            ]}
          />
          {deleteAccountState.error && (
            <Text role="bodySmall" color={accents.honey.pop} style={{ marginVertical: spacing[2] }}>
              {deleteAccountState.error}
            </Text>
          )}
          <Button
            variant="primary"
            label={
              deleteAccountState.status === 'in_progress'
                ? privacyCopy.deleteAccount.deleting
                : privacyCopy.deleteAccount.confirmButton
            }
            loading={deleteAccountState.status === 'in_progress'}
            onPress={onConfirmDeleteAccount}
            accessibilityLabel={privacyCopy.deleteAccount.confirmButton}
            style={{ marginTop: spacing[3] }}
          />
          <Button
            variant="ghost"
            label={privacyCopy.deleteAccount.cancelButton}
            onPress={closeDeleteAccountModal}
            accessibilityLabel={privacyCopy.deleteAccount.cancelButton}
            style={{ marginTop: spacing[2] }}
          />
        </View>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    paddingBottom: 24,
  },
  otpInput: {
    borderWidth: 1,
    padding: 14,
    fontSize: 20,
    letterSpacing: 6,
    textAlign: 'center',
  },
});
