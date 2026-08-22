export type AppTheme = 'light' | 'dark';

export interface AppThemeContextValue {
    theme: AppTheme;
    toggleTheme: () => void;
}
