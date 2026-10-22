import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { CourtCard } from '@/components/cards';
import { Avatar, Chip, Icon, IconButton, ListGroup, ListItem, Row, Screen, SectionTitle } from '@/components/ui';
import type { Nivel } from '@/data/types';
import { alerta } from '@/lib/alerta';
import { esporteDe, quadraDe } from '@/lib/selectors';
import { dataCurta, NIVEL_LABEL } from '@/lib/util';
import { useDB } from '@/store/AppStore';
import { colors, radius, spacing, TAB_BAR_SPACE, type } from '@/theme';

const NIVEIS: Nivel[] = ['iniciante', 'intermediario', 'avancado'];

export default function Perfil() {
  const { db, usuario, referencia, definirEsporte, sair } = useDB();
  const [editando, setEditando] = useState(false);

  const meusEsportes = db.usuarioEsportes.filter((e) => e.usuarioId === usuario.id && e.estaAtivo);
  const checkins = db.checkins.filter((c) => c.usuarioId === usuario.id);
  const seguidores = db.seguidos.filter((s) => s.seguidoId === usuario.id).length;
  const jogos = db.participacoes.filter((p) => p.usuarioId === usuario.id && p.status === 'aprovado').length + db.sessoes.filter((s) => s.responsavelId === usuario.id).length;
  const favoritas = db.quadrasFavoritas.filter((f) => f.usuarioId === usuario.id).map((f) => quadraDe(db, f.quadraId)).filter(Boolean);
  const cupons = db.resgates.filter((r) => r.usuarioId === usuario.id && r.status === 'pendente').length;

  const stats = [
    { v: usuario.saldoPontos.toLocaleString('pt-BR'), l: 'Pontos' },
    { v: checkins.length, l: 'Check-ins' },
    { v: jogos, l: 'Jogos' },
    { v: seguidores, l: 'Seguidores' },
  ];

  return (
    <Screen bottomSpace={TAB_BAR_SPACE}>
      <Row style={{ justifyContent: 'space-between', marginTop: spacing.sm }}>
        <Text style={type.largeTitle}>Perfil</Text>
        <IconButton icon="cog-outline" onPress={() => router.push('/configuracoes')} />
      </Row>

      <View style={{ alignItems: 'center', marginTop: spacing.xl }}>
        <Avatar nome={usuario.nome} size={88} destaque />
        <Text style={[type.title, { marginTop: 12 }]}>{usuario.nome}</Text>
        <Text style={type.small}>
          {usuario.cidade}, {usuario.estado}
        </Text>
        {!!usuario.bio && <Text style={[type.body, { marginTop: 8, textAlign: 'center' }]}>{usuario.bio}</Text>}
      </View>

      <View style={{ flexDirection: 'row', marginTop: spacing.xl, backgroundColor: colors.card, borderRadius: radius.lg, paddingVertical: 14 }}>
        {stats.map((s, i) => (
          <View key={s.l} style={{ flex: 1, alignItems: 'center', borderLeftWidth: i ? 0.5 : 0, borderColor: colors.line }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.ink }}>{s.v}</Text>
            <Text style={type.small}>{s.l}</Text>
          </View>
        ))}
      </View>

      <SectionTitle title="Esportes" action={editando ? 'OK' : 'Editar'} onAction={() => setEditando(!editando)} />
      {!editando ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {meusEsportes.length === 0 && <Text style={type.small}>Toque em Editar para adicionar.</Text>}
          {meusEsportes.map((e) => {
            const esp = esporteDe(db, e.esporteId);
            return (
              <View key={e.esporteId} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.card, borderRadius: radius.md, paddingVertical: 10, paddingHorizontal: 12 }}>
                <Icon name={esp?.icone ?? 'run'} size={18} color={colors.brand} />
                <View>
                  <Text style={{ fontWeight: '600', color: colors.ink }}>{esp?.nome}</Text>
                  <Text style={type.small}>{NIVEL_LABEL[e.nivelHabilidade]}</Text>
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={{ gap: 14 }}>
          {db.esportes.map((esp) => {
            const atual = meusEsportes.find((e) => e.esporteId === esp.id);
            return (
              <View key={esp.id}>
                <Row gap={6} style={{ marginBottom: 8 }}>
                  <Icon name={esp.icone} size={17} color={colors.brand} />
                  <Text style={type.headline}>{esp.nome}</Text>
                </Row>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  <Chip label="Não pratico" selected={!atual} onPress={() => definirEsporte(esp.id, null)} />
                  {NIVEIS.map((n) => (
                    <Chip key={n} label={NIVEL_LABEL[n]} selected={atual?.nivelHabilidade === n} onPress={() => definirEsporte(esp.id, n)} />
                  ))}
                </ScrollView>
              </View>
            );
          })}
        </View>
      )}

      {favoritas.length > 0 && (
        <>
          <SectionTitle title="Quadras favoritas" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -spacing.xl }} contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: 14 }}>
            {favoritas.map((q) => (
              <CourtCard key={q!.id} db={db} quadra={q!} referencia={referencia} largura={220} />
            ))}
          </ScrollView>
        </>
      )}

      {checkins.length > 0 && (
        <>
          <SectionTitle title="Últimos check-ins" />
          <ListGroup>
            {checkins.slice(0, 5).map((c) => (
              <ListItem key={c.id} icon="map-marker-outline" title={quadraDe(db, c.quadraId)?.nome ?? ''} subtitle={dataCurta(c.dataHora)} value={c.estaAtivo ? 'Ativo' : undefined} />
            ))}
          </ListGroup>
        </>
      )}

      <SectionTitle title="Conta" />
      <ListGroup>
        <ListItem icon="wallet-outline" title="Extrato de pontos" onPress={() => router.push('/carteira')} />
        <ListItem icon="ticket-outline" title="Trocar pontos e cupons" value={cupons ? String(cupons) : undefined} onPress={() => router.push('/recompensas')} />
        <ListItem icon="bell-outline" title="Notificações" onPress={() => router.push('/notificacoes')} />
        <ListItem icon="cog-outline" title="Ajustes" onPress={() => router.push('/configuracoes')} />
      </ListGroup>
      <ListGroup style={{ marginTop: spacing.lg }}>
        <ListItem
          icon="logout"
          title="Sair"
          destructive
          chevron={false}
          onPress={() => alerta('Sair da conta?', undefined, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Sair', style: 'destructive', onPress: sair }])}
        />
      </ListGroup>
    </Screen>
  );
}
