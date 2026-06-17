/**
 * Design tokens de FRUTI GO.
 * Paleta oficial del manual de marca:
 *  - Verde oscuro  → fondo/identidad ("del campo")
 *  - Naranja       → acción/energía ("GO")
 *  - Amarillo      → acentos/destacados
 * Tipografía: Poppins (display/títulos) + Inter (cuerpo).
 */

export const palette = {
  // Marca
  greenDeep: '#0F3D2E', // verde campo
  green: '#1B7A4B',
  greenLight: '#34C759',
  orange: '#F26419', // GO
  orangeSoft: '#FF7A3D',
  yellow: '#F6C615', // acento
  // Neutros
  carbon: '#0E1726', // dark mode bg
  ink: '#11203A',
  slate: '#64748B',
  cloud: '#F5F7FA',
  white: '#FFFFFF',
  // Estado
  success: '#22C55E',
  warning: '#F6C615',
  danger: '#EF4444',
  info: '#3B82F6',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const typography = {
  display: 'Poppins_900Black',
  title: 'Poppins_700Bold',
  subtitle: 'Poppins_600SemiBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_600SemiBold',
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  display: 36,
} as const;
