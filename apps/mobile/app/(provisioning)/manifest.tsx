import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { PORTS, UNIT_DEFINITIONS, type SaleUnit } from '@frutigo/shared';
import { Badge, Button, Card, fontSize, spacing, typography } from '@frutigo/ui';
import { useApp } from '../../src/providers/AppProvider';
import { api, type Manifest } from '../../src/services/api';
import { downloadAndShareManifest } from '../../src/services/pdf';

export default function ManifestScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme, locale } = useApp();
  const [data, setData] = useState<Manifest | null>(null);
  const [downloading, setDownloading] = useState(false);

  async function exportPdf() {
    if (!id || !data) return;
    setDownloading(true);
    try {
      await downloadAndShareManifest(id, data.manifestRef);
    } catch (e) {
      Alert.alert('PDF', (e as Error).message);
    } finally {
      setDownloading(false);
    }
  }

  async function sendEmail(to: string) {
    if (!id || !to) return;
    try {
      const r = await api.emailManifest(id, to);
      Alert.alert(
        locale === 'es' ? 'Manifiesto enviado' : 'Manifest sent',
        r.sent ? `${locale === 'es' ? 'Enviado a' : 'Sent to'} ${r.to}` : 'Correo no configurado (modo dev).',
      );
    } catch (e) {
      Alert.alert('Email', (e as Error).message);
    }
  }

  function promptEmail() {
    if (Platform.OS === 'ios') {
      Alert.prompt?.(
        locale === 'es' ? 'Enviar manifiesto' : 'Send manifest',
        locale === 'es' ? 'Correo de la naviera/agente' : 'Carrier/agent email',
        (text) => text && sendEmail(text.trim()),
      );
    } else {
      // Android no tiene Alert.prompt; usa el agente del buque si está, o pide en consola.
      Alert.alert(
        locale === 'es' ? 'Enviar manifiesto' : 'Send manifest',
        locale === 'es'
          ? 'Escribe el correo en el campo del agente y vuelve a intentar (o usa Descargar/Compartir).'
          : 'Use Download/Share, or send from a device with email prompt.',
      );
    }
  }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.provisioning.manifest(id).then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }
  if (!data) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.text }}>{locale === 'es' ? 'Manifiesto no disponible' : 'Manifest unavailable'}</Text>
      </View>
    );
  }

  const portName = PORTS.find((p) => p.id === data.port)?.name ?? data.port;
  const fmt = (iso: string) => new Date(iso).toLocaleString(locale === 'es' ? 'es-PA' : 'en-US');

  return (
    <ScrollView style={{ backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
      <Card theme={theme}>
        <View style={styles.head}>
          <Text style={[styles.brand, { color: theme.colors.text }]}>
            FRUTI<Text style={{ color: theme.colors.primary }}>GO</Text>
          </Text>
          <Badge label={locale === 'es' ? 'MANIFIESTO DIGITAL' : 'DIGITAL MANIFEST'} color={theme.colors.secondary} />
        </View>
        <Text style={[styles.ref, { color: theme.colors.primary }]}>{data.manifestRef}</Text>
        <Text style={{ color: theme.colors.textMuted, fontFamily: typography.body, fontSize: fontSize.xs }}>
          {locale === 'es' ? 'Pedido' : 'Order'} {data.reference} · {fmt(data.issuedAt)}
        </Text>
      </Card>

      <Card theme={theme}>
        <Row k={locale === 'es' ? 'Buque' : 'Vessel'} v={`${data.vessel.name} (IMO ${data.vessel.imo})`} theme={theme} />
        <Row k={locale === 'es' ? 'Bandera' : 'Flag'} v={data.vessel.flag} theme={theme} />
        <Row k={locale === 'es' ? 'Agente' : 'Agent'} v={data.vessel.agent} theme={theme} />
        <Row k={locale === 'es' ? 'Puerto' : 'Port'} v={portName} theme={theme} />
        <Row k={locale === 'es' ? 'Entrega' : 'Delivery'} v={`${fmt(data.deliveryWindow.start)} → ${fmt(data.deliveryWindow.end)}`} theme={theme} />
      </Card>

      <Text style={[styles.section, { color: theme.colors.text }]}>
        {locale === 'es' ? 'Artículos' : 'Items'} ({data.totalItems})
      </Text>
      {data.items.map((it, i) => (
        <Card key={i} theme={theme}>
          <View style={styles.itemRow}>
            <Text style={{ color: theme.colors.text, fontFamily: typography.bodyMedium, flex: 1 }}>{it.product}</Text>
            <Text style={{ color: theme.colors.textMuted, fontFamily: typography.body, fontSize: fontSize.sm }}>
              {it.quantity} × {UNIT_DEFINITIONS[it.unit as SaleUnit]?.[locale === 'es' ? 'labelEs' : 'labelEn'] ?? it.unit}
            </Text>
          </View>
        </Card>
      ))}

      <Card theme={theme} style={{ backgroundColor: theme.colors.surfaceAlt }}>
        <Text style={{ color: theme.colors.success, fontFamily: typography.bodyMedium, fontSize: fontSize.sm }}>
          ✓ {locale === 'es' ? 'Exento de ITBMS' : 'ITBMS-exempt'}
        </Text>
        <Text style={{ color: theme.colors.textMuted, fontFamily: typography.body, fontSize: fontSize.xs, marginTop: 2 }}>
          {data.legalBasis}
        </Text>
      </Card>

      <Button
        label={downloading ? (locale === 'es' ? 'Generando…' : 'Generating…') : locale === 'es' ? '📄 Descargar / Compartir PDF' : '📄 Download / Share PDF'}
        theme={theme}
        loading={downloading}
        onPress={exportPdf}
        style={{ marginTop: spacing.md }}
      />
      <Button
        label={locale === 'es' ? '✉️ Enviar a la naviera por correo' : '✉️ Email to carrier'}
        theme={theme}
        variant="outline"
        onPress={promptEmail}
        style={{ marginTop: spacing.sm }}
      />
    </ScrollView>
  );
}

function Row({ k, v, theme }: { k: string; v: string; theme: any }) {
  return (
    <View style={styles.kv}>
      <Text style={{ color: theme.colors.textMuted, fontFamily: typography.body, fontSize: fontSize.sm }}>{k}</Text>
      <Text style={{ color: theme.colors.text, fontFamily: typography.bodyMedium, fontSize: fontSize.sm, flex: 1, textAlign: 'right' }}>{v}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { fontFamily: typography.display, fontSize: fontSize.xl },
  ref: { fontFamily: typography.title, fontSize: fontSize.lg, marginTop: spacing.sm },
  section: { fontFamily: typography.title, fontSize: fontSize.md, marginTop: spacing.sm },
  kv: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 3 },
  itemRow: { flexDirection: 'row', alignItems: 'center' },
});
