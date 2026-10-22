import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, useColorScheme } from 'react-native';

import { ANCORA_PADRAO, BOTS, DEMO_EMAIL, DEMO_ID, DEMO_SENHA, criarDB, gerarQuadras } from '@/data/seed';
import type { Checkin, DB, ID, Nivel, SessaoJogo, TipoPerfil, Usuario } from '@/data/types';
import { aplicarTema, type Esquema, type PreferenciaTema } from '@/theme';
import { codigoResgate, distanciaMetros, emailValido, hashSenha, uid } from '@/lib/util';

const STORAGE_KEY = 'koorta:db:v1';

// Regras de negócio
export const PONTOS_POR_MINUTO = 2;
export const RAIO_CHECKIN_M = 5; // UC12
export const RAIO_SESSOES_KM = 20; // UC05 / UC10
export const FATOR_TEMPO_DEMO = 10; // no modo demo, 6 s contam como 1 min
export const BONUS_BOAS_VINDAS = 100;

type Coord = { latitude: number; longitude: number };
type Resultado<T = undefined> = { ok: true; valor?: T; aviso?: string } | { ok: false; erro: string };

const BOT_IDS = new Set(BOTS.map((b) => b.id));
const agora = () => new Date().toISOString();

// Sessões de exemplo que já passaram são empurradas para os próximos dias,
// assim o protótipo sempre tem jogos futuros para testar.
function renovarSessoesExemplo(db: DB): DB {
  const now = Date.now();
  let mudou = false;
  const sessoes = db.sessoes.map((s) => {
    if (!BOT_IDS.has(s.responsavelId) || new Date(s.termino).getTime() > now) return s;
    mudou = true;
    const dias = Math.ceil((now - new Date(s.inicio).getTime()) / 86400000);
    const ms = dias * 86400000;
    return {
      ...s,
      inicio: new Date(new Date(s.inicio).getTime() + ms).toISOString(),
      termino: new Date(new Date(s.termino).getTime() + ms).toISOString(),
    };
  });
  return mudou ? { ...db, sessoes } : db;
}

function useAppState() {
  const [db, setDb] = useState<DB | null>(null);
  const [posicao, setPosicao] = useState<Coord | null>(null);
  const [agoraTick, setAgoraTick] = useState(() => Date.now());
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Carrega do armazenamento local
  useEffect(() => {
    const pendentes = timers.current;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        setDb(renovarSessoesExemplo(raw ? (JSON.parse(raw) as DB) : criarDB()));
      } catch {
        setDb(criarDB());
      }
    })();
    return () => pendentes.forEach(clearTimeout);
  }, []);

  // Persiste a cada mudança
  useEffect(() => {
    if (db) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(db)).catch(() => {});
  }, [db]);

  // Relógio para cronômetros de check-in
  useEffect(() => {
    const t = setInterval(() => setAgoraTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Tema: preferência salva + esquema do sistema
  const sistema = useColorScheme();
  const tema: PreferenciaTema = db?.tema ?? 'sistema';
  const esquema: Esquema = tema === 'sistema' ? (sistema === 'dark' ? 'dark' : 'light') : tema === 'escuro' ? 'dark' : 'light';
  aplicarTema(esquema);

  const update = useCallback((fn: (d: DB) => DB) => setDb((d) => (d ? fn(d) : d)), []);

  const depois = useCallback((ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  const notificar = useCallback(
    (usuarioId: ID, texto: string, link?: string) =>
      update((d) => ({
        ...d,
        notificacoes: [{ id: uid('n_'), usuarioId, texto, link, data: agora(), lida: false }, ...d.notificacoes],
      })),
    [update],
  );

  const usuario = useMemo(
    () => db?.usuarios.find((u) => u.id === db.usuarioAtualId && u.estaAtivo),
    [db],
  );

  // ---------- Localização (RNF04) ----------
  const obterPosicao = useCallback(async (): Promise<Coord | null> => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') return null;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const c = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setPosicao(c);
      return c;
    } catch {
      return null;
    }
  }, []);

  // Na primeira localização real, as quadras de exemplo são posicionadas ao redor do usuário
  const ancorar = useCallback(
    (c: Coord) =>
      update((d) => {
        if (d.ancora.posicionada) return d;
        const novas = gerarQuadras(c);
        const ids = new Set(novas.map((q) => q.id));
        return {
          ...d,
          ancora: { ...c, posicionada: true },
          quadras: [...novas, ...d.quadras.filter((q) => !ids.has(q.id))],
        };
      }),
    [update],
  );

  useEffect(() => {
    if (db?.consentimento.status === 'concedido' && !posicao) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- busca assíncrona do GPS
      obterPosicao().then((c) => c && ancorar(c));
    }
  }, [db?.consentimento.status, posicao, obterPosicao, ancorar]);

  const concederConsentimento = useCallback(async (): Promise<Resultado> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return { ok: false, erro: 'Permissão de localização negada no sistema. Libere nas configurações do celular.' };
      }
    } catch {
      return { ok: false, erro: 'Não foi possível solicitar a localização neste dispositivo.' };
    }
    update((d) => ({ ...d, consentimento: { status: 'concedido', data: agora(), versaoTermo: '1.0' } }));
    const c = await obterPosicao();
    if (c) ancorar(c);
    return { ok: true };
  }, [update, obterPosicao, ancorar]);

  // ---------- Pontos ----------
  const creditar = (d: DB, usuarioId: ID, qtd: number, tipo: 'ganho_checkin' | 'bonus', descricao: string, checkinId?: ID): DB => ({
    ...d,
    usuarios: d.usuarios.map((u) => (u.id === usuarioId ? { ...u, saldoPontos: u.saldoPontos + qtd } : u)),
    transacoes: [
      { id: uid('t_'), usuarioId, checkinId, tipo, quantidadePontos: qtd, descricao, data: agora(), estaAtivo: true },
      ...d.transacoes,
    ],
  });

  // ---------- Check-in (UC12 / UC14) ----------
  const checkinAtivo = useMemo(
    () => db?.checkins.find((c) => c.usuarioId === usuario?.id && c.estaAtivo),
    [db, usuario],
  );

  const minutosValidos = useCallback(
    (c: Checkin, fim = Date.now()) => {
      const ms = fim - new Date(c.dataHora).getTime();
      return Math.floor((ms * (db?.modoDemo ? FATOR_TEMPO_DEMO : 1)) / 60000);
    },
    [db?.modoDemo],
  );

  const encerrarCheckin = useCallback((): Resultado<{ quadraId: ID; minutos: number; pontos: number }> => {
    if (!db || !usuario) return { ok: false, erro: 'Faça login novamente.' };
    const c = db.checkins.find((x) => x.usuarioId === usuario.id && x.estaAtivo);
    if (!c) return { ok: false, erro: 'Nenhum check-in ativo.' };
    const minutos = minutosValidos(c);
    const pontos = minutos * PONTOS_POR_MINUTO;
    const quadra = db.quadras.find((q) => q.id === c.quadraId);
    update((d) => {
      let nd: DB = {
        ...d,
        checkins: d.checkins.map((x) => (x.id === c.id ? { ...x, estaAtivo: false, fim: agora() } : x)),
      };
      if (pontos > 0) nd = creditar(nd, usuario.id, pontos, 'ganho_checkin', `Check-in · ${quadra?.nome ?? 'quadra'}`, c.id);
      return nd;
    });
    return {
      ok: true,
      valor: { quadraId: c.quadraId, minutos, pontos },
      aviso: minutos < 1 ? 'Tempo insuficiente para pontuar.' : undefined,
    };
  }, [db, usuario, minutosValidos, update]);

  const revogarConsentimento = useCallback(() => {
    // UC14 FA2: encerra o check-in ativo creditando o período válido
    if (checkinAtivo) encerrarCheckin();
    update((d) => ({ ...d, consentimento: { status: 'revogado', data: agora(), versaoTermo: '1.0' } }));
    setPosicao(null);
  }, [checkinAtivo, encerrarCheckin, update]);

  const fazerCheckin = useCallback(
    async (quadraId: ID): Promise<Resultado<{ distancia: number; simulado: boolean }>> => {
      if (!db || !usuario) return { ok: false, erro: 'Faça login novamente.' };
      const ativo = db.checkins.find((c) => c.usuarioId === usuario.id && c.estaAtivo);
      if (ativo) {
        const q = db.quadras.find((x) => x.id === ativo.quadraId);
        return { ok: false, erro: `Você já tem um check-in ativo em ${q?.nome}. Encerre-o antes.` };
      }
      const quadra = db.quadras.find((q) => q.id === quadraId && q.estaAtivo);
      if (!quadra) return { ok: false, erro: 'Quadra indisponível.' };
      if (db.consentimento.status !== 'concedido') {
        return { ok: false, erro: 'CONSENTIMENTO' };
      }
      const pos = await obterPosicao();
      let simulado = false;
      let distancia = pos ? distanciaMetros(pos, quadra) : Infinity;
      if (!pos && !db.modoDemo) {
        return { ok: false, erro: 'Não conseguimos sua localização. Verifique o GPS e tente novamente.' };
      }
      if (distancia > RAIO_CHECKIN_M) {
        if (!db.modoDemo) {
          return { ok: false, erro: `Você precisa estar a até ${RAIO_CHECKIN_M} metros da quadra para fazer check-in. Você está a ${Math.round(distancia)} m.` };
        }
        simulado = true;
      }
      const coord = simulado || !pos ? { latitude: quadra.latitude, longitude: quadra.longitude } : pos;
      update((d) => ({
        ...d,
        checkins: [
          { id: uid('ck_'), usuarioId: usuario.id, quadraId, dataHora: agora(), ...coord, estaAtivo: true },
          ...d.checkins,
        ],
      }));
      return { ok: true, valor: { distancia, simulado } };
    },
    [db, usuario, obterPosicao, update],
  );

  // ---------- Conta ----------
  const garantirDemo = useCallback(async () => {
    const salt = 'demo-salt';
    const senhaHash = await hashSenha(DEMO_SENHA, salt);
    update((d) => {
      if (d.usuarios.some((u) => u.id === DEMO_ID)) return { ...d, usuarioAtualId: DEMO_ID };
      const u: Usuario = {
        id: DEMO_ID, nome: 'Victor', email: DEMO_EMAIL, senhaHash, senhaSalt: salt,
        dataNascimento: '15/03/2003', tipoPerfil: 'atleta', pais: 'Brasil', estado: 'SP', cidade: 'São Paulo',
        saldoPontos: 0, bio: 'Bora jogar! ⚽🏀', estaAtivo: true,
      };
      let nd: DB = {
        ...d,
        usuarioAtualId: DEMO_ID,
        usuarios: [...d.usuarios, u],
        usuarioEsportes: [
          ...d.usuarioEsportes,
          { usuarioId: DEMO_ID, esporteId: 'e_futebol', nivelHabilidade: 'intermediario', tempoPratica: 48, ePreferencia: true, estaAtivo: true },
          { usuarioId: DEMO_ID, esporteId: 'e_basquete', nivelHabilidade: 'iniciante', tempoPratica: 6, ePreferencia: true, estaAtivo: true },
        ],
      };
      nd = creditar(nd, DEMO_ID, 250, 'bonus', 'Bônus de boas-vindas');
      return nd;
    });
  }, [update]);

  const entrar = useCallback(
    async (email: string, senha: string): Promise<Resultado> => {
      if (!db) return { ok: false, erro: 'Carregando…' };
      const e = email.trim().toLowerCase();
      if (e === DEMO_EMAIL && senha === DEMO_SENHA) {
        await garantirDemo();
        return { ok: true };
      }
      const u = db.usuarios.find((x) => x.email === e && x.estaAtivo && x.senhaSalt);
      if (!u || (await hashSenha(senha, u.senhaSalt)) !== u.senhaHash) {
        return { ok: false, erro: 'E-mail ou senha incorretos.' };
      }
      update((d) => ({ ...d, usuarioAtualId: u.id }));
      return { ok: true };
    },
    [db, garantirDemo, update],
  );

  const cadastrar = useCallback(
    async (dados: {
      nome: string; email: string; senha: string; dataNascimento: string; estado: string; cidade: string;
      tipoPerfil: TipoPerfil; esportes: { esporteId: ID; nivel: Nivel }[];
    }): Promise<Resultado> => {
      if (!db) return { ok: false, erro: 'Carregando…' };
      const email = dados.email.trim().toLowerCase();
      if (!dados.nome.trim() || dados.nome.length > 100) return { ok: false, erro: 'Informe seu nome (até 100 caracteres).' };
      if (!emailValido(email)) return { ok: false, erro: 'E-mail inválido.' };
      if (db.usuarios.some((u) => u.email === email)) return { ok: false, erro: 'Este e-mail já está cadastrado.' };
      if (dados.senha.length < 6) return { ok: false, erro: 'A senha precisa ter pelo menos 6 caracteres.' };
      const salt = uid('s_');
      const senhaHash = await hashSenha(dados.senha, salt);
      const id = uid('u_');
      update((d) => {
        let nd: DB = {
          ...d,
          usuarioAtualId: id,
          usuarios: [
            ...d.usuarios,
            {
              id, nome: dados.nome.trim(), email, senhaHash, senhaSalt: salt, dataNascimento: dados.dataNascimento,
              tipoPerfil: dados.tipoPerfil, pais: 'Brasil', estado: dados.estado, cidade: dados.cidade.trim(),
              saldoPontos: 0, estaAtivo: true,
            },
          ],
          usuarioEsportes: [
            ...d.usuarioEsportes,
            ...dados.esportes.map((e) => ({
              usuarioId: id, esporteId: e.esporteId, nivelHabilidade: e.nivel, ePreferencia: true, estaAtivo: true,
            })),
          ],
        };
        nd = creditar(nd, id, BONUS_BOAS_VINDAS, 'bonus', 'Bônus de boas-vindas');
        return nd;
      });
      return { ok: true };
    },
    [db, update],
  );

  const sair = useCallback(() => update((d) => ({ ...d, usuarioAtualId: undefined })), [update]);

  const atualizarPerfil = useCallback(
    (p: Partial<Pick<Usuario, 'nome' | 'bio' | 'telefone' | 'cidade' | 'estado'>>) =>
      update((d) => ({ ...d, usuarios: d.usuarios.map((u) => (u.id === d.usuarioAtualId ? { ...u, ...p } : u)) })),
    [update],
  );

  const definirEsporte = useCallback(
    (esporteId: ID, nivel: Nivel | null) =>
      update((d) => {
        const uidAtual = d.usuarioAtualId!;
        const resto = d.usuarioEsportes.filter((x) => !(x.usuarioId === uidAtual && x.esporteId === esporteId));
        if (!nivel) return { ...d, usuarioEsportes: resto };
        return {
          ...d,
          usuarioEsportes: [...resto, { usuarioId: uidAtual, esporteId, nivelHabilidade: nivel, ePreferencia: true, estaAtivo: true }],
        };
      }),
    [update],
  );

  // ---------- Quadras ----------
  const alternarFavorita = useCallback(
    (quadraId: ID) =>
      update((d) => {
        const me = d.usuarioAtualId!;
        const existe = d.quadrasFavoritas.find((f) => f.usuarioId === me && f.quadraId === quadraId);
        return {
          ...d,
          quadrasFavoritas: existe
            ? d.quadrasFavoritas.filter((f) => f !== existe)
            : [...d.quadrasFavoritas, { usuarioId: me, quadraId, data: agora(), estaAtivo: true }],
        };
      }),
    [update],
  );

  const avaliarQuadra = useCallback(
    (quadraId: ID, nota: number, comentario: string) =>
      update((d) => ({
        ...d,
        avaliacoes: [
          { id: uid('a_'), usuarioId: d.usuarioAtualId!, quadraId, nota, comentario: comentario.trim() || undefined, data: agora(), estaAtivo: true },
          ...d.avaliacoes.filter((a) => !(a.usuarioId === d.usuarioAtualId && a.quadraId === quadraId)),
        ],
      })),
    [update],
  );

  // ---------- Sessões (UC05 / UC10) ----------
  const criarSessao = useCallback(
    (s: Omit<SessaoJogo, 'id' | 'responsavelId' | 'status' | 'estaAtivo'>): Resultado<ID> => {
      if (!db || !usuario) return { ok: false, erro: 'Faça login novamente.' };
      if (new Date(s.inicio).getTime() <= Date.now()) return { ok: false, erro: 'Informe uma data e um horário futuros.' };
      if (!db.quadras.find((q) => q.id === s.quadraId && q.estaAtivo)) return { ok: false, erro: 'Esta quadra não está mais disponível.' };
      const id = uid('s_');
      update((d) => ({
        ...d,
        sessoes: [{ ...s, id, responsavelId: usuario.id, status: 'aberta', estaAtivo: true }, ...d.sessoes],
      }));
      // Simulação: atletas próximos pedem para entrar na sua sessão
      if (db.modoDemo) {
        const candidatos = BOTS.slice().sort(() => Math.random() - 0.5).slice(0, 2);
        candidatos.forEach((b, i) =>
          depois(5000 + i * 7000, () => {
            update((d) => ({
              ...d,
              participacoes: [
                ...d.participacoes,
                { id: uid('p_'), sessaoId: id, usuarioId: b.id, status: 'solicitado', dataSolicitacao: agora(), estaAtivo: true },
              ],
            }));
            notificar(usuario.id, `${b.nome} pediu para participar da sua sessão`, `/sessao/${id}`);
          }),
        );
      }
      return { ok: true, valor: id };
    },
    [db, usuario, update, depois, notificar],
  );

  const solicitarParticipacao = useCallback(
    (sessaoId: ID): Resultado => {
      if (!db || !usuario) return { ok: false, erro: 'Faça login novamente.' };
      const s = db.sessoes.find((x) => x.id === sessaoId);
      if (!s || s.status !== 'aberta' || new Date(s.termino).getTime() < Date.now()) {
        return { ok: false, erro: 'Esta sessão não está mais disponível.' };
      }
      const ja = db.participacoes.find(
        (p) => p.sessaoId === sessaoId && p.usuarioId === usuario.id && (p.status === 'solicitado' || p.status === 'aprovado'),
      );
      if (ja) return { ok: false, erro: ja.status === 'aprovado' ? 'Você já participa desta sessão.' : 'Sua solicitação já está pendente.' };
      const aprovados = db.participacoes.filter((p) => p.sessaoId === sessaoId && p.status === 'aprovado').length + 1;
      if (aprovados >= s.maxParticipantes) return { ok: false, erro: 'A sessão já está lotada.' };
      const pid = uid('p_');
      update((d) => ({
        ...d,
        participacoes: [
          ...d.participacoes,
          { id: pid, sessaoId, usuarioId: usuario.id, status: 'solicitado', dataSolicitacao: agora(), estaAtivo: true },
        ],
      }));
      // Simulação: o líder (atleta de exemplo) responde em alguns segundos
      if (db.modoDemo && BOT_IDS.has(s.responsavelId)) {
        const lider = BOTS.find((b) => b.id === s.responsavelId)!;
        depois(4000, () =>
          update((d) => {
            const p = d.participacoes.find((x) => x.id === pid);
            if (!p || p.status !== 'solicitado') return d;
            return {
              ...d,
              participacoes: d.participacoes.map((x) => (x.id === pid ? { ...x, status: 'aprovado' } : x)),
              notificacoes: [
                {
                  id: uid('n_'), usuarioId: usuario.id, data: agora(), lida: false, link: `/sessao/${sessaoId}`,
                  texto: `${lider.nome.split(' ')[0]} aprovou sua participação! 🎉`,
                },
                ...d.notificacoes,
              ],
            };
          }),
        );
      }
      return { ok: true };
    },
    [db, usuario, update, depois],
  );

  const cancelarParticipacao = useCallback(
    (sessaoId: ID) =>
      update((d) => ({
        ...d,
        participacoes: d.participacoes.map((p) =>
          p.sessaoId === sessaoId && p.usuarioId === d.usuarioAtualId && (p.status === 'solicitado' || p.status === 'aprovado')
            ? { ...p, status: 'cancelado' }
            : p,
        ),
      })),
    [update],
  );

  const responderSolicitacao = useCallback(
    (participacaoId: ID, aprovar: boolean) =>
      update((d) => ({
        ...d,
        participacoes: d.participacoes.map((p) =>
          p.id === participacaoId ? { ...p, status: aprovar ? 'aprovado' : 'recusado' } : p,
        ),
      })),
    [update],
  );

  const cancelarSessao = useCallback(
    (sessaoId: ID) =>
      update((d) => ({ ...d, sessoes: d.sessoes.map((s) => (s.id === sessaoId ? { ...s, status: 'cancelada' } : s)) })),
    [update],
  );

  // ---------- Recompensas (UC16) ----------
  const resgatar = useCallback(
    (recompensaId: ID): Resultado<{ codigo: string }> => {
      if (!db || !usuario) return { ok: false, erro: 'Faça login novamente.' };
      const r = db.recompensas.find((x) => x.id === recompensaId);
      if (!r || !r.estaAtivo || new Date(r.validade).getTime() < Date.now()) {
        return { ok: false, erro: 'Este desconto não está mais disponível.' };
      }
      if (usuario.saldoPontos < r.pontosNecessarios) {
        return { ok: false, erro: `Saldo insuficiente. Faltam ${r.pontosNecessarios - usuario.saldoPontos} pontos.` };
      }
      const codigo = codigoResgate();
      const resgateId = uid('rg_');
      update((d) => {
        const me = d.usuarios.find((u) => u.id === usuario.id)!;
        if (me.saldoPontos < r.pontosNecessarios) return d; // FE5: troca simultânea
        return {
          ...d,
          usuarios: d.usuarios.map((u) => (u.id === me.id ? { ...u, saldoPontos: u.saldoPontos - r.pontosNecessarios } : u)),
          resgates: [
            { id: resgateId, usuarioId: me.id, recompensaId, codigo, dataResgate: agora(), status: 'pendente', estaAtivo: true },
            ...d.resgates,
          ],
          transacoes: [
            {
              id: uid('t_'), usuarioId: me.id, resgateId, tipo: 'resgate_recompensa', quantidadePontos: r.pontosNecessarios,
              descricao: `Resgate · ${r.titulo}`, data: agora(), estaAtivo: true,
            },
            ...d.transacoes,
          ],
        };
      });
      return { ok: true, valor: { codigo } };
    },
    [db, usuario, update],
  );

  const marcarUtilizado = useCallback(
    (resgateId: ID) =>
      update((d) => ({ ...d, resgates: d.resgates.map((r) => (r.id === resgateId ? { ...r, status: 'utilizado' } : r)) })),
    [update],
  );

  // ---------- Koorta's ----------
  const alternarCurtida = useCallback(
    (videoId: ID) =>
      update((d) => {
        const me = d.usuarioAtualId!;
        const existe = d.curtidas.find((c) => c.usuarioId === me && c.videoId === videoId);
        return {
          ...d,
          curtidas: existe ? d.curtidas.filter((c) => c !== existe) : [...d.curtidas, { usuarioId: me, videoId, data: agora(), estaAtivo: true }],
        };
      }),
    [update],
  );

  const alternarVideoFavorito = useCallback(
    (videoId: ID) =>
      update((d) => {
        const me = d.usuarioAtualId!;
        const existe = d.videosFavoritos.find((c) => c.usuarioId === me && c.videoId === videoId);
        return {
          ...d,
          videosFavoritos: existe
            ? d.videosFavoritos.filter((c) => c !== existe)
            : [...d.videosFavoritos, { usuarioId: me, videoId, data: agora(), estaAtivo: true }],
        };
      }),
    [update],
  );

  const comentar = useCallback(
    (videoId: ID, texto: string) =>
      update((d) => ({
        ...d,
        comentarios: [
          ...d.comentarios,
          { id: uid('c_'), usuarioId: d.usuarioAtualId!, videoId, texto: texto.trim().slice(0, 1000), data: agora(), estaAtivo: true },
        ],
      })),
    [update],
  );

  // ---------- Social ----------
  const alternarSeguir = useCallback(
    (seguidoId: ID) =>
      update((d) => {
        const me = d.usuarioAtualId!;
        if (me === seguidoId) return d;
        const existe = d.seguidos.find((s) => s.seguidorId === me && s.seguidoId === seguidoId);
        return {
          ...d,
          seguidos: existe
            ? d.seguidos.filter((s) => s !== existe)
            : [...d.seguidos, { seguidorId: me, seguidoId, dataSeguimento: agora(), estaAtivo: true }],
        };
      }),
    [update],
  );

  const marcarNotificacoesLidas = useCallback(
    () =>
      update((d) => ({
        ...d,
        notificacoes: d.notificacoes.map((n) => (n.usuarioId === d.usuarioAtualId ? { ...n, lida: true } : n)),
      })),
    [update],
  );

  const definirTema = useCallback((t: PreferenciaTema) => update((d) => ({ ...d, tema: t })), [update]);

  const alternarModoDemo = useCallback(() => update((d) => ({ ...d, modoDemo: !d.modoDemo })), [update]);

  const resetarDados = useCallback(async () => {
    timers.current.forEach(clearTimeout);
    await AsyncStorage.removeItem(STORAGE_KEY);
    setPosicao(null);
    setDb(criarDB(ANCORA_PADRAO));
  }, []);

  // Localização de referência: GPS real, senão o centro onde as quadras foram geradas
  const referencia: Coord = posicao ?? (db ? { latitude: db.ancora.latitude, longitude: db.ancora.longitude } : ANCORA_PADRAO);

  return {
    db,
    pronto: !!db,
    usuario,
    posicao,
    referencia,
    agoraTick,
    checkinAtivo,
    minutosValidos,
    plataformaWeb: Platform.OS === 'web',
    obterPosicao,
    concederConsentimento,
    revogarConsentimento,
    fazerCheckin,
    encerrarCheckin,
    entrar,
    cadastrar,
    sair,
    atualizarPerfil,
    definirEsporte,
    alternarFavorita,
    avaliarQuadra,
    criarSessao,
    solicitarParticipacao,
    cancelarParticipacao,
    responderSolicitacao,
    cancelarSessao,
    resgatar,
    marcarUtilizado,
    alternarCurtida,
    alternarVideoFavorito,
    comentar,
    alternarSeguir,
    marcarNotificacoesLidas,
    alternarModoDemo,
    resetarDados,
    tema,
    esquema,
    definirTema,
  };
}

export type AppStore = ReturnType<typeof useAppState>;
const Ctx = createContext<AppStore | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const store = useAppState();
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp fora do AppProvider');
  return v;
}

// Para telas que só renderizam com o banco carregado e usuário logado
export function useDB() {
  const app = useApp();
  return { ...app, db: app.db!, usuario: app.usuario! };
}
