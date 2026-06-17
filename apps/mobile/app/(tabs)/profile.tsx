import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, fontSize, radius, spacing, typography } from '@frutigo/ui';
import { useApp } from '../../src/providers/AppProvider';
import { api, type LoyaltySummary } from '../../src/services/api';

export default function ProfileScreen() {
  const { theme, locale, toggleLocale, user, logout } = useApp();
  const router = useRouter();
  const [loyalty, setLoyalty] = useState<LoyaltySummary | null>(null);

  useEffect(() => {
    if (user) api.loyalty().then(setLoyalty).catch(() => setLoyalty(null));
    else setLoyalty(null);
  }, [user]);

  const rows = [
    { icon: '🏢', es: 'Mi empresa / segmento', en: 'My business / segment' },
    { icon: '📍', es: 'Direcciones de entrega', en: 'Delivery addresses' },
    { icon: '💳', es: 'Métodos de pago', en: 'Payment methods' },
    { icon: '⚓', es: 'Buques registrados (Ship Provisioning)', en: 'Registered vessels (Ship Provisioning)' },
    { icon: '🌐', es: 'Idioma', en: 'Language' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, padding: spacing.lg }}>
      <Card theme={theme} style={{ marginBottom: spacing.lg, alignItems: 'center', paddingVertical: spacing.xl }}>
        <View style={[styles.avatar, { backgroundColor: theme.colors.secondary }]}>
          <Text style={{ fontSize: 32 }}>🧑‍🌾</Text>
        </View>
        <Text style={[styles.name, { color: theme.colors.text }]}>{user?.name ?? 'FRUTI GO'}</Text>
        <Text style={{ color: theme.colors.textMuted, fontFamily: typography.body }}>
          {user?.email ?? (locale === 'es' ? 'Invitado' : 'Guest')}
        </Text>
        <Button
          label={
            user
              ? locale === 'es'
                ? 'Cerrar sesión'
                : 'Log out'
              : locale === 'es'
                ? 'Iniciar sesión / Registrarme'
                : 'Sign in / Sign up'
          }
          theme={theme}
          variant={user ? 'outline' : 'primary'}
          style={{ marginTop: spacing.md, alignSelf: 'stretch' }}
          onPress={() => (user ? logout() : router.push('/auth'))}
        />
        {user?.role === 'PROVEEDOR' ? (
          <Button
            label={locale === 'es' ? '🌾 Abrir Portal Proveedor' : '🌾 Open Supplier Portal'}
            theme={theme}
            variant="secondary"
            style={{ marginTop: spacing.sm, alignSelf: 'stretch' }}
            onPress={() => router.push('/(supplier)')}
          />
        ) : null}
        {user?.role === 'ADMIN' ? (
          <Button
            label={locale === 'es' ? '🛡️ Panel de Administración' : '🛡️ Admin Panel'}
            theme={theme}
            variant="secondary"
            style={{ marginTop: spacing.sm, alignSelf: 'stretch' }}
            onPress={() => router.push('/(admin)')}
          />
        ) : null}
        {user?.role === 'REPARTIDOR' ? (
          <Button
            label={locale === 'es' ? '🛵 Mis entregas' : '🛵 My deliveries'}
            theme={theme}
            variant="secondary"
            style={{ marginTop: spacing.sm, alignSelf: 'stretch' }}
            onPress={() => router.push('/(driver)')}
          />
        ) : null}
      </Card>

      {loyalty ? (
        <Card theme={theme} style={{ marginBottom: spacing.lg, backgroundColor: theme.colors.secondary }}>
          <Text style={{ color: '#F6C615', fontFamily: typography.title, fontSize: fontSize.xl }}>
            {loyalty.points} <Text style={{ fontSize: fontSize.sm, color: '#fff' }}>FrutiGo Points</Text>
          </Text>
          <Text style={{ color: '#fff', fontFamily: typography.subtitle, fontSize: fontSize.md, marginTop: 2 }}>
            {locale === 'es' ? 'Nivel' : 'Tier'}: {locale === 'es' ? loyalty.tierLabelEs : loyalty.tierLabelEn}
            {loyalty.perkDiscount > 0 ? `  ·  -${Math.round(loyalty.perkDiscount * 100)}%` : ''}
          </Text>
          {loyalty.next ? (
            <Text style={{ color: '#E6F4EC', fontFamily: typography.body, fontSize: fontSize.xs, marginTop: 4 }}>
              {locale === 'es'
                ? `Te faltan ${loyalty.next.remaining} pts para ${loyalty.next.next}`
                : `${loyalty.next.remaining} pts to ${loyalty.next.next}`}
            </Text>
          ) : null}
        </Card>
      ) : null}

      {rows.map((r, i) => (
        <Pressable
          key={i}
          onPress={r.icon === '🌐' ? toggleLocale : undefined}
          style={[styles.row, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
        >
          <Text style={{ fontSize: 20 }}>{r.icon}</Text>
          <Text style={[styles.rowLabel, { color: theme.colors.text }]}>
            {locale === 'es' ? r.es : r.en}
          </Text>
          <Text style={{ color: theme.colors.textMuted }}>
            {r.icon === '🌐' ? (locale === 'es' ? 'Español ›' : 'English ›') : '›'}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  name: { fontFamily: typography.title, fontSize: fontSize.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  rowLabel: { flex: 1, fontFamily: typography.bodyMedium, fontSize: fontSize.md },
});
