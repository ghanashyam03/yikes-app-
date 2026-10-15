import React from 'react';
import { StyleSheet, View } from 'react-native';
import { HomeIcon, type IconProps } from './HomeIcon';
import { PathIcon } from './PathIcon';
import { CalendarIcon } from './CalendarIcon';
import { PersonIcon } from './PersonIcon';
import { PlusIcon } from './PlusIcon';
import { BackIcon } from './BackIcon';
import { SendIcon } from './SendIcon';
import { CheckIcon } from './CheckIcon';
import { CloseIcon } from './CloseIcon';
import { BatteryIcon, type BatteryIconProps } from './BatteryIcon';

export type IconName =
  | 'home'
  | 'path'
  | 'calendar'
  | 'person'
  | 'plus'
  | 'back'
  | 'send'
  | 'check'
  | 'close'
  | 'battery';

export interface UnifiedIconProps extends IconProps {
  name: IconName;
  batteryLevel?: number;
  enforceMinTarget?: boolean;
}

export function Icon({
  name,
  batteryLevel,
  enforceMinTarget = false,
  ...props
}: UnifiedIconProps): React.JSX.Element {
  let iconElement: React.JSX.Element;

  switch (name) {
    case 'home':
      iconElement = <HomeIcon {...props} />;
      break;
    case 'path':
      iconElement = <PathIcon {...props} />;
      break;
    case 'calendar':
      iconElement = <CalendarIcon {...props} />;
      break;
    case 'person':
      iconElement = <PersonIcon {...props} />;
      break;
    case 'plus':
      iconElement = <PlusIcon {...props} />;
      break;
    case 'back':
      iconElement = <BackIcon {...props} />;
      break;
    case 'send':
      iconElement = <SendIcon {...props} />;
      break;
    case 'check':
      iconElement = <CheckIcon {...props} />;
      break;
    case 'close':
      iconElement = <CloseIcon {...props} />;
      break;
    case 'battery':
      iconElement = <BatteryIcon level={batteryLevel} {...(props as BatteryIconProps)} />;
      break;
  }

  if (enforceMinTarget) {
    return <View style={styles.targetContainer}>{iconElement}</View>;
  }

  return iconElement;
}

const styles = StyleSheet.create({
  targetContainer: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
