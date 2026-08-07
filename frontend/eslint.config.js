import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import boundaries from 'eslint-plugin-boundaries';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const FSD_ELEMENTS = [
    { type: 'app', pattern: 'src/app/*' },
    { type: 'pages', pattern: 'src/pages/*' },
    { type: 'widgets', pattern: 'src/widgets/*' },
    { type: 'features', pattern: 'src/features/*' },
    { type: 'entities', pattern: 'src/entities/*' },
    { type: 'shared', pattern: 'src/shared/*' },
];

export default defineConfig([
    globalIgnores(['dist']),
    {
        files: ['**/*.{ts,tsx}'],
        extends: [
            js.configs.recommended,
            tseslint.configs.recommended,
            reactHooks.configs.flat.recommended,
            reactRefresh.configs.vite,
        ],
        languageOptions: {
            globals: globals.browser,
        },
    },
    {
        files: ['src/**/*.{ts,tsx}'],
        plugins: { boundaries },
        settings: {
            'import/parsers': {
                '@typescript-eslint/parser': ['.ts', '.tsx'],
            },
            'import/resolver': {
                typescript: {
                    alwaysTryTypes: true,
                    project: './tsconfig.app.json',
                },
            },
            'boundaries/elements': FSD_ELEMENTS,
            'boundaries/include': ['src/**'],
        },
        rules: {
            'boundaries/dependencies': [
                'error',
                {
                    default: 'disallow',
                    policies: [
                        {
                            from: { element: { type: 'app' } },
                            allow: {
                                to: {
                                    element: {
                                        type: ['pages', 'widgets', 'features', 'entities', 'shared'],
                                    },
                                },
                            },
                        },
                        {
                            from: { element: { type: 'pages' } },
                            allow: {
                                to: {
                                    element: { type: ['widgets', 'features', 'entities', 'shared'] },
                                },
                            },
                        },
                        {
                            from: { element: { type: 'widgets' } },
                            allow: {
                                to: { element: { type: ['features', 'entities', 'shared'] } },
                            },
                        },
                        {
                            from: { element: { type: 'features' } },
                            allow: { to: { element: { type: ['entities', 'shared'] } } },
                        },
                        {
                            from: { element: { type: 'entities' } },
                            allow: { to: { element: { type: 'shared' } } },
                        },
                    ],
                },
            ],
        },
    },
]);
