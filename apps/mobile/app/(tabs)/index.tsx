import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { PRODUCTS, recommend } from '@frutigo/shared';
import { Card, fontSize, spacing, typography, radius } from '@frutigo/ui';
import { useApp } from '../../src/providers/AppProvider';
import { ProductCard } from '../../src/components/ProductCard';

const CATEGORIES: { key: string; icon: string; es: string; en: string }[] = [
  { key: 'FRUTAS', icon: '🍍', es: 'Frutas', en: 'Fruits' },
  { key: 'VERDURAS', icon: '🥦', es: 'Verduras', en: 'Vegetables' },
  { key: 'LEGUMBRES', icon: '🫘', es: 'Legumbres', en: 'Legumes' },
  { key: 'TUBERCULOS', icon: '🥔', es: 'Tubérculos', en: 'Tubers' },
];

export default function HomeScreen() {
  const { theme, locale, t, toggleLocale, user } = useApp();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  // Recomendaciones inteligentes (calidad, temporada, disponibilidad, segmento).
  const recommended = recommend(PRODUCTS, { segment: user?.segment as never }, 6).map((r) => r.product);
  const featured = PRODUCTS.slice(0, 4);

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 32 }}
    >
      {/* Header marca */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: theme.colors.textMuted }]}>
            {t.home.greeting} 👋
          </Text>
          <Text style={[styles.brand, { color: theme.colors.text }]}>
            FRUTI<Text style={{ color: theme.colors.primary }}>GO</Text>
          </Text>
        </View>
        <Pressable
          onPress={toggleLocale}
          style={[styles.langBtn, { borderColor: theme.colors.border }]}
        >
          <Text style={{ color: theme.colors.text, fontFamily: typography.bodyMedium }}>
            {locale === 'es' ? '🇵🇦 ES' : '🇺🇸 EN'}
          </Text>
        </Pressable>
      </View>

      {/* Banner Ship Provisioning (navegable) */}
      <Pressable onPress={() => router.push('/(provisioning)')}>
        <Card theme={theme} style={[styles.shipBanner, { backgroundColor: theme.colors.secondary }]}>
          <Text style={styles.shipTitle}>⚓ {t.home.shipProvisioning}</Text>
          <Text style={styles.shipDesc}>{t.home.shipProvisioningDesc}</Text>
          <Text style={styles.shipCta}>
            {locale === 'es' ? 'Abrir portal de buques ›' : 'Open vessel portal ›'}
          </Text>
        </Card>
      </Pressable>

      {/* Categorías */}
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t.home.categories}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
        {CATEGORIES.map((c) => (
          <View key={c.key} style={[styles.catChip, { backgroundColor: theme.colors.surface }]}>
            <Text style={styles.catIcon}>{c.icon}</Text>
            <Text style={[styles.catLabel, { color: theme.colors.text }]}>
              {locale === 'es' ? c.es : c.en}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Recomendados para ti (motor de recomendaciones) */}
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        {locale === 'es' ? '✨ Recomendados para ti' : '✨ Recommended for you'}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recoRow}>
        {recommended.map((p) => (
          <View key={p.id} style={styles.recoItem}>
            <ProductCard product={p} />
          </View>
        ))}
      </ScrollView>

      {/* Destacados */}
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t.home.featured}</Text>
      <View style={styles.grid}>
        {featured.map((p) => (
          <View key={p.id} style={styles.gridItem}>
            <ProductCard product={p} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  greeting: { fontFamily: typography.body, fontSize: fontSize.sm },
  brand: { fontFamily: typography.display, fontSize: fontSize.xxl },
  langBtn: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  shipBanner: { marginHorizontal: spacing.lg, marginBottom: spacing.lg },
  shipTitle: { color: '#fff', fontFamily: typography.title, fontSize: fontSize.md },
  shipDesc: { color: '#E6F4EC', fontFamily: typography.body, fontSize: fontSize.sm, marginTop: 4 },
  shipCta: { color: '#F2C707', fontFamily: typography.bodyMedium, fontSize: fontSize.sm, marginTop: 8 },
  sectionTitle: {
    fontFamily: typography.title,
    fontSize: fontSize.lg,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  catRow: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  catChip: {
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    marginRight: spacing.sm,
    minWidth: 80,
  },
  catIcon: { fontSize: 28 },
  catLabel: { fontFamily: typography.body, fontSize: fontSize.xs, marginTop: 4 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg - 4,
  },
  gridItem: { width: '50%', padding: 4 },
  recoRow: { paddingHorizontal: spacing.lg - 4, gap: 8, paddingBottom: spacing.md },
  recoItem: { width: 170 },
});
