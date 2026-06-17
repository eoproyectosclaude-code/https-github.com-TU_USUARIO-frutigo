import { palette } from './tokens';

export interface Theme {
  mode: 'light' | 'dark';
  colors: {
    background: string;
    surface: string;
    surfaceAlt: string;
    text: string;
    textMuted: string;
    primary: string; // naranja GO
    secondary: string; // verde campo
    accent: string; // amarillo
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
    surfaceAlt: '#EEF2F6',
    text: palette.ink,
    textMuted: palette.slate,
    primary: palette.orange,
    secondary: palette.greenDeep,
    accent: palette.yellow,
    border: '#E2E8F0',
    success: palette.success,
    danger: palette.danger,
  },
};

export const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    background: palette.carbon,
    surface: '#16213A',
    surfaceAlt: '#1E2C4A',
    text: palette.white,
    textMuted: '#94A3B8',
    primary: palette.orange,
    secondary: palette.greenLight,
    accent: palette.yellow,
    border: '#243352',
    success: palette.success,
    danger: palette.danger,
  },
};
