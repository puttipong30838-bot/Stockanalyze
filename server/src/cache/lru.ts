import { LRUCache } from "lru-cache";

interface CacheEnvelope {
  value: unknown;
}

const caches = new Map<string, LRUCache<string, CacheEnvelope>>();

function getCache(namespace: string, ttlMs: number) {
  let cache = caches.get(namespace);
  if (!cache) {
    cache = new LRUCache<string, CacheEnvelope>({ max: 500, ttl: ttlMs });
    caches.set(namespace, cache);
  }
  return cache;
}

export async function cached<T>(
  namespace: string,
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cache = getCache(namespace, ttlMs);
  const existing = cache.get(key);
  if (existing !== undefined) {
    return existing.value as T;
  }
  const value = await fetcher();
  cache.set(key, { value });
  return value;
}
