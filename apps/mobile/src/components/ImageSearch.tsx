import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { fontSize, radius, spacing, typography } from '@frutigo/ui';
import { useApp } from '../providers/AppProvider';
import { api, type ImageResult } from '../services/api';

interface Props {
  /** Consulta inicial sugerida (p. ej. el nombre del producto). */
  initialQuery?: string;
  /** Imagen actualmente seleccionada. */
  selected?: string;
  onSelect: (url: string) => void;
}

/**
 * Buscador de imágenes de Google: el proveedor escribe un término,
 * ve un grid de resultados y toca uno para asignarlo al producto.
 */
export function ImageSearch({ initialQuery = '', selected, onSelect }: Props) {
  const { theme, locale } = useApp();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<ImageResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function doSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      setResults(await api.searchImages(query));
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={styles.searchRow}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={doSearch}
          placeholder={locale === 'es' ? 'Buscar imagen en Google…' : 'Search image on Google…'}
          placeholderTextColor={theme.colors.textMuted}
          style={[
            styles.input,
            { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.border },
          ]}
        />
        <Pressable
          onPress={doSearch}
          style={[styles.searchBtn, { backgroundColor: theme.colors.primary }]}
        >
          <Text style={{ color: '#fff', fontFamily: typography.subtitle }}>🔍</Text>
        </Pressable>
      </View>

      {selected ? (
        <View style={styles.selectedRow}>
          <Image source={{ uri: selected }} style={styles.selectedImg} />
          <Text style={{ color: theme.colors.success, fontFamily: typography.bodyMedium, fontSize: fontSize.xs }}>
            ✓ {locale === 'es' ? 'Imagen seleccionada' : 'Image selected'}
          </Text>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: spacing.md }} />
      ) : (
        <View style={styles.grid}>
          {results.map((r, i) => {
            const active = selected === r.url;
            return (
              <Pressable
                key={`${r.url}-${i}`}
                onPress={() => onSelect(r.url)}
                style={[
                  styles.thumbWrap,
                  { borderColor: active ? theme.colors.primary : 'transparent' },
                ]}
              >
                <Image source={{ uri: r.thumbnail }} style={styles.thumb} />
              </Pressable>
            );
          })}
        </View>
      )}

      {searched && !loading && results.length === 0 ? (
        <Text style={{ color: theme.colors.textMuted, fontFamily: typography.body, fontSize: fontSize.xs }}>
          {locale === 'es' ? 'Sin resultados. Prueba otro término.' : 'No results. Try another term.'}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  searchRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    fontFamily: typography.body,
    fontSize: fontSize.md,
  },
  searchBtn: { width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  selectedRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  selectedImg: { width: 56, height: 56, borderRadius: radius.sm, backgroundColor: '#ddd' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  thumbWrap: { width: '23%', aspectRatio: 1, borderRadius: radius.sm, borderWidth: 2, overflow: 'hidden' },
  thumb: { width: '100%', height: '100%', backgroundColor: '#ddd' },
});
