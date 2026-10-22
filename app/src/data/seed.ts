import type { DB, Esporte, Quadra, Usuario, SessaoJogo, Video, Recompensa, LojaParceira } from './types';

// Credenciais de teste do protótipo (conta demo criada no primeiro uso)
export const DEMO_EMAIL = 'demo@koorta.app';
export const DEMO_SENHA = 'koorta123';
export const DEMO_ID = 'u_demo';

// Centro padrão até o app obter a localização real (Parque Ibirapuera, SP)
export const ANCORA_PADRAO = { latitude: -23.5874, longitude: -46.6576 };

const img = (id: string) => `https://images.unsplash.com/${id}?w=900&q=70&auto=format&fit=crop`;
const FOTOS = {
  basqueteAro: img('photo-1546519638-68e109498ffc'),
  basqueteRua: img('photo-1519861531473-9200262188bf'),
  futebol: img('photo-1574629810360-7efbbe195018'),
  society: img('photo-1529900748604-07564a03e7a6'),
  futebolNoite: img('photo-1431324155629-1a6deb1dec8d'),
  volei: img('photo-1612872087720-bb876e2e67d1'),
  voleiPraia: img('photo-1592656094267-764a45160876'),
  tenisSaibro: img('photo-1554068865-24cecd4e34b8'),
  tenis: img('photo-1622279457486-62dcc4a431d6'),
  tenisAzul: img('photo-1595435934249-5df7ed86e1c0'),
  badminton: img('photo-1626224583764-f87db24ac4ea'),
};

const mixkit = (id: number) => `https://assets.mixkit.co/videos/${id}/${id}-720.mp4`;

export const ESPORTES: Esporte[] = [
  { id: 'e_futebol', nome: 'Futebol', categoria: 'coletivo', icone: 'soccer', estaAtivo: true },
  { id: 'e_futsal', nome: 'Futsal', categoria: 'coletivo', icone: 'soccer-field', estaAtivo: true },
  { id: 'e_basquete', nome: 'Basquete', categoria: 'coletivo', icone: 'basketball', estaAtivo: true },
  { id: 'e_volei', nome: 'Vôlei', categoria: 'coletivo', icone: 'volleyball', estaAtivo: true },
  { id: 'e_tenis', nome: 'Tênis', categoria: 'raquete', icone: 'tennis', estaAtivo: true },
  { id: 'e_beach', nome: 'Beach Tennis', categoria: 'raquete', icone: 'tennis-ball', estaAtivo: true },
  { id: 'e_badminton', nome: 'Badminton', categoria: 'raquete', icone: 'badminton', estaAtivo: true },
  { id: 'e_corrida', nome: 'Corrida', categoria: 'individual', icone: 'run-fast', estaAtivo: true },
];

const atleta = (id: string, nome: string, cidade: string, bio: string, saldo = 0): Usuario => ({
  id,
  nome,
  email: `${id}@koorta.app`,
  senhaHash: '',
  senhaSalt: '',
  dataNascimento: '01/01/1998',
  tipoPerfil: 'atleta',
  pais: 'Brasil',
  estado: 'SP',
  cidade,
  saldoPontos: saldo,
  bio,
  estaAtivo: true,
});

export const BOTS: Usuario[] = [
  atleta('u_lari', 'Larissa Prado', 'São Paulo', 'Levantadora nas horas vagas 🏐', 820),
  atleta('u_caio', 'Caio Mendes', 'São Paulo', 'Pelada toda quarta. Bora?', 640),
  atleta('u_bia', 'Beatriz Lopes', 'São Paulo', 'Tênis e corrida de manhã cedo.', 1210),
  atleta('u_rafa', 'Rafael Tanaka', 'São Paulo', 'Streetball > tudo', 450),
  atleta('u_ju', 'Juliana Reis', 'São Paulo', 'Professora de educação física. Gravo os Koorta’s!', 2300),
  atleta('u_pedro', 'Pedro Alves', 'São Paulo', 'Goleiro reserva profissional 🧤', 300),
  atleta('u_nina', 'Nina Costa', 'São Paulo', 'Beach tennis é vida.', 990),
  atleta('u_gui', 'Guilherme Souza', 'São Paulo', 'Começando no badminton.', 120),
];

// Padrão de movimento por hora: picos de manhã cedo e à noite
function curvaMovimento(escala: number, seed: number) {
  const base = [0, 0, 0, 0, 0, 0, 3, 6, 5, 3, 2, 2, 3, 2, 2, 3, 5, 8, 11, 12, 10, 7, 3, 1];
  return base.map((v, i) => Math.max(0, Math.round(v * escala + Math.sin(i * 1.7 + seed) * 1.5)));
}

// Posições em metros relativas à âncora (leste, norte)
type QuadraSeed = Omit<Quadra, 'latitude' | 'longitude' | 'pais' | 'estado' | 'cidade' | 'estaAtivo' | 'movimento'> & {
  dx: number;
  dy: number;
  escala: number;
};

const QUADRAS_SEED: QuadraSeed[] = [
  {
    id: 'q_teste',
    nome: 'Quadra Teste Koorta',
    endereco: 'Sua localização atual — use para testar o check-in real',
    dx: 0, dy: 0, escala: 0.4,
    horarioAbertura: '00:00', horarioFechamento: '23:59',
    esportes: ['e_futsal', 'e_basquete', 'e_volei'],
    fotos: [{ id: 'f0', url: FOTOS.basqueteRua, ePrincipal: true }],
    coberta: false, gratuita: true,
  },
  {
    id: 'q_arena',
    nome: 'Arena Parque Verde',
    endereco: 'Av. das Palmeiras, 1200',
    dx: 650, dy: 420, escala: 1.2,
    horarioAbertura: '06:00', horarioFechamento: '23:00',
    esportes: ['e_futebol', 'e_futsal'],
    fotos: [
      { id: 'f1', url: FOTOS.futebol, ePrincipal: true },
      { id: 'f2', url: FOTOS.futebolNoite, ePrincipal: false },
    ],
    coberta: false, gratuita: true,
  },
  {
    id: 'q_garagem',
    nome: 'Garagem Streetball',
    endereco: 'R. Augusta Norte, 88',
    dx: -820, dy: 310, escala: 0.9,
    horarioAbertura: '07:00', horarioFechamento: '22:00',
    esportes: ['e_basquete'],
    fotos: [
      { id: 'f3', url: FOTOS.basqueteAro, ePrincipal: true },
      { id: 'f4', url: FOTOS.basqueteRua, ePrincipal: false },
    ],
    coberta: false, gratuita: true,
  },
  {
    id: 'q_areia',
    nome: 'Areia Clube do Lago',
    endereco: 'Alameda do Lago, 45',
    dx: 300, dy: -900, escala: 0.8,
    horarioAbertura: '06:00', horarioFechamento: '21:00',
    esportes: ['e_volei', 'e_beach'],
    fotos: [
      { id: 'f5', url: FOTOS.voleiPraia, ePrincipal: true },
      { id: 'f6', url: FOTOS.volei, ePrincipal: false },
    ],
    coberta: false, gratuita: false,
  },
  {
    id: 'q_tenis',
    nome: 'Centro de Tênis Ipê',
    endereco: 'R. dos Ipês, 300',
    dx: -1400, dy: -650, escala: 0.6,
    horarioAbertura: '06:00', horarioFechamento: '22:00',
    esportes: ['e_tenis', 'e_beach'],
    fotos: [
      { id: 'f7', url: FOTOS.tenisSaibro, ePrincipal: true },
      { id: 'f8', url: FOTOS.tenis, ePrincipal: false },
      { id: 'f9', url: FOTOS.tenisAzul, ePrincipal: false },
    ],
    coberta: false, gratuita: false,
  },
  {
    id: 'q_ginasio',
    nome: 'Ginásio Municipal Vila Nova',
    endereco: 'Praça Central, s/n',
    dx: 1700, dy: -300, escala: 1.0,
    horarioAbertura: '08:00', horarioFechamento: '22:00',
    esportes: ['e_futsal', 'e_volei', 'e_basquete', 'e_badminton'],
    fotos: [
      { id: 'f10', url: FOTOS.badminton, ePrincipal: true },
      { id: 'f11', url: FOTOS.volei, ePrincipal: false },
    ],
    coberta: true, gratuita: true,
  },
  {
    id: 'q_society',
    nome: 'Society Bola Cheia',
    endereco: 'R. Cel. Oliveira, 1500',
    dx: 2600, dy: 1800, escala: 1.4,
    horarioAbertura: '09:00', horarioFechamento: '23:59',
    esportes: ['e_futebol'],
    fotos: [{ id: 'f12', url: FOTOS.society, ePrincipal: true }],
    coberta: false, gratuita: false,
  },
  {
    id: 'q_pista',
    nome: 'Pista de Corrida do Parque',
    endereco: 'Portão 3 do parque',
    dx: -300, dy: 1300, escala: 0.7,
    horarioAbertura: '05:00', horarioFechamento: '22:00',
    esportes: ['e_corrida'],
    fotos: [{ id: 'f13', url: FOTOS.futebolNoite, ePrincipal: true }],
    coberta: false, gratuita: true,
  },
];

export function gerarQuadras(ancora: { latitude: number; longitude: number }): Quadra[] {
  const mLat = 1 / 111320;
  const mLon = 1 / (111320 * Math.cos((ancora.latitude * Math.PI) / 180));
  return QUADRAS_SEED.map(({ dx, dy, escala, ...q }, i) => ({
    ...q,
    latitude: ancora.latitude + dy * mLat,
    longitude: ancora.longitude + dx * mLon,
    pais: 'Brasil',
    estado: 'SP',
    cidade: 'São Paulo',
    movimento: curvaMovimento(escala, i),
    estaAtivo: true,
  }));
}

function emHoras(diasAFrente: number, horaInicio: number, duracaoMin: number) {
  const ini = new Date();
  ini.setDate(ini.getDate() + diasAFrente);
  ini.setHours(horaInicio, 0, 0, 0);
  const fim = new Date(ini.getTime() + duracaoMin * 60000);
  return { inicio: ini.toISOString(), termino: fim.toISOString() };
}

function proximaHora(offset: number) {
  const h = new Date().getHours() + offset;
  return h >= 23 ? { dia: 1, h: 18 + (offset % 3) } : { dia: 0, h };
}

export function gerarSessoes(): SessaoJogo[] {
  const a = proximaHora(1);
  const b = proximaHora(2);
  const s = (
    id: string, resp: string, quadra: string, esporte: string,
    t: { inicio: string; termino: string }, max: number, nivel: SessaoJogo['nivel'],
    descricao: string, visibilidade: SessaoJogo['visibilidade'] = 'publica',
  ): SessaoJogo => ({
    id, responsavelId: resp, quadraId: quadra, esporteId: esporte, ...t,
    visibilidade, maxParticipantes: max, nivel, descricao, status: 'aberta', estaAtivo: true,
  });
  return [
    s('s1', 'u_caio', 'q_arena', 'e_futebol', emHoras(a.dia, a.h, 90), 14, 'todos', 'Pelada sem compromisso. Traga colete escuro e claro!'),
    s('s2', 'u_rafa', 'q_garagem', 'e_basquete', emHoras(b.dia, b.h, 60), 6, 'intermediario', '3x3 rápido, quem perde sai.'),
    s('s3', 'u_lari', 'q_areia', 'e_volei', emHoras(1, 8, 120), 8, 'iniciante', 'Vôlei de areia pra quem tá começando. Ensino o básico!'),
    s('s4', 'u_bia', 'q_tenis', 'e_tenis', emHoras(1, 7, 60), 2, 'avancado', 'Procuro parceiro(a) para treino de rally.'),
    s('s5', 'u_nina', 'q_areia', 'e_beach', emHoras(2, 17, 90), 4, 'todos', 'Duplas mistas, raquetes extras disponíveis.'),
    s('s6', 'u_gui', 'q_ginasio', 'e_badminton', emHoras(2, 19, 60), 4, 'iniciante', 'Badminton para iniciantes, sem pressão.'),
    s('s7', 'u_pedro', 'q_society', 'e_futebol', emHoras(3, 20, 60), 12, 'intermediario', 'Society fechado, falta 3 pra completar.', 'privada'),
  ];
}

export const LOJAS: LojaParceira[] = [
  { id: 'l_ponto', nome: 'Ponto Esportivo', categoria: 'Artigos esportivos', pais: 'Brasil', estado: 'SP', cidade: 'São Paulo', cor: '#1F6FEB', icone: 'shoe-sneaker', estaAtivo: true },
  { id: 'l_hidra', nome: 'Hidrata Bar', categoria: 'Bebidas e açaí', pais: 'Brasil', estado: 'SP', cidade: 'São Paulo', cor: '#7B3FE4', icone: 'cup', estaAtivo: true },
  { id: 'l_fisio', nome: 'FisioMove', categoria: 'Fisioterapia', pais: 'Brasil', estado: 'SP', cidade: 'São Paulo', cor: '#E4573F', icone: 'medical-bag', estaAtivo: true },
  { id: 'l_raquete', nome: 'Raquete & Cia', categoria: 'Raquetes e encordoamento', pais: 'Brasil', estado: 'SP', cidade: 'São Paulo', cor: '#C59400', icone: 'tennis', estaAtivo: true },
];

function emDias(d: number) {
  const x = new Date();
  x.setDate(x.getDate() + d);
  return x.toISOString();
}

export function gerarRecompensas(): Recompensa[] {
  return [
    { id: 'r1', lojaId: 'l_hidra', titulo: 'Açaí 300ml grátis', descricao: 'Um açaí de 300ml com 2 complementos.', pontosNecessarios: 150, validade: emDias(30), estaAtivo: true },
    { id: 'r2', lojaId: 'l_ponto', titulo: '10% em chuteiras', descricao: 'Desconto de 10% em qualquer chuteira da loja física.', pontosNecessarios: 300, validade: emDias(45), estaAtivo: true },
    { id: 'r3', lojaId: 'l_raquete', titulo: 'Encordoamento grátis', descricao: 'Encordoamento simples para raquete de tênis ou beach tennis.', pontosNecessarios: 450, validade: emDias(60), estaAtivo: true },
    { id: 'r4', lojaId: 'l_fisio', titulo: 'Avaliação postural', descricao: 'Uma sessão de avaliação postural esportiva.', pontosNecessarios: 600, validade: emDias(30), estaAtivo: true },
    { id: 'r5', lojaId: 'l_ponto', titulo: 'R$ 50 off acima de R$ 250', descricao: 'Vale-desconto de R$ 50 em compras acima de R$ 250.', pontosNecessarios: 900, validade: emDias(90), estaAtivo: true },
    { id: 'r6', lojaId: 'l_hidra', titulo: 'Isotônico 2 por 1', descricao: 'Leve dois isotônicos pagando um.', pontosNecessarios: 80, validade: emDias(15), estaAtivo: true },
  ];
}

export function gerarVideos(): Video[] {
  const v = (id: string, autor: string, esporte: string, titulo: string, descricao: string, midia: number, nivel: Video['nivel'], curtidas: number, diasAtras: number): Video => ({
    id, autorId: autor, esporteId: esporte, titulo, descricao, arquivoMidia: mixkit(midia), nivel,
    dataPublicacao: emDias(-diasAtras), curtidasBase: curtidas, estaAtivo: true,
  });
  return [
    v('v1', 'u_ju', 'e_basquete', 'Arremesso: alinhe o cotovelo', 'Cotovelo apontando para o aro, punho quebrado no final. Repita 50x por dia.', 44448, 'iniciante', 1240, 1),
    v('v2', 'u_ju', 'e_futebol', 'Embaixadinha com a parte de cima do pé', 'Toque leve, tornozelo travado e olhar na bola. Comece com 10 seguidas.', 42541, 'iniciante', 980, 2),
    v('v3', 'u_bia', 'e_tenis', 'Saque: lançamento da bola', 'Lance a bola um pouco à frente do corpo, no ponto mais alto do braço estendido.', 873, 'intermediario', 655, 3),
    v('v4', 'u_rafa', 'e_basquete', 'Drible baixo e protegido', 'Mantenha a bola abaixo da cintura e o corpo entre a bola e o marcador.', 744, 'iniciante', 1530, 4),
    v('v5', 'u_caio', 'e_futebol', 'Pênalti: escolha o canto antes', 'Decida o canto antes da corrida e não mude. Parte interna do pé para precisão.', 43494, 'intermediario', 420, 5),
    v('v6', 'u_lari', 'e_volei', 'Posição de recepção no vôlei', 'Joelhos flexionados, braços estendidos e plataforma firme.', 12321, 'iniciante', 760, 6),
    v('v7', 'u_ju', 'e_basquete', 'Enterrada: impulsão em dois tempos', 'Passada longa, depois curta, e explosão vertical. Fortaleça panturrilhas.', 2285, 'avancado', 2210, 7),
    v('v8', 'u_bia', 'e_tenis', 'Saque com efeito', 'Escove a bola de baixo para cima para gerar topspin no saque.', 23025, 'avancado', 310, 8),
    v('v9', 'u_caio', 'e_futebol', 'Troca de passes em movimento', 'Passe e desloque-se. Domine orientado para o próximo passe.', 43486, 'intermediario', 540, 9),
  ];
}

export function criarDB(ancora = ANCORA_PADRAO): DB {
  return {
    versao: 1,
    ancora: { ...ancora, posicionada: false },
    modoDemo: true,
    consentimento: { status: 'nao_solicitado', versaoTermo: '1.0' },
    usuarios: [...BOTS],
    esportes: ESPORTES,
    usuarioEsportes: [
      { usuarioId: 'u_lari', esporteId: 'e_volei', nivelHabilidade: 'avancado', ePreferencia: true, estaAtivo: true },
      { usuarioId: 'u_caio', esporteId: 'e_futebol', nivelHabilidade: 'intermediario', ePreferencia: true, estaAtivo: true },
      { usuarioId: 'u_bia', esporteId: 'e_tenis', nivelHabilidade: 'avancado', ePreferencia: true, estaAtivo: true },
      { usuarioId: 'u_rafa', esporteId: 'e_basquete', nivelHabilidade: 'avancado', ePreferencia: true, estaAtivo: true },
      { usuarioId: 'u_ju', esporteId: 'e_basquete', nivelHabilidade: 'avancado', ePreferencia: true, estaAtivo: true },
      { usuarioId: 'u_nina', esporteId: 'e_beach', nivelHabilidade: 'intermediario', ePreferencia: true, estaAtivo: true },
    ],
    seguidos: [],
    quadras: gerarQuadras(ancora),
    quadrasFavoritas: [],
    avaliacoes: [
      { id: 'a1', usuarioId: 'u_caio', quadraId: 'q_arena', nota: 5, comentario: 'Gramado ótimo e iluminação boa à noite.', data: emDias(-3), estaAtivo: true },
      { id: 'a2', usuarioId: 'u_pedro', quadraId: 'q_arena', nota: 4, comentario: 'Lota depois das 18h, chegue cedo.', data: emDias(-8), estaAtivo: true },
      { id: 'a3', usuarioId: 'u_rafa', quadraId: 'q_garagem', nota: 5, comentario: 'Melhor aro da região, rede nova.', data: emDias(-2), estaAtivo: true },
      { id: 'a4', usuarioId: 'u_lari', quadraId: 'q_areia', nota: 4, comentario: 'Areia fofa, mas falta sombra.', data: emDias(-5), estaAtivo: true },
      { id: 'a5', usuarioId: 'u_bia', quadraId: 'q_tenis', nota: 5, comentario: 'Saibro bem cuidado.', data: emDias(-1), estaAtivo: true },
      { id: 'a6', usuarioId: 'u_gui', quadraId: 'q_ginasio', nota: 4, comentario: 'Coberto, salva em dia de chuva.', data: emDias(-6), estaAtivo: true },
    ],
    sessoes: gerarSessoes(),
    participacoes: [
      { id: 'p1', sessaoId: 's1', usuarioId: 'u_pedro', status: 'aprovado', dataSolicitacao: emDias(-1), estaAtivo: true },
      { id: 'p2', sessaoId: 's1', usuarioId: 'u_rafa', status: 'aprovado', dataSolicitacao: emDias(-1), estaAtivo: true },
      { id: 'p3', sessaoId: 's1', usuarioId: 'u_gui', status: 'aprovado', dataSolicitacao: emDias(-1), estaAtivo: true },
      { id: 'p4', sessaoId: 's2', usuarioId: 'u_ju', status: 'aprovado', dataSolicitacao: emDias(-1), estaAtivo: true },
      { id: 'p5', sessaoId: 's3', usuarioId: 'u_nina', status: 'aprovado', dataSolicitacao: emDias(-1), estaAtivo: true },
      { id: 'p6', sessaoId: 's5', usuarioId: 'u_bia', status: 'aprovado', dataSolicitacao: emDias(-1), estaAtivo: true },
    ],
    checkins: [],
    transacoes: [],
    lojas: LOJAS,
    recompensas: gerarRecompensas(),
    resgates: [],
    videos: gerarVideos(),
    curtidas: [],
    videosFavoritos: [],
    comentarios: [
      { id: 'c1', usuarioId: 'u_rafa', videoId: 'v1', texto: 'Mudou meu arremesso, valeu!', data: emDias(-1), estaAtivo: true },
      { id: 'c2', usuarioId: 'u_gui', videoId: 'v1', texto: 'Quantas repetições por série?', data: emDias(-1), estaAtivo: true },
      { id: 'c3', usuarioId: 'u_pedro', videoId: 'v2', texto: 'Cheguei em 25 seguidas 🔥', data: emDias(-2), estaAtivo: true },
    ],
    notificacoes: [],
  };
}
