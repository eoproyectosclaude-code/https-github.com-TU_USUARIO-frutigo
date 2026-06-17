import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { Badge, Card, Price, spacing, radius, fontSize, typography } from '@frutigo/ui';
import { priceForUnit, type Product } from '@frutigo/shared';
import { useApp } from '../providers/AppProvider';

export function ProductCard({ product }: { product: Product }) {
  const { theme, locale, t } = useApp();
  const kg = priceForUnit(product, 'KG');
  const name = locale === 'es' ? product.nameEs : product.nameEn;

  return (
    <Link href={`/product/${product.id}`} asChild>
      <Pressable style={styles.wrap}>
        <Card theme={theme} padded={false} style={styles.card}>
          <Image source={{ uri: product.imageUrl }} style={styles.image} />
          <View style={styles.body}>
            <View style={styles.badges}>
              {product.certifications[0] ? (
                <Badge label={product.certifications[0]} color={theme.colors.secondary} />
              ) : null}
              {product.shipProvisioning ? (
                <Badge label="⚓ Ship" color={theme.colors.accent} textColor="#11203A" />
              ) : null}
            </View>
            <Text numberOfLines={1} style={[styles.name, { color: theme.colors.text }]}>
              {name}
            </Text>
            <Text style={[styles.origin, { color: theme.colors.textMuted }]}>
              📍 {product.province}
            </Text>
            {kg ? <Price amountUsd={kg.priceUsd} theme={theme} prefix={t.common.from} /> : null}
          </View>
        </Card>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  card: { overflow: 'hidden' },
  image: { width: '100%', height: 110, backgroundColor: '#ddd' },
  body: { padding: spacing.md, gap: 4 },
  badges: { flexDirection: 'row', gap: 6, marginBottom: 2 },
  name: { fontFamily: typography.subtitle, fontSize: fontSize.md },
  origin: { fontFamily: typography.body, fontSize: fontSize.xs },
});
