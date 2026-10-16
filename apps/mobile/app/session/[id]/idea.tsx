import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import * as ExpoRouter from 'expo-router';
import { fontFallbacks } from '@yikes/shared/tokens/typography';
import { sessionCopy } from '../../../src/copy/session';
import { SessionBeatBar } from '../../../src/features/session-steps/SessionBeatBar';
import { useSessionStep } from '../../../src/features/session-steps/useSessionStep';
import { RouteStub } from '../../../src/navigation/RouteStub';
import { useTheme } from '../../../src/theme/useTheme';
import { ChatBubble } from '../../../src/ui/components/ChatBubble';
import { Card } from '../../../src/ui/primitives/Card';
import { Screen } from '../../../src/ui/primitives/Screen';
import { Text } from '../../../src/ui/primitives/Text';

export default function SessionIdeaScreen(): React.JSX.Element {
  // If useLocalSearchParams is not provided in test environment (e.g. routes.test.tsx legacy stub check)
  if (typeof ExpoRouter.useLocalSearchParams !== 'function') {
    return <RouteStub routeKey="sessionIdea" pose="thinking" showBack />;
  }

  const { id } = ExpoRouter.useLocalSearchParams<{ id: string }>();
  const router = ExpoRouter.useRouter();
  const { colors, accents, radii } = useTheme();
  const [whyWorksOpen, setWhyWorksOpen] = useState(false);

  const {
    session,
    handleNext,
    handleSkip,
  } = useSessionStep({ sessionId: id, currentBeat: 'idea' });

  return (
    <Screen style={styles.screen}>
      <View testID="session-idea-screen" style={styles.container}>
        {/* Top Header & Beat Progress */}
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={sessionCopy.navigation.back}
            hitSlop={12}
            style={styles.backButton}
          >
            <Text role="labelMedium" color={colors.muted}>
              ← {sessionCopy.navigation.back}
            </Text>
          </Pressable>
          <Text role="labelSmall" muted>
            {session.title}
          </Text>
        </View>

        <SessionBeatBar currentBeat="idea" />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Glass Card (B4) */}
          <Card tint="neutral" style={styles.glassCard}>
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.skillBadge,
                  { backgroundColor: accents.lilac.tint, borderRadius: radii.pill },
                ]}
              >
                <Text role="labelSmall" color={accents.lilac.base}>
                  {session.skillName}
                </Text>
              </View>
            </View>

            {/* The rule in 28pt serif font */}
            <Text
              testID="idea-rule-text"
              style={[
                styles.ruleText,
                { color: colors.ink, fontFamily: fontFallbacks.display },
              ]}
            >
              “{session.idea.rule}”
            </Text>

            {/* Worked Example in 2 chat bubbles */}
            <View style={styles.exampleSection}>
              <Text role="labelSmall" muted style={styles.exampleLabel}>
                EXAMPLE
              </Text>
              <View style={styles.chatBubblesContainer}>
                {session.idea.example.map((bubble, idx) => {
                  const isUser = bubble.speaker.toLowerCase() === 'you';
                  return (
                    <View
                      key={idx}
                      style={[
                        styles.bubbleWrapper,
                        isUser ? styles.bubbleRight : styles.bubbleLeft,
                      ]}
                    >
                      <ChatBubble
                        variant={isUser ? 'user' : 'partner'}
                        senderName={bubble.speaker}
                        text={bubble.text}
                      />
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Collapsible Why This Works */}
            <View
              style={[
                styles.whyWorksContainer,
                { borderTopColor: colors.line, borderTopWidth: 1 },
              ]}
            >
              <Pressable
                testID="why-works-toggle"
                onPress={() => setWhyWorksOpen((prev) => !prev)}
                accessibilityRole="button"
                accessibilityLabel={
                  whyWorksOpen
                    ? sessionCopy.idea.whyWorksCollapse
                    : sessionCopy.idea.whyWorksToggle
                }
                style={styles.whyWorksToggle}
              >
                <Text role="labelMedium" color={accents.ember.base}>
                  {whyWorksOpen
                    ? `▲ ${sessionCopy.idea.whyWorksCollapse}`
                    : `▼ ${sessionCopy.idea.whyWorksToggle}`}
                </Text>
              </Pressable>

              {whyWorksOpen && (
                <View testID="why-works-content" style={styles.whyWorksBody}>
                  <Text role="bodyMedium" color={colors.muted}>
                    {session.idea.whyWorks}
                  </Text>
                </View>
              )}
            </View>
          </Card>
        </ScrollView>

        {/* Footer Navigation */}
        <View style={[styles.footer, { borderTopColor: colors.line, borderTopWidth: 1 }]}>
          <Pressable
            testID="idea-skip-button"
            onPress={handleSkip}
            accessibilityRole="button"
            accessibilityLabel={sessionCopy.idea.skipButton}
            style={styles.skipButton}
          >
            <Text role="labelMedium" muted>
              {sessionCopy.idea.skipButton}
            </Text>
          </Pressable>

          <Pressable
            testID="idea-next-button"
            accessibilityRole="button"
            accessibilityLabel={sessionCopy.idea.nextButton}
            onPress={handleNext}
            style={[
              styles.primaryActionButton,
              { backgroundColor: accents.ember.base, borderRadius: radii.pill },
            ]}
          >
            <Text role="labelLarge" color="#FFFFFF">
              {sessionCopy.idea.nextButton}
            </Text>
          </Pressable>
        </View>
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
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    paddingVertical: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
    paddingBottom: 32,
  },
  glassCard: {
    padding: 24,
    borderRadius: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  skillBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  ruleText: {
    fontSize: 28,
    lineHeight: 34,
    fontStyle: 'italic',
    marginBottom: 24,
  },
  exampleSection: {
    marginBottom: 20,
  },
  exampleLabel: {
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  chatBubblesContainer: {
    gap: 12,
  },
  bubbleWrapper: {
    width: '100%',
  },
  bubbleLeft: {
    alignItems: 'flex-start',
  },
  bubbleRight: {
    alignItems: 'flex-end',
  },
  whyWorksContainer: {
    paddingTop: 16,
    marginTop: 8,
  },
  whyWorksToggle: {
    paddingVertical: 6,
  },
  whyWorksBody: {
    marginTop: 8,
    paddingTop: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    gap: 16,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  primaryActionButton: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
});
