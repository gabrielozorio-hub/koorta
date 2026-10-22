import React, { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card, Empty, Header, Icon, Pill, Row, Screen } from '@/components/ui';
import type { Recompensa } from '@/data/types';
import { alerta } from '@/lib/alerta';
import { dataCurta } from '@/lib/util';
import { useDB } from '@/store/AppStore';
import { colors, radius, spacing, type } from '@/theme';

export default function Recompensas() {
  const insets = useSafeAreaInsets();
  const { db, usuario, agoraTick, resgatar, marcarUtilizado } = useDB();
  const [aba, setAba] = useState<'descontos' | 'cupons'>('descontos');
  const [sel, setSel] = useState<Recompensa | null>(null);
  const [codigo, setCodigo] = useState<string | null>(null);

  const ativas = db.recompensas.filter((r) => r.estaAtivo && new Date(r.validade).getTime() > agoraTick).sort((a, b) => a.pontosNecessarios - b.pontosNecessarios);
  const cupons = db.resgates.filter((r) => r.usuarioId === usuario.id);
  const loja = (id: string) => db.lojas.find((l) => l.id === id)!;

  function confirmar() {
    if (!sel) return;
    const r = resgatar(sel.id);
    if (!r.ok) {
      alerta('Troca não realizada', r.erro);
      return;
    }
    setCodigo(r.valor!.codigo);
  }

  const fechar = () => {
    setSel(null);
    setCodigo(null);
  };

  return (
    <Screen header={<Header title="Trocar pontos" />}>
      <View style={{ backgroundColor: colors.brand, borderRadius: radius.xl, padding: spacing.xl, marginTop: spacing.sm }}>
        <Text style={{ color: 'rgba(255,255,255,0.75)', fontWeight: '700' }}>Saldo disponível</Text>
        <Row gap={6} style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: colors.white, fontSize: 38, fontWeight: '700' }}>{usuario.saldoPontos.toLocaleString('pt-BR')}</Text>
          <Text style={{ color: colors.brand, fontWeight: '600', marginBottom: 7 }}>pts</Text>
        </Row>
        <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>Ganhe pontos fazendo check-in nas quadras.</Text>
      </View>

      <View style={{ flexDirection: 'row', backgroundColor: colors.brandSoft, borderRadius: radius.pill, padding: 4, marginVertical: spacing.lg }}>
        {(['descontos', 'cupons'] as const).map((a) => (
          <Pressable key={a} onPress={() => setAba(a)} style={{ flex: 1, height: 40, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: aba === a ? colors.card : 'transparent' }}>
            <Text style={{ fontWeight: '600', color: aba === a ? colors.ink : colors.inkSoft }}>{a === 'descontos' ? 'Descontos' : `Meus cupons (${cupons.length})`}</Text>
          </Pressable>
        ))}
      </View>

      {aba === 'descontos' ? (
        ativas.length === 0 ? (
          <Empty icon="gift-off-outline" title="Nenhum desconto disponível no momento" />
        ) : (
          <View style={{ gap: 12 }}>
            {ativas.map((r) => {
              const l = loja(r.lojaId);
              const pode = usuario.saldoPontos >= r.pontosNecessarios;
              const prog = Math.min(1, usuario.saldoPontos / r.pontosNecessarios);
              return (
                <Card key={r.id} onPress={() => setSel(r)} style={{ padding: 14 }}>
                  <Row gap={12}>
                    <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: l.cor + '1A', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name={l.icone} size={26} color={l.cor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={type.small}>{l.nome}</Text>
                      <Text style={type.headline}>{r.titulo}</Text>
                      <Text style={type.small}>Válido até {dataCurta(r.validade)}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontWeight: '700', fontSize: 17, color: pode ? colors.brand : colors.inkSoft }}>{r.pontosNecessarios}</Text>
                      <Text style={type.small}>pts</Text>
                    </View>
                  </Row>
                  {!pode && (
                    <View style={{ marginTop: 10 }}>
                      <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.brandSoft, overflow: 'hidden' }}>
                        <View style={{ width: `${prog * 100}%`, height: '100%', backgroundColor: colors.brand }} />
                      </View>
                      <Text style={[type.small, { marginTop: 4 }]}>Faltam {r.pontosNecessarios - usuario.saldoPontos} pts</Text>
                    </View>
                  )}
                </Card>
              );
            })}
          </View>
        )
      ) : cupons.length === 0 ? (
        <Empty icon="ticket-outline" title="Você ainda não resgatou cupons" text="Troque seus pontos na aba Descontos." />
      ) : (
        <View style={{ gap: 12 }}>
          {cupons.map((c) => {
            const r = db.recompensas.find((x) => x.id === c.recompensaId)!;
            const l = loja(r.lojaId);
            return (
              <Card key={c.id} style={{ padding: 0, overflow: 'hidden', opacity: c.status === 'pendente' ? 1 : 0.6 }}>
                <Row style={{ padding: 14 }} gap={12}>
                  <Icon name={l.icone} size={26} color={l.cor} />
                  <View style={{ flex: 1 }}>
                    <Text style={type.headline}>{r.titulo}</Text>
                    <Text style={type.small}>
                      {l.nome} · resgatado em {dataCurta(c.dataResgate)}
                    </Text>
                  </View>
                  <Pill label={c.status === 'pendente' ? 'Disponível' : c.status === 'utilizado' ? 'Utilizado' : 'Expirado'} color={c.status === 'pendente' ? colors.brand : colors.muted} />
                </Row>
                <Row style={{ borderTopWidth: 1.5, borderStyle: 'dashed', borderColor: colors.line, padding: 14, justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 20, fontWeight: '700', letterSpacing: 2, color: colors.ink }}>{c.codigo}</Text>
                  {c.status === 'pendente' && <Button title="Usei" small variant="secondary" onPress={() => marcarUtilizado(c.id)} />}
                </Row>
              </Card>
            );
          })}
        </View>
      )}

      <Modal visible={!!sel} transparent animationType="slide" onRequestClose={fechar}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} onPress={fechar} />
        {sel && (
          <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: spacing.xl, paddingBottom: insets.bottom + spacing.xl }}>
            {codigo ? (
              <View style={{ alignItems: 'center', gap: 10 }}>
                <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="check-bold" size={40} color={colors.ink} />
                </View>
                <Text style={type.title}>Desconto resgatado!</Text>
                <Text style={[type.body, { textAlign: 'center' }]}>
                  Apresente este código na {loja(sel.lojaId).nome} até {dataCurta(sel.validade)}.
                </Text>
                <View style={{ borderWidth: 2, borderStyle: 'dashed', borderColor: colors.brand, borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: 24, marginVertical: 8 }}>
                  <Text style={{ fontSize: 28, fontWeight: '700', letterSpacing: 3, color: colors.ink }}>{codigo}</Text>
                </View>
                <Text style={type.small}>Novo saldo: {usuario.saldoPontos.toLocaleString('pt-BR')} pts</Text>
                <Button title="Concluir" style={{ alignSelf: 'stretch', marginTop: 8 }} onPress={() => { fechar(); setAba('cupons'); }} />
              </View>
            ) : (
              <>
                <Row gap={12}>
                  <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: loja(sel.lojaId).cor + '1A', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={loja(sel.lojaId).icone} size={28} color={loja(sel.lojaId).cor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={type.small}>{loja(sel.lojaId).nome} · {loja(sel.lojaId).categoria}</Text>
                    <Text style={type.title}>{sel.titulo}</Text>
                  </View>
                </Row>
                <Text style={[type.body, { marginTop: spacing.lg }]}>{sel.descricao}</Text>
                <View style={{ backgroundColor: colors.bg, borderRadius: radius.md, padding: spacing.lg, marginTop: spacing.lg, gap: 8 }}>
                  {[
                    ['Pontos necessários', `${sel.pontosNecessarios} pts`],
                    ['Seu saldo', `${usuario.saldoPontos} pts`],
                    ['Saldo após a troca', `${Math.max(0, usuario.saldoPontos - sel.pontosNecessarios)} pts`],
                    ['Validade', dataCurta(sel.validade)],
                  ].map(([k, v]) => (
                    <Row key={k} style={{ justifyContent: 'space-between' }}>
                      <Text style={type.body}>{k}</Text>
                      <Text style={{ fontWeight: '600', color: colors.ink }}>{v}</Text>
                    </Row>
                  ))}
                </View>
                {usuario.saldoPontos < sel.pontosNecessarios && (
                  <Text style={{ color: colors.danger, fontWeight: '700', marginTop: spacing.md }}>
                    Saldo insuficiente: faltam {sel.pontosNecessarios - usuario.saldoPontos} pontos.
                  </Text>
                )}
                <Button title="Confirmar troca" icon="swap-horizontal" style={{ marginTop: spacing.xl }} disabled={usuario.saldoPontos < sel.pontosNecessarios} onPress={confirmar} />
                <Button title="Cancelar" variant="secondary" style={{ marginTop: 10 }} onPress={fechar} />
              </>
            )}
          </View>
        )}
      </Modal>
    </Screen>
  );
}
