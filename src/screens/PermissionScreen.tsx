import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { usePermissions, presentPermissionsPickerAsync } from 'expo-media-library';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassSurface } from '../components/GlassSurface';
import { GlassButton } from '../components/GlassButton';
import { AppIcon, AppIconName } from '../components/AppIcon';
import { theme } from '../theme';

interface PermissionScreenProps {
  onGranted: () => void;
}

export function PermissionScreen({ onGranted }: PermissionScreenProps) {
  const [permission, requestPermission] = usePermissions();

  const status = permission?.status;
  const accessPrivileges = permission?.accessPrivileges;

  React.useEffect(() => {
    if (status === 'granted') {
      onGranted();
    }
  }, [status, onGranted]);

  const handleRequest = async () => {
    const result = await requestPermission();
    if (result.status === 'granted') {
      onGranted();
    }
  };

  const canAskAgain = permission?.canAskAgain ?? true;
  const denied = status === 'denied' && !canAskAgain;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <GlassSurface
          glassEffectStyle="regular"
          tintColor={theme.colors.accentTint}
          radius={theme.radius.xl}
          elevation="glass"
          style={styles.iconBadge}
        >
          <AppIcon name="images-outline" size={40} color={theme.colors.accent} />
        </GlassSurface>
        <Text style={styles.title}>Galerini Temizle</Text>
        <Text style={styles.subtitle}>
          Fotoğraf ve videolarını kaydırarak gözden geçir. Sağa kaydır tut, sola kaydır
          silinecekler listesine ekle. Hiçbir şey sen onaylayana kadar silinmez.
        </Text>
      </View>

      <GlassSurface glassEffectStyle="regular" radius={theme.radius.lg} elevation="glass" style={styles.infoCard}>
        <InfoRow icon="lock-closed-outline" text="Fotoğrafların cihazından çıkmaz, buluta yüklenmez." />
        <InfoRow icon="swap-horizontal-outline" text="Sağa kaydır tut, sola kaydır silinecekler listesine ekle." />
        <InfoRow icon="trash-outline" text="Silinenler 30 gün Son Silinenler'de kalır, geri alınabilir." />
      </GlassSurface>

      <View style={styles.actions}>
        {denied ? (
          <Text style={styles.deniedText}>
            İzin reddedildi. Ayarlar → Gallery Cleaner → Fotoğraflar'dan erişim verebilirsin.
          </Text>
        ) : null}
        <GlassButton
          label="Galeriye Erişim Ver"
          icon="shield-checkmark-outline"
          tintColor={theme.colors.accentTint}
          textColor={theme.colors.accent}
          fullWidth
          onPress={handleRequest}
        />
        {accessPrivileges === 'limited' ? (
          <GlassButton
            label="Daha Fazla Fotoğraf Seç"
            icon="add-circle-outline"
            fullWidth
            style={styles.secondaryBtn}
            onPress={() => presentPermissionsPickerAsync()}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function InfoRow({ icon, text }: { icon: AppIconName; text: string }) {
  return (
    <View style={styles.infoRow}>
      <GlassSurface glassEffectStyle="clear" radius={theme.radius.sm} style={styles.infoIconWrap}>
        <AppIcon name={icon} size={18} color={theme.colors.textSecondary} />
      </GlassSurface>
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.lg,
    justifyContent: 'space-between',
    paddingBottom: theme.spacing.xl,
  },
  hero: {
    marginTop: theme.spacing.xxl,
    alignItems: 'center',
  },
  iconBadge: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    ...theme.typography.largeTitle,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: theme.spacing.sm,
  },
  infoCard: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    backgroundColor: theme.colors.backgroundElevated,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    flex: 1,
    lineHeight: 22,
  },
  actions: {
    gap: theme.spacing.md,
  },
  secondaryBtn: {
    minHeight: 48,
  },
  deniedText: {
    ...theme.typography.caption,
    color: theme.colors.delete,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
});
