import React, { useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';

import { Button, Field, Header, Icon, ListGroup, ListItem, Screen } from '@/components/ui';
import { alerta } from '@/lib/alerta';
import { dataCurta, hora } from '@/lib/util';
import { FATOR_TEMPO_DEMO, RAIO_CHECKIN_M, useDB } from '@/store/AppStore';
import { colors, radius, spacing, type, type PreferenciaTema } from '@/theme';

const TEMAS: { value: PreferenciaTema; label: string; icon: string }[] = [
  { value: 'claro', label: 'Claro', icon: 'sun' },
  { value: 'escuro', label: 'Escuro', icon: 'moon' },
  { value: 'sistema', label: 'Automático', icon: 'phone' },
];

function Rotulo({ children }: { children: string }) {
  return <Text style={[type.caption, { marginTop: spacing.xxl, marginBottom: 8, marginLeft: 16 }]}>{children}</Text>;
}

function Nota({ children }: { children: React.ReactNode }) {
  return <Text style={[type.small, { marginTop: 8, marginHorizontal: 16 }]}>{children}</Text>;
}

export default function Configuracoes() {
  const { db, usuario, posicao, tema, definirTema, concederConsentimento, revogarConsentimento, alternarModoDemo, atualizarPerfil, resetarDados, sair } = useDB();
  const [nome, setNome] = useState(usuario.nome);
  const [bio, setBio] = useState(usuario.bio ?? '');
  const [telefone, setTelefone] = useState(usuario.telefone ?? '');
  const c = db.consentimento;
  const concedido = c.status === 'concedido';

  return (
    <Screen header={<Header title="Ajustes" />}>
      <Rotulo>Aparência</Rotulo>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {TEMAS.map((t) => {
          const sel = tema === t.value;
          return (
            <Pressable
              key={t.value}
              onPress={() => definirTema(t.value)}
              style={{ flex: 1, alignItems: 'center', gap: 8, paddingVertical: 16, borderRadius: radius.lg, backgroundColor: colors.card, borderWidth: 2, borderColor: sel ? colors.brand : 'transparent' }}
            >
              <Icon name={t.icon} size={24} color={sel ? colors.brand : colors.ink} />
              <Text style={{ fontSize: 14, fontWeight: sel ? '600' : '400', color: colors.ink }}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Nota>Automático segue o modo claro/escuro do iPhone.</Nota>

      <Rotulo>Perfil</Rotulo>
      <Field placeholder="Nome" value={nome} onChangeText={setNome} maxLength={100} />
      <Field placeholder="Bio" value={bio} onChangeText={setBio} maxLength={140} />
      <Field placeholder="Telefone (opcional)" value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" />
      <Button
        title="Salvar"
        variant="secondary"
        onPress={() => {
          atualizarPerfil({ nome: nome.trim() || usuario.nome, bio: bio.trim(), telefone: telefone.trim() || undefined });
          alerta('Perfil atualizado');
        }}
      />

      <Rotulo>Privacidade</Rotulo>
      <ListGroup>
        <ListItem
          icon="map-marker-outline"
          title="Localização"
          subtitle="Quadras próximas, sessões e check-in"
          right={
            <Switch
              value={concedido}
              trackColor={{ true: colors.brand, false: colors.fill }}
              onValueChange={async (v) => {
                if (v) {
                  const r = await concederConsentimento();
                  if (!r.ok) alerta('Não foi possível', r.erro);
                } else {
                  alerta('Revogar consentimento?', 'Paramos de coletar sua localização. Um check-in ativo será encerrado e os pontos do período válido serão creditados.', [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Revogar', style: 'destructive', onPress: revogarConsentimento },
                  ]);
                }
              }}
            />
          }
        />
        <ListItem title="Status" value={c.status === 'concedido' ? 'Concedido' : c.status === 'revogado' ? 'Revogado' : 'Não solicitado'} />
        {c.data ? <ListItem title="Registrado em" value={`${dataCurta(c.data)} ${hora(c.data)}`} /> : null}
        <ListItem title="Versão do termo" value={c.versaoTermo} />
      </ListGroup>
      <Nota>
        LGPD (Lei 13.709/2018).{posicao ? ` Última posição: ${posicao.latitude.toFixed(4)}, ${posicao.longitude.toFixed(4)}.` : ''}
      </Nota>

      <Rotulo>Teste</Rotulo>
      <ListGroup>
        <ListItem
          icon="flask-outline"
          title="Modo demonstração"
          right={<Switch value={db.modoDemo} onValueChange={alternarModoDemo} trackColor={{ true: colors.brand, false: colors.fill }} />}
        />
      </ListGroup>
      <Nota>
        Ligado: check-in longe da quadra (simulado), tempo {FATOR_TEMPO_DEMO}x mais rápido e atletas fictícios respondendo. Desligado: check-in só a até {RAIO_CHECKIN_M} m. A
        “Quadra Teste Koorta” fica onde você ativou a localização pela primeira vez.
      </Nota>

      <Rotulo>Dados</Rotulo>
      <ListGroup>
        <ListItem
          icon="restore"
          title="Restaurar dados de exemplo"
          onPress={() =>
            alerta('Restaurar tudo?', 'Apaga contas, check-ins e pontos deste aparelho.', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Restaurar', style: 'destructive', onPress: () => resetarDados() },
            ])
          }
        />
        <ListItem icon="logout" title="Sair da conta" destructive chevron={false} onPress={sair} />
      </ListGroup>
      <Text style={[type.small, { textAlign: 'center', marginTop: spacing.xxl }]}>Koorta · protótipo v1.1</Text>
    </Screen>
  );
}
