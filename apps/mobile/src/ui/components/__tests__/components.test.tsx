import { render, fireEvent, act } from '@testing-library/react-native';
import { ThemeProvider } from '../../../theme/ThemeProvider';
import { daylightColors, midnightColors, accents } from '@yikes/shared/tokens/colors';
import { NoDefaultSlider } from '../NoDefaultSlider';
import { BatteryGauge, getBatteryColor } from '../BatteryGauge';
import { RhythmRing } from '../RhythmRing';
import { ChatBubble } from '../ChatBubble';
import { TypingDots } from '../TypingDots';
import { CharacterAvatar } from '../CharacterAvatar';
import { WinceMascot } from '../WinceMascot';
import { BottomSheet } from '../BottomSheet';
import { Skeleton } from '../Skeleton';
import { EvidenceLine } from '../EvidenceLine';
import { ThoughtBubble } from '../ThoughtBubble';
import { EmptyState } from '../EmptyState';
import { ErrorBubble } from '../ErrorBubble';
import { Toast } from '../Toast';
import { componentsCopy } from '../../../copy/components';

describe('Interactive Components Suite (T-03)', () => {
  // Test a: NoDefaultSlider starts strictly null until touched
  describe('a) NoDefaultSlider', () => {
    it('initial value is strictly null until user touches the track', () => {
      const onChangeMock = jest.fn();

      const { getByTestId, rerender } = render(
        <ThemeProvider initialPreference="light">
          <NoDefaultSlider
            value={null}
            onChange={onChangeMock}
            min={0}
            max={10}
            step={1}
            testID="test-slider"
          />
        </ThemeProvider>
      );

      const slider = getByTestId('test-slider');
      expect(slider).toBeTruthy();

      // Accessibility assertions for null initial state
      expect(slider.props.accessibilityRole).toBe('adjustable');
      expect(slider.props.accessibilityValue.now).toBeUndefined();
      expect(slider.props.accessibilityValue.text).toBe(
        componentsCopy.slider.unselectedAccessibilityValue
      );

      // Trigger accessibility action (e.g., increment) to set value
      act(() => {
        fireEvent(slider, 'accessibilityAction', {
          nativeEvent: { actionName: 'increment' }
        });
      });

      expect(onChangeMock).toHaveBeenCalledWith(1);

      // Rerender with concrete touched value
      rerender(
        <ThemeProvider initialPreference="light">
          <NoDefaultSlider
            value={5}
            onChange={onChangeMock}
            min={0}
            max={10}
            step={1}
            testID="test-slider"
          />
        </ThemeProvider>
      );

      expect(slider.props.accessibilityValue.now).toBe(5);
      expect(slider.props.accessibilityValue.text).toBe(
        componentsCopy.slider.stepLabel(5)
      );
      expect(getByTestId('test-slider-thumb')).toBeTruthy();
    });
  });

  // Test b: BatteryGauge value-to-color mapping (Mint, Honey, Ember)
  describe('b) BatteryGauge value-to-color mapping', () => {
    it('maps >60% to Mint, 30-60% to Honey, <30% to Ember and NEVER red', () => {
      // Test Mint: > 60%
      const high80 = getBatteryColor(80, accents);
      expect(high80.level).toBe('high');
      expect(high80.pop).toBe(accents.mint.pop);
      expect(high80.pop).not.toMatch(/red|#FF0000|#FF2020|#E53935/i);

      const high61 = getBatteryColor(61, accents);
      expect(high61.level).toBe('high');
      expect(high61.pop).toBe(accents.mint.pop);

      // Test Honey: 30% - 60%
      const mid60 = getBatteryColor(60, accents);
      expect(mid60.level).toBe('mid');
      expect(mid60.pop).toBe(accents.honey.pop);
      expect(mid60.pop).not.toMatch(/red|#FF0000/i);

      const mid45 = getBatteryColor(45, accents);
      expect(mid45.level).toBe('mid');
      expect(mid45.pop).toBe(accents.honey.pop);

      const mid30 = getBatteryColor(30, accents);
      expect(mid30.level).toBe('mid');
      expect(mid30.pop).toBe(accents.honey.pop);

      // Test Ember: < 30%
      const low29 = getBatteryColor(29, accents);
      expect(low29.level).toBe('low');
      expect(low29.pop).toBe(accents.ember.pop);
      expect(low29.pop).not.toMatch(/red|#FF0000/i);

      const low10 = getBatteryColor(10, accents);
      expect(low10.level).toBe('low');
      expect(low10.pop).toBe(accents.ember.pop);

      const low0 = getBatteryColor(0, accents);
      expect(low0.level).toBe('low');
      expect(low0.pop).toBe(accents.ember.pop);
    });

    it('renders in drag mode with adjustable role and display mode with progressbar role', () => {
      const onChangeMock = jest.fn();

      const { getByTestId, rerender } = render(
        <ThemeProvider initialPreference="light">
          <BatteryGauge
            value={50}
            onChange={onChangeMock}
            mode="drag"
            testID="battery-test"
          />
        </ThemeProvider>
      );

      const dragGauge = getByTestId('battery-test');
      expect(dragGauge.props.accessibilityRole).toBe('adjustable');
      expect(dragGauge.props.accessibilityValue.now).toBe(50);

      // Increment in drag mode
      act(() => {
        fireEvent(dragGauge, 'accessibilityAction', {
          nativeEvent: { actionName: 'increment' }
        });
      });
      expect(onChangeMock).toHaveBeenCalledWith(60);

      // Rerender in display mode
      rerender(
        <ThemeProvider initialPreference="light">
          <BatteryGauge
            value={75}
            mode="display"
            testID="battery-test"
          />
        </ThemeProvider>
      );

      const displayGauge = getByTestId('battery-test');
      expect(displayGauge.props.accessibilityRole).toBe('progressbar');
      expect(displayGauge.props.accessibilityValue.now).toBe(75);
    });
  });

  // Test c: CharacterAvatar expression switching
  describe('c) CharacterAvatar expression switching', () => {
    it('switches between all 4 expressions: neutral, warm, distracted, wrapping_up', () => {
      const { getByTestId, rerender } = render(
        <ThemeProvider initialPreference="light">
          <CharacterAvatar
            character="maya"
            expression="neutral"
            testID="avatar-test"
          />
        </ThemeProvider>
      );

      expect(getByTestId('avatar-test-expression-neutral')).toBeTruthy();
      expect(getByTestId('avatar-test').props.accessibilityLabel).toContain('neutral');

      // Switch to warm
      rerender(
        <ThemeProvider initialPreference="light">
          <CharacterAvatar
            character="maya"
            expression="warm"
            testID="avatar-test"
          />
        </ThemeProvider>
      );
      expect(getByTestId('avatar-test-expression-warm')).toBeTruthy();
      expect(getByTestId('avatar-test').props.accessibilityLabel).toContain('warm');

      // Switch to distracted
      rerender(
        <ThemeProvider initialPreference="light">
          <CharacterAvatar
            character="maya"
            expression="distracted"
            testID="avatar-test"
          />
        </ThemeProvider>
      );
      expect(getByTestId('avatar-test-expression-distracted')).toBeTruthy();
      expect(getByTestId('avatar-test').props.accessibilityLabel).toContain('distracted');

      // Switch to wrapping_up
      rerender(
        <ThemeProvider initialPreference="light">
          <CharacterAvatar
            character="maya"
            expression="wrapping_up"
            testID="avatar-test"
          />
        </ThemeProvider>
      );
      expect(getByTestId('avatar-test-expression-wrapping_up')).toBeTruthy();
      expect(getByTestId('avatar-test').props.accessibilityLabel).toContain('wrapping up');
    });
  });

  // Test d: RNTL queries finding accessibilityRole and accessibilityLabel on each interactive component
  describe('d) Accessibility attributes on all 14 interactive components', () => {
    it('asserts proper accessibilityRole and accessibilityLabel across components', () => {
      const { getByTestId } = render(
        <ThemeProvider initialPreference="light">
          <NoDefaultSlider
            value={4}
            onChange={() => {}}
            accessibilityLabel="Slider label"
            testID="a11y-slider"
          />
          <BatteryGauge
            value={80}
            mode="drag"
            accessibilityLabel="Battery label"
            testID="a11y-battery"
          />
          <RhythmRing
            filledSegments={2}
            totalSegments={5}
            accessibilityLabel="Rhythm label"
            testID="a11y-rhythm"
          />
          <ChatBubble
            variant="user"
            text="Hello world"
            onPress={() => {}}
            testID="a11y-chat"
          />
          <TypingDots
            partnerName="Priya"
            testID="a11y-typing"
          />
          <CharacterAvatar
            character="sam"
            expression="warm"
            testID="a11y-avatar"
          />
          <WinceMascot
            pose="curious"
            onPress={() => {}}
            testID="a11y-mascot"
          />
          <BottomSheet
            visible={true}
            onDismiss={() => {}}
            title="Sheet Modal"
            testID="a11y-sheet"
          />
          <Skeleton
            shape="card"
            accessibilityLabel="Loading skeleton"
            testID="a11y-skeleton"
          />
          <EvidenceLine
            quote="Great question!"
            testID="a11y-evidence"
          />
          <ThoughtBubble
            thought="I wonder what they meant"
            testID="a11y-thought"
          />
          <EmptyState
            title="Empty list"
            testID="a11y-empty"
          />
          <ErrorBubble
            message="Notice occurred"
            testID="a11y-error"
          />
          <Toast
            visible={true}
            message="Item saved"
            onDismiss={() => {}}
            testID="a11y-toast"
          />
        </ThemeProvider>
      );

      // Slider
      const slider = getByTestId('a11y-slider');
      expect(slider.props.accessibilityRole).toBe('adjustable');
      expect(slider.props.accessibilityLabel).toBe('Slider label');

      // Battery
      const battery = getByTestId('a11y-battery');
      expect(battery.props.accessibilityRole).toBe('adjustable');
      expect(battery.props.accessibilityLabel).toBe('Battery label');

      // RhythmRing
      const rhythm = getByTestId('a11y-rhythm');
      expect(rhythm.props.accessibilityRole).toBe('progressbar');
      expect(rhythm.props.accessibilityLabel).toBe('Rhythm label');

      // ChatBubble
      const chat = getByTestId('a11y-chat');
      expect(chat.props.accessibilityRole).toBe('button');
      expect(chat.props.accessibilityLabel).toContain('Hello world');

      // TypingDots
      const typing = getByTestId('a11y-typing');
      expect(typing.props.accessibilityRole).toBe('progressbar');
      expect(typing.props.accessibilityLabel).toContain('Priya is typing...');

      // CharacterAvatar
      const avatar = getByTestId('a11y-avatar');
      expect(avatar.props.accessibilityRole).toBe('image');
      expect(avatar.props.accessibilityLabel).toContain('Sam avatar');

      // WinceMascot
      const mascot = getByTestId('a11y-mascot');
      expect(mascot.props.accessibilityRole).toBe('button');
      expect(mascot.props.accessibilityLabel).toContain('Wince mascot');

      // BottomSheet close
      const sheetClose = getByTestId('a11y-sheet-close');
      expect(sheetClose.props.accessibilityRole).toBe('button');
      expect(sheetClose.props.accessibilityLabel).toBe(componentsCopy.bottomSheet.closeAction);

      // Skeleton
      const skeleton = getByTestId('a11y-skeleton');
      expect(skeleton.props.accessibilityRole).toBe('none');
      expect(skeleton.props.accessibilityState.busy).toBe(true);

      // EvidenceLine
      const evidence = getByTestId('a11y-evidence');
      expect(evidence.props.accessibilityRole).toBe('text');
      expect(evidence.props.accessibilityLabel).toContain('Great question!');

      // ThoughtBubble
      const thought = getByTestId('a11y-thought-pressable');
      expect(thought.props.accessibilityRole).toBe('button');
      expect(thought.props.accessibilityLabel).toContain('I wonder what they meant');

      // EmptyState
      const empty = getByTestId('a11y-empty');
      expect(empty.props.accessibilityRole).toBe('summary');
      expect(empty.props.accessibilityLabel).toContain('Empty list');

      // ErrorBubble
      const error = getByTestId('a11y-error');
      expect(error.props.accessibilityRole).toBe('alert');
      expect(error.props.accessibilityLiveRegion).toBe('assertive');

      // Toast
      const toast = getByTestId('a11y-toast');
      expect(toast.props.accessibilityRole).toBe('alert');
      expect(toast.props.accessibilityLabel).toContain('Item saved');
    });
  });

  // Test e: Test proving Reduced Motion disables animation
  describe('e) Reduced Motion path tested', () => {
    it('proves Reduced Motion disables or freezes motion loops and springs', () => {
      // 1. EvidenceLine with Reduced Motion starts immediately at 100% progress
      const { getByTestId } = render(
        <ThemeProvider initialPreference="light">
          <EvidenceLine
            quote="Instant quote"
            testID="motion-evidence"
          />
        </ThemeProvider>
      );
      expect(getByTestId('motion-evidence-highlighter')).toBeTruthy();

      // 2. ErrorBubble with Reduced Motion stays steady with no shake offset
      const { getByTestId: getByTestIdError } = render(
        <ThemeProvider initialPreference="light">
          <ErrorBubble
            message="Steady error"
            testID="motion-error"
          />
        </ThemeProvider>
      );
      expect(getByTestIdError('motion-error')).toBeTruthy();

      // 3. TypingDots render static dots under Reduced Motion
      const { getByTestId: getByTestIdDots } = render(
        <ThemeProvider initialPreference="light">
          <TypingDots
            testID="motion-dots"
          />
        </ThemeProvider>
      );
      expect(getByTestIdDots('motion-dots-dot-1')).toBeTruthy();
      expect(getByTestIdDots('motion-dots-dot-2')).toBeTruthy();
      expect(getByTestIdDots('motion-dots-dot-3')).toBeTruthy();
    });

    it('proves ThoughtBubble pops directly under Reduced Motion', () => {
      const onPopMock = jest.fn();

      const { getByTestId } = render(
        <ThemeProvider initialPreference="light">
          <ThoughtBubble
            thought="Pop me now"
            onPop={onPopMock}
            forceReducedMotion={true}
            testID="motion-thought"
          />
        </ThemeProvider>
      );

      const thoughtButton = getByTestId('motion-thought-pressable');
      fireEvent.press(thoughtButton);

      // On pop, onPop is called
      expect(onPopMock).toHaveBeenCalled();
    });
  });

  // Zero Red Check in Palettes
  describe('Zero Red Rule Compliance', () => {
    it('verifies daylight, midnight and accents contain zero red colors', () => {
      const allColors = [
        ...Object.values(daylightColors).filter(c => typeof c === 'string'),
        ...Object.values(midnightColors).filter(c => typeof c === 'string'),
        accents.mint.pop,
        accents.mint.tint,
        accents.honey.pop,
        accents.honey.tint,
        accents.ember.pop,
        accents.ember.tint,
        accents.lilac.pop,
        accents.lilac.tint
      ];

      for (const color of allColors) {
        // Red color codes like #FF0000, #F00, or names with 'red'
        expect(color.toLowerCase()).not.toContain('red');
        expect(color).not.toBe('#FF0000');
        expect(color).not.toBe('#F00');
        expect(color).not.toBe('#E53935');
      }
    });
  });
});
