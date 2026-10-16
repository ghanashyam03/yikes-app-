import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import {
  CRISIS_RESOURCES,
  systemCopy,
} from '../src/copy/system';
import { useTheme } from '../src/theme/useTheme';
import { Button } from '../src/ui/primitives/Button';
import { Card } from '../src/ui/primitives/Card';
import { Chip } from '../src/ui/primitives/Chip';
import { Screen } from '../src/ui/primitives/Screen';
import { Text } from '../src/ui/primitives/Text';

export type SupportedCountry = 'India' | 'United States' | 'United Kingdom';

export default function SupportModal(): React.JSX.Element {
  const router = useRouter();
  const { accents, spacing, radii } = useTheme();

  // Primary launch market is India
  const [selectedCountry, setSelectedCountry] = useState<SupportedCountry>('India');

  const filteredResources = CRISIS_RESOURCES.filter(
    (res) => res.country === selectedCountry
  );

  const primaryCallResource = filteredResources.find((r) => r.phone);
  const primaryTextResource = filteredResources.find((r) => r.sms) ?? filteredResources[1];

  const handleCall = async (phone: string) => {
    const url = `tel:${phone.replace(/\s+/g, '')}`;
    try {
      await Linking.openURL(url);
    } catch {
      // Graceful fallback if device cannot place calls
    }
  };

  const handleText = async (smsNumber: string, body?: string) => {
    const separator = PlatformOSSeparator();
    const cleanNumber = smsNumber.replace(/\s+/g, '');
    const url = body
      ? `sms:${cleanNumber}${separator}body=${encodeURIComponent(body)}`
      : `sms:${cleanNumber}`;
    try {
      await Linking.openURL(url);
    } catch {
      // Graceful fallback
    }
  };

  const handleContactTrusted = async () => {
    try {
      await Share.share({
        message: systemCopy.support.shareSheetMessage,
      });
    } catch {
      // Dismissed or unsupported
    }
  };

  const handleOpenLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      // Graceful fallback
    }
  };

  return (
    <Screen
      hideBackdrop
      style={[styles.hushedRoot, { backgroundColor: '#0B0D12' }]}
    >
      <View testID="support-screen" style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { padding: spacing[5] }]}
          showsVerticalScrollIndicator={false}
        >
        {/* Soft Amber Accent Tag */}
        <View
          style={[
            styles.tagContainer,
            {
              backgroundColor: accents.honey.tint,
              borderColor: accents.honey.base,
              borderRadius: radii.pill,
              marginBottom: spacing[3],
            },
          ]}
        >
          <Text
            role="labelSmall"
            color={accents.honey.pop}
            style={{ fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}
          >
            Practice Paused
          </Text>
        </View>

        {/* Human-authored Title (Zero AI text) */}
        <Text
          role="titleLarge"
          color="#F9FAFB"
          style={{ fontWeight: '700', marginBottom: spacing[2], lineHeight: 32 }}
          testID="support-title"
        >
          {systemCopy.support.title}
        </Text>

        {/* Human-authored Subtitle */}
        <Text
          role="bodyMedium"
          color="#9CA3AF"
          style={{ marginBottom: spacing[5], lineHeight: 24 }}
          testID="support-subtitle"
        >
          {systemCopy.support.subtitle}
        </Text>

        {/* Region selector chips */}
        <View style={[styles.regionRow, { marginBottom: spacing[4] }]}>
          {(['India', 'United States', 'United Kingdom'] as SupportedCountry[]).map((c) => (
            <Chip
              key={c}
              label={c === 'United States' ? 'US' : c === 'United Kingdom' ? 'UK' : 'India'}
              selected={selectedCountry === c}
              onPress={() => setSelectedCountry(c)}
              style={{ marginRight: spacing[2] }}
            />
          ))}
        </View>

        {/* Primary Call Helpline Action */}
        {primaryCallResource && primaryCallResource.phone && (
          <Button
            label={systemCopy.support.primaryCallButton(
              primaryCallResource.name,
              primaryCallResource.phoneDisplay ?? primaryCallResource.phone
            )}
            variant="primary"
            onPress={() => handleCall(primaryCallResource.phone!)}
            style={{ marginBottom: spacing[3], width: '100%' }}
          />
        )}

        {/* Primary Text Helpline Action */}
        {primaryTextResource && (primaryTextResource.sms || primaryTextResource.phone) && (
          <Button
            label={
              primaryTextResource.sms
                ? systemCopy.support.primaryTextButton(
                    primaryTextResource.name,
                    primaryTextResource.smsDisplay ?? primaryTextResource.sms
                  )
                : `Contact ${primaryTextResource.name} (${primaryTextResource.phoneDisplay ?? primaryTextResource.phone})`
            }
            variant="secondary"
            onPress={() => {
              if (primaryTextResource.sms) {
                void handleText(primaryTextResource.sms, primaryTextResource.smsBody);
              } else if (primaryTextResource.phone) {
                void handleCall(primaryTextResource.phone);
              }
            }}
            style={{ marginBottom: spacing[3], width: '100%' }}
          />
        )}

        {/* Contact Someone You Trust Action */}
        <Button
          label={systemCopy.support.contactTrustedButton}
          variant="ghost"
          onPress={handleContactTrusted}
          style={{ marginBottom: spacing[5], width: '100%' }}
        />

        {/* Verified Helpline Directory Cards */}
        <Text
          role="labelMedium"
          color="#E5E7EB"
          style={{ fontWeight: '700', marginBottom: spacing[2] }}
        >
          Verified 24/7 Resources
        </Text>

        {filteredResources.map((res) => (
          <View
            key={res.id}
            testID={`helpline-card-${res.id}`}
            style={{ marginBottom: spacing[2] }}
          >
            <Card
              tint="neutral"
              style={[
                styles.resourceCard,
                {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                },
              ]}
            >
            <View style={styles.resourceHeaderRow}>
              <Text role="titleSmall" color="#F9FAFB" style={{ fontWeight: '700' }}>
                {res.name}
              </Text>
              <Text role="labelSmall" color={accents.mint.pop}>
                {res.hours}
              </Text>
            </View>

            <Text role="bodySmall" color="#9CA3AF" style={{ marginTop: 2, marginBottom: spacing[2] }}>
              {res.description}
            </Text>

            <View style={styles.resourceActionsRow}>
              {res.phone && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Call ${res.name} at ${res.phone}`}
                  onPress={() => handleCall(res.phone!)}
                  style={[styles.smallActionBtn, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}
                  testID={`call-link-${res.id}`}
                >
                  <Text role="labelSmall" color="#F9FAFB">
                    📞 {res.phoneDisplay ?? res.phone}
                  </Text>
                </Pressable>
              )}

              {res.sms && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Text ${res.name} at ${res.sms}`}
                  onPress={() => handleText(res.sms!, res.smsBody)}
                  style={[styles.smallActionBtn, { backgroundColor: 'rgba(255, 255, 255, 0.1)', marginLeft: spacing[2] }]}
                  testID={`text-link-${res.id}`}
                >
                  <Text role="labelSmall" color="#F9FAFB">
                    💬 {res.smsDisplay ?? res.sms}
                  </Text>
                </Pressable>
              )}

              {res.website && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Visit ${res.name} website`}
                  onPress={() => handleOpenLink(res.website!)}
                  style={[styles.smallActionBtn, { backgroundColor: 'rgba(255, 255, 255, 0.1)', marginLeft: spacing[2] }]}
                  testID={`web-link-${res.id}`}
                >
                  <Text role="labelSmall" color="#9CA3AF">
                    Website ↗
                  </Text>
                </Pressable>
              )}
            </View>
          </Card>
        </View>
        ))}

        {/* International fallback */}
        <Pressable
          onPress={() => handleOpenLink(systemCopy.support.internationalUrl)}
          style={{ marginTop: spacing[3], marginBottom: spacing[6] }}
          testID="support-international-link"
        >
          <Text role="bodySmall" color="#6B7280" style={{ textAlign: 'center' }}>
            {systemCopy.support.internationalNotice}
          </Text>
        </Pressable>

        {/* Quiet "Back to practice when you're ready" button */}
        <Button
          label={systemCopy.support.backToPracticeButton}
          variant="ghost"
          onPress={() => router.back()}
          style={styles.backButton}
        />
      </ScrollView>
      </View>
    </Screen>
  );
}

function PlatformOSSeparator(): string {
  // In iOS sms query separator is usually '&', in Android '?'
  return '?';
}

const styles = StyleSheet.create({
  hushedRoot: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 48,
  },
  tagContainer: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
  },
  regionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  resourceCard: {
    padding: 14,
    borderWidth: 1,
  },
  resourceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resourceActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  smallActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 4,
  },
  backButton: {
    width: '100%',
    opacity: 0.8,
  },
});
