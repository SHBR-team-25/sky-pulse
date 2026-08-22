import { useContext } from 'react';
import { AppThemeContext } from './context';

export function useAppTheme() {
    const context = useContext(AppThemeContext);

    if (!context) {
        throw new Error('useAppTheme must be used within AppThemeProvider');
    }

    return context;
}
