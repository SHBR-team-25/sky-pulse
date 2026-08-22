import { createContext } from 'react';
import type { AppThemeContextValue } from './types';

export const AppThemeContext = createContext<AppThemeContextValue | null>(null);
