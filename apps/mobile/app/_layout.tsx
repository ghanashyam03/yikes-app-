import { Slot } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { version } from '@yikes/shared/version';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <View testID="root-layout" style={styles.container}>
        <Text testID="app-version-tag" style={styles.versionTag}>
          {version}
        </Text>
        <Slot />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0B10',
  },
  versionTag: {
    opacity: 0,
    height: 0,
  },
});
