import React from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassContainer, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import { GlassSurface } from '../components/GlassSurface';
import { GlassButton } from '../components/GlassButton';
import { GlassIconButton } from '../components/GlassIconButton';
import { AppIcon } from '../components/AppIcon';
import { SwipeCard, SwipeCardHandle, SwipeDecision } from '../components/SwipeCard';
import { theme } from '../theme';
import { fetchGalleryPage, GalleryItem, PAGE_SIZE } from '../services/mediaLibrary';

interface SwipeScreenProps {
  toDelete: GalleryItem[];
  onToDeleteChange: (toDelete: GalleryItem[]) => void;
  onReview: () => void;
  onLogout: () => void;
  restoredQueue: GalleryItem[];
  onRestoredQueueHandled: () => void;
  deletedIdsQueue: string[];
  onDeletedIdsQueueHandled: () => void;
}

const PREFETCH_THRESHOLD = 8;
const glassContainerAvailable = isGlassEffectAPIAvailable();

export function SwipeScreen({
  toDelete,
  onToDeleteChange,
  onReview,
  onLogout,
  restoredQueue,
  onRestoredQueueHandled,
  deletedIdsQueue,
  onDeletedIdsQueueHandled,
}: SwipeScreenProps) {
  const [items, setItems] = React.useState<GalleryItem[]>([]);
  const [index, setIndex] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [hasMore, setHasMore] = React.useState(true);
  const [keptCount, setKeptCount] = React.useState(0);

  const offsetRef = React.useRef(0);
  const loadingMoreRef = React.useRef(false);
  const topCardRef = React.useRef<SwipeCardHandle>(null);
  const indexRef = React.useRef(0);

  React.useEffect(() => {
    indexRef.current = index;
  }, [index]);

  const loadMore = React.useCallback(async () => {
    if (loadingMoreRef.current || !hasMore) return;
    loadingMoreRef.current = true;
    try {
      const page = await fetchGalleryPage(offsetRef.current);
      offsetRef.current += page.length;
      if (page.length < PAGE_SIZE) setHasMore(false);
      setItems((prev) => [...prev, ...page]);
    } finally {
      loadingMoreRef.current = false;
      setLoading(false);
    }
  }, [hasMore]);

  React.useEffect(() => {
    loadMore();
  }, [loadMore]);

  React.useEffect(() => {
    if (restoredQueue.length === 0) return;
    setKeptCount((count) => count + restoredQueue.length);
    onRestoredQueueHandled();
  }, [restoredQueue, onRestoredQueueHandled]);

  React.useEffect(() => {
    if (deletedIdsQueue.length === 0) return;

    const deleted = new Set(deletedIdsQueue);
    setItems((prev) => {
      let removedBeforeIndex = 0;
      for (let i = 0; i < indexRef.current; i++) {
        if (deleted.has(prev[i]?.id)) removedBeforeIndex++;
      }
      const next = prev.filter((item) => !deleted.has(item.id));
      if (removedBeforeIndex > 0) {
        setIndex((current) => Math.max(0, current - removedBeforeIndex));
      }
      return next;
    });

    onDeletedIdsQueueHandled();
  }, [deletedIdsQueue, onDeletedIdsQueueHandled]);

  const handleSwiped = React.useCallback(
    (decision: SwipeDecision) => {
      const swipedItem = items[index];
      if (swipedItem) {
        if (decision === 'delete') {
          onToDeleteChange([...toDelete, swipedItem]);
        } else {
          setKeptCount((c) => c + 1);
        }
      }
      setIndex((i) => i + 1);
    },
    [items, index, toDelete, onToDeleteChange]
  );

  React.useEffect(() => {
    const remaining = items.length - index;
    if (remaining <= PREFETCH_THRESHOLD && hasMore) {
      loadMore();
    }
  }, [index, items.length, hasMore, loadMore]);

  const triggerSwipe = (decision: SwipeDecision) => {
    topCardRef.current?.swipe(decision);
  };

  const confirmLogout = () => {
    Alert.alert('Çıkış yap', 'Oturumun kapatılacak. Devam etmek istiyor musun?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Çıkış Yap', style: 'destructive', onPress: onLogout },
    ]);
  };

  const finished = !loading && index >= items.length && !hasMore;
  const processed = index;
  const total = hasMore ? '...' : items.length;

  if (loading && items.length === 0) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator color={theme.colors.accent} size="large" />
        <Text style={styles.loadingText}>Galerin yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  if (items.length === 0) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Text style={styles.emptyTitle}>Galeri boş</Text>
        <Text style={styles.emptyText}>Temizlenecek fotoğraf veya video bulunamadı.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <GlassSurface
          glassEffectStyle="clear"
          radius={theme.radius.pill}
          elevation="glass"
          style={styles.progressBadge}
        >
          <Text style={styles.progressText}>{processed} / {total}</Text>
          <View style={styles.progressDivider} />
          <View style={styles.deleteCount}>
            <AppIcon name="trash-outline" size={14} color={theme.colors.delete} />
            <Text style={styles.deleteCountText}>{toDelete.length}</Text>
          </View>
        </GlassSurface>
        <View style={styles.headerActions}>
          <GlassButton
            label={toDelete.length > 0 ? `İncele (${toDelete.length})` : 'İncele'}
            icon="list-outline"
            tintColor={toDelete.length > 0 ? theme.colors.deleteTint : undefined}
            textColor={toDelete.length > 0 ? theme.colors.delete : theme.colors.textMuted}
            style={styles.reviewBtn}
            disabled={toDelete.length === 0}
            onPress={onReview}
          />
          <GlassIconButton
            icon="log-out-outline"
            iconColor={theme.colors.textSecondary}
            size={44}
            onPress={confirmLogout}
          />
        </View>
      </View>

      <View style={styles.deck}>
        {finished ? (
          <View style={styles.center}>
            <GlassSurface glassEffectStyle="regular" radius={theme.radius.xl} elevation="floating" style={styles.doneBadge}>
              <AppIcon name="checkmark-circle-outline" size={48} color={theme.colors.keep} />
            </GlassSurface>
            <Text style={styles.emptyTitle}>Tamamlandı</Text>
            <Text style={styles.emptyText}>
              {keptCount} öğe tutuldu, {toDelete.length} öğe silinmek üzere işaretlendi.
            </Text>
          </View>
        ) : (
          items
            .map((item, i) => {
              if (i < index || i > index + 2) return null;
              const isTop = i === index;
              return (
                <View
                  key={item.id}
                  style={[
                    styles.cardWrapper,
                    { zIndex: items.length - i, transform: [{ scale: isTop ? 1 : 0.96 - (i - index) * 0.02 }] },
                  ]}
                  pointerEvents={isTop ? 'auto' : 'none'}
                >
                  <SwipeCard
                    ref={isTop ? topCardRef : undefined}
                    item={item}
                    active={isTop}
                    onSwiped={handleSwiped}
                  />
                </View>
              );
            })
            .reverse()
        )}
      </View>

      {!finished ? (
        <View style={styles.controls}>
          {glassContainerAvailable ? (
            <GlassContainer spacing={20} style={styles.controlsRow}>
              <GlassIconButton
                icon="trash-outline"
                label="Sil"
                tintColor={theme.colors.deleteTint}
                iconColor={theme.colors.delete}
                size={72}
                onPress={() => triggerSwipe('delete')}
              />
              <GlassIconButton
                icon="checkmark"
                label="Tut"
                tintColor={theme.colors.keepTint}
                iconColor={theme.colors.keep}
                size={72}
                onPress={() => triggerSwipe('keep')}
              />
            </GlassContainer>
          ) : (
            <View style={styles.controlsRow}>
              <GlassIconButton
                icon="trash-outline"
                label="Sil"
                tintColor={theme.colors.deleteTint}
                iconColor={theme.colors.delete}
                size={72}
                onPress={() => triggerSwipe('delete')}
              />
              <GlassIconButton
                icon="checkmark"
                label="Tut"
                tintColor={theme.colors.keepTint}
                iconColor={theme.colors.keep}
                size={72}
                onPress={() => triggerSwipe('keep')}
              />
            </View>
          )}
        </View>
      ) : (
        <View style={styles.controls}>
          <GlassButton
            label={`Silinecekleri İncele (${toDelete.length})`}
            icon="arrow-forward-circle-outline"
            tintColor={theme.colors.accentTint}
            textColor={theme.colors.accent}
            fullWidth
            disabled={toDelete.length === 0}
            onPress={onReview}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  loadingText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  emptyTitle: {
    ...theme.typography.title,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.lg,
  },
  doneBadge: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  progressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  progressText: {
    ...theme.typography.label,
    color: theme.colors.textPrimary,
  },
  progressDivider: {
    width: StyleSheet.hairlineWidth,
    height: 14,
    backgroundColor: theme.colors.separator,
  },
  deleteCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deleteCountText: {
    ...theme.typography.label,
    color: theme.colors.delete,
  },
  reviewBtn: {
    minHeight: 44,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  deck: {
    flex: 1,
    marginVertical: theme.spacing.md,
  },
  cardWrapper: {
    ...StyleSheet.absoluteFillObject,
  },
  controls: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 96,
    paddingVertical: theme.spacing.lg,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: theme.spacing.xl,
  },
});
