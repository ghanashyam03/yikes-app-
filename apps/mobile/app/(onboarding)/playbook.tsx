import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Screen } from '../../src/ui/primitives/Screen';
import { Text } from '../../src/ui/primitives/Text';
import { Button } from '../../src/ui/primitives/Button';
import { Card } from '../../src/ui/primitives/Card';
import { Chip } from '../../src/ui/primitives/Chip';
import { WinceMascot } from '../../src/ui/components/WinceMascot';
import { useTheme } from '../../src/theme/useTheme';
import { onboardingCopy } from '../../src/copy/onboarding';
import {
  DerivedPlaybook,
  derivePlaybook
} from '@yikes/shared/playbook/derivePlaybook';
import { useOnboardingStore } from '../../src/features/onboarding/store';

type EditableTile = 'pace' | 'battery' | 'hardestPlaces' | 'coach' | null;

export default function PlaybookRevealScreen(): React.JSX.Element {
  const router = useRouter();
  const { colors, accents, spacing } = useTheme();

  const answers = useOnboardingStore((s) => s.answers);
  const deeperAnswers = useOnboardingStore((s) => s.deeperAnswers);
  const storedPlaybook = useOnboardingStore((s) => s.derivedPlaybook);
  const updatePlaybookField = useOnboardingStore((s) => s.updatePlaybookField);
  const markCompleted = useOnboardingStore((s) => s.markCompleted);

  const playbook: DerivedPlaybook = storedPlaybook ?? derivePlaybook(answers, deeperAnswers);

  const [activeEditModal, setActiveEditModal] = useState<EditableTile>(null);

  const triggerHaptic = () => {
    try {
      void Haptics.selectionAsync();
    } catch {
      // Haptics optional
    }
  };

  const handleSavePlaybook = () => {
    markCompleted();
    router.push('/(auth)/sign-in');
  };

  const copy = onboardingCopy.playbook;

  return (
    <Screen style={styles.container}>
      {/* Header */}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text role="labelSmall" style={[styles.eyebrow, { color: accents.ember.base }]}>
            {copy.eyebrow}
          </Text>
          <View style={styles.headlineRow}>
            <View style={styles.headlineTextContainer}>
              <Text
                role="displayMedium"
                style={[
                  styles.headline,
                  {
                    color: colors.ink
                  }
                ]}
              >
                {copy.headline}
              </Text>
              <Text role="bodyMedium" muted style={styles.subtitle}>
                {copy.subtitle}
              </Text>
            </View>
            <View style={styles.mascotContainer}>
              <WinceMascot pose="proud" size={68} />
            </View>
          </View>
        </View>

        {/* 5 Playbook Reveal Glass Tiles with Edit Pencils */}
        <View style={styles.tilesContainer}>
          {/* Tile 1: YOUR PACE */}
          <Card tint="lilac" style={styles.glassTile}>
            <View style={styles.tileHeader}>
              <View style={styles.tileTitleRow}>
                <View style={[styles.circleDot, { backgroundColor: accents.lilac.base }]} />
                <Text role="labelSmall" style={[styles.tileBadge, { color: accents.ember.base }]}>
                  {copy.tiles.pace}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  triggerHaptic();
                  setActiveEditModal('pace');
                }}
                accessibilityRole="button"
                accessibilityLabel={copy.editButtonLabel(copy.tiles.pace)}
                style={styles.editButton}
              >
                <Text role="bodyMedium" style={{ color: colors.muted }}>
                  ✏️
                </Text>
              </Pressable>
            </View>
            <Text role="titleMedium" style={[styles.tileValue, { color: colors.ink }]}>
              {playbook.pace.title}
            </Text>
            <Text role="bodySmall" muted>
              {playbook.pace.description}
            </Text>
          </Card>

          {/* Tile 2: YOUR BATTERY (Tilted tile per design) */}
          <View style={styles.tiltedWrapper}>
            <Card tint="mint" style={styles.glassTile}>
              <View style={styles.tileHeader}>
                <View style={styles.tileTitleRow}>
                  <View style={[styles.circleDot, { backgroundColor: accents.mint.base }]} />
                  <Text role="labelSmall" style={[styles.tileBadge, { color: accents.ember.base }]}>
                    {copy.tiles.battery}
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    triggerHaptic();
                    setActiveEditModal('battery');
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={copy.editButtonLabel(copy.tiles.battery)}
                  style={styles.editButton}
                >
                  <Text role="bodyMedium" style={{ color: colors.muted }}>
                    ✏️
                  </Text>
                </Pressable>
              </View>
              <Text role="titleMedium" style={[styles.tileValue, { color: colors.ink }]}>
                {playbook.batteryProfile.title}
              </Text>
              <Text role="bodySmall" muted>
                {playbook.batteryProfile.description}
              </Text>
            </Card>
          </View>

          {/* Tile 3: HARDEST PLACES */}
          <Card tint="honey" style={styles.glassTile}>
            <View style={styles.tileHeader}>
              <View style={styles.tileTitleRow}>
                <View style={[styles.circleDot, { backgroundColor: accents.honey.base }]} />
                <Text role="labelSmall" style={[styles.tileBadge, { color: accents.ember.base }]}>
                  {copy.tiles.hardestPlaces}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  triggerHaptic();
                  setActiveEditModal('hardestPlaces');
                }}
                accessibilityRole="button"
                accessibilityLabel={copy.editButtonLabel(copy.tiles.hardestPlaces)}
                style={styles.editButton}
              >
                <Text role="bodyMedium" style={{ color: colors.muted }}>
                  ✏️
                </Text>
              </Pressable>
            </View>
            <Text role="titleMedium" style={[styles.tileValue, { color: colors.ink }]}>
              {playbook.hardestPlaces.join(' · ')}
            </Text>
          </Card>

          {/* Tile 4: FIRST STEPS */}
          <Card tint="neutral" style={styles.glassTile}>
            <View style={styles.tileHeader}>
              <View style={styles.tileTitleRow}>
                <View style={[styles.circleDot, { backgroundColor: accents.ember.base }]} />
                <Text role="labelSmall" style={[styles.tileBadge, { color: accents.ember.base }]}>
                  {copy.tiles.firstSteps}
                </Text>
              </View>
            </View>
            <Text role="titleMedium" style={[styles.tileValue, { color: colors.ink }]}>
              {playbook.firstSteps.map((s) => s.title).join(' · ')}
            </Text>
            <View style={styles.firstStepsList}>
              {playbook.firstSteps.map((s, idx) => (
                <Text key={s.id} role="bodySmall" muted>
                  {idx + 1}. {s.action}
                </Text>
              ))}
            </View>
          </Card>

          {/* Tile 5: YOUR COACH */}
          <Card tint="lilac" style={styles.glassTile}>
            <View style={styles.tileHeader}>
              <View style={styles.tileTitleRow}>
                <View style={[styles.circleDot, { backgroundColor: accents.lilac.base }]} />
                <Text role="labelSmall" style={[styles.tileBadge, { color: accents.ember.base }]}>
                  {copy.tiles.coach}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  triggerHaptic();
                  setActiveEditModal('coach');
                }}
                accessibilityRole="button"
                accessibilityLabel={copy.editButtonLabel(copy.tiles.coach)}
                style={styles.editButton}
              >
                <Text role="bodyMedium" style={{ color: colors.muted }}>
                  ✏️
                </Text>
              </Pressable>
            </View>
            <Text role="titleMedium" style={[styles.tileValue, { color: colors.ink }]}>
              {playbook.coachTone === 'Gentle'
                ? 'Gentle, supportive reflection'
                : playbook.coachTone === 'Straight'
                  ? 'Straight, direct observation'
                  : 'Funny, warm with a dry smile'}
            </Text>
          </Card>
        </View>

        {/* Ready Notification & Bottom Save Action */}
        <View style={[styles.footer, { paddingBottom: spacing[8] }]}>
          <Text role="labelMedium" style={{ color: accents.mint.base, fontWeight: '700' }}>
            ✓ {copy.readyBadge}
          </Text>

          <Button
            variant="primary"
            label={copy.saveButton}
            onPress={handleSavePlaybook}
            accessibilityLabel={copy.saveButton}
            style={styles.actionButton}
          />
        </View>
      </ScrollView>

      {/* Edit Modal Sheet */}
      <Modal
        visible={activeEditModal !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setActiveEditModal(null)}
      >
        <View style={styles.modalOverlay}>
          <Card tint="neutral" style={styles.modalContent}>
            <Text role="titleMedium" style={[styles.modalTitle, { color: colors.ink }]}>
              {copy.editModal.title}
            </Text>

            {activeEditModal === 'pace' && (
              <View style={styles.modalOptions}>
                {[
                  {
                    title: 'Think first, speak with intent',
                    desc: 'A deliberate pace that gives you space to form your thoughts.'
                  },
                  {
                    title: 'Speak as you think, refine with practice',
                    desc: 'An adaptive pace that turns conversational impulses into polished exchanges.'
                  }
                ].map((item) => (
                  <Chip
                    key={item.title}
                    label={item.title}
                    selected={playbook.pace.title === item.title}
                    tint="lilac"
                    onPress={() => {
                      triggerHaptic();
                      updatePlaybookField('pace', {
                        title: item.title,
                        description: item.desc
                      });
                      setActiveEditModal(null);
                    }}
                    style={styles.modalChip}
                  />
                ))}
              </View>
            )}

            {activeEditModal === 'coach' && (
              <View style={styles.modalOptions}>
                {(['Gentle', 'Straight', 'Funny'] as const).map((tone) => (
                  <Chip
                    key={tone}
                    label={tone}
                    selected={playbook.coachTone === tone}
                    tint="honey"
                    onPress={() => {
                      triggerHaptic();
                      updatePlaybookField('coachTone', tone);
                      setActiveEditModal(null);
                    }}
                    style={styles.modalChip}
                  />
                ))}
              </View>
            )}

            {activeEditModal === 'battery' && (
              <View style={styles.modalOptions}>
                {[
                  {
                    title: 'Quiet time can help after groups',
                    desc: 'Drains quickly in high-stimulation settings. Needs solo recharge time.',
                    drain: 4
                  },
                  {
                    title: 'Steady burn, recharges with quiet time',
                    desc: 'Moderate social energy. Balanced mix of conversation and calm buffers.',
                    drain: 3
                  },
                  {
                    title: 'Resilient social endurance',
                    desc: 'Social battery holds steady across longer gatherings with light recovery.',
                    drain: 2
                  }
                ].map((b) => (
                  <Chip
                    key={b.title}
                    label={b.title}
                    selected={playbook.batteryProfile.title === b.title}
                    tint="mint"
                    onPress={() => {
                      triggerHaptic();
                      updatePlaybookField('batteryProfile', {
                        title: b.title,
                        description: b.desc,
                        drainLevel: b.drain
                      });
                      setActiveEditModal(null);
                    }}
                    style={styles.modalChip}
                  />
                ))}
              </View>
            )}

            {activeEditModal === 'hardestPlaces' && (
              <View style={styles.modalOptions}>
                {[
                  'Work meetings',
                  'Parties',
                  'Calls',
                  'New groups',
                  'Senior people',
                  'Strangers',
                  'Family',
                  'Online chat'
                ].map((place) => {
                  const isSelected = playbook.hardestPlaces.includes(place);
                  return (
                    <Chip
                      key={place}
                      label={place}
                      selected={isSelected}
                      tint="honey"
                      onPress={() => {
                        triggerHaptic();
                        let updated: string[];
                        if (isSelected) {
                          updated = playbook.hardestPlaces.filter((p) => p !== place);
                          if (updated.length === 0) updated = [place];
                        } else {
                          updated = [playbook.hardestPlaces[0] || 'Work meetings', place].slice(-2);
                        }
                        updatePlaybookField('hardestPlaces', updated);
                      }}
                      style={styles.modalChip}
                    />
                  );
                })}
              </View>
            )}

            <Button
              variant="secondary"
              label={copy.editModal.doneButton}
              onPress={() => setActiveEditModal(null)}
              accessibilityLabel={copy.editModal.doneButton}
              style={{ marginTop: 16 }}
            />
          </Card>
        </View>
      </Modal>
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
    paddingTop: 24,
    justifyContent: 'space-between'
  },
  header: {
    marginBottom: 20
  },
  eyebrow: {
    letterSpacing: 1.0,
    fontWeight: '700',
    marginBottom: 8
  },
  headlineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  headlineTextContainer: {
    flex: 1,
    paddingRight: 12
  },
  headline: {
    fontSize: 30,
    lineHeight: 36,
    marginBottom: 8
  },
  subtitle: {
    lineHeight: 20
  },
  mascotContainer: {
    marginTop: 4
  },
  tilesContainer: {
    gap: 14,
    marginVertical: 16
  },
  tiltedWrapper: {
    transform: [{ rotate: '-1.2deg' }]
  },
  glassTile: {
    padding: 18
  },
  tileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  tileTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  circleDot: {
    width: 10,
    height: 10,
    borderRadius: 5
  },
  tileBadge: {
    letterSpacing: 1.0,
    fontWeight: '700'
  },
  editButton: {
    minHeight: 48,
    minWidth: 48,
    justifyContent: 'center',
    alignItems: 'center'
  },
  tileValue: {
    fontWeight: '600',
    marginBottom: 4
  },
  firstStepsList: {
    marginTop: 8,
    gap: 4
  },
  footer: {
    marginTop: 20,
    gap: 14,
    alignItems: 'center'
  },
  actionButton: {
    width: '100%'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    padding: 24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28
  },
  modalTitle: {
    marginBottom: 16,
    textAlign: 'center'
  },
  modalOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center'
  },
  modalChip: {
    marginVertical: 4
  }
});
