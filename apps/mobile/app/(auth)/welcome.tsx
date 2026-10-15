import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/ui/primitives/Screen';
import { Text } from '../../src/ui/primitives/Text';
import { Button } from '../../src/ui/primitives/Button';
import { Card } from '../../src/ui/primitives/Card';
import { WinceMascot, type WincePose } from '../../src/ui/components/WinceMascot';
import { useTheme } from '../../src/theme/useTheme';
import { authCopy } from '../../src/copy/auth';

const POSES: WincePose[] = ['curious', 'thinking', 'proud'];

export default function WelcomeScreen(): React.JSX.Element {
  const router = useRouter();
  const { colors, accents, spacing, radii } = useTheme();
  const [cardIndex, setCardIndex] = useState(0);

  const cards = authCopy.welcome.cards;
  const currentCard = cards[cardIndex] || cards[0];

  const handleNextCard = () => {
    setCardIndex((prev) => (prev + 1) % cards.length);
  };

  const handleStartQuiz = () => {
    router.push('/(onboarding)/intro');
  };

  const handleAlreadyAccount = () => {
    router.push({
      pathname: '/(auth)/sign-in',
      params: { returning: 'true' }
    });
  };

  return (
    <Screen style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text role="displayLarge" style={[styles.wordmark, { color: colors.ink }]}>
            yikes!
          </Text>
        </View>

        <Pressable
          onPress={handleNextCard}
          accessibilityRole="button"
          accessibilityLabel={`Card ${cardIndex + 1} of ${cards.length}: ${currentCard.title}. Tap to see next.`}
          style={styles.cardPressable}
        >
          <Card tint="neutral" style={styles.card}>
            <View style={styles.mascotContainer}>
              <WinceMascot pose={POSES[cardIndex] || 'curious'} size={72} />
            </View>
            <Text role="titleLarge" style={[styles.cardTitle, { color: colors.ink }]}>
              {currentCard.title}
            </Text>
            <Text role="bodyMedium" muted style={styles.cardSubtitle}>
              {currentCard.subtitle}
            </Text>
          </Card>
        </Pressable>

        <View style={styles.dotsRow} accessibilityRole="tablist">
          {cards.map((card, idx) => {
            const isActive = idx === cardIndex;
            return (
              <Pressable
                key={card.id}
                onPress={() => setCardIndex(idx)}
                accessibilityRole="tab"
                accessibilityLabel={`Story page ${idx + 1}`}
                accessibilityState={{ selected: isActive }}
                style={[
                  styles.dot,
                  {
                    backgroundColor: isActive ? accents.ember.base : colors.line,
                    width: isActive ? 24 : 8,
                    borderRadius: radii.pill
                  }
                ]}
              />
            );
          })}
        </View>

        <View style={[styles.footer, { paddingBottom: spacing[8] }]}>
          <Button
            variant="primary"
            label={authCopy.welcome.startQuiz}
            onPress={handleStartQuiz}
            accessibilityLabel={authCopy.welcome.startQuiz}
            style={styles.actionButton}
          />

          <Pressable
            onPress={handleAlreadyAccount}
            accessibilityRole="button"
            accessibilityLabel={authCopy.welcome.alreadyHaveAccount}
            style={styles.returningButton}
          >
            <Text role="bodyMedium" style={{ color: accents.ember.base, fontWeight: '600' }}>
              {authCopy.welcome.alreadyHaveAccount}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  content: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 32
  },
  header: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24
  },
  wordmark: {
    letterSpacing: -1
  },
  cardPressable: {
    minHeight: 280,
    justifyContent: 'center'
  },
  card: {
    padding: 24,
    alignItems: 'center',
    minHeight: 280,
    justifyContent: 'center'
  },
  mascotContainer: {
    marginBottom: 16
  },
  cardTitle: {
    textAlign: 'center',
    marginBottom: 8
  },
  cardSubtitle: {
    textAlign: 'center',
    lineHeight: 22
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 24,
    gap: 8,
    minHeight: 48
  },
  dot: {
    height: 8
  },
  footer: {
    gap: 16,
    alignItems: 'center'
  },
  actionButton: {
    width: '100%'
  },
  returningButton: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16
  }
});
