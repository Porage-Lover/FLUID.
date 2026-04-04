import { Sun, Moon, Square } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type ThemeId = string;

export interface ThemeDef {
  id: ThemeId;
  label: string;
  icon: LucideIcon;
  fontFamily?: string;
  isSpecialShader?: boolean;
}

export const THEMES: ThemeDef[] = [
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'light', label: 'Light', icon: Sun },
  { 
    id: 'pacman', 
    label: 'Pacman', 
    icon: Square, 
    fontFamily: "'Pixelify Sans', sans-serif",
    isSpecialShader: true
  }
];

export const getThemeDef = (id: ThemeId): ThemeDef => {
  return THEMES.find(t => t.id === id) || THEMES[0];
};