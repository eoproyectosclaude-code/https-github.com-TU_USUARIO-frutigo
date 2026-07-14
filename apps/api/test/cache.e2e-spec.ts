import { MemoryCacheService } from '../src/cache/memory-cache.service';

describe('MemoryCacheService', () => {
  it('cachea el resultado: el productor se llama una sola vez dentro del TTL', async () => {
    const cache = new MemoryCacheService();
    let calls = 0;
    const producer = async () => {
      calls++;
      return { data: 42 };
    };
    const a = await cache.wrap('k', 1000, producer);
    const b = await cache.wrap('k', 1000, producer);
    expect(a).toEqual(b);
    expect(calls).toBe(1); // el segundo fue hit de caché
    expect(cache.stats().hits).toBe(1);
    expect(cache.stats().misses).toBe(1);
  });

  it('invalida por prefijo y vuelve a producir', async () => {
    const cache = new MemoryCacheService();
    let calls = 0;
    const p = async () => ++calls;
    await cache.wrap('products:list:all', 1000, p);
    await cache.wrap('products:one:x', 1000, p);
    cache.invalidate('products:');
    await cache.wrap('products:list:all', 1000, p); // miss tras invalidar
    expect(calls).toBe(3);
  });

  it('expira por TTL', async () => {
    const cache = new MemoryCacheService();
    let calls = 0;
    const p = async () => ++calls;
    await cache.wrap('k', 5, p); // TTL 5ms
    await new Promise((r) => setTimeout(r, 20));
    await cache.wrap('k', 5, p); // ya expiró → miss
    expect(calls).toBe(2);
  });
});
