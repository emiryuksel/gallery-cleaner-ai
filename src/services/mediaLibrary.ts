import {
  Asset,
  AssetField,
  MediaType,
  Query,
} from 'expo-media-library/next';

export type MediaKind = 'photo' | 'video';

export interface GalleryItem {
  id: string;
  uri: string;
  filename: string;
  mediaType: MediaKind;
  width: number;
  height: number;
  durationMs: number | null;
  creationTime: number | null;
  asset: Asset;
}

const PAGE_SIZE = 30;

function toKind(mediaType: MediaType): MediaKind {
  return mediaType === MediaType.VIDEO ? 'video' : 'photo';
}

/**
 * Galeriden fotoğraf + video'ları sayfalı çeker (yeni SDK 57 Query API'si).
 * Kaldığımız yeri offset ile takip ediyoruz.
 */
export async function fetchGalleryPage(offset: number): Promise<GalleryItem[]> {
  const assets = await new Query()
    .within(AssetField.MEDIA_TYPE, [MediaType.IMAGE, MediaType.VIDEO])
    .orderBy({ key: AssetField.CREATION_TIME, ascending: false })
    .offset(offset)
    .limit(PAGE_SIZE)
    .exe();

  const items = await Promise.all(
    assets.map(async (asset): Promise<GalleryItem> => {
      const [uri, filename, mediaType, width, height, durationMs, creationTime] =
        await Promise.all([
          asset.getUri(),
          asset.getFilename(),
          asset.getMediaType(),
          asset.getWidth(),
          asset.getHeight(),
          asset.getDuration(),
          asset.getCreationTime(),
        ]);

      return {
        id: asset.id,
        uri,
        filename,
        mediaType: toKind(mediaType),
        width,
        height,
        durationMs,
        creationTime,
        asset,
      };
    })
  );

  return items;
}

/**
 * Seçilen asset'leri tek batch çağrısıyla siler → iOS tek bir onay popup'ı gösterir.
 * Silinen öğeler "Son Silinenler" albümüne 30 gün gider.
 */
export async function deleteItems(items: GalleryItem[]): Promise<void> {
  if (items.length === 0) return;
  await Asset.delete(items.map((item) => item.asset));
}

export { PAGE_SIZE };
