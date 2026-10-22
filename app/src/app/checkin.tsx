import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Icon, IconButton, ListGroup, ListItem, Row } from '@/components/ui';
import { alerta } from '@/lib/alerta';
import { quadraDe } from '@/lib/selectors';
import { duracao } from '@/lib/util';
import { FATOR_TEMPO_DEMO, PONTOS_POR_MINUTO, useDB } from '@/store/AppStore';
import { colors, spacing, type } from '@/theme';

type Resumo = { quadra: string; minutos: number; pontos: number; aviso?: string };

export default function CheckinTela() {
  const insets = useSafeAreaInsets();
  const { simulado } = useLocalSearchParams<{ simulado?: string }>();
  const { db, usuario, checkinAtivo, agoraTick, minutosValidos, encerrarCheckin } = useDB();
  const [resumo, setResumo] = useState<Resumo | null>(null);

  const fechar = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const tela = { flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + spacing.sm, paddingHorizontal: spacing.xl, paddingBottom: insets.bottom + spacing.xl };

  if (resumo) {
    return (
      <View style={tela}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={resumo.pontos > 0 ? 'check' : 'timer-sand-empty'} size={44} color={colors.onBrand} />
          </View>
          <Text style={[type.largeTitle, { textAlign: 'center', marginTop: 10 }]}>{resumo.pontos > 0 ? `+${resumo.pontos} pontos` : 'Check-in encerrado'}</Text>
          <Text style={[type.body, { textAlign: 'center', color: colors.muted }]}>{resumo.aviso ?? `${resumo.minutos} min em ${resumo.quadra}`}</Text>
          <ListGroup style={{ alignSelf: 'stretch', marginTop: spacing.xl }}>
            <ListItem title="Quadra" value={resumo.quadra} />
            <ListItem title="Tempo válido" value={`${resumo.minutos} min`} />
            <ListItem title="Pontos creditados" value={`${resumo.pontos}`} />
            <ListItem title="Saldo atual" value={`${usuario.saldoPontos.toLocaleString('pt-BR')} pts`} />
          </ListGroup>
        </View>
        <Button title="Trocar pontos" onPress={() => router.replace('/recompensas')} />
        <Button title="Fechar" variant="plain" style={{ marginTop: 6 }} onPress={fechar} />
      </View>
    );
  }

  if (!checkinAtivo) {
    return (
      <View style={[tela, { alignItems: 'center', justifyContent: 'center', gap: 12 }]}>
        <Icon name="map-marker-off" size={44} color={colors.muted} />
        <Text style={type.headline}>Nenhum check-in ativo</Text>
        <Button title="Voltar" variant="secondary" onPress={fechar} />
      </View>
    );
  }

  const q = quadraDe(db, checkinAtivo.quadraId);
  const decorrido = (agoraTick - new Date(checkinAtivo.dataHora).getTime()) * (db.modoDemo ? FATOR_TEMPO_DEMO : 1);
  const minutos = minutosValidos(checkinAtivo, agoraTick);
  const pontos = minutos * PONTOS_POR_MINUTO;
  const progresso = (decorrido % 60000) / 60000;

  function encerrar() {
    alerta('Encerrar check-in?', `Você vai receber ${pontos} pontos por ${minutos} min.`, [
      { text: 'Continuar', style: 'cancel' },
      {
        text: 'Encerrar',
        style: 'destructive',
        onPress: () => {
          const r = encerrarCheckin();
          if (!r.ok) return alerta('Erro', r.erro);
          setResumo({ quadra: q?.nome ?? '', minutos: r.valor!.minutos, pontos: r.valor!.pontos, aviso: r.aviso });
        },
      },
    ]);
  }

  return (
    <View style={tela}>
      <Row style={{ justifyContent: 'space-between' }}>
        <IconButton icon="chevron-down" onPress={fechar} />
        <Row gap={6}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.brand }} />
          <Text style={{ color: colors.ink, fontWeight: '600', fontSize: 13 }}>Ao vivo</Text>
        </Row>
      </Row>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={type.caption}>Check-in em</Text>
        <Text style={[type.title, { textAlign: 'center', marginTop: 4, marginBottom: 40 }]}>{q?.nome}</Text>

        <Text style={{ color: colors.ink, fontSize: 72, fontWeight: '200', fontVariant: ['tabular-nums'], letterSpacing: -2 }}>{duracao(decorrido)}</Text>
        {/* Barra do minuto corrente */}
        <View style={{ width: 220, height: 4, borderRadius: 2, backgroundColor: colors.fill, marginTop: 18, overflow: 'hidden' }}>
          <View style={{ width: `${progresso * 100}%`, height: '100%', backgroundColor: colors.brand }} />
        </View>
        <Text style={{ color: colors.brand, fontSize: 22, fontWeight: '600', marginTop: 24 }}>+{pontos} pts</Text>
        <Text style={[type.small, { marginTop: 6 }]}>{PONTOS_POR_MINUTO} pontos por minuto completo</Text>
        {(simulado === '1' || db.modoDemo) && (
          <Text style={[type.small, { marginTop: 24, textAlign: 'center' }]}>
            Modo demonstração{simulado === '1' ? ' · localização simulada' : ''} · tempo {FATOR_TEMPO_DEMO}x
          </Text>
        )}
      </View>

      <Button title="Encerrar check-in" variant="inverse" onPress={encerrar} />
    </View>
  );
}
