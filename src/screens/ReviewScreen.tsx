import React from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassSurface } from '../components/GlassSurface';
import { GlassButton } from '../components/GlassButton';
import { AppIcon } from '../components/AppIcon';
import { theme } from '../theme';
import { deleteItems, GalleryItem } from '../services/mediaLibrary';

interface ReviewScreenProps {
  items: GalleryItem[];
  style?: ViewStyle;
  onBack: (remaining: GalleryItem[], restored: GalleryItem[]) => void;
  onDeleted: (deletedIds: string[]) => void;
}

export function ReviewScreen({ items, style, onBack, onDeleted }: ReviewScreenProps) {
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(
    () => new Set(items.map((item) => item.id))
  );
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => {
    setSelectedIds(new Set(items.map((item) => item.id)));
  }, [items]);

  const selected = React.useMemo(
    () => items.filter((item) => selectedIds.has(item.id)),
    [items, selectedIds]
  );

  const toggle = (item: GalleryItem) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.add(item.id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(items.map((item) => item.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const restored = React.useMemo(
    () => items.filter((item) => !selectedIds.has(item.id)),
    [items, selectedIds]
  );

  const applyAndLeave = () => {
    onBack(selected, restored);
  };

  const handleRestore = () => {
    applyAndLeave();
  };

  const confirmDelete = () => {
    if (selected.length === 0) return;
    Alert.alert(
      'Silmeyi onayla',
      `${selected.length} öğe "Son Silinenler"e taşınacak. 30 gün içinde geri alabilirsin.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: `${selected.length} Öğeyi Sil`,
          style: 'destructive',
          onPress: runDelete,
        },
      ]
    );
  };

  const runDelete = async () => {
    setDeleting(true);
    try {
      await deleteItems(selected);
      onDeleted(selected.map((i) => i.id));
    } catch {
      Alert.alert(
        'Silme başarısız',
        'Öğeler silinemedi. iOS sistem onayını iptal ettiysen veya fotoğrafa erişim izni kısıtlıysa tekrar dene.'
      );
      setDeleting(false);
    }
  };

  return (
    <View style={[styles.overlayRoot, style]}>
      <Animated.View style={styles.flex} entering={FadeIn.duration(220)}>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
        <View style={styles.headerSide}>
          <Pressable onPress={applyAndLeave} hitSlop={12}>
            <GlassSurface glassEffectStyle="clear" radius={theme.radius.pill} elevation="glass" style={styles.backBtn}>
              <AppIcon name="chevron-back" size={22} color={theme.colors.accent} />
              <Text style={styles.backText}>Geri</Text>
            </GlassSurface>
          </Pressable>
        </View>
        <Text style={styles.title}>Silinecekler</Text>
        <View style={styles.headerSide} />
      </View>

      <Text style={styles.subtitle}>
        Silmek istemediklerine dokun, ardından Geri Döndür. {selected.length} / {items.length}{' '}
        silinecek.
      </Text>

      <View style={styles.bulkActions}>
        <Pressable onPress={selectAll} hitSlop={8}>
          <Text style={styles.bulkActionText}>Tümünü seç</Text>
        </Pressable>
        <Text style={styles.bulkDivider}>·</Text>
        <Pressable onPress={deselectAll} hitSlop={8}>
          <Text style={styles.bulkActionText}>Tümünü kaldır</Text>
        </Pressable>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.gridRow}
        renderItem={({ item }) => {
          const isSelected = selectedIds.has(item.id);
          return (
            <Pressable
              style={[styles.cell, isSelected && styles.cellSelected]}
              onPress={() => toggle(item)}
            >
              <Image
                source={{ uri: item.uri }}
                style={[styles.thumb, !isSelected && styles.thumbDimmed]}
                contentFit="cover"
              />
              <View
                style={[
                  styles.selectBadge,
                  isSelected ? styles.selectBadgeOn : styles.selectBadgeOff,
                ]}
              >
                {isSelected ? (
                  <AppIcon name="checkmark" size={14} color={theme.colors.onAccent} />
                ) : null}
              </View>
              {!isSelected ? (
                <View style={styles.keepOverlay}>
                  <Text style={styles.keepOverlayText}>Tutulacak</Text>
                </View>
              ) : null}
              {item.mediaType === 'video' ? (
                <GlassSurface glassEffectStyle="clear" radius={theme.radius.sm} style={styles.videoTag}>
                  <AppIcon name="play" size={10} color={theme.colors.onAccent} />
                </GlassSurface>
              ) : null}
            </Pressable>
          );
        }}
      />

      <View style={styles.footer}>
        {restored.length > 0 ? (
          <GlassButton
            label={
              restored.length === 1
                ? '1 Öğeyi Geri Döndür'
                : `${restored.length} Öğeyi Geri Döndür`
            }
            icon="arrow-undo-outline"
            tintColor={theme.colors.keepTint}
            textColor={theme.colors.keep}
            fullWidth
            onPress={handleRestore}
          />
        ) : (
          <GlassButton
            label={
              deleting
                ? ''
                : selected.length > 0
                  ? selected.length === 1
                    ? '1 Öğeyi Kalıcı Olarak Sil'
                    : `${selected.length} Öğeyi Kalıcı Olarak Sil`
                  : 'Silinecek öğe yok'
            }
            icon={selected.length > 0 ? 'trash-outline' : undefined}
            tintColor={selected.length > 0 ? theme.colors.deleteTint : undefined}
            textColor={selected.length > 0 ? theme.colors.delete : theme.colors.textMuted}
            fullWidth
            loading={deleting}
            disabled={selected.length === 0}
            onPress={confirmDelete}
          />
        )}
      </View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayRoot: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
  },
  headerSide: {
    flex: 1,
    flexDirection: 'row',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    minHeight: 40,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    gap: 2,
  },
  backText: {
    ...theme.typography.body,
    color: theme.colors.accent,
  },
  title: {
    ...theme.typography.heading,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  bulkActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  bulkActionText: {
    ...theme.typography.label,
    color: theme.colors.accent,
  },
  bulkDivider: {
    color: theme.colors.textMuted,
  },
  grid: {
    paddingBottom: theme.spacing.lg,
  },
  gridRow: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: theme.radius.sm,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cellSelected: {
    borderColor: theme.colors.delete,
  },
  thumb: {
    ...StyleSheet.absoluteFillObject,
  },
  thumbDimmed: {
    opacity: 0.45,
  },
  selectBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  selectBadgeOn: {
    backgroundColor: theme.colors.delete,
    borderColor: theme.colors.delete,
  },
  selectBadgeOff: {
    backgroundColor: theme.colors.overlay,
    borderColor: theme.colors.badgeBorder,
  },
  keepOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.overlayLight,
  },
  keepOverlayText: {
    ...theme.typography.caption,
    color: theme.colors.keep,
    fontWeight: '600',
  },
  videoTag: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
});
