import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { PORTS, type Vessel, type ProvisioningRequest } from '@frutigo/shared';
import { Badge, Button, Card, fontSize, radius, spacing, typography } from '@frutigo/ui';
import { useApp } from '../../src/providers/AppProvider';
import { api } from '../../src/services/api';

export default function ProvisioningHome() {
  const { theme, locale } = useApp();
  const router = useRouter();
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [requests, setRequests] = useState<ProvisioningRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Form de registro de buque
  const [name, setName] = useState('');
  const [imo, setImo] = useState('');
  const [flag, setFlag] = useState('');
  const [agent, setAgent] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([api.provisioning.vessels(), api.provisioning.requests()])
      .then(([v, r]) => {
        setVessels(v);
        setRequests(r);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => load(), [load]));

  async function registerVessel() {
    if (!name || !imo) {
      Alert.alert(locale === 'es' ? 'Faltan datos' : 'Missing data', 'Nombre e IMO requeridos');
      return;
    }
    setSaving(true);
    try {
      await api.provisioning.createVessel({ name, imo, flag, agent });
      setName(''); setImo(''); setFlag(''); setAgent('');
      load();
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const input = [styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.border }];

  return (
    <ScrollView style={{ backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
      <Card theme={theme} style={{ backgroundColor: theme.colors.secondary }}>
        <Text style={styles.heroTitle}>⚓ {locale === 'es' ? 'Abastecimiento de buques' : 'Vessel provisioning'}</Text>
        <Text style={styles.heroDesc}>
          {locale === 'es'
            ? 'Entrega certificada en Balboa, Cristóbal y Colón · Exento de ITBMS (Ley 28/1995)'
            : 'Certified delivery in Balboa, Cristóbal & Colón · ITBMS-exempt (Law 28/1995)'}
        </Text>
      </Card>

      {/* Registrar buque */}
      <Text style={[styles.section, { color: theme.colors.text }]}>
        {locale === 'es' ? 'Registrar buque' : 'Register vessel'}
      </Text>
      <TextInput placeholder={locale === 'es' ? 'Nombre del buque' : 'Vessel name'} placeholderTextColor={theme.colors.textMuted} value={name} onChangeText={setName} style={input} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput placeholder="IMO" placeholderTextColor={theme.colors.textMuted} value={imo} onChangeText={setImo} style={[input, { flex: 1 }]} />
        <TextInput placeholder={locale === 'es' ? 'Bandera' : 'Flag'} placeholderTextColor={theme.colors.textMuted} value={flag} onChangeText={setFlag} style={[input, { flex: 1 }]} />
      </View>
      <TextInput placeholder={locale === 'es' ? 'Agente / naviera' : 'Agent / carrier'} placeholderTextColor={theme.colors.textMuted} value={agent} onChangeText={setAgent} style={input} />
      <Button label={locale === 'es' ? 'Registrar buque' : 'Register vessel'} theme={theme} variant="outline" loading={saving} onPress={registerVessel} />

      {/* Buques + nueva solicitud */}
      {loading ? (
        <ActivityIndicator color={theme.colors.primary} style={{ marginTop: spacing.lg }} />
      ) : (
        <>
          <Text style={[styles.section, { color: theme.colors.text }]}>
            {locale === 'es' ? 'Mis buques' : 'My vessels'} ({vessels.length})
          </Text>
          {vessels.map((v) => (
            <Card key={v.id} theme={theme}>
              <Text style={{ color: theme.colors.text, fontFamily: typography.subtitle, fontSize: fontSize.md }}>{v.name}</Text>
              <Text style={{ color: theme.colors.textMuted, fontFamily: typography.body, fontSize: fontSize.xs }}>
                IMO {v.imo} · {v.flag} · {v.agent}
              </Text>
            </Card>
          ))}

          <Button
            label={locale === 'es' ? '➕ Nueva solicitud de abastecimiento' : '➕ New provisioning request'}
            theme={theme}
            disabled={vessels.length === 0}
            onPress={() => router.push('/(provisioning)/new-request')}
            style={{ marginTop: spacing.sm }}
          />
          {vessels.length === 0 ? (
            <Text style={{ color: theme.colors.textMuted, fontFamily: typography.body, fontSize: fontSize.xs }}>
              {locale === 'es' ? 'Registra un buque para crear solicitudes.' : 'Register a vessel to create requests.'}
            </Text>
          ) : null}

          {/* Solicitudes */}
          <Text style={[styles.section, { color: theme.colors.text }]}>
            {locale === 'es' ? 'Solicitudes' : 'Requests'} ({requests.length})
          </Text>
          {requests.map((r) => {
            const portName = PORTS.find((p) => p.id === r.port)?.name ?? r.port;
            return (
              <Pressable key={r.id} onPress={() => router.push({ pathname: '/(provisioning)/manifest', params: { id: r.id } })}>
                <Card theme={theme}>
                  <View style={styles.reqRow}>
                    <Text style={{ color: theme.colors.text, fontFamily: typography.subtitle }}>{r.reference}</Text>
                    <Badge label={r.status} color={theme.colors.accent} textColor="#11203A" />
                  </View>
                  <Text style={{ color: theme.colors.textMuted, fontFamily: typography.body, fontSize: fontSize.xs, marginTop: 4 }}>
                    {portName} · {r.lines.length} {locale === 'es' ? 'ítems' : 'items'} · 📄 {r.manifestRef}
                  </Text>
                </Card>
              </Pressable>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  heroTitle: { color: '#fff', fontFamily: typography.title, fontSize: fontSize.lg },
  heroDesc: { color: '#E6F4EC', fontFamily: typography.body, fontSize: fontSize.sm, marginTop: 4 },
  section: { fontFamily: typography.title, fontSize: fontSize.md, marginTop: spacing.sm },
  input: { height: 48, borderRadius: radius.md, borderWidth: 1, paddingHorizontal: spacing.md, fontFamily: typography.body, fontSize: fontSize.md },
  reqRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
