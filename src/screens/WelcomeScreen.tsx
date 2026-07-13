import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as AppleAuthentication from 'expo-apple-authentication';
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import {
  AnimatedSwipeBackdrop,
  WELCOME_DECOR_HEIGHT,
} from '../components/AnimatedSwipeBackdrop';
import { GlassSurface } from '../components/GlassSurface';
import { GlassButton } from '../components/GlassButton';
import { AppIcon, AppIconName } from '../components/AppIcon';
import { EmailSignInModal } from '../components/EmailSignInModal';
import { theme } from '../theme';
import { signInWithApple, signInWithGoogle } from '../services/auth';

interface WelcomeScreenProps {
  onAuthenticated: () => void;
}

const FEATURES: { icon: AppIconName; title: string; body: string }[] = [
  {
    icon: 'swap-horizontal-outline',
    title: 'Kaydır & Karar Ver',
    body: 'Sağa kaydır tut, sola kaydır silinecekler listesine ekle.',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Önce İncele, Sonra Sil',
    body: 'Hiçbir fotoğraf sen onaylamadan silinmez.',
  },
  {
    icon: 'lock-closed-outline',
    title: 'Gizlilik Öncelikli',
    body: 'Fotoğrafların cihazında kalır, buluta yüklenmez.',
  },
];

/**
 * Girişteki mini kart destesi: üst kart sağa-sola salınır; yönüne göre
 * "Tut" / "Sil" rozeti belirir — uygulamanın çekirdek deneyiminin önizlemesi.
 * (Henüz galeri izni olmadığı için fotoğraf yerine glass ikon kartları kullanılır.)
 */
function WelcomeDeck() {
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
      { translateX: sway.value * 26 },
      { translateY: Math.abs(sway.value) * -5 },
      { rotateZ: `${sway.value * 8}deg` },
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
      <View style={[styles.deckCard, styles.deckLeft]}>
        <GlassSurface
          glassEffectStyle="regular"
          tintColor={theme.colors.accentTint}
          radius={theme.radius.md}
          style={styles.deckCardInner}
        >
          <AppIcon name="image-outline" size={24} color={theme.colors.accent} />
        </GlassSurface>
      </View>

      <View style={[styles.deckCard, styles.deckRight]}>
        <GlassSurface
          glassEffectStyle="regular"
          tintColor={theme.colors.deleteTint}
          radius={theme.radius.md}
          style={styles.deckCardInner}
        >
          <AppIcon name="videocam-outline" size={24} color={theme.colors.delete} />
        </GlassSurface>
      </View>

      <Animated.View style={[styles.deckCard, styles.deckTop, topCardStyle]}>
        <GlassSurface
          glassEffectStyle="regular"
          tintColor={theme.colors.keepTint}
          radius={theme.radius.md}
          style={styles.deckCardInner}
        >
          <AppIcon name="heart-outline" size={26} color={theme.colors.keep} />
        </GlassSurface>

        <Animated.View style={[styles.deckBadgeWrap, keepBadgeStyle]} pointerEvents="none">
          <View style={styles.deckBadge}>
            <AppIcon name="checkmark" size={13} color={theme.colors.keep} />
            <Text style={[styles.deckBadgeText, { color: theme.colors.keep }]}>Tut</Text>
          </View>
        </Animated.View>
        <Animated.View style={[styles.deckBadgeWrap, deleteBadgeStyle]} pointerEvents="none">
          <View style={styles.deckBadge}>
            <AppIcon name="trash-outline" size={13} color={theme.colors.delete} />
            <Text style={[styles.deckBadgeText, { color: theme.colors.delete }]}>Sil</Text>
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

export function WelcomeScreen({ onAuthenticated }: WelcomeScreenProps) {
  const [loadingProvider, setLoadingProvider] = React.useState<string | null>(null);
  const [emailModalVisible, setEmailModalVisible] = React.useState(false);
  const [appleAvailable, setAppleAvailable] = React.useState(false);

  React.useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
    }
  }, []);

  const runSignIn = async (provider: 'apple' | 'google', action: () => Promise<unknown>) => {
    setLoadingProvider(provider);
    try {
      await action();
      onAuthenticated();
    } catch (error) {
      Alert.alert('Giriş başarısız', error instanceof Error ? error.message : 'Tekrar dene.');
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <View style={styles.root}>
      {/* Dekor, layout'ta yer kaplamadan ekranın en üstünde arka plan katmanı olarak durur. */}
      <View style={styles.decorSlot} pointerEvents="none">
        <AnimatedSwipeBackdrop />
      </View>

      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(550)}>
            <GlassSurface
              glassEffectStyle="regular"
              radius={theme.radius.xl}
              elevation="floating"
              style={styles.brandPanel}
            >
              <WelcomeDeck />

              <View style={styles.brandRow}>
                <Text style={styles.brand}>SwipeBox</Text>
                <GlassSurface
                  glassEffectStyle="clear"
                  tintColor={theme.colors.accentTint}
                  radius={theme.radius.pill}
                  style={styles.taglinePill}
                >
                  <Text style={styles.tagline}>Photo Cleaner</Text>
                </GlassSurface>
              </View>

              <Text style={styles.heroText}>
                Galerini kaydırarak temizle. Kararlar sende, kontrol sende.
              </Text>
            </GlassSurface>
          </Animated.View>

          <View style={styles.featureList}>
            {FEATURES.map((feature, index) => (
              <Animated.View
                key={feature.title}
                entering={FadeInDown.duration(500).delay(140 + index * 80)}
              >
                <GlassSurface
                  glassEffectStyle="regular"
                  radius={theme.radius.lg}
                  elevation="glass"
                  style={styles.featureCard}
                >
                  <View style={styles.featureIconWrap}>
                    <AppIcon name={feature.icon} size={20} color={theme.colors.accent} />
                  </View>
                  <View style={styles.featureCopy}>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureBody}>{feature.body}</Text>
                  </View>
                </GlassSurface>
              </Animated.View>
            ))}
          </View>
        </ScrollView>

        <Animated.View
          style={styles.authBlock}
          entering={FadeInUp.duration(550).delay(260)}
        >
          {appleAvailable ? (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={theme.radius.pill}
              style={styles.appleButton}
              onPress={() => runSignIn('apple', signInWithApple)}
            />
          ) : null}

          <GlassButton
            label="Google ile Devam Et"
            icon="logo-google"
            fullWidth
            disabled={loadingProvider !== null}
            onPress={() => runSignIn('google', signInWithGoogle)}
          />

          <GlassButton
            label="E-posta ile Devam Et"
            icon="mail-outline"
            tintColor={theme.colors.accentTint}
            textColor={theme.colors.accent}
            fullWidth
            disabled={loadingProvider !== null}
            onPress={() => setEmailModalVisible(true)}
          />

          {loadingProvider ? (
            <ActivityIndicator color={theme.colors.accent} style={styles.loader} />
          ) : null}
        </Animated.View>
      </SafeAreaView>

      <EmailSignInModal
        visible={emailModalVisible}
        onClose={() => setEmailModalVisible(false)}
        onSuccess={() => {
          setEmailModalVisible(false);
          onAuthenticated();
        }}
      />
    </View>
  );
}

const DECK_CARD_WIDTH = 88;
const DECK_CARD_HEIGHT = 116;

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
  scroll: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  brandPanel: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.backgroundElevated,
  },
  deck: {
    width: '100%',
    height: DECK_CARD_HEIGHT + theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  deckCard: {
    width: DECK_CARD_WIDTH,
    height: DECK_CARD_HEIGHT,
  },
  deckCardInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deckLeft: {
    position: 'absolute',
    transform: [{ translateX: -46 }, { rotateZ: '-10deg' }, { scale: 0.92 }],
    opacity: 0.9,
  },
  deckRight: {
    position: 'absolute',
    transform: [{ translateX: 46 }, { rotateZ: '10deg' }, { scale: 0.92 }],
    opacity: 0.9,
  },
  deckTop: {
    ...theme.shadow.glass,
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
  brandRow: {
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  brand: {
    ...theme.typography.largeTitle,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  taglinePill: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
  },
  tagline: {
    ...theme.typography.label,
    color: theme.colors.accent,
  },
  heroText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    lineHeight: 24,
  },
  featureList: {
    gap: theme.spacing.md,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.backgroundElevated,
  },
  featureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accentTint,
  },
  featureCopy: {
    flex: 1,
    gap: 4,
  },
  featureTitle: {
    ...theme.typography.label,
    color: theme.colors.textPrimary,
  },
  featureBody: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  authBlock: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.separator,
  },
  appleButton: {
    width: '100%',
    height: 50,
  },
  loader: {
    marginTop: theme.spacing.xs,
  },
});
