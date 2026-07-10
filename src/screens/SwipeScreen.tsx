import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassSurface } from '../components/GlassSurface';
import { GlassButton } from '../components/GlassButton';
import { SwipeCard, SwipeCardHandle, SwipeDecision } from '../components/SwipeCard';
import { theme } from '../theme';
import { fetchGalleryPage, GalleryItem, PAGE_SIZE } from '../services/mediaLibrary';

interface SwipeScreenProps {
  onReview: (toDelete: GalleryItem[]) => void;
}

const PREFETCH_THRESHOLD = 8;

export function SwipeScreen({ onReview }: SwipeScreenProps) {
  const [items, setItems] = React.useState<GalleryItem[]>([]);
  const [index, setIndex] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [hasMore, setHasMore] = React.useState(true);
  const [toDelete, setToDelete] = React.useState<GalleryItem[]>([]);
  const [keptCount, setKeptCount] = React.useState(0);

  const offsetRef = React.useRef(0);
  const loadingMoreRef = React.useRef(false);
  const topCardRef = React.useRef<SwipeCardHandle>(null);

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

  const handleSwiped = React.useCallback(
    (decision: SwipeDecision) => {
      const swipedItem = items[index];
      if (swipedItem) {
        if (decision === 'delete') {
          setToDelete((prev) => [...prev, swipedItem]);
        } else {
          setKeptCount((c) => c + 1);
        }
      }
      setIndex((i) => i + 1);
    },
    [items, index]
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
        <GlassSurface radius={theme.radius.pill} style={styles.progressBadge}>
          <Text style={styles.progressText}>
            {processed} / {total} · 🗑️ {toDelete.length}
          </Text>
        </GlassSurface>
        {toDelete.length > 0 ? (
          <GlassButton
            label={`İncele (${toDelete.length})`}
            tintColor={theme.colors.deleteTint}
            style={styles.reviewBtn}
            onPress={() => onReview(toDelete)}
          />
        ) : null}
      </View>

      <View style={styles.deck}>
        {finished ? (
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>Hepsi bu kadar! 🎉</Text>
            <Text style={styles.emptyText}>
              {keptCount} öğe tuttun, {toDelete.length} öğe silmek için işaretledin.
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
          <GlassButton
            label="🗑️  Sil"
            tintColor={theme.colors.deleteTint}
            containerStyle={styles.controlBtn}
            onPress={() => triggerSwipe('delete')}
          />
          <GlassButton
            label="💚  Tut"
            tintColor={theme.colors.keepTint}
            containerStyle={styles.controlBtn}
            onPress={() => triggerSwipe('keep')}
          />
        </View>
      ) : (
        <View style={styles.controls}>
          <GlassButton
            label={`Silinecekleri İncele (${toDelete.length})`}
            tintColor={theme.colors.accent}
            fullWidth
            disabled={toDelete.length === 0}
            onPress={() => onReview(toDelete)}
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
    ...theme.typography.heading,
    color: theme.colors.textPrimary,
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
  progressBadge: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  progressText: {
    ...theme.typography.label,
    color: theme.colors.textPrimary,
  },
  reviewBtn: {
    minHeight: 44,
    paddingVertical: theme.spacing.sm,
  },
  deck: {
    flex: 1,
    marginVertical: theme.spacing.md,
  },
  cardWrapper: {
    ...StyleSheet.absoluteFillObject,
  },
  controls: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
  },
  controlBtn: {
    flex: 1,
  },
});
