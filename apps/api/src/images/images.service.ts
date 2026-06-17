import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface ImageResult {
  url: string;
  thumbnail: string;
  title: string;
  source: 'google' | 'demo';
}

/**
 * Búsqueda de imágenes vía Google Custom Search JSON API (searchType=image).
 * Requiere GOOGLE_CSE_API_KEY y GOOGLE_CSE_CX (Programmable Search Engine con
 * "Búsqueda de imágenes" activada). Sin credenciales, devuelve sugerencias demo.
 */
@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);

  async search(query: string, limit = 8): Promise<ImageResult[]> {
    const key = process.env.GOOGLE_CSE_API_KEY;
    const cx = process.env.GOOGLE_CSE_CX;
    const q = query.trim();
    if (!q) return [];

    if (!key || !cx) {
      this.logger.warn('GOOGLE_CSE_API_KEY/CX no configuradas — imágenes demo.');
      return this.demo(q, limit);
    }

    try {
      const { data } = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key,
          cx,
          q: `${q} producto fresco`,
          searchType: 'image',
          num: Math.min(limit, 10),
          safe: 'active',
          imgType: 'photo',
        },
        timeout: 10_000,
      });

      const items: any[] = data?.items ?? [];
      return items.map((it) => ({
        url: it.link,
        thumbnail: it.image?.thumbnailLink ?? it.link,
        title: it.title ?? q,
        source: 'google' as const,
      }));
    } catch (err) {
      this.logger.error(`Google CSE falló: ${(err as Error).message}`);
      return this.demo(q, limit);
    }
  }

  /** Sugerencias demo (Unsplash) cuando no hay API de Google configurada. */
  private demo(q: string, limit: number): ImageResult[] {
    return Array.from({ length: Math.min(limit, 6) }, (_, i) => {
      const url = `https://source.unsplash.com/400x400/?${encodeURIComponent(q)},fresh&sig=${i}`;
      return { url, thumbnail: url, title: `${q} #${i + 1}`, source: 'demo' as const };
    });
  }
}
