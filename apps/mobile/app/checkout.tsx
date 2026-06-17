import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  PAYMENT_METHODS,
  formatUsd,
  type CustomerSegment,
  type DeliveryType,
  type PaymentMethod,
} from '@frutigo/shared';
import { useStripe } from '@stripe/stripe-react-native';
import { Button, Card, fontSize, radius, spacing, typography } from '@frutigo/ui';
import { useApp } from '../src/providers/AppProvider';
import { useCart } from '../src/store/cart';
import { runCheckout } from '../src/services/checkout';
import { api } from '../src/services/api';

const SEGMENTS: CustomerSegment[] = ['B2C_HOGAR', 'B2B_HORECA', 'DISTRIBUIDOR', 'BUQUE_NAVIERA'];
const DELIVERIES: { key: DeliveryType; es: string; en: string; icon: string }[] = [
  { key: 'DOMICILIO', es: 'A domicilio', en: 'Home delivery', icon: '🏠' },
  { key: 'PIE_DE_MUELLE', es: 'Pie de muelle', en: 'Pier-side', icon: '⚓' },
  { key: 'RETIRO', es: 'Retiro en bodega', en: 'Warehouse pickup', icon: '🏬' },
];

export default function CheckoutScreen() {
  const { theme, locale, t } = useApp();
  const router = useRouter();
  const { items, segment, deliveryType, setSegment, setDeliveryType, setLoyaltyDiscount, clear } = useCart();
  const totals = useCart((s) => s.totals());
  const { user } = useApp();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [method, setMethod] = useState<PaymentMethod>('YAPPY');
  const [loading, setLoading] = useState(false);

  // Aplica el descuento del nivel FrutiGo Points del usuario al total.
  useEffect(() => {
    if (!user) {
      setLoyaltyDiscount(0);
      return;
    }
    api.loyalty().then((l) => setLoyaltyDiscount(l.perkDiscount)).catch(() => setLoyaltyDiscount(0));
  }, [user]);

  /** Presenta el Payment Sheet nativo de Stripe. Devuelve true si el pago se completó. */
  async function payWithStripeSheet(clientSecret: string): Promise<boolean> {
    const init = await initPaymentSheet({
      paymentIntentClientSecret: clientSecret,
      merchantDisplayName: 'FRUTI GO',
      allowsDelayedPaymentMethods: false,
      defaultBillingDetails: { email: user?.email },
    });
    if (init.error) {
      Alert.alert('Stripe', init.error.message);
      return false;
    }
    const result = await presentPaymentSheet();
    if (result.error) {
      // Código 'Canceled' cuando el usuario cierra el sheet.
      if (result.error.code !== 'Canceled') Alert.alert('Stripe', result.error.message);
      return false;
    }
    return true;
  }

  const availableMethods = PAYMENT_METHODS.filter(
    (m) => m.enabled && m.segments.includes(segment),
  );

  async function placeOrder() {
    setLoading(true);
    try {
      const result = await runCheckout({ items, segment, deliveryType, method, customerEmail: user?.email });
      const action = result.nextAction;

      // Stripe: presentar Payment Sheet nativo y esperar confirmación.
      if (action.type === 'STRIPE_SHEET' && action.clientSecret) {
        const paid = await payWithStripeSheet(action.clientSecret);
        if (!paid) {
          setLoading(false);
          return; // el usuario canceló o falló; no limpiar carrito
        }
      }

      clear();

      let extra = '';
      if (action.type === 'CRYPTO' && action.address) {
        extra = `\n${action.asset ?? 'USDT'}: ${action.address}`;
      } else if (action.type === 'REDIRECT') {
        extra = `\n${locale === 'es' ? 'Abriendo pasarela...' : 'Opening gateway...'}`;
      } else if (action.type === 'STRIPE_SHEET') {
        extra = `\n${locale === 'es' ? 'Pago con tarjeta confirmado' : 'Card payment confirmed'}`;
      }

      Alert.alert(
        `✅ ${t.checkout.success}`,
        `${t.checkout.successDesc}\n\nRef: ${result.reference}\n${result.method} · ${result.status}${extra}${result.offline ? '\n(demo offline)' : ''}`,
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/orders') }],
      );
    } catch (e) {
      Alert.alert(
        locale === 'es' ? 'Error de pago' : 'Payment error',
        (e as Error).message,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 140 }}>
        {/* Segmento */}
        <Section title={locale === 'es' ? 'Segmento' : 'Segment'} theme={theme}>
          <View style={styles.wrapRow}>
            {SEGMENTS.map((s) => (
              <Chip
                key={s}
                active={segment === s}
                label={t.segments[s]}
                onPress={() => {
                  setSegment(s);
                  const next = PAYMENT_METHODS.find((m) => m.enabled && m.segments.includes(s));
                  if (next) setMethod(next.method);
                }}
                theme={theme}
              />
            ))}
          </View>
          {segment === 'BUQUE_NAVIERA' ? (
            <Text style={[styles.note, { color: theme.colors.success }]}>
              ⚓ {locale === 'es' ? 'Buque en tránsito — exento de ITBMS (Ley 28/1995)' : 'Vessel in transit — ITBMS exempt (Law 28/1995)'}
            </Text>
          ) : null}
        </Section>

        {/* Entrega */}
        <Section title={t.checkout.deliveryType} theme={theme}>
          <View style={styles.wrapRow}>
            {DELIVERIES.map((d) => (
              <Chip
                key={d.key}
                active={deliveryType === d.key}
                label={`${d.icon} ${locale === 'es' ? d.es : d.en}`}
                onPress={() => setDeliveryType(d.key)}
                theme={theme}
              />
            ))}
          </View>
        </Section>

        {/* Método de pago */}
        <Section title={t.checkout.paymentMethod} theme={theme}>
          {availableMethods.map((m) => {
            const active = method === m.method;
            return (
              <Pressable
                key={m.method}
                onPress={() => setMethod(m.method)}
                style={[
                  styles.payRow,
                  {
                    borderColor: active ? theme.colors.primary : theme.colors.border,
                    backgroundColor: active ? theme.colors.primary + '12' : theme.colors.surface,
                  },
                ]}
              >
                <View style={[styles.radio, { borderColor: active ? theme.colors.primary : theme.colors.border }]}>
                  {active ? <View style={[styles.radioDot, { backgroundColor: theme.colors.primary }]} /> : null}
                </View>
                <Text style={{ color: theme.colors.text, fontFamily: typography.bodyMedium, fontSize: fontSize.md }}>
                  {locale === 'es' ? m.labelEs : m.labelEn}
                </Text>
              </Pressable>
            );
          })}
        </Section>

        {/* Resumen */}
        <Card theme={theme} style={{ marginTop: spacing.md }}>
          <SummaryRow label={t.common.subtotal} value={formatUsd(totals.subtotalUsd, locale)} theme={theme} />
          {totals.loyaltyDiscountUsd > 0 ? (
            <SummaryRow
              label={locale === 'es' ? '🏆 Descuento nivel' : '🏆 Tier discount'}
              value={`- ${formatUsd(totals.loyaltyDiscountUsd, locale)}`}
              theme={theme}
            />
          ) : null}
          <SummaryRow label={t.common.fee} value={formatUsd(totals.buyerFeeUsd, locale)} theme={theme} />
          <SummaryRow
            label={t.common.delivery}
            value={totals.deliveryUsd === 0 ? t.common.free : formatUsd(totals.deliveryUsd, locale)}
            theme={theme}
          />
          <SummaryRow label={t.common.tax} value={formatUsd(totals.taxUsd, locale)} theme={theme} />
          <SummaryRow label={t.common.total} value={formatUsd(totals.totalUsd, locale)} theme={theme} bold />
        </Card>
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
        <Button
          label={`${t.checkout.placeOrder} · ${formatUsd(totals.totalUsd, locale)}`}
          theme={theme}
          loading={loading}
          disabled={items.length === 0}
          onPress={placeOrder}
        />
      </View>
    </View>
  );
}

function Section({ title, theme, children }: { title: string; theme: any; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{title}</Text>
      {children}
    </View>
  );
}

function Chip({ active, label, onPress, theme }: { active: boolean; label: string; onPress: () => void; theme: any }) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: active ? theme.colors.primary : theme.colors.surface, borderColor: theme.colors.border },
      ]}
    >
      <Text style={{ color: active ? '#fff' : theme.colors.text, fontFamily: typography.bodyMedium, fontSize: fontSize.sm }}>
        {label}
      </Text>
    </Pressable>
  );
}

function SummaryRow({ label, value, theme, bold }: { label: string; value: string; theme: any; bold?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={{ color: bold ? theme.colors.text : theme.colors.textMuted, fontFamily: bold ? typography.title : typography.body, fontSize: bold ? fontSize.lg : fontSize.sm }}>
        {label}
      </Text>
      <Text style={{ color: bold ? theme.colors.primary : theme.colors.text, fontFamily: bold ? typography.title : typography.bodyMedium, fontSize: bold ? fontSize.lg : fontSize.sm }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontFamily: typography.title, fontSize: fontSize.md, marginBottom: spacing.sm },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1 },
  note: { fontFamily: typography.body, fontSize: fontSize.xs, marginTop: spacing.sm },
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.lg, borderTopWidth: 1 },
});
