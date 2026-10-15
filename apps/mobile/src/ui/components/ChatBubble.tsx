import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';
import { useTheme } from '../../theme/useTheme';
import { Text } from '../primitives/Text';
import { componentsCopy } from '../../copy/components';

export type ChatBubbleVariant = 'user' | 'partner' | 'thought';

export interface ChatBubbleProps {
  variant?: ChatBubbleVariant;
  text?: string;
  senderName?: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  testID?: string;
}

export function ChatBubble({
  variant = 'partner',
  text,
  senderName,
  onPress,
  disabled = false,
  loading = false,
  accessibilityLabel,
  style,
  children,
  testID = 'chat-bubble'
}: ChatBubbleProps): React.JSX.Element {
  const { colors, accents, radii, motion, reducedMotion } = useTheme();

  const scale = useSharedValue(1);

  const handlePressIn = () => {
    if (disabled || loading || !onPress) return;
    if (reducedMotion) {
      scale.value = motion.squishScale;
    } else {
      scale.value = withSpring(motion.squishScale, motion.springs.playful);
    }
  };

  const handlePressOut = () => {
    if (disabled || loading || !onPress) return;
    if (reducedMotion) {
      scale.value = 1;
    } else {
      scale.value = withSpring(1, motion.springs.playful);
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }]
    };
  });

  // Variant styling
  const isUser = variant === 'user';
  const isThought = variant === 'thought';

  let backgroundColor: string;
  let borderColor: string = 'transparent';
  let borderStyle: 'solid' | 'dashed' = 'solid';
  let borderWidth = 0;

  if (isUser) {
    backgroundColor = accents.lilac.tint;
  } else if (isThought) {
    backgroundColor = colors.surface1;
    borderColor = accents.lilac.pop;
    borderStyle = 'dashed';
    borderWidth = 1.5;
  } else {
    // Partner
    backgroundColor = colors.surface1;
    borderColor = colors.line;
    borderWidth = 1;
  }

  const senderLabel =
    senderName ??
    (isUser
      ? componentsCopy.chatBubble.userSender
      : isThought
        ? componentsCopy.chatBubble.thoughtSender
        : componentsCopy.chatBubble.partnerSender);

  const defaultA11yLabel = text
    ? `${senderLabel}: ${text}`
    : accessibilityLabel ?? componentsCopy.chatBubble.loadingText;

  const content = (
    <Animated.View
      style={[
        styles.bubble,
        {
          backgroundColor,
          borderColor,
          borderStyle,
          borderWidth,
          borderRadius: radii.card,
          // Subtle bubble tail effect on corner
          borderBottomRightRadius: isUser ? 6 : radii.card,
          borderBottomLeftRadius: !isUser && !isThought ? 6 : radii.card
        },
        disabled && styles.disabled,
        animatedStyle
      ]}
    >
      {/* Sender Header if provided */}
      {senderName && (
        <Text role="labelSmall" style={[styles.senderText, { color: colors.muted }]}>
          {senderName}
        </Text>
      )}

      {loading ? (
        <Text role="bodyMedium" style={{ color: colors.muted, fontStyle: 'italic' }}>
          {componentsCopy.chatBubble.loadingText}
        </Text>
      ) : text ? (
        <Text
          role="bodyLarge"
          style={[
            styles.messageText,
            { color: colors.ink },
            isThought && styles.thoughtText
          ]}
        >
          {text}
        </Text>
      ) : (
        children
      )}
    </Animated.View>
  );

  return (
    <View
      style={[
        styles.wrapper,
        isUser ? styles.userWrapper : styles.partnerWrapper,
        style
      ]}
    >
      {onPress ? (
        <Pressable
          testID={testID}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={defaultA11yLabel}
          accessibilityState={{ disabled, busy: loading }}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || loading}
          style={styles.touchTarget}
        >
          {content}
        </Pressable>
      ) : (
        <View
          testID={testID}
          accessible={true}
          accessibilityRole="text"
          accessibilityLabel={defaultA11yLabel}
          accessibilityState={{ disabled, busy: loading }}
        >
          {content}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 4,
    maxWidth: '85%'
  },
  userWrapper: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end'
  },
  partnerWrapper: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start'
  },
  touchTarget: {
    minHeight: 48,
    minWidth: 48,
    justifyContent: 'center'
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
    justifyContent: 'center'
  },
  senderText: {
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  messageText: {
    lineHeight: 22
  },
  thoughtText: {
    fontStyle: 'italic'
  },
  disabled: {
    opacity: 0.45
  }
});
