import { createDarkTheme, createLightTheme } from '@fluentui/react-components';
import type { BrandVariants, Theme } from '@fluentui/react-components';

export type PapyrusThemeMode = 'light' | 'dark' | 'highContrast';

const papyrusBrand: BrandVariants = {
  10: '#060107',
  20: '#240D2C',
  30: '#3B0D53',
  40: '#4C0B75',
  50: '#5B099B',
  60: '#670AC3',
  70: '#7010EE',
  80: '#782FFF',
  90: '#814CFF',
  100: '#8B63FF',
  110: '#9677FF',
  120: '#A18AFF',
  130: '#AD9DFF',
  140: '#B9AFFF',
  150: '#C7C0FF',
  160: '#D5D2FF'
};

const papyrusLightTheme = createLightTheme(papyrusBrand);
const papyrusDarkTheme = createDarkTheme(papyrusBrand);

papyrusDarkTheme.colorBrandForeground1 = papyrusBrand[110];
papyrusDarkTheme.colorBrandForeground2 = papyrusBrand[120];

export const getPapyrusTheme = (mode: PapyrusThemeMode): Theme => {
  switch (mode) {
    case 'dark':
    case 'highContrast':
      return papyrusDarkTheme;
    case 'light':
    default:
      return papyrusLightTheme;
  }
};

export const PAPYRUS_THEME_BRAND = papyrusBrand;
