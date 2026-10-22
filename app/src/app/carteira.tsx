import { router } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';

import { Button, Card, Empty, Header, Icon, Row, Screen } from '@/components/ui';
import { dataCurta, hora } from '@/lib/util';
import { PONTOS_POR_MINUTO, useDB } from '@/store/AppStore';
import { colors, spacing, type } from '@/theme';

export default function Carteira() {
  const { db, usuario } = useDB();
  const transacoes = db.transacoes.filter((t) => t.usuarioId === usuario.id);
  const ganhos = transacoes.filter((t) => t.tipo !== 'resgate_recompensa').reduce((s, t) => s + t.quantidadePontos, 0);
  const gastos = transacoes.filter((t) => t.tipo === 'resgate_recompensa').reduce((s, t) => s + t.quantidadePontos, 0);

  return (
    <Screen header={<Header title="Extrato de pontos" />}>
      <Card style={{ marginTop: spacing.sm }}>
        <Text style={type.caption}>Saldo atual</Text>
        <Text style={{ fontSize: 36, fontWeight: '700', color: colors.ink }}>{usuario.saldoPontos.toLocaleString('pt-BR')} pts</Text>
        <Row gap={20} style={{ marginTop: spacing.md }}>
          <View>
            <Text style={type.small}>Ganhos</Text>
            <Text style={{ fontWeight: '700', color: colors.brand, fontSize: 17 }}>+{ganhos}</Text>
          </View>
          <View>
            <Text style={type.small}>Trocados</Text>
            <Text style={{ fontWeight: '700', color: colors.danger, fontSize: 17 }}>−{gastos}</Text>
          </View>
        </Row>
        <Text style={[type.small, { marginTop: spacing.md }]}>Regra atual: {PONTOS_POR_MINUTO} pontos por minuto completo de check-in.</Text>
      </Card>

      <Text style={[type.caption, { marginTop: spacing.xl, marginBottom: spacing.md }]}>Movimentações</Text>
      {transacoes.length === 0 ? (
        <Empty icon="history" title="Sem movimentações" action={<Button title="Ver quadras" small onPress={() => router.navigate('/mapa')} />} />
      ) : (
        <Card style={{ paddingVertical: 4 }}>
          {transacoes.map((t, i) => {
            const credito = t.tipo !== 'resgate_recompensa';
            return (
              <Row key={t.id} gap={12} style={{ paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderColor: colors.line }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: credito ? colors.brandSoft : colors.fill, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={t.tipo === 'ganho_checkin' ? 'map-marker-check' : t.tipo === 'bonus' ? 'gift' : 'ticket-percent'} size={20} color={credito ? colors.brand : colors.danger} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '700', color: colors.ink }} numberOfLines={1}>{t.descricao}</Text>
                  <Text style={type.small}>
                    {dataCurta(t.data)} · {hora(t.data)}
                  </Text>
                </View>
                <Text style={{ fontWeight: '700', color: credito ? colors.brand : colors.danger }}>
                  {credito ? '+' : '−'}
                  {t.quantidadePontos}
                </Text>
              </Row>
            );
          })}
        </Card>
      )}
    </Screen>
  );
}
