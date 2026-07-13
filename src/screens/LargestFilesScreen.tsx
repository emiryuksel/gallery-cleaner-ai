import React from 'react';
import {
  ActivityIndicator,
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
import {
  deleteItems,
  formatBytes,
  GalleryItem,
  scanAllBySize,
  ScanProgress,
} from '../services/mediaLibrary';

interface LargestFilesScreenProps {
  style?: ViewStyle;
  onBack: () => void;
}

export function LargestFilesScreen({ style, onBack }: LargestFilesScreenProps) {
  const [items, setItems] = React.useState<GalleryItem[]>([]);
  const [progress, setProgress] = React.useState<ScanProgress>({ scanned: 0, total: 0 });
  const [scanning, setScanning] = React.useState(true);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(() => new Set());
  const [deleting, setDeleting] = React.useState(false);
  const cancelledRef = React.useRef(false);
  // Tarama sürerken silinen öğelerin, sonraki partial/final emisyonlarla geri gelmemesi için.
  const deletedIdsRef = React.useRef<Set<string>>(new Set());

  const applyItems = React.useCallback((list: GalleryItem[]) => {
    setItems(list.filter((item) => !deletedIdsRef.current.has(item.id)));
  }, []);

  React.useEffect(() => {
    cancelledRef.current = false;
    setScanning(true);
    scanAllBySize({
      onProgress: (p) => {
        if (!cancelledRef.current) setProgress(p);
      },
      onPartial: (partial) => {
        if (cancelledRef.current) return;
        // Henüz ölçülmemiş öğeleri (boyut null) canlı listede gösterme.
        applyItems(partial.filter((item) => item.sizeBytes != null));
      },
      shouldCancel: () => cancelledRef.current,
    })
      .then((result) => {
        if (cancelledRef.current) return;
        applyItems(result);
        setScanning(false);
      })
      .catch(() => {
        if (cancelledRef.current) return;
        setScanning(false);
        Alert.alert('Tarama başarısız', 'Dosyalar taranırken bir sorun oluştu. Tekrar dene.');
      });

    return () => {
      cancelledRef.current = true;
    };
  }, [applyItems]);

  const selected = React.useMemo(
    () => items.filter((item) => selectedIds.has(item.id)),
    [items, selectedIds]
  );

  const selectedBytes = React.useMemo(
    () => selected.reduce((sum, item) => sum + (item.sizeBytes ?? 0), 0),
    [selected]
  );

  const toggle = (item: GalleryItem) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) next.delete(item.id);
      else next.add(item.id);
      return next;
    });
  };

  const confirmDelete = () => {
    if (selected.length === 0) return;
    Alert.alert(
      'Silmeyi onayla',
      `${selected.length} öğe (${formatBytes(selectedBytes)}) "Son Silinenler"e taşınacak. 30 gün içinde geri alabilirsin.`,
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
      const deletedIds = new Set(selected.map((i) => i.id));
      for (const id of deletedIds) deletedIdsRef.current.add(id);
      setItems((prev) => prev.filter((item) => !deletedIds.has(item.id)));
      setSelectedIds(new Set());
    } catch {
      Alert.alert(
        'Silme başarısız',
        'Öğeler silinemedi. iOS sistem onayını iptal ettiysen veya fotoğrafa erişim izni kısıtlıysa tekrar dene.'
      );
    } finally {
      setDeleting(false);
    }
  };

  const percent = progress.total > 0 ? progress.scanned / progress.total : 0;

  return (
    <View style={[styles.overlayRoot, style]}>
      <Animated.View style={styles.flex} entering={FadeIn.duration(220)}>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerSide}>
              <Pressable onPress={onBack} hitSlop={12}>
                <GlassSurface
                  glassEffectStyle="clear"
                  radius={theme.radius.pill}
                  elevation="glass"
                  style={styles.backBtn}
                >
                  <AppIcon name="chevron-back" size={22} color={theme.colors.accent} />
                  <Text style={styles.backText}>Geri</Text>
                </GlassSurface>
              </Pressable>
            </View>
            <Text style={styles.title}>En Büyük Dosyalar</Text>
            <View style={styles.headerSide} />
          </View>

          {scanning && items.length === 0 ? (
            <View style={styles.center}>
              <ActivityIndicator color={theme.colors.accent} size="large" />
              <Text style={styles.scanTitle}>
                {progress.scanned === 0 ? 'Galeri hazırlanıyor...' : 'Boyutlar ölçülüyor...'}
              </Text>
              <Text style={styles.scanCount}>
                {progress.scanned > 0
                  ? `${progress.scanned} / ${progress.total} öğe`
                  : `${progress.total || 0} öğe bulundu`}
              </Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.round(percent * 100)}%` }]} />
              </View>
            </View>
          ) : items.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.scanTitle}>Dosya bulunamadı</Text>
              <Text style={styles.emptyText}>Boyutu ölçülebilen fotoğraf veya video yok.</Text>
            </View>
          ) : (
            <>
              {scanning ? (
                <View style={styles.liveHeader}>
                  <View style={styles.liveHeaderRow}>
                    <ActivityIndicator size="small" color={theme.colors.accent} />
                    <Text style={styles.liveHeaderText}>
                      Boyutlar ölçülüyor · {progress.scanned} / {progress.total}
                    </Text>
                  </View>
                  <View style={styles.liveTrack}>
                    <View
                      style={[styles.liveFill, { width: `${Math.round(percent * 100)}%` }]}
                    />
                  </View>
                </View>
              ) : (
                <Text style={styles.subtitle}>
                  Boyuta göre sıralandı. Silmek istediklerine dokun.
                </Text>
              )}

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
                        style={[styles.thumb, isSelected && styles.thumbDimmed]}
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
                      <GlassSurface
                        glassEffectStyle="clear"
                        radius={theme.radius.sm}
                        style={styles.sizeTag}
                      >
                        {item.mediaType === 'video' ? (
                          <AppIcon name="play" size={9} color={theme.colors.onMedia} />
                        ) : null}
                        <Text style={styles.sizeText}>{formatBytes(item.sizeBytes)}</Text>
                      </GlassSurface>
                    </Pressable>
                  );
                }}
              />

              <View style={styles.footer}>
                <GlassButton
                  label={
                    deleting
                      ? ''
                      : selected.length > 0
                        ? `${selected.length} Öğeyi Sil · ${formatBytes(selectedBytes)}`
                        : 'Silmek için öğe seç'
                  }
                  icon={selected.length > 0 ? 'trash-outline' : undefined}
                  tintColor={selected.length > 0 ? theme.colors.deleteTint : undefined}
                  textColor={selected.length > 0 ? theme.colors.delete : theme.colors.textMuted}
                  fullWidth
                  loading={deleting}
                  disabled={selected.length === 0}
                  onPress={confirmDelete}
                />
              </View>
            </>
          )}
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
    marginBottom: theme.spacing.md,
  },
  liveHeader: {
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  liveHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  liveHeaderText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  liveTrack: {
    height: 4,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.separator,
    overflow: 'hidden',
  },
  liveFill: {
    height: '100%',
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accent,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
  },
  scanTitle: {
    ...theme.typography.heading,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.md,
  },
  scanCount: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  progressTrack: {
    width: '80%',
    height: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.separator,
    overflow: 'hidden',
    marginTop: theme.spacing.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accent,
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
  sizeTag: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  sizeText: {
    ...theme.typography.footnote,
    fontWeight: '600',
    color: theme.colors.onMedia,
  },
  footer: {
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
});
