import React, { createContext, useContext } from 'react';
import { darkTheme } from '../lib/theme';

const ThemeContext = createContext(darkTheme);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => (
  <ThemeContext.Provider value={darkTheme}>
    {children}
  </ThemeContext.Provider>
);

export const useTheme = () => useContext(ThemeContext);
