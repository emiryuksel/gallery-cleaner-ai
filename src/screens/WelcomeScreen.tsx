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
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.decorSlot}>
          <AnimatedSwipeBackdrop />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <GlassSurface
            glassEffectStyle="regular"
            radius={theme.radius.xl}
            elevation="glass"
            style={styles.brandPanel}
          >
            <GlassSurface
              glassEffectStyle="clear"
              tintColor={theme.colors.accentTint}
              radius={theme.radius.xl}
              style={styles.logoBadge}
            >
              <AppIcon name="images-outline" size={32} color={theme.colors.accent} />
            </GlassSurface>
            <Text style={styles.brand}>SwipeBox</Text>
            <Text style={styles.tagline}>Photo Cleaner</Text>
            <Text style={styles.heroText}>
              Galerini kaydırarak temizle. Kararlar sende, kontrol sende.
            </Text>
          </GlassSurface>

          <View style={styles.featureList}>
            {FEATURES.map((feature) => (
              <GlassSurface
                key={feature.title}
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
            ))}
          </View>
        </ScrollView>

        <View style={styles.authBlock}>
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
        </View>
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  decorSlot: {
    height: WELCOME_DECOR_HEIGHT,
    marginBottom: -theme.spacing.xl,
    zIndex: 0,
  },
  scroll: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  brandPanel: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.backgroundElevated,
  },
  logoBadge: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  brand: {
    ...theme.typography.largeTitle,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  tagline: {
    ...theme.typography.heading,
    color: theme.colors.accent,
    marginTop: 2,
    textAlign: 'center',
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
