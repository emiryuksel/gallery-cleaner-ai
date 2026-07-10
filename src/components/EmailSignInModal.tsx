import React from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { GlassSurface } from '../components/GlassSurface';
import { GlassButton } from '../components/GlassButton';
import { AppIcon } from '../components/AppIcon';
import { theme } from '../theme';
import { signInWithEmail } from '../services/auth';

interface EmailSignInModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EmailSignInModal({ visible, onClose, onSuccess }: EmailSignInModalProps) {
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await signInWithEmail(email);
      setEmail('');
      onSuccess();
    } catch (error) {
      Alert.alert('Giriş başarısız', error instanceof Error ? error.message : 'Tekrar dene.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboard}
        >
          <Pressable style={styles.sheetPress} onPress={(e) => e.stopPropagation()}>
            <GlassSurface
              glassEffectStyle="regular"
              radius={theme.radius.xl}
              elevation="floating"
              style={styles.sheet}
            >
              <View style={styles.grabber} />
              <View style={styles.sheetHeader}>
                <Text style={styles.title}>E-posta ile Giriş</Text>
                <Text style={styles.subtitle}>Hesabını bağlamak için e-posta adresini gir.</Text>
              </View>

              <GlassSurface glassEffectStyle="clear" radius={theme.radius.md} style={styles.inputWrap}>
                <AppIcon name="mail-outline" size={20} color={theme.colors.textMuted} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="ornek@mail.com"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                />
              </GlassSurface>

              <GlassButton
                label={loading ? '' : 'Devam Et'}
                icon="arrow-forward-outline"
                tintColor={theme.colors.accentTint}
                textColor={theme.colors.accent}
                fullWidth
                loading={loading}
                disabled={!email.trim()}
                onPress={handleSubmit}
              />
              <GlassButton label="Vazgeç" fullWidth onPress={onClose} />
            </GlassSurface>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: theme.colors.scrim,
    justifyContent: 'flex-end',
  },
  keyboard: {
    justifyContent: 'flex-end',
  },
  sheetPress: {
    width: '100%',
    alignItems: 'center',
  },
  sheet: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    gap: theme.spacing.md,
    backgroundColor: theme.colors.backgroundElevated,
  },
  grabber: {
    width: 40,
    height: 5,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.separator,
    alignSelf: 'center',
    marginBottom: theme.spacing.xs,
  },
  sheetHeader: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  title: {
    ...theme.typography.heading,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  input: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    paddingVertical: theme.spacing.sm,
  },
});
