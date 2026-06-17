import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useApp } from '../../src/providers/AppProvider';

/** App del repartidor — solo rol REPARTIDOR. */
export default function DriverLayout() {
  const { theme, user, locale } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!user || user.role !== 'REPARTIDOR') router.replace('/(tabs)/profile');
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
      <Stack.Screen name="index" options={{ title: locale === 'es' ? '🛵 Mis entregas' : '🛵 My deliveries' }} />
      <Stack.Screen name="delivery" options={{ title: locale === 'es' ? 'Entrega' : 'Delivery' }} />
    </Stack>
  );
}
