import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { MediaCard } from './MediaCard';
import { theme } from '../theme';
import type { GalleryItem } from '../services/mediaLibrary';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.28;
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
        translateX.value = withTiming(dir * OUT_DISTANCE, { duration: 260 }, () => {
          runOnJS(onSwiped)(decision);
        });
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
        if (Math.abs(e.translationX) > SWIPE_THRESHOLD) {
          const decision: SwipeDecision = e.translationX > 0 ? 'keep' : 'delete';
          const dir = decision === 'keep' ? 1 : -1;
          translateX.value = withTiming(
            dir * OUT_DISTANCE,
            { duration: 220 },
            () => {
              runOnJS(onSwiped)(decision);
            }
          );
        } else {
          translateX.value = withSpring(0);
          translateY.value = withSpring(0);
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
            <Text style={[styles.overlayText, { color: theme.colors.keep }]}>TUT</Text>
          </Animated.View>
          <Animated.View style={[styles.overlay, styles.deleteOverlay, deleteStyle]}>
            <Text style={[styles.overlayText, { color: theme.colors.delete }]}>SİL</Text>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    );
  }
);

SwipeCard.displayName = 'SwipeCard';

const styles = StyleSheet.create({
  card: {
    ...StyleSheet.absoluteFill,
  },
  overlay: {
    position: 'absolute',
    top: theme.spacing.xl,
    borderWidth: 4,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  keepOverlay: {
    left: theme.spacing.xl,
    borderColor: theme.colors.keep,
    transform: [{ rotateZ: '-16deg' }],
  },
  deleteOverlay: {
    right: theme.spacing.xl,
    borderColor: theme.colors.delete,
    transform: [{ rotateZ: '16deg' }],
  },
  overlayText: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 2,
  },
});
