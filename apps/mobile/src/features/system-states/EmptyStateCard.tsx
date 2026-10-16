import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { EmptyState } from '../../ui/components/EmptyState';
import { emptyStatesRegistry, type EmptyStateKey } from './emptyStatesRegistry';

export interface EmptyStateCardProps {
  stateKey: EmptyStateKey;
  onAction?: () => void;
  customTitle?: string;
  customDescription?: string;
  customActionLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function EmptyStateCard({
  stateKey,
  onAction,
  customTitle,
  customDescription,
  customActionLabel,
  style,
  testID,
}: EmptyStateCardProps): React.JSX.Element {
  const definition = emptyStatesRegistry[stateKey];

  return (
    <EmptyState
      pose={definition.pose}
      title={customTitle ?? definition.title}
      description={customDescription ?? definition.description}
      actionLabel={customActionLabel ?? definition.actionLabel}
      {...(onAction ? { onAction } : {})}
      {...(style ? { style } : {})}
      testID={testID ?? `empty-state-${stateKey}`}
      accessibilityLabel={`${definition.title}. ${definition.description}`}
    />
  );
}
