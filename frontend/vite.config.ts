import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import tsconfigPaths from 'vite-tsconfig-paths';

const POSITIONS_SERVICE = 'http://localhost:8080';
const ANALYTICS_SERVICE = 'http://localhost:8081';

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
