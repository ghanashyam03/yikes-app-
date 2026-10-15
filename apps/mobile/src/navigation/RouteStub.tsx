import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../ui/primitives/Screen';
import { Text } from '../ui/primitives/Text';
import { Button } from '../ui/primitives/Button';
import { WinceMascot, type WincePose } from '../ui/components/WinceMascot';
import { navigationCopy, type RouteKey } from '../copy/navigation';
import { useTheme } from '../theme/useTheme';

export interface RouteStubProps {
  routeKey: RouteKey;
  pose?: WincePose;
  showBack?: boolean;
}

export function RouteStub({
  routeKey,
  pose = 'peeking',
  showBack = false
}: RouteStubProps): React.JSX.Element {
  const router = useRouter();
  const { spacing } = useTheme();
  const routeInfo = navigationCopy.routes[routeKey];
  const title = routeInfo.title;

  return (
    <Screen>
      <View testID={`route-stub-${routeKey}`} style={styles.container}>
        {showBack && (
          <View style={[styles.headerBar, { paddingHorizontal: spacing[4] }]}>
            <Button
              variant="ghost"
              label={navigationCopy.backButton.accessibilityLabel}
              accessibilityLabel={navigationCopy.backButton.accessibilityLabel}
              onPress={() => router.back()}
              style={styles.backButton}
            />
          </View>
        )}

        <View style={[styles.content, { padding: spacing[6] }]}>
          <View style={styles.mascotWrapper}>
            <WinceMascot pose={pose} size={96} />
          </View>

          <Text role="titleLarge" align="center" style={styles.title}>
            {title}
          </Text>

          <Text role="bodyMedium" muted align="center" style={styles.notBuilt}>
            {navigationCopy.notBuiltYet}
          </Text>

          <Text role="bodySmall" muted align="center" style={styles.subtitle}>
            {navigationCopy.notBuiltYetSubtitle}
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between'
  },
  headerBar: {
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center'
  },
  backButton: {
    minWidth: 48,
    minHeight: 48
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  mascotWrapper: {
    marginBottom: 20
  },
  title: {
    marginBottom: 12
  },
  notBuilt: {
    marginBottom: 6,
    fontWeight: '600'
  },
  subtitle: {
    maxWidth: 280
  }
});
