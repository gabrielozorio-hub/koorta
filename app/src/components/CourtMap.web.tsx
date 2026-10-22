// Versão web (navegador): mapa ilustrado, já que react-native-maps só roda em iOS/Android.
import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Icon } from '@/components/ui';
import { colors, esquemaAtual } from '@/theme';
import type { CourtMapHandle, CourtMapProps } from './CourtMap';

export type { CourtMapHandle, CourtMapProps } from './CourtMap';

const RUAS = [
  { top: '22%', left: 0, width: '100%', height: 10, rot: '-8deg' },
  { top: '58%', left: 0, width: '100%', height: 14, rot: '4deg' },
  { top: 0, left: '30%', width: 10, height: '100%', rot: '6deg' },
  { top: 0, left: '72%', width: 12, height: '100%', rot: '-5deg' },
  { top: '80%', left: 0, width: '100%', height: 8, rot: '-2deg' },
] as const;

export const CourtMap = forwardRef<CourtMapHandle, CourtMapProps>(function CourtMap(
  { quadras, esportes, centro, usuario, selecionada, onSelect, zoomKm = 4, style },
  ref,
) {
  const [tam, setTam] = useState({ w: 0, h: 0 });
  useImperativeHandle(ref, () => ({ centralizar: () => {} }));

  const deg = zoomKm / 111;
  const proj = (lat: number, lon: number) => ({
    x: ((lon - centro.longitude) / deg + 0.5) * tam.w,
    y: ((centro.latitude - lat) / deg + 0.5) * tam.h,
  });

  return (
    <View
      style={[{ flex: 1, backgroundColor: esquemaAtual === 'dark' ? '#121212' : '#F4F4F2', overflow: 'hidden' }, style]}
      onLayout={(e) => setTam({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      <View style={{ position: 'absolute', top: '8%', left: '45%', width: 160, height: 120, borderRadius: 60, backgroundColor: esquemaAtual === 'dark' ? '#1A2417' : '#DFE8DA' }} />
      <View style={{ position: 'absolute', top: '62%', left: '6%', width: 120, height: 90, borderRadius: 50, backgroundColor: esquemaAtual === 'dark' ? '#1A2417' : '#DFE8DA' }} />
      <View style={{ position: 'absolute', top: '35%', left: '78%', width: 90, height: 160, borderRadius: 45, backgroundColor: esquemaAtual === 'dark' ? '#050505' : '#E2E2E2' }} />
      {RUAS.map((r, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            top: r.top,
            left: r.left,
            width: r.width,
            height: r.height,
            backgroundColor: esquemaAtual === 'dark' ? '#262628' : '#FFFFFF',
            transform: [{ rotate: r.rot }],
          }}
        />
      ))}
      {tam.w > 0 && usuario && (
        <View
          style={{
            position: 'absolute',
            left: proj(usuario.latitude, usuario.longitude).x - 9,
            top: proj(usuario.latitude, usuario.longitude).y - 9,
            width: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: '#0A84FF',
            borderWidth: 3,
            borderColor: colors.white,
          }}
        />
      )}
      {tam.w > 0 &&
        quadras.map((q) => {
          const p = proj(q.latitude, q.longitude);
          const ativo = selecionada === q.id;
          const esp = esportes.find((e) => e.id === q.esportes[0]);
          const s = ativo ? 42 : 34;
          return (
            <Pressable
              key={q.id}
              onPress={() => onSelect?.(q.id)}
              style={{
                position: 'absolute',
                left: p.x - s / 2,
                top: p.y - s / 2,
                width: s,
                height: s,
                borderRadius: s / 2,
                backgroundColor: ativo ? colors.inverse : colors.brand,
                borderWidth: 2.5,
                borderColor: colors.white,
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: ativo ? 2 : 1,
              }}
            >
              <Icon name={esp?.icone ?? 'map-marker'} size={ativo ? 20 : 16} color={ativo ? colors.onInverse : colors.white} />
            </Pressable>
          );
        })}
    </View>
  );
});
