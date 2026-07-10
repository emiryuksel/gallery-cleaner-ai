import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { usePermissions, presentPermissionsPicker } from 'expo-media-library';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassSurface } from '../components/GlassSurface';
import { GlassButton } from '../components/GlassButton';
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
        <GlassSurface radius={theme.radius.xl} style={styles.iconBadge}>
          <Text style={styles.iconEmoji}>✨</Text>
        </GlassSurface>
        <Text style={styles.title}>Galerini Temizle</Text>
        <Text style={styles.subtitle}>
          Fotoğraf ve videolarını Tinder gibi kaydır: sağa kaydır tut, sola kaydır
          silinecekler listesine ekle. Hiçbir şey sen onaylayana kadar silinmez.
        </Text>
      </View>

      <GlassSurface radius={theme.radius.lg} style={styles.infoCard}>
        <InfoRow emoji="🔒" text="Fotoğrafların cihazından çıkmaz, buluta yüklenmez." />
        <InfoRow emoji="↔️" text="Sağa kaydır = tut, sola kaydır = sil işaretle." />
        <InfoRow emoji="🗑️" text="Silinenler 30 gün 'Son Silinenler'de kalır, geri alınabilir." />
      </GlassSurface>

      <View style={styles.actions}>
        {denied ? (
          <Text style={styles.deniedText}>
            İzin reddedildi. Ayarlar → Gallery Cleaner → Fotoğraflar'dan erişim
            verebilirsin.
          </Text>
        ) : null}
        <GlassButton
          label="Galeriye Erişim Ver"
          tintColor={theme.colors.accent}
          fullWidth
          onPress={handleRequest}
        />
        {accessPrivileges === 'limited' ? (
          <GlassButton
            label="Daha Fazla Fotoğraf Seç"
            fullWidth
            style={styles.secondaryBtn}
            onPress={() => presentPermissionsPicker()}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function InfoRow({ emoji, text }: { emoji: string; text: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoEmoji}>{emoji}</Text>
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
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  iconEmoji: {
    fontSize: 44,
  },
  title: {
    ...theme.typography.title,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: theme.spacing.sm,
  },
  infoCard: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  infoEmoji: {
    fontSize: 22,
  },
  infoText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    flex: 1,
    lineHeight: 20,
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
