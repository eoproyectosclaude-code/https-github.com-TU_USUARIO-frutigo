import React from 'react';
import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { useApp } from '../../src/providers/AppProvider';
import { useCart } from '../../src/store/cart';

/** Iconos de tab simples basados en emoji para evitar dependencias extra en esta fase. */
function TabIcon({ icon, focused, color }: { icon: string; focused: boolean; color: string }) {
  return <Text style={{ fontSize: focused ? 24 : 20, color }}>{icon}</Text>;
}

export default function TabsLayout() {
  const { theme, t } = useApp();
  const count = useCart((s) => s.count());

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text,
        headerTitleStyle: { fontFamily: 'Poppins_700Bold' },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.tabs.home,
          tabBarIcon: (p) => <TabIcon icon="🏠" {...p} />,
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          title: t.tabs.catalog,
          tabBarIcon: (p) => <TabIcon icon="🥬" {...p} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: t.tabs.cart,
          tabBarIcon: (p) => (
            <View>
              <TabIcon icon="🛒" {...p} />
              {count > 0 ? (
                <View
                  style={{
                    position: 'absolute',
                    right: -10,
                    top: -4,
                    backgroundColor: theme.colors.primary,
                    borderRadius: 9,
                    minWidth: 18,
                    height: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 4,
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 10, fontFamily: 'Inter_600SemiBold' }}>
                    {count}
                  </Text>
                </View>
              ) : null}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: t.tabs.orders,
          tabBarIcon: (p) => <TabIcon icon="📦" {...p} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t.tabs.profile,
          tabBarIcon: (p) => <TabIcon icon="👤" {...p} />,
        }}
      />
    </Tabs>
  );
}
