// app/_layout.tsx
import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from '../context/auth-context';
import { ThemeProvider, useAppTheme } from '../context/theme-context';
import { StatusBar } from 'expo-status-bar';

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const { theme } = useAppTheme();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const segmentList = segments as any[];
    const inTabsGroup = segmentList[0] === '(tabs)';
    const isLogin = segmentList[0] === 'login';

    if (!user && !isLogin && segmentList.length > 0) {
      // Redirect to login if not logged in
      router.replace('/login' as any);
    } else if (user && (isLogin || segmentList.length === 0)) {
      // Redirect to dashboard if logged in
      router.replace('/(tabs)' as any);
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <RootLayoutNav />
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
