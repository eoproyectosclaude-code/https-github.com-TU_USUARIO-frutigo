/**
 * Design tokens de FRUTI GO — identidad 2026.
 * Paleta oficial del manual de marca (branding/MANUAL-DE-MARCA.md):
 *  - Verde olivo   → identidad/fondo ("del campo")
 *  - Amarillo      → acción/energía ("GO")
 *  - Blanco        → frescura, aire y legibilidad
 * Tipografía: Poppins (display/títulos) + Inter (cuerpo).
 */

export const palette = {
  // Marca
  oliveDeep: '#333D1C', // verde olivo profundo — identidad
  olive: '#6B8E23', // verde olivo — color principal
  oliveLight: '#9CB853', // verde olivo claro — acentos suaves
  oliveSoft: '#EFF3E3', // fondo verdoso muy claro
  yellow: '#F2C707', // amarillo GO — acción
  yellowDeep: '#D9A404', // amarillo profundo — hover/contraste
  // Neutros
  carbon: '#171C0F', // dark mode bg (olivo carbón)
  ink: '#20260F', // texto principal
  slate: '#6B7280', // texto secundario
  cloud: '#FAFAF5', // fondo claro (blanco cálido)
  white: '#FFFFFF',
  // Estado
  success: '#4C9A2A',
  warning: '#F2C707',
  danger: '#DC2626',
  info: '#3B82F6',
  // Alias de compatibilidad (código legado)
  greenDeep: '#333D1C',
  green: '#6B8E23',
  greenLight: '#9CB853',
  orange: '#F2C707', // el naranja fue retirado: apunta al amarillo GO
  orangeSoft: '#D9A404',
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
