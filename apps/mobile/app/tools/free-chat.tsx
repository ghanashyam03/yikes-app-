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
import { useRouter } from 'expo-router';
import { tryCopy } from '../../src/copy/try';
import { useTrySession } from '../../src/features/try/useTrySession';
import { useTheme } from '../../src/theme/useTheme';
import { CharacterAvatar } from '../../src/ui/components/CharacterAvatar';
import { ChatBubble } from '../../src/ui/components/ChatBubble';
import { TypingDots } from '../../src/ui/components/TypingDots';
import { Card } from '../../src/ui/primitives/Card';
import { Chip } from '../../src/ui/primitives/Chip';
import { Screen } from '../../src/ui/primitives/Screen';
import { Text } from '../../src/ui/primitives/Text';

export default function FreeChatScreen(): React.JSX.Element {
  const router = useRouter();
  const { colors, accents, radii } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);

  const {
    messages,
    expression,
    currentTurn,
    isTyping,
    isThinking,
    idleBannerVisible,
    suggestedReplies,
    hint,
    isHintLoading,
    isOffline,
    isCapReached,
    inputText,
    setInputText,
    sendMessage,
    passTurn,
    selectSuggestion,
    requestHint,
    closeHint,
    resetIdleTimer,
  } = useTrySession({
    mode: 'free',
    scenario: {
      title: 'Free Conversation',
      setting: 'Casual coffee chat',
      userGoal: 'Chat at your own pace with no turn limits',
    },
    initialOpeningText: 'Hey there! Nice to catch up. How has your week been going so far?',
  });

  const partnerName = 'Maya';

  return (
    <Screen style={styles.screen}>
      <View testID="tools-free-chat-screen" style={styles.flex}>
        {/* 1. Header with Avatar and Free pill */}
        <View style={[styles.header, { borderBottomColor: colors.line }]}>
          <View style={styles.headerTop}>
            <Pressable
              testID="free-chat-back-button"
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
                testID="free-partner-avatar"
                character="maya"
                expression={expression}
                size="md"
              />
              <View style={styles.partnerTextContainer}>
                <Text role="titleSmall" style={{ color: colors.ink }}>
                  {tryCopy.freeChat.title}
                </Text>
                <Text role="labelSmall" style={{ color: colors.muted }}>
                  {tryCopy.freeChat.subtitle}
                </Text>
              </View>
            </View>

            <View style={styles.headerPlaceholder} />
          </View>

          {/* Turn Pill (No timer) */}
          <View style={styles.pillRow}>
            <View
              testID="free-turn-pill"
              style={[styles.turnPill, { backgroundColor: colors.surface2, borderColor: colors.line }]}
              accessible={true}
              accessibilityRole="text"
              accessibilityLabel={tryCopy.header.freeTurnPill(currentTurn)}
            >
              <Text role="labelSmall" style={{ color: colors.ink, fontWeight: '600' }}>
                {tryCopy.header.freeTurnPill(currentTurn)}
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
            testID="free-messages-scroll-view"
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {/* Offline Notice */}
            {isOffline && (
              <View testID="free-offline-card">
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

            {/* Cap Reached Notice */}
            {isCapReached && (
              <View testID="free-cap-card">
                <Card tint="honey" style={styles.noticeCard}>
                  <Text role="labelMedium" style={{ color: accents.honey.pop, fontWeight: '700' }}>
                    {tryCopy.edgeStates.capTitle}
                  </Text>
                  <Text role="bodySmall" style={{ color: colors.muted, marginTop: 4 }}>
                    {tryCopy.edgeStates.capBody}
                  </Text>
                </Card>
              </View>
            )}

            {/* Bubbles */}
            {messages.map((item) => (
              <View key={item.id} style={styles.bubbleRow}>
                <ChatBubble
                  variant={item.role === 'user' ? 'user' : 'partner'}
                  text={item.text}
                  testID={`free-bubble-${item.role}-${item.id}`}
                />
              </View>
            ))}

            {/* Typing Indicator and Slow reply thinking state */}
            {isTyping && (
              <View testID="free-typing-container" style={styles.typingWrapper}>
                <TypingDots
                  testID="free-typing-dots"
                  color={accents.lilac.pop}
                  partnerName={partnerName}
                />
                {isThinking && (
                  <Text
                    testID="free-thinking-state-text"
                    role="bodySmall"
                    style={[styles.thinkingText, { color: colors.muted }]}
                  >
                    {tryCopy.status.thinking(partnerName)}
                  </Text>
                )}
              </View>
            )}

            {/* Idle Banner */}
            {idleBannerVisible && !isTyping && (
              <View testID="free-idle-cue-banner" style={styles.idleBanner}>
                <Text role="labelSmall" style={{ color: colors.muted, fontStyle: 'italic' }}>
                  {tryCopy.status.idleCue}
                </Text>
              </View>
            )}

            {/* Hint Card */}
            {hint && (
              <View testID="free-hint-card">
                <Card tint="mint" style={styles.hintCard}>
                  <Text role="labelSmall" style={{ color: accents.mint.pop, fontWeight: '700' }}>
                    {tryCopy.input.hintTitle}
                  </Text>
                  <Text role="bodyMedium" style={{ color: colors.ink, marginTop: 6 }}>
                    {hint}
                  </Text>
                  <Pressable
                    testID="free-close-hint-button"
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
          </ScrollView>

          {/* 3. Bottom Bar */}
          <View style={[styles.bottomBar, { borderTopColor: colors.line, backgroundColor: colors.surface1 }]}>
            {/* Suggestions */}
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
                    <View key={`free-suggestion-${idx}`} testID={`free-suggestion-chip-${idx}`}>
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
                testID="free-chat-text-input"
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
                testID="free-send-message-button"
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

            {/* Secondary quiet links */}
            <View style={styles.quietLinksRow}>
              <Pressable
                testID="free-pass-this-one-button"
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
                testID="free-need-hint-button"
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
  headerPlaceholder: {
    minHeight: 48,
    minWidth: 48,
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
