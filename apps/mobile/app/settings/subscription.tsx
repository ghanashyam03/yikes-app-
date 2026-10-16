import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { billingCopy } from '../../src/copy/billing';
import { useBilling } from '../../src/features/billing/useBilling';
import { useTheme } from '../../src/theme/useTheme';
import { BackIcon } from '../../src/ui/icons/BackIcon';
import { CheckIcon } from '../../src/ui/icons/CheckIcon';
import { Button } from '../../src/ui/primitives/Button';
import { Card } from '../../src/ui/primitives/Card';
import { Chip } from '../../src/ui/primitives/Chip';
import { Screen } from '../../src/ui/primitives/Screen';
import { Text } from '../../src/ui/primitives/Text';

export default function SettingsSubscriptionScreen(): React.JSX.Element {
  const router = useRouter();
  const { colors, accents, spacing, radii } = useTheme();

  const {
    currentPlan,
    offerings,
    selectedOfferingId,
    setSelectedOfferingId,
    purchase,
    restorePurchases,
    isLoading,
    fetchOfferings,
  } = useBilling();

  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchOfferings();
  }, [fetchOfferings]);

  const selectedOffering =
    offerings.find((o) => o.id === selectedOfferingId) ?? offerings[0];
  const localPrice = selectedOffering?.priceString ?? billingCopy.subscription.pricing.placeholderPrice;

  const handleTryFree = async () => {
    setFeedbackMessage(null);
    const result = await purchase();
    if (result.success && result.isPlus) {
      setFeedbackMessage(billingCopy.subscription.actions.restoredSuccess);
    }
  };

  const handleRestore = async () => {
    setFeedbackMessage(billingCopy.subscription.actions.restoring);
    const result = await restorePurchases();
    if (result.success && result.isPlus) {
      setFeedbackMessage(billingCopy.subscription.actions.restoredSuccess);
    } else {
      setFeedbackMessage(billingCopy.subscription.actions.restoreNotFound);
    }
  };

  const handleManageSubscription = async () => {
    const storeUrl =
      Platform.OS === 'ios'
        ? 'https://apps.apple.com/account/subscriptions'
        : 'https://play.google.com/store/account/subscriptions';
    try {
      await Linking.openURL(storeUrl);
    } catch {
      setFeedbackMessage(billingCopy.subscription.pricing.cancelAnytime);
    }
  };

  const copy = billingCopy.subscription;

  return (
    <Screen>
      <View testID="settings-subscription-screen" style={styles.container}>
        {/* Header */}
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
            testID="subscription-back-button"
          >
            <BackIcon size={20} color={colors.ink} />
          </Pressable>
          <Text role="titleMedium" color={colors.ink} style={styles.headerTitle}>
            {copy.title}
          </Text>
          <View style={styles.backButtonPlaceholder} />
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { padding: spacing[4], gap: spacing[4] },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Subtitle & Local Currency Price Highlight */}
          <View style={styles.titleSection}>
            <Text role="bodyLarge" color={colors.muted}>
              {copy.subtitle}
            </Text>
            <View
              style={[
                styles.pricePill,
                {
                  backgroundColor: colors.surface2,
                  borderColor: colors.line,
                  borderRadius: radii.pill,
                  paddingHorizontal: spacing[3],
                  paddingVertical: spacing[2],
                  marginTop: spacing[2],
                },
              ]}
            >
              <Text role="labelSmall" color={accents.honey.pop} style={{ fontWeight: '700' }}>
                {copy.pricing.trialDuration} · {localPrice}/month · Cancel anytime
              </Text>
            </View>
          </View>

          {/* Offering Selector Chips */}
          {offerings.length > 1 && (
            <View style={[styles.offeringsRow, { gap: spacing[2] }]}>
              {offerings.map((offering) => {
                const isSelected = offering.id === selectedOfferingId;
                return (
                  <Chip
                    key={offering.id}
                    label={`${offering.period === 'annual' ? 'Yearly' : 'Monthly'} (${offering.priceString})`}
                    selected={isSelected}
                    onPress={() => setSelectedOfferingId(offering.id)}
                  />
                );
              })}
            </View>
          )}

          {/* 3-Card Comparison */}
          {/* Card 1: Free Tier */}
          <Card
            tint="neutral"
            selected={currentPlan === 'free'}
            style={styles.planCard}
          >
            <View style={styles.cardHeaderRow}>
              <Text role="titleMedium" color={colors.ink} style={{ fontWeight: '800' }}>
                {copy.cards.free.title}
              </Text>
              {currentPlan === 'free' && (
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: accents.mint.tint,
                      borderColor: colors.line,
                      borderRadius: radii.pill,
                    },
                  ]}
                >
                  <Text role="labelSmall" color={accents.mint.pop} style={{ fontWeight: '700' }}>
                    {copy.cards.free.badge}
                  </Text>
                </View>
              )}
            </View>
            <Text role="bodySmall" color={colors.muted} style={{ marginTop: spacing[1] }}>
              {copy.cards.free.description}
            </Text>
            <View style={[styles.featureList, { marginTop: spacing[3], gap: spacing[2] }]}>
              {copy.cards.free.features.map((feat, idx) => (
                <View key={idx} style={styles.featureItem}>
                  <CheckIcon size={16} color={accents.mint.pop} />
                  <Text role="bodySmall" color={colors.ink} style={styles.featureText}>
                    {feat}
                  </Text>
                </View>
              ))}
            </View>
          </Card>

          {/* Card 2: Plus Tier */}
          <Card
            tint="ember"
            selected={currentPlan === 'plus'}
            style={styles.planCard}
          >
            <View style={styles.cardHeaderRow}>
              <View>
                <Text role="titleMedium" color={colors.ink} style={{ fontWeight: '800' }}>
                  {copy.cards.plus.title}
                </Text>
                <Text role="bodySmall" color={colors.muted} style={{ marginTop: 2 }}>
                  {localPrice} / month after 7-day trial
                </Text>
              </View>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: accents.ember.tint,
                    borderColor: colors.line,
                    borderRadius: radii.pill,
                  },
                ]}
              >
                <Text role="labelSmall" color={accents.ember.pop} style={{ fontWeight: '700' }}>
                  {currentPlan === 'plus' ? 'Active' : copy.cards.plus.badge}
                </Text>
              </View>
            </View>
            <Text role="bodySmall" color={colors.muted} style={{ marginTop: spacing[1] }}>
              {copy.cards.plus.description}
            </Text>
            <View style={[styles.featureList, { marginTop: spacing[3], gap: spacing[2] }]}>
              {copy.cards.plus.features.map((feat, idx) => (
                <View key={idx} style={styles.featureItem}>
                  <CheckIcon size={16} color={accents.ember.pop} />
                  <Text role="bodySmall" color={colors.ink} style={styles.featureText}>
                    {feat}
                  </Text>
                </View>
              ))}
            </View>
          </Card>

          {/* Card 3: Our Promise / Philosophy */}
          <Card
            tint="honey"
            tilted
            tiltAngle={1.2}
            style={styles.planCard}
          >
            <View style={styles.cardHeaderRow}>
              <Text role="titleMedium" color={colors.ink} style={{ fontWeight: '800' }}>
                {copy.cards.philosophy.title}
              </Text>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: accents.honey.tint,
                    borderColor: colors.line,
                    borderRadius: radii.pill,
                  },
                ]}
              >
                <Text role="labelSmall" color={accents.honey.pop} style={{ fontWeight: '700' }}>
                  {copy.cards.philosophy.badge}
                </Text>
              </View>
            </View>
            <Text role="bodySmall" color={colors.muted} style={{ marginTop: spacing[1] }}>
              {copy.cards.philosophy.description}
            </Text>
            <View style={[styles.featureList, { marginTop: spacing[3], gap: spacing[2] }]}>
              {copy.cards.philosophy.features.map((feat, idx) => (
                <View key={idx} style={styles.featureItem}>
                  <CheckIcon size={16} color={accents.honey.pop} />
                  <Text role="bodySmall" color={colors.ink} style={styles.featureText}>
                    {feat}
                  </Text>
                </View>
              ))}
            </View>
          </Card>

          {/* Feedback / Status Notice */}
          {feedbackMessage && (
            <View
              style={[
                styles.feedbackBox,
                {
                  backgroundColor: accents.honey.tint,
                  borderColor: colors.line,
                  borderRadius: radii.card,
                  padding: spacing[3],
                },
              ]}
              testID="billing-feedback-message"
            >
              <Text role="bodySmall" color={accents.honey.pop} style={{ textAlign: 'center' }}>
                {feedbackMessage}
              </Text>
            </View>
          )}

          {/* STRICT EQUAL VISUAL WEIGHT BUTTONS: NO DARK PATTERNS */}
          <View style={[styles.actionButtonsRow, { gap: spacing[3] }]}>
            <View style={styles.equalActionButtonContainer} testID="subscription-not-now-container">
              <Button
                variant="secondary"
                label={copy.actions.notNow}
                onPress={() => router.back()}
                accessibilityLabel={copy.actions.notNow}
                style={styles.equalButton}
              />
            </View>
            <View style={styles.equalActionButtonContainer} testID="subscription-try-free-container">
              <Button
                variant="primary"
                label={currentPlan === 'plus' ? 'Active' : copy.actions.tryFree}
                disabled={currentPlan === 'plus' || isLoading}
                loading={isLoading}
                onPress={handleTryFree}
                accessibilityLabel={copy.actions.tryFree}
                style={styles.equalButton}
              />
            </View>
          </View>

          {/* Cancellation & Restore Links */}
          <View style={[styles.linksSection, { marginTop: spacing[3], gap: spacing[3] }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.actions.manageSubscription}
              onPress={handleManageSubscription}
              style={styles.linkTouchTarget}
              testID="manage-subscription-link"
            >
              <Text role="bodySmall" color={colors.ink} style={styles.linkText}>
                {copy.actions.manageSubscription}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.actions.restorePurchases}
              onPress={handleRestore}
              style={styles.linkTouchTarget}
              testID="restore-purchases-link"
            >
              <Text role="bodySmall" color={colors.muted} style={styles.linkText}>
                {copy.actions.restorePurchases}
              </Text>
            </Pressable>

            <Text
              role="labelSmall"
              color={colors.muted}
              style={[styles.disclaimerText, { textAlign: 'center' }]}
            >
              {copy.pricing.cancelAnytime}
            </Text>
          </View>
        </ScrollView>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontWeight: '700',
  },
  backButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPlaceholder: {
    width: 48,
    height: 48,
  },
  scrollContent: {
    paddingBottom: 48,
  },
  titleSection: {
    alignItems: 'flex-start',
  },
  pricePill: {
    borderWidth: 1,
  },
  offeringsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  planCard: {
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  featureList: {
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    flex: 1,
  },
  feedbackBox: {
    borderWidth: 1,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  equalActionButtonContainer: {
    flex: 1,
  },
  equalButton: {
    minHeight: 48,
    width: '100%',
  },
  linksSection: {
    alignItems: 'center',
  },
  linkTouchTarget: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  linkText: {
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  disclaimerText: {
    lineHeight: 18,
  },
});
