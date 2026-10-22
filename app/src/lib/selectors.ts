import type { DB, ID, Quadra, SessaoJogo } from '@/data/types';

export const nomeUsuario = (db: DB, id: ID) => db.usuarios.find((u) => u.id === id)?.nome ?? 'Atleta';
export const esporteDe = (db: DB, id: ID) => db.esportes.find((e) => e.id === id);
export const quadraDe = (db: DB, id: ID) => db.quadras.find((q) => q.id === id);

export function mediaAvaliacoes(db: DB, quadraId: ID) {
  const av = db.avaliacoes.filter((a) => a.quadraId === quadraId && a.estaAtivo);
  if (!av.length) return { media: 0, total: 0 };
  return { media: av.reduce((s, a) => s + a.nota, 0) / av.length, total: av.length };
}

// Atletas presentes agora: média histórica da hora + check-ins ativos
export function presentesAgora(db: DB, q: Quadra) {
  const h = new Date().getHours();
  const ativos = db.checkins.filter((c) => c.quadraId === q.id && c.estaAtivo).length;
  return (q.movimento[h] ?? 0) + ativos;
}

export function participantes(db: DB, s: SessaoJogo) {
  const aprovados = db.participacoes.filter((p) => p.sessaoId === s.id && p.status === 'aprovado').map((p) => p.usuarioId);
  return [s.responsavelId, ...aprovados.filter((id) => id !== s.responsavelId)];
}

export function minhaParticipacao(db: DB, sessaoId: ID, usuarioId: ID) {
  return db.participacoes
    .filter((p) => p.sessaoId === sessaoId && p.usuarioId === usuarioId)
    .sort((a, b) => b.dataSolicitacao.localeCompare(a.dataSolicitacao))[0];
}

export const sessaoAtiva = (s: SessaoJogo) => s.status === 'aberta' && new Date(s.termino).getTime() > Date.now();
