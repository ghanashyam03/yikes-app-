import { View, Text, StyleSheet } from 'react-native';
import { version } from '@yikes/shared/version';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>yikes!</Text>
      <Text style={styles.subtitle}>Practice conversation. Build confidence.</Text>
      <Text style={styles.version}>v{version}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0B10',
    padding: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#F4F4F6',
  },
  subtitle: {
    fontSize: 16,
    color: '#8A8D9F',
    marginTop: 8,
    textAlign: 'center',
  },
  version: {
    fontSize: 12,
    color: '#555869',
    marginTop: 16,
  },
});
