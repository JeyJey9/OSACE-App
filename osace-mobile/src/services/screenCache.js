/**
 * screenCache.js
 * Cache global singleton pentru datele ecranelor tab-urilor.
 * Supraviețuiește remount-urilor componentelor — datele rămân în memorie
 * atât timp cât aplicația rulează.
 *
 * TTL implicit: 5 minute. După expirare, primul fetch va arăta skeleton.
 */

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minute

/** @type {Map<string, { data: any, timestamp: number }>} */
const _store = new Map();

const screenCache = {
  /**
   * Returnează datele din cache dacă există și nu au expirat.
   * @param {string} key
   * @param {number} [ttlMs]
   * @returns {any | null}
   */
  get(key, ttlMs = DEFAULT_TTL_MS) {
    const entry = _store.get(key);
    if (!entry) return null;
    const age = Date.now() - entry.timestamp;
    if (age > ttlMs) {
      _store.delete(key);
      return null;
    }
    return entry.data;
  },

  /**
   * Salvează datele în cache cu timestamp-ul curent.
   * @param {string} key
   * @param {any} data
   */
  set(key, data) {
    _store.set(key, { data, timestamp: Date.now() });
  },

  /**
   * Șterge o intrare specifică (ex: la pull-to-refresh).
   * @param {string} key
   */
  invalidate(key) {
    _store.delete(key);
  },

  /**
   * Șterge tot cache-ul (ex: la logout).
   */
  clear() {
    _store.clear();
  },
};

export default screenCache;
