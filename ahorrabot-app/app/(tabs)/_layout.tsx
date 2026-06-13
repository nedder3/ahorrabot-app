import { Tabs } from 'expo-router';
import React from 'react';
import { useAppTheme } from '../../context/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();

  // Dynamically calculate tab bar dimensions to safely clear system navigation buttons
  const tabHeight = Platform.OS === 'ios'
    ? (insets.bottom > 0 ? 88 : 64)
    : (insets.bottom > 0 ? 64 + insets.bottom : 68);

  const paddingBottom = Platform.OS === 'ios'
    ? (insets.bottom > 0 ? insets.bottom : 10)
    : (insets.bottom > 0 ? insets.bottom + 4 : 12);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: tabHeight,
          paddingBottom: paddingBottom,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={24} name={focused ? 'home' : 'home-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'AhorraBot',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={24} name={focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={24} name={focused ? 'map' : 'map-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Mis Pedidos',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={24} name={focused ? 'receipt' : 'receipt-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons size={24} name={focused ? 'person' : 'person-outline'} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
