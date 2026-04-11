import { createMMKV } from 'react-native-mmkv';

/**
 * Single MMKV instance used across the app.
 *
 * The `id` namespaces the storage on disk so a future "multi-account" mode can
 * spin up extra instances without colliding with the default one.
 *
 * NOTE: `react-native-mmkv` v3+ (Nitro Modules) replaced the `new MMKV(...)`
 * constructor with a `createMMKV(...)` factory. And `remove(key)` replaced
 * the old `delete(key)`.
 */
export const storage = createMMKV({ id: 'sahla.default' });

/**
 * Thin JSON helpers on top of `storage` so call sites don't repeat
 * parse/stringify boilerplate.
 */
export const kv = {
  getJSON<T>(key: string): T | null {
    const raw = storage.getString(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      // Corrupt payload — drop it so we don't poison future reads.
      storage.remove(key);
      return null;
    }
  },
  setJSON<T>(key: string, value: T) {
    storage.set(key, JSON.stringify(value));
  },
  delete(key: string) {
    storage.remove(key);
  },
};
