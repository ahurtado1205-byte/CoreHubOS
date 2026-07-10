export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  fontTitle: string;
  fontBody: string;
  borderRadius: string;
  cardStyle: string;
  headerBg: string;
  heroOverlay: string;
}

export const themePresets: Record<string, ThemePreset> = {
  cozy: {
    id: 'cozy',
    name: 'Cozy Cabin 🪵',
    description: 'Rústico y hogareño, ideal para cabañas de montaña, estancias y lodges de bosque.',
    primaryColor: '#1e3f20', // Forest Green
    secondaryColor: '#d97706', // Warm Amber
    backgroundColor: '#faf6f0', // Soft Warm Cream
    textColor: '#2d3748',
    accentColor: '#b45309',
    fontTitle: 'font-serif', 
    fontBody: 'font-sans',
    borderRadius: 'rounded-3xl',
    cardStyle: 'shadow-[0_12px_40px_rgba(30,63,32,0.06)] border border-amber-900/10 bg-white/90',
    headerBg: 'bg-[#faf6f0]/90 border-b border-amber-900/10',
    heroOverlay: 'bg-black/50 mix-blend-multiply'
  },
  luxury: {
    id: 'luxury',
    name: 'Luxury Boutique 💎',
    description: 'Elegante y sofisticado. Colores oscuros, contrastes dorados y tipografía refinada.',
    primaryColor: '#0f172a', // Deep Navy/Slate
    secondaryColor: '#d4af37', // Gold
    backgroundColor: '#ffffff',
    textColor: '#1e293b',
    accentColor: '#c5a880',
    fontTitle: 'font-serif tracking-wide uppercase',
    fontBody: 'font-sans',
    borderRadius: 'rounded-none',
    cardStyle: 'shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100 bg-white',
    headerBg: 'bg-white/90 border-b border-slate-100',
    heroOverlay: 'bg-slate-950/60'
  },
  minimalist: {
    id: 'minimalist',
    name: 'Modern Minimalist 📐',
    description: 'Diseño nórdico limpio, bordes definidos y estética monocromática.',
    primaryColor: '#111111', // Pure Black
    secondaryColor: '#6b7280', // Charcoal Gray
    backgroundColor: '#f9fafb', // Light Gray
    textColor: '#111827',
    accentColor: '#374151',
    fontTitle: 'font-sans font-black tracking-tight',
    fontBody: 'font-sans',
    borderRadius: 'rounded-lg',
    cardStyle: 'border border-slate-200 bg-white shadow-none',
    headerBg: 'bg-white border-b border-slate-200',
    heroOverlay: 'bg-black/60'
  },
  tropical: {
    id: 'tropical',
    name: 'Vibrant Surf 🏄',
    description: 'Llamativo y lleno de vida. Colores del océano, coral y degradados modernos.',
    primaryColor: '#0ea5e9', // Ocean Cyan
    secondaryColor: '#f97316', // Coral Orange
    backgroundColor: '#f0fdfa', // Fresh Teal Light bg
    textColor: '#0f172a',
    accentColor: '#f43f5e',
    fontTitle: 'font-sans font-extrabold tracking-tight',
    fontBody: 'font-sans',
    borderRadius: 'rounded-2xl',
    cardStyle: 'shadow-[0_15px_30px_rgba(14,165,233,0.08)] border border-sky-100 bg-white/80 backdrop-blur-md',
    headerBg: 'bg-[#f0fdfa]/80 border-b border-sky-100',
    heroOverlay: 'bg-sky-950/40 backdrop-blur-[2px]'
  }
};

export const defaultTheme = themePresets.cozy;
