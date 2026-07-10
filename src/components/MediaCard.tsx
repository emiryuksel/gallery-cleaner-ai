import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { GlassSurface } from './GlassSurface';
import { theme } from '../theme';
import type { GalleryItem } from '../services/mediaLibrary';

function formatDuration(ms: number | null): string {
  if (!ms) return '';
  const totalSeconds = Math.round(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface MediaCardProps {
  item: GalleryItem;
  active: boolean;
}

/** Kart içeriği: foto ise Image, video ise oynatıcı. Üstünde glass bilgi etiketi. */
export function MediaCard({ item, active }: MediaCardProps) {
  const isVideo = item.mediaType === 'video';

  return (
    <View style={styles.container}>
      {isVideo ? (
        <VideoCardContent item={item} active={active} />
      ) : (
        <Image
          source={{ uri: item.uri }}
          style={styles.media}
          contentFit="cover"
          transition={150}
        />
      )}

      <View style={styles.topBar} pointerEvents="none">
        <GlassSurface radius={theme.radius.pill} style={styles.badge}>
          <Text style={styles.badgeText}>
            {isVideo ? `🎬 ${formatDuration(item.durationMs)}` : '📷 Fotoğraf'}
          </Text>
        </GlassSurface>
      </View>

      <View style={styles.bottomBar} pointerEvents="none">
        <GlassSurface radius={theme.radius.md} style={styles.filenameBadge}>
          <Text style={styles.filename} numberOfLines={1}>
            {item.filename}
          </Text>
        </GlassSurface>
      </View>
    </View>
  );
}

function VideoCardContent({ item, active }: MediaCardProps) {
  const player = useVideoPlayer(item.uri, (p) => {
    p.loop = true;
    p.muted = true;
  });

  React.useEffect(() => {
    if (active) {
      player.play();
    } else {
      player.pause();
    }
  }, [active, player]);

  return (
    <VideoView
      style={styles.media}
      player={player}
      nativeControls={false}
      contentFit="cover"
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    backgroundColor: theme.colors.backgroundElevated,
  },
  media: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  topBar: {
    position: 'absolute',
    top: theme.spacing.md,
    left: theme.spacing.md,
    flexDirection: 'row',
  },
  badge: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
  },
  badgeText: {
    ...theme.typography.caption,
    color: theme.colors.textPrimary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: theme.spacing.md,
    left: theme.spacing.md,
    right: theme.spacing.md,
  },
  filenameBadge: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  filename: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
});
