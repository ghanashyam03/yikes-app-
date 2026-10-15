import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Switch, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/ui/primitives/Screen';
import { Text } from '../../src/ui/primitives/Text';
import { Button } from '../../src/ui/primitives/Button';
import { Card } from '../../src/ui/primitives/Card';
import { BottomSheet } from '../../src/ui/components/BottomSheet';
import { useTheme } from '../../src/theme/useTheme';
import { useSession } from '../../src/features/auth/useSession';
import { saveConsents, type ConsentsState } from '../../src/features/auth/consentManager';
import { authCopy } from '../../src/copy/auth';

interface LearnMoreContent {
  title: string;
  detail: string;
}

export default function ConsentScreen(): React.JSX.Element {
  const router = useRouter();
  const { colors, accents, spacing } = useTheme();
  const { session } = useSession();

  const [consents, setConsents] = useState<ConsentsState>({
    required: true,
    analytics: false,
    improve_ai: false,
    marketing: false
  });

  const [sheetContent, setSheetContent] = useState<LearnMoreContent | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const toggleConsent = (key: keyof ConsentsState) => {
    if (key === 'required') return; // Cannot disable required
    setConsents((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleContinue = async () => {
    setIsSaving(true);
    const userId = session?.user?.id;
    if (userId) {
      await saveConsents(userId, consents);
    }
    setIsSaving(false);
    router.push('/(auth)/age');
  };

  const cards = [
    {
      key: 'required' as const,
      copy: authCopy.consent.required,
      alwaysOn: true
    },
    {
      key: 'analytics' as const,
      copy: authCopy.consent.analytics,
      alwaysOn: false
    },
    {
      key: 'improve_ai' as const,
      copy: authCopy.consent.improveAi,
      alwaysOn: false
    },
    {
      key: 'marketing' as const,
      copy: authCopy.consent.marketing,
      alwaysOn: false
    }
  ];

  return (
    <Screen style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text role="titleLarge" style={[styles.title, { color: colors.ink }]}>
            {authCopy.consent.title}
          </Text>
          <Text role="bodyLarge" muted style={styles.subtitle}>
            {authCopy.consent.subtitle}
          </Text>
        </View>

        <View style={styles.cardsContainer}>
          {cards.map(({ key, copy, alwaysOn }) => {
            const isChecked = consents[key];
            return (
              <Card key={key} tint="neutral" style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.titleArea}>
                    <Text role="titleMedium" style={{ color: colors.ink, fontWeight: '700' }}>
                      {copy.title}
                    </Text>
                    {alwaysOn && (
                      <Text role="bodySmall" style={{ color: accents.ember.base, fontWeight: '600' }}>
                        (Always on)
                      </Text>
                    )}
                  </View>

                  <View style={styles.switchWrapper}>
                    <Switch
                      value={isChecked}
                      onValueChange={() => toggleConsent(key)}
                      disabled={alwaysOn}
                      trackColor={{ false: colors.line, true: accents.ember.base }}
                      thumbColor={colors.surface1}
                      accessibilityRole="switch"
                      accessibilityLabel={`${copy.title} consent`}
                      accessibilityState={{ checked: isChecked, disabled: alwaysOn }}
                    />
                  </View>
                </View>

                <Text role="bodySmall" muted style={styles.cardDescription}>
                  {copy.description}
                </Text>

                <Pressable
                  onPress={() => setSheetContent({ title: copy.title, detail: copy.detail })}
                  accessibilityRole="button"
                  accessibilityLabel={`${authCopy.consent.learnMore} about ${copy.title}`}
                  style={styles.learnMoreButton}
                >
                  <Text role="bodySmall" style={{ color: accents.ember.base, fontWeight: '600' }}>
                    {authCopy.consent.learnMore}
                  </Text>
                </Pressable>
              </Card>
            );
          })}
        </View>

        <View style={[styles.footer, { paddingBottom: spacing[8] }]}>
          <Button
            variant="primary"
            label={authCopy.consent.continue}
            loading={isSaving}
            onPress={handleContinue}
            accessibilityLabel={authCopy.consent.continue}
            style={styles.continueButton}
          />
        </View>
      </ScrollView>

      <BottomSheet
        visible={sheetContent !== null}
        onDismiss={() => setSheetContent(null)}
        {...(sheetContent?.title ? { title: sheetContent.title } : {})}
      >
        <View style={styles.sheetBody}>
          <Text role="bodyMedium" style={{ color: colors.ink, lineHeight: 22, marginBottom: 20 }}>
            {sheetContent?.detail}
          </Text>
          <Button
            variant="secondary"
            label={authCopy.consent.closeSheet}
            onPress={() => setSheetContent(null)}
            accessibilityLabel={authCopy.consent.closeSheet}
          />
        </View>
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    justifyContent: 'space-between'
  },
  header: {
    marginBottom: 24,
    alignItems: 'center'
  },
  title: {
    textAlign: 'center',
    marginBottom: 8
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 22
  },
  cardsContainer: {
    gap: 16,
    marginBottom: 24
  },
  card: {
    padding: 16
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  titleArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1
  },
  switchWrapper: {
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cardDescription: {
    lineHeight: 18,
    marginBottom: 8
  },
  learnMoreButton: {
    minHeight: 48,
    justifyContent: 'center'
  },
  footer: {
    width: '100%',
    alignItems: 'center'
  },
  continueButton: {
    width: '100%'
  },
  sheetBody: {
    padding: 16
  }
});
