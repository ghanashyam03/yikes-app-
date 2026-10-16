import React, { useEffect } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { youCopy } from '../src/copy/you';
import { useSession } from '../src/features/auth/useSession';
import { useJournal } from '../src/features/journal/useJournal';
import type { JournalEntry, JournalFilter } from '../src/features/journal/types';
import { useTheme } from '../src/theme/useTheme';
import { EmptyState } from '../src/ui/components/EmptyState';
import { Card } from '../src/ui/primitives/Card';
import { Chip } from '../src/ui/primitives/Chip';
import { Screen } from '../src/ui/primitives/Screen';
import { Text } from '../src/ui/primitives/Text';

export default function JournalScreen(): React.JSX.Element {
  const router = useRouter();
  const { colors, accents } = useTheme();
  const { session } = useSession();
  const userId = session?.user?.id;

  const {
    entries,
    activeFilter,
    setFilter,
    getFilteredEntries,
    toggleFavorite,
    deleteEntry,
    fetchEntries,
  } = useJournal();

  useEffect(() => {
    if (userId) {
      void fetchEntries(userId);
    }
  }, [userId, fetchEntries]);

  const filteredEntries = getFilteredEntries();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/you');
    }
  };

  const handleDelete = (entry: JournalEntry) => {
    Alert.alert(
      youCopy.journal.deleteConfirmTitle,
      youCopy.journal.deleteConfirmBody,
      [
        {
          text: youCopy.journal.cancelAction,
          style: 'cancel',
        },
        {
          text: youCopy.journal.deleteConfirmAction,
          style: 'destructive',
          onPress: () => {
            void deleteEntry(entry.id, userId);
          },
        },
      ]
    );
  };

  const getKindBadgeStyle = (kind: JournalEntry['entryKind']) => {
    switch (kind) {
      case 'win':
      case 'milestone':
        return { color: accents.mint.base, bg: accents.mint.tint };
      case 'letter':
        return { color: accents.sky.base, bg: accents.sky.tint };
      case 'debrief':
        return { color: accents.lilac.base, bg: accents.lilac.tint };
      case 'quote':
      default:
        return { color: accents.honey.base, bg: accents.honey.tint };
    }
  };

  const filterTabs: Array<{ id: JournalFilter; label: string }> = [
    { id: 'all', label: youCopy.journal.filters.all },
    { id: 'wins', label: youCopy.journal.filters.wins },
    { id: 'letters', label: youCopy.journal.filters.letters },
    { id: 'debriefs', label: youCopy.journal.filters.debriefs },
  ];

  return (
    <Screen style={styles.screen}>
      <View style={styles.container} testID="journal-screen">
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            testID="journal-back-button"
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
            <Text role="titleLarge" style={{ color: colors.ink, fontWeight: '700' }}>
              {youCopy.journal.title}
            </Text>
            <Text role="bodySmall" style={{ color: colors.muted }}>
              {youCopy.journal.subtitle}
            </Text>
          </View>
        </View>

        {/* Filter Row */}
        <View style={styles.filterRow} testID="journal-filters">
          {filterTabs.map((tab) => {
            const isSelected = activeFilter === tab.id;
            return (
              <View key={tab.id} testID={`filter-tab-${tab.id}`}>
                <Chip
                  label={tab.label}
                  selected={isSelected}
                  onPress={() => setFilter(tab.id)}
                  accessibilityLabel={youCopy.journal.filterA11y(tab.label)}
                />
              </View>
            );
          })}
        </View>

        {/* Entries Timeline or Empty State */}
        {entries.length === 0 ? (
          <View style={styles.emptyContainer} testID="journal-empty-state">
            <EmptyState
              pose="curious"
              title={youCopy.journal.title}
              description={youCopy.journal.emptyState}
              actionLabel={youCopy.journal.emptyAction}
              onAction={() => router.replace('/(tabs)')}
            />
          </View>
        ) : filteredEntries.length === 0 ? (
          <View style={styles.emptyContainer} testID="journal-filtered-empty-state">
            <EmptyState
              pose="thinking"
              title={youCopy.journal.title}
              description={youCopy.journal.emptyFiltered}
              actionLabel={youCopy.journal.filters.all}
              onAction={() => setFilter('all')}
            />
          </View>
        ) : (
          <ScrollView
            testID="journal-entries-scroll"
            contentContainerStyle={styles.timelineList}
            showsVerticalScrollIndicator={false}
          >
            {filteredEntries.map((entry) => {
              const badge = getKindBadgeStyle(entry.entryKind);
              const kindLabel =
                youCopy.journal.kindLabels[entry.entryKind] || youCopy.journal.kindLabels.quote;
              const formattedDate = new Date(entry.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              });

              return (
                <View key={entry.id} testID={`journal-card-${entry.id}`}>
                  <Card style={styles.entryCard}>
                  <View style={styles.cardTopRow}>
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor: badge.bg,
                        },
                      ]}
                    >
                      <Text role="labelSmall" style={{ color: badge.color, fontWeight: '600' }}>
                        {kindLabel}
                      </Text>
                    </View>

                    <View style={styles.cardActions}>
                      {/* Favorite Button */}
                      <Pressable
                        testID={`favorite-button-${entry.id}`}
                        accessibilityRole="button"
                        accessibilityLabel={youCopy.journal.favoriteButton(entry.favorite)}
                        onPress={() => void toggleFavorite(entry.id, userId)}
                        style={styles.iconButton}
                      >
                        <Text role="titleMedium" style={{ color: entry.favorite ? accents.honey.pop : colors.muted }}>
                          {entry.favorite ? '★' : '☆'}
                        </Text>
                      </Pressable>

                      {/* Delete Button */}
                      <Pressable
                        testID={`delete-button-${entry.id}`}
                        accessibilityRole="button"
                        accessibilityLabel={youCopy.journal.deleteButton}
                        onPress={() => handleDelete(entry)}
                        style={styles.iconButton}
                      >
                        <Text role="labelMedium" style={{ color: colors.muted }}>
                          ✕
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  {entry.title ? (
                    <Text role="titleSmall" style={[styles.entryTitle, { color: colors.ink }]}>
                      {entry.title}
                    </Text>
                  ) : null}

                  <Text role="bodyMedium" style={[styles.entryBody, { color: colors.ink }]}>
                    {entry.body}
                  </Text>

                  <View style={styles.cardBottomRow}>
                    <Text role="labelSmall" style={{ color: colors.muted }}>
                      {formattedDate}
                    </Text>
                  </View>
                </Card>
              </View>
              );
            })}
          </ScrollView>
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
    paddingHorizontal: 20,
    paddingTop: 16,
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
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  timelineList: {
    paddingBottom: 40,
    gap: 14,
  },
  entryCard: {
    padding: 16,
    borderRadius: 16,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryTitle: {
    fontWeight: '600',
    marginBottom: 6,
  },
  entryBody: {
    lineHeight: 22,
  },
  cardBottomRow: {
    marginTop: 10,
    alignItems: 'flex-end',
  },
});
