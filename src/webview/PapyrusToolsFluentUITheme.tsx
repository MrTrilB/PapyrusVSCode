import { createDarkTheme, createLightTheme } from '@fluentui/react-components';
import type { BrandVariants, Theme } from '@fluentui/react-components';

export type papyrusToolsThemeMode = 'light' | 'dark' | 'highContrast';

const papyrusToolsBrand: BrandVariants = {
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

const papyrusToolsLightTheme = createLightTheme(papyrusToolsBrand);
const papyrusToolsDarkTheme = createDarkTheme(papyrusToolsBrand);

papyrusToolsDarkTheme.colorBrandForeground1 = papyrusToolsBrand[110];
papyrusToolsDarkTheme.colorBrandForeground2 = papyrusToolsBrand[120];

export const getpapyrusToolsTheme = (mode: papyrusToolsThemeMode): Theme => {
  switch (mode) {
    case 'dark':
    case 'highContrast':
      return papyrusToolsDarkTheme;
    case 'light':
    default:
      return papyrusToolsLightTheme;
  }
};

export const PAPYRUS_TOOLS_THEME_BRAND = papyrusToolsBrand;
