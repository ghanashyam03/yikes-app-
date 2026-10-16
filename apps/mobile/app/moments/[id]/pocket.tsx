import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { momentsCopy } from '../../../src/copy/moments';
import { useMoments } from '../../../src/features/moments/useMoments';
import { Button } from '../../../src/ui/primitives/Button';
import { Text } from '../../../src/ui/primitives/Text';

export default function MomentPocketCardScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // Read STRICTLY from local cached store without any network request!
  const { getMoment } = useMoments();
  const moment = getMoment(id || '');

  const prep = moment?.prepPayload;

  // Fallback defaults if accessed before prep was completed
  const opener =
    prep?.openerOptions?.[0] || 'Hey, great to see you! How has your day been going?';
  const questions = prep?.questions || [
    'What part of the project has been most interesting lately?',
    'Have you had any downtime this week?',
  ];
  const exitLine =
    prep?.exitLine || "I need to step away to catch my next meeting—great chatting!";
  const quietBreak =
    prep?.quietBreak || 'Step outside for 2 minutes to catch your breath.';

  function handleDone(): void {
    router.push('/energy');
  }

  return (
    <View testID="pocket-card-screen" style={styles.darkContainer}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Pressable
          testID="pocket-back-btn"
          accessibilityRole="button"
          accessibilityLabel="Back to moments"
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <Text role="titleSmall" style={styles.backText}>
            {momentsCopy.pocket.backToMoments}
          </Text>
        </Pressable>

        <View style={styles.badgePill}>
          <Text role="labelSmall" style={styles.badgeText}>
            {momentsCopy.pocket.badge}
          </Text>
        </View>
      </View>

      <ScrollView
        testID="pocket-card-content"
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.titleSection}>
          <Text role="titleMedium" style={styles.momentTitle} numberOfLines={2}>
            {moment?.title || 'Your Pocket Card'}
          </Text>
          <Text role="labelSmall" style={styles.subAdvice}>
            {momentsCopy.pocket.quickAdvice}
          </Text>
        </View>

        {/* Section 1: Opener */}
        <View style={styles.cardSection}>
          <Text role="labelSmall" style={styles.sectionHeader}>
            {momentsCopy.pocket.openerHeading}
          </Text>
          <Text role="titleLarge" style={styles.primaryText} testID="pocket-opener-text">
            "{opener}"
          </Text>
        </View>

        {/* Section 2: Questions to Ask */}
        <View style={styles.cardSection}>
          <Text role="labelSmall" style={styles.sectionHeader}>
            {momentsCopy.pocket.questionsHeading}
          </Text>
          <View style={styles.questionsList}>
            {questions.map((q, idx) => (
              <View key={idx} style={styles.questionItem}>
                <Text role="titleSmall" style={styles.questionBullet}>
                  {idx + 1}.
                </Text>
                <Text
                  role="titleMedium"
                  style={styles.questionText}
                  testID={`pocket-question-${idx}`}
                >
                  "{q}"
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Section 3: Exit Line */}
        <View style={styles.cardSection}>
          <Text role="labelSmall" style={styles.sectionHeader}>
            {momentsCopy.pocket.exitHeading}
          </Text>
          <Text role="titleLarge" style={styles.exitText} testID="pocket-exit-text">
            "{exitLine}"
          </Text>
        </View>

        {/* Section 4: If Draining */}
        {quietBreak ? (
          <View style={[styles.cardSection, styles.quietSection]}>
            <Text role="labelSmall" style={styles.quietHeader}>
              {momentsCopy.pocket.quietBreakHeading}
            </Text>
            <Text role="bodyMedium" style={styles.quietText} testID="pocket-quiet-text">
              {quietBreak}
            </Text>
          </View>
        ) : null}

        {/* Offline Guarantee Note */}
        <Text role="labelSmall" style={styles.offlineNote}>
          {momentsCopy.pocket.offlineNote}
        </Text>
      </ScrollView>

      {/* Bottom Sticky Action */}
      <View style={styles.bottomBar}>
        <Button
          label={momentsCopy.pocket.doneButton}
          variant="primary"
          onPress={handleDone}
          style={styles.doneBtn}
        />
      </View>
    </View>
  );
}

// Dark by default, zero animation, high contrast stealth theme
const styles = StyleSheet.create({
  darkContainer: {
    flex: 1,
    backgroundColor: '#090B10', // Deep stealth black
    paddingTop: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A202C',
  },
  backBtn: {
    paddingVertical: 4,
  },
  backText: {
    color: '#94A3B8',
  },
  badgePill: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: '#34D399', // Mint
    fontSize: 11,
    fontWeight: '700',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 22,
  },
  titleSection: {
    marginBottom: 4,
  },
  momentTitle: {
    color: '#F8FAFC',
    fontWeight: '700',
    fontSize: 20,
  },
  subAdvice: {
    color: '#64748B',
    marginTop: 4,
  },
  cardSection: {
    backgroundColor: '#131822',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  sectionHeader: {
    color: '#38BDF8', // Cyan / subtle blue highlight
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 10,
    fontSize: 11,
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: '600',
    lineHeight: 28,
  },
  questionsList: {
    gap: 12,
  },
  questionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  questionBullet: {
    color: '#A78BFA', // Lilac
    fontWeight: '700',
    width: 20,
    marginTop: 2,
  },
  questionText: {
    flex: 1,
    color: '#F1F5F9',
    lineHeight: 24,
  },
  exitText: {
    color: '#E2E8F0',
    lineHeight: 26,
    fontStyle: 'italic',
  },
  quietSection: {
    backgroundColor: '#141E1C',
    borderColor: '#064E3B',
  },
  quietHeader: {
    color: '#34D399',
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
    fontSize: 11,
  },
  quietText: {
    color: '#E2E8F0',
    lineHeight: 22,
  },
  offlineNote: {
    color: '#475569',
    textAlign: 'center',
    marginVertical: 4,
    fontSize: 12,
  },
  bottomBar: {
    padding: 20,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: '#1A202C',
    backgroundColor: '#090B10',
  },
  doneBtn: {
    width: '100%',
  },
});
