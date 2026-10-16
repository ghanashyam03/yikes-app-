import React, { useRef } from 'react';
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
import { tryCopy } from '../../../src/copy/try';
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

export default function SessionTryScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, accents, radii } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);

  const {
    messages,
    expression,
    currentTurn,
    turnCap,
    isTyping,
    isThinking,
    idleBannerVisible,
    suggestedReplies,
    hint,
    isHintLoading,
    isOffline,
    isCapReached,
    wantsToEnd,
    inputText,
    setInputText,
    sendMessage,
    passTurn,
    selectSuggestion,
    requestHint,
    closeHint,
    finishSession,
    resetIdleTimer,
  } = useTrySession({ sessionId: id });

  const partnerName = 'Maya';
  const partnerRole = 'Senior product colleague';

  return (
    <Screen style={styles.screen}>
      <View testID="session-try-screen" style={styles.flex}>
        {/* 1. Header with mood-reactive avatar and Turn pill */}
        <View style={[styles.header, { borderBottomColor: colors.line }]}>
          <View style={styles.headerTop}>
            <Pressable
              testID="try-back-button"
              accessibilityRole="button"
              accessibilityLabel={tryCopy.header.backA11y}
              onPress={() => router.back()}
              style={styles.headerIconButton}
            >
              <Text role="titleMedium" style={{ color: colors.ink }}>
                ←
              </Text>
            </Pressable>

            <View style={styles.partnerInfo}>
              <CharacterAvatar
                testID="partner-avatar"
                character="maya"
                expression={expression}
                size="md"
              />
              <View style={styles.partnerTextContainer}>
                <Text role="titleSmall" style={{ color: colors.ink }}>
                  {partnerName}
                </Text>
                <Text role="labelSmall" style={{ color: colors.muted }}>
                  {tryCopy.header.partnerSubtitle(partnerRole)}
                </Text>
              </View>
            </View>

            <Pressable
              testID="try-end-early-button"
              accessibilityRole="button"
              accessibilityLabel={tryCopy.header.endEarlyA11y}
              onPress={finishSession}
              style={styles.endEarlyButton}
            >
              <Text role="labelSmall" style={{ color: accents.lilac.pop, fontWeight: '600' }}>
                {tryCopy.header.endEarly}
              </Text>
            </Pressable>
          </View>

          {/* Turn Pill (Strictly NO countdown timer!) */}
          <View style={styles.pillRow}>
            <View
              testID="turn-counter-pill"
              style={[styles.turnPill, { backgroundColor: colors.surface2, borderColor: colors.line }]}
              accessible={true}
              accessibilityRole="text"
              accessibilityLabel={
                turnCap > 0
                  ? tryCopy.header.turnPill(Math.min(currentTurn, turnCap), turnCap)
                  : tryCopy.header.freeTurnPill(currentTurn)
              }
            >
              <Text role="labelSmall" style={{ color: colors.ink, fontWeight: '600' }}>
                {turnCap > 0
                  ? tryCopy.header.turnPill(Math.min(currentTurn, turnCap), turnCap)
                  : tryCopy.header.freeTurnPill(currentTurn)}
              </Text>
            </View>
          </View>
        </View>

        {/* 2. Messages List */}
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            ref={scrollViewRef}
            testID="messages-scroll-view"
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {/* Edge state: Offline Banner */}
            {isOffline && (
              <View testID="offline-card">
                <Card tint="honey" style={styles.noticeCard}>
                  <Text role="labelMedium" style={{ color: accents.honey.pop, fontWeight: '700' }}>
                    {tryCopy.edgeStates.offlineTitle}
                  </Text>
                  <Text role="bodySmall" style={{ color: colors.muted, marginTop: 4 }}>
                    {tryCopy.edgeStates.offlineBody}
                  </Text>
                </Card>
              </View>
            )}

            {/* Edge state: Daily Cap Reached Card */}
            {isCapReached && (
              <View testID="cap-reached-card">
                <Card tint="honey" style={styles.noticeCard}>
                  <Text role="labelMedium" style={{ color: accents.honey.pop, fontWeight: '700' }}>
                    {tryCopy.edgeStates.capTitle}
                  </Text>
                  <Text role="bodySmall" style={{ color: colors.muted, marginTop: 4 }}>
                    {tryCopy.edgeStates.capBody}
                  </Text>
                  <Button
                    label={tryCopy.edgeStates.capButton}
                    variant="primary"
                    style={{ marginTop: 12 }}
                    onPress={finishSession}
                  />
                </Card>
              </View>
            )}

            {/* Chat Bubbles */}
            {messages.map((item) => (
              <View key={item.id} style={styles.bubbleRow}>
                <ChatBubble
                  variant={item.role === 'user' ? 'user' : 'partner'}
                  text={item.text}
                  testID={`bubble-${item.role}-${item.id}`}
                />
                {item.degraded && (
                  <Text role="labelSmall" style={[styles.degradedNote, { color: colors.muted }]}>
                    {tryCopy.status.degradedNote}
                  </Text>
                )}
              </View>
            ))}

            {/* Typing Indicator and Slow Reply 8s Thinking state */}
            {isTyping && (
              <View testID="typing-container" style={styles.typingWrapper}>
                <TypingDots
                  testID="typing-dots"
                  color={accents.lilac.pop}
                  partnerName={partnerName}
                />
                {isThinking && (
                  <Text
                    testID="thinking-state-text"
                    role="bodySmall"
                    style={[styles.thinkingText, { color: colors.muted }]}
                  >
                    {tryCopy.status.thinking(partnerName)}
                  </Text>
                )}
              </View>
            )}

            {/* Faint 20s Idle Cue Banner */}
            {idleBannerVisible && !isTyping && !wantsToEnd && (
              <View testID="idle-cue-banner" style={styles.idleBanner}>
                <Text role="labelSmall" style={{ color: colors.muted, fontStyle: 'italic' }}>
                  {tryCopy.status.idleCue}
                </Text>
              </View>
            )}

            {/* Hint Card */}
            {hint && (
              <View testID="hint-card">
                <Card tint="mint" style={styles.hintCard}>
                  <Text role="labelSmall" style={{ color: accents.mint.pop, fontWeight: '700' }}>
                    {tryCopy.input.hintTitle}
                  </Text>
                  <Text role="bodyMedium" style={{ color: colors.ink, marginTop: 6 }}>
                    {hint}
                  </Text>
                  <Pressable
                    testID="close-hint-button"
                    onPress={closeHint}
                    style={styles.closeHintPressable}
                  >
                    <Text role="labelSmall" style={{ color: accents.mint.pop, fontWeight: '600' }}>
                      {tryCopy.input.hintClose}
                    </Text>
                  </Pressable>
                </Card>
              </View>
            )}

            {/* Turn Cap or Partner Wants To End: Completion CTA */}
            {wantsToEnd && (
              <View testID="session-complete-banner" style={styles.completionBanner}>
                <View testID="review-with-coach-button">
                  <Button
                    label={tryCopy.actions.finishPractice}
                    variant="primary"
                    onPress={finishSession}
                  />
                </View>
              </View>
            )}
          </ScrollView>

          {/* 3. Bottom Controls */}
          {!wantsToEnd && !isCapReached && (
            <View style={[styles.bottomBar, { borderTopColor: colors.line, backgroundColor: colors.surface1 }]}>
              {/* Suggested Reply Chips */}
              {suggestedReplies.length > 0 && (
                <View style={styles.suggestionsContainer}>
                  <Text role="labelSmall" style={[styles.suggestionsHeader, { color: colors.muted }]}>
                    {tryCopy.input.suggestionsLabel}
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.suggestionsList}
                  >
                    {suggestedReplies.map((reply, idx) => (
                      <View key={`suggestion-${idx}`} testID={`suggestion-chip-${idx}`}>
                        <Chip
                          label={reply}
                          tint="lilac"
                          onPress={() => selectSuggestion(reply)}
                          style={styles.suggestionChip}
                        />
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Input Row */}
              <View style={styles.inputRow}>
                <TextInput
                  testID="chat-text-input"
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.surface2,
                      color: colors.ink,
                      borderColor: colors.line,
                      borderRadius: radii.card,
                    },
                  ]}
                  placeholder={tryCopy.input.placeholder}
                  placeholderTextColor={colors.muted}
                  value={inputText}
                  onChangeText={(text) => {
                    setInputText(text);
                    resetIdleTimer();
                  }}
                  multiline
                  maxLength={400}
                />

                <Pressable
                  testID="send-message-button"
                  accessibilityRole="button"
                  accessibilityLabel={tryCopy.input.sendA11y}
                  disabled={!inputText.trim() || isTyping}
                  onPress={() => sendMessage()}
                  style={[
                    styles.sendButton,
                    {
                      backgroundColor: inputText.trim() && !isTyping ? accents.lilac.pop : colors.surface2,
                      borderRadius: 24,
                    },
                  ]}
                >
                  <Text
                    role="titleMedium"
                    style={{
                      color: inputText.trim() && !isTyping ? '#FFFFFF' : colors.muted,
                    }}
                  >
                    ↑
                  </Text>
                </Pressable>
              </View>

              {/* Quiet Secondary Links: Pass and Need a Hint */}
              <View style={styles.quietLinksRow}>
                <Pressable
                  testID="pass-this-one-button"
                  accessibilityRole="button"
                  accessibilityLabel={tryCopy.input.passA11y}
                  onPress={passTurn}
                  style={styles.quietLink}
                >
                  <Text role="labelSmall" style={{ color: colors.muted }}>
                    {tryCopy.input.passThisOne}
                  </Text>
                </Pressable>

                <Pressable
                  testID="need-hint-button"
                  accessibilityRole="button"
                  accessibilityLabel={tryCopy.input.hintA11y}
                  disabled={isHintLoading}
                  onPress={requestHint}
                  style={styles.quietLink}
                >
                  <Text role="labelSmall" style={{ color: accents.mint.pop, fontWeight: '600' }}>
                    {tryCopy.input.needHint}
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
  headerIconButton: {
    minHeight: 48,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  partnerTextContainer: {
    justifyContent: 'center',
  },
  endEarlyButton: {
    minHeight: 48,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  pillRow: {
    alignItems: 'center',
    marginTop: 6,
  },
  turnPill: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
  },
  bubbleRow: {
    marginVertical: 2,
  },
  degradedNote: {
    fontSize: 11,
    marginTop: 2,
    marginLeft: 6,
    fontStyle: 'italic',
  },
  typingWrapper: {
    alignSelf: 'flex-start',
    marginVertical: 4,
  },
  thinkingText: {
    marginTop: 6,
    marginLeft: 8,
    fontStyle: 'italic',
  },
  idleBanner: {
    alignItems: 'center',
    marginVertical: 8,
  },
  hintCard: {
    marginVertical: 8,
    padding: 14,
  },
  closeHintPressable: {
    alignSelf: 'flex-end',
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  noticeCard: {
    marginVertical: 8,
    padding: 16,
  },
  completionBanner: {
    marginTop: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  bottomBar: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  suggestionsContainer: {
    marginBottom: 8,
  },
  suggestionsHeader: {
    fontSize: 11,
    marginBottom: 6,
  },
  suggestionsList: {
    gap: 8,
  },
  suggestionChip: {
    maxWidth: 260,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textInput: {
    flex: 1,
    minHeight: 48,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
  },
  sendButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quietLinksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  quietLink: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
});
