import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useApp } from '../../src/providers/AppProvider';

/** Ship Provisioning — requiere sesión (naviera / agente marítimo). */
export default function ProvisioningLayout() {
  const { theme, user, locale } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!user) router.replace('/auth');
  }, [user]);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.secondary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontFamily: 'Poppins_700Bold' },
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: locale === 'es' ? '⚓ Ship Provisioning' : '⚓ Ship Provisioning' }} />
      <Stack.Screen name="new-request" options={{ title: locale === 'es' ? 'Nueva solicitud' : 'New request' }} />
      <Stack.Screen name="manifest" options={{ title: locale === 'es' ? 'Manifiesto digital' : 'Digital manifest' }} />
    </Stack>
  );
}
