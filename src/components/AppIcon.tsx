import React from 'react';
import { StyleProp, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

export type AppIconName = React.ComponentProps<typeof Ionicons>['name'];

interface AppIconProps {
  name: AppIconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}

/** SF Symbols benzeri sistem ikonları — emoji yerine kullanılır. */
export function AppIcon({
  name,
  size = 22,
  color = theme.colors.textPrimary,
  style,
}: AppIconProps) {
  return <Ionicons name={name} size={size} color={color} style={style} />;
}
