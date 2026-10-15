import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View
} from 'react-native';
import { ThemeProvider, useTheme } from '../../src/theme/ThemeProvider';
import { Screen } from '../../src/ui/primitives/Screen';
import { Text, HighlighterSwipe } from '../../src/ui/primitives/Text';
import { Button } from '../../src/ui/primitives/Button';
import { Chip, type ChipTint } from '../../src/ui/primitives/Chip';
import { Card } from '../../src/ui/primitives/Card';
import { Icon, type IconName } from '../../src/ui/icons/Icon';
import { commonCopy } from '../../src/copy/common';

export default function DevGalleryRoute(): React.JSX.Element {
  return (
    <ThemeProvider initialPreference="light">
      <GalleryContent />
    </ThemeProvider>
  );
}

function GalleryContent(): React.JSX.Element {
  const {
    mode,
    preference,
    setPreference,
    reducedMotion,
    setReducedMotionOverride,
    colors,
    accents
  } = useTheme();

  const [selectedChip, setSelectedChip] = useState<string>('lilac');
  const [selectedButton, setSelectedButton] = useState<boolean>(false);

  const icons: IconName[] = [
    'home',
    'path',
    'calendar',
    'person',
    'plus',
    'back',
    'send',
    'check',
    'close',
    'battery'
  ];

  const tints: ChipTint[] = [
    'lilac',
    'mint',
    'honey',
    'sky',
    'bubblegum',
    'ember',
    'neutral'
  ];

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        testID="gallery-scrollview"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text role="displayMedium" style={styles.headerTitle}>
            {commonCopy.gallery.title}
          </Text>
          <Text role="bodyLarge" muted style={styles.headerSubtitle}>
            {commonCopy.gallery.subtitle}
          </Text>
        </View>

        {/* Global Controls Section */}
        <Card style={styles.controlsCard}>
          <Text role="titleSmall" style={styles.sectionHeader}>
            {commonCopy.gallery.appearanceLabel} (Current: {mode.toUpperCase()})
          </Text>
          <View style={styles.rowWrap}>
            <Button
              variant={preference === 'light' ? 'primary' : 'secondary'}
              label={commonCopy.theme.light}
              onPress={() => setPreference('light')}
            />
            <Button
              variant={preference === 'dark' ? 'primary' : 'secondary'}
              label={commonCopy.theme.dark}
              onPress={() => setPreference('dark')}
            />
            <Button
              variant={preference === 'auto' ? 'primary' : 'secondary'}
              label={commonCopy.theme.auto}
              onPress={() => setPreference('auto')}
            />
          </View>

          <View style={styles.divider} />

          <Text role="titleSmall" style={styles.sectionHeader}>
            {commonCopy.gallery.reducedMotionLabel} ({reducedMotion ? 'ON' : 'OFF'})
          </Text>
          <View style={styles.rowWrap}>
            <Button
              variant={reducedMotion ? 'primary' : 'secondary'}
              label="Reduce Motion: Active"
              onPress={() => setReducedMotionOverride(true)}
            />
            <Button
              variant={!reducedMotion ? 'primary' : 'secondary'}
              label="Reduce Motion: Disabled"
              onPress={() => setReducedMotionOverride(false)}
            />
          </View>
        </Card>

        {/* 1. Typography Showcase */}
        <View style={styles.section}>
          <Text role="titleLarge" style={styles.sectionTitle}>
            1. {commonCopy.gallery.sectionTypography}
          </Text>

          <Card style={styles.sampleCard}>
            <HighlighterSwipe tint={accents.honey.tint}>
              <Text role="displayLarge">Instrument Serif</Text>
            </HighlighterSwipe>
            <Text role="displayMedium">Display Medium 32pt</Text>
            <Text role="titleLarge">Bricolage Grotesque Title Large 24pt</Text>
            <Text role="titleMedium">Title Medium 20pt</Text>
            <Text role="titleSmall">Title Small 16pt</Text>
            <Text role="bodyLarge">Plus Jakarta Sans Body Large 16pt</Text>
            <Text role="bodyMedium">Body Medium 14pt (Standard Text)</Text>
            <Text role="bodySmall" muted>
              Body Small 12pt (Muted helper text)
            </Text>
            <Text role="labelLarge">Label Large 14pt Semibold</Text>
            <Text role="labelSmall">LABEL SMALL 10PT ALL CAPS</Text>

            <View style={styles.divider} />
            <Text role="bodyMedium">
              {commonCopy.gallery.highlighterSentence}
              <HighlighterSwipe tint={accents.lilac.tint}>
                <Text role="bodyMedium" style={{ fontWeight: '700' }}>
                  {commonCopy.gallery.highlighterWord}
                </Text>
              </HighlighterSwipe>
              .
            </Text>
          </Card>
        </View>

        {/* 2. Buttons & States */}
        <View style={styles.section}>
          <Text role="titleLarge" style={styles.sectionTitle}>
            2. {commonCopy.gallery.sectionButtons}
          </Text>
          <Text role="bodySmall" muted style={styles.hintText}>
            {commonCopy.gallery.squishHint}
          </Text>

          <View style={styles.rowWrap}>
            <Button
              variant="primary"
              label={commonCopy.gallery.primaryButton}
              onPress={() => {}}
            />
            <Button
              variant="secondary"
              label={commonCopy.gallery.secondaryButton}
              onPress={() => {}}
            />
            <Button
              variant="ghost"
              label={commonCopy.gallery.ghostButton}
              onPress={() => {}}
            />
          </View>

          <View style={styles.rowWrap}>
            <Button
              variant="primary"
              label="Selected State"
              selected={selectedButton}
              onPress={() => setSelectedButton(!selectedButton)}
            />
            <Button
              variant="secondary"
              label="Focused (3px Lilac)"
              focused
              onPress={() => {}}
            />
            <Button
              variant="primary"
              label={commonCopy.gallery.loadingButton}
              loading
            />
            <Button
              variant="secondary"
              label={commonCopy.gallery.disabledButton}
              disabled
            />
          </View>
        </View>

        {/* 3. Chips & Selections */}
        <View style={styles.section}>
          <Text role="titleLarge" style={styles.sectionTitle}>
            3. {commonCopy.gallery.sectionChips}
          </Text>
          <View style={styles.rowWrap}>
            {tints.map(tint => (
              <Chip
                key={tint}
                tint={tint}
                label={`${tint.charAt(0).toUpperCase() + tint.slice(1)}`}
                selected={selectedChip === tint}
                onPress={() => setSelectedChip(tint)}
              />
            ))}
            <Chip label="Focused" focused selected={false} />
            <Chip label="Disabled" disabled />
          </View>
        </View>

        {/* 4. Cards & Glossy Bead Highlight */}
        <View style={styles.section}>
          <Text role="titleLarge" style={styles.sectionTitle}>
            4. {commonCopy.gallery.sectionCards}
          </Text>

          <View style={styles.cardGrid}>
            <Card tint="neutral" style={styles.gridCard}>
              <Text role="titleSmall">Surface Card (Neutral)</Text>
              <Text role="bodySmall" muted>
                Notice the 1px top-left inner highlight giving the glossy pebble depth.
              </Text>
            </Card>

            <Card tint="lilac" style={styles.gridCard}>
              <Text role="titleSmall">Lilac Reflection</Text>
              <Text role="bodySmall" muted>
                Soft Pop 28px squircle continuous corners.
              </Text>
            </Card>

            <Card tint="mint" style={styles.gridCard}>
              <Text role="titleSmall">Mint Evidence</Text>
              <Text role="bodySmall" muted>
                Calm and positive progress feedback.
              </Text>
            </Card>

            <Card tint="honey" style={styles.gridCard}>
              <Text role="titleSmall">Honey Pivot</Text>
              <Text role="bodySmall" muted>
                Warm amber for alternatives without red alerts.
              </Text>
            </Card>

            <Card
              tint="ember"
              tilted
              tiltAngle={1.5}
              style={[styles.gridCard, { borderWidth: 1 }]}
            >
              <Text role="titleSmall">Tilted Card (1.5°)</Text>
              <Text role="bodySmall" muted>
                Purposeful editorial asymmetry.
              </Text>
            </Card>

            <Card tint="neutral" focused style={styles.gridCard}>
              <Text role="titleSmall">Focused Card</Text>
              <Text role="bodySmall" muted>
                Surrounded by 3px Lilac focus ring with 2px offset.
              </Text>
            </Card>
          </View>
        </View>

        {/* 5. Icons */}
        <View style={styles.section}>
          <Text role="titleLarge" style={styles.sectionTitle}>
            5. {commonCopy.gallery.sectionIcons}
          </Text>
          <Text role="bodySmall" muted style={styles.hintText}>
            Chunky 2.5px rounded strokes with active accent dots.
          </Text>

          <View style={styles.iconRow}>
            {icons.map(name => (
              <View key={name} style={styles.iconBlock}>
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: colors.surface1, borderColor: colors.line }
                  ]}
                >
                  <Icon name={name} active={true} size={28} />
                </View>
                <Text role="labelSmall" style={styles.iconName}>
                  {name}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 24,
    paddingBottom: 64
  },
  header: {
    marginBottom: 24
  },
  headerTitle: {
    marginBottom: 6
  },
  headerSubtitle: {
    lineHeight: 22
  },
  controlsCard: {
    marginBottom: 28
  },
  section: {
    marginBottom: 32
  },
  sectionTitle: {
    marginBottom: 12
  },
  sectionHeader: {
    marginBottom: 10
  },
  hintText: {
    marginBottom: 12
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(128, 128, 128, 0.15)',
    marginVertical: 14
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'center'
  },
  sampleCard: {
    gap: 10
  },
  cardGrid: {
    gap: 16
  },
  gridCard: {
    gap: 6
  },
  iconRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16
  },
  iconBlock: {
    alignItems: 'center',
    gap: 6
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconName: {
    textAlign: 'center'
  }
});
