import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Animated, {
  Easing,
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  AnimatedSwipeBackdrop,
  WELCOME_DECOR_HEIGHT,
} from '../components/AnimatedSwipeBackdrop';
import { GlassSurface } from '../components/GlassSurface';
import { GlassButton } from '../components/GlassButton';
import { GlassIconButton } from '../components/GlassIconButton';
import { AppIcon, AppIconName } from '../components/AppIcon';
import { theme } from '../theme';
import {
  fetchRecentThumbnails,
  getLibraryTotalCount,
} from '../services/mediaLibrary';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface HomeScreenProps {
  onOpenSwipe: () => void;
  onOpenLargest: () => void;
  onLogout: () => void;
}

function formatCount(value: number): string {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Basılınca hafifçe küçülen, Apple hissiyatlı kart sarmalayıcı. */
function PressableCard({
  onPress,
  children,
  entering,
}: {
  onPress: () => void;
  children: React.ReactNode;
  entering?: React.ComponentProps<typeof Animated.View>['entering'];
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      entering={entering}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 22, stiffness: 320 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 22, stiffness: 320 });
      }}
      style={animatedStyle}
    >
      {children}
    </AnimatedPressable>
  );
}

function MiniCard({
  uri,
  icon,
  tint,
  iconColor,
  style,
}: {
  uri?: string;
  icon: AppIconName;
  tint: string;
  iconColor: string;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.miniCard, style]}>
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
      ) : (
        <GlassSurface
          glassEffectStyle="regular"
          tintColor={tint}
          radius={theme.radius.md}
          style={styles.miniCardFallback}
        >
          <AppIcon name={icon} size={26} color={iconColor} />
        </GlassSurface>
      )}
    </View>
  );
}

/**
 * Hero'daki mini kart destesi: üst kart sağa-sola salınır; sağa yatınca "Tut",
 * sola yatınca "Sil" rozeti belirir — swipe akışının canlı bir önizlemesi.
 */
function HeroDeck({ thumbs }: { thumbs: string[] }) {
  const sway = useSharedValue(0);

  React.useEffect(() => {
    sway.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1900, easing: Easing.inOut(Easing.sin) }),
        withTiming(-1, { duration: 1900, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, [sway]);

  const topCardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: sway.value * 30 },
      { translateY: Math.abs(sway.value) * -6 },
      { rotateZ: `${sway.value * 9}deg` },
    ],
  }));

  const keepBadgeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(sway.value, [0.15, 0.8], [0, 1], 'clamp'),
  }));

  const deleteBadgeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(sway.value, [-0.8, -0.15], [1, 0], 'clamp'),
  }));

  return (
    <View style={styles.deck}>
      <MiniCard
        uri={thumbs[2]}
        icon="image-outline"
        tint={theme.colors.accentTint}
        iconColor={theme.colors.accent}
        style={styles.deckBack}
      />
      <MiniCard
        uri={thumbs[1]}
        icon="videocam-outline"
        tint={theme.colors.deleteTint}
        iconColor={theme.colors.delete}
        style={styles.deckMid}
      />
      <Animated.View style={[styles.deckTopWrap, topCardStyle]}>
        <MiniCard
          uri={thumbs[0]}
          icon="heart-outline"
          tint={theme.colors.keepTint}
          iconColor={theme.colors.keep}
          style={styles.deckTopCard}
        />
        <Animated.View
          style={[styles.deckBadgeWrap, keepBadgeStyle]}
          pointerEvents="none"
        >
          <View style={styles.deckBadge}>
            <AppIcon name="checkmark" size={13} color={theme.colors.keep} />
            <Text style={[styles.deckBadgeText, { color: theme.colors.keep }]}>Tut</Text>
          </View>
        </Animated.View>
        <Animated.View
          style={[styles.deckBadgeWrap, deleteBadgeStyle]}
          pointerEvents="none"
        >
          <View style={styles.deckBadge}>
            <AppIcon name="trash-outline" size={13} color={theme.colors.delete} />
            <Text style={[styles.deckBadgeText, { color: theme.colors.delete }]}>Sil</Text>
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

export function HomeScreen({ onOpenSwipe, onOpenLargest, onLogout }: HomeScreenProps) {
  const [thumbs, setThumbs] = React.useState<string[]>([]);
  const [total, setTotal] = React.useState<number | null>(null);

  React.useEffect(() => {
    let alive = true;
    fetchRecentThumbnails(3).then((uris) => {
      if (alive) setThumbs(uris);
    });
    getLibraryTotalCount().then((count) => {
      if (alive) setTotal(count);
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <View style={styles.root}>
      {/* Dekor, layout'ta yer kaplamadan ekranın en üstünde arka plan katmanı olarak durur. */}
      <View style={styles.decorSlot} pointerEvents="none">
        <AnimatedSwipeBackdrop />
      </View>

      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.greeting}>Hoş geldin</Text>
            <Text style={styles.title}>Galerini tazele</Text>
          </View>
          <GlassIconButton
            icon="log-out-outline"
            iconColor={theme.colors.textSecondary}
            size={44}
            onPress={onLogout}
          />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <PressableCard onPress={onOpenSwipe} entering={FadeInDown.duration(500).delay(60)}>
            <GlassSurface
              glassEffectStyle="regular"
              radius={theme.radius.xl}
              elevation="floating"
              style={styles.hero}
            >
              <HeroDeck thumbs={thumbs} />

              <View style={styles.heroCopy}>
                <Text style={styles.heroTitle}>Galeriyi Temizle</Text>
                <Text style={styles.heroBody}>
                  Sağa kaydır tut, sola kaydır sil. Galerin dakikalar içinde tertemiz.
                </Text>
              </View>

              {total != null && total > 0 ? (
                <GlassSurface
                  glassEffectStyle="clear"
                  tintColor={theme.colors.accentTint}
                  radius={theme.radius.pill}
                  style={styles.heroCountPill}
                >
                  <AppIcon name="images-outline" size={14} color={theme.colors.accent} />
                  <Text style={styles.heroCountText}>{formatCount(total)} öğe seni bekliyor</Text>
                </GlassSurface>
              ) : null}

              <GlassButton
                label="Kaydırmaya Başla"
                icon="swap-horizontal-outline"
                tintColor={theme.colors.accent}
                textColor={theme.colors.onAccent}
                fullWidth
                onPress={onOpenSwipe}
              />
            </GlassSurface>
          </PressableCard>

          <PressableCard onPress={onOpenLargest} entering={FadeInDown.duration(500).delay(160)}>
            <GlassSurface
              glassEffectStyle="regular"
              radius={theme.radius.xl}
              elevation="glass"
              style={styles.rowCard}
            >
              <GlassSurface
                glassEffectStyle="clear"
                tintColor={theme.colors.deleteTint}
                radius={theme.radius.lg}
                style={styles.rowCardIcon}
              >
                <AppIcon name="server-outline" size={28} color={theme.colors.delete} />
              </GlassSurface>
              <View style={styles.rowCardCopy}>
                <Text style={styles.rowCardTitle}>En Büyük Dosyalar</Text>
                <Text style={styles.rowCardBody}>
                  En çok yer kaplayan fotoğraf ve videoları bul, hızlıca boşalt.
                </Text>
              </View>
              <AppIcon name="chevron-forward" size={22} color={theme.colors.textMuted} />
            </GlassSurface>
          </PressableCard>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const DECK_CARD_WIDTH = 100;
const DECK_CARD_HEIGHT = 134;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  safe: {
    flex: 1,
  },
  decorSlot: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: WELCOME_DECOR_HEIGHT,
    zIndex: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
    zIndex: 1,
  },
  headerCopy: {
    flex: 1,
  },
  greeting: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  title: {
    ...theme.typography.title,
    color: theme.colors.textPrimary,
  },
  scroll: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  hero: {
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    backgroundColor: theme.colors.backgroundElevated,
  },
  deck: {
    width: '100%',
    height: DECK_CARD_HEIGHT + theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniCard: {
    width: DECK_CARD_WIDTH,
    height: DECK_CARD_HEIGHT,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    backgroundColor: theme.colors.background,
    borderWidth: 2,
    borderColor: theme.colors.badgeBorder,
  },
  miniCardFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deckBack: {
    position: 'absolute',
    transform: [{ translateX: -52 }, { rotateZ: '-10deg' }, { scale: 0.92 }],
    opacity: 0.9,
  },
  deckMid: {
    position: 'absolute',
    transform: [{ translateX: 52 }, { rotateZ: '10deg' }, { scale: 0.92 }],
    opacity: 0.9,
  },
  deckTopWrap: {
    width: DECK_CARD_WIDTH,
    height: DECK_CARD_HEIGHT,
    ...theme.shadow.glass,
  },
  deckTopCard: {
    width: '100%',
    height: '100%',
  },
  deckBadgeWrap: {
    position: 'absolute',
    // Pill yüksekliğinin yarısı kadar yukarı: rozet kartın üst kenarına oturur.
    top: -12,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  deckBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.backgroundElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.glassBorder,
  },
  deckBadgeText: {
    ...theme.typography.footnote,
    fontWeight: '700',
  },
  heroCopy: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  heroTitle: {
    ...theme.typography.title,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  heroBody: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: theme.spacing.md,
  },
  heroCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
  },
  heroCountText: {
    ...theme.typography.caption,
    fontWeight: '600',
    color: theme.colors.accent,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.backgroundElevated,
  },
  rowCardIcon: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCardCopy: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  rowCardTitle: {
    ...theme.typography.heading,
    color: theme.colors.textPrimary,
  },
  rowCardBody: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
});
