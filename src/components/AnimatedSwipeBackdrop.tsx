import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { GlassSurface } from './GlassSurface';
import { AppIcon } from './AppIcon';
import { theme } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DECOR_HEIGHT = 168;

const FLOATING_CARDS = [
  {
    icon: 'image-outline' as const,
    tint: theme.colors.accentTint,
    iconColor: theme.colors.accent,
    width: 96,
    height: 128,
    left: -18,
    top: 24,
    rotate: '-12deg',
    drift: 10,
    delay: 0,
  },
  {
    icon: 'videocam-outline' as const,
    tint: theme.colors.deleteTint,
    iconColor: theme.colors.delete,
    width: 88,
    height: 118,
    left: SCREEN_WIDTH - 78,
    top: 12,
    rotate: '11deg',
    drift: 8,
    delay: 350,
  },
  {
    icon: 'heart-outline' as const,
    tint: theme.colors.keepTint,
    iconColor: theme.colors.keep,
    width: 72,
    height: 96,
    left: SCREEN_WIDTH * 0.38,
    top: 58,
    rotate: '-4deg',
    drift: 6,
    delay: 700,
  },
];

function FloatingCard({
  icon,
  tint,
  iconColor,
  width,
  height,
  left,
  top,
  rotate,
  drift,
  delay,
}: (typeof FLOATING_CARDS)[number]) {
  const offset = useSharedValue(0);

  React.useEffect(() => {
    offset.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-drift, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
          withTiming(drift, { duration: 3200, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );
  }, [delay, drift, offset]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }, { rotate }],
  }));

  return (
    <Animated.View style={[styles.card, { width, height, left, top }, animatedStyle]}>
      <GlassSurface
        glassEffectStyle="regular"
        tintColor={tint}
        radius={theme.radius.lg}
        style={styles.cardInner}
      >
        <AppIcon name={icon} size={28} color={iconColor} />
      </GlassSurface>
    </Animated.View>
  );
}

/** Üst dekor alanında, içerikle çakışmayan hafif animasyonlu kartlar. */
export function AnimatedSwipeBackdrop() {
  return (
    <View style={styles.container} pointerEvents="none">
      {FLOATING_CARDS.map((card, index) => (
        <FloatingCard key={index} {...card} />
      ))}
      <View style={styles.scrim} />
    </View>
  );
}

export const WELCOME_DECOR_HEIGHT = DECOR_HEIGHT;

const styles = StyleSheet.create({
  container: {
    height: DECOR_HEIGHT,
    overflow: 'hidden',
    backgroundColor: theme.colors.background,
  },
  card: {
    position: 'absolute',
    opacity: 0.42,
  },
  cardInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.background,
    opacity: 0.72,
  },
});
