import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import tsconfigPaths from 'vite-tsconfig-paths';

const POSITIONS_SERVICE = 'http://localhost:8080';
const ANALYTICS_SERVICE = 'http://localhost:8081';

const KEPT_DAYJS_LOCALES = ['en', 'ru'];
const DATE_UTILS_LOCALES = '@gravity-ui/date-utils/build/settings/locales.js';

function trimDayjsLocales(): Plugin {
    const loaders = KEPT_DAYJS_LOCALES.map(
        (locale) => `    ${locale}: () => import('dayjs/locale/${locale}.js'),`
    ).join('\n');

    return {
        name: 'skypulse:trim-dayjs-locales',
        apply: 'build',
        load(id) {
            if (!id.replaceAll('\\', '/').endsWith(DATE_UTILS_LOCALES)) {
                return null;
            }

            return [
                '"use strict";',
                'Object.defineProperty(exports, "__esModule", { value: true });',
                'exports.localeLoaders = void 0;',
                'exports.localeLoaders = {',
                loaders,
                '};',
            ].join('\n');
        },
    };
}

export default defineConfig(({ mode }) => {
    // В production CI подставляет адрес бакета, локально ассеты остаются на Vite-сервере.
    const env = loadEnv(mode, process.cwd(), 'VITE_');

    return {
        base: env.VITE_ASSET_BASE_URL || '/',

        build: {
            rolldownOptions: {
                output: {
                    codeSplitting: {
                        groups: [
                            {
                                name: 'react-vendor',
                                test: /node_modules[\\/](?:react|react-dom|scheduler|react-error-boundary)[\\/]/,
                                priority: 50,
                            },
                            {
                                name: 'router-vendor',
                                test: /node_modules[\\/]react-router[\\/]/,
                                priority: 40,
                            },
                            {
                                name: 'query-vendor',
                                test: /node_modules[\\/]@tanstack[\\/]/,
                                priority: 40,
                            },
                            {
                                name: 'maps-vendor',
                                test: /node_modules[\\/]@yandex[\\/]ymaps3-(?:clusterer|default-ui-theme)[\\/]/,
                                priority: 40,
                            },
                        ],
                    },
                },
            },
        },
        plugins: [
            react(),
            tsconfigPaths({ projects: ['./tsconfig.app.json'] }),
            trimDayjsLocales(),
            mode === 'analyze' &&
                visualizer({
                    filename: 'dist/stats.html',
                    template: 'treemap',
                    gzipSize: true,
                    brotliSize: true,
                }),
        ],
        // Lightning CSS нужен для custom media и адаптивных стилей из main.
        css: {
            transformer: 'lightningcss',
            lightningcss: {
                drafts: {
                    customMedia: true,
                },
            },
        },
        server: {
            proxy: {
                '^/api/stats': {
                    target: ANALYTICS_SERVICE,
                    changeOrigin: true,
                },
                '^/api/airports/[^/]+/(stats|flights)': {
                    target: ANALYTICS_SERVICE,
                    changeOrigin: true,
                },
                '/api': {
                    target: POSITIONS_SERVICE,
                    changeOrigin: true,
                },
            },
        },
    };
});
