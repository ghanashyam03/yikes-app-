import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View
} from 'react-native';
import { ThemeProvider, useTheme } from '../../src/theme/ThemeProvider';
import { Screen } from '../../src/ui/primitives/Screen';
import { Text } from '../../src/ui/primitives/Text';
import { Button } from '../../src/ui/primitives/Button';
import { Chip } from '../../src/ui/primitives/Chip';
import { Card } from '../../src/ui/primitives/Card';
import { NoDefaultSlider } from '../../src/ui/components/NoDefaultSlider';
import { BatteryGauge } from '../../src/ui/components/BatteryGauge';
import { RhythmRing } from '../../src/ui/components/RhythmRing';
import { ChatBubble } from '../../src/ui/components/ChatBubble';
import { TypingDots } from '../../src/ui/components/TypingDots';
import { CharacterAvatar, type CharacterExpression } from '../../src/ui/components/CharacterAvatar';
import { WinceMascot, type WincePose } from '../../src/ui/components/WinceMascot';
import { BottomSheet } from '../../src/ui/components/BottomSheet';
import { Skeleton } from '../../src/ui/components/Skeleton';
import { EvidenceLine } from '../../src/ui/components/EvidenceLine';
import { ThoughtBubble } from '../../src/ui/components/ThoughtBubble';
import { EmptyState } from '../../src/ui/components/EmptyState';
import { ErrorBubble } from '../../src/ui/components/ErrorBubble';
import { Toast } from '../../src/ui/components/Toast';
import { componentsCopy } from '../../src/copy/components';

export default function DevGalleryComponentsRoute(): React.JSX.Element {
  return (
    <ThemeProvider initialPreference="light">
      <GalleryComponentsContent />
    </ThemeProvider>
  );
}

function GalleryComponentsContent(): React.JSX.Element {
  const {
    mode,
    preference,
    setPreference,
    reducedMotion,
    setReducedMotionOverride,
    colors,
    accents
  } = useTheme();

  // Component demo state hooks
  const [sliderVal, setSliderVal] = useState<number | null>(null);
  const [batteryVal, setBatteryVal] = useState<number>(75);
  const [batteryDragMode, setBatteryDragMode] = useState<boolean>(true);
  const [rhythmFilled, setRhythmFilled] = useState<number>(3);
  const [selectedAvatarExpr, setSelectedAvatarExpr] = useState<CharacterExpression>('warm');
  const [selectedMascotPose, setSelectedMascotPose] = useState<WincePose>('curious');
  const [sheetOpen, setSheetOpen] = useState<boolean>(false);
  const [thoughtPoppedKey, setThoughtPoppedKey] = useState<number>(0);
  const [errorShakeTrigger, setErrorShakeTrigger] = useState<boolean>(true);
  const [toastVisible, setToastVisible] = useState<boolean>(false);
  const [evidenceTrigger, setEvidenceTrigger] = useState<boolean>(true);

  const resetAll = () => {
    setSliderVal(null);
    setBatteryVal(75);
    setRhythmFilled(3);
    setThoughtPoppedKey(prev => prev + 1);
    setToastVisible(false);
    setSheetOpen(false);
  };

  const expressions: CharacterExpression[] = [
    'neutral',
    'warm',
    'distracted',
    'wrapping_up'
  ];

  const poses: WincePose[] = [
    'curious',
    'sleepy',
    'thinking',
    'proud',
    'peeking',
    'offline'
  ];

  return (
    <Screen style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text role="displayMedium" style={{ color: colors.ink }}>
            {componentsCopy.gallery.title}
          </Text>
          <Text role="bodyMedium" style={{ color: colors.muted, marginTop: 4 }}>
            {componentsCopy.gallery.subtitle}
          </Text>
        </View>

        {/* Global Controls: Mode & Reduced Motion */}
        <Card style={styles.controlsCard}>
          <Text role="titleSmall" style={{ color: colors.ink, marginBottom: 8 }}>
            {componentsCopy.gallery.appearanceLabel} {mode.toUpperCase()}
          </Text>
          <View style={styles.row}>
            <Chip
              label="Daylight"
              selected={preference === 'light'}
              onPress={() => setPreference('light')}
              tint="honey"
            />
            <Chip
              label="Midnight"
              selected={preference === 'dark'}
              onPress={() => setPreference('dark')}
              tint="lilac"
            />
            <Chip
              label="System Auto"
              selected={preference === 'auto'}
              onPress={() => setPreference('auto')}
              tint="neutral"
            />
          </View>

          <Text role="titleSmall" style={{ color: colors.ink, marginTop: 16, marginBottom: 8 }}>
            {componentsCopy.gallery.reducedMotionLabel} {reducedMotion ? 'ON' : 'OFF'}
          </Text>
          <View style={styles.row}>
            <Chip
              label="Motion Enabled"
              selected={!reducedMotion}
              onPress={() => setReducedMotionOverride(false)}
              tint="mint"
            />
            <Chip
              label="Reduced Motion (Halted)"
              selected={reducedMotion}
              onPress={() => setReducedMotionOverride(true)}
              tint="bubblegum"
            />
            <Button
              label={componentsCopy.gallery.resetAll}
              onPress={resetAll}
              variant="secondary"
              style={{ marginLeft: 'auto' }}
            />
          </View>
        </Card>

        {/* 1. NoDefaultSlider */}
        <Card style={styles.sectionCard}>
          <Text role="titleMedium" style={{ color: colors.ink, marginBottom: 4 }}>
            {componentsCopy.gallery.sections.slider}
          </Text>
          <Text role="bodySmall" style={{ color: colors.muted, marginBottom: 12 }}>
            Starts strictly null until touched. Thumb inflates with spring.
          </Text>
          <NoDefaultSlider
            value={sliderVal}
            onChange={val => setSliderVal(val)}
            min={0}
            max={10}
            step={1}
          />
        </Card>

        {/* 2. BatteryGauge */}
        <Card style={styles.sectionCard}>
          <Text role="titleMedium" style={{ color: colors.ink, marginBottom: 4 }}>
            {componentsCopy.gallery.sections.battery}
          </Text>
          <Text role="bodySmall" style={{ color: colors.muted, marginBottom: 12 }}>
            Liquid sloshing wave. Mint (&gt;60%), Honey (30-60%), Ember (&lt;30%).
          </Text>
          <View style={styles.rowCentered}>
            <BatteryGauge
              value={batteryVal}
              onChange={val => setBatteryVal(val)}
              mode={batteryDragMode ? 'drag' : 'display'}
              size="lg"
            />
            <View style={styles.batteryControls}>
              <View style={styles.row}>
                <Chip
                  label="Drag Mode"
                  selected={batteryDragMode}
                  onPress={() => setBatteryDragMode(true)}
                  tint="mint"
                />
                <Chip
                  label="Display Only"
                  selected={!batteryDragMode}
                  onPress={() => setBatteryDragMode(false)}
                  tint="sky"
                />
              </View>
              <View style={[styles.row, { marginTop: 8 }]}>
                <Button label="20% (Ember)" variant="ghost" onPress={() => setBatteryVal(20)} />
                <Button label="45% (Honey)" variant="ghost" onPress={() => setBatteryVal(45)} />
                <Button label="85% (Mint)" variant="ghost" onPress={() => setBatteryVal(85)} />
              </View>
            </View>
          </View>
        </Card>

        {/* 3. RhythmRing */}
        <Card style={styles.sectionCard}>
          <Text role="titleMedium" style={{ color: colors.ink, marginBottom: 4 }}>
            {componentsCopy.gallery.sections.rhythm}
          </Text>
          <View style={styles.rowCentered}>
            <RhythmRing totalSegments={5} filledSegments={rhythmFilled} size={96} />
            <View style={styles.batteryControls}>
              <View style={styles.row}>
                {[0, 1, 2, 3, 4, 5].map(cnt => (
                  <Chip
                    key={cnt}
                    label={`${cnt}`}
                    selected={rhythmFilled === cnt}
                    onPress={() => setRhythmFilled(cnt)}
                    tint="mint"
                  />
                ))}
              </View>
            </View>
          </View>
        </Card>

        {/* 4. ChatBubble */}
        <Card style={styles.sectionCard}>
          <Text role="titleMedium" style={{ color: colors.ink, marginBottom: 8 }}>
            {componentsCopy.gallery.sections.chat}
          </Text>
          <ChatBubble
            variant="partner"
            senderName="Maya"
            text="Hey! What got you started on design systems?"
          />
          <ChatBubble
            variant="user"
            text="I love making complex components feel delightfully simple."
          />
          <ChatBubble
            variant="thought"
            senderName="Maya's thought"
            text="She seems really passionate about craft."
          />
        </Card>

        {/* 5. TypingDots */}
        <Card style={styles.sectionCard}>
          <Text role="titleMedium" style={{ color: colors.ink, marginBottom: 8 }}>
            {componentsCopy.gallery.sections.typing}
          </Text>
          <View style={styles.row}>
            <TypingDots partnerName="Maya" color={accents.lilac.pop} />
            <TypingDots partnerName="Priya" color={accents.mint.pop} />
            <TypingDots partnerName="Sam" color={accents.sky.pop} />
          </View>
        </Card>

        {/* 6. CharacterAvatar */}
        <Card style={styles.sectionCard}>
          <Text role="titleMedium" style={{ color: colors.ink, marginBottom: 8 }}>
            {componentsCopy.gallery.sections.avatar}
          </Text>
          <View style={styles.row}>
            {expressions.map(expr => (
              <Chip
                key={expr}
                label={expr}
                selected={selectedAvatarExpr === expr}
                onPress={() => setSelectedAvatarExpr(expr)}
                tint="lilac"
              />
            ))}
          </View>
          <View style={[styles.row, { marginTop: 12, gap: 12 }]}>
            <CharacterAvatar character="maya" expression={selectedAvatarExpr} size="lg" />
            <CharacterAvatar character="priya" expression={selectedAvatarExpr} size="lg" />
            <CharacterAvatar character="sam" expression={selectedAvatarExpr} size="lg" />
            <CharacterAvatar character="alex" expression={selectedAvatarExpr} size="lg" />
            <CharacterAvatar character="elena" expression={selectedAvatarExpr} size="lg" />
            <CharacterAvatar character="marcus" expression={selectedAvatarExpr} size="lg" />
          </View>
        </Card>

        {/* 7. WinceMascot */}
        <Card style={styles.sectionCard}>
          <Text role="titleMedium" style={{ color: colors.ink, marginBottom: 8 }}>
            {componentsCopy.gallery.sections.mascot}
          </Text>
          <View style={styles.row}>
            {poses.map(pose => (
              <Chip
                key={pose}
                label={pose}
                selected={selectedMascotPose === pose}
                onPress={() => setSelectedMascotPose(pose)}
                tint="honey"
              />
            ))}
          </View>
          <View style={[styles.rowCentered, { marginTop: 16 }]}>
            <WinceMascot pose={selectedMascotPose} size={88} />
          </View>
        </Card>

        {/* 8. BottomSheet */}
        <Card style={styles.sectionCard}>
          <Text role="titleMedium" style={{ color: colors.ink, marginBottom: 8 }}>
            {componentsCopy.gallery.sections.bottomSheet}
          </Text>
          <Button
            label={componentsCopy.gallery.controls.openSheet}
            onPress={() => setSheetOpen(true)}
            variant="secondary"
          />
          <BottomSheet
            visible={sheetOpen}
            onDismiss={() => setSheetOpen(false)}
            title={componentsCopy.gallery.controls.sheetTitle}
          >
            <Text role="bodyLarge" style={{ color: colors.ink, marginBottom: 16 }}>
              {componentsCopy.gallery.controls.sheetBody}
            </Text>
            <Button
              label={componentsCopy.gallery.controls.sheetButton}
              onPress={() => setSheetOpen(false)}
              variant="primary"
            />
          </BottomSheet>
        </Card>

        {/* 9. Skeleton */}
        <Card style={styles.sectionCard}>
          <Text role="titleMedium" style={{ color: colors.ink, marginBottom: 8 }}>
            {componentsCopy.gallery.sections.skeleton}
          </Text>
          <Skeleton shape="text" width="60%" />
          <Skeleton shape="text" width="90%" />
          <Skeleton shape="card" height={56} />
        </Card>

        {/* 10. EvidenceLine */}
        <Card style={styles.sectionCard}>
          <Text role="titleMedium" style={{ color: colors.ink, marginBottom: 8 }}>
            {componentsCopy.gallery.sections.evidence}
          </Text>
          <Button
            label="Replay Highlighter Swipe"
            onPress={() => setEvidenceTrigger(prev => !prev)}
            variant="ghost"
            style={{ marginBottom: 8, alignSelf: 'flex-start' }}
          />
          <EvidenceLine
            quote={componentsCopy.gallery.controls.sampleEvidenceQuote}
            contextNote={componentsCopy.gallery.controls.sampleEvidenceContext}
            triggerSwipe={evidenceTrigger}
            tilted={true}
          />
        </Card>

        {/* 11. ThoughtBubble */}
        <Card style={styles.sectionCard}>
          <Text role="titleMedium" style={{ color: colors.ink, marginBottom: 8 }}>
            {componentsCopy.gallery.sections.thought}
          </Text>
          <Button
            label={componentsCopy.gallery.controls.popReset}
            onPress={() => setThoughtPoppedKey(prev => prev + 1)}
            variant="ghost"
            style={{ marginBottom: 8, alignSelf: 'flex-start' }}
          />
          <ThoughtBubble
            key={thoughtPoppedKey}
            thought={componentsCopy.gallery.controls.sampleThought}
          />
        </Card>

        {/* 12. EmptyState */}
        <Card style={styles.sectionCard}>
          <Text role="titleMedium" style={{ color: colors.ink, marginBottom: 8 }}>
            {componentsCopy.gallery.sections.empty}
          </Text>
          <EmptyState
            pose="curious"
            title={componentsCopy.emptyState.defaultTitle}
            description={componentsCopy.emptyState.defaultDescription}
            actionLabel={componentsCopy.emptyState.defaultAction}
            onAction={() => setToastVisible(true)}
          />
        </Card>

        {/* 13. ErrorBubble */}
        <Card style={styles.sectionCard}>
          <Text role="titleMedium" style={{ color: colors.ink, marginBottom: 8 }}>
            {componentsCopy.gallery.sections.error}
          </Text>
          <Button
            label={componentsCopy.gallery.controls.triggerError}
            onPress={() => setErrorShakeTrigger(prev => !prev)}
            variant="ghost"
            style={{ marginBottom: 8, alignSelf: 'flex-start' }}
          />
          <ErrorBubble
            message={componentsCopy.gallery.controls.sampleError}
            triggerShake={errorShakeTrigger}
            onDismiss={() => {}}
          />
        </Card>

        {/* 14. Toast */}
        <Card style={styles.sectionCard}>
          <Text role="titleMedium" style={{ color: colors.ink, marginBottom: 8 }}>
            {componentsCopy.gallery.sections.toast}
          </Text>
          <Button
            label={componentsCopy.gallery.controls.showToast}
            onPress={() => setToastVisible(true)}
            variant="secondary"
          />
          <Toast
            visible={toastVisible}
            message={componentsCopy.gallery.controls.sampleToast}
            onDismiss={() => setToastVisible(false)}
            duration={3000}
          />
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 16
  },
  header: {
    marginBottom: 8
  },
  controlsCard: {
    padding: 16
  },
  sectionCard: {
    padding: 18
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center'
  },
  rowCentered: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    gap: 16
  },
  batteryControls: {
    flex: 1,
    paddingLeft: 12
  }
});
