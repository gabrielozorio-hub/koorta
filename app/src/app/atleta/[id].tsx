import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';

import { SessionCard } from '@/components/cards';
import { Avatar, Button, Card, Empty, Header, Icon, Row, Screen, SectionTitle } from '@/components/ui';
import { esporteDe, sessaoAtiva } from '@/lib/selectors';
import { NIVEL_LABEL } from '@/lib/util';
import { useDB } from '@/store/AppStore';
import { colors, radius, spacing, type } from '@/theme';

export default function Atleta() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db, usuario, alternarSeguir } = useDB();
  const a = db.usuarios.find((u) => u.id === id);
  if (!a) return <Empty icon="account-off-outline" title="Atleta não encontrado" />;

  const sigo = db.seguidos.some((s) => s.seguidorId === usuario.id && s.seguidoId === a.id);
  const seguidores = db.seguidos.filter((s) => s.seguidoId === a.id).length + (a.id.length % 7) * 13;
  const esportes = db.usuarioEsportes.filter((e) => e.usuarioId === a.id);
  const sessoes = db.sessoes.filter((s) => s.responsavelId === a.id && sessaoAtiva(s) && s.visibilidade === 'publica');
  const videos = db.videos.filter((v) => v.autorId === a.id).length;

  return (
    <Screen header={<Header title={a.nome.split(' ')[0]} />}>
      <View style={{ alignItems: 'center', marginTop: spacing.md }}>
        <Avatar nome={a.nome} size={96} />
        <Text style={[type.title, { marginTop: 12 }]}>{a.nome}</Text>
        <Text style={type.small}>
          {a.cidade}, {a.estado}
        </Text>
        {!!a.bio && <Text style={[type.body, { marginTop: 8, textAlign: 'center' }]}>{a.bio}</Text>}
        <Row gap={28} style={{ marginTop: spacing.lg }}>
          {[
            [seguidores, 'seguidores'],
            [videos, "Koorta's"],
            [a.saldoPontos.toLocaleString('pt-BR'), 'pontos'],
          ].map(([v, l]) => (
            <View key={String(l)} style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: colors.ink }}>{v}</Text>
              <Text style={type.small}>{l}</Text>
            </View>
          ))}
        </Row>
        <Button
          title={sigo ? 'Seguindo' : 'Seguir'}
          icon={sigo ? 'account-check' : 'account-plus'}
          variant={sigo ? 'secondary' : 'primary'}
          style={{ marginTop: spacing.lg, alignSelf: 'stretch' }}
          onPress={() => alternarSeguir(a.id)}
        />
      </View>

      {esportes.length > 0 && (
        <>
          <SectionTitle title="Esportes" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {esportes.map((e) => {
              const esp = esporteDe(db, e.esporteId);
              return (
                <Card key={e.esporteId} style={{ padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: radius.md }}>
                  <Icon name={esp?.icone ?? 'run'} color={colors.brand} />
                  <View>
                    <Text style={{ fontWeight: '600', color: colors.ink }}>{esp?.nome}</Text>
                    <Text style={type.small}>{NIVEL_LABEL[e.nivelHabilidade]}</Text>
                  </View>
                </Card>
              );
            })}
          </View>
        </>
      )}

      {sessoes.length > 0 && (
        <>
          <SectionTitle title="Sessões abertas" />
          <View style={{ gap: 12 }}>
            {sessoes.map((s) => (
              <SessionCard key={s.id} db={db} sessao={s} />
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}
