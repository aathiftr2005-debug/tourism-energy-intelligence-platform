export type ThemeId = 'dark' | 'light' | 'high-contrast';

export interface ThemeDefinition {
  id: ThemeId;
  label: string;
  description: string;
  icon: string;
}

export const THEMES: ThemeDefinition[] = [
  {
    id: 'dark',
    label: 'Dark Space',
    description: 'Immersive dark theme with cyan accents',
    icon: '\ud83c\udf19',
  },
  {
    id: 'light',
    label: 'Light Professional',
    description: 'Clean light theme for daytime use',
    icon: '\u2600\ufe0f',
  },
  {
    id: 'high-contrast',
    label: 'High Contrast',
    description: 'Maximum readability and accessibility',
    icon: '\ud83d\udd0d',
  },
];

export const THEME_STORAGE_KEY = 'tei-theme';
