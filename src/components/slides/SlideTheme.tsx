import React, { createContext, useContext } from 'react';

export interface SlideTheme {
  primaryColor: string;
  primaryColorLight: string;
  accentColor: string;
  agencyName: string;
  logoUrl?: string;
  showLogo: boolean;
  footerText: string;
  titleOverride?: string;
  subtitleOverride?: string;
}

export const DEFAULT_THEME: SlideTheme = {
  primaryColor: '#3d6b4f',
  primaryColorLight: '#e8f5ec',
  accentColor: '#c8892e',
  agencyName: 'SeeID',
  showLogo: true,
  footerText: '',
};

const SlideThemeContext = createContext<SlideTheme>(DEFAULT_THEME);

export function SlideThemeProvider({ theme, children }: { theme: SlideTheme; children: React.ReactNode }) {
  return <SlideThemeContext.Provider value={theme}>{children}</SlideThemeContext.Provider>;
}

export function useSlideTheme() {
  return useContext(SlideThemeContext);
}

/** Helper: lighten a hex color to ~15% opacity equivalent on white */
export function lightenColor(hex: string): string {
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const mix = (c: number) => Math.round(c * 0.12 + 255 * 0.88);
    return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
  } catch {
    return '#e8f5ec';
  }
}
