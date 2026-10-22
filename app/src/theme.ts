// Identidade Koorta: verde #68855B, preto e branco. Visual minimalista no estilo iOS.

export type Esquema = 'light' | 'dark';
export type PreferenciaTema = 'sistema' | 'claro' | 'escuro';

const BRAND = '#68855B';

const claro = {
  brand: BRAND,
  brandPressed: '#56704B',
  brandSoft: '#EDF2EA',
  onBrand: '#FFFFFF',
  bg: '#FFFFFF',
  card: '#F5F5F3',
  elevated: '#FFFFFF',
  fill: '#EFEFEC',
  ink: '#000000',
  inkSoft: '#3C3C43',
  muted: '#8A8A8E',
  line: '#E4E4E0',
  inverse: '#000000',
  onInverse: '#FFFFFF',
  danger: '#E5484D',
  warning: '#E59A2E',
  star: '#000000',
  overlay: 'rgba(0,0,0,0.35)',
  white: '#FFFFFF',
  black: '#000000',
};

const escuro: typeof claro = {
  brand: BRAND,
  brandPressed: '#7A9A6C',
  brandSoft: '#1B2418',
  onBrand: '#FFFFFF',
  bg: '#000000',
  card: '#151515',
  elevated: '#1C1C1E',
  fill: '#232325',
  ink: '#FFFFFF',
  inkSoft: '#D6D6D9',
  muted: '#8E8E93',
  line: '#2A2A2C',
  inverse: '#FFFFFF',
  onInverse: '#000000',
  danger: '#FF6369',
  warning: '#F2B24C',
  star: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.6)',
  white: '#FFFFFF',
  black: '#000000',
};

// Objeto único lido na renderização; aplicarTema troca os valores no lugar.
export const colors = { ...claro };
export let esquemaAtual: Esquema = 'light';

export function aplicarTema(e: Esquema) {
  if (e === esquemaAtual) return;
  esquemaAtual = e;
  Object.assign(colors, e === 'dark' ? escuro : claro);
}

export const radius = { sm: 10, md: 14, lg: 20, xl: 26, pill: 999 };

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 32 };

// Hierarquia tipográfica inspirada no iOS (fonte do sistema)
export const type = {
  get largeTitle() {
    return { fontSize: 34, fontWeight: '700' as const, color: colors.ink, letterSpacing: 0.2 };
  },
  get title() {
    return { fontSize: 22, fontWeight: '700' as const, color: colors.ink };
  },
  get headline() {
    return { fontSize: 17, fontWeight: '600' as const, color: colors.ink };
  },
  get body() {
    return { fontSize: 16, color: colors.inkSoft };
  },
  get small() {
    return { fontSize: 13, color: colors.muted };
  },
  get caption() {
    return { fontSize: 12, fontWeight: '600' as const, color: colors.muted, letterSpacing: 0.4, textTransform: 'uppercase' as const };
  },
};

// Espaço reservado para a tab bar flutuante
export const TAB_BAR_SPACE = 104;
