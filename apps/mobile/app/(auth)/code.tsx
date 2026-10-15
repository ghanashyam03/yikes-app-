import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming
} from 'react-native-reanimated';
import { Screen } from '../../src/ui/primitives/Screen';
import { Text } from '../../src/ui/primitives/Text';
import { Button } from '../../src/ui/primitives/Button';
import { ErrorBubble } from '../../src/ui/components/ErrorBubble';
import { BackIcon } from '../../src/ui/icons/BackIcon';
import { useTheme } from '../../src/theme/useTheme';
import { useSession } from '../../src/features/auth/useSession';
import {
  isLockedOut,
  getLockoutRemainingTime,
  RESEND_COOLDOWN_SECONDS
} from '../../src/features/auth/otpManager';
import { authCopy } from '../../src/copy/auth';

export default function CodeScreen(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useLocalSearchParams<{ type?: string; target?: string }>();
  const authType = (searchParams.type === 'phone' ? 'phone' : 'email') as 'email' | 'phone';

  const { colors, accents, radii } = useTheme();
  const { signInWithEmail, signInWithPhone, verifyCode, isLoading } = useSession();

  // Step state: 'target' (A10) or 'verify' (A11)
  const [step, setStep] = useState<'target' | 'verify'>(
    searchParams.target ? 'verify' : 'target'
  );
  const [target, setTarget] = useState(searchParams.target || '');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Resend cooldown timer
  const [resendCooldown, setResendCooldown] = useState(0);

  // Lockout state
  const [lockedTime, setLockedTime] = useState<{ minutes: number; seconds: number } | null>(null);

  // Input refs for 6 boxes
  const inputRefs = useRef<Array<TextInput | null>>([]);

  // Shake animation for mismatch
  const shakeOffset = useSharedValue(0);
  const animatedShakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeOffset.value }]
  }));

  const triggerShake = () => {
    shakeOffset.value = withSequence(
      withTiming(-12, { duration: 50 }),
      withTiming(12, { duration: 50 }),
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  };

  // Check lockout on target or step change
  useEffect(() => {
    if (!target) return;
    const checkLock = () => {
      if (isLockedOut(target)) {
        const remaining = getLockoutRemainingTime(target);
        setLockedTime({ minutes: remaining.minutes, seconds: remaining.seconds });
      } else {
        setLockedTime(null);
      }
    };
    checkLock();
    const interval = setInterval(checkLock, 1000);
    return () => clearInterval(interval);
  }, [target]);

  // Resend countdown timer effect
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSendCode = async () => {
    setErrorMessage(null);
    const trimmed = target.trim();
    if (!trimmed) {
      setErrorMessage(
        authType === 'email' ? authCopy.errors.invalidEmail : authCopy.errors.invalidPhone
      );
      return;
    }

    const res =
      authType === 'email'
        ? await signInWithEmail(trimmed)
        : await signInWithPhone(trimmed);

    if (res.ok) {
      setStep('verify');
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      // Auto-focus first digit
      setTimeout(() => inputRefs.current[0]?.focus(), 150);
    } else {
      setErrorMessage(res.error || authCopy.errors.generic);
    }
  };

  const handleDigitChange = async (text: string, index: number) => {
    setErrorMessage(null);
    // Handle paste of 6 digits
    if (text.length > 1) {
      const sanitized = text.replace(/[^0-9]/g, '').slice(0, 6);
      if (sanitized.length === 6) {
        const nextDigits = sanitized.split('');
        setDigits(nextDigits);
        inputRefs.current[5]?.focus();
        await attemptVerify(nextDigits.join(''));
        return;
      }
    }

    const sanitizedChar = text.replace(/[^0-9]/g, '').slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = sanitizedChar;
    setDigits(nextDigits);

    if (sanitizedChar && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    const fullCode = nextDigits.join('');
    if (fullCode.length === 6) {
      await attemptVerify(fullCode);
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const attemptVerify = async (code: string) => {
    if (lockedTime) {
      setErrorMessage(authCopy.code.lockedOut(lockedTime.minutes, lockedTime.seconds));
      return;
    }

    const res = await verifyCode(target, code, authType);
    if (res.ok) {
      // Proceed to consent or age
      router.replace('/(auth)/consent');
    } else {
      triggerShake();
      setErrorMessage(res.error || authCopy.code.wrongCode(4));
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || lockedTime) return;
    await handleSendCode();
  };

  return (
    <Screen style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.topBar}>
          <Pressable
            onPress={() => {
              if (step === 'verify') {
                setStep('target');
                setDigits(['', '', '', '', '', '']);
                setErrorMessage(null);
              } else if (router.canGoBack()) {
                router.back();
              }
            }}
            accessibilityRole="button"
            accessibilityLabel={authCopy.code.backAction}
            style={styles.backButton}
          >
            <BackIcon size={24} color={colors.ink} />
          </Pressable>
        </View>

        {errorMessage && (
          <View style={styles.errorContainer}>
            <ErrorBubble message={errorMessage} />
          </View>
        )}

        {step === 'target' ? (
          <View style={styles.stepContainer}>
            <Text role="titleLarge" style={[styles.title, { color: colors.ink }]}>
              {authCopy.code.emailPhonePrompt}
            </Text>

            <View style={styles.inputWrapper}>
              <TextInput
                value={target}
                onChangeText={setTarget}
                placeholder={
                  authType === 'email'
                    ? authCopy.code.emailPlaceholder
                    : authCopy.code.phonePlaceholder
                }
                placeholderTextColor={colors.muted}
                keyboardType={authType === 'email' ? 'email-address' : 'phone-pad'}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                accessibilityLabel={
                  authType === 'email' ? 'Email address input' : 'Phone number input'
                }
                style={[
                  styles.targetInput,
                  {
                    backgroundColor: colors.surface1,
                    borderColor: colors.line,
                    color: colors.ink,
                    borderRadius: radii.md
                  }
                ]}
              />
            </View>

            <Button
              variant="primary"
              label={authCopy.code.sendCode}
              loading={isLoading}
              onPress={handleSendCode}
              accessibilityLabel={authCopy.code.sendCode}
              style={styles.primaryButton}
            />
          </View>
        ) : (
          <View style={styles.stepContainer}>
            <Text role="titleLarge" style={[styles.title, { color: colors.ink }]}>
              {authCopy.code.enterCodeTitle}
            </Text>
            <Text role="bodyMedium" muted style={styles.subtitle}>
              {authCopy.code.codeSentTo(target)}
            </Text>

            <Animated.View style={[styles.boxesRow, animatedShakeStyle]}>
              {digits.map((digit, idx) => (
                <TextInput
                  key={idx}
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
                  value={digit}
                  onChangeText={(text) => handleDigitChange(text, idx)}
                  onKeyPress={(e) => handleKeyPress(e, idx)}
                  keyboardType="number-pad"
                  maxLength={idx === 0 ? 6 : 1}
                  editable={!lockedTime && !isLoading}
                  accessibilityRole="none"
                  accessibilityLabel={authCopy.code.boxAccessibilityLabel(idx)}
                  style={[
                    styles.digitBox,
                    {
                      backgroundColor: colors.surface1,
                      borderColor: digit ? accents.ember.base : colors.line,
                      color: colors.ink,
                      borderRadius: radii.md
                    }
                  ]}
                />
              ))}
            </Animated.View>

            <View style={styles.footerRow}>
              {resendCooldown > 0 ? (
                <Text role="bodySmall" muted>
                  {authCopy.code.resendIn(resendCooldown)}
                </Text>
              ) : (
                <Pressable
                  onPress={handleResend}
                  disabled={Boolean(lockedTime) || isLoading}
                  accessibilityRole="button"
                  accessibilityLabel={authCopy.code.resend}
                  style={styles.resendButton}
                >
                  <Text
                    role="bodyMedium"
                    style={{
                      color: lockedTime ? colors.muted : accents.ember.base,
                      fontWeight: '600'
                    }}
                  >
                    {authCopy.code.resend}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        )}
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
    paddingTop: 16,
    paddingBottom: 32
  },
  topBar: {
    marginBottom: 24
  },
  backButton: {
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center'
  },
  errorContainer: {
    marginBottom: 20
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
    width: '100%'
  },
  title: {
    textAlign: 'center',
    marginBottom: 12
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20
  },
  inputWrapper: {
    width: '100%',
    marginBottom: 24
  },
  targetInput: {
    width: '100%',
    minHeight: 56,
    paddingHorizontal: 16,
    fontSize: 18,
    borderWidth: 1
  },
  primaryButton: {
    width: '100%'
  },
  boxesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 24
  },
  digitBox: {
    width: 48,
    height: 56,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    borderWidth: 2
  },
  footerRow: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16
  },
  resendButton: {
    minHeight: 48,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center'
  }
});
