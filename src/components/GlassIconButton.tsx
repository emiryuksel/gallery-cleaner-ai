import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { GlassSurface } from './GlassSurface';
import { AppIcon, AppIconName } from './AppIcon';
import { theme } from '../theme';

interface GlassIconButtonProps {
  icon: AppIconName;
  label?: string;
  tintColor?: string;
  iconColor?: string;
  size?: number;
  disabled?: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

/** iOS tarzı dairesel liquid glass aksiyon butonu. */
export function GlassIconButton({
  icon,
  label,
  tintColor,
  iconColor = theme.colors.textPrimary,
  size = 64,
  disabled,
  onPress,
  style,
}: GlassIconButtonProps) {
  const iconSize = Math.round(size * 0.38);

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.wrap, style, { opacity: pressed || disabled ? 0.65 : 1 }]}
    >
      <GlassSurface
        isInteractive
        glassEffectStyle="regular"
        tintColor={tintColor}
        radius={size / 2}
        elevation="floating"
        style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}
      >
        <AppIcon name={icon} size={iconSize} color={iconColor} />
      </GlassSurface>
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    letterSpacing: 0.2,
  },
});
