import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useApp } from '../../src/providers/AppProvider';

/** Panel de administración — solo accesible para usuarios con rol ADMIN. */
export default function AdminLayout() {
  const { theme, user, locale } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      router.replace('/(tabs)/profile');
    }
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
      <Stack.Screen name="index" options={{ title: locale === 'es' ? 'Admin · FRUTI GO' : 'Admin · FRUTI GO' }} />
      <Stack.Screen name="suppliers" options={{ title: locale === 'es' ? 'Proveedores' : 'Suppliers' }} />
      <Stack.Screen name="payments" options={{ title: locale === 'es' ? 'Conciliación de pagos' : 'Payment reconciliation' }} />
    </Stack>
  );
}
