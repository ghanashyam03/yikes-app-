import React, { useCallback, useMemo, useState } from 'react';
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
import * as Haptics from 'expo-haptics';
import { Screen } from '../../src/ui/primitives/Screen';
import { Text } from '../../src/ui/primitives/Text';
import { Button } from '../../src/ui/primitives/Button';
import { Chip } from '../../src/ui/primitives/Chip';
import { CharacterAvatar } from '../../src/ui/components/CharacterAvatar';
import { ChatBubble } from '../../src/ui/components/ChatBubble';
import { TypingDots } from '../../src/ui/components/TypingDots';
import { useTheme } from '../../src/theme/useTheme';
import { useOnboardingStore } from '../../src/features/onboarding/store';
import { todayCopy } from '../../src/copy/today';

interface TurnMessage {
  id: string;
  role: 'user' | 'partner';
  text: string;
}

const PRIYA_WARMUP_REPLIES: string[] = [
  'Haha, I hear you! Finding your rhythm is half the battle on mornings like this.',
  'Nice! A quiet coffee walk before jumping into meetings always helps me clear my head.',
  'Totally understand. It was really great saying hello! Let’s head over to meet your coach.',
];

const SUGGESTED_OPTIONS: [string[], string[], string[]] = [
  [
    'Pretty steady, just getting started.',
    'A bit busy, but making progress.',
    'Just grabbed coffee and heading over.',
  ],
  [
    'Do you usually take morning walks?',
    'Yeah, hoping for a calm afternoon.',
    'What meetings do you have today?',
  ],
  [
    'Great catching up with you Priya.',
    'Have a good morning!',
    'Talk to you soon.',
  ],
];

export default function WarmupScreen(): React.JSX.Element {
  const router = useRouter();
  const { colors, accents, radii, spacing } = useTheme();

  const answers = useOnboardingStore((s) => s.answers);
  const scenarioWorld = answers.q4 === 'Student' ? 'campus lounge' : 'kitchen area';

  const [messages, setMessages] = useState<TurnMessage[]>([
    {
      id: 'msg-0',
      role: 'partner',
      text: `Hey there! Saw you were heading toward the ${scenarioWorld} too. How is your morning shaping up so far?`,
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentTurn, setCurrentTurn] = useState(1);
  const turnCap = 4;

  const triggerHaptic = () => {
    try {
      void Haptics.selectionAsync();
    } catch {
      // Haptics optional
    }
  };

  const handleSendMessage = useCallback(
    (textToSend?: string) => {
      const text = (textToSend ?? inputText).trim();
      if (!text || isTyping || currentTurn > turnCap) return;

      triggerHaptic();
      setInputText('');

      const userMsg: TurnMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        text,
      };

      setMessages((prev) => [...prev, userMsg]);
      const nextTurnNumber = currentTurn + 1;
      setCurrentTurn(nextTurnNumber);

      if (nextTurnNumber <= turnCap) {
        setIsTyping(true);
        // Simulate partner thinking with character-colored bubble on turn 3
        setTimeout(() => {
          setIsTyping(false);
          const replyText =
            PRIYA_WARMUP_REPLIES[nextTurnNumber - 2] ||
            'Really nice chatting with you! Let’s see what your Coach has to say.';

          setMessages((prev) => [
            ...prev,
            {
              id: `partner-${Date.now()}`,
              role: 'partner',
              text: replyText,
            },
          ]);
        }, 800);
      }
    },
    [currentTurn, inputText, isTyping]
  );

  const handlePass = () => {
    handleSendMessage('… (just taking in the morning quietly)');
  };

  const handleFinish = () => {
    triggerHaptic();
    router.push('/(onboarding)/coach-read');
  };

  const activeSuggestions = useMemo(() => {
    const idx = Math.min(2, Math.max(0, currentTurn - 1));
    return SUGGESTED_OPTIONS[idx] || SUGGESTED_OPTIONS[0];
  }, [currentTurn]);

  // Turn 3 typing indicator bubble is character-colored (Priya's lilac/honey palette)
  const isTurn3 = currentTurn === 3;
  const typingDotColor = isTurn3 ? accents.lilac.pop : accents.mint.pop;

  return (
    <Screen style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header Bar */}
        <View style={styles.header}>
          <View style={styles.headerPartnerRow}>
            <CharacterAvatar character="priya" size={44} expression="warm" />
            <View style={styles.headerTextContainer}>
              <Text role="titleMedium" style={{ color: colors.ink }}>
                {todayCopy.warmup.title}
              </Text>
              <Text role="labelSmall" style={{ color: accents.ember.base, fontWeight: '700' }}>
                {todayCopy.warmup.turnIndicator(Math.min(currentTurn, turnCap), turnCap)}
              </Text>
            </View>
          </View>
        </View>

        {/* Message Stream */}
        <ScrollView
          contentContainerStyle={[styles.messagesContent, { paddingBottom: spacing[4] }]}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => (
            <ChatBubble
              key={msg.id}
              variant={msg.role === 'user' ? 'user' : 'partner'}
              text={msg.text}
              {...(msg.role === 'partner' ? { senderName: 'Priya' } : {})}
            />
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <View style={styles.typingContainer}>
              <TypingDots
                partnerName="Priya"
                color={typingDotColor}
                style={isTurn3 ? { backgroundColor: accents.lilac.tint, borderColor: accents.lilac.base } : undefined}
              />
            </View>
          )}

          {/* When completed, prominent Continue button */}
          {currentTurn >= turnCap && !isTyping && (
            <View style={styles.completedNoticeContainer}>
              <Button
                variant="primary"
                label={todayCopy.warmup.continueToCoach}
                onPress={handleFinish}
                accessibilityLabel={todayCopy.warmup.continueToCoach}
                style={{ width: '100%' }}
              />
            </View>
          )}
        </ScrollView>

        {/* Bottom Input & Reassurance Area */}
        {currentTurn < turnCap && (
          <View style={[styles.bottomInputContainer, { backgroundColor: colors.surface1, borderTopColor: colors.line }]}>
            {/* Reassurance Banner */}
            <Text role="bodySmall" muted style={styles.reassuranceText}>
              {todayCopy.warmup.noWrongAnswers}
            </Text>

            {/* Suggested Reply Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              {activeSuggestions.map((suggestion) => (
                <Chip
                  key={suggestion}
                  label={suggestion}
                  tint="lilac"
                  onPress={() => handleSendMessage(suggestion)}
                  style={styles.suggestionChip}
                />
              ))}
            </ScrollView>

            {/* Input Row */}
            <View style={styles.inputRow}>
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder={todayCopy.warmup.placeholder}
                placeholderTextColor={colors.muted}
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.surface2,
                    borderColor: colors.line,
                    color: colors.ink,
                    borderRadius: radii.md,
                  },
                ]}
                accessibilityLabel={todayCopy.warmup.placeholder}
              />

              <Button
                variant="primary"
                label={todayCopy.warmup.sendButton}
                disabled={!inputText.trim() || isTyping}
                onPress={() => handleSendMessage()}
                accessibilityLabel={todayCopy.warmup.sendButton}
                style={styles.sendButton}
              />
            </View>

            {/* Pass option */}
            <Pressable
              onPress={handlePass}
              accessibilityRole="button"
              accessibilityLabel={todayCopy.warmup.passLink}
              style={styles.passLink}
            >
              <Text role="bodySmall" muted style={{ textDecorationLine: 'underline' }}>
                {todayCopy.warmup.passLink}
              </Text>
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerPartnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTextContainer: {
    flex: 1,
    gap: 2,
  },
  messagesContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 10,
  },
  typingContainer: {
    alignSelf: 'flex-start',
    marginVertical: 4,
  },
  completedNoticeContainer: {
    marginTop: 20,
    paddingHorizontal: 8,
  },
  bottomInputContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
    borderTopWidth: 1,
    gap: 8,
  },
  reassuranceText: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 16,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  suggestionChip: {
    marginRight: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    minHeight: 48,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  sendButton: {
    minWidth: 80,
  },
  passLink: {
    alignItems: 'center',
    paddingVertical: 4,
    minHeight: 32,
    justifyContent: 'center',
  },
});
