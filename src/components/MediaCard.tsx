import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent } from 'expo';
import { GlassSurface } from './GlassSurface';
import { AppIcon } from './AppIcon';
import { theme } from '../theme';
import {
  getVideoSourceUri,
  resolveVideoFileUri,
  type GalleryItem,
} from '../services/mediaLibrary';

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
  // PHAsset URI'leri (ph://) yalnızca replaceAsync / constructor ile yüklenebildiği
  // için player'ı boş başlatıp kaynağı efekt içinde veriyoruz.
  const player = useVideoPlayer(null, (p) => {
    p.loop = true;
    p.muted = true;
  });

  const { status } = useEvent(player, 'statusChange', { status: player.status });
  const [failed, setFailed] = React.useState(false);
  const attemptRef = React.useRef<'primary' | 'file'>('primary');
  const primaryUri = getVideoSourceUri(item);

  // ph:// yolu başarısız olursa file:// çözüp (iCloud indirmesine izin vererek) tekrar dene.
  const tryFileFallback = React.useCallback(async () => {
    if (attemptRef.current !== 'primary') return;
    attemptRef.current = 'file';
    const fileUri = await resolveVideoFileUri(item.id);
    if (!fileUri) {
      setFailed(true);
      return;
    }
    try {
      await player.replaceAsync(fileUri);
    } catch {
      setFailed(true);
    }
  }, [item.id, player]);

  React.useEffect(() => {
    attemptRef.current = 'primary';
    setFailed(false);
    player.replaceAsync(primaryUri).catch(() => {
      tryFileFallback();
    });
  }, [primaryUri, player, tryFileFallback]);

  React.useEffect(() => {
    if (status === 'error') {
      if (attemptRef.current === 'primary') {
        tryFileFallback();
      } else {
        setFailed(true);
      }
    }
  }, [status, tryFileFallback]);

  // Kaynak sonsuza dek 'loading'de kalırsa (ör. PHAsset desteği olmayan eski runtime)
  // makul bir süre sonra file:// yoluna düş.
  React.useEffect(() => {
    if (status === 'readyToPlay' || failed) return;
    const timer = setTimeout(() => {
      tryFileFallback();
    }, 6000);
    return () => clearTimeout(timer);
  }, [status, failed, tryFileFallback]);

  const ready = status === 'readyToPlay';

  React.useEffect(() => {
    if (active && ready) {
      player.play();
    } else {
      player.pause();
    }
  }, [active, ready, player]);

  return (
    <View style={styles.mediaStage}>
      <Image
        source={{ uri: item.uri }}
        style={styles.mediaBackdrop}
        contentFit="cover"
        blurRadius={28}
        transition={150}
      />
      <View style={[styles.media, !ready && styles.mediaHidden]}>
        <VideoView
          style={StyleSheet.absoluteFill}
          player={player}
          nativeControls={false}
          contentFit="contain"
        />
      </View>
      {!ready ? (
        <>
          <Image
            source={{ uri: item.uri }}
            style={styles.media}
            contentFit="contain"
            transition={150}
          />
          <View style={styles.videoStatus} pointerEvents="none">
            <GlassSurface
              glassEffectStyle="clear"
              radius={theme.radius.pill}
              style={styles.videoStatusPill}
            >
              {failed ? (
                <AppIcon name="alert-circle-outline" size={14} color={theme.colors.onMedia} />
              ) : (
                <ActivityIndicator size="small" color={theme.colors.onMedia} />
              )}
              <Text style={styles.videoStatusText}>
                {failed ? 'Video oynatılamadı' : 'Video yükleniyor…'}
              </Text>
            </GlassSurface>
          </View>
        </>
      ) : null}
    </View>
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
  mediaHidden: {
    opacity: 0,
  },
  videoStatus: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.overlay,
  },
  videoStatusText: {
    ...theme.typography.caption,
    color: theme.colors.onMedia,
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
