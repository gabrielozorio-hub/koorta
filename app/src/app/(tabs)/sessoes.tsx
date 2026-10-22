import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SessionCard } from '@/components/cards';
import { Button, Chip, Empty, Icon, Row, Segmented } from '@/components/ui';
import { alerta } from '@/lib/alerta';
import { minhaParticipacao, quadraDe, sessaoAtiva } from '@/lib/selectors';
import { distanciaMetros, rotuloDia } from '@/lib/util';
import { RAIO_SESSOES_KM, useDB } from '@/store/AppStore';
import { colors, spacing, TAB_BAR_SPACE, type } from '@/theme';

export default function Sessoes() {
  const insets = useSafeAreaInsets();
  const { db, usuario, referencia, obterPosicao, concederConsentimento } = useDB();
  const [aba, setAba] = useState<'proximas' | 'minhas'>('proximas');
  const [esporte, setEsporte] = useState<string | null>(null);
  const [atualizando, setAtualizando] = useState(false);

  const status = (sId: string) => minhaParticipacao(db, sId, usuario.id)?.status;

  const lista = useMemo(() => {
    const base = db.sessoes.filter(sessaoAtiva).filter((s) => !esporte || s.esporteId === esporte);
    if (aba === 'minhas') {
      return base.filter((s) => s.responsavelId === usuario.id || ['aprovado', 'solicitado'].includes(status(s.id) ?? ''));
    }
    return base.filter((s) => {
      const q = quadraDe(db, s.quadraId);
      return q && distanciaMetros(referencia, q) <= RAIO_SESSOES_KM * 1000 && (s.visibilidade === 'publica' || s.responsavelId === usuario.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, aba, esporte, referencia, usuario.id]);

  const porDia = useMemo(() => {
    const g: Record<string, typeof lista> = {};
    [...lista].sort((a, b) => a.inicio.localeCompare(b.inicio)).forEach((s) => {
      const k = rotuloDia(s.inicio);
      (g[k] ??= []).push(s);
    });
    return Object.entries(g);
  }, [lista]);

  const semConsentimento = aba === 'proximas' && db.consentimento.status !== 'concedido';

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.sm }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={type.largeTitle}>Sessões</Text>
          <Pressable onPress={() => router.push('/sessao/nova')} hitSlop={10} style={({ pressed }) => ({ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1 })}>
            <Icon name="plus" size={22} color={colors.onBrand} />
          </Pressable>
        </Row>
        <View style={{ marginTop: spacing.md }}>
          <Segmented
            value={aba}
            onChange={setAba}
            options={[
              { value: 'proximas', label: `Até ${RAIO_SESSOES_KM} km` },
              { value: 'minhas', label: 'Meus jogos' },
            ]}
          />
        </View>
      </View>
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: spacing.xl, paddingVertical: spacing.md }}>
          <Chip label="Todos" selected={!esporte} onPress={() => setEsporte(null)} />
          {db.esportes.map((e) => (
            <Chip key={e.id} label={e.nome} icon={e.icone} selected={esporte === e.id} onPress={() => setEsporte(esporte === e.id ? null : e.id)} />
          ))}
        </ScrollView>
      </View>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: TAB_BAR_SPACE + insets.bottom }}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            tintColor={colors.brand}
            onRefresh={async () => {
              setAtualizando(true);
              await obterPosicao();
              setAtualizando(false);
            }}
          />
        }
      >
        {semConsentimento ? (
          <Empty
            icon="crosshairs-gps"
            title="Localização necessária"
            text={`Para listar sessões a até ${RAIO_SESSOES_KM} km de você, precisamos da sua localização.`}
            action={
              <Button
                title="Permitir localização"
                small
                onPress={async () => {
                  const r = await concederConsentimento();
                  if (!r.ok) alerta('Localização indisponível', r.erro);
                }}
              />
            }
          />
        ) : porDia.length === 0 ? (
          <Empty
            icon="calendar-blank-outline"
            title={aba === 'minhas' ? 'Nenhum jogo marcado' : 'Nenhuma sessão disponível na sua região'}
            text="Crie uma e chame a galera."
            action={<Button title="Criar sessão" small onPress={() => router.push('/sessao/nova')} />}
          />
        ) : (
          porDia.map(([dia, sessoes]) => (
            <View key={dia} style={{ marginBottom: spacing.xl }}>
              <Text style={[type.caption, { marginBottom: 10, marginLeft: 4 }]}>{dia}</Text>
              <View style={{ gap: 10 }}>
                {sessoes.map((s) => {
                  const st = status(s.id);
                  return (
                    <SessionCard
                      key={s.id}
                      db={db}
                      sessao={s}
                      destaque={s.responsavelId === usuario.id ? 'Você lidera' : st === 'aprovado' ? 'Confirmado' : st === 'solicitado' ? 'Aguardando' : undefined}
                    />
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
