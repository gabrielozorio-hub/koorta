# Koorta — app mobile (protótipo funcional)

Rede social de esporte: quadras com nível de movimento, sessões de jogo, check-in com pontos, troca por descontos e vídeos educativos (Koorta's).

Feito com **Expo SDK 57 + React Native + Expo Router + TypeScript**. Roda em iOS e Android (RNF01).

## Testar no celular

1. Instale o app **Expo Go** (App Store / Play Store).
2. No PC, dentro desta pasta:
   ```bash
   npm install
   npx expo start
   ```
3. Leia o QR code: no Android pelo próprio Expo Go; no iPhone pela câmera.
   - PC e celular precisam estar **na mesma rede Wi‑Fi**.
   - Se não conectar (rede da faculdade, firewall), use `npx expo start --tunnel`.

> ⚠️ Não deixe o projeto dentro do OneDrive: ele transforma o `node_modules` em arquivos "na nuvem" e o Expo não consegue ler (o app fica carregando para sempre).

**Conta demo:** toque em “Testar com conta demo” (`demo@koorta.app` / `koorta123`), ou crie uma conta.

## O que dá para testar

| Caso de uso | Onde |
|---|---|
| Ver quadras, distância e movimento por horário | aba **Quadras** (mapa/lista) → tocar numa quadra |
| UC05 Criar sessão de jogo | **Sessões → Criar** (quadra → esporte → dia → horário → revisar) |
| UC10 Solicitar participação | abrir uma sessão → **Solicitar participação** |
| UC12 Check-in na quadra (raio de 5 m) | tela da quadra → **Fazer check-in** |
| UC14 Encerrar check-in e creditar pontos | faixa de check-in ativo → **Encerrar** (2 pts/min) |
| UC16 Trocar pontos por desconto | **Início → Trocar pontos** |
| Koorta's (curtir, comentar, salvar) | aba **Koorta's** |
| RNF04 Consentimento LGPD / revogação | **Perfil → Configurações** |

### Modo demonstração (ligado por padrão)
Em **Configurações → Modo demonstração**:
- check-in permitido mesmo longe da quadra (localização simulada);
- tempo do check-in acelerado 10x (6 s = 1 min);
- atletas fictícios aprovam seus pedidos e pedem para entrar nas suas sessões.

Desligado, o check-in exige estar a até 5 m. A **Quadra Teste Koorta** é criada exatamente onde você ativou a localização pela primeira vez — dá para testar o check-in real em casa.

## Observações
- Os dados ficam **só no aparelho** (AsyncStorage). Não há servidor ainda.
- Senhas são guardadas como hash SHA-256 com salt. No backend real, use bcrypt/scrypt/Argon2 (RNF03).
- A chave do Google Maps fica em `.env.local` (não vai para o Git) e só é usada em builds instaláveis. No Expo Go o mapa funciona sem ela.
- Vídeos: Mixkit (licença gratuita). Fotos: Unsplash.

## Estrutura
```
src/app/          telas (Expo Router)
src/components/   UI, tab bar animada, mapa (nativo e web)
src/data/         tipos (catálogo de requisitos) e dados de exemplo
src/store/        estado do app e regras de negócio
```

## Compartilhar com outras pessoas (publicado no Expo)

O app está publicado no canal `main` do projeto `@victorozorios-team/koorta`. Qualquer pessoa com o Expo Go abre por este link, sem login e sem o PC ligado:

```
exp://u.expo.dev/2ef83019-2c63-4066-94df-b6da41e10b89?runtime-version=exposdk%3A57.0.0&channel-name=main
```

Para publicar uma versão nova (todo mundo recebe ao reabrir o app):

```bash
npx eas-cli@latest update --branch main --message "descrição" --environment production
```
