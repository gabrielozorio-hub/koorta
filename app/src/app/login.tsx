import { router } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Logo } from '@/components/ui';
import { DEMO_EMAIL, DEMO_SENHA } from '@/data/seed';
import { useApp } from '@/store/AppStore';
import { colors, radius, spacing } from '@/theme';

// Tela de marca: fundo verde Koorta, logo preto, campos brancos
export default function Login() {
  const insets = useSafeAreaInsets();
  const { entrar } = useApp();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState<'form' | 'demo' | null>(null);

  async function submit(demo = false) {
    setErro('');
    setCarregando(demo ? 'demo' : 'form');
    const r = await entrar(demo ? DEMO_EMAIL : email, demo ? DEMO_SENHA : senha);
    setCarregando(null);
    if (!r.ok) setErro(r.erro);
  }

  const campo = {
    height: 52,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 16,
    fontSize: 17,
    color: colors.black,
  } as const;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.brand }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 72, paddingBottom: insets.bottom + 24, paddingHorizontal: spacing.xl }}
      >
        <Logo size={46} color={colors.black} />
        <Text style={{ color: colors.black, fontSize: 20, marginTop: 14, opacity: 0.75, lineHeight: 27 }}>
          Encontre quem joga,{'\n'}onde e quando.
        </Text>

        <View style={{ flex: 1, justifyContent: 'flex-end', gap: 10, marginTop: 56 }}>
          <TextInput style={campo} placeholder="E-mail" placeholderTextColor="#7B7B7B" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} selectionColor={colors.brand} />
          <TextInput style={campo} placeholder="Senha" placeholderTextColor="#7B7B7B" secureTextEntry value={senha} onChangeText={setSenha} onSubmitEditing={() => submit()} selectionColor={colors.brand} />
          {!!erro && <Text style={{ color: colors.black, fontWeight: '600', marginLeft: 4 }}>{erro}</Text>}
          <Button title="Entrar" variant="inverse" onPress={() => submit()} loading={carregando === 'form'} style={{ marginTop: 6, backgroundColor: colors.black }} />
          <Button title="Testar com conta demo" variant="light" onPress={() => submit(true)} loading={carregando === 'demo'} />
          <Text onPress={() => router.push('/cadastro')} style={{ textAlign: 'center', color: colors.black, fontSize: 17, fontWeight: '600', paddingVertical: 12 }}>
            Criar conta
          </Text>
          <Text style={{ textAlign: 'center', color: colors.black, opacity: 0.5, fontSize: 12, marginTop: 8 }}>Protótipo · dados salvos neste aparelho</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
