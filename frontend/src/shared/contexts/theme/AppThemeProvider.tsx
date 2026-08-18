import { ThemeProvider } from '@gravity-ui/uikit';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppThemeContext } from './context';
import type { AppTheme } from './types';

const THEME_STORAGE_KEY = 'sky-pulse-theme';

function getInitialTheme(): AppTheme {
    try {
        const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

        if (savedTheme === 'light' || savedTheme === 'dark') {
            return savedTheme;
        }
    } catch {
        throw new Error('error'); // TODO:
    }

    return 'light';
}

interface AppThemeProviderProps {
    children: ReactNode;
}

export function AppThemeProvider({ children }: AppThemeProviderProps) {
    const [theme, setTheme] = useState<AppTheme>(getInitialTheme);

    useEffect(() => {
        try {
            window.localStorage.setItem(THEME_STORAGE_KEY, theme);
        } catch {
            throw new Error('error'); // TODO:
        }
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'));
    }, []);

    const contextValue = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

    return (
        <AppThemeContext value={contextValue}>
            <ThemeProvider theme={theme}>{children}</ThemeProvider>
        </AppThemeContext>
    );
}
