import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Screen } from '../../src/ui/primitives/Screen';
import { Text } from '../../src/ui/primitives/Text';
import { Button } from '../../src/ui/primitives/Button';
import { Card } from '../../src/ui/primitives/Card';
import { ErrorBubble } from '../../src/ui/components/ErrorBubble';
import { useTheme } from '../../src/theme/useTheme';
import { useSession } from '../../src/features/auth/useSession';
import { authCopy } from '../../src/copy/auth';

export default function SignInScreen(): React.JSX.Element {
  const router = useRouter();
  const params = useLocalSearchParams<{ returning?: string }>();
  const isReturning = params.returning === 'true';

  const { colors, accents } = useTheme();
  const { isGuest } = useSession();
  const [errorMessage] = useState<string | null>(null);

  const handleAppleSignIn = async () => {
    // Continue with Apple (sign in with id token stub/preview)
    Alert.alert('Apple Sign In', 'Apple ID token authentication is configured for device builds.');
  };

  const handleGoogleSignIn = async () => {
    // Continue with Google (sign in with id token stub/preview)
    Alert.alert('Google Sign In', 'Google ID token authentication is configured for device builds.');
  };

  const handleEmailSignIn = () => {
    router.push({
      pathname: '/(auth)/code',
      params: { type: 'email' }
    });
  };

  const handlePhoneSignIn = () => {
    router.push({
      pathname: '/(auth)/code',
      params: { type: 'phone' }
    });
  };

  const handlePasskeySignIn = () => {
    // Passkey stub noted as UNVERIFIED in spec and TASKS.md
    Alert.alert('Passkey Sign In', authCopy.signIn.passkeyUnverifiedNote);
  };

  const handleNotNow = () => {
    // Guest mode continues for 7 days
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <Screen style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text role="titleLarge" style={[styles.title, { color: colors.ink }]}>
            {isReturning ? authCopy.signIn.titleWelcomeBack : authCopy.signIn.titleSavePlaybook}
          </Text>
          <Text role="bodyLarge" muted style={styles.subtitle}>
            {isReturning ? authCopy.signIn.subtitleWelcomeBack : authCopy.signIn.subtitleSavePlaybook}
          </Text>
        </View>

        {errorMessage && (
          <View style={styles.errorContainer}>
            <ErrorBubble message={errorMessage} />
          </View>
        )}

        <View style={styles.actionsContainer}>
          <Button
            variant="secondary"
            label={authCopy.signIn.apple}
            onPress={handleAppleSignIn}
            accessibilityLabel={authCopy.signIn.apple}
            style={styles.authButton}
          />

          <Button
            variant="secondary"
            label={authCopy.signIn.google}
            onPress={handleGoogleSignIn}
            accessibilityLabel={authCopy.signIn.google}
            style={styles.authButton}
          />

          <Button
            variant="primary"
            label={authCopy.signIn.email}
            onPress={handleEmailSignIn}
            accessibilityLabel={authCopy.signIn.email}
            style={styles.authButton}
          />

          <Button
            variant="secondary"
            label={authCopy.signIn.phone}
            onPress={handlePhoneSignIn}
            accessibilityLabel={authCopy.signIn.phone}
            style={styles.authButton}
          />

          <Button
            variant="ghost"
            label={authCopy.signIn.passkey}
            onPress={handlePasskeySignIn}
            accessibilityLabel={authCopy.signIn.passkey}
            style={styles.authButton}
          />
        </View>

        <View style={styles.footer}>
          <Card tint="neutral" style={styles.privacyCard}>
            <Text role="bodySmall" muted style={styles.privacyText}>
              {authCopy.signIn.privacyPromise}
            </Text>
          </Card>

          {isGuest && (
            <Pressable
              onPress={handleNotNow}
              accessibilityRole="button"
              accessibilityLabel={authCopy.signIn.notNow}
              accessibilityHint={authCopy.signIn.guestNotice}
              style={styles.notNowButton}
            >
              <Text role="bodyMedium" style={{ color: accents.ember.base, fontWeight: '600' }}>
                {authCopy.signIn.notNow}
              </Text>
              <Text role="bodySmall" muted style={{ marginTop: 4 }}>
                {authCopy.signIn.guestNotice}
              </Text>
            </Pressable>
          )}
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
    paddingBottom: 32,
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
  errorContainer: {
    marginBottom: 16
  },
  actionsContainer: {
    gap: 12,
    width: '100%'
  },
  authButton: {
    width: '100%'
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
    gap: 16
  },
  privacyCard: {
    padding: 12,
    width: '100%',
    alignItems: 'center'
  },
  privacyText: {
    textAlign: 'center'
  },
  notNowButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16
  }
});
