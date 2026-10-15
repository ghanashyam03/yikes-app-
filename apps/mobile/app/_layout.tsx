import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack, Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { version } from '@yikes/shared/version';
import { ThemeProvider } from '../src/theme/ThemeProvider';

export default function RootLayout(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <View testID="root-layout" style={styles.container}>
          <Text testID="app-version-tag" style={styles.versionTag}>
            {version}
          </Text>
          {Stack && Stack.Screen ? (
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'default'
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
              <Stack.Screen
                name="practice"
                options={{
                  presentation: 'modal',
                  headerShown: false
                }}
              />
              <Stack.Screen
                name="support"
                options={{
                  presentation: 'modal',
                  headerShown: false
                }}
              />
              <Stack.Screen
                name="paywall"
                options={{
                  presentation: 'modal',
                  headerShown: false
                }}
              />
            </Stack>
          ) : (
            <Slot />
          )}
        </View>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  versionTag: {
    opacity: 0,
    height: 0
  }
});
