import { usePathname, useRouter, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { billingCopy } from '../src/copy/billing';
import { isPaywallForbiddenRoute } from '../src/features/billing/routeGuard';
import { useBilling } from '../src/features/billing/useBilling';
import { useTheme } from '../src/theme/useTheme';
import { CheckIcon } from '../src/ui/icons/CheckIcon';
import { CloseIcon } from '../src/ui/icons/CloseIcon';
import { Button } from '../src/ui/primitives/Button';
import { Card } from '../src/ui/primitives/Card';
import { Screen } from '../src/ui/primitives/Screen';
import { Text } from '../src/ui/primitives/Text';

export interface PaywallProps {
  /** Optional override for testing forbidden route behavior */
  testRoute?: string;
}

export function PaywallContent(props?: PaywallProps): React.JSX.Element | null {
  const router = useRouter();
  const rawPathname = usePathname();
  const searchParams = useLocalSearchParams<{ routeContext?: string; sessions?: string; steps?: string }>();
  const { colors, accents, spacing, radii } = useTheme();

  // Determine the active route to guard against forbidden mounting
  const activeRoute = props?.testRoute ?? searchParams?.routeContext ?? rawPathname;

  // STRICT RULE: Paywall is FORBIDDEN on /session/*/try, /debrief/*, /support, /tools/free-chat
  const isForbidden = isPaywallForbiddenRoute(activeRoute);

  useEffect(() => {
    if (isForbidden) {
      // Immediately dismiss if incorrectly opened on a forbidden route
      try {
        router.back();
      } catch {
        // Safe navigation fallback
      }
    }
  }, [isForbidden, router]);

  const {
    offerings,
    selectedOfferingId,
    journey,
    purchase,
    restorePurchases,
    isLoading,
    fetchOfferings,
  } = useBilling();

  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!isForbidden) {
      fetchOfferings();
    }
  }, [isForbidden, fetchOfferings]);

  if (isForbidden) {
    // Prohibits mounting on chat, debrief, or support routes
    return null;
  }

  const selectedOffering =
    offerings.find((o) => o.id === selectedOfferingId) ?? offerings[0];
  const localPrice = selectedOffering?.priceString ?? billingCopy.subscription.pricing.placeholderPrice;

  const sessionsCount = searchParams?.sessions ? Number(searchParams.sessions) : journey.sessionsCompleted;
  const stepsCount = searchParams?.steps ? Number(searchParams.steps) : journey.realStepsCompleted;

  const copy = billingCopy.paywall;
  const journeyText = copy.journeyBadge
    .replace('{sessionsCount}', String(sessionsCount))
    .replace('{stepsCount}', String(stepsCount));

  const termsText = copy.terms.replace('{price}', localPrice);

  const handleTryFree = async () => {
    setFeedback(null);
    const result = await purchase();
    if (result.success && result.isPlus) {
      router.back();
    }
  };

  const handleRestore = async () => {
    setFeedback(billingCopy.subscription.actions.restoring);
    const result = await restorePurchases();
    if (result.success && result.isPlus) {
      setFeedback(billingCopy.subscription.actions.restoredSuccess);
      router.back();
    } else {
      setFeedback(billingCopy.subscription.actions.restoreNotFound);
    }
  };

  return (
    <Screen>
      <View testID="paywall-sheet" style={styles.sheetContainer}>
        {/* Header / Dismiss Bar */}
        <View
          style={[
            styles.headerRow,
            {
              paddingHorizontal: spacing[4],
              paddingVertical: spacing[3],
              borderBottomColor: colors.line,
            },
          ]}
        >
          <View style={styles.closeButtonPlaceholder} />
          <View
            style={[
              styles.dragIndicator,
              { backgroundColor: colors.muted, borderRadius: radii.pill },
            ]}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close paywall"
            onPress={() => router.back()}
            style={[
              styles.closeButton,
              { backgroundColor: colors.surface2, borderRadius: radii.pill },
            ]}
            testID="paywall-close-button"
          >
            <CloseIcon size={18} color={colors.ink} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { padding: spacing[4], gap: spacing[4] },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* User's Own Journey Badge */}
          <View
            style={[
              styles.journeyBadge,
              {
                backgroundColor: accents.honey.tint,
                borderColor: colors.line,
                borderRadius: radii.pill,
                paddingHorizontal: spacing[3],
                paddingVertical: spacing[2],
              },
            ]}
            testID="paywall-journey-badge"
          >
            <Text
              role="labelSmall"
              color={accents.honey.pop}
              style={{ fontWeight: '700', textAlign: 'center' }}
            >
              🌱 {journeyText}
            </Text>
          </View>

          {/* Headline & Calm Subtitle */}
          <View style={styles.titleSection}>
            <Text role="titleLarge" color={colors.ink} style={styles.headline}>
              {copy.title}
            </Text>
            <Text role="bodyMedium" color={colors.muted} style={{ marginTop: spacing[1] }}>
              {copy.subtitle}
            </Text>
          </View>

          {/* Perks Card */}
          <View testID="paywall-perks-card">
            <Card tint="ember" style={styles.perksCard}>
              <Text role="titleSmall" color={colors.ink} style={{ fontWeight: '700', marginBottom: spacing[2] }}>
                {copy.perksTitle}
              </Text>
            <View style={{ gap: spacing[3] }}>
              {copy.perks.map((perk, idx) => (
                <View key={idx} style={styles.perkItem}>
                  <View
                    style={[
                      styles.perkIconContainer,
                      {
                        backgroundColor: accents.ember.tint,
                        borderRadius: radii.pill,
                      },
                    ]}
                  >
                    <CheckIcon size={16} color={accents.ember.pop} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text role="bodySmall" color={colors.ink} style={{ fontWeight: '700' }}>
                      {perk.title}
                    </Text>
                    <Text role="bodySmall" color={colors.muted} style={{ marginTop: 2 }}>
                      {perk.description}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        </View>

          {/* Price & Reassurance */}
          <View style={[styles.pricingSection, { gap: spacing[1] }]}>
            <Text role="bodyMedium" color={colors.ink} style={{ fontWeight: '700', textAlign: 'center' }}>
              {termsText}
            </Text>
            <Text role="bodySmall" color={colors.muted} style={{ textAlign: 'center' }}>
              {copy.reassurance}
            </Text>
          </View>

          {feedback && (
            <View
              style={[
                styles.feedbackBox,
                {
                  backgroundColor: accents.honey.tint,
                  borderColor: colors.line,
                  borderRadius: radii.card,
                  padding: spacing[2],
                },
              ]}
              testID="paywall-feedback-message"
            >
              <Text role="bodySmall" color={accents.honey.pop} style={{ textAlign: 'center' }}>
                {feedback}
              </Text>
            </View>
          )}

          {/* STRICT EQUAL VISUAL WEIGHT BUTTONS: NO DARK PATTERNS */}
          <View style={[styles.equalButtonsRow, { gap: spacing[3] }]}>
            <View style={styles.equalButtonContainer} testID="paywall-not-now-container">
              <Button
                variant="secondary"
                label={copy.actions.notNow}
                onPress={() => router.back()}
                accessibilityLabel={copy.actions.notNow}
                style={styles.equalButton}
              />
            </View>
            <View style={styles.equalButtonContainer} testID="paywall-try-free-container">
              <Button
                variant="primary"
                label={copy.actions.tryFree}
                onPress={handleTryFree}
                loading={isLoading}
                disabled={isLoading}
                accessibilityLabel={copy.actions.tryFree}
                style={styles.equalButton}
              />
            </View>
          </View>

          {/* Restore Purchases */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.actions.restore}
            onPress={handleRestore}
            style={styles.restoreTouchTarget}
            testID="paywall-restore-button"
          >
            <Text role="bodySmall" color={colors.muted} style={styles.restoreText}>
              {copy.actions.restore}
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </Screen>
  );
}

export default function PaywallModal(): React.JSX.Element | null {
  return <PaywallContent />;
}

const styles = StyleSheet.create({
  sheetContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dragIndicator: {
    width: 36,
    height: 4,
    opacity: 0.4,
  },
  closeButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonPlaceholder: {
    width: 48,
    height: 48,
  },
  scrollContent: {
    paddingBottom: 48,
  },
  journeyBadge: {
    alignSelf: 'center',
    borderWidth: 1,
  },
  titleSection: {
    alignItems: 'center',
  },
  headline: {
    fontWeight: '800',
    textAlign: 'center',
  },
  perksCard: {
    padding: 16,
  },
  perkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  perkIconContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  pricingSection: {
    alignItems: 'center',
  },
  feedbackBox: {
    borderWidth: 1,
  },
  equalButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  equalButtonContainer: {
    flex: 1,
  },
  equalButton: {
    minHeight: 48,
    width: '100%',
  },
  restoreTouchTarget: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restoreText: {
    textDecorationLine: 'underline',
  },
});
