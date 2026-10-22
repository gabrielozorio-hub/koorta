import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Linking, Platform, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MovementChart, SessionCard } from '@/components/cards';
import { Avatar, Button, Card, Chip, Empty, Icon, IconButton, Pill, Row, SectionTitle, Stars } from '@/components/ui';
import { esporteDe, mediaAvaliacoes, nomeUsuario, presentesAgora, quadraDe, sessaoAtiva } from '@/lib/selectors';
import { useFazerCheckin } from '@/lib/useCheckin';
import { distanciaMetros, formatDistancia, nivelMovimento, quadraAberta, tempoRelativo } from '@/lib/util';
import { RAIO_CHECKIN_M, useDB } from '@/store/AppStore';
import { colors, radius, spacing, type } from '@/theme';

export default function QuadraDetalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { db, usuario, referencia, checkinAtivo, alternarFavorita, avaliarQuadra } = useDB();
  const { executar, carregando } = useFazerCheckin();
  const [foto, setFoto] = useState(0);
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState('');

  const q = quadraDe(db, id);
  if (!q) return <Empty icon="map-marker-off" title="Quadra não encontrada" />;

  const favorita = db.quadrasFavoritas.some((f) => f.usuarioId === usuario.id && f.quadraId === q.id);
  const { media, total } = mediaAvaliacoes(db, q.id);
  const presentes = presentesAgora(db, q);
  const mov = nivelMovimento(presentes);
  const aberta = quadraAberta(q.horarioAbertura, q.horarioFechamento);
  const dist = distanciaMetros(referencia, q);
  const avaliacoes = db.avaliacoes.filter((a) => a.quadraId === q.id && a.estaAtivo);
  const minhaAvaliacao = avaliacoes.find((a) => a.usuarioId === usuario.id);
  const sessoes = db.sessoes.filter((s) => s.quadraId === q.id && sessaoAtiva(s) && s.visibilidade === 'publica').sort((a, b) => a.inicio.localeCompare(b.inicio));
  const checkinAqui = checkinAtivo?.quadraId === q.id;

  const abrirMaps = () => {
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(q.nome)}@${q.latitude},${q.longitude}`,
      default: `https://www.google.com/maps/search/?api=1&query=${q.latitude},${q.longitude}`,
    });
    Linking.openURL(url!).catch(() => {});
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 + insets.bottom }} showsVerticalScrollIndicator={false}>
        {/* Galeria */}
        <View style={{ height: 300 }}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => setFoto(Math.round(e.nativeEvent.contentOffset.x / width))}
          >
            {q.fotos.map((f) => (
              <Image key={f.id} source={{ uri: f.url }} style={{ width, height: 300 }} contentFit="cover" transition={200} />
            ))}
          </ScrollView>
          <Row style={{ position: 'absolute', top: insets.top + 8, left: spacing.lg, right: spacing.lg, justifyContent: 'space-between' }}>
            <IconButton icon="arrow-left" onPress={() => router.back()} />
            <Row>
              <IconButton icon="directions" onPress={abrirMaps} />
              <IconButton icon={favorita ? 'heart' : 'heart-outline'} color={favorita ? colors.danger : colors.ink} onPress={() => alternarFavorita(q.id)} />
            </Row>
          </Row>
          {q.fotos.length > 1 && (
            <Row gap={5} style={{ position: 'absolute', bottom: 40, alignSelf: 'center' }}>
              {q.fotos.map((f, i) => (
                <View key={f.id} style={{ width: i === foto ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: i === foto ? colors.white : 'rgba(255,255,255,0.6)' }} />
              ))}
            </Row>
          )}
        </View>

        <View style={{ marginTop: -26, backgroundColor: colors.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: spacing.xl, paddingTop: spacing.xl }}>
          <Text style={type.largeTitle}>{q.nome}</Text>
          {!!q.endereco && <Text style={[type.body, { marginTop: 4 }]}>{q.endereco}</Text>}
          <Row gap={14} style={{ marginTop: spacing.md, flexWrap: 'wrap' }}>
            <Row gap={4}>
              <Stars value={media} size={15} />
              <Text style={type.small}>
                {media ? media.toFixed(1).replace('.', ',') : '–'} ({total})
              </Text>
            </Row>
            <Row gap={4}>
              <Icon name="map-marker-distance" size={16} color={colors.muted} />
              <Text style={type.small}>{formatDistancia(dist)}</Text>
            </Row>
          </Row>
          <Row gap={6} style={{ marginTop: spacing.md, flexWrap: 'wrap' }}>
            <Pill label={aberta ? 'Aberta agora' : 'Fechada'} icon="clock-outline" color={aberta ? colors.brand : colors.danger} />
            <Pill label={`${q.horarioAbertura} – ${q.horarioFechamento}`} color={colors.inkSoft} />
            <Pill label={q.gratuita ? 'Gratuita' : 'Paga'} icon={q.gratuita ? 'cash-remove' : 'cash'} color={colors.inkSoft} />
            {q.coberta && <Pill label="Coberta" icon="home-roof" color={colors.inkSoft} />}
          </Row>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.lg, marginHorizontal: -spacing.xl }} contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: 8 }}>
            {q.esportes.map((e) => {
              const esp = esporteDe(db, e);
              return <Chip key={e} label={esp?.nome ?? ''} icon={esp?.icone} />;
            })}
          </ScrollView>

          {/* Movimento */}
          <Card style={{ marginTop: spacing.xl }}>
            <Row style={{ justifyContent: 'space-between', marginBottom: spacing.lg }}>
              <View>
                <Text style={type.caption}>Movimento agora</Text>
                <Row gap={8} style={{ marginTop: 4 }}>
                  <Text style={{ fontSize: 30, fontWeight: '700', color: colors.ink }}>{aberta ? presentes : 0}</Text>
                  <Text style={type.body}>atletas</Text>
                </Row>
              </View>
              <Pill label={aberta ? mov.rotulo : 'Fechada'} color={aberta ? mov.cor : colors.muted} icon="pulse" />
            </Row>
            <MovementChart movimento={q.movimento} abertura={q.horarioAbertura} fechamento={q.horarioFechamento} />
            <Text style={[type.small, { marginTop: 10 }]}>Média de atletas por horário, com base nos check-ins.</Text>
          </Card>

          {/* Sessões */}
          <SectionTitle title="Sessões aqui" action="Criar" onAction={() => router.push({ pathname: '/sessao/nova', params: { quadra: q.id } })} />
          {sessoes.length ? (
            <View style={{ gap: 12 }}>
              {sessoes.map((s) => (
                <SessionCard key={s.id} db={db} sessao={s} />
              ))}
            </View>
          ) : (
            <Card style={{ alignItems: 'center', gap: 10 }}>
              <Text style={type.body}>Nenhuma sessão marcada aqui ainda.</Text>
              <Button title="Criar a primeira" small icon="plus" onPress={() => router.push({ pathname: '/sessao/nova', params: { quadra: q.id } })} />
            </Card>
          )}

          {/* Avaliações */}
          <SectionTitle title="Avaliações" />
          <Card style={{ gap: 10, marginBottom: spacing.md }}>
            <Text style={type.headline}>{minhaAvaliacao ? 'Atualizar sua avaliação' : 'Avalie esta quadra'}</Text>
            <Stars value={nota || minhaAvaliacao?.nota || 0} size={30} onChange={setNota} />
            <TextInput
              value={comentario}
              onChangeText={setComentario}
              placeholder="Conte como foi (opcional)"
              placeholderTextColor={colors.muted}
              maxLength={1000}
              multiline
              style={{ minHeight: 60, borderRadius: radius.md, backgroundColor: colors.bg, padding: 12, fontSize: 15, color: colors.ink, textAlignVertical: 'top' }}
            />
            <Button
              title="Enviar avaliação"
              small
              disabled={!nota}
              onPress={() => {
                avaliarQuadra(q.id, nota, comentario);
                setNota(0);
                setComentario('');
              }}
            />
          </Card>
          <View style={{ gap: 10 }}>
            {avaliacoes.map((a) => (
              <Card key={a.id} style={{ padding: 14 }}>
                <Row gap={10}>
                  <Avatar nome={nomeUsuario(db, a.usuarioId)} size={36} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '600', color: colors.ink }}>{nomeUsuario(db, a.usuarioId)}</Text>
                    <Row gap={6}>
                      <Stars value={a.nota} size={12} />
                      <Text style={type.small}>{tempoRelativo(a.data)}</Text>
                    </Row>
                  </View>
                </Row>
                {!!a.comentario && <Text style={[type.body, { marginTop: 8 }]}>{a.comentario}</Text>}
              </Card>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Ação de check-in */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.lg, paddingBottom: insets.bottom + spacing.md, backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderColor: colors.line }}>
        {checkinAqui ? (
          <Button title="Check-in ativo · ver" variant="primary" icon="timer-outline" onPress={() => router.push('/checkin')} />
        ) : (
          <Row gap={10}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600', color: colors.ink }}>Ganhe pontos jogando</Text>
              <Text style={type.small}>Check-in a até {RAIO_CHECKIN_M} m da quadra</Text>
            </View>
            <Button
              title="Fazer check-in"
              icon="map-marker-check"
              loading={carregando}
              disabled={!aberta}
              onPress={() => executar(q.id)}
            />
          </Row>
        )}
      </View>
    </View>
  );
}
