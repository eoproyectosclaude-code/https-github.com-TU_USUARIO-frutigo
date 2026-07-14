import { Global, Module } from '@nestjs/common';
import { MemoryCacheService } from './memory-cache.service';

/** Caché global disponible por inyección en cualquier módulo. */
@Global()
@Module({
  providers: [MemoryCacheService],
  exports: [MemoryCacheService],
})
export class CacheModule {}
