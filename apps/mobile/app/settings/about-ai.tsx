import { useRouter } from 'expo-router';
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { settingsCopy } from '../../src/copy/settings';
import { useTheme } from '../../src/theme/useTheme';
import { BackIcon } from '../../src/ui/icons/BackIcon';
import { Card } from '../../src/ui/primitives/Card';
import { Screen } from '../../src/ui/primitives/Screen';
import { Text } from '../../src/ui/primitives/Text';

export default function SettingsAboutAiScreen(): React.JSX.Element {
  const router = useRouter();
  const { colors, accents, spacing, radii } = useTheme();

  return (
    <Screen>
      <View testID="settings-about-ai-screen" style={{ flex: 1 }}>
      <View
        style={[
          styles.header,
          {
            borderBottomColor: colors.line,
            paddingHorizontal: spacing[4],
            paddingVertical: spacing[3],
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={[
            styles.backButton,
            { backgroundColor: colors.surface2, borderRadius: radii.pill },
          ]}
          testID="about-ai-back-button"
        >
          <BackIcon size={20} color={colors.ink} />
        </Pressable>
        <Text
          role="titleLarge"
          color={colors.ink}
          style={{ fontWeight: '700', marginLeft: spacing[2] }}
        >
          {settingsCopy.aboutAi.title}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { padding: spacing[4] }]}
        showsVerticalScrollIndicator={false}
      >
        <Text
          role="bodyMedium"
          color={colors.muted}
          style={{ marginBottom: spacing[4], lineHeight: 22 }}
        >
          {settingsCopy.aboutAi.subtitle}
        </Text>

        {settingsCopy.aboutAi.sections.map((section, idx) => (
          <View
            key={section.title}
            testID={`about-ai-card-${idx}`}
            style={{ marginBottom: spacing[3] }}
          >
            <Card
              tint={idx === 3 ? 'honey' : 'neutral'}
              style={styles.sectionCard}
            >
              <Text
                role="titleMedium"
                color={idx === 3 ? accents.honey.pop : colors.ink}
                style={{ fontWeight: '700', marginBottom: spacing[1] }}
              >
                {section.title}
              </Text>
              <Text
                role="bodySmall"
                color={colors.ink}
                style={{ lineHeight: 22 }}
              >
                {section.body}
              </Text>
            </Card>
          </View>
        ))}
      </ScrollView>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  sectionCard: {
    padding: 16,
  },
});
