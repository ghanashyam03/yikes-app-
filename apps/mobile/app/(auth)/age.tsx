import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/ui/primitives/Screen';
import { Text } from '../../src/ui/primitives/Text';
import { Button } from '../../src/ui/primitives/Button';
import { Card } from '../../src/ui/primitives/Card';
import { WinceMascot } from '../../src/ui/components/WinceMascot';
import { useTheme } from '../../src/theme/useTheme';
import { useSession } from '../../src/features/auth/useSession';
import { validateAge, handleUnder18Rejection } from '../../src/features/auth/ageGate';
import { authCopy } from '../../src/copy/auth';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 90 }, (_, i) => CURRENT_YEAR - i);

export default function AgeScreen(): React.JSX.Element {
  const router = useRouter();
  const { colors, accents, spacing, radii } = useTheme();
  const { confirmAdult, isLoading } = useSession();

  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR - 24);
  const [under18Rejected, setUnder18Rejected] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    const { isAdult } = validateAge(selectedYear);

    if (!isAdult) {
      // Under-18 exit flow: Signs out, clears all local/guest data, stores ZERO data
      await handleUnder18Rejection();
      setUnder18Rejected(true);
      setIsConfirming(false);
      return;
    }

    // Adult: Write adult_confirmed_at timestamp only (never birth year)
    await confirmAdult();
    setIsConfirming(false);
    router.replace('/(tabs)');
  };

  const handleRejectionUnderstood = () => {
    router.replace('/(auth)/welcome');
  };

  if (under18Rejected) {
    return (
      <Screen style={styles.container}>
        <View style={styles.rejectionContent}>
          <View style={styles.rejectionHeader}>
            <WinceMascot pose="curious" size={72} />
            <Text role="titleLarge" style={[styles.rejectionTitle, { color: colors.ink }]}>
              {authCopy.age.under18Title}
            </Text>
            <Text role="bodyLarge" muted style={styles.rejectionMessage}>
              {authCopy.age.under18Message}
            </Text>
          </View>

          <Button
            variant="primary"
            label={authCopy.age.under18Button}
            onPress={handleRejectionUnderstood}
            accessibilityLabel={authCopy.age.under18Button}
            style={styles.understoodButton}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text role="titleLarge" style={[styles.title, { color: colors.ink }]}>
            {authCopy.age.title}
          </Text>
          <Text role="bodyLarge" muted style={styles.subtitle}>
            {authCopy.age.subtitle}
          </Text>
        </View>

        <View style={styles.pickerContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.yearsScrollContent}
            accessibilityRole="adjustable"
            accessibilityLabel={authCopy.age.pickerLabel}
          >
            {YEARS.map((year) => {
              const isSelected = year === selectedYear;
              return (
                <Pressable
                  key={year}
                  onPress={() => setSelectedYear(year)}
                  accessibilityRole="button"
                  accessibilityLabel={`Birth year ${year}`}
                  accessibilityState={{ selected: isSelected }}
                  style={[
                    styles.yearChip,
                    {
                      backgroundColor: isSelected ? accents.ember.base : colors.surface1,
                      borderColor: isSelected ? accents.ember.base : colors.line,
                      borderRadius: radii.md
                    }
                  ]}
                >
                  <Text
                    role="titleMedium"
                    style={{
                      color: isSelected ? colors.surface1 : colors.ink,
                      fontWeight: isSelected ? '700' : '500'
                    }}
                  >
                    {year}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <Card tint="neutral" style={styles.privacyCard}>
          <Text role="bodySmall" muted style={styles.privacyNote}>
            {authCopy.age.privacyNote}
          </Text>
        </Card>

        <View style={[styles.footer, { paddingBottom: spacing[8] }]}>
          <Button
            variant="primary"
            label={authCopy.age.confirm}
            loading={isConfirming || isLoading}
            onPress={handleConfirm}
            accessibilityLabel={`${authCopy.age.confirm} birth year ${selectedYear}`}
            style={styles.confirmButton}
          />
        </View>
      </ScrollView>
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
    paddingTop: 40,
    justifyContent: 'space-between'
  },
  header: {
    alignItems: 'center',
    marginBottom: 32
  },
  title: {
    textAlign: 'center',
    marginBottom: 8
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 22
  },
  pickerContainer: {
    marginVertical: 24,
    minHeight: 64
  },
  yearsScrollContent: {
    gap: 12,
    alignItems: 'center',
    paddingHorizontal: 8
  },
  yearChip: {
    minWidth: 72,
    minHeight: 48,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16
  },
  privacyCard: {
    padding: 16,
    marginVertical: 24,
    alignItems: 'center'
  },
  privacyNote: {
    textAlign: 'center',
    lineHeight: 18
  },
  footer: {
    width: '100%',
    alignItems: 'center'
  },
  confirmButton: {
    width: '100%'
  },
  rejectionContent: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingVertical: 48
  },
  rejectionHeader: {
    alignItems: 'center',
    marginTop: 48
  },
  rejectionTitle: {
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center'
  },
  rejectionMessage: {
    textAlign: 'center',
    lineHeight: 24
  },
  understoodButton: {
    width: '100%'
  }
});
