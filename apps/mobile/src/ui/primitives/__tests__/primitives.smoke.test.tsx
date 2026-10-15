import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../../../theme/ThemeProvider';
import { Text, HighlighterSwipe } from '../Text';
import { Button } from '../Button';
import { Chip } from '../Chip';
import { Card } from '../Card';
import { Icon } from '../../icons/Icon';

describe('UI Primitives and States', () => {
  it('renders Text with roles and highlighter swipe', () => {
    const { getByText } = render(
      <ThemeProvider initialPreference="light">
        <Text role="displayLarge">Headline</Text>
        <HighlighterSwipe>
          <Text role="titleMedium">Highlighted Word</Text>
        </HighlighterSwipe>
      </ThemeProvider>
    );

    expect(getByText('Headline')).toBeTruthy();
    expect(getByText('Highlighted Word')).toBeTruthy();
  });

  it('renders Button in all states: default, loading, disabled, focused, selected', () => {
    const onPressMock = jest.fn();

    const { getByText, getByRole, rerender } = render(
      <ThemeProvider initialPreference="light">
        <Button label="Click Me" onPress={onPressMock} />
      </ThemeProvider>
    );

    const button = getByRole('button');
    expect(getByText('Click Me')).toBeTruthy();

    fireEvent.press(button);
    expect(onPressMock).toHaveBeenCalledTimes(1);

    // Test loading state
    rerender(
      <ThemeProvider initialPreference="light">
        <Button label="Click Me" loading />
      </ThemeProvider>
    );
    expect(button.props.accessibilityState.busy).toBe(true);

    // Test disabled state
    rerender(
      <ThemeProvider initialPreference="light">
        <Button label="Click Me" disabled onPress={onPressMock} />
      </ThemeProvider>
    );
    expect(button.props.accessibilityState.disabled).toBe(true);
    fireEvent.press(button);
    expect(onPressMock).toHaveBeenCalledTimes(1); // not called again

    // Test focused state
    rerender(
      <ThemeProvider initialPreference="light">
        <Button label="Click Me" focused />
      </ThemeProvider>
    );
    expect(button).toBeTruthy();

    // Test selected state
    rerender(
      <ThemeProvider initialPreference="light">
        <Button label="Click Me" selected />
      </ThemeProvider>
    );
    expect(button.props.accessibilityState.selected).toBe(true);
  });

  it('renders Chip with selection and pop interaction', () => {
    const onPressMock = jest.fn();

    const { getByRole, getByText } = render(
      <ThemeProvider initialPreference="light">
        <Chip label="Option 1" selected={true} onPress={onPressMock} />
      </ThemeProvider>
    );

    expect(getByText('Option 1')).toBeTruthy();
    const chip = getByRole('checkbox');
    expect(chip.props.accessibilityState.checked).toBe(true);

    fireEvent.press(chip);
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('renders Card with glossy bead and tint variants', () => {
    const onPressMock = jest.fn();

    const { getByText } = render(
      <ThemeProvider initialPreference="dark">
        <Card tint="lilac" onPress={onPressMock}>
          <Text role="bodyLarge">Glossy Card Content</Text>
        </Card>
      </ThemeProvider>
    );

    expect(getByText('Glossy Card Content')).toBeTruthy();
  });

  it('renders all 10 required SVG icons', () => {
    const iconNames = [
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
    ] as const;

    const { getByLabelText } = render(
      <ThemeProvider initialPreference="light">
        {iconNames.map(name => (
          <Icon key={name} name={name} active={true} />
        ))}
      </ThemeProvider>
    );

    iconNames.forEach(name => {
      if (name === 'battery') {
        expect(getByLabelText(/Battery 70%/i)).toBeTruthy();
      } else {
        expect(getByLabelText(new RegExp(name, 'i'))).toBeTruthy();
      }
    });
  });
});
