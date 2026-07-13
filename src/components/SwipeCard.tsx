import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { MediaCard } from './MediaCard';
import { GlassSurface } from './GlassSurface';
import { AppIcon } from './AppIcon';
import { theme } from '../theme';
import type { GalleryItem } from '../services/mediaLibrary';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
/** Bu yatay hızın (px/sn) üzerindeki bırakmalar, mesafe kısa olsa bile swipe sayılır. */
const FLING_VELOCITY = 800;
const OUT_DISTANCE = SCREEN_WIDTH * 1.5;

export type SwipeDecision = 'keep' | 'delete';

interface SwipeCardProps {
  item: GalleryItem;
  active: boolean;
  onSwiped: (decision: SwipeDecision) => void;
}

export interface SwipeCardHandle {
  swipe: (decision: SwipeDecision) => void;
}

/** Tek bir sürüklenebilir kart. Eşik geçilince ekran dışına uçar ve onSwiped tetikler. */
export const SwipeCard = React.forwardRef<SwipeCardHandle, SwipeCardProps>(
  ({ item, active, onSwiped }, ref) => {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    const flyOut = React.useCallback(
      (decision: SwipeDecision) => {
        const dir = decision === 'keep' ? 1 : -1;
        // Buton tetiklemesi: durağan karttan yumuşak ivmelenerek çıkış.
        translateX.value = withTiming(dir * OUT_DISTANCE, {
          duration: 340,
          easing: Easing.in(Easing.quad),
        });
        // Animasyonu beklemeden desteyi ilerlet; kart arkada uçmaya devam eder.
        onSwiped(decision);
      },
      [onSwiped, translateX]
    );

    React.useImperativeHandle(ref, () => ({
      swipe: flyOut,
    }));

    const pan = Gesture.Pan()
      .enabled(active)
      .onUpdate((e) => {
        translateX.value = e.translationX;
        translateY.value = e.translationY * 0.2;
      })
      .onEnd((e) => {
        // Swipe sayılma koşulu: yeterli mesafe VEYA hızlı fırlatma (fling).
        // Fling'de yön parmağın hızından alınır; kısa mesafeli hızlı atışlar da algılanır.
        const isFling = Math.abs(e.velocityX) > FLING_VELOCITY;
        const isFarEnough = Math.abs(e.translationX) > SWIPE_THRESHOLD;
        if (isFling || isFarEnough) {
          const dir = (isFling ? e.velocityX : e.translationX) > 0 ? 1 : -1;
          const decision: SwipeDecision = dir > 0 ? 'keep' : 'delete';
          // Desteyi HEMEN ilerlet: sonraki kart anında etkileşime açılır,
          // bu kart arkada uçuşunu tamamlar (hızlı ardışık swipe kaybolmaz).
          runOnJS(onSwiped)(decision);
          // Parmağın bırakma hızını devral: süre kalan mesafe / hızdan türetilir,
          // ease-out ile akış kesintisiz sürer (sert başlangıç yok).
          const speed = Math.max(Math.abs(e.velocityX), 900);
          const remaining = OUT_DISTANCE - Math.abs(e.translationX);
          const duration = Math.min(400, Math.max(160, (remaining / speed) * 1000));
          translateX.value = withTiming(dir * OUT_DISTANCE, {
            duration,
            easing: Easing.out(Easing.quad),
          });
          // Dikey sürüklenme yönünde hafif savrulma — doğal yörünge hissi.
          translateY.value = withTiming(
            translateY.value + e.velocityY * 0.12,
            { duration, easing: Easing.out(Easing.quad) }
          );
        } else {
          // Geri yaylanma: az salınımlı, yumuşak.
          translateX.value = withSpring(0, {
            velocity: e.velocityX,
            damping: 20,
            stiffness: 180,
            mass: 0.9,
          });
          translateY.value = withSpring(0, {
            velocity: e.velocityY,
            damping: 20,
            stiffness: 180,
            mass: 0.9,
          });
        }
      });

    const cardStyle = useAnimatedStyle(() => {
      const rotate = interpolate(
        translateX.value,
        [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
        [-12, 0, 12]
      );
      return {
        transform: [
          { translateX: translateX.value },
          { translateY: translateY.value },
          { rotateZ: `${rotate}deg` },
        ],
      };
    });

    const keepStyle = useAnimatedStyle(() => ({
      opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], 'clamp'),
    }));

    const deleteStyle = useAnimatedStyle(() => ({
      opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0], 'clamp'),
    }));

    return (
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.card, cardStyle]}>
          <MediaCard item={item} active={active} />

          <Animated.View style={[styles.overlay, styles.keepOverlay, keepStyle]}>
            <GlassSurface glassEffectStyle="regular" tintColor={theme.colors.keepTint} radius={theme.radius.pill} style={styles.overlayPill}>
              <AppIcon name="checkmark" size={16} color={theme.colors.keep} />
              <Text style={[styles.overlayText, { color: theme.colors.keep }]}>Tut</Text>
            </GlassSurface>
          </Animated.View>
          <Animated.View style={[styles.overlay, styles.deleteOverlay, deleteStyle]}>
            <GlassSurface glassEffectStyle="regular" tintColor={theme.colors.deleteTint} radius={theme.radius.pill} style={styles.overlayPill}>
              <AppIcon name="trash-outline" size={16} color={theme.colors.delete} />
              <Text style={[styles.overlayText, { color: theme.colors.delete }]}>Sil</Text>
            </GlassSurface>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    );
  }
);

SwipeCard.displayName = 'SwipeCard';

const styles = StyleSheet.create({
  card: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    position: 'absolute',
    top: theme.spacing.xl,
  },
  overlayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  keepOverlay: {
    left: theme.spacing.xl,
    transform: [{ rotateZ: '-8deg' }],
  },
  deleteOverlay: {
    right: theme.spacing.xl,
    transform: [{ rotateZ: '8deg' }],
  },
  overlayText: {
    ...theme.typography.label,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
