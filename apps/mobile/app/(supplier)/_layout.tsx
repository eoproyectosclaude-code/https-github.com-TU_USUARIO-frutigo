import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useApp } from '../../src/providers/AppProvider';

/** Portal de proveedor — solo accesible para usuarios con rol PROVEEDOR. */
export default function SupplierLayout() {
  const { theme, user, locale } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!user || user.role !== 'PROVEEDOR') {
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
      <Stack.Screen
        name="index"
        options={{ title: locale === 'es' ? 'Portal Proveedor' : 'Supplier Portal' }}
      />
      <Stack.Screen
        name="products"
        options={{ title: locale === 'es' ? 'Mis productos' : 'My products' }}
      />
      <Stack.Screen
        name="product-edit"
        options={{ title: locale === 'es' ? 'Editar producto' : 'Edit product' }}
      />
      <Stack.Screen
        name="orders"
        options={{ title: locale === 'es' ? 'Pedidos recibidos' : 'Incoming orders' }}
      />
      <Stack.Screen
        name="forecast"
        options={{ title: locale === 'es' ? 'Predicción de demanda' : 'Demand forecast' }}
      />
    </Stack>
  );
}
