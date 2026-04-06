import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
// ----------------------------------------------------------------------
var PORT = 8081;
export default defineConfig({
    plugins: [
        react(),
        // checker({
        //   typescript: true,
        //   eslint: {
        //     useFlatConfig: true,
        //     lintCommand: 'eslint "./src/**/*.{js,jsx,ts,tsx}"',
        //     dev: { logLevel: ['error'] },
        //   },
        //   overlay: {
        //     position: 'tl',
        //     initialIsOpen: false,
        //   },
        // }),
    ],
    resolve: {
        alias: [
            {
                find: /^src\//,
                replacement: path.resolve(process.cwd(), 'src') + '/',
            },
        ],
    },
    server: { port: PORT, host: true },
    preview: { port: PORT, host: true },
    // NOTE: production still emits a very large entry chunk because
    // `src/routes/sections/menu.tsx` eagerly static-imports most dashboard screens.
    // Use `yarn dev` for day-to-day work; reducing that file to `lazy()` imports
    // is the real fix for fast `vite build` + `vite preview`.
    build: {
        chunkSizeWarningLimit: 3000,
    },
});
