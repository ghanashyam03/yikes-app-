import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { privacyCopy } from '../../src/copy/privacy';
import { PrivacyModals } from '../../src/features/privacy/PrivacyModals';
import { usePrivacy } from '../../src/features/privacy/usePrivacy';
import { useTheme } from '../../src/theme/useTheme';
import { BackIcon } from '../../src/ui/icons/BackIcon';
import { Button } from '../../src/ui/primitives/Button';
import { Card } from '../../src/ui/primitives/Card';
import { Screen } from '../../src/ui/primitives/Screen';
import { Text } from '../../src/ui/primitives/Text';

export default function SettingsPrivacyScreen(): React.JSX.Element {
  const router = useRouter();
  const { colors, accents, spacing } = useTheme();

  const {
    consents,
    loadConsents,
    toggleConsent,
    exportState,
    requestExport,
    openDeleteTextModal,
    executeDeleteText,
    openDeleteAccountModal,
    executeDeleteAccount,
  } = usePrivacy();

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadConsents();
  }, [loadConsents]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleConfirmDeleteText = async () => {
    const success = await executeDeleteText();
    if (success) {
      showToast(privacyCopy.deleteText.successToast);
    }
  };

  const handleConfirmDeleteAccount = async () => {
    const success = await executeDeleteAccount();
    if (success) {
      showToast(privacyCopy.deleteAccount.successToast);
      router.replace('/');
    }
  };

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={privacyCopy.header.backLabel}
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <BackIcon size={24} color={colors.ink} />
        </Pressable>
        <Text role="titleLarge" color={colors.ink}>
          {privacyCopy.header.title}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: spacing[8] }]}
        showsVerticalScrollIndicator={false}
      >
        <Text role="bodyMedium" color={colors.muted} style={styles.subtitle}>
          {privacyCopy.header.subtitle}
        </Text>

        {toastMessage && (
          <Card tint="mint" style={styles.toastCard}>
            <Text role="bodyMedium" color={colors.ink} style={{ fontWeight: '600' }}>
              {toastMessage}
            </Text>
          </Card>
        )}

        {/* Section 1: Consents */}
        <Text role="labelLarge" color={colors.muted} style={styles.sectionHeading}>
          {privacyCopy.consents.sectionTitle.toUpperCase()}
        </Text>
        <Card style={styles.sectionCard}>
          {/* Required */}
          <View style={styles.consentRow}>
            <View style={styles.consentTextCol}>
              <View style={styles.badgeRow}>
                <Text role="bodyMedium" color={colors.ink} style={styles.consentTitle}>
                  {privacyCopy.consents.required.title}
                </Text>
                <View style={[styles.badge, { backgroundColor: accents.mint.tint }]}>
                  <Text role="bodySmall" color={accents.mint.pop} style={{ fontWeight: '700' }}>
                    {privacyCopy.consents.required.alwaysActiveBadge}
                  </Text>
                </View>
              </View>
              <Text role="bodySmall" color={colors.muted}>
                {privacyCopy.consents.required.description}
              </Text>
            </View>
            <Switch
              value={true}
              disabled={true}
              accessibilityLabel={privacyCopy.consents.toggleAccessibility('Required', true)}
              trackColor={{ false: colors.surface1, true: accents.mint.base }}
              thumbColor={colors.surface1}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.line }]} />

          {/* Analytics */}
          <View style={styles.consentRow}>
            <View style={styles.consentTextCol}>
              <Text role="bodyMedium" color={colors.ink} style={styles.consentTitle}>
                {privacyCopy.consents.analytics.title}
              </Text>
              <Text role="bodySmall" color={colors.muted}>
                {privacyCopy.consents.analytics.description}
              </Text>
            </View>
            <Switch
              value={consents.analytics}
              onValueChange={(val) => {
                void toggleConsent('analytics', val);
              }}
              accessibilityLabel={privacyCopy.consents.toggleAccessibility('Analytics', consents.analytics)}
              trackColor={{ false: colors.surface1, true: accents.mint.base }}
              thumbColor={colors.surface1}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.line }]} />

          {/* Improve AI */}
          <View style={styles.consentRow}>
            <View style={styles.consentTextCol}>
              <Text role="bodyMedium" color={colors.ink} style={styles.consentTitle}>
                {privacyCopy.consents.improveAi.title}
              </Text>
              <Text role="bodySmall" color={colors.muted}>
                {privacyCopy.consents.improveAi.description}
              </Text>
            </View>
            <Switch
              value={consents.improve_ai}
              onValueChange={(val) => {
                void toggleConsent('improve_ai', val);
              }}
              accessibilityLabel={privacyCopy.consents.toggleAccessibility('Improve AI', consents.improve_ai)}
              trackColor={{ false: colors.surface1, true: accents.mint.base }}
              thumbColor={colors.surface1}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.line }]} />

          {/* Tips / Marketing */}
          <View style={styles.consentRow}>
            <View style={styles.consentTextCol}>
              <Text role="bodyMedium" color={colors.ink} style={styles.consentTitle}>
                {privacyCopy.consents.marketing.title}
              </Text>
              <Text role="bodySmall" color={colors.muted}>
                {privacyCopy.consents.marketing.description}
              </Text>
            </View>
            <Switch
              value={consents.marketing}
              onValueChange={(val) => {
                void toggleConsent('marketing', val);
              }}
              accessibilityLabel={privacyCopy.consents.toggleAccessibility('Marketing', consents.marketing)}
              trackColor={{ false: colors.surface1, true: accents.mint.base }}
              thumbColor={colors.surface1}
            />
          </View>
        </Card>

        {/* Section 2: Download my data */}
        <Text role="labelLarge" color={colors.muted} style={styles.sectionHeading}>
          {privacyCopy.export.sectionTitle.toUpperCase()}
        </Text>
        <Card style={styles.sectionCard}>
          <Text role="bodyMedium" color={colors.ink} style={{ fontWeight: '600' }}>
            {privacyCopy.export.sectionSubtitle}
          </Text>
          {exportState.status === 'ready' ? (
            <View style={styles.exportReadyBox}>
              <Text role="bodyMedium" color={accents.mint.pop} style={{ fontWeight: '700' }}>
                {privacyCopy.export.readyTitle}
              </Text>
              <Text role="bodySmall" color={colors.muted} style={{ marginVertical: spacing[1] }}>
                {privacyCopy.export.expiresIn(24)}
              </Text>
              <Button
                variant="secondary"
                label={privacyCopy.export.downloadButton}
                onPress={() => showToast(privacyCopy.export.successToast)}
                accessibilityLabel={privacyCopy.export.downloadButton}
                style={{ marginTop: spacing[2] }}
              />
            </View>
          ) : (
            <Button
              variant="secondary"
              label={
                exportState.status === 'requesting'
                  ? privacyCopy.export.requesting
                  : privacyCopy.export.buttonLabel
              }
              loading={exportState.status === 'requesting'}
              disabled={exportState.status === 'requesting'}
              onPress={requestExport}
              accessibilityLabel={privacyCopy.export.buttonLabel}
              style={{ marginTop: spacing[3] }}
            />
          )}
          {exportState.error && (
            <Text role="bodySmall" color={accents.honey.pop} style={{ marginTop: spacing[2] }}>
              {exportState.error}
            </Text>
          )}
        </Card>

        {/* Section 3: Delete practice text */}
        <Text role="labelLarge" color={colors.muted} style={styles.sectionHeading}>
          {privacyCopy.deleteText.sectionTitle.toUpperCase()}
        </Text>
        <Card style={styles.sectionCard}>
          <Text role="bodyMedium" color={colors.ink}>
            {privacyCopy.deleteText.sectionSubtitle}
          </Text>
          <Text role="bodySmall" color={colors.muted} style={{ marginTop: spacing[1] }}>
            {privacyCopy.deleteText.keptGuarantee}
          </Text>
          <Button
            variant="secondary"
            label={privacyCopy.deleteText.buttonLabel}
            onPress={openDeleteTextModal}
            accessibilityLabel={privacyCopy.deleteText.buttonLabel}
            style={{ marginTop: spacing[3] }}
          />
        </Card>

        {/* Section 4: Delete account */}
        <Text role="labelLarge" color={colors.muted} style={styles.sectionHeading}>
          {privacyCopy.deleteAccount.sectionTitle.toUpperCase()}
        </Text>
        <Card style={styles.sectionCard}>
          <Text role="bodyMedium" color={colors.ink}>
            {privacyCopy.deleteAccount.sectionSubtitle}
          </Text>
          <Text role="bodySmall" color={accents.honey.pop} style={{ marginTop: spacing[1] }}>
            {privacyCopy.deleteAccount.notice30Days}
          </Text>
          <Button
            variant="ghost"
            label={privacyCopy.deleteAccount.buttonLabel}
            onPress={() => {
              void openDeleteAccountModal();
            }}
            accessibilityLabel={privacyCopy.deleteAccount.buttonLabel}
            style={{ marginTop: spacing[3] }}
          />
        </Card>

        {/* Section 5: Model training disclaimer */}
        <Card tint="lilac" style={[styles.sectionCard, { marginTop: spacing[4] }]}>
          <Text role="labelLarge" color={colors.ink} style={{ fontWeight: '700' }}>
            {privacyCopy.disclaimer.title}
          </Text>
          <Text role="bodySmall" color={colors.muted} style={{ marginTop: spacing[1] }}>
            {privacyCopy.disclaimer.text}
          </Text>
        </Card>
      </ScrollView>

      <PrivacyModals
        onConfirmDeleteText={handleConfirmDeleteText}
        onConfirmDeleteAccount={handleConfirmDeleteAccount}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginRight: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  subtitle: {
    marginBottom: 16,
    lineHeight: 22,
  },
  toastCard: {
    padding: 12,
    marginBottom: 16,
  },
  sectionHeading: {
    marginTop: 20,
    marginBottom: 8,
    letterSpacing: 0.8,
  },
  sectionCard: {
    padding: 16,
  },
  consentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  consentTextCol: {
    flex: 1,
    paddingRight: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  consentTitle: {
    fontWeight: '600',
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  divider: {
    height: 1,
    width: '100%',
  },
  exportReadyBox: {
    marginTop: 12,
  },
});
