import React, { useMemo, useRef, useState } from 'react';
import { FlatList, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CourtCard } from '@/components/cards';
import { CourtMap, type CourtMapHandle } from '@/components/CourtMap';
import { Chip, Icon, IconButton, Row } from '@/components/ui';
import { distanciaMetros, quadraAberta } from '@/lib/util';
import { useDB } from '@/store/AppStore';
import { colors, radius, spacing, TAB_BAR_SPACE, type } from '@/theme';

const sombra = Platform.select({
  web: { boxShadow: '0 4px 16px rgba(0,0,0,0.12)' },
  default: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
}) as object;

export default function Mapa() {
  const insets = useSafeAreaInsets();
  const { db, referencia, posicao, obterPosicao } = useDB();
  const mapa = useRef<CourtMapHandle>(null);
  const [busca, setBusca] = useState('');
  const [esporte, setEsporte] = useState<string | null>(null);
  const [soAbertas, setSoAbertas] = useState(false);
  const [modo, setModo] = useState<'mapa' | 'lista'>('mapa');
  const [sel, setSel] = useState<string | null>(null);

  const quadras = useMemo(
    () =>
      db.quadras
        .filter((q) => q.estaAtivo)
        .filter((q) => !esporte || q.esportes.includes(esporte))
        .filter((q) => !soAbertas || quadraAberta(q.horarioAbertura, q.horarioFechamento))
        .filter((q) => q.nome.toLowerCase().includes(busca.trim().toLowerCase()))
        .sort((a, b) => distanciaMetros(referencia, a) - distanciaMetros(referencia, b)),
    [db.quadras, esporte, soAbertas, busca, referencia],
  );
  const selecionada = quadras.find((q) => q.id === sel);

  const filtros = (sobreMapa: boolean) => (
    <View style={{ gap: 10 }}>
      <Row gap={10}>
        <View style={[{ flex: 1, height: 44, borderRadius: radius.md, backgroundColor: sobreMapa ? colors.elevated : colors.fill, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8 }, sobreMapa && sombra]}>
          <Icon name="magnify" size={18} color={colors.muted} />
          <TextInput value={busca} onChangeText={setBusca} placeholder="Buscar quadra" placeholderTextColor={colors.muted} selectionColor={colors.brand} style={{ flex: 1, fontSize: 17, color: colors.ink }} />
          {!!busca && <Icon name="close-circle" size={17} color={colors.muted} />}
        </View>
        <View style={sobreMapa ? sombra : undefined}>
          <IconButton icon={modo === 'mapa' ? 'format-list-bulleted' : 'map-outline'} size={44} bg={sobreMapa ? colors.elevated : colors.fill} onPress={() => setModo(modo === 'mapa' ? 'lista' : 'mapa')} />
        </View>
      </Row>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 20 }}>
        <Chip label="Abertas agora" selected={soAbertas} onPress={() => setSoAbertas(!soAbertas)} style={sobreMapa && !soAbertas ? { backgroundColor: colors.elevated } : undefined} />
        {db.esportes.map((e) => (
          <Chip
            key={e.id}
            label={e.nome}
            icon={e.icone}
            selected={esporte === e.id}
            onPress={() => setEsporte(esporte === e.id ? null : e.id)}
            style={sobreMapa && esporte !== e.id ? { backgroundColor: colors.elevated } : undefined}
          />
        ))}
      </ScrollView>
    </View>
  );

  if (modo === 'lista') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.sm, marginBottom: spacing.md }}>
          <Text style={[type.largeTitle, { marginBottom: spacing.md }]}>Quadras</Text>
          {filtros(false)}
        </View>
        <FlatList
          data={quadras}
          keyExtractor={(q) => q.id}
          contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: 22, paddingBottom: TAB_BAR_SPACE + insets.bottom }}
          renderItem={({ item }) => <CourtCard db={db} quadra={item} referencia={referencia} largura="auto" />}
          ListEmptyComponent={<Text style={{ textAlign: 'center', color: colors.muted, marginTop: 40 }}>Nenhuma quadra encontrada.</Text>}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <CourtMap ref={mapa} quadras={quadras} esportes={db.esportes} centro={referencia} usuario={posicao} selecionada={sel} onSelect={(id) => setSel(id || null)} zoomKm={5} />
      <View pointerEvents="box-none" style={{ position: 'absolute', top: insets.top + spacing.sm, left: spacing.lg, right: 0 }}>
        <View style={{ paddingRight: spacing.lg }}>{filtros(true)}</View>
      </View>
      <View pointerEvents="box-none" style={[{ position: 'absolute', right: spacing.lg, bottom: TAB_BAR_SPACE + insets.bottom + (selecionada ? 270 : 10) }, sombra]}>
        <IconButton
          icon="crosshairs-gps"
          color={colors.brand}
          bg={colors.elevated}
          size={44}
          onPress={async () => {
            const c = (await obterPosicao()) ?? referencia;
            mapa.current?.centralizar(c);
          }}
        />
      </View>
      {selecionada && (
        <View style={[{ position: 'absolute', left: spacing.lg, right: spacing.lg, bottom: TAB_BAR_SPACE + insets.bottom, backgroundColor: colors.elevated, borderRadius: radius.xl, padding: 12 }, sombra]}>
          <CourtCard db={db} quadra={selecionada} referencia={referencia} largura="auto" />
          <View style={{ position: 'absolute', top: 20, right: 20 }}>
            <IconButton icon="close" size={30} bg={colors.elevated} onPress={() => setSel(null)} />
          </View>
        </View>
      )}
    </View>
  );
}
