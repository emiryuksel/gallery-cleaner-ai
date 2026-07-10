import React from 'react';
import { StyleSheet, View, ViewProps, ViewStyle } from 'react-native';
import {
  GlassView,
  isGlassEffectAPIAvailable,
} from 'expo-glass-effect';
import { theme } from '../theme';

const glassAvailable = isGlassEffectAPIAvailable();

type GlassStyle = 'clear' | 'regular';

export interface GlassSurfaceProps extends ViewProps {
  glassEffectStyle?: GlassStyle;
  tintColor?: string;
  isInteractive?: boolean;
  radius?: number;
}

/**
 * Uygulamanın tek glass primitifi. Tüm kart, bar ve butonlar bunun üstüne kurulur.
 * iOS 26'da native Liquid Glass (UIGlassEffect) kullanır; API yoksa yarı saydam
 * View'a düşerek çökmeyi önler.
 */
export function GlassSurface({
  children,
  style,
  glassEffectStyle = 'regular',
  tintColor,
  isInteractive,
  radius = theme.radius.md,
  ...rest
}: GlassSurfaceProps) {
  const radiusStyle: ViewStyle = { borderRadius: radius };

  if (glassAvailable) {
    return (
      <GlassView
        {...rest}
        glassEffectStyle={glassEffectStyle}
        tintColor={tintColor}
        isInteractive={isInteractive}
        style={[radiusStyle, style]}
      >
        {children}
      </GlassView>
    );
  }

  return (
    <View
      {...rest}
      style={[styles.fallback, radiusStyle, tintColor ? { backgroundColor: tintColor } : null, style]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: theme.colors.glassTint,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.glassBorder,
  },
});
