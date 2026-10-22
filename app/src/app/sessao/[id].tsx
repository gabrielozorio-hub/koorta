import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fotoPrincipal } from '@/components/cards';
import { Avatar, Button, Card, Empty, Icon, IconButton, Pill, Row, SectionTitle } from '@/components/ui';
import { alerta } from '@/lib/alerta';
import { esporteDe, minhaParticipacao, nomeUsuario, participantes, quadraDe, sessaoAtiva } from '@/lib/selectors';
import { hora, NIVEL_LABEL, rotuloDia, tempoRelativo } from '@/lib/util';
import { useDB } from '@/store/AppStore';
import { colors, radius, spacing, type } from '@/theme';

export default function SessaoDetalhe() {
  const { id, criada } = useLocalSearchParams<{ id: string; criada?: string }>();
  const insets = useSafeAreaInsets();
  const { db, usuario, solicitarParticipacao, cancelarParticipacao, responderSolicitacao, cancelarSessao } = useDB();

  const s = db.sessoes.find((x) => x.id === id);
  if (!s) return <Empty icon="calendar-remove" title="Sessão não encontrada" />;

  const q = quadraDe(db, s.quadraId)!;
  const esp = esporteDe(db, s.esporteId)!;
  const part = participantes(db, s);
  const souLider = s.responsavelId === usuario.id;
  const minha = minhaParticipacao(db, s.id, usuario.id);
  const pendentes = db.participacoes.filter((p) => p.sessaoId === s.id && p.status === 'solicitado');
  const ativa = sessaoAtiva(s);
  const vagas = s.maxParticipantes - part.length;

  function solicitar() {
    const r = solicitarParticipacao(s!.id);
    if (!r.ok) alerta('Não foi possível', r.erro);
    else alerta('Solicitação enviada', 'Aguarde a resposta do líder. Você será notificado.');
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 130 + insets.bottom }} showsVerticalScrollIndicator={false}>
        <View style={{ height: 260 }}>
          <Image source={{ uri: fotoPrincipal(q) }} style={{ flex: 1 }} contentFit="cover" />
          <LinearGradient colors={['rgba(0,0,0,0.25)', 'rgba(0,0,0,0.85)']} style={StyleSheet.absoluteFill} />
          <Row style={{ position: 'absolute', top: insets.top + 8, left: spacing.lg, right: spacing.lg, justifyContent: 'space-between' }}>
            <IconButton icon="arrow-left" onPress={() => (router.canGoBack() ? router.back() : router.replace('/sessoes'))} />
            <IconButton
              icon="share-variant"
              onPress={() => Share.share({ message: `Bora jogar ${esp.nome} na ${q.nome}, ${rotuloDia(s.inicio)} às ${hora(s.inicio)}? Entra pelo Koorta!` }).catch(() => {})}
            />
          </Row>
          <View style={{ position: 'absolute', left: spacing.xl, right: spacing.xl, bottom: spacing.xl }}>
            <Row gap={8}>
              <Pill label={esp.nome} icon={esp.icone} color={colors.ink} bg={colors.brand} />
              {s.visibilidade === 'privada' && <Pill label="Privada" icon="lock" color={colors.white} bg="rgba(255,255,255,0.2)" />}
              {!ativa && <Pill label={s.status === 'cancelada' ? 'Cancelada' : 'Encerrada'} color={colors.white} bg={colors.danger} />}
            </Row>
            <Text style={{ color: colors.white, fontSize: 28, fontWeight: '700', marginTop: 10 }}>
              {rotuloDia(s.inicio)} · {hora(s.inicio)}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15 }}>até {hora(s.termino)}</Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: spacing.xl }}>
          {criada === '1' && (
            <Card style={{ marginTop: spacing.lg, backgroundColor: colors.brandSoft, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <Icon name="check-decagram" size={28} color={colors.brand} />
              <Text style={[type.body, { flex: 1, color: colors.ink, fontWeight: '600' }]}>
                Sessão criada! Ela já aparece para atletas a até 20 km da quadra.
              </Text>
            </Card>
          )}

          <Card style={{ marginTop: spacing.lg, gap: 14 }} onPress={() => router.push(`/quadra/${q.id}`)}>
            <Row gap={12}>
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="map-marker" color={colors.brand} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={type.headline}>{q.nome}</Text>
                <Text style={type.small}>{q.endereco}</Text>
              </View>
              <Icon name="chevron-right" color={colors.muted} />
            </Row>
            <Row gap={12}>
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="signal-cellular-2" color={colors.brand} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={type.headline}>{NIVEL_LABEL[s.nivel]}</Text>
                <Text style={type.small}>Nível da sessão</Text>
              </View>
            </Row>
          </Card>

          {!!s.descricao && (
            <Card style={{ marginTop: spacing.md }}>
              <Text style={type.caption}>Recado do líder</Text>
              <Text style={[type.body, { marginTop: 6 }]}>{s.descricao}</Text>
            </Card>
          )}

          {souLider && ativa && (
            <>
              <SectionTitle title={`Solicitações (${pendentes.length})`} />
              {pendentes.length === 0 ? (
                <Text style={type.small}>Nenhuma solicitação pendente. Novos pedidos aparecem aqui.</Text>
              ) : (
                <View style={{ gap: 10 }}>
                  {pendentes.map((p) => (
                    <Card key={p.id} style={{ padding: 12 }}>
                      <Row gap={10}>
                        <Avatar nome={nomeUsuario(db, p.usuarioId)} size={40} />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontWeight: '600', color: colors.ink }}>{nomeUsuario(db, p.usuarioId)}</Text>
                          <Text style={type.small}>{tempoRelativo(p.dataSolicitacao)}</Text>
                        </View>
                        <Pressable onPress={() => responderSolicitacao(p.id, false)} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.fill, alignItems: 'center', justifyContent: 'center' }}>
                          <Icon name="close" color={colors.danger} />
                        </Pressable>
                        <Pressable
                          onPress={() => (vagas > 0 ? responderSolicitacao(p.id, true) : alerta('Sessão lotada', 'Aumente o limite ou recuse.'))}
                          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Icon name="check" color={colors.white} />
                        </Pressable>
                      </Row>
                    </Card>
                  ))}
                </View>
              )}
            </>
          )}

          <SectionTitle title={`Participantes ${part.length}/${s.maxParticipantes}`} />
          <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.brandSoft, overflow: 'hidden', marginBottom: spacing.lg }}>
            <View style={{ width: `${Math.min(100, (part.length / s.maxParticipantes) * 100)}%`, height: '100%', backgroundColor: colors.brand }} />
          </View>
          <View style={{ gap: 10 }}>
            {part.map((uid) => (
              <Pressable key={uid} onPress={() => uid !== usuario.id && router.push(`/atleta/${uid}`)}>
                <Row gap={12}>
                  <Avatar nome={nomeUsuario(db, uid)} size={44} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '600', color: colors.ink }}>
                      {nomeUsuario(db, uid)} {uid === usuario.id ? '(você)' : ''}
                    </Text>
                    <Text style={type.small}>{uid === s.responsavelId ? 'Líder da sessão' : 'Confirmado'}</Text>
                  </View>
                  {uid === s.responsavelId && <Icon name="crown" color="#E8A33D" />}
                </Row>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      {ativa && (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.lg, paddingBottom: insets.bottom + spacing.md, backgroundColor: colors.card, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, borderTopWidth: 1, borderColor: colors.line }}>
          {souLider ? (
            <Button
              title="Cancelar sessão"
              variant="danger"
              icon="calendar-remove"
              onPress={() =>
                alerta('Cancelar sessão?', 'Os participantes serão avisados.', [
                  { text: 'Voltar', style: 'cancel' },
                  { text: 'Cancelar sessão', style: 'destructive', onPress: () => cancelarSessao(s.id) },
                ])
              }
            />
          ) : minha?.status === 'aprovado' ? (
            <Row gap={10}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', color: colors.brand }}>Você está confirmado ✓</Text>
                <Text style={type.small}>Chegue 10 min antes!</Text>
              </View>
              <Button title="Sair" variant="secondary" small onPress={() => cancelarParticipacao(s.id)} />
            </Row>
          ) : minha?.status === 'solicitado' ? (
            <Row gap={10}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', color: colors.warning }}>Aguardando o líder…</Text>
                <Text style={type.small}>Solicitação enviada {tempoRelativo(minha.dataSolicitacao)}</Text>
              </View>
              <Button title="Cancelar" variant="secondary" small onPress={() => cancelarParticipacao(s.id)} />
            </Row>
          ) : (
            <Button
              title={vagas > 0 ? 'Solicitar participação' : 'Sessão lotada'}
              icon="hand-wave-outline"
              disabled={vagas <= 0}
              onPress={solicitar}
            />
          )}
          {minha?.status === 'recusado' && <Text style={[type.small, { textAlign: 'center', marginTop: 6 }]}>Sua última solicitação foi recusada.</Text>}
        </View>
      )}
    </View>
  );
}
