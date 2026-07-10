import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { GlassSurface } from './GlassSurface';
import { AppIcon } from './AppIcon';
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
        <PhotoCardContent uri={item.uri} />
      )}

      <View style={styles.topBar} pointerEvents="none">
        <GlassSurface glassEffectStyle="clear" radius={theme.radius.pill} style={styles.badge}>
          <AppIcon
            name={isVideo ? 'videocam-outline' : 'image-outline'}
            size={14}
            color={theme.colors.onMedia}
          />
          <Text style={styles.badgeText}>
            {isVideo ? formatDuration(item.durationMs) : 'Fotoğraf'}
          </Text>
        </GlassSurface>
      </View>

      <View style={styles.bottomBar} pointerEvents="none">
        <GlassSurface glassEffectStyle="clear" radius={theme.radius.md} style={styles.filenameBadge}>
          <Text style={styles.filename} numberOfLines={1}>
            {item.filename}
          </Text>
        </GlassSurface>
      </View>
    </View>
  );
}

function PhotoCardContent({ uri }: { uri: string }) {
  return (
    <View style={styles.mediaStage}>
      <Image
        source={{ uri }}
        style={styles.mediaBackdrop}
        contentFit="cover"
        blurRadius={28}
        transition={150}
      />
      <Image
        source={{ uri }}
        style={styles.media}
        contentFit="contain"
        transition={150}
      />
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
      contentFit="contain"
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
  mediaStage: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  mediaBackdrop: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ scale: 1.08 }],
  },
  media: {
    ...StyleSheet.absoluteFillObject,
  },
  topBar: {
    position: 'absolute',
    top: theme.spacing.md,
    left: theme.spacing.md,
    flexDirection: 'row',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
  },
  badgeText: {
    ...theme.typography.caption,
    color: theme.colors.onMedia,
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
    color: theme.colors.onMediaSecondary,
  },
});
