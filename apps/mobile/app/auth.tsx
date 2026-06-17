import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, fontSize, radius, spacing, typography } from '@frutigo/ui';
import { useApp } from '../src/providers/AppProvider';

export default function AuthScreen() {
  const { theme, locale, login, register } = useApp();
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const isLogin = mode === 'login';

  async function submit() {
    setLoading(true);
    try {
      if (isLogin) await login(email, password);
      else await register({ email, password, name });
      router.back();
    } catch (e) {
      Alert.alert(
        locale === 'es' ? 'No se pudo continuar' : 'Could not continue',
        (e as Error).message,
      );
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = [
    styles.input,
    { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.border },
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={[styles.brand, { color: theme.colors.text }]}>
          FRUTI<Text style={{ color: theme.colors.primary }}>GO</Text>
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          {isLogin
            ? locale === 'es'
              ? 'Inicia sesión para continuar'
              : 'Sign in to continue'
            : locale === 'es'
              ? 'Crea tu cuenta'
              : 'Create your account'}
        </Text>

        {!isLogin ? (
          <TextInput
            placeholder={locale === 'es' ? 'Nombre' : 'Name'}
            placeholderTextColor={theme.colors.textMuted}
            value={name}
            onChangeText={setName}
            style={inputStyle}
          />
        ) : null}

        <TextInput
          placeholder={locale === 'es' ? 'Correo' : 'Email'}
          placeholderTextColor={theme.colors.textMuted}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={inputStyle}
        />
        <TextInput
          placeholder={locale === 'es' ? 'Contraseña' : 'Password'}
          placeholderTextColor={theme.colors.textMuted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={inputStyle}
        />

        <Button
          label={isLogin ? (locale === 'es' ? 'Entrar' : 'Sign in') : locale === 'es' ? 'Registrarme' : 'Sign up'}
          theme={theme}
          loading={loading}
          onPress={submit}
          style={{ marginTop: spacing.md }}
        />
        <Button
          label={
            isLogin
              ? locale === 'es'
                ? '¿No tienes cuenta? Regístrate'
                : "Don't have an account? Sign up"
              : locale === 'es'
                ? '¿Ya tienes cuenta? Inicia sesión'
                : 'Already have an account? Sign in'
          }
          theme={theme}
          variant="ghost"
          onPress={() => setMode(isLogin ? 'register' : 'login')}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl, justifyContent: 'center', flexGrow: 1, gap: spacing.sm },
  brand: { fontFamily: typography.display, fontSize: fontSize.display, textAlign: 'center' },
  subtitle: { fontFamily: typography.body, fontSize: fontSize.md, textAlign: 'center', marginBottom: spacing.lg },
  input: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    fontFamily: typography.body,
    fontSize: fontSize.md,
  },
});
