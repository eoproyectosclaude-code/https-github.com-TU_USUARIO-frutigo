import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { darkTheme, lightTheme, type Theme } from '@frutigo/ui';
import { translations, type Locale, type TranslationTree } from '@frutigo/shared';
import { api, onTokensChanged, setTokens, type AuthResponse } from '../services/api';
import { registerForPush } from '../services/push';

export type AuthUser = AuthResponse['user'];

const ACCESS_KEY = 'frutigo.access';
const REFRESH_KEY = 'frutigo.refresh';
const USER_KEY = 'frutigo.user';

interface AppContextValue {
  theme: Theme;
  locale: Locale;
  t: TranslationTree;
  ready: boolean;
  setLocale: (l: Locale) => void;
  toggleLocale: () => void;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { email: string; password: string; name: string; segment?: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const [locale, setLocale] = useState<Locale>('es');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  // Restaura la sesión cifrada al arrancar y conecta la persistencia de tokens renovados.
  useEffect(() => {
    onTokensChanged(async (access, refresh) => {
      if (access && refresh) {
        await SecureStore.setItemAsync(ACCESS_KEY, access);
        await SecureStore.setItemAsync(REFRESH_KEY, refresh);
      } else {
        await SecureStore.deleteItemAsync(ACCESS_KEY);
        await SecureStore.deleteItemAsync(REFRESH_KEY);
        await SecureStore.deleteItemAsync(USER_KEY);
        setUser(null);
      }
    });

    (async () => {
      try {
        const [access, refresh, savedUser] = await Promise.all([
          SecureStore.getItemAsync(ACCESS_KEY),
          SecureStore.getItemAsync(REFRESH_KEY),
          SecureStore.getItemAsync(USER_KEY),
        ]);
        if (access && refresh) {
          setTokens(access, refresh);
          if (savedUser) setUser(JSON.parse(savedUser));
        }
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const value = useMemo<AppContextValue>(() => {
    const theme = scheme === 'dark' ? darkTheme : lightTheme;

    const persist = async (res: AuthResponse) => {
      setTokens(res.accessToken, res.refreshToken);
      await SecureStore.setItemAsync(ACCESS_KEY, res.accessToken);
      await SecureStore.setItemAsync(REFRESH_KEY, res.refreshToken);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(res.user));
      setUser(res.user);
      // Registro de notificaciones push tras autenticarse (no bloqueante).
      void registerForPush();
    };

    return {
      theme,
      locale,
      t: translations[locale],
      ready,
      setLocale,
      toggleLocale: () => setLocale((prev) => (prev === 'es' ? 'en' : 'es')),
      user,
      login: async (email, password) => persist(await api.login({ email, password })),
      register: async (input) => persist(await api.register(input)),
      logout: async () => {
        setTokens(null, null);
        await Promise.all([
          SecureStore.deleteItemAsync(ACCESS_KEY),
          SecureStore.deleteItemAsync(REFRESH_KEY),
          SecureStore.deleteItemAsync(USER_KEY),
        ]);
        setUser(null);
      },
    };
  }, [scheme, locale, user, ready]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp debe usarse dentro de <AppProvider>');
  return ctx;
}
