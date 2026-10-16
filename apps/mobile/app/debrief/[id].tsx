import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { checkinsCopy } from '../../src/copy/checkins';
import { useSession } from '../../src/features/auth/useSession';
import { useDebrief } from '../../src/features/debrief/useDebrief';
import { useTheme } from '../../src/theme/useTheme';
import { Button } from '../../src/ui/primitives/Button';
import { Card } from '../../src/ui/primitives/Card';
import { Chip } from '../../src/ui/primitives/Chip';
import { Screen } from '../../src/ui/primitives/Screen';
import { Text } from '../../src/ui/primitives/Text';

export default function DebriefScreen(): React.JSX.Element {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, accents, radii } = useTheme();
  const { session } = useSession();
  const userId = session?.user?.id;

  const {
    messages,
    takeaway,
    isDone,
    isCrisis,
    isLoading,
    suggestedChips,
    startDebrief,
    sendAnswer,
    updateCoreEssence,
    saveToJournal,
    discardDebrief,
  } = useDebrief();

  const [inputMessage, setInputMessage] = useState('');
  const [editedEssence, setEditedEssence] = useState('');
  const [savedJournalToast, setSavedJournalToast] = useState(false);

  useEffect(() => {
    startDebrief(id);
  }, [id, startDebrief]);

  useEffect(() => {
    if (takeaway?.coreEssence) {
      setEditedEssence(takeaway.coreEssence);
    }
  }, [takeaway]);

  // CRITICAL: Safety Trigger Routing to /support
  useEffect(() => {
    if (isCrisis) {
      router.replace('/support');
    }
  }, [isCrisis, router]);

  const handleSend = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    setInputMessage('');
    await sendAnswer(trimmed);
  };

  const handleSaveToJournal = async () => {
    if (editedEssence !== takeaway?.coreEssence) {
      updateCoreEssence(editedEssence);
    }
    await saveToJournal(userId);
    setSavedJournalToast(true);
    setTimeout(() => {
      discardDebrief();
      if (router.canGoBack()) router.back();
      else router.replace('/(tabs)/moments');
    }, 600);
  };

  const handleDiscard = () => {
    Alert.alert(
      checkinsCopy.debrief.takeawayCard.discardConfirmTitle,
      checkinsCopy.debrief.takeawayCard.discardConfirmMessage,
      [
        {
          text: checkinsCopy.debrief.takeawayCard.discardCancelAction,
          style: 'cancel',
        },
        {
          text: checkinsCopy.debrief.takeawayCard.discardConfirmAction,
          style: 'destructive',
          onPress: () => {
            discardDebrief();
            if (router.canGoBack()) router.back();
            else router.replace('/(tabs)/moments');
          },
        },
      ]
    );
  };

  return (
    <Screen style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}
      >
        <View testID="debrief-screen" style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              testID="debrief-back-button"
              accessibilityRole="button"
              accessibilityLabel="Back"
              onPress={() => {
                if (isDone) handleDiscard();
                else if (router.canGoBack()) router.back();
                else router.replace('/(tabs)/moments');
              }}
              style={styles.backButton}
            >
              <Text role="labelLarge" style={{ color: colors.ink }}>
                ← Back
              </Text>
            </Pressable>

            <View style={styles.badgeRow}>
              <Chip
                label={checkinsCopy.debrief.aestheticBadge}
                tint="lilac"
                style={styles.lilacBadge}
              />
            </View>

            <Text role="titleLarge" style={[styles.title, { color: colors.ink }]}>
              {checkinsCopy.debrief.title}
            </Text>
            <Text role="bodySmall" style={{ color: colors.muted, marginTop: 2 }}>
              {checkinsCopy.debrief.subtitle}
            </Text>
          </View>

          {/* Conversation or Takeaway Card */}
          <ScrollView
            testID="debrief-messages-list"
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((msg) => {
              const isAssistant = msg.role === 'assistant';
              return (
                <View
                  key={msg.id}
                  testID={`debrief-msg-${msg.id}`}
                  style={[
                    styles.messageBubbleContainer,
                    isAssistant
                      ? styles.assistantBubbleContainer
                      : styles.userBubbleContainer,
                  ]}
                >
                  {isAssistant && (
                    <Text
                      role="labelSmall"
                      style={{
                        color: accents.lilac.pop,
                        fontWeight: '700',
                        marginBottom: 4,
                      }}
                    >
                      {checkinsCopy.debrief.interviewerName}
                    </Text>
                  )}
                  <View
                    style={[
                      styles.bubble,
                      isAssistant
                        ? [
                            styles.assistantBubble,
                            {
                              backgroundColor: accents.lilac.tint,
                              borderColor: accents.lilac.base,
                            },
                          ]
                        : [
                            styles.userBubble,
                            {
                              backgroundColor: colors.surface2,
                              borderColor: colors.line,
                            },
                          ],
                      { borderRadius: radii.card },
                    ]}
                  >
                    <Text role="bodyMedium" style={{ color: colors.ink }}>
                      {msg.text}
                    </Text>
                  </View>
                </View>
              );
            })}

            {/* TAKEAWAY CARD: Shown when debrief is done */}
            {isDone && takeaway && (
              <View testID="debrief-takeaway-card" style={styles.takeawaySection}>
                <Card style={styles.takeawayCard} tint="lilac">
                  <Text
                    role="titleMedium"
                    style={{
                      color: accents.lilac.pop,
                      fontWeight: '700',
                      textAlign: 'center',
                    }}
                  >
                    {checkinsCopy.debrief.takeawayCard.heading}
                  </Text>
                  <Text
                    role="bodySmall"
                    style={{
                      color: colors.muted,
                      textAlign: 'center',
                      marginTop: 2,
                      marginBottom: 16,
                    }}
                  >
                    {checkinsCopy.debrief.takeawayCard.subheading}
                  </Text>

                  {/* Headline */}
                  <Text role="bodyLarge" style={{ color: colors.ink, marginBottom: 16 }}>
                    {takeaway.headline}
                  </Text>

                  {/* Editable Core Essence */}
                  <View style={styles.editableEssenceBox}>
                    <Text
                      role="labelSmall"
                      style={{ color: colors.muted, marginBottom: 4 }}
                    >
                      {checkinsCopy.debrief.takeawayCard.essenceLabel}
                    </Text>
                    <TextInput
                      testID="takeaway-core-essence-input"
                      value={editedEssence}
                      onChangeText={(val) => {
                        setEditedEssence(val);
                        updateCoreEssence(val);
                      }}
                      multiline
                      style={[
                        styles.essenceInput,
                        {
                          backgroundColor: colors.surface1,
                          borderColor: colors.line,
                          color: colors.ink,
                          borderRadius: radii.sm,
                        },
                      ]}
                      accessibilityLabel="Edit core essence of debrief takeaway"
                    />
                  </View>

                  {/* Next Focus Context */}
                  {takeaway.quoteContext && (
                    <View style={styles.focusBox}>
                      <Text
                        role="labelSmall"
                        style={{ color: accents.honey.pop, fontWeight: '700', marginBottom: 2 }}
                      >
                        {checkinsCopy.debrief.takeawayCard.focusLabel.toUpperCase()}
                      </Text>
                      <Text role="bodySmall" style={{ color: colors.ink }}>
                        {takeaway.quoteContext}
                      </Text>
                    </View>
                  )}

                  {/* Action buttons */}
                  {savedJournalToast ? (
                    <View
                      testID="debrief-saved-toast"
                      style={[
                        styles.savedToast,
                        { backgroundColor: accents.mint.tint },
                      ]}
                    >
                      <Text role="labelMedium" style={{ color: accents.mint.pop }}>
                        ✓ {checkinsCopy.debrief.takeawayCard.savedSuccess}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.takeawayButtonsRow}>
                      <View testID="debrief-save-journal-btn" style={styles.saveJournalBtn}>
                        <Button
                          label={checkinsCopy.debrief.takeawayCard.saveToJournal}
                          variant="primary"
                          onPress={handleSaveToJournal}
                          style={{ width: '100%' }}
                        />
                      </View>
                      <View testID="debrief-discard-btn" style={styles.discardBtn}>
                        <Button
                          label={checkinsCopy.debrief.takeawayCard.discard}
                          variant="ghost"
                          onPress={handleDiscard}
                          style={{ width: '100%' }}
                        />
                      </View>
                    </View>
                  )}
                </Card>
              </View>
            )}
          </ScrollView>

          {/* SUGGESTED CHIPS + INPUT (Active during interview) */}
          {!isDone && (
            <View style={styles.inputAreaContainer}>
              {/* Suggested reply chips */}
              {suggestedChips.length > 0 && (
                <View testID="debrief-suggested-chips" style={styles.chipsContainer}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipsRow}
                  >
                    {suggestedChips.map((chipText, i) => (
                      <View key={i} testID={`debrief-chip-${i}`}>
                        <Chip
                          label={chipText}
                          tint="lilac"
                          onPress={() => handleSend(chipText)}
                          style={styles.chipMargin}
                        />
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Text Input Row */}
              <View style={styles.inputRow}>
                <TextInput
                  testID="debrief-input-field"
                  value={inputMessage}
                  onChangeText={setInputMessage}
                  placeholder={checkinsCopy.debrief.inputPlaceholder}
                  placeholderTextColor={colors.muted}
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.surface2,
                      borderColor: colors.line,
                      color: colors.ink,
                      borderRadius: radii.pill,
                    },
                  ]}
                  accessibilityLabel="Type your answer"
                />
                <View testID="debrief-send-button" style={styles.sendButton}>
                  <Button
                    label={checkinsCopy.debrief.sendButton}
                    variant="primary"
                    disabled={!inputMessage.trim() || isLoading}
                    onPress={() => handleSend(inputMessage)}
                    style={{ width: '100%' }}
                  />
                </View>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  header: {
    marginBottom: 10,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 6,
    paddingVertical: 4,
  },
  badgeRow: {
    marginBottom: 6,
  },
  lilacBadge: {
    alignSelf: 'flex-start',
  },
  title: {
    fontWeight: '700',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
    gap: 12,
  },
  messageBubbleContainer: {
    width: '100%',
    marginVertical: 4,
  },
  assistantBubbleContainer: {
    alignItems: 'flex-start',
  },
  userBubbleContainer: {
    alignItems: 'flex-end',
  },
  bubble: {
    maxWidth: '85%',
    padding: 14,
    borderWidth: 1,
  },
  assistantBubble: {},
  userBubble: {},
  takeawaySection: {
    marginTop: 16,
    width: '100%',
  },
  takeawayCard: {
    padding: 20,
  },
  editableEssenceBox: {
    marginBottom: 14,
  },
  essenceInput: {
    borderWidth: 1,
    padding: 12,
    fontSize: 15,
    minHeight: 50,
  },
  focusBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  takeawayButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  saveJournalBtn: {
    flex: 2,
  },
  discardBtn: {
    flex: 1,
  },
  savedToast: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  inputAreaContainer: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  chipsContainer: {
    marginBottom: 10,
  },
  chipsRow: {
    gap: 8,
    paddingHorizontal: 4,
  },
  chipMargin: {
    marginRight: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 16,
    borderWidth: 1,
    fontSize: 15,
  },
  sendButton: {
    height: 48,
    minWidth: 70,
  },
});
