import { useEffect, useState } from 'react';
import { PRODUCTS, type Product } from '@frutigo/shared';
import { api } from '../services/api';

/**
 * Carga el catálogo desde el API. Si el backend no responde (demo sin servidor),
 * cae al seed local para que la app siga siendo navegable.
 */
export function useCatalog(category?: string) {
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<'api' | 'local'>('local');

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .products(category)
      .then((data) => {
        if (!active) return;
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
          setSource('api');
        }
      })
      .catch(() => {
        if (active) {
          setProducts(
            category ? PRODUCTS.filter((p) => p.category === category) : PRODUCTS,
          );
          setSource('local');
        }
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [category]);

  return { products, loading, source };
}
