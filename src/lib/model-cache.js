export const MODEL_DOWNLOAD_MB = 54
export const MODEL_CACHE_MARKER = 'passport-photo-studio:model-ready:v1'

export function modelCacheStatus(storage = globalThis.localStorage) {
  if (!storage?.getItem) return 'unknown'
  try {
    return storage.getItem(MODEL_CACHE_MARKER) === '1' ? 'cached' : 'missing'
  } catch {
    return 'unknown'
  }
}

export function markModelCached(storage = globalThis.localStorage) {
  try {
    storage?.setItem?.(MODEL_CACHE_MARKER, '1')
  } catch {
    // Storage may be disabled; the model still works for the current session.
  }
}
