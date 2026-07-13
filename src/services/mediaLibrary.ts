import { Platform } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { File, Paths } from 'expo-file-system';
import {
  Asset,
  AssetField,
  MediaType,
  Query,
} from 'expo-media-library/next';
import {
  getSizes as nativeGetSizes,
  isAssetSizesAvailable,
} from '../../modules/asset-sizes';

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
  sizeBytes: number | null;
  asset?: Asset;
}

const PAGE_SIZE = 30;
// getAssetInfoAsync FALLBACK yolunda eşzamanlı istek sayısı (native modül yoksa).
const SIZE_CONCURRENCY = 24;
// Klasik getAssetsAsync tek sayfada döndürülecek maksimum öğe (metadata tek çağrıda gelir).
const SCAN_PAGE_SIZE = 500;
// Native getSizes'a tek seferde gönderilecek id sayısı. Çok büyük dizileri parçalayıp
// ilerleme bildirebilmek için chunk'lıyoruz.
const NATIVE_SIZE_CHUNK = 500;

function toKind(mediaType: MediaType): MediaKind {
  return mediaType === MediaType.VIDEO ? 'video' : 'photo';
}

function classicToKind(mediaType: MediaLibrary.MediaTypeValue): MediaKind {
  return mediaType === 'video' ? 'video' : 'photo';
}

/**
 * Bir asset'in byte boyutunu okur.
 * /next Asset boyut vermiyor: klasik getAssetInfoAsync ile localUri (file://) alıp
 * expo-file-system File.size ile ölçüyoruz.
 * shouldDownloadFromNetwork:false → iCloud'daki öğeler ağdan indirilmez (hız + hata önlenir).
 * Hata olursa null döner (best-effort).
 */
async function readSizeBytes(id: string): Promise<number | null> {
  try {
    const info = await MediaLibrary.getAssetInfoAsync(id, {
      shouldDownloadFromNetwork: false,
    });
    const localUri = info.localUri ?? info.uri;
    if (!localUri || !localUri.startsWith('file://')) return null;
    const size = new File(localUri).size;
    return typeof size === 'number' && size > 0 ? size : null;
  } catch {
    return null;
  }
}

async function hydrate(asset: Asset): Promise<GalleryItem> {
  const kind = toKind(await asset.getMediaType());

  // Videolarda getUri() requestAVAsset çalıştırır: yavaştır, iCloud'daki öğelerde
  // fırlatır ve döndürdüğü file:// yolu expo-video için sandbox izni taşımaz.
  // iOS'ta ph://<localIdentifier> hem expo-image (poster) hem expo-video (playback)
  // tarafından native olarak desteklenir, bu yüzden videolar için onu kullanıyoruz.
  const uriPromise =
    kind === 'video' && Platform.OS === 'ios'
      ? Promise.resolve(`ph://${asset.id}`)
      : asset.getUri();

  const [uri, filename, width, height, durationMs, creationTime] =
    await Promise.all([
      uriPromise,
      asset.getFilename(),
      asset.getWidth(),
      asset.getHeight(),
      asset.getDuration(),
      asset.getCreationTime(),
    ]);

  return {
    id: asset.id,
    uri,
    filename,
    mediaType: kind,
    width,
    height,
    durationMs,
    creationTime,
    sizeBytes: null,
    asset,
  };
}

/**
 * Galeriden fotoğraf + video'ları sayfalı çeker (yeni SDK Query API'si).
 * Kaldığımız yeri offset ile takip ediyoruz. Swipe akışı için boyut hesaplanmaz (hız).
 * Tek bir bozuk/erişilemeyen öğe tüm sayfayı düşürmesin diye öğeler tek tek korunur.
 */
export async function fetchGalleryPage(offset: number): Promise<GalleryItem[]> {
  const assets = await new Query()
    .within(AssetField.MEDIA_TYPE, [MediaType.IMAGE, MediaType.VIDEO])
    .orderBy({ key: AssetField.CREATION_TIME, ascending: false })
    .offset(offset)
    .limit(PAGE_SIZE)
    .exe();

  const hydrated = await Promise.all(
    assets.map(async (asset) => {
      try {
        return await hydrate(asset);
      } catch {
        return null;
      }
    })
  );
  return hydrated.filter((item): item is GalleryItem => item != null);
}

/**
 * Video oynatma için kullanılacak kaynak URI'si.
 * iOS: ph:// URI'si — expo-video bunu replaceAsync ile native çözer (iCloud dahil).
 * Diğer platformlar: asset'in kendi uri'si.
 */
export function getVideoSourceUri(item: GalleryItem): string {
  if (Platform.OS === 'ios') return `ph://${item.id}`;
  return item.uri;
}

/**
 * ph:// yolu başarısız olursa video için file:// yolu çözer (iCloud indirmesine izin verir).
 * Bulunamazsa null döner.
 */
export async function resolveVideoFileUri(id: string): Promise<string | null> {
  try {
    const info = await MediaLibrary.getAssetInfoAsync(id, {
      shouldDownloadFromNetwork: true,
    });
    const localUri = info.localUri ?? null;
    return localUri && localUri.startsWith('file') ? localUri : null;
  } catch {
    return null;
  }
}

/**
 * Ana ekran hero kartı için son çekilen fotoğrafların küçük önizleme URI'lerini döndürür.
 * Klasik API'nin ph:// uri'si expo-image tarafından doğrudan gösterilebilir.
 */
export async function fetchRecentThumbnails(count = 3): Promise<string[]> {
  try {
    const page = await MediaLibrary.getAssetsAsync({
      first: count,
      mediaType: ['photo'],
      sortBy: [['creationTime', false]],
    });
    return page.assets.map((asset) => asset.uri);
  } catch {
    return [];
  }
}

/**
 * Galerideki toplam fotoğraf + video sayısı (ana ekran istatistiği için).
 */
export async function getLibraryTotalCount(): Promise<number> {
  try {
    const page = await MediaLibrary.getAssetsAsync({
      first: 1,
      mediaType: ['photo', 'video'],
    });
    return page.totalCount;
  } catch {
    return 0;
  }
}

/**
 * Klasik getAssetsAsync ile tüm foto+video'ların metadata'sını sayfalı çeker.
 * Tek çağrıda tüm alanlar senkron gelir (uri, filename, width, height, duration, creationTime),
 * bu yüzden /next getter'larına göre çok daha az bridge trafiği yaratır.
 */
async function fetchAllMetadata(
  onCount?: (loaded: number) => void
): Promise<MediaLibrary.Asset[]> {
  const all: MediaLibrary.Asset[] = [];
  let after: string | undefined;
  for (;;) {
    const page = await MediaLibrary.getAssetsAsync({
      first: SCAN_PAGE_SIZE,
      after,
      mediaType: ['photo', 'video'],
      sortBy: [['creationTime', false]],
    });
    all.push(...page.assets);
    onCount?.(all.length);
    if (!page.hasNextPage || page.assets.length === 0) break;
    after = page.endCursor;
  }
  return all;
}

function classicToItem(asset: MediaLibrary.Asset, sizeBytes: number | null): GalleryItem {
  return {
    id: asset.id,
    uri: asset.uri,
    filename: asset.filename,
    mediaType: classicToKind(asset.mediaType),
    width: asset.width,
    height: asset.height,
    durationMs: asset.duration ? asset.duration * 1000 : null,
    creationTime: asset.creationTime ?? null,
    sizeBytes,
  };
}

export interface ScanProgress {
  scanned: number;
  total: number;
}

export interface ScanCallbacks {
  /** Her ilerleme adımında çağrılır. */
  onProgress?: (progress: ScanProgress) => void;
  /** Tarama sürerken ara sonuçları (boyuta göre sıralı) bildirir — canlı liste için. */
  onPartial?: (items: GalleryItem[]) => void;
  /** true dönerse tarama erken durur. */
  shouldCancel?: () => boolean;
}

// ---- Kalıcı boyut cache'i --------------------------------------------------
// id → [sizeBytes, modificationTime]. modificationTime değişmişse entry geçersizdir.
// İlk taramadan sonra yalnızca yeni/değişen öğeler ölçülür; tekrar ziyaretler saniyeler sürer.

type SizeCacheEntry = [size: number, modificationTime: number];
type SizeCacheMap = Record<string, SizeCacheEntry>;

const SIZE_CACHE_FILENAME = 'asset-size-cache-v1.json';
// Ara sonuç emisyonları arasındaki minimum süre (liste her ölçümde değil, periyodik güncellenir).
const PARTIAL_EMIT_INTERVAL_MS = 600;
// Bu kadar yeni ölçüm birikince cache diske yazılır (yarıda çıkılsa bile emek kaybolmaz).
const CACHE_PERSIST_EVERY = 1000;

function sizeCacheFile(): File {
  return new File(Paths.document, SIZE_CACHE_FILENAME);
}

function loadSizeCache(): SizeCacheMap {
  try {
    const file = sizeCacheFile();
    if (!file.exists) return {};
    const parsed: unknown = JSON.parse(file.textSync());
    return parsed && typeof parsed === 'object' ? (parsed as SizeCacheMap) : {};
  } catch {
    return {};
  }
}

function saveSizeCache(cache: SizeCacheMap): void {
  const payload = JSON.stringify(cache);
  try {
    sizeCacheFile().write(payload);
  } catch {
    try {
      const file = sizeCacheFile();
      file.create();
      file.write(payload);
    } catch {
      // Cache yazılamazsa sessizce devam — yalnızca sonraki taramalar yavaş olur.
    }
  }
}

/**
 * FALLBACK: Native modül yoksa getAssetInfoAsync ile boyut ölçer (yavaş).
 * Sabit sayıda worker ile kuyruğu sırayla tüketir; sonuçları paylaşılan map'e yazar.
 */
async function scanSizesWithFallback(
  assets: MediaLibrary.Asset[],
  sizes: Map<string, number>,
  onMeasured: (measured: number) => void,
  shouldCancel?: () => boolean
): Promise<void> {
  const total = assets.length;
  let measured = 0;
  let cursor = 0;

  const worker = async () => {
    for (;;) {
      if (shouldCancel?.()) return;
      const i = cursor;
      cursor += 1;
      if (i >= total) return;
      const size = await readSizeBytes(assets[i].id);
      if (size != null) sizes.set(assets[i].id, size);
      measured += 1;
      if (measured % 10 === 0 || measured === total) onMeasured(measured);
    }
  };

  const workerCount = Math.min(SIZE_CONCURRENCY, total || 1);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
}

/**
 * Native modül ile id'lerin boyutunu chunk'lar halinde toplu okur (çok hızlı).
 * Her chunk sonrası ilerleme bildirir; sonuçları paylaşılan map'e yazar.
 */
async function scanSizesNative(
  assets: MediaLibrary.Asset[],
  sizes: Map<string, number>,
  onMeasured: (measured: number) => void,
  shouldCancel?: () => boolean
): Promise<void> {
  let measured = 0;
  for (let i = 0; i < assets.length; i += NATIVE_SIZE_CHUNK) {
    if (shouldCancel?.()) return;
    const chunk = assets.slice(i, i + NATIVE_SIZE_CHUNK);
    const map = await nativeGetSizes(chunk.map((a) => a.id));
    for (const asset of chunk) {
      const size = map[asset.id];
      if (typeof size === 'number' && size > 0) sizes.set(asset.id, size);
    }
    measured += chunk.length;
    onMeasured(measured);
  }
}

/**
 * Tüm galeriyi tarar, her öğenin boyutunu ölçer ve boyuta göre azalan sıralı döner.
 *
 * Hız stratejisi:
 * 1. Kalıcı cache: daha önce ölçülen boyutlar (modificationTime değişmediyse) anında gelir.
 * 2. Öncelik sırası: videolar (süreye göre) → yüksek megapiksel fotoğraflar → gerisi.
 *    "En büyükler" listesinin tepesi böylece saniyeler içinde doğru şekilde dolar.
 * 3. onPartial: tarama sürerken sıralı ara sonuçlar yayınlanır (canlı liste).
 * 4. Native modül (PHAssetResource.fileSize) varsa toplu okuma; yoksa getAssetInfoAsync.
 */
export async function scanAllBySize(callbacks: ScanCallbacks = {}): Promise<GalleryItem[]> {
  const { onProgress, onPartial, shouldCancel } = callbacks;
  onProgress?.({ scanned: 0, total: 0 });

  const assets = await fetchAllMetadata((loaded) => {
    onProgress?.({ scanned: 0, total: loaded });
  });
  if (shouldCancel?.()) return [];

  const total = assets.length;
  const sizes = new Map<string, number>();

  // 1) Cache'ten bilinenleri al, kalanları ölçüm kuyruğuna koy.
  const cache = loadSizeCache();
  const pending: MediaLibrary.Asset[] = [];
  for (const asset of assets) {
    const entry = cache[asset.id];
    if (entry && entry[1] === (asset.modificationTime ?? 0)) {
      sizes.set(asset.id, entry[0]);
    } else {
      pending.push(asset);
    }
  }

  // 2) Büyük olması muhtemel öğeler önce: videolar (uzun olan önce),
  //    ardından fotoğraflar megapiksele göre azalan sırada.
  pending.sort((a, b) => {
    const aVideo = a.mediaType === 'video' ? 1 : 0;
    const bVideo = b.mediaType === 'video' ? 1 : 0;
    if (aVideo !== bVideo) return bVideo - aVideo;
    if (aVideo === 1) return (b.duration ?? 0) - (a.duration ?? 0);
    return (b.width ?? 0) * (b.height ?? 0) - (a.width ?? 0) * (a.height ?? 0);
  });

  const cachedCount = total - pending.length;

  const buildItems = () =>
    assets
      .map((asset) => classicToItem(asset, sizes.get(asset.id) ?? null))
      .sort((a, b) => (b.sizeBytes ?? 0) - (a.sizeBytes ?? 0));

  const persistCache = () => {
    const next: SizeCacheMap = {};
    for (const asset of assets) {
      const size = sizes.get(asset.id);
      if (size != null) next[asset.id] = [size, asset.modificationTime ?? 0];
    }
    saveSizeCache(next);
  };

  onProgress?.({ scanned: cachedCount, total });
  if (cachedCount > 0) onPartial?.(buildItems());

  if (pending.length > 0) {
    let lastEmitAt = Date.now();
    let lastPersistedAt = 0;

    const handleMeasured = (measured: number) => {
      onProgress?.({ scanned: cachedCount + measured, total });
      const now = Date.now();
      if (onPartial && now - lastEmitAt >= PARTIAL_EMIT_INTERVAL_MS) {
        lastEmitAt = now;
        onPartial(buildItems());
      }
      if (measured - lastPersistedAt >= CACHE_PERSIST_EVERY) {
        lastPersistedAt = measured;
        persistCache();
      }
    };

    if (isAssetSizesAvailable()) {
      try {
        await scanSizesNative(pending, sizes, handleMeasured, shouldCancel);
      } catch {
        // Native modül var ama çağrı beklenmedik şekilde başarısız olduysa yavaş yola düş.
        await scanSizesWithFallback(pending, sizes, handleMeasured, shouldCancel);
      }
    } else {
      // Native modül bu build'de yok (Expo Go / prebuild öncesi) → getAssetInfoAsync yolu.
      await scanSizesWithFallback(pending, sizes, handleMeasured, shouldCancel);
    }

    // Yarıda iptal edilse bile o ana kadarki ölçümler sonraki taramaya kalsın.
    persistCache();
  }

  if (shouldCancel?.()) return [];

  onProgress?.({ scanned: total, total });
  return buildItems();
}

/**
 * Seçilen asset'leri siler → iOS tek bir onay popup'ı gösterir.
 * Klasik API kullanılır; /next Asset.delete iOS'ta sınırlı galeri erişiminde reddedilir.
 */
export async function deleteItems(items: GalleryItem[]): Promise<void> {
  if (items.length === 0) return;
  const deleted = await MediaLibrary.deleteAssetsAsync(items.map((item) => item.id));
  if (!deleted) {
    throw new Error('Silme işlemi tamamlanamadı.');
  }
}

/**
 * Byte değerini okunabilir metne çevirir (KB / MB / GB).
 */
export function formatBytes(bytes: number | null): string {
  if (bytes == null || bytes <= 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const decimals = value >= 100 || unitIndex === 0 ? 0 : 1;
  return `${value.toFixed(decimals)} ${units[unitIndex]}`;
}

export { PAGE_SIZE };
