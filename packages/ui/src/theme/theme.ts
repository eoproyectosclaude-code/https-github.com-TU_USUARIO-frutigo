import { palette } from './tokens';

export interface Theme {
  mode: 'light' | 'dark';
  colors: {
    background: string;
    surface: string;
    surfaceAlt: string;
    text: string;
    textMuted: string;
    primary: string; // verde olivo — identidad y acción principal
    secondary: string; // verde olivo profundo
    accent: string; // amarillo GO
    border: string;
    success: string;
    danger: string;
  };
}

export const lightTheme: Theme = {
  mode: 'light',
  colors: {
    background: palette.cloud,
    surface: palette.white,
    surfaceAlt: palette.oliveSoft,
    text: palette.ink,
    textMuted: palette.slate,
    primary: palette.olive,
    secondary: palette.oliveDeep,
    accent: palette.yellow,
    border: '#E3E7D8',
    success: palette.success,
    danger: palette.danger,
  },
};

export const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    background: palette.carbon,
    surface: '#232B16',
    surfaceAlt: '#2C3620',
    text: palette.white,
    textMuted: '#B4BFA0',
    primary: palette.oliveLight,
    secondary: palette.olive,
    accent: palette.yellow,
    border: '#3A4628',
    success: palette.success,
    danger: '#EF4444',
  },
};
