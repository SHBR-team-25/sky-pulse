import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

const POSITIONS_SERVICE = 'http://localhost:8080';
const ANALYTICS_SERVICE = 'http://localhost:8081';

export default defineConfig(({ mode }) => {
    // В production CI подставляет адрес бакета, локально ассеты остаются на Vite-сервере.
    const env = loadEnv(mode, process.cwd(), 'VITE_');

    return {
        base: env.VITE_ASSET_BASE_URL || '/',
        plugins: [react(), tsconfigPaths({ projects: ['./tsconfig.app.json'] })],
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
