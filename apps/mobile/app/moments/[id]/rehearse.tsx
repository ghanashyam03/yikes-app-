import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { momentsCopy } from '../../../src/copy/moments';
import { useMoments } from '../../../src/features/moments/useMoments';
import { useTrySession } from '../../../src/features/try/useTrySession';
import { useTheme } from '../../../src/theme/useTheme';
import { CharacterAvatar } from '../../../src/ui/components/CharacterAvatar';
import { ChatBubble } from '../../../src/ui/components/ChatBubble';
import { TypingDots } from '../../../src/ui/components/TypingDots';
import { Button } from '../../../src/ui/primitives/Button';
import { Card } from '../../../src/ui/primitives/Card';
import { Chip } from '../../../src/ui/primitives/Chip';
import { Screen } from '../../../src/ui/primitives/Screen';
import { Text } from '../../../src/ui/primitives/Text';

export default function MomentRehearseScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, accents } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);

  const { getMoment } = useMoments();
  const moment = getMoment(id || '');

  const partnerName = moment?.attendees?.split(',')[0]?.trim() || 'Jordan';
  const partnerRole = `${partnerName}, colleague`;

  const [hasCompleted, setHasCompleted] = useState<boolean>(false);

  const {
    messages,
    expression,
    currentTurn,
    turnCap,
    isTyping,
    suggestedReplies,
    isOffline,
    inputText,
    setInputText,
    sendMessage,
    passTurn,
    selectSuggestion,
    finishSession,
  } = useTrySession({
    mode: 'rehearsal',
    scenario: {
      title: moment?.title || 'Upcoming conversation',
      setting: moment?.description || 'Meeting room or social gathering',
      userGoal:
        moment?.successVision ||
        'Practice opener, asking open questions, and delivering a clean exit line',
    },
    initialOpeningText: moment?.prepPayload?.openerOptions?.[0],
  });

  function handleFinish(): void {
    finishSession();
    setHasCompleted(true);
  }

  return (
    <Screen style={styles.screen}>
      <View testID="moment-rehearse-screen" style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.line }]}>
          <View style={styles.headerTop}>
            <Pressable
              testID="rehearse-back-btn"
              accessibilityRole="button"
              accessibilityLabel="Back to prep"
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Text role="titleMedium" style={{ color: colors.ink }}>
                ←
              </Text>
            </Pressable>

            <View style={styles.partnerInfo}>
              <CharacterAvatar
                testID="rehearse-avatar"
                character="maya"
                expression={expression}
                size="md"
              />
              <View style={styles.partnerTextContainer}>
                <Text role="titleSmall" style={{ color: colors.ink }}>
                  {momentsCopy.rehearse.title} · {partnerName}
                </Text>
                <Text role="labelSmall" style={{ color: colors.muted }} numberOfLines={1}>
                  {momentsCopy.rehearse.partnerSubtitle(partnerRole, moment?.title || '')}
                </Text>
              </View>
            </View>

            <Pressable
              testID="finish-rehearsal-btn"
              accessibilityRole="button"
              accessibilityLabel={momentsCopy.rehearse.finishButton}
              onPress={handleFinish}
              style={styles.finishBtn}
            >
              <Text role="labelSmall" style={{ color: accents.mint.pop, fontWeight: '700' }}>
                Done
              </Text>
            </Pressable>
          </View>

          {/* Goal pill & Turn pill */}
          <View style={styles.pillsRow}>
            <View
              style={[
                styles.turnPill,
                { backgroundColor: colors.surface2, borderColor: colors.line },
              ]}
            >
              <Text role="labelSmall" style={{ color: colors.ink, fontWeight: '600' }}>
                Turn {Math.min(currentTurn, turnCap || 5)} of {turnCap || 5}
              </Text>
            </View>
            <View
              style={[
                styles.goalPill,
                { backgroundColor: accents.lilac.tint, borderColor: colors.line },
              ]}
            >
              <Text
                role="labelSmall"
                style={{ color: accents.lilac.pop, fontWeight: '600' }}
                numberOfLines={1}
              >
                {momentsCopy.rehearse.focusGoal(moment?.successVision)}
              </Text>
            </View>
          </View>
        </View>

        {/* Rehearsal Chat Area */}
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            ref={scrollViewRef}
            testID="rehearsal-messages-scroll"
            style={styles.messagesScroll}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {/* Edge state: Offline Banner */}
            {isOffline && (
              <Card tint="honey" style={styles.offlineCard}>
                <Text role="labelSmall" style={{ color: accents.honey.pop, fontWeight: '700' }}>
                  Offline Mode · Using cached partner responses
                </Text>
              </Card>
            )}

            {/* Chat Bubbles */}
            {messages.map((item) => (
              <View key={item.id} style={styles.bubbleRow}>
                <ChatBubble
                  variant={item.role === 'user' ? 'user' : 'partner'}
                  text={item.text}
                  testID={`rehearse-bubble-${item.id}`}
                />
              </View>
            ))}

            {/* Typing Dots */}
            {isTyping && (
              <View testID="rehearse-typing-dots" style={styles.typingRow}>
                <TypingDots color={accents.mint.pop} partnerName={partnerName} />
              </View>
            )}

            {/* Coach Rehearsal Debrief Card when finished */}
            {hasCompleted && (
              <View testID="rehearsal-completed-card" style={styles.debriefContainer}>
                <Card tint="mint" style={styles.debriefCard}>
                  <Text role="titleSmall" style={{ color: accents.mint.pop, fontWeight: '700' }}>
                    {momentsCopy.rehearse.coachDebrief.title}
                  </Text>
                  <Text role="bodySmall" style={{ color: colors.ink, marginTop: 6 }}>
                    {momentsCopy.rehearse.coachDebrief.body}
                  </Text>

                  <View style={styles.debriefActions}>
                    <Button
                      label="Open Pocket Card"
                      variant="primary"
                      onPress={() => router.replace(`/moments/${id}/pocket`)}
                      style={{ marginTop: 12 }}
                    />
                    <Button
                      label="Back to Prep"
                      variant="ghost"
                      onPress={() => router.back()}
                      style={{ marginTop: 6 }}
                    />
                  </View>
                </Card>
              </View>
            )}
          </ScrollView>

          {/* Bottom input area (active while not completed) */}
          {!hasCompleted && (
            <View style={[styles.bottomArea, { borderTopColor: colors.line }]}>
              {/* Suggested replies row */}
              {suggestedReplies.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  <Text role="labelSmall" style={{ color: colors.muted, marginBottom: 6 }}>
                    Suggested practice replies:
                  </Text>
                  <View style={styles.suggestionsList}>
                    {suggestedReplies.map((replyText, idx) => (
                      <Chip
                        key={idx}
                        label={replyText}
                        tint="lilac"
                        onPress={() => selectSuggestion(replyText)}
                        style={styles.suggestionChip}
                      />
                    ))}
                  </View>
                </View>
              )}

              {/* Input text row */}
              <View style={styles.inputRow}>
                <TextInput
                  testID="rehearse-input"
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Type what you want to practice…"
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
                <Button
                  label="Send"
                  variant="primary"
                  disabled={!inputText.trim() || isTyping}
                  onPress={() => sendMessage(inputText)}
                  style={styles.sendBtn}
                />
              </View>

              <View style={styles.quickActionsRow}>
                <Pressable
                  testID="rehearse-pass-btn"
                  onPress={passTurn}
                  style={styles.passTurnBtn}
                >
                  <Text role="labelSmall" style={{ color: colors.muted }}>
                    Pass this one →
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
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
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 6,
    marginRight: 8,
  },
  partnerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  partnerTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  finishBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  turnPill: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  goalPill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 30,
    gap: 12,
  },
  bubbleRow: {
    marginVertical: 2,
  },
  typingRow: {
    paddingVertical: 6,
  },
  offlineCard: {
    padding: 10,
    marginBottom: 8,
  },
  debriefContainer: {
    marginTop: 16,
  },
  debriefCard: {
    padding: 18,
  },
  debriefActions: {
    gap: 4,
  },
  bottomArea: {
    borderTopWidth: 1,
    padding: 12,
    backgroundColor: 'transparent',
  },
  suggestionsContainer: {
    marginBottom: 8,
  },
  suggestionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  suggestionChip: {
    marginBottom: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 15,
  },
  sendBtn: {
    minWidth: 70,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  passTurnBtn: {
    padding: 4,
  },
});
