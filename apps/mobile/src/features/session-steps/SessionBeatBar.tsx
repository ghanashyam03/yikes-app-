import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { sessionCopy } from '../../copy/session';
import type { SessionBeat } from './types';

export const CORE_BEATS: SessionBeat[] = [
  'idea',
  'watch',
  'read',
  'try',
  'coach',
  'out_there',
];

export interface SessionBeatBarProps {
  currentBeat: SessionBeat;
}

export function SessionBeatBar({ currentBeat }: SessionBeatBarProps): React.JSX.Element {
  const { colors, accents, radii } = useTheme();
  const currentIdx = CORE_BEATS.indexOf(currentBeat);

  return (
    <View style={styles.container} testID="session-beat-bar" accessibilityRole="progressbar">
      {CORE_BEATS.map((beat, idx) => {
        const isCompleted = currentIdx > idx;
        const isCurrent = currentBeat === beat;

        let barColor = colors.surface2;
        if (isCurrent) {
          barColor = accents.ember.base;
        } else if (isCompleted) {
          barColor = accents.mint.base;
        }

        return (
          <View
            key={beat}
            testID={`beat-dot-${beat}`}
            accessibilityLabel={`${sessionCopy.beats[beat]}: ${isCurrent ? 'active' : isCompleted ? 'completed' : 'upcoming'}`}
            style={[
              styles.segment,
              {
                backgroundColor: barColor,
                borderRadius: radii.pill,
                height: isCurrent ? 5 : 3,
                opacity: isCurrent || isCompleted ? 1 : 0.4,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '100%',
    paddingVertical: 8,
  },
  segment: {
    flex: 1,
  },
});
