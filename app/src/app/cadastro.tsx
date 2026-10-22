import { router } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';

import { Button, Chip, Field, Header, Icon, Row, Screen } from '@/components/ui';
import { ESPORTES } from '@/data/seed';
import type { Nivel, TipoPerfil } from '@/data/types';
import { emailValido, NIVEL_LABEL } from '@/lib/util';
import { useApp } from '@/store/AppStore';
import { colors, radius, spacing, type } from '@/theme';

const PERFIS: { id: TipoPerfil; label: string; icon: string; desc: string }[] = [
  { id: 'atleta', label: 'Atleta', icon: 'run', desc: 'Quero jogar, encontrar quadras e pessoas' },
  { id: 'admin_quadra', label: 'Administro uma quadra', icon: 'stadium-variant', desc: 'Gerencio um espaço esportivo' },
  { id: 'loja_parceira', label: 'Loja parceira', icon: 'storefront-outline', desc: 'Quero oferecer descontos aos atletas' },
];
const NIVEIS: Nivel[] = ['iniciante', 'intermediario', 'avancado'];

function mascaraData(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

function dataValida(s: string) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
  if (!m) return false;
  const [d, mo, a] = [+m[1], +m[2], +m[3]];
  const dt = new Date(a, mo - 1, d);
  return dt.getDate() === d && dt.getMonth() === mo - 1 && a > 1900 && dt < new Date();
}

export default function Cadastro() {
  const { cadastrar, concederConsentimento } = useApp();
  const [passo, setPasso] = useState(0);
  const [f, setF] = useState({ nome: '', email: '', senha: '', nascimento: '', cidade: '', estado: 'SP' });
  const [erros, setErros] = useState<Record<string, string>>({});
  const [perfil, setPerfil] = useState<TipoPerfil>('atleta');
  const [esportes, setEsportes] = useState<Record<string, Nivel>>({});
  const [erroGeral, setErroGeral] = useState('');
  const [carregando, setCarregando] = useState(false);

  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: k === 'nascimento' ? mascaraData(v) : v }));

  function validarPasso1() {
    const e: Record<string, string> = {};
    if (!f.nome.trim()) e.nome = 'Informe seu nome';
    if (!emailValido(f.email)) e.email = 'E-mail inválido';
    if (f.senha.length < 6) e.senha = 'Mínimo de 6 caracteres';
    if (!dataValida(f.nascimento)) e.nascimento = 'Use o formato dd/mm/aaaa';
    if (!f.cidade.trim()) e.cidade = 'Informe sua cidade';
    if (!/^[A-Za-z]{2}$/.test(f.estado.trim())) e.estado = 'UF';
    setErros(e);
    return Object.keys(e).length === 0;
  }

  async function finalizar(comLocalizacao: boolean) {
    setCarregando(true);
    setErroGeral('');
    const r = await cadastrar({
      nome: f.nome,
      email: f.email,
      senha: f.senha,
      dataNascimento: f.nascimento,
      cidade: f.cidade,
      estado: f.estado.toUpperCase(),
      tipoPerfil: perfil,
      esportes: Object.entries(esportes).map(([esporteId, nivel]) => ({ esporteId, nivel })),
    });
    if (!r.ok) {
      setCarregando(false);
      setErroGeral(r.erro);
      setPasso(0);
      return;
    }
    if (comLocalizacao) await concederConsentimento();
    setCarregando(false);
  }

  const titulos = ['Seus dados', 'Seus esportes', 'Sua localização'];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen header={<Header title={`Criar conta · ${passo + 1}/3`} onBack={() => (passo ? setPasso(passo - 1) : router.back())} />}>
        <Row gap={6} style={{ marginBottom: spacing.xl }}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: i <= passo ? colors.brand : colors.line }} />
          ))}
        </Row>
        <Text style={[type.largeTitle, { marginBottom: spacing.lg }]}>{titulos[passo]}</Text>
        {!!erroGeral && <Text style={{ color: colors.danger, marginBottom: spacing.md, fontWeight: '700' }}>{erroGeral}</Text>}

        {passo === 0 && (
          <>
            <Field label="Nome" icon="account-outline" value={f.nome} onChangeText={set('nome')} error={erros.nome} maxLength={100} />
            <Field label="E-mail" icon="email-outline" value={f.email} onChangeText={set('email')} autoCapitalize="none" keyboardType="email-address" error={erros.email} />
            <Field label="Senha" icon="lock-outline" value={f.senha} onChangeText={set('senha')} secureTextEntry error={erros.senha} />
            <Field label="Data de nascimento" icon="cake-variant-outline" value={f.nascimento} onChangeText={set('nascimento')} placeholder="dd/mm/aaaa" keyboardType="number-pad" error={erros.nascimento} />
            <Row gap={10} style={{ alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Field label="Cidade" icon="city-variant-outline" value={f.cidade} onChangeText={set('cidade')} error={erros.cidade} />
              </View>
              <View style={{ width: 90 }}>
                <Field label="UF" value={f.estado} onChangeText={set('estado')} autoCapitalize="characters" maxLength={2} error={erros.estado} />
              </View>
            </Row>
            <Button title="Continuar" icon="arrow-right" onPress={() => validarPasso1() && setPasso(1)} style={{ marginTop: spacing.sm }} />
          </>
        )}

        {passo === 1 && (
          <>
            <Text style={[type.caption, { marginBottom: spacing.sm }]}>Tipo de perfil</Text>
            <View style={{ gap: 10, marginBottom: spacing.xl }}>
              {PERFIS.map((p) => {
                const sel = perfil === p.id;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => setPerfil(p.id)}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.md,
                      backgroundColor: sel ? colors.brandSoft : colors.card, borderWidth: 1.5, borderColor: sel ? colors.brand : colors.line,
                    }}
                  >
                    <Icon name={p.icon} size={24} color={sel ? colors.ink : colors.muted} />
                    <View style={{ flex: 1 }}>
                      <Text style={type.headline}>{p.label}</Text>
                      <Text style={type.small}>{p.desc}</Text>
                    </View>
                    <Icon name={sel ? 'radiobox-marked' : 'radiobox-blank'} color={sel ? colors.brand : colors.line} />
                  </Pressable>
                );
              })}
            </View>
            <Text style={[type.caption, { marginBottom: spacing.sm }]}>Quais esportes você pratica?</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {ESPORTES.map((e) => (
                <Chip
                  key={e.id}
                  label={e.nome}
                  icon={e.icone}
                  selected={!!esportes[e.id]}
                  onPress={() =>
                    setEsportes((p) => {
                      const n = { ...p };
                      if (n[e.id]) delete n[e.id];
                      else n[e.id] = 'iniciante';
                      return n;
                    })
                  }
                />
              ))}
            </View>
            {Object.keys(esportes).length > 0 && (
              <View style={{ marginTop: spacing.xl, gap: 12 }}>
                <Text style={type.caption}>Seu nível</Text>
                {Object.entries(esportes).map(([id, nivel]) => (
                  <View key={id}>
                    <Text style={[type.headline, { marginBottom: 6 }]}>{ESPORTES.find((e) => e.id === id)?.nome}</Text>
                    <Row gap={6}>
                      {NIVEIS.map((n) => (
                        <Chip key={n} label={NIVEL_LABEL[n]} selected={nivel === n} onPress={() => setEsportes((p) => ({ ...p, [id]: n }))} />
                      ))}
                    </Row>
                  </View>
                ))}
              </View>
            )}
            <Button title="Continuar" icon="arrow-right" onPress={() => setPasso(2)} style={{ marginTop: spacing.xxl }} />
          </>
        )}

        {passo === 2 && (
          <>
            <View style={{ alignItems: 'center', marginVertical: spacing.lg }}>
              <View style={{ width: 110, height: 110, borderRadius: 55, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="map-marker-radius" size={56} color={colors.brand} />
              </View>
            </View>
            <Text style={[type.body, { marginBottom: spacing.md }]}>
              Para mostrar <Text style={{ fontWeight: '600', color: colors.ink }}>quadras e sessões próximas</Text> e{' '}
              <Text style={{ fontWeight: '600', color: colors.ink }}>validar seu check-in</Text>, o Koorta precisa da sua localização.
            </Text>
            <View style={{ backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.lg, gap: 8, marginBottom: spacing.xl }}>
              {[
                'Usamos a localização só enquanto o app está aberto.',
                'Você pode revogar quando quiser em Configurações.',
                'Perfil e Koorta’s funcionam mesmo sem localização.',
              ].map((t) => (
                <Row key={t} gap={8} style={{ alignItems: 'flex-start' }}>
                  <Icon name="shield-check-outline" size={18} color={colors.brand} />
                  <Text style={[type.body, { flex: 1, fontSize: 14 }]}>{t}</Text>
                </Row>
              ))}
              <Text style={[type.small, { marginTop: 4 }]}>Termo de consentimento v1.0 · LGPD (Lei 13.709/2018)</Text>
            </View>
            <Button title="Permitir localização e entrar" icon="crosshairs-gps" onPress={() => finalizar(true)} loading={carregando} />
            <Button title="Agora não" variant="secondary" style={{ marginTop: spacing.md }} onPress={() => finalizar(false)} disabled={carregando} />
          </>
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}
