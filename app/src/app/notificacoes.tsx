import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { Text, View } from 'react-native';

import { Card, Empty, Header, Icon, Row, Screen } from '@/components/ui';
import { tempoRelativo } from '@/lib/util';
import { useDB } from '@/store/AppStore';
import { colors, spacing, type } from '@/theme';

export default function Notificacoes() {
  const { db, usuario, marcarNotificacoesLidas } = useDB();
  const lista = db.notificacoes.filter((n) => n.usuarioId === usuario.id);

  useEffect(() => {
    const t = setTimeout(marcarNotificacoesLidas, 1500);
    return () => clearTimeout(t);
  }, [lista.length, marcarNotificacoesLidas]);

  return (
    <Screen header={<Header title="Notificações" />}>
      {lista.length === 0 ? (
        <Empty icon="bell-sleep-outline" title="Tudo tranquilo por aqui" text="Avisos de sessões e solicitações aparecem aqui." />
      ) : (
        <View style={{ gap: 10, marginTop: spacing.sm }}>
          {lista.map((n) => (
            <Card key={n.id} onPress={n.link ? () => router.push(n.link as never) : undefined} style={{ padding: 14, backgroundColor: n.lida ? colors.card : colors.card }}>
              <Row gap={12}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="account-group" size={20} color={colors.brand} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: n.lida ? '600' : '800', color: colors.ink }}>{n.texto}</Text>
                  <Text style={type.small}>{tempoRelativo(n.data)}</Text>
                </View>
                {!n.lida && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.brand }} />}
              </Row>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}
