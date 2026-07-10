import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { GlassSurface } from './GlassSurface';
import { AppIcon, AppIconName } from './AppIcon';
import { theme } from '../theme';

interface GlassButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  icon?: AppIconName;
  tintColor?: string;
  textColor?: string;
  loading?: boolean;
  style?: ViewStyle;
  containerStyle?: ViewStyle;
  fullWidth?: boolean;
}

export function GlassButton({
  label,
  icon,
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
        glassEffectStyle="regular"
        tintColor={tintColor}
        radius={theme.radius.pill}
        style={[styles.surface, style]}
      >
        {loading ? (
          <ActivityIndicator color={textColor} />
        ) : (
          <View style={styles.content}>
            {icon ? <AppIcon name={icon} size={18} color={textColor} /> : null}
            <Text style={[styles.label, { color: textColor }]}>{label}</Text>
          </View>
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
    minHeight: 50,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  label: {
    ...theme.typography.label,
  },
});
