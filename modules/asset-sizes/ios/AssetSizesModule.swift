import ExpoModulesCore
import Photos

public class AssetSizesModule: Module {
  public func definition() -> ModuleDefinition {
    Name("AssetSizes")

    AsyncFunction("getSizes") { (ids: [String], promise: Promise) in
      DispatchQueue.global(qos: .userInitiated).async {
        var result: [String: Double] = [:]

        if ids.isEmpty {
          promise.resolve(result)
          return
        }

        // Tek bir fetch ile tüm PHAsset'leri getir (id fırtınası yerine).
        let fetchResult = PHAsset.fetchAssets(withLocalIdentifiers: ids, options: nil)

        fetchResult.enumerateObjects { asset, _, _ in
          let resources = PHAssetResource.assetResources(for: asset)
          // Bir asset'in birden fazla resource'u olabilir (ör. Live Photo, RAW+JPEG,
          // düzenlenmiş versiyon). Toplam disk boyutu için hepsini topluyoruz.
          var total: Int64 = 0
          for resource in resources {
            if let size = resource.value(forKey: "fileSize") as? CLong {
              total += Int64(size)
            }
          }
          if total > 0 {
            // JS number (Double) olarak döndür; byte değerleri Double hassasiyetinde güvenli.
            result[asset.localIdentifier] = Double(total)
          }
        }

        promise.resolve(result)
      }
    }
  }
}
