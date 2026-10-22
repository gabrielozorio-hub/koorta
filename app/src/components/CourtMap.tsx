import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import MapView, { Circle, Marker, PROVIDER_DEFAULT } from 'react-native-maps';

import { Icon } from '@/components/ui';
import type { Esporte, Quadra } from '@/data/types';
import { colors, esquemaAtual } from '@/theme';

export type CourtMapProps = {
  quadras: Quadra[];
  esportes: Esporte[];
  centro: { latitude: number; longitude: number };
  usuario?: { latitude: number; longitude: number } | null;
  selecionada?: string | null;
  onSelect?: (id: string) => void;
  interativo?: boolean;
  zoomKm?: number;
  raioKm?: number;
  style?: StyleProp<ViewStyle>;
};

export type CourtMapHandle = { centralizar: (c: { latitude: number; longitude: number }) => void };

// Estilos minimalistas do Google Maps (Android); no iOS o Apple Maps segue o tema
const ESTILO_CLARO = [
  { elementType: 'geometry', stylers: [{ color: '#f4f4f2' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8e' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#dfe8da' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#dcdcdc' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];
const ESTILO_ESCURO = [
  { elementType: 'geometry', stylers: [{ color: '#121212' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#77777b' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#121212' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1a2417' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#262628' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#050505' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

function Pino({ icone, ativo }: { icone: string; ativo: boolean }) {
  const s = ativo ? 42 : 34;
  return (
    <View
      style={{
        width: s,
        height: s,
        borderRadius: s / 2,
        backgroundColor: ativo ? colors.inverse : colors.brand,
        borderWidth: 2.5,
        borderColor: colors.white,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={icone} size={ativo ? 20 : 16} color={ativo ? colors.onInverse : colors.white} />
    </View>
  );
}

export const CourtMap = forwardRef<CourtMapHandle, CourtMapProps>(function CourtMap(
  { quadras, esportes, centro, usuario, selecionada, onSelect, interativo = true, zoomKm = 4, raioKm, style },
  ref,
) {
  const mapa = useRef<MapView>(null);
  // Marcadores customizados precisam renderizar uma vez antes de congelar (Android)
  const chave = `${selecionada}-${quadras.length}-${esquemaAtual}`;
  const [congelado, setCongelado] = useState<string | null>(null);
  const rastrear = congelado !== chave;
  useEffect(() => {
    const t = setTimeout(() => setCongelado(chave), 800);
    return () => clearTimeout(t);
  }, [chave]);

  useImperativeHandle(ref, () => ({
    centralizar: (c) => mapa.current?.animateToRegion({ ...c, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 450),
  }));

  const delta = zoomKm / 111;
  return (
    <MapView
      ref={mapa}
      provider={PROVIDER_DEFAULT}
      style={[{ flex: 1 }, style]}
      initialRegion={{ ...centro, latitudeDelta: delta, longitudeDelta: delta }}
      customMapStyle={esquemaAtual === 'dark' ? ESTILO_ESCURO : ESTILO_CLARO}
      userInterfaceStyle={esquemaAtual}
      showsUserLocation={!!usuario}
      showsMyLocationButton={false}
      showsCompass={false}
      toolbarEnabled={false}
      scrollEnabled={interativo}
      zoomEnabled={interativo}
      rotateEnabled={false}
      pitchEnabled={false}
      onPress={interativo ? undefined : () => onSelect?.('')}
    >
      {raioKm && usuario && (
        <Circle center={usuario} radius={raioKm * 1000} strokeColor="rgba(104,133,91,0.6)" fillColor="rgba(104,133,91,0.08)" />
      )}
      {quadras.map((q) => {
        const esp = esportes.find((e) => e.id === q.esportes[0]);
        return (
          <Marker
            key={q.id}
            coordinate={{ latitude: q.latitude, longitude: q.longitude }}
            onPress={() => onSelect?.(q.id)}
            tracksViewChanges={rastrear}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <Pino icone={esp?.icone ?? 'map-marker'} ativo={selecionada === q.id} />
          </Marker>
        );
      })}
    </MapView>
  );
});
