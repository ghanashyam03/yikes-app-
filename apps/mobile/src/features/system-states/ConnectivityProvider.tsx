import React, { useCallback, useEffect, useState } from 'react';
import {
  Platform,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { systemCopy } from '../../copy/system';
import { useTheme } from '../../theme/useTheme';
import { Button } from '../../ui/primitives/Button';
import { Card } from '../../ui/primitives/Card';
import { Text } from '../../ui/primitives/Text';
import { ConnectivityContext, useConnectivity } from './useConnectivity';

export interface OfflineBannerProps {
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function OfflineBanner({
  style,
  testID = 'offline-banner',
}: OfflineBannerProps): React.JSX.Element | null {
  const { accents, spacing } = useTheme();

  return (
    <View
      testID={testID}
      accessibilityRole="alert"
      accessibilityLabel={systemCopy.offline.banner}
      style={[
        styles.bannerContainer,
        {
          backgroundColor: accents.honey.tint,
          borderColor: accents.honey.base,
          paddingVertical: spacing[2],
          paddingHorizontal: spacing[4],
        },
        style,
      ]}
    >
      <Text
        role="bodySmall"
        color={accents.honey.pop}
        style={{ fontWeight: '600', textAlign: 'center' }}
      >
        {systemCopy.offline.banner}
      </Text>
    </View>
  );
}

export interface ReconnectCardProps {
  onRetry?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function ReconnectCard({
  onRetry,
  style,
  testID = 'reconnect-card',
}: ReconnectCardProps): React.JSX.Element {
  const { colors, accents, spacing } = useTheme();
  const { checkConnection } = useConnectivity();
  const [checking, setChecking] = useState(false);

  const handleRetry = async () => {
    setChecking(true);
    try {
      await checkConnection();
      onRetry?.();
    } finally {
      setChecking(false);
    }
  };

  return (
    <View testID={testID} style={style}>
      <Card
        tint="honey"
        accessibilityLabel={`${systemCopy.offline.cardTitle}. ${systemCopy.offline.cardBody}`}
        style={{ padding: spacing[4] }}
      >
        <Text
          role="titleMedium"
          color={accents.honey.pop}
          style={{ fontWeight: '700', marginBottom: spacing[1] }}
        >
          {systemCopy.offline.cardTitle}
        </Text>
        <Text role="bodySmall" color={colors.ink} style={{ marginBottom: spacing[3] }}>
          {systemCopy.offline.cardBody}
        </Text>
        <Button
          label={checking ? 'Checking...' : systemCopy.offline.retryAction}
          variant="secondary"
          disabled={checking}
          onPress={handleRetry}
        />
      </Card>
    </View>
  );
}

export interface ConnectivityProviderProps {
  children: React.ReactNode;
  initialConnected?: boolean;
  showBanner?: boolean;
}

export function ConnectivityProvider({
  children,
  initialConnected = true,
  showBanner = true,
}: ConnectivityProviderProps): React.JSX.Element {
  const [isConnected, setIsConnected] = useState<boolean>(initialConnected);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      const globalNav = (globalThis as unknown as { navigator?: { onLine?: boolean } }).navigator;
      if (globalNav && typeof globalNav.onLine === 'boolean') {
        const online = globalNav.onLine;
        setIsConnected(online);
        return online;
      }
    }
    return isConnected;
  }, [isConnected]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const globalWin = (globalThis as unknown as {
        window?: {
          addEventListener: (event: string, handler: () => void) => void;
          removeEventListener: (event: string, handler: () => void) => void;
        };
      }).window;

      if (globalWin) {
        const handleOnline = () => setIsConnected(true);
        const handleOffline = () => setIsConnected(false);

        globalWin.addEventListener('online', handleOnline);
        globalWin.addEventListener('offline', handleOffline);

        return () => {
          globalWin.removeEventListener('online', handleOnline);
          globalWin.removeEventListener('offline', handleOffline);
        };
      }
    }
    return undefined;
  }, []);

  return (
    <ConnectivityContext.Provider
      value={{
        isConnected,
        setIsConnected,
        checkConnection,
      }}
    >
      {showBanner && !isConnected && <OfflineBanner />}
      {children}
    </ConnectivityContext.Provider>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    borderBottomWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
});
