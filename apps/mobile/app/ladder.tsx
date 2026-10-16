import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { youCopy } from '../src/copy/you';
import { useSession } from '../src/features/auth/useSession';
import { useLadder } from '../src/features/ladder/useLadder';
import type { LadderRung } from '../src/features/ladder/types';
import { useTheme } from '../src/theme/useTheme';
import { EmptyState } from '../src/ui/components/EmptyState';
import { Button } from '../src/ui/primitives/Button';
import { Card } from '../src/ui/primitives/Card';
import { Screen } from '../src/ui/primitives/Screen';
import { Text } from '../src/ui/primitives/Text';

export default function LadderScreen(): React.JSX.Element {
  const router = useRouter();
  const { colors, accents, radii } = useTheme();
  const { session } = useSession();
  const userId = session?.user?.id;

  const {
    rungs,
    isSuggesting,
    seedLadder,
    moveUp,
    moveDown,
    addRung,
    editRung,
    toggleDone,
    suggestNextRung,
    fetchRungs,
  } = useLadder();

  const [expandedRungId, setExpandedRungId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newRungTitle, setNewRungTitle] = useState('');
  const [editingRung, setEditingRung] = useState<LadderRung | null>(null);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    void fetchRungs(userId);
  }, [userId, fetchRungs]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/you');
    }
  };

  // The first uncompleted rung is the "Current" rung
  const currentRungId = rungs.find((r) => !r.completed)?.id ?? null;

  const handleToggleExpand = (id: string) => {
    setExpandedRungId((prev) => (prev === id ? null : id));
  };

  const handleSaveNewRung = async () => {
    if (!newRungTitle.trim()) return;
    await addRung(newRungTitle.trim(), undefined, undefined, false, userId);
    setNewRungTitle('');
    setIsAddModalOpen(false);
  };

  const handleSaveEditRung = async () => {
    if (!editingRung || !editTitle.trim()) return;
    await editRung(editingRung.id, editTitle.trim(), userId);
    setEditingRung(null);
    setEditTitle('');
  };

  const handleAiSuggest = async () => {
    await suggestNextRung(
      {
        communicationStyle: 'Direct and calm',
        scenarioWorld: 'workplace',
        coachTone: 'gentle',
      },
      session?.accessToken
    );
  };

  return (
    <Screen style={styles.screen}>
      <ScrollView
        testID="ladder-screen-scroll"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            testID="ladder-back-button"
            accessibilityRole="button"
            accessibilityLabel={youCopy.skill.backButton}
            onPress={handleBack}
            style={[styles.backButton, { backgroundColor: colors.surface1, borderColor: colors.line }]}
          >
            <Text role="labelLarge" style={{ color: colors.ink }}>
              ←
            </Text>
          </Pressable>
          <View style={styles.headerTitles}>
            <Text role="titleLarge" style={[styles.title, { color: colors.ink }]}>
              {youCopy.ladder.title}
            </Text>
            <Text role="bodySmall" style={{ color: colors.muted }}>
              {youCopy.ladder.subtitle}
            </Text>
          </View>
        </View>

        {/* Action Controls Bar */}
        <View style={styles.controlsBar}>
          <Pressable
            testID="add-rung-button"
            accessibilityRole="button"
            accessibilityLabel={youCopy.ladder.addRungButton}
            onPress={() => setIsAddModalOpen(true)}
            style={[styles.actionBtn, { backgroundColor: colors.surface1, borderColor: colors.line }]}
          >
            <Text role="labelMedium" style={{ color: colors.ink }}>
              + {youCopy.ladder.addRungButton}
            </Text>
          </Pressable>

          <Pressable
            testID="suggest-next-rung-button"
            accessibilityRole="button"
            accessibilityLabel={youCopy.ladder.suggestNextButton}
            onPress={handleAiSuggest}
            disabled={isSuggesting}
            style={[
              styles.actionBtn,
              {
                backgroundColor: accents.honey.tint,
                borderColor: accents.honey.base,
              },
            ]}
          >
            {isSuggesting ? (
              <ActivityIndicator size="small" color={accents.honey.pop} />
            ) : (
              <Text role="labelMedium" style={{ color: accents.honey.pop, fontWeight: '700' }}>
                ✨ {youCopy.ladder.suggestNextButton}
              </Text>
            )}
          </Pressable>
        </View>

        {/* Empty State */}
        {rungs.length === 0 ? (
          <View style={styles.emptyContainer} testID="ladder-empty-state">
            <EmptyState
              pose="thinking"
              title={youCopy.ladder.title}
              description={youCopy.ladder.emptyState}
              actionLabel={youCopy.ladder.emptyAction}
              onAction={() => seedLadder()}
            />
          </View>
        ) : (
          <View style={styles.rungsList} testID="rungs-container">
            {rungs.map((rung, index) => {
              const isCurrent = rung.id === currentRungId;
              const isExpanded = rung.id === expandedRungId;

              return (
                <View key={rung.id} testID={`ladder-rung-${rung.id}`}>
                  <Card
                    style={[
                      styles.rungCard,
                      isCurrent && {
                        borderColor: accents.honey.base,
                        borderWidth: 2,
                      },
                    ]}
                  >
                  <View style={styles.rungHeaderRow}>
                    {/* Sort Order Number Badge */}
                    <View
                      style={[
                        styles.orderCircle,
                        {
                          backgroundColor: rung.completed
                            ? accents.mint.base
                            : isCurrent
                            ? accents.honey.base
                            : colors.surface2,
                        },
                      ]}
                    >
                      <Text
                        role="labelSmall"
                        style={{
                          color: rung.completed || isCurrent ? colors.surface1 : colors.ink,
                          fontWeight: '700',
                        }}
                      >
                        {rung.completed ? '✓' : rung.sortOrder}
                      </Text>
                    </View>

                    {/* Title & Badges */}
                    <Pressable
                      style={styles.rungTitleContainer}
                      onPress={() => handleToggleExpand(rung.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`Rung ${rung.sortOrder}: ${rung.title}. Tap to toggle details.`}
                    >
                      <View style={styles.badgeRow}>
                        {isCurrent && (
                          <View
                            style={[styles.miniBadge, { backgroundColor: accents.honey.tint }]}
                            testID={`current-rung-badge-${rung.id}`}
                          >
                            <Text role="labelSmall" style={{ color: accents.honey.pop, fontWeight: '700' }}>
                              {youCopy.ladder.currentRungBadge}
                            </Text>
                          </View>
                        )}
                        {rung.completed && (
                          <View
                            style={[styles.miniBadge, { backgroundColor: accents.mint.tint }]}
                            testID={`completed-rung-badge-${rung.id}`}
                          >
                            <Text role="labelSmall" style={{ color: accents.mint.base, fontWeight: '700' }}>
                              {youCopy.ladder.completedBadge}
                            </Text>
                          </View>
                        )}
                        {rung.isAiSuggested && (
                          <View style={[styles.miniBadge, { backgroundColor: accents.lilac.tint }]}>
                            <Text role="labelSmall" style={{ color: accents.lilac.base, fontWeight: '600' }}>
                              {youCopy.ladder.aiBadge}
                            </Text>
                          </View>
                        )}
                      </View>

                      <Text
                        role="titleSmall"
                        style={[
                          styles.rungTitle,
                          {
                            color: colors.ink,
                            textDecorationLine: rung.completed ? 'line-through' : 'none',
                          },
                        ]}
                      >
                        {rung.title}
                      </Text>
                    </Pressable>

                    {/* Reorder Buttons (Up / Down) */}
                    <View style={styles.reorderButtons}>
                      <Pressable
                        testID={`move-up-${rung.id}`}
                        accessibilityRole="button"
                        accessibilityLabel={`${youCopy.ladder.moveUp} rung ${rung.sortOrder}`}
                        disabled={index === 0}
                        onPress={() => void moveUp(index, userId)}
                        style={[styles.arrowButton, index === 0 && { opacity: 0.3 }]}
                      >
                        <Text role="labelLarge" style={{ color: colors.ink }}>
                          ▲
                        </Text>
                      </Pressable>

                      <Pressable
                        testID={`move-down-${rung.id}`}
                        accessibilityRole="button"
                        accessibilityLabel={`${youCopy.ladder.moveDown} rung ${rung.sortOrder}`}
                        disabled={index === rungs.length - 1}
                        onPress={() => void moveDown(index, userId)}
                        style={[styles.arrowButton, index === rungs.length - 1 && { opacity: 0.3 }]}
                      >
                        <Text role="labelLarge" style={{ color: colors.ink }}>
                          ▼
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <View style={styles.expandedContent} testID={`rung-expanded-${rung.id}`}>
                      {rung.microRepSuggestion && (
                        <View style={styles.detailBlock}>
                          <Text role="labelSmall" style={{ color: accents.mint.base, fontWeight: '600' }}>
                            {youCopy.ladder.microRepSuggestionLabel}:
                          </Text>
                          <Text role="bodySmall" style={{ color: colors.ink, marginTop: 2 }}>
                            {rung.microRepSuggestion}
                          </Text>
                        </View>
                      )}

                      {rung.rationale && (
                        <View style={styles.detailBlock}>
                          <Text role="labelSmall" style={{ color: colors.muted }}>
                            {youCopy.ladder.rationaleLabel}:
                          </Text>
                          <Text role="bodySmall" style={{ color: colors.muted, marginTop: 2 }}>
                            {rung.rationale}
                          </Text>
                        </View>
                      )}

                      <View style={styles.expandedActions}>
                        {/* Mark Done / Reopen Button */}
                        <Pressable
                          testID={`toggle-done-button-${rung.id}`}
                          accessibilityRole="button"
                          accessibilityLabel={
                            rung.completed
                              ? youCopy.ladder.markUndone
                              : youCopy.ladder.markDone
                          }
                          onPress={() => void toggleDone(rung.id, userId)}
                          style={[
                            styles.toggleDoneBtn,
                            {
                              backgroundColor: rung.completed
                                ? colors.surface2
                                : accents.mint.base,
                            },
                          ]}
                        >
                          <Text
                            role="labelMedium"
                            style={{
                              color: rung.completed ? colors.ink : colors.surface1,
                              fontWeight: '700',
                            }}
                          >
                            {rung.completed ? youCopy.ladder.markUndone : youCopy.ladder.markDone}
                          </Text>
                        </Pressable>

                        {/* Rewrite in own words Button */}
                        <Pressable
                          testID={`edit-rung-button-${rung.id}`}
                          accessibilityRole="button"
                          accessibilityLabel={youCopy.ladder.editRungTitle}
                          onPress={() => {
                            setEditingRung(rung);
                            setEditTitle(rung.title);
                          }}
                          style={[styles.rewriteBtn, { borderColor: colors.line }]}
                        >
                          <Text role="labelMedium" style={{ color: colors.ink }}>
                            ✎ Rewrite
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  )}
                </Card>
              </View>
              );
            })}
          </View>
        )}

        {/* Add Rung Modal */}
        <Modal
          visible={isAddModalOpen}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsAddModalOpen(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface1, borderRadius: radii.card }]}>
              <Text role="titleMedium" style={{ color: colors.ink, fontWeight: '700', marginBottom: 12 }}>
                {youCopy.ladder.addRungTitle}
              </Text>
              <TextInput
                testID="new-rung-input"
                style={[
                  styles.textInput,
                  { color: colors.ink, borderColor: colors.line, backgroundColor: colors.surface2 },
                ]}
                placeholder={youCopy.ladder.addRungPlaceholder}
                placeholderTextColor={colors.muted}
                value={newRungTitle}
                onChangeText={setNewRungTitle}
                autoFocus
              />
              <View style={styles.modalButtons}>
                <Button
                  label={youCopy.ladder.cancel}
                  onPress={() => setIsAddModalOpen(false)}
                  variant="secondary"
                />
                <View testID="save-new-rung-button">
                  <Button
                    label={youCopy.ladder.saveRung}
                    onPress={handleSaveNewRung}
                    variant="primary"
                  />
                </View>
              </View>
            </View>
          </View>
        </Modal>

        {/* Edit Rung Modal */}
        <Modal
          visible={editingRung !== null}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setEditingRung(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface1, borderRadius: radii.card }]}>
              <Text role="titleMedium" style={{ color: colors.ink, fontWeight: '700', marginBottom: 12 }}>
                {youCopy.ladder.editRungTitle}
              </Text>
              <TextInput
                testID="edit-rung-input"
                style={[
                  styles.textInput,
                  { color: colors.ink, borderColor: colors.line, backgroundColor: colors.surface2 },
                ]}
                value={editTitle}
                onChangeText={setEditTitle}
                autoFocus
              />
              <View style={styles.modalButtons}>
                <Button
                  label={youCopy.ladder.cancel}
                  onPress={() => setEditingRung(null)}
                  variant="secondary"
                />
                <View testID="save-edit-rung-button">
                  <Button
                    label={youCopy.ladder.saveRung}
                    onPress={handleSaveEditRung}
                    variant="primary"
                  />
                </View>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitles: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
  },
  controlsBar: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  emptyContainer: {
    paddingVertical: 40,
  },
  rungsList: {
    gap: 12,
  },
  rungCard: {
    padding: 14,
    borderRadius: 16,
  },
  rungHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orderCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rungTitleContainer: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  miniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rungTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
  },
  reorderButtons: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  arrowButton: {
    width: 36,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.15)',
  },
  detailBlock: {
    marginBottom: 8,
  },
  expandedActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  toggleDoneBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewriteBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    width: '100%',
    padding: 20,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
});
