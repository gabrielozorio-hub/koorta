import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { AvatarStack, Dot, Icon, Row } from '@/components/ui';
import type { DB, Quadra, SessaoJogo } from '@/data/types';
import { esporteDe, mediaAvaliacoes, nomeUsuario, participantes, presentesAgora, quadraDe } from '@/lib/selectors';
import { distanciaMetros, formatDistancia, hora, nivelMovimento, quadraAberta, rotuloDia } from '@/lib/util';
import { colors, radius, type } from '@/theme';

export const fotoPrincipal = (q: Quadra) => (q.fotos.find((f) => f.ePrincipal) ?? q.fotos[0])?.url;

export function CourtCard({
  db,
  quadra,
  referencia,
  largura = 240,
}: {
  db: DB;
  quadra: Quadra;
  referencia: { latitude: number; longitude: number };
  largura?: number | 'auto';
}) {
  const mov = nivelMovimento(presentesAgora(db, quadra));
  const { media } = mediaAvaliacoes(db, quadra.id);
  const aberta = quadraAberta(quadra.horarioAbertura, quadra.horarioFechamento);
  return (
    <Pressable
      onPress={() => router.push(`/quadra/${quadra.id}`)}
      style={({ pressed }) => [{ width: largura === 'auto' ? undefined : largura, opacity: pressed ? 0.75 : 1 }]}
    >
      <View style={{ height: largura === 'auto' ? 170 : 150, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.fill }}>
        <Image source={{ uri: fotoPrincipal(quadra) }} style={{ flex: 1 }} contentFit="cover" transition={200} />
        <View style={{ position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.elevated, paddingHorizontal: 9, paddingVertical: 4, borderRadius: radius.pill }}>
          <Dot color={aberta ? mov.cor : colors.muted} />
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.ink }}>{aberta ? mov.rotulo : 'Fechada'}</Text>
        </View>
      </View>
      <View style={{ paddingTop: 10, paddingHorizontal: 2, gap: 2 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={[type.headline, { flex: 1 }]} numberOfLines={1}>
            {quadra.nome}
          </Text>
          {media > 0 && (
            <Row gap={3}>
              <Icon name="star" size={12} color={colors.ink} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.ink }}>{media.toFixed(1).replace('.', ',')}</Text>
            </Row>
          )}
        </Row>
        <Text style={type.small} numberOfLines={1}>
          {formatDistancia(distanciaMetros(referencia, quadra))} · {quadra.esportes.map((e) => esporteDe(db, e)?.nome).join(', ')}
        </Text>
      </View>
    </Pressable>
  );
}

export function SessionCard({ db, sessao, destaque }: { db: DB; sessao: SessaoJogo; destaque?: string }) {
  const esp = esporteDe(db, sessao.esporteId);
  const q = quadraDe(db, sessao.quadraId);
  const part = participantes(db, sessao);
  const vagas = sessao.maxParticipantes - part.length;
  return (
    <Pressable
      onPress={() => router.push(`/sessao/${sessao.id}`)}
      style={({ pressed }) => ({ flexDirection: 'row', gap: 14, alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, opacity: pressed ? 0.7 : 1 })}
    >
      <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 10, fontWeight: '700', color: colors.onBrand, opacity: 0.85, textTransform: 'uppercase' }}>{rotuloDia(sessao.inicio).split(',')[0]}</Text>
        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.onBrand }}>{hora(sessao.inicio)}</Text>
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Row gap={6}>
          <Icon name={esp?.icone ?? 'run'} size={15} color={colors.ink} />
          <Text style={[type.headline, { flex: 1, fontSize: 16 }]} numberOfLines={1}>
            {esp?.nome}
          </Text>
          {sessao.visibilidade === 'privada' && <Icon name="lock-outline" size={13} color={colors.muted} />}
        </Row>
        <Text style={type.small} numberOfLines={1}>
          {q?.nome} · {nomeUsuario(db, sessao.responsavelId).split(' ')[0]}
        </Text>
        <Row style={{ justifyContent: 'space-between', marginTop: 4 }}>
          <AvatarStack nomes={part.map((id) => nomeUsuario(db, id))} size={22} />
          <Text style={{ fontSize: 13, fontWeight: '600', color: destaque || vagas > 0 ? colors.brand : colors.muted }}>
            {destaque ?? (vagas > 0 ? `${vagas} vaga${vagas > 1 ? 's' : ''}` : 'Lotada')}
          </Text>
        </Row>
      </View>
    </Pressable>
  );
}

export function MovementChart({ movimento, abertura, fechamento }: { movimento: number[]; abertura: string; fechamento: string }) {
  const h0 = Math.max(5, parseInt(abertura, 10));
  const h1 = Math.min(23, parseInt(fechamento, 10));
  const horas = Array.from({ length: h1 - h0 + 1 }, (_, i) => h0 + i);
  const max = Math.max(...movimento, 1);
  const agoraH = new Date().getHours();
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 80, gap: 3 }}>
        {horas.map((h) => {
          const v = movimento[h] ?? 0;
          const atual = h === agoraH;
          return (
            <View key={h} style={{ flex: 1, justifyContent: 'flex-end', height: '100%' }}>
              <View style={{ height: `${Math.max(5, (v / max) * 100)}%`, borderRadius: 3, backgroundColor: atual ? colors.brand : colors.fill }} />
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', gap: 3, marginTop: 6 }}>
        {horas.map((h) => (
          <Text key={h} style={{ flex: 1, textAlign: 'center', fontSize: 9, color: h === agoraH ? colors.brand : colors.muted, fontWeight: h === agoraH ? '700' : '400' }}>
            {h % 3 === 0 || h === agoraH ? `${h}h` : ''}
          </Text>
        ))}
      </View>
    </View>
  );
}
