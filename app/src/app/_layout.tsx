import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Logo } from '@/components/ui';
import { AppProvider, useApp } from '@/store/AppStore';
import { colors } from '@/theme';

function Navegacao() {
  const { pronto, usuario, esquema } = useApp();
  if (!pronto) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', gap: 24 }}>
        <Logo size={40} color={colors.black} />
        <ActivityIndicator color={colors.black} />
      </View>
    );
  }
  return (
    <>
      <StatusBar style={esquema === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'slide_from_right' }}>
        {/* Telas protegidas: desmontadas e redirecionadas ao login quando não há usuário */}
        <Stack.Protected guard={!!usuario}>
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen name="quadra/[id]" />
          <Stack.Screen name="sessao/[id]" />
          <Stack.Screen name="sessao/nova" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="atleta/[id]" />
          <Stack.Screen name="checkin" options={{ presentation: Platform.OS === 'web' ? 'card' : 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="recompensas" />
          <Stack.Screen name="carteira" />
          <Stack.Screen name="notificacoes" />
          <Stack.Screen name="configuracoes" />
        </Stack.Protected>
        <Stack.Protected guard={!usuario}>
          <Stack.Screen name="login" options={{ animation: 'fade' }} />
          <Stack.Screen name="cadastro" />
        </Stack.Protected>
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <Navegacao />
      </AppProvider>
    </SafeAreaProvider>
  );
}
