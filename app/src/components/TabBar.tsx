import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import React, { useEffect, useState } from 'react';
import { Animated, Easing, Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui';
import { useApp } from '@/store/AppStore';
import { colors } from '@/theme';

// Ordem visual da barra (Início no centro, como no protótipo)
const ITENS: { name: string; label: string; icon: string; iconActive: string }[] = [
  { name: 'mapa', label: 'Quadras', icon: 'map-outline', iconActive: 'map-outline' },
  { name: 'koortas', label: "Koorta's", icon: 'play-circle-outline', iconActive: 'play' },
  { name: 'index', label: 'Início', icon: 'home-variant-outline', iconActive: 'home-variant' },
  { name: 'sessoes', label: 'Sessões', icon: 'account-group-outline', iconActive: 'account-group' },
  { name: 'perfil', label: 'Perfil', icon: 'account-outline', iconActive: 'account' },
];

const BUBBLE = 50;

export function TabBar({ state, navigation }: BottomTabBarProps) {
  useApp(); // re-renderiza ao trocar o tema
  const insets = useSafeAreaInsets();
  const [largura, setLargura] = useState(0);
  const ativoNome = state.routes[state.index]?.name;
  const ativoIdx = Math.max(0, ITENS.findIndex((i) => i.name === ativoNome));
  const slot = largura / ITENS.length;
  const sobreVideo = ativoNome === 'koortas';

  const [x] = useState(() => new Animated.Value(0));
  const [pop] = useState(() => new Animated.Value(1));
  const [iniciado, setIniciado] = useState(false);

  useEffect(() => {
    if (!slot) return;
    const destino = slot * ativoIdx + slot / 2 - BUBBLE / 2;
    if (!iniciado) {
      x.setValue(destino);
      setTimeout(() => setIniciado(true), 0);
      return;
    }
    pop.setValue(0.7);
    Animated.parallel([
      Animated.spring(x, { toValue: destino, useNativeDriver: true, damping: 18, stiffness: 200, mass: 0.9 }),
      Animated.timing(pop, { toValue: 1, duration: 320, easing: Easing.out(Easing.back(2)), useNativeDriver: true }),
    ]).start();
  }, [ativoIdx, slot, x, pop, iniciado]);

  const ativo = ITENS[ativoIdx];
  // Sobre os vídeos a barra fica sempre escura
  const fundo = sobreVideo ? 'rgba(18,18,18,0.94)' : colors.elevated;
  const inativo = sobreVideo ? 'rgba(255,255,255,0.6)' : colors.muted;

  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: Math.max(insets.bottom - 6, 10), paddingHorizontal: 20 }}>
      <View
        onLayout={(e) => setLargura(e.nativeEvent.layout.width)}
        style={{
          height: 64,
          borderRadius: 32,
          backgroundColor: fundo,
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 0.5,
          borderColor: sobreVideo ? 'rgba(255,255,255,0.12)' : colors.line,
          ...Platform.select({
            web: { boxShadow: '0 6px 24px rgba(0,0,0,0.10)' },
            default: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 18, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
          }),
        }}
      >
        {slot > 0 && (
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: -BUBBLE / 2 + 4,
              left: 0,
              width: BUBBLE,
              height: BUBBLE,
              borderRadius: BUBBLE / 2,
              backgroundColor: colors.brand,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 4,
              borderColor: sobreVideo ? '#000' : colors.bg,
              transform: [{ translateX: x }, { scale: pop }],
              zIndex: 2,
            }}
          >
            <Icon name={ativo.iconActive} size={22} color={colors.onBrand} />
          </Animated.View>
        )}

        {ITENS.map((item, i) => {
          const route = state.routes.find((r) => r.name === item.name);
          const focado = i === ativoIdx;
          return (
            <Pressable
              key={item.name}
              accessibilityRole="tab"
              accessibilityState={{ selected: focado }}
              accessibilityLabel={item.label}
              onPress={() => {
                if (!route) return;
                const ev = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (focado || ev.defaultPrevented) return;
                if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
                navigation.navigate(route.name);
              }}
              style={{ flex: 1, height: '100%', alignItems: 'center', justifyContent: 'center' }}
            >
              <View style={{ height: 24, justifyContent: 'center', opacity: focado ? 0 : 1 }}>
                <Icon name={item.icon} size={23} color={inativo} />
              </View>
              <Text style={{ fontSize: 10, marginTop: 3, fontWeight: focado ? '700' : '500', color: focado ? (sobreVideo ? '#fff' : colors.ink) : inativo }}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
