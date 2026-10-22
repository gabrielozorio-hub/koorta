import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';

import { Icon } from '@/components/ui';
import { quadraDe } from '@/lib/selectors';
import { duracao } from '@/lib/util';
import { FATOR_TEMPO_DEMO, PONTOS_POR_MINUTO, useDB } from '@/store/AppStore';
import { colors, radius } from '@/theme';

// Faixa exibida enquanto há um check-in ativo
export function CheckinBanner() {
  const { db, checkinAtivo, agoraTick, minutosValidos } = useDB();
  const [pulso] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulso, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulso]);

  if (!checkinAtivo) return null;
  const q = quadraDe(db, checkinAtivo.quadraId);
  const decorrido = (agoraTick - new Date(checkinAtivo.dataHora).getTime()) * (db.modoDemo ? FATOR_TEMPO_DEMO : 1);
  const pontos = minutosValidos(checkinAtivo, agoraTick) * PONTOS_POR_MINUTO;

  return (
    <Pressable onPress={() => router.push('/checkin')} style={({ pressed }) => ({ marginTop: 16, opacity: pressed ? 0.8 : 1 })}>
      <View style={{ backgroundColor: colors.inverse, borderRadius: radius.lg, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Animated.View style={{ opacity: pulso.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.brand }} />
        </Animated.View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '600', color: colors.onInverse, fontSize: 15 }} numberOfLines={1}>
            {q?.nome}
          </Text>
          <Text style={{ color: colors.onInverse, opacity: 0.6, fontSize: 13 }}>Check-in ativo</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: colors.onInverse, fontVariant: ['tabular-nums'], fontWeight: '600', fontSize: 17 }}>{duracao(decorrido)}</Text>
          <Text style={{ color: colors.brand, fontWeight: '700', fontSize: 13 }}>+{pontos} pts</Text>
        </View>
        <Icon name="chevron-right" size={18} color={colors.onInverse} />
      </View>
    </Pressable>
  );
}
