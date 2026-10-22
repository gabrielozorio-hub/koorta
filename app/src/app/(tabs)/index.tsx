import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CheckinBanner } from '@/components/CheckinBanner';
import { CourtCard, SessionCard } from '@/components/cards';
import { CourtMap } from '@/components/CourtMap';
import { Button, Icon, Logo, Row, SectionTitle } from '@/components/ui';
import { alerta } from '@/lib/alerta';
import { minhaParticipacao, nomeUsuario, sessaoAtiva } from '@/lib/selectors';
import { distanciaMetros, thumbVideo } from '@/lib/util';
import { RAIO_SESSOES_KM, useDB } from '@/store/AppStore';
import { colors, radius, spacing, TAB_BAR_SPACE, type } from '@/theme';

export default function Inicio() {
  const insets = useSafeAreaInsets();
  const { db, usuario, referencia, posicao, concederConsentimento } = useDB();
  const primeiroNome = usuario.nome.split(' ')[0];
  const naoLidas = db.notificacoes.filter((n) => n.usuarioId === usuario.id && !n.lida).length;

  const quadras = useMemo(
    () =>
      db.quadras
        .filter((q) => q.estaAtivo)
        .map((q) => ({ q, d: distanciaMetros(referencia, q) }))
        .sort((a, b) => a.d - b.d),
    [db.quadras, referencia],
  );

  const minhasSessoes = useMemo(
    () =>
      db.sessoes
        .filter(sessaoAtiva)
        .filter((s) => s.responsavelId === usuario.id || ['aprovado', 'solicitado'].includes(minhaParticipacao(db, s.id, usuario.id)?.status ?? ''))
        .sort((a, b) => a.inicio.localeCompare(b.inicio)),
    [db, usuario.id],
  );

  const proximas = useMemo(
    () =>
      db.sessoes
        .filter((s) => sessaoAtiva(s) && s.visibilidade === 'publica' && !minhasSessoes.includes(s))
        .filter((s) => {
          const q = db.quadras.find((x) => x.id === s.quadraId);
          return q && distanciaMetros(referencia, q) <= RAIO_SESSOES_KM * 1000;
        })
        .sort((a, b) => a.inicio.localeCompare(b.inicio))
        .slice(0, 3),
    [db, minhasSessoes, referencia],
  );

  const status = (id: string) => minhaParticipacao(db, id, usuario.id)?.status;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE + insets.bottom }} showsVerticalScrollIndicator={false}>
      {/* Topo verde da marca, como no protótipo */}
      <View style={{ backgroundColor: colors.brand, paddingTop: insets.top + 12, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <View>
            <Logo size={26} color={colors.black} />
            <Text style={{ fontSize: 17, color: colors.black, marginTop: 2 }}>Olá, {primeiroNome}</Text>
          </View>
          <Row gap={14}>
            <Pressable onPress={() => router.push('/notificacoes')} hitSlop={8}>
              <Icon name="bell-outline" size={25} color={colors.black} />
              {naoLidas > 0 && <View style={{ position: 'absolute', top: 0, right: 1, width: 9, height: 9, borderRadius: 5, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.black }} />}
            </Pressable>
            <Pressable onPress={() => router.navigate('/perfil')} hitSlop={8}>
              <Icon name="account-circle-outline" size={30} color={colors.black} />
            </Pressable>
          </Row>
        </Row>

        <Pressable onPress={() => router.navigate('/mapa')} style={{ height: 170, borderRadius: radius.xl, overflow: 'hidden', marginTop: spacing.xl }}>
          <View pointerEvents="none" style={{ flex: 1 }}>
            <CourtMap quadras={quadras.slice(0, 8).map((x) => x.q)} esportes={db.esportes} centro={referencia} usuario={posicao} interativo={false} zoomKm={5} />
          </View>
          <View style={{ position: 'absolute', left: 10, bottom: 10, backgroundColor: colors.elevated, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 }}>
            <Text style={{ fontWeight: '600', color: colors.ink, fontSize: 13 }}>{quadras.length} quadras perto de você</Text>
          </View>
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: spacing.xl }}>
        {/* Pontos */}
        <Pressable onPress={() => router.push('/recompensas')} style={({ pressed }) => ({ marginTop: spacing.xl, flexDirection: 'row', alignItems: 'center', opacity: pressed ? 0.7 : 1 })}>
          <View style={{ flex: 1 }}>
            <Text style={type.caption}>Seus pontos</Text>
            <Text style={{ fontSize: 34, fontWeight: '700', color: colors.ink, letterSpacing: -0.5 }}>
              {usuario.saldoPontos.toLocaleString('pt-BR')}
              <Text style={{ fontSize: 17, color: colors.brand }}> pts</Text>
            </Text>
          </View>
          <Row gap={4}>
            <Text style={{ color: colors.brand, fontSize: 16 }}>Trocar</Text>
            <Icon name="chevron-right" size={18} color={colors.brand} />
          </Row>
        </Pressable>

        <CheckinBanner />

        {db.consentimento.status !== 'concedido' && (
          <Pressable
            onPress={async () => {
              const r = await concederConsentimento();
              if (!r.ok) alerta('Localização indisponível', r.erro);
            }}
            style={{ marginTop: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: radius.lg, padding: 14 }}
          >
            <Icon name="crosshairs-gps" size={22} color={colors.brand} />
            <Text style={[type.body, { flex: 1, fontSize: 15 }]}>Ative a localização para distâncias reais e check-in</Text>
            <Icon name="chevron-right" size={18} color={colors.muted} />
          </Pressable>
        )}

        {/* Quadras */}
        <SectionTitle title="Quadras" action="Ver todas" onAction={() => router.navigate('/mapa')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -spacing.xl }} contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: 14 }}>
          {quadras.slice(0, 6).map(({ q }) => (
            <CourtCard key={q.id} db={db} quadra={q} referencia={referencia} />
          ))}
        </ScrollView>

        {/* Sessões */}
        <SectionTitle title={minhasSessoes.length ? 'Seus jogos' : 'Sessões abertas'} action="Ver todas" onAction={() => router.navigate('/sessoes')} />
        <View style={{ gap: 10 }}>
          {(minhasSessoes.length ? minhasSessoes.slice(0, 3) : proximas).map((s) => (
            <SessionCard
              key={s.id}
              db={db}
              sessao={s}
              destaque={s.responsavelId === usuario.id ? 'Você lidera' : status(s.id) === 'solicitado' ? 'Aguardando' : status(s.id) === 'aprovado' ? 'Confirmado' : undefined}
            />
          ))}
        </View>
        <Button title="Criar sessão" icon="plus" variant="secondary" style={{ marginTop: spacing.md }} onPress={() => router.push('/sessao/nova')} />

        {/* Koorta's */}
        <SectionTitle title="Koorta's" action="Assistir" onAction={() => router.navigate('/koortas')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -spacing.xl }} contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: 10 }}>
          {[...db.videos]
            .sort((a, b) => b.curtidasBase - a.curtidasBase)
            .slice(0, 6)
            .map((v) => (
              <Pressable key={v.id} onPress={() => router.navigate({ pathname: '/koortas', params: { v: v.id } })} style={({ pressed }) => ({ width: 120, opacity: pressed ? 0.7 : 1 })}>
                <View style={{ height: 180, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.fill }}>
                  <Image source={{ uri: thumbVideo(v.arquivoMidia) }} style={{ flex: 1 }} contentFit="cover" transition={200} />
                  <View style={{ position: 'absolute', bottom: 8, left: 8, flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Icon name="play" size={12} color={colors.white} />
                    <Text style={{ color: colors.white, fontWeight: '600', fontSize: 12 }}>{(v.curtidasBase * 7).toLocaleString('pt-BR')}</Text>
                  </View>
                </View>
                <Text style={{ fontWeight: '600', color: colors.ink, marginTop: 6, fontSize: 13 }} numberOfLines={2}>
                  {v.titulo}
                </Text>
                <Text style={type.small} numberOfLines={1}>
                  {nomeUsuario(db, v.autorId)}
                </Text>
              </Pressable>
            ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}
