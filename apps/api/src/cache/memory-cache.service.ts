import { Injectable } from '@nestjs/common';

interface Entry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Caché en memoria con TTL (sin dependencias externas).
 * Pensada para lecturas muy frecuentes que cambian poco (catálogo, recomendaciones).
 * `wrap()` cachea el resultado de una función async por `ttlMs`.
 * La invalidación se hace por prefijo de clave (p. ej. "products").
 */
@Injectable()
export class MemoryCacheService {
  private store = new Map<string, Entry<unknown>>();
  private hits = 0;
  private misses = 0;

  async wrap<T>(key: string, ttlMs: number, producer: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const hit = this.store.get(key);
    if (hit && hit.expiresAt > now) {
      this.hits++;
      return hit.value as T;
    }
    this.misses++;
    const value = await producer();
    this.store.set(key, { value, expiresAt: now + ttlMs });
    return value;
  }

  /** Invalida todas las claves que empiezan con el prefijo dado. */
  invalidate(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }

  clear(): void {
    this.store.clear();
  }

  /** Métricas simples para observabilidad (hit ratio). */
  stats() {
    const total = this.hits + this.misses;
    return {
      keys: this.store.size,
      hits: this.hits,
      misses: this.misses,
      hitRatio: total ? Math.round((this.hits / total) * 100) / 100 : 0,
    };
  }
}
