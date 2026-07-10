import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { GlassSurface } from './GlassSurface';
import { theme } from '../theme';

interface GlassButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  tintColor?: string;
  textColor?: string;
  loading?: boolean;
  style?: ViewStyle;
  containerStyle?: ViewStyle;
  fullWidth?: boolean;
}

export function GlassButton({
  label,
  tintColor,
  textColor = theme.colors.textPrimary,
  loading,
  disabled,
  style,
  containerStyle,
  fullWidth,
  ...rest
}: GlassButtonProps) {
  return (
    <Pressable
      disabled={disabled || loading}
      style={({ pressed }) => [
        fullWidth ? styles.fullWidth : null,
        containerStyle,
        { opacity: pressed || disabled ? 0.7 : 1 },
      ]}
      {...rest}
    >
      <GlassSurface
        isInteractive
        tintColor={tintColor}
        radius={theme.radius.pill}
        style={[styles.surface, style]}
      >
        {loading ? (
          <ActivityIndicator color={textColor} />
        ) : (
          <Text style={[styles.label, { color: textColor }]}>{label}</Text>
        )}
      </GlassSurface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fullWidth: {
    width: '100%',
  },
  surface: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  label: {
    ...theme.typography.label,
    fontSize: 16,
  },
});
