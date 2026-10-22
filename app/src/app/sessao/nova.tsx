import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fotoPrincipal } from '@/components/cards';
import { Button, Card, Chip, Header, Icon, Row, Screen } from '@/components/ui';
import type { Nivel } from '@/data/types';
import { alerta } from '@/lib/alerta';
import { esporteDe, quadraDe } from '@/lib/selectors';
import { distanciaMetros, formatDistancia, hora, minutosDoDia, NIVEL_LABEL, pad, rotuloDia } from '@/lib/util';
import { useDB } from '@/store/AppStore';
import { colors, radius, spacing, type } from '@/theme';

const DURACOES = [60, 90, 120];
const NIVEIS: (Nivel | 'todos')[] = ['todos', 'iniciante', 'intermediario', 'avancado'];

export default function NovaSessao() {
  const insets = useSafeAreaInsets();
  const { quadra: quadraParam } = useLocalSearchParams<{ quadra?: string }>();
  const { db, referencia, criarSessao } = useDB();

  const [quadraId, setQuadraId] = useState<string | null>(quadraParam ?? null);
  const [esporteId, setEsporteId] = useState<string | null>(null);
  const [dia, setDia] = useState<number | null>(null);
  const [horaSel, setHoraSel] = useState<string | null>(null);
  const [dur, setDur] = useState(90);
  const [max, setMax] = useState(10);
  const [nivel, setNivel] = useState<Nivel | 'todos'>('todos');
  const [vis, setVis] = useState<'publica' | 'privada'>('publica');
  const [descricao, setDescricao] = useState('');
  const [confirmando, setConfirmando] = useState(false);
  const [erros, setErros] = useState<string[]>([]);

  const quadra = quadraId ? quadraDe(db, quadraId) : undefined;
  const quadras = useMemo(
    () => db.quadras.filter((q) => q.estaAtivo).sort((a, b) => distanciaMetros(referencia, a) - distanciaMetros(referencia, b)),
    [db.quadras, referencia],
  );

  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    d.setHours(12, 0, 0, 0);
    return d;
  });

  // Horários de meia em meia hora dentro do funcionamento da quadra e no futuro
  const horarios = useMemo(() => {
    if (!quadra || dia === null) return [];
    const ini = minutosDoDia(quadra.horarioAbertura);
    const fim = minutosDoDia(quadra.horarioFechamento) - 60;
    const lista: string[] = [];
    const agoraMin = new Date().getHours() * 60 + new Date().getMinutes();
    for (let m = Math.ceil(ini / 30) * 30; m <= fim; m += 30) {
      if (dia === 0 && m <= agoraMin + 15) continue;
      lista.push(`${pad(Math.floor(m / 60))}:${pad(m % 60)}`);
    }
    return lista;
  }, [quadra, dia]);

  // UC05 FA2: trocar a quadra limpa os campos dependentes
  function escolherQuadra(id: string) {
    if (id !== quadraId) {
      setEsporteId(null);
      setDia(null);
      setHoraSel(null);
    }
    setQuadraId(id);
  }

  function datas() {
    const ini = new Date(dias[dia!]);
    const [h, m] = horaSel!.split(':').map(Number);
    ini.setHours(h, m, 0, 0);
    return { inicio: ini.toISOString(), termino: new Date(ini.getTime() + dur * 60000).toISOString() };
  }

  function revisar() {
    const e: string[] = [];
    if (!quadraId) e.push('quadra');
    if (!esporteId) e.push('esporte');
    if (dia === null) e.push('dia');
    if (!horaSel) e.push('hora');
    setErros(e);
    if (e.length === 0) setConfirmando(true);
  }

  function confirmar() {
    const r = criarSessao({
      quadraId: quadraId!, esporteId: esporteId!, ...datas(), visibilidade: vis, maxParticipantes: max, nivel,
      descricao: descricao.trim() || undefined,
    });
    if (!r.ok) {
      setConfirmando(false);
      alerta('Não foi possível criar', r.erro);
      return;
    }
    router.replace(`/sessao/${r.valor}?criada=1`);
  }

  const marcaErro = (k: string) => (erros.includes(k) ? { color: colors.danger } : undefined);

  if (confirmando && quadra) {
    const esp = esporteDe(db, esporteId!)!;
    const { inicio, termino } = datas();
    return (
      <Screen header={<Header title="Confirmar sessão" onBack={() => setConfirmando(false)} />}>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <Image source={{ uri: fotoPrincipal(quadra) }} style={{ height: 150 }} contentFit="cover" />
          <View style={{ padding: spacing.lg, gap: 12 }}>
            <Row gap={8}>
              <Icon name={esp.icone} color={colors.brand} />
              <Text style={type.title}>{esp.nome}</Text>
            </Row>
            {[
              ['map-marker-outline', quadra.nome],
              ['calendar', rotuloDia(inicio)],
              ['clock-outline', `${hora(inicio)} – ${hora(termino)}`],
              ['account-multiple-outline', `Até ${max} participantes`],
              ['signal-cellular-2', NIVEL_LABEL[nivel]],
              [vis === 'publica' ? 'earth' : 'lock-outline', vis === 'publica' ? 'Pública · visível a até 20 km' : 'Privada · só por convite'],
            ].map(([i, t]) => (
              <Row key={i} gap={10}>
                <Icon name={i} size={20} color={colors.muted} />
                <Text style={type.body}>{t}</Text>
              </Row>
            ))}
            {!!descricao.trim() && <Text style={[type.body, { fontStyle: 'italic' }]}>“{descricao.trim()}”</Text>}
          </View>
        </Card>
        <Button title="Confirmar e criar" icon="check" style={{ marginTop: spacing.xl }} onPress={confirmar} />
        <Button title="Editar dados" variant="secondary" style={{ marginTop: spacing.md }} onPress={() => setConfirmando(false)} />
      </Screen>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <Header title="Nova sessão de jogo" onBack={() => router.back()} right={<Text onPress={() => router.back()} style={{ color: colors.muted, fontWeight: '700' }}>Cancelar</Text>} />
      <ScrollView contentContainerStyle={{ paddingBottom: 120 + insets.bottom }} keyboardShouldPersistTaps="handled">
        <Text style={[type.caption, { marginHorizontal: spacing.xl, marginTop: spacing.md }, marcaErro('quadra')]}>1 · Quadra</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: spacing.xl, paddingVertical: spacing.md }}>
          {quadras.map((q) => {
            const sel = q.id === quadraId;
            return (
              <Pressable key={q.id} onPress={() => escolherQuadra(q.id)} style={{ width: 150, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.card, borderWidth: 2.5, borderColor: sel ? colors.brand : 'transparent' }}>
                <Image source={{ uri: fotoPrincipal(q) }} style={{ height: 80 }} contentFit="cover" />
                {sel && (
                  <View style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="check" size={16} color={colors.white} />
                  </View>
                )}
                <View style={{ padding: 8 }}>
                  <Text style={{ fontWeight: '600', color: colors.ink, fontSize: 13 }} numberOfLines={1}>{q.nome}</Text>
                  <Text style={type.small}>{formatDistancia(distanciaMetros(referencia, q))}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md }}>
          <Text style={[type.caption, marcaErro('esporte')]}>2 · Esporte</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, opacity: quadra ? 1 : 0.4 }}>
            {(quadra?.esportes ?? []).map((e) => {
              const esp = esporteDe(db, e)!;
              return <Chip key={e} label={esp.nome} icon={esp.icone} selected={esporteId === e} onPress={() => setEsporteId(e)} />;
            })}
            {!quadra && <Text style={type.small}>Escolha uma quadra primeiro</Text>}
          </View>

          <Text style={[type.caption, { marginTop: spacing.md }, marcaErro('dia')]}>3 · Dia</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -spacing.xl }} contentContainerStyle={{ gap: 8, paddingHorizontal: spacing.xl }}>
            {dias.map((d, i) => {
              const sel = dia === i;
              const rot = rotuloDia(d.toISOString());
              return (
                <Pressable
                  key={i}
                  disabled={!esporteId}
                  onPress={() => {
                    setDia(i);
                    setHoraSel(null);
                  }}
                  style={{ width: 64, paddingVertical: 10, borderRadius: radius.md, alignItems: 'center', backgroundColor: sel ? colors.inverse : colors.card, opacity: esporteId ? 1 : 0.4, borderWidth: 1, borderColor: sel ? colors.ink : colors.line }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '600', color: sel ? colors.brand : colors.muted, textTransform: 'uppercase' }}>{rot.split(',')[0]}</Text>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: sel ? colors.white : colors.ink }}>{d.getDate()}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={[type.caption, { marginTop: spacing.md }, marcaErro('hora')]}>4 · Horário de início</Text>
          {dia === null ? (
            <Text style={type.small}>Escolha o dia</Text>
          ) : horarios.length === 0 ? (
            <Text style={type.small}>Sem horários disponíveis neste dia.</Text>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {horarios.map((h) => (
                <Chip key={h} label={h} selected={horaSel === h} onPress={() => setHoraSel(h)} style={{ paddingHorizontal: 12 }} />
              ))}
            </View>
          )}

          <Text style={[type.caption, { marginTop: spacing.md }]}>Duração</Text>
          <Row>
            {DURACOES.map((d) => (
              <Chip key={d} label={d === 60 ? '1h' : d === 90 ? '1h30' : '2h'} selected={dur === d} onPress={() => setDur(d)} />
            ))}
          </Row>

          <Text style={[type.caption, { marginTop: spacing.md }]}>Máximo de participantes</Text>
          <Row gap={16}>
            <Pressable onPress={() => setMax(Math.max(2, max - 1))} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line }}>
              <Icon name="minus" />
            </Pressable>
            <Text style={{ fontSize: 26, fontWeight: '700', minWidth: 40, textAlign: 'center', color: colors.ink }}>{max}</Text>
            <Pressable onPress={() => setMax(Math.min(30, max + 1))} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line }}>
              <Icon name="plus" />
            </Pressable>
          </Row>

          <Text style={[type.caption, { marginTop: spacing.md }]}>Nível</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {NIVEIS.map((n) => (
              <Chip key={n} label={NIVEL_LABEL[n]} selected={nivel === n} onPress={() => setNivel(n)} />
            ))}
          </View>

          <Text style={[type.caption, { marginTop: spacing.md }]}>Visibilidade</Text>
          <Row>
            <Chip label="Pública" icon="earth" selected={vis === 'publica'} onPress={() => setVis('publica')} />
            <Chip label="Privada" icon="lock-outline" selected={vis === 'privada'} onPress={() => setVis('privada')} />
          </Row>

          <Text style={[type.caption, { marginTop: spacing.md }]}>Recado para a galera (opcional)</Text>
          <TextInput
            value={descricao}
            onChangeText={setDescricao}
            placeholder="Ex.: traga colete escuro"
            placeholderTextColor={colors.muted}
            multiline
            maxLength={300}
            style={{ minHeight: 70, borderRadius: radius.md, backgroundColor: colors.card, padding: 12, fontSize: 15, color: colors.ink, borderWidth: 1, borderColor: colors.line, textAlignVertical: 'top' }}
          />
          {erros.length > 0 && <Text style={{ color: colors.danger, fontWeight: '700' }}>Preencha os campos destacados em vermelho.</Text>}
        </View>
      </ScrollView>
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.lg, paddingBottom: insets.bottom + spacing.md, backgroundColor: colors.card, borderTopWidth: 1, borderColor: colors.line }}>
        <Button title="Revisar sessão" icon="arrow-right" onPress={revisar} />
      </View>
    </View>
  );
}
