import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_900Black,
} from '@expo-google-fonts/poppins';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { ActivityIndicator, View } from 'react-native';
import Constants from 'expo-constants';
import { StripeProvider } from '@stripe/stripe-react-native';
import { AppProvider, useApp } from '../src/providers/AppProvider';

function RootStack() {
  const { theme } = useApp();
  return (
    <>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.text,
          headerTitleStyle: { fontFamily: 'Poppins_700Bold' },
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="product/[id]" options={{ title: '' }} />
        <Stack.Screen name="checkout" options={{ presentation: 'modal', title: 'Checkout' }} />
        <Stack.Screen name="auth" options={{ presentation: 'modal', title: '' }} />
        <Stack.Screen name="track" options={{ title: '' }} />
        <Stack.Screen name="(supplier)" options={{ headerShown: false }} />
        <Stack.Screen name="(admin)" options={{ headerShown: false }} />
        <Stack.Screen name="(provisioning)" options={{ headerShown: false }} />
        <Stack.Screen name="(driver)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_900Black,
    Inter_400Regular,
    Inter_600SemiBold,
  });

  if (!loaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#333D1C' }}>
        <ActivityIndicator color="#F2C707" size="large" />
      </View>
    );
  }

  const stripeKey =
    (Constants.expoConfig?.extra?.stripePublishableKey as string | undefined) ?? '';
  const merchantId =
    (Constants.expoConfig?.extra?.stripeMerchantId as string | undefined) ?? 'merchant.pa.frutigo.app';

  // Solo inicializa Stripe si hay una llave publicable REAL. Con un placeholder
  // ("pk_test_xxx") el SDK nativo puede fallar al arrancar y cerrar la app.
  const hasStripe = /^pk_(test|live)_[A-Za-z0-9]{16,}$/.test(stripeKey);

  const content = (
    <AppProvider>
      <RootStack />
    </AppProvider>
  );

  return (
    <SafeAreaProvider>
      {hasStripe ? (
        <StripeProvider publishableKey={stripeKey} merchantIdentifier={merchantId}>
          {content}
        </StripeProvider>
      ) : (
        content
      )}
    </SafeAreaProvider>
  );
}
