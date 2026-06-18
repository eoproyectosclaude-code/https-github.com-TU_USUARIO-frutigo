import React, { useEffect, useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Card, fontSize, radius, spacing, typography } from '@frutigo/ui';
import { useApp } from '../../src/providers/AppProvider';
import { api, type LoyaltySummary } from '../../src/services/api';

type Me = Awaited<ReturnType<typeof api.me>>;

export default function ProfileScreen() {
  const { theme, locale, toggleLocale, user, logout } = useApp();
  const router = useRouter();
  const [loyalty, setLoyalty] = useState<LoyaltySummary | null>(null);
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    if (user) {
      api.loyalty().then(setLoyalty).catch(() => setLoyalty(null));
      api.me().then(setMe).catch(() => setMe(null));
    } else {
      setLoyalty(null);
      setMe(null);
    }
  }, [user]);

  async function shareReferral() {
    if (!me?.referralCode) return;
    const msg =
      locale === 'es'
        ? `¡Únete a FRUTI GO con mi código ${me.referralCode} y obtén $5 de crédito en tu primer pedido! 🥭🚚`
        : `Join FRUTI GO with my code ${me.referralCode} and get $5 credit on your first order! 🥭🚚`;
    try {
      await Share.share({ message: msg });
    } catch {
      Alert.alert(locale === 'es' ? 'No se pudo compartir' : 'Could not share');
    }
  }

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

      {me?.referralCode ? (
        <Card theme={theme} style={{ marginBottom: spacing.lg, borderWidth: 1, borderColor: theme.colors.primary }}>
          <Text style={{ color: theme.colors.text, fontFamily: typography.subtitle, fontSize: fontSize.md }}>
            {locale === 'es' ? '🤝 Invita y gana $5' : '🤝 Refer & earn $5'}
          </Text>
          <Text style={{ color: theme.colors.textMuted, fontFamily: typography.body, fontSize: fontSize.xs, marginTop: 2 }}>
            {locale === 'es'
              ? 'Comparte tu código. Ganas $5 cuando tu referido paga su primer pedido.'
              : 'Share your code. You earn $5 when your referral pays their first order.'}
          </Text>
          <View style={[styles.codeBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={{ color: theme.colors.primary, fontFamily: typography.title, fontSize: fontSize.xl, letterSpacing: 3 }}>
              {me.referralCode}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm }}>
            <Text style={{ color: theme.colors.textMuted, fontFamily: typography.body, fontSize: fontSize.xs }}>
              {locale === 'es' ? `Referidos: ${me.referralsCount}` : `Referrals: ${me.referralsCount}`}
            </Text>
            <Text style={{ color: theme.colors.text, fontFamily: typography.bodyMedium, fontSize: fontSize.xs }}>
              {locale === 'es' ? `Crédito: $${me.referralCreditUsd.toFixed(2)}` : `Credit: $${me.referralCreditUsd.toFixed(2)}`}
            </Text>
          </View>
          <Button
            label={locale === 'es' ? 'Compartir código' : 'Share code'}
            theme={theme}
            variant="primary"
            style={{ marginTop: spacing.md, alignSelf: 'stretch' }}
            onPress={shareReferral}
          />
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
  codeBox: {
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
});
