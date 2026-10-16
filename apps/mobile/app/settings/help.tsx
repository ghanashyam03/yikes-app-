import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { settingsCopy } from '../../src/copy/settings';
import { ReportAiButton } from '../../src/features/settings/ReportAiButton';
import { useTheme } from '../../src/theme/useTheme';
import { BackIcon } from '../../src/ui/icons/BackIcon';
import { Button } from '../../src/ui/primitives/Button';
import { Card } from '../../src/ui/primitives/Card';
import { Screen } from '../../src/ui/primitives/Screen';
import { Text } from '../../src/ui/primitives/Text';

export default function SettingsHelpScreen(): React.JSX.Element {
  const router = useRouter();
  const { colors, accents, spacing, radii } = useTheme();

  const [faqSearch, setFaqSearch] = useState('');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  const toggleAccordion = (idx: number) => {
    setExpandedIndex((prev) => (prev === idx ? null : idx));
  };

  const handleSendMessage = async () => {
    if (!contactMessage.trim() || !contactEmail.trim()) return;
    setIsSending(true);

    // Simulate sending message or contacting team
    setTimeout(() => {
      setIsSending(false);
      setSendSuccess(true);
      setContactMessage('');
    }, 800);
  };

  const filteredFaqs = useMemo(() => {
    const q = faqSearch.trim().toLowerCase();
    if (!q) return settingsCopy.help.faqs;
    return settingsCopy.help.faqs.filter(
      (f) =>
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q)
    );
  }, [faqSearch]);

  return (
    <Screen>
      <View testID="settings-help-screen" style={{ flex: 1 }}>
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
          testID="help-back-button"
        >
          <BackIcon size={20} color={colors.ink} />
        </Pressable>
        <Text
          role="titleLarge"
          color={colors.ink}
          style={{ fontWeight: '700', marginLeft: spacing[2] }}
        >
          {settingsCopy.help.title}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { padding: spacing[4] }]}
        showsVerticalScrollIndicator={false}
      >
        <Text
          role="bodyMedium"
          color={colors.muted}
          style={{ marginBottom: spacing[4] }}
        >
          {settingsCopy.help.subtitle}
        </Text>

        {/* Report Bad AI Answer Section */}
        <View testID="help-report-ai-card" style={{ marginBottom: spacing[5] }}>
          <Card tint="lilac" style={styles.sectionCard}>
            <Text
              role="titleMedium"
              color={accents.lilac.pop}
              style={{ fontWeight: '700', marginBottom: 4 }}
            >
              {settingsCopy.help.reportSection.title}
            </Text>
            <Text
              role="bodySmall"
              color={colors.ink}
              style={{ marginBottom: spacing[3] }}
            >
              {settingsCopy.help.reportSection.description}
            </Text>
            <ReportAiButton
              buttonLabel={settingsCopy.help.reportSection.buttonLabel}
              variant="secondary"
              testID="help-report-ai-trigger"
            />
          </Card>
        </View>

        {/* FAQs Search */}
        <Text
          role="titleMedium"
          color={colors.ink}
          style={{ fontWeight: '700', marginBottom: spacing[2] }}
        >
          Frequently Asked Questions
        </Text>

        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: colors.surface2,
              borderColor: colors.line,
              borderRadius: radii.pill,
              marginBottom: spacing[3],
            },
          ]}
        >
          <TextInput
            placeholder={settingsCopy.help.searchPlaceholder}
            placeholderTextColor={colors.muted}
            value={faqSearch}
            onChangeText={setFaqSearch}
            style={[styles.searchInput, { color: colors.ink }]}
            testID="faq-search-input"
          />
        </View>

        {/* Accordion FAQ items */}
        {filteredFaqs.map((faq, idx) => {
          const isExpanded = expandedIndex === idx;
          return (
            <View key={faq.question} testID={`faq-item-${idx}`} style={{ marginBottom: spacing[2] }}>
              <Card tint="neutral" style={styles.faqCard}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={faq.question}
                onPress={() => toggleAccordion(idx)}
                style={styles.faqHeaderRow}
                testID={`faq-toggle-${idx}`}
              >
                <Text
                  role="bodyMedium"
                  color={colors.ink}
                  style={{ fontWeight: '600', flex: 1, paddingRight: spacing[2] }}
                >
                  {faq.question}
                </Text>
                <Text role="titleMedium" color={colors.muted}>
                  {isExpanded ? '−' : '+'}
                </Text>
              </Pressable>

              {isExpanded && (
                <Text
                  role="bodySmall"
                  color={colors.muted}
                  style={{ marginTop: spacing[2], lineHeight: 20 }}
                  testID={`faq-answer-${idx}`}
                >
                  {faq.answer}
                </Text>
              )}
            </Card>
          </View>
          );
        })}

        {/* Contact Form Section */}
        <View style={{ marginTop: spacing[5] }}>
          <Text
            role="titleMedium"
            color={colors.ink}
            style={{ fontWeight: '700', marginBottom: 4 }}
          >
            {settingsCopy.help.contact.title}
          </Text>
          <Text
            role="bodySmall"
            color={colors.muted}
            style={{ marginBottom: spacing[3] }}
          >
            {settingsCopy.help.contact.description}
          </Text>

          <Card tint="neutral" style={styles.sectionCard}>
            <TextInput
              placeholder={settingsCopy.help.contact.namePlaceholder}
              placeholderTextColor={colors.muted}
              value={contactName}
              onChangeText={setContactName}
              style={[
                styles.formInput,
                {
                  borderColor: colors.line,
                  color: colors.ink,
                  backgroundColor: colors.surface2,
                  borderRadius: radii.card,
                  marginBottom: spacing[2],
                },
              ]}
              testID="contact-name-input"
            />

            <TextInput
              placeholder={settingsCopy.help.contact.emailPlaceholder}
              placeholderTextColor={colors.muted}
              value={contactEmail}
              onChangeText={setContactEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={[
                styles.formInput,
                {
                  borderColor: colors.line,
                  color: colors.ink,
                  backgroundColor: colors.surface2,
                  borderRadius: radii.card,
                  marginBottom: spacing[2],
                },
              ]}
              testID="contact-email-input"
            />

            <TextInput
              placeholder={settingsCopy.help.contact.messagePlaceholder}
              placeholderTextColor={colors.muted}
              value={contactMessage}
              onChangeText={setContactMessage}
              multiline
              numberOfLines={4}
              style={[
                styles.messageInput,
                {
                  borderColor: colors.line,
                  color: colors.ink,
                  backgroundColor: colors.surface2,
                  borderRadius: radii.card,
                  marginBottom: spacing[3],
                },
              ]}
              testID="contact-message-input"
            />

            {sendSuccess && (
              <Card tint="mint" style={{ marginBottom: spacing[3] }}>
                <Text role="bodySmall" color={accents.mint.pop} style={{ fontWeight: '700' }}>
                  {settingsCopy.help.contact.successToast}
                </Text>
              </Card>
            )}

            <Button
              label={
                isSending
                  ? settingsCopy.help.contact.sendingButton
                  : settingsCopy.help.contact.sendButton
              }
              variant="primary"
              disabled={isSending || !contactEmail.trim() || !contactMessage.trim()}
              onPress={handleSendMessage}
            />
          </Card>
        </View>
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
  },
  searchInput: {
    fontSize: 14,
  },
  faqCard: {
    padding: 14,
  },
  faqHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  formInput: {
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
  },
  messageInput: {
    borderWidth: 1,
    padding: 12,
    minHeight: 88,
    textAlignVertical: 'top',
    fontSize: 14,
  },
});
