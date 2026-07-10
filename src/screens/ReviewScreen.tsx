import React from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassSurface } from '../components/GlassSurface';
import { GlassButton } from '../components/GlassButton';
import { theme } from '../theme';
import { deleteItems, GalleryItem } from '../services/mediaLibrary';

interface ReviewScreenProps {
  items: GalleryItem[];
  onBack: () => void;
  onDeleted: (deletedIds: string[]) => void;
}

export function ReviewScreen({ items, onBack, onDeleted }: ReviewScreenProps) {
  const [selected, setSelected] = React.useState<GalleryItem[]>(items);
  const [deleting, setDeleting] = React.useState(false);

  const toggle = (item: GalleryItem) => {
    setSelected((prev) =>
      prev.some((i) => i.id === item.id)
        ? prev.filter((i) => i.id !== item.id)
        : [...prev, item]
    );
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
    } catch (e) {
      Alert.alert('Silme başarısız', 'Öğeler silinemedi. Lütfen tekrar dene.');
      setDeleting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} hitSlop={12}>
          <GlassSurface radius={theme.radius.pill} style={styles.backBtn}>
            <Text style={styles.backText}>‹ Geri</Text>
          </GlassSurface>
        </Pressable>
        <Text style={styles.title}>Silinecekler</Text>
        <View style={styles.backBtnPlaceholder} />
      </View>

      <Text style={styles.subtitle}>
        Dokunarak listeden çıkarabilirsin. {selected.length} öğe seçili.
      </Text>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.gridRow}
        renderItem={({ item }) => {
          const isSelected = selected.some((i) => i.id === item.id);
          return (
            <Pressable style={styles.cell} onPress={() => toggle(item)}>
              <Image source={{ uri: item.uri }} style={styles.thumb} contentFit="cover" />
              <View
                style={[
                  styles.thumbOverlay,
                  isSelected ? styles.thumbSelected : styles.thumbDeselected,
                ]}
              >
                <Text style={styles.checkMark}>{isSelected ? '🗑️' : '↩️'}</Text>
              </View>
              {item.mediaType === 'video' ? (
                <View style={styles.videoTag}>
                  <Text style={styles.videoTagText}>▶</Text>
                </View>
              ) : null}
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
                ? `${selected.length} Öğeyi Kalıcı Olarak Sil`
                : 'Silinecek öğe yok'
          }
          tintColor={selected.length > 0 ? theme.colors.deleteTint : undefined}
          fullWidth
          loading={deleting}
          disabled={selected.length === 0}
          onPress={confirmDelete}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  backBtn: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  backBtnPlaceholder: {
    width: 72,
  },
  backText: {
    ...theme.typography.label,
    color: theme.colors.textPrimary,
  },
  title: {
    ...theme.typography.heading,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
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
  },
  thumb: {
    ...StyleSheet.absoluteFillObject,
  },
  thumbOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbSelected: {
    backgroundColor: theme.colors.deleteTint,
  },
  thumbDeselected: {
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  checkMark: {
    fontSize: 14,
  },
  videoTag: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: theme.radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  videoTagText: {
    color: '#fff',
    fontSize: 10,
  },
  footer: {
    paddingVertical: theme.spacing.lg,
  },
});
