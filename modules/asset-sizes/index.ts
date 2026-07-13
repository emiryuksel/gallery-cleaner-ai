import { requireOptionalNativeModule } from 'expo-modules-core';

/**
 * Native modül: verilen asset id'leri için dosya boyutlarını (byte) toplu döndürür.
 * iOS'ta PHAssetResource.fileSize üzerinden okunur.
 * getAssetInfoAsync'in aksine iCloud indirmesi / path resolve yapmaz → çok hızlı.
 */
interface AssetSizesModule {
  /**
   * @param ids expo-media-library asset id'leri (iOS: PHAsset localIdentifier).
   * @returns id → byte boyutu eşlemesi. Boyutu okunamayan id'ler eşlemede olmayabilir.
   */
  getSizes(ids: string[]): Promise<Record<string, number>>;
}

// requireOptionalNativeModule: modül henüz build edilmemişse (Expo Go / prebuild öncesi)
// throw etmez, null döner. Böylece uygulama çökmeden JS fallback'e düşebilir.
const nativeModule = requireOptionalNativeModule<AssetSizesModule>('AssetSizes');

/**
 * Native modülün bu build'de mevcut olup olmadığını söyler.
 * false ise çağıran taraf getAssetInfoAsync tabanlı yavaş yola düşmelidir.
 */
export function isAssetSizesAvailable(): boolean {
  return nativeModule != null;
}

export async function getSizes(ids: string[]): Promise<Record<string, number>> {
  if (ids.length === 0) return {};
  if (nativeModule == null) {
    throw new Error('AssetSizes native module is not available in this build.');
  }
  return nativeModule.getSizes(ids);
}

export default nativeModule;
