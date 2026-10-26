/**
 * Safe localStorage utilities with schema validation and fallback handling (QAS-008)
 */

export function safeLoadStorage<T>(key: string, fallback: T, validator?: (val: any) => boolean): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (validator && !validator(parsed)) {
      console.warn(`[storageUtils] Validation failed for storage key "${key}". Falling back to default.`);
      return fallback;
    }
    return parsed as T;
  } catch (err) {
    console.warn(`[storageUtils] Failed to parse JSON for storage key "${key}". Falling back to default:`, err);
    return fallback;
  }
}

export function safeSaveStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`[storageUtils] Failed to save key "${key}" to localStorage:`, err);
  }
}
