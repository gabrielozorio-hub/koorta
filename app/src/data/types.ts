// Entidades seguindo o Catálogo de Requisitos de Dados do Koorta.
// Todas possuem `estaAtivo` para exclusão lógica (soft delete).

export type ID = string;
export type Nivel = 'iniciante' | 'intermediario' | 'avancado';
export type TipoPerfil = 'atleta' | 'admin_quadra' | 'loja_parceira' | 'admin_plataforma';

export interface Usuario {
  id: ID;
  nome: string;
  email: string;
  senhaHash: string;
  senhaSalt: string;
  dataNascimento: string; // dd/mm/aaaa
  tipoPerfil: TipoPerfil;
  pais: string;
  estado: string;
  cidade: string;
  latitude?: number;
  longitude?: number;
  telefone?: string;
  fotoPerfil?: string;
  saldoPontos: number;
  bio?: string;
  estaAtivo: boolean;
}

export interface Esporte {
  id: ID;
  nome: string;
  categoria: 'coletivo' | 'individual' | 'raquete' | 'outro';
  icone: string; // nome do ícone MaterialCommunityIcons
  estaAtivo: boolean;
}

export interface UsuarioEsporte {
  usuarioId: ID;
  esporteId: ID;
  nivelHabilidade: Nivel;
  tempoPratica?: number; // meses
  ePreferencia: boolean;
  estaAtivo: boolean;
}

export interface UsuarioSeguido {
  seguidorId: ID;
  seguidoId: ID;
  dataSeguimento: string;
  estaAtivo: boolean;
}

export interface Quadra {
  id: ID;
  nome: string;
  endereco?: string;
  pais: string;
  estado: string;
  cidade: string;
  latitude: number;
  longitude: number;
  horarioAbertura: string; // hh:mm
  horarioFechamento: string;
  esportes: ID[]; // Quadra Esporte
  fotos: { id: ID; url: string; ePrincipal: boolean }[];
  movimento: number[]; // média de atletas por hora (0..23)
  coberta: boolean;
  gratuita: boolean;
  estaAtivo: boolean;
}

export interface QuadraFavorita {
  usuarioId: ID;
  quadraId: ID;
  data: string;
  estaAtivo: boolean;
}

export interface AvaliacaoQuadra {
  id: ID;
  usuarioId: ID;
  quadraId: ID;
  nota: number; // 1..5
  comentario?: string;
  data: string;
  estaAtivo: boolean;
}

export type StatusSessao = 'aberta' | 'cancelada' | 'encerrada';

export interface SessaoJogo {
  id: ID;
  responsavelId: ID;
  quadraId: ID;
  esporteId: ID;
  inicio: string; // ISO
  termino: string; // ISO
  visibilidade: 'publica' | 'privada';
  maxParticipantes: number;
  nivel: Nivel | 'todos';
  descricao?: string;
  status: StatusSessao;
  estaAtivo: boolean;
}

export type StatusParticipacao = 'solicitado' | 'aprovado' | 'recusado' | 'cancelado';

export interface ParticipacaoSessao {
  id: ID;
  sessaoId: ID;
  usuarioId: ID;
  status: StatusParticipacao;
  dataSolicitacao: string;
  estaAtivo: boolean;
}

export interface Checkin {
  id: ID;
  usuarioId: ID;
  quadraId: ID;
  dataHora: string; // início
  fim?: string;
  latitude: number;
  longitude: number;
  estaAtivo: boolean; // true = check-in em andamento
}

export interface TransacaoPontos {
  id: ID;
  usuarioId: ID;
  checkinId?: ID;
  resgateId?: ID;
  tipo: 'ganho_checkin' | 'resgate_recompensa' | 'bonus';
  quantidadePontos: number;
  descricao: string;
  data: string;
  estaAtivo: boolean;
}

export interface LojaParceira {
  id: ID;
  nome: string;
  categoria: string;
  pais: string;
  estado: string;
  cidade: string;
  cor: string;
  icone: string;
  estaAtivo: boolean;
}

export interface Recompensa {
  id: ID;
  lojaId: ID;
  titulo: string;
  descricao: string;
  pontosNecessarios: number;
  validade: string; // ISO date
  estaAtivo: boolean;
}

export interface ResgateRecompensa {
  id: ID;
  usuarioId: ID;
  recompensaId: ID;
  codigo: string;
  dataResgate: string;
  status: 'pendente' | 'utilizado' | 'expirado';
  estaAtivo: boolean;
}

export interface Video {
  id: ID;
  autorId: ID;
  esporteId: ID;
  titulo: string;
  descricao?: string;
  arquivoMidia: string;
  nivel: Nivel;
  dataPublicacao: string;
  curtidasBase: number;
  estaAtivo: boolean;
}

export interface CurtidaVideo { usuarioId: ID; videoId: ID; data: string; estaAtivo: boolean }
export interface VideoFavorito { usuarioId: ID; videoId: ID; data: string; estaAtivo: boolean }
export interface ComentarioVideo {
  id: ID;
  usuarioId: ID;
  videoId: ID;
  texto: string;
  data: string;
  estaAtivo: boolean;
}

// RNF04 — registro de consentimento de localização (LGPD)
export interface ConsentimentoLocalizacao {
  status: 'concedido' | 'revogado' | 'nao_solicitado';
  data?: string;
  versaoTermo: string;
}

export interface Notificacao {
  id: ID;
  usuarioId: ID;
  texto: string;
  data: string;
  lida: boolean;
  link?: string;
}

export interface DB {
  versao: number;
  ancora: { latitude: number; longitude: number; posicionada: boolean };
  usuarioAtualId?: ID;
  modoDemo: boolean;
  tema?: 'sistema' | 'claro' | 'escuro';
  consentimento: ConsentimentoLocalizacao;
  usuarios: Usuario[];
  esportes: Esporte[];
  usuarioEsportes: UsuarioEsporte[];
  seguidos: UsuarioSeguido[];
  quadras: Quadra[];
  quadrasFavoritas: QuadraFavorita[];
  avaliacoes: AvaliacaoQuadra[];
  sessoes: SessaoJogo[];
  participacoes: ParticipacaoSessao[];
  checkins: Checkin[];
  transacoes: TransacaoPontos[];
  lojas: LojaParceira[];
  recompensas: Recompensa[];
  resgates: ResgateRecompensa[];
  videos: Video[];
  curtidas: CurtidaVideo[];
  videosFavoritos: VideoFavorito[];
  comentarios: ComentarioVideo[];
  notificacoes: Notificacao[];
}
