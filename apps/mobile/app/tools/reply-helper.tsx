import { useRouter } from 'expo-router';
import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { replyCopy } from '../../src/copy/reply';
import { useReplyHelper } from '../../src/features/reply-helper/useReplyHelper';
import type { ReplyTone } from '../../src/features/reply-helper/types';
import { useTheme } from '../../src/theme/useTheme';
import { BackIcon } from '../../src/ui/icons/BackIcon';
import { Button } from '../../src/ui/primitives/Button';
import { Card } from '../../src/ui/primitives/Card';
import { Screen } from '../../src/ui/primitives/Screen';
import { Text } from '../../src/ui/primitives/Text';

export default function ReplyHelperScreen(): React.JSX.Element {
  const router = useRouter();
  const { colors, accents, radii, spacing, mode } = useTheme();

  const {
    mode: inputMode,
    setMode: setInputMode,
    pastedText,
    setPastedText,
    image,
    pickImage,
    clearImage,
    showBlurNotice,
    blurSkipped,
    skipBlur,
    isLoading,
    loadingStep,
    generateReplies,
    result,
    activeTone,
    setActiveTone,
    editingTone,
    setEditingTone,
    updateReplyText,
    getReplyText,
    copyReply,
    copiedTone,
    saveToJournal,
    savedToJournal,
    isSavingToJournal,
    capReached,
    error,
    suggestFallback,
  } = useReplyHelper({
    onCapReached: () => {
      // could track or navigate
    },
  });

  const isDark = mode === 'dark';

  const toneDots: Record<ReplyTone, string> = {
    warm: accents.mint.base,
    direct: accents.lilac.base,
    light: accents.honey.base,
  };

  const tones: ReplyTone[] = ['warm', 'direct', 'light'];

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingHorizontal: spacing[4] }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Navigation Bar */}
        <View style={styles.navBar}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={replyCopy.header.backA11y}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
          >
            <BackIcon size={22} color={colors.ink} />
          </Pressable>
          <Text
            role="labelSmall"
            color={accents.ember.base}
            style={styles.eyebrow}
          >
            {replyCopy.header.tag}
          </Text>
        </View>

        {/* Header Title & Subtitle */}
        <View style={styles.headerBlock}>
          <Text role="displayMedium" style={styles.title}>
            {replyCopy.header.title}
          </Text>
          <Text role="bodySmall" muted style={styles.subtitle}>
            {replyCopy.header.subtitle}
          </Text>
        </View>

        {/* Cap Reached Notice */}
        {capReached && (
          <Card tint="honey" style={styles.capCard}>
            <Text role="titleSmall" style={styles.capTitle}>
              {replyCopy.caps.title}
            </Text>
            <Text role="bodySmall" style={styles.capDescription}>
              {replyCopy.caps.description}
            </Text>
            <Button
              variant="secondary"
              label={replyCopy.caps.upgradeButton}
              onPress={() => router.push('/paywall')}
              style={styles.capButton}
            />
          </Card>
        )}

        {/* Input Segmented Control */}
        {!result && (
          <View
            style={[
              styles.segmentedContainer,
              { backgroundColor: isDark ? colors.surface2 : '#EDE6F5' },
            ]}
          >
            <Pressable
              onPress={() => setInputMode('paste')}
              accessibilityRole="button"
              accessibilityLabel={replyCopy.tabs.paste}
              style={[
                styles.segmentTab,
                inputMode === 'paste' && [
                  styles.segmentTabActive,
                  { backgroundColor: colors.surface1, borderColor: colors.line },
                ],
              ]}
            >
              <Text
                role="labelMedium"
                color={inputMode === 'paste' ? colors.ink : colors.muted}
                style={inputMode === 'paste' ? styles.segmentTextActive : styles.segmentText}
              >
                {replyCopy.tabs.paste}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setInputMode('screenshot')}
              accessibilityRole="button"
              accessibilityLabel={replyCopy.tabs.screenshot}
              style={[
                styles.segmentTab,
                inputMode === 'screenshot' && [
                  styles.segmentTabActive,
                  { backgroundColor: colors.surface1, borderColor: colors.line },
                ],
              ]}
            >
              <Text
                role="labelMedium"
                color={inputMode === 'screenshot' ? colors.ink : colors.muted}
                style={inputMode === 'screenshot' ? styles.segmentTextActive : styles.segmentText}
              >
                {replyCopy.tabs.screenshot}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Mode 1: Paste Text Mode */}
        {!result && inputMode === 'paste' && (
          <View style={styles.inputSection}>
            <View
              style={[
                styles.textInputWrapper,
                {
                  backgroundColor: colors.surface1,
                  borderColor: colors.line,
                  borderRadius: radii.md,
                },
              ]}
            >
              <TextInput
                value={pastedText}
                onChangeText={setPastedText}
                placeholder={replyCopy.pasteMode.placeholder}
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={4}
                style={[
                  styles.textArea,
                  { color: colors.ink, minHeight: 90 },
                ]}
                accessibilityLabel={replyCopy.pasteMode.label}
              />
              {pastedText.length > 0 && (
                <Pressable
                  onPress={() => setPastedText('')}
                  accessibilityRole="button"
                  accessibilityLabel={replyCopy.pasteMode.clearA11y}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.clearTextButton}
                >
                  <Text role="labelSmall" muted>
                    {replyCopy.pasteMode.clear}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        )}

        {/* Mode 2: Screenshot Mode */}
        {!result && inputMode === 'screenshot' && (
          <View style={styles.inputSection}>
            {!image ? (
              <Card tint="neutral" style={styles.uploadCard}>
                <Button
                  variant="secondary"
                  label={replyCopy.screenshotMode.chooseButton}
                  onPress={pickImage}
                  style={styles.chooseButton}
                />
                <Text role="bodySmall" muted align="center" style={styles.privacyNote}>
                  {replyCopy.screenshotMode.privacyNote}
                </Text>
              </Card>
            ) : (
              <View style={styles.imagePreviewContainer}>
                <Image
                  source={{ uri: image.uri }}
                  style={[styles.imagePreview, { borderRadius: radii.md }]}
                  resizeMode="contain"
                  accessibilityLabel={replyCopy.screenshotMode.imageSelectedA11y}
                />

                <View style={styles.imageActionRow}>
                  <Button
                    variant="ghost"
                    label={replyCopy.screenshotMode.changeButton}
                    onPress={pickImage}
                  />
                  <Button
                    variant="ghost"
                    label={replyCopy.pasteMode.clear}
                    onPress={clearImage}
                  />
                </View>

                {/* Blur Names Notice */}
                {showBlurNotice && !blurSkipped && (
                  <Card tint="lilac" style={styles.blurCard}>
                    <Text role="titleSmall" style={styles.blurTitle}>
                      {replyCopy.screenshotMode.blurWarningTitle}
                    </Text>
                    <Text role="bodySmall" muted style={styles.blurDescription}>
                      {replyCopy.screenshotMode.blurWarningBody}
                    </Text>
                    <Text role="labelSmall" muted style={styles.unverifiedNotice}>
                      {replyCopy.screenshotMode.unverifiedNotice}
                    </Text>
                    <Button
                      variant="secondary"
                      label={replyCopy.screenshotMode.skipBlurAction}
                      onPress={skipBlur}
                      style={styles.skipBlurButton}
                    />
                  </Card>
                )}
              </View>
            )}

            {/* Vision Fallback Offer */}
            {suggestFallback && (
              <Card tint="ember" style={styles.fallbackCard}>
                <Text role="titleSmall" style={styles.fallbackTitle}>
                  {replyCopy.fallback.title}
                </Text>
                <Text role="bodySmall" style={styles.fallbackBody}>
                  {replyCopy.fallback.body}
                </Text>
                <Button
                  variant="primary"
                  label={replyCopy.fallback.action}
                  onPress={() => setInputMode('paste')}
                  style={styles.fallbackButton}
                />
              </Card>
            )}
          </View>
        )}

        {/* Error Display */}
        {error && !suggestFallback && (
          <View style={[styles.errorContainer, { backgroundColor: isDark ? '#3D2024' : '#FDE8E8' }]}>
            <Text role="bodySmall" color={accents.ember.base}>
              {error}
            </Text>
          </View>
        )}

        {/* Generate Button (when not yet generated) */}
        {!result && (
          <View style={styles.actionContainer}>
            <Button
              variant="primary"
              label={
                loadingStep === 'reading_image'
                  ? replyCopy.actions.readingScreenshot
                  : loadingStep === 'generating_replies'
                  ? replyCopy.actions.generating
                  : replyCopy.actions.generate
              }
              loading={isLoading}
              disabled={
                isLoading ||
                (inputMode === 'paste' && !pastedText.trim()) ||
                (inputMode === 'screenshot' && !image?.base64)
              }
              onPress={generateReplies}
              style={styles.generateButton}
            />
          </View>
        )}

        {/* Results Screen */}
        {result && (
          <View style={styles.resultsContainer}>
            {/* Card 1: What they may mean */}
            <Card tint="neutral" style={styles.readingsCard}>
              <View style={styles.cardHeaderRow}>
                <Text role="labelSmall" style={styles.cardEyebrow}>
                  {replyCopy.readings.title}
                </Text>
                <View style={[styles.headerDot, { backgroundColor: accents.lilac.base }]} />
              </View>

              <View style={styles.readingsList}>
                {result.readings.map((reading, idx) => (
                  <View key={idx} style={styles.readingItem}>
                    <Text role="bodyMedium" style={styles.readingText}>
                      • {reading}
                    </Text>
                  </View>
                ))}
              </View>

              <Text role="bodySmall" muted style={styles.disclaimerText}>
                {result.disclaimer}
              </Text>
            </Card>

            {/* Card 2: Three Reply Options */}
            <Text
              role="labelSmall"
              color={accents.ember.base}
              style={styles.repliesSectionHeader}
            >
              {replyCopy.replies.title}
            </Text>

            {tones.map((tone) => {
              const isActive = activeTone === tone;
              const isEditing = editingTone === tone;
              const replyText = getReplyText(tone);
              const toneConfig = replyCopy.replies.tones[tone];

              return (
                <Pressable
                  key={tone}
                  onPress={() => setActiveTone(tone)}
                  accessibilityRole="button"
                  accessibilityLabel={`${toneConfig.label}: ${replyText}`}
                  style={styles.replyCardPressable}
                >
                  <Card
                    tint="neutral"
                    selected={isActive}
                    style={[
                      styles.replyCard,
                      isActive && {
                        borderColor: accents.ember.base,
                        borderWidth: 1.5,
                      },
                    ]}
                  >
                    <View style={styles.cardHeaderRow}>
                      <View style={styles.toneLabelRow}>
                        <Text role="labelMedium" style={styles.toneLabel}>
                          {toneConfig.label}
                        </Text>
                        <Text role="bodySmall" muted style={styles.toneDesc}>
                          {toneConfig.description}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.headerDot,
                          { backgroundColor: toneDots[tone] },
                        ]}
                      />
                    </View>

                    {isEditing ? (
                      <TextInput
                        value={replyText}
                        onChangeText={(txt) => updateReplyText(tone, txt)}
                        multiline
                        style={[
                          styles.inlineEditInput,
                          {
                            color: colors.ink,
                            borderColor: colors.line,
                            backgroundColor: colors.surface2,
                          },
                        ]}
                        autoFocus
                      />
                    ) : (
                      <Text role="bodyMedium" style={styles.replyContentText}>
                        “{replyText}”
                      </Text>
                    )}

                    <View style={styles.replyActionsRow}>
                      <Pressable
                        onPress={() => copyReply(tone)}
                        accessibilityRole="button"
                        accessibilityLabel={replyCopy.replies.copyToneButton(tone)}
                        style={styles.cardActionItem}
                      >
                        <Text
                          role="labelSmall"
                          color={copiedTone === tone ? accents.mint.base : accents.ember.base}
                        >
                          {copiedTone === tone
                            ? replyCopy.replies.copiedFeedback
                            : replyCopy.replies.copyAction}
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() => setEditingTone(isEditing ? null : tone)}
                        accessibilityRole="button"
                        accessibilityLabel={
                          isEditing
                            ? replyCopy.replies.saveEditAction
                            : replyCopy.replies.editAction
                        }
                        style={styles.cardActionItem}
                      >
                        <Text role="labelSmall" muted>
                          {isEditing
                            ? replyCopy.replies.saveEditAction
                            : replyCopy.replies.editAction}
                        </Text>
                      </Pressable>
                    </View>
                  </Card>
                </Pressable>
              );
            })}

            {/* Bottom Actions: Copy Chosen & Save to Journal */}
            <View style={styles.bottomActionsArea}>
              <Button
                variant="primary"
                label={
                  copiedTone === activeTone
                    ? replyCopy.replies.copiedFeedback
                    : replyCopy.replies.copyToneButton(activeTone)
                }
                onPress={() => copyReply(activeTone)}
                style={styles.primaryCopyButton}
              />

              <Button
                variant="secondary"
                label={
                  savedToJournal
                    ? replyCopy.journal.savedFeedback
                    : replyCopy.journal.saveButton
                }
                loading={isSavingToJournal}
                disabled={savedToJournal || isSavingToJournal}
                onPress={saveToJournal}
                style={styles.journalButton}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 48,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  backButton: {
    paddingRight: 12,
  },
  eyebrow: {
    fontWeight: '700',
    letterSpacing: 1.0,
    textTransform: 'uppercase',
  },
  headerBlock: {
    marginTop: 8,
    marginBottom: 20,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    lineHeight: 18,
  },
  segmentedContainer: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 4,
    marginBottom: 16,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentTabActive: {
    borderWidth: 1,
    shadowColor: '#30212A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontWeight: '600',
  },
  segmentTextActive: {
    fontWeight: '700',
  },
  inputSection: {
    marginBottom: 16,
  },
  textInputWrapper: {
    borderWidth: 1,
    padding: 12,
    position: 'relative',
  },
  textArea: {
    fontSize: 14,
    textAlignVertical: 'top',
  },
  clearTextButton: {
    alignSelf: 'flex-end',
    marginTop: 6,
  },
  uploadCard: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chooseButton: {
    width: '100%',
    marginBottom: 12,
  },
  privacyNote: {
    fontSize: 12,
  },
  imagePreviewContainer: {
    alignItems: 'center',
  },
  imagePreview: {
    width: '100%',
    height: 220,
    marginBottom: 10,
  },
  imageActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  blurCard: {
    width: '100%',
    padding: 16,
    marginBottom: 12,
  },
  blurTitle: {
    marginBottom: 6,
  },
  blurDescription: {
    marginBottom: 6,
  },
  unverifiedNotice: {
    fontSize: 11,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  skipBlurButton: {
    marginTop: 4,
  },
  fallbackCard: {
    width: '100%',
    padding: 16,
    marginTop: 12,
  },
  fallbackTitle: {
    marginBottom: 6,
  },
  fallbackBody: {
    marginBottom: 12,
  },
  fallbackButton: {
    width: '100%',
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  actionContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  generateButton: {
    width: '100%',
  },
  resultsContainer: {
    marginTop: 8,
  },
  readingsCard: {
    padding: 16,
    marginBottom: 20,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardEyebrow: {
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  headerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  readingsList: {
    marginBottom: 12,
  },
  readingItem: {
    marginBottom: 8,
  },
  readingText: {
    fontSize: 14,
    lineHeight: 20,
  },
  disclaimerText: {
    fontStyle: 'italic',
    fontSize: 12,
  },
  repliesSectionHeader: {
    fontWeight: '700',
    letterSpacing: 1.0,
    marginBottom: 12,
  },
  replyCardPressable: {
    marginBottom: 12,
  },
  replyCard: {
    padding: 16,
  },
  toneLabelRow: {
    flex: 1,
    marginRight: 8,
  },
  toneLabel: {
    fontWeight: '700',
    marginBottom: 2,
  },
  toneDesc: {
    fontSize: 11,
  },
  replyContentText: {
    fontSize: 14,
    lineHeight: 20,
    marginVertical: 10,
  },
  inlineEditInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    marginVertical: 8,
    minHeight: 60,
  },
  replyActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 4,
  },
  cardActionItem: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  bottomActionsArea: {
    marginTop: 16,
    gap: 10,
  },
  primaryCopyButton: {
    width: '100%',
  },
  journalButton: {
    width: '100%',
  },
  capCard: {
    padding: 16,
    marginBottom: 16,
  },
  capTitle: {
    marginBottom: 6,
  },
  capDescription: {
    marginBottom: 12,
  },
  capButton: {
    width: '100%',
  },
});
