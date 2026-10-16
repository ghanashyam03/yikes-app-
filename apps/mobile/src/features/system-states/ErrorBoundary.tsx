import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import { systemCopy } from '../../copy/system';
import { useTheme } from '../../theme/useTheme';
import { Button } from '../../ui/primitives/Button';
import { Card } from '../../ui/primitives/Card';
import { Text } from '../../ui/primitives/Text';
import { WinceMascot } from '../../ui/components/WinceMascot';

interface FallbackViewProps {
  onRetry: () => void;
  testID?: string | undefined;
}

function ErrorFallbackView({ onRetry, testID }: FallbackViewProps): React.JSX.Element {
  // Try using useTheme safely; if not within ThemeProvider, handle gracefully
  let mutedColor = '#6B7280';
  let honeyPop = '#B45309';

  try {
    const theme = useTheme();
    mutedColor = theme.colors.muted;
    honeyPop = theme.accents.honey.pop;
  } catch {
    // Fallback theme colors
  }

  return (
    <View style={styles.fallbackContainer} testID={testID ?? 'error-boundary-fallback'}>
      <Card tint="honey" style={styles.card}>
        <View style={styles.mascotWrapper}>
          <WinceMascot pose="offline" size={72} />
        </View>

        <Text
          role="titleMedium"
          color={honeyPop}
          style={{ textAlign: 'center', fontWeight: '700', marginBottom: 8 }}
        >
          {systemCopy.errorBoundary.title}
        </Text>

        <Text
          role="bodyMedium"
          color={mutedColor}
          style={{ textAlign: 'center', marginBottom: 20, lineHeight: 22 }}
        >
          {systemCopy.errorBoundary.description}
        </Text>

        <Button
          label={systemCopy.errorBoundary.retryAction}
          variant="primary"
          onPress={onRetry}
          style={{ width: '100%' }}
        />
      </Card>
    </View>
  );
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  testID?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.props.onError?.(error, errorInfo);
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return <ErrorFallbackView onRetry={this.handleRetry} testID={this.props.testID} />;
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  fallbackContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    padding: 24,
  },
  mascotWrapper: {
    marginBottom: 16,
  },
});
