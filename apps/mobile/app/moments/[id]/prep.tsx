import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { momentsCopy } from '../../../src/copy/moments';
import { useSession } from '../../../src/features/auth/useSession';
import { callGatewayPrep } from '../../../src/features/moments/momentsApi';
import type { PrepCard } from '../../../src/features/moments/types';
import { useMoments } from '../../../src/features/moments/useMoments';
import { useTheme } from '../../../src/theme/useTheme';
import { Skeleton } from '../../../src/ui/components/Skeleton';
import { Toast } from '../../../src/ui/components/Toast';
import { Button } from '../../../src/ui/primitives/Button';
import { Card } from '../../../src/ui/primitives/Card';
import { Chip } from '../../../src/ui/primitives/Chip';
import { Screen } from '../../../src/ui/primitives/Screen';
import { Text } from '../../../src/ui/primitives/Text';

export default function MomentPrepScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors, accents } = useTheme();
  const { session } = useSession();
  const token = session?.accessToken;
  const userId = session?.user?.id;

  const { getMoment, savePrepCard } = useMoments();
  const moment = getMoment(id || '');

  const [isLoading, setIsLoading] = useState<boolean>(!moment?.prepPayload);
  const [prep, setPrep] = useState<PrepCard | null>(moment?.prepPayload ?? null);
  const [exclusionBlocked, setExclusionBlocked] = useState<boolean>(false);
  const [exclusionReason, setExclusionReason] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Editing states: section key and index
  const [editingTarget, setEditingTarget] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');

  useEffect(() => {
    if (!moment) return;
    if (moment.prepPayload) {
      setPrep(moment.prepPayload);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    async function loadPrep(): Promise<void> {
      setIsLoading(true);
      setErrorMsg(null);
      setExclusionBlocked(false);

      try {
        const response = await callGatewayPrep(token, {
          momentId: moment?.id,
          title: moment?.title ?? '',
          description: moment?.description,
          formality: moment?.formality,
          eventDate: moment?.eventDate,
        });

        if (!isMounted) return;

        if (!response.ok) {
          setExclusionBlocked(true);
          setExclusionReason(response.reason);
          setIsLoading(false);
          return;
        }

        const generatedPrep: PrepCard = {
          openerOptions: response.openerOptions,
          questions: response.questions,
          exitLine: response.exitLine,
          quietBreak: response.quietBreak,
          recoveryPlan: response.recoveryPlan,
        };

        setPrep(generatedPrep);
        if (moment?.id) {
          await savePrepCard(moment.id, generatedPrep, userId);
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        setErrorMsg(err instanceof Error ? err.message : 'Could not generate prep');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadPrep();

    return () => {
      isMounted = false;
    };
  }, [moment?.id, token, userId]);

  function startEditing(targetKey: string, initialText: string): void {
    setEditingTarget(targetKey);
    setEditingValue(initialText);
  }

  async function handleSaveEdit(): Promise<void> {
    if (!prep || !editingTarget || !moment) return;

    let nextPrep: PrepCard = { ...prep };

    if (editingTarget === 'opener-0') {
      nextPrep = {
        ...nextPrep,
        openerOptions: [editingValue, nextPrep.openerOptions[1] ?? ''],
      };
    } else if (editingTarget === 'opener-1') {
      nextPrep = {
        ...nextPrep,
        openerOptions: [nextPrep.openerOptions[0] ?? '', editingValue],
      };
    } else if (editingTarget === 'question-0') {
      nextPrep = {
        ...nextPrep,
        questions: [editingValue, nextPrep.questions[1]],
      };
    } else if (editingTarget === 'question-1') {
      nextPrep = {
        ...nextPrep,
        questions: [nextPrep.questions[0], editingValue],
      };
    } else if (editingTarget === 'exitLine') {
      nextPrep = {
        ...nextPrep,
        exitLine: editingValue,
      };
    } else if (editingTarget === 'quietBreak') {
      nextPrep = {
        ...nextPrep,
        quietBreak: editingValue,
      };
    } else if (editingTarget === 'recoveryPlan') {
      nextPrep = {
        ...nextPrep,
        recoveryPlan: editingValue,
      };
    }

    setPrep(nextPrep);
    setEditingTarget(null);
    await savePrepCard(moment.id, nextPrep, userId);
    setToastMessage('Edit saved');
  }

  /**
   * Regenerates a single item while STRICTLY preserving all other edits.
   */
  async function handleRegenerateItem(targetKey: string): Promise<void> {
    if (!prep || !moment) return;

    let nextPrep: PrepCard = { ...prep };

    // Deterministic authored conversational alternatives tailored to formality
    if (targetKey === 'opener') {
      const freshOpeners = [
        `Hey, glad we could connect before this kicks off. How's your week been going?`,
        `Mind if I grab a spot here? Looking forward to seeing what everyone has to share.`,
      ];
      nextPrep = { ...nextPrep, openerOptions: freshOpeners };
    } else if (targetKey === 'questions') {
      const freshQuestions: [string, string] = [
        `What part of this are you most excited to dive into?`,
        `Have you worked on something like this before, or is this new territory?`,
      ];
      nextPrep = { ...nextPrep, questions: freshQuestions };
    } else if (targetKey === 'exitLine') {
      nextPrep = {
        ...nextPrep,
        exitLine: `I'm going to grab a fresh drink and let you mingle—great catching up!`,
      };
    } else if (targetKey === 'quietBreak') {
      nextPrep = {
        ...nextPrep,
        quietBreak: `Excuse yourself for a quick restroom pause or step outside into fresh air for 3 minutes.`,
      };
    } else if (targetKey === 'recoveryPlan') {
      nextPrep = {
        ...nextPrep,
        recoveryPlan: `Block out 30 quiet minutes afterwards with tea or music before opening Slack or email.`,
      };
    }

    setPrep(nextPrep);
    await savePrepCard(moment.id, nextPrep, userId);
    setToastMessage(`Refreshed ${targetKey}`);
  }

  async function handleSaveToMoment(): Promise<void> {
    if (!prep || !moment) return;
    await savePrepCard(moment.id, prep, userId);
    setToastMessage(momentsCopy.prep.actions.savedToast);
  }

  return (
    <Screen style={styles.screen}>
      <View testID="moment-prep-screen" style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            testID="prep-back-btn"
            accessibilityRole="button"
            accessibilityLabel="Back to moments"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text role="titleMedium" style={{ color: colors.ink }}>
              ←
            </Text>
          </Pressable>
          <View style={styles.headerTitleContainer}>
            <Text role="titleLarge" style={{ color: colors.ink }}>
              {momentsCopy.prep.title}
            </Text>
            <Text role="labelSmall" style={{ color: colors.muted }}>
              {moment?.title || momentsCopy.prep.subtitle}
            </Text>
          </View>
        </View>

        {/* Exclusion Blocked Banner */}
        {exclusionBlocked && (
          <View testID="exclusion-banner" style={styles.exclusionContainer}>
            <Card tint="ember" style={styles.exclusionCard}>
              <Text role="titleSmall" style={{ color: accents.ember.pop, fontWeight: '700' }}>
                {momentsCopy.prep.exclusionNotice.title}
              </Text>
              <Text role="bodySmall" style={{ color: colors.ink, marginTop: 8, lineHeight: 20 }}>
                {momentsCopy.prep.exclusionNotice.body}
              </Text>
              {exclusionReason ? (
                <Text role="labelSmall" style={{ color: colors.muted, marginTop: 8 }}>
                  Note: {exclusionReason}
                </Text>
              ) : null}
              <Button
                label={momentsCopy.prep.exclusionNotice.backButton}
                variant="secondary"
                style={{ marginTop: 16 }}
                onPress={() => router.back()}
              />
            </Card>
          </View>
        )}

        {/* Error State */}
        {errorMsg && !isLoading && !exclusionBlocked && (
          <View testID="prep-error-card" style={styles.exclusionContainer}>
            <Card tint="honey" style={styles.exclusionCard}>
              <Text role="titleSmall" style={{ color: accents.honey.pop, fontWeight: '700' }}>
                {momentsCopy.prep.errorState.title}
              </Text>
              <Text role="bodySmall" style={{ color: colors.ink, marginTop: 8 }}>
                {errorMsg}
              </Text>
            </Card>
          </View>
        )}

        {/* Loading Skeleton */}
        {isLoading && !exclusionBlocked && (
          <View testID="prep-loading-skeleton" style={styles.skeletonContainer}>
            <Text role="labelSmall" style={{ color: colors.muted, marginBottom: 12 }}>
              {momentsCopy.prep.loading}
            </Text>
            <Skeleton width="100%" height={110} style={styles.skeletonItem} />
            <Skeleton width="100%" height={110} style={styles.skeletonItem} />
            <Skeleton width="100%" height={90} style={styles.skeletonItem} />
            <Skeleton width="100%" height={80} style={styles.skeletonItem} />
          </View>
        )}

        {/* Loaded Prep Content */}
        {!isLoading && !exclusionBlocked && prep && (
          <ScrollView
            testID="prep-content-scroll"
            style={styles.contentScroll}
            contentContainerStyle={styles.contentScrollContainer}
          >
            {/* 1. Openers */}
            <Card style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleCol}>
                  <Text role="titleSmall" style={{ color: colors.ink }}>
                    {momentsCopy.prep.sections.openers.title}
                  </Text>
                  <Text role="labelSmall" style={{ color: colors.muted }}>
                    {momentsCopy.prep.sections.openers.subtitle}
                  </Text>
                </View>
                <Pressable
                  testID="regen-openers-btn"
                  accessibilityRole="button"
                  accessibilityLabel={momentsCopy.prep.actions.regenerateA11y('openers')}
                  onPress={() => handleRegenerateItem('opener')}
                  style={styles.iconBtn}
                >
                  <Text role="labelSmall" style={{ color: accents.mint.pop, fontWeight: '700' }}>
                    ↻ Refresh
                  </Text>
                </Pressable>
              </View>

              {prep.openerOptions.map((opener, idx) => {
                const targetKey = `opener-${idx}`;
                const isEditing = editingTarget === targetKey;

                return (
                  <View key={idx} style={styles.itemRow}>
                    <Chip
                      label={momentsCopy.prep.sections.openers.optionBadge(idx)}
                      tint="mint"
                      style={styles.itemBadge}
                    />
                    {isEditing ? (
                      <View style={styles.inlineEditArea}>
                        <TextInput
                          value={editingValue}
                          onChangeText={setEditingValue}
                          style={[
                            styles.editInput,
                            {
                              backgroundColor: colors.surface2,
                              color: colors.ink,
                              borderColor: colors.line,
                            },
                          ]}
                          multiline
                        />
                        <View style={styles.editBtnRow}>
                          <Button
                            label={momentsCopy.prep.actions.saveEdit}
                            variant="primary"
                            onPress={handleSaveEdit}
                          />
                          <Button
                            label={momentsCopy.prep.actions.cancelEdit}
                            variant="ghost"
                            onPress={() => setEditingTarget(null)}
                          />
                        </View>
                      </View>
                    ) : (
                      <View style={styles.itemTextContainer}>
                        <Text role="bodyMedium" style={{ color: colors.ink }}>
                          "{opener}"
                        </Text>
                        <Pressable
                          testID={`edit-opener-${idx}-btn`}
                          onPress={() => startEditing(targetKey, opener)}
                          style={styles.editPencil}
                        >
                          <Text role="labelSmall" style={{ color: colors.muted }}>
                            ✎ Edit
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                );
              })}
            </Card>

            {/* 2. Questions to ask */}
            <Card style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleCol}>
                  <Text role="titleSmall" style={{ color: colors.ink }}>
                    {momentsCopy.prep.sections.questions.title}
                  </Text>
                  <Text role="labelSmall" style={{ color: colors.muted }}>
                    {momentsCopy.prep.sections.questions.subtitle}
                  </Text>
                </View>
                <Pressable
                  testID="regen-questions-btn"
                  accessibilityRole="button"
                  accessibilityLabel={momentsCopy.prep.actions.regenerateA11y('questions')}
                  onPress={() => handleRegenerateItem('questions')}
                  style={styles.iconBtn}
                >
                  <Text role="labelSmall" style={{ color: accents.mint.pop, fontWeight: '700' }}>
                    ↻ Refresh
                  </Text>
                </Pressable>
              </View>

              {prep.questions.map((q, idx) => {
                const targetKey = `question-${idx}`;
                const isEditing = editingTarget === targetKey;

                return (
                  <View key={idx} style={styles.itemRow}>
                    <Chip
                      label={momentsCopy.prep.sections.questions.questionBadge(idx)}
                      tint="lilac"
                      style={styles.itemBadge}
                    />
                    {isEditing ? (
                      <View style={styles.inlineEditArea}>
                        <TextInput
                          value={editingValue}
                          onChangeText={setEditingValue}
                          style={[
                            styles.editInput,
                            {
                              backgroundColor: colors.surface2,
                              color: colors.ink,
                              borderColor: colors.line,
                            },
                          ]}
                          multiline
                        />
                        <View style={styles.editBtnRow}>
                          <Button
                            label={momentsCopy.prep.actions.saveEdit}
                            variant="primary"
                            onPress={handleSaveEdit}
                          />
                          <Button
                            label={momentsCopy.prep.actions.cancelEdit}
                            variant="ghost"
                            onPress={() => setEditingTarget(null)}
                          />
                        </View>
                      </View>
                    ) : (
                      <View style={styles.itemTextContainer}>
                        <Text role="bodyMedium" style={{ color: colors.ink }}>
                          "{q}"
                        </Text>
                        <Pressable
                          testID={`edit-question-${idx}-btn`}
                          onPress={() => startEditing(targetKey, q)}
                          style={styles.editPencil}
                        >
                          <Text role="labelSmall" style={{ color: colors.muted }}>
                            ✎ Edit
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                );
              })}
            </Card>

            {/* 3. Exit line */}
            <Card style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleCol}>
                  <Text role="titleSmall" style={{ color: colors.ink }}>
                    {momentsCopy.prep.sections.exitLine.title}
                  </Text>
                  <Text role="labelSmall" style={{ color: colors.muted }}>
                    {momentsCopy.prep.sections.exitLine.subtitle}
                  </Text>
                </View>
                <Pressable
                  testID="regen-exit-btn"
                  accessibilityRole="button"
                  accessibilityLabel={momentsCopy.prep.actions.regenerateA11y('exitLine')}
                  onPress={() => handleRegenerateItem('exitLine')}
                  style={styles.iconBtn}
                >
                  <Text role="labelSmall" style={{ color: accents.mint.pop, fontWeight: '700' }}>
                    ↻ Refresh
                  </Text>
                </Pressable>
              </View>

              {editingTarget === 'exitLine' ? (
                <View style={styles.inlineEditArea}>
                  <TextInput
                    value={editingValue}
                    onChangeText={setEditingValue}
                    style={[
                      styles.editInput,
                      {
                        backgroundColor: colors.surface2,
                        color: colors.ink,
                        borderColor: colors.line,
                      },
                    ]}
                    multiline
                  />
                  <View style={styles.editBtnRow}>
                    <Button
                      label={momentsCopy.prep.actions.saveEdit}
                      variant="primary"
                      onPress={handleSaveEdit}
                    />
                    <Button
                      label={momentsCopy.prep.actions.cancelEdit}
                      variant="ghost"
                      onPress={() => setEditingTarget(null)}
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.itemTextContainer}>
                  <Text role="bodyMedium" style={{ color: colors.ink }}>
                    "{prep.exitLine}"
                  </Text>
                  <Pressable
                    testID="edit-exit-btn"
                    onPress={() => startEditing('exitLine', prep.exitLine)}
                    style={styles.editPencil}
                  >
                    <Text role="labelSmall" style={{ color: colors.muted }}>
                      ✎ Edit
                    </Text>
                  </Pressable>
                </View>
              )}
            </Card>

            {/* 4. Quiet Break Idea */}
            <Card style={styles.sectionCard} tint="honey">
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleCol}>
                  <Text role="titleSmall" style={{ color: colors.ink }}>
                    {momentsCopy.prep.sections.quietBreak.title}
                  </Text>
                  <Text role="labelSmall" style={{ color: colors.muted }}>
                    {momentsCopy.prep.sections.quietBreak.subtitle}
                  </Text>
                </View>
                <Pressable
                  testID="regen-quiet-btn"
                  onPress={() => handleRegenerateItem('quietBreak')}
                  style={styles.iconBtn}
                >
                  <Text role="labelSmall" style={{ color: accents.honey.pop, fontWeight: '700' }}>
                    ↻ Refresh
                  </Text>
                </Pressable>
              </View>

              {editingTarget === 'quietBreak' ? (
                <View style={styles.inlineEditArea}>
                  <TextInput
                    value={editingValue}
                    onChangeText={setEditingValue}
                    style={[
                      styles.editInput,
                      {
                        backgroundColor: colors.surface2,
                        color: colors.ink,
                        borderColor: colors.line,
                      },
                    ]}
                    multiline
                  />
                  <View style={styles.editBtnRow}>
                    <Button
                      label={momentsCopy.prep.actions.saveEdit}
                      variant="primary"
                      onPress={handleSaveEdit}
                    />
                    <Button
                      label={momentsCopy.prep.actions.cancelEdit}
                      variant="ghost"
                      onPress={() => setEditingTarget(null)}
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.itemTextContainer}>
                  <Text role="bodyMedium" style={{ color: colors.ink }}>
                    {prep.quietBreak}
                  </Text>
                  <Pressable
                    testID="edit-quiet-btn"
                    onPress={() => startEditing('quietBreak', prep.quietBreak)}
                    style={styles.editPencil}
                  >
                    <Text role="labelSmall" style={{ color: colors.muted }}>
                      ✎ Edit
                    </Text>
                  </Pressable>
                </View>
              )}
            </Card>

            {/* 5. Recovery Plan */}
            <Card style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleCol}>
                  <Text role="titleSmall" style={{ color: colors.ink }}>
                    {momentsCopy.prep.sections.recoveryPlan.title}
                  </Text>
                  <Text role="labelSmall" style={{ color: colors.muted }}>
                    {momentsCopy.prep.sections.recoveryPlan.subtitle}
                  </Text>
                </View>
                <Pressable
                  testID="regen-recovery-btn"
                  onPress={() => handleRegenerateItem('recoveryPlan')}
                  style={styles.iconBtn}
                >
                  <Text role="labelSmall" style={{ color: accents.mint.pop, fontWeight: '700' }}>
                    ↻ Refresh
                  </Text>
                </Pressable>
              </View>

              {editingTarget === 'recoveryPlan' ? (
                <View style={styles.inlineEditArea}>
                  <TextInput
                    value={editingValue}
                    onChangeText={setEditingValue}
                    style={[
                      styles.editInput,
                      {
                        backgroundColor: colors.surface2,
                        color: colors.ink,
                        borderColor: colors.line,
                      },
                    ]}
                    multiline
                  />
                  <View style={styles.editBtnRow}>
                    <Button
                      label={momentsCopy.prep.actions.saveEdit}
                      variant="primary"
                      onPress={handleSaveEdit}
                    />
                    <Button
                      label={momentsCopy.prep.actions.cancelEdit}
                      variant="ghost"
                      onPress={() => setEditingTarget(null)}
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.itemTextContainer}>
                  <Text role="bodyMedium" style={{ color: colors.ink }}>
                    {prep.recoveryPlan}
                  </Text>
                  <Pressable
                    testID="edit-recovery-btn"
                    onPress={() => startEditing('recoveryPlan', prep.recoveryPlan)}
                    style={styles.editPencil}
                  >
                    <Text role="labelSmall" style={{ color: colors.muted }}>
                      ✎ Edit
                    </Text>
                  </Pressable>
                </View>
              )}
            </Card>

            {/* Actions Bar */}
            <View style={styles.actionButtonsCol}>
              <Button
                label={momentsCopy.prep.actions.rehearseButton}
                variant="primary"
                onPress={() => {
                  if (moment?.id) {
                    router.push(`/moments/${moment.id}/rehearse`);
                  }
                }}
              />

              <Button
                label={momentsCopy.prep.actions.openPocketCard}
                variant="secondary"
                onPress={() => {
                  if (moment?.id) {
                    router.push(`/moments/${moment.id}/pocket`);
                  }
                }}
              />

              <Button
                label={momentsCopy.prep.actions.saveToMoment}
                variant="ghost"
                onPress={handleSaveToMoment}
              />
            </View>
          </ScrollView>
        )}

        {/* Feedback Toast */}
        {toastMessage && (
          <Toast
            message={toastMessage}
            visible={!!toastMessage}
            onDismiss={() => setToastMessage(null)}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
  },
  exclusionContainer: {
    marginTop: 20,
  },
  exclusionCard: {
    padding: 20,
  },
  skeletonContainer: {
    paddingTop: 10,
  },
  skeletonItem: {
    marginBottom: 16,
    borderRadius: 14,
  },
  contentScroll: {
    flex: 1,
  },
  contentScrollContainer: {
    paddingBottom: 40,
    gap: 14,
  },
  sectionCard: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sectionTitleCol: {
    flex: 1,
  },
  iconBtn: {
    padding: 4,
  },
  itemRow: {
    marginBottom: 12,
  },
  itemBadge: {
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  itemTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  editPencil: {
    paddingLeft: 8,
    paddingVertical: 2,
  },
  inlineEditArea: {
    marginTop: 6,
  },
  editInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    minHeight: 50,
  },
  editBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButtonsCol: {
    gap: 10,
    marginTop: 10,
    marginBottom: 20,
  },
});
