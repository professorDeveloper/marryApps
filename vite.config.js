import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
function missingI18nLoggerPlugin() {
    var logFile = path.resolve(process.cwd(), 'logs', 'missing-i18n.log');
    return {
        name: 'missing-i18n-logger',
        configureServer: function (server) {
            try {
                fs.mkdirSync(path.dirname(logFile), { recursive: true });
            }
            catch (_a) {
                /* ignore */
            }
            server.middlewares.use('/__missing-i18n', function (req, res) {
                if (req.method !== 'POST') {
                    res.statusCode = 405;
                    res.end();
                    return;
                }
                var chunks = [];
                req.on('data', function (c) { return chunks.push(c); });
                req.on('end', function () {
                    var raw = Buffer.concat(chunks).toString('utf8');
                    var line = raw;
                    try {
                        var parsed = JSON.parse(raw);
                        line = JSON.stringify(parsed);
                    }
                    catch (_a) {
                        /* keep raw */
                    }
                    fs.appendFile(logFile, "".concat(line, "\n"), function () { });
                    res.statusCode = 204;
                    res.end();
                });
            });
        },
    };
}
// ----------------------------------------------------------------------
var PORT = 8081;
export default defineConfig({
    plugins: [
        react(),
        missingI18nLoggerPlugin(),
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
    build: {
        chunkSizeWarningLimit: 500,
        rollupOptions: {
            output: {
                manualChunks: function (id) {
                    if (!id.includes('node_modules'))
                        return undefined;
                    if (id.includes('@mui/x-data-grid'))
                        return 'vendor-datagrid';
                    if (id.includes('@mui/x-date-pickers'))
                        return 'vendor-datepickers';
                    if (id.includes('@mui/material') || id.includes('@emotion'))
                        return 'vendor-mui';
                    if (id.includes('/react-dom/') || id.includes('/react/'))
                        return 'vendor-react';
                    if (id.includes('react-router'))
                        return 'vendor-router';
                    if (id.includes('i18next') || id.includes('react-i18next'))
                        return 'vendor-i18n';
                    if (id.includes('@reduxjs/toolkit') || id.includes('react-redux'))
                        return 'vendor-redux';
                    return undefined;
                },
            },
        },
    },
});
