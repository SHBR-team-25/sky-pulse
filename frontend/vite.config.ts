import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const POSITIONS_SERVICE = 'http://localhost:8080';
const ANALYTICS_SERVICE = 'http://localhost:8081';

export default defineConfig({
    plugins: [react()],
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
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@app': path.resolve(__dirname, './src/app'),
            '@pages': path.resolve(__dirname, './src/pages'),
            '@widgets': path.resolve(__dirname, './src/widgets'),
            '@features': path.resolve(__dirname, './src/features'),
            '@entities': path.resolve(__dirname, './src/entities'),
            '@shared': path.resolve(__dirname, './src/shared'),
        },
    },
});
