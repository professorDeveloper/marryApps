import fs from 'fs';
import path from 'path';
import checker from 'vite-plugin-checker';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react-swc';

function missingI18nLoggerPlugin(): Plugin {
  const logFile = path.resolve(process.cwd(), 'logs', 'missing-i18n.log');
  return {
    name: 'missing-i18n-logger',
    configureServer(server) {
      try {
        fs.mkdirSync(path.dirname(logFile), { recursive: true });
      } catch {
        /* ignore */
      }
      server.middlewares.use('/__missing-i18n', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end();
          return;
        }
        const chunks: Buffer[] = [];
        req.on('data', (c: Buffer) => chunks.push(c));
        req.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8');
          let line = raw;
          try {
            const parsed = JSON.parse(raw);
            line = JSON.stringify(parsed);
          } catch {
            /* keep raw */
          }
          fs.appendFile(logFile, `${line}\n`, () => {});
          res.statusCode = 204;
          res.end();
        });
      });
    },
  };
}

// ----------------------------------------------------------------------

const PORT = 8081;

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
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('@mui/x-data-grid') || id.includes('@mui/x-virtualizer')) return 'vendor-datagrid';
          if (id.includes('@mui/x-date-pickers')) return 'vendor-datepickers';
          // catch-all for @mui internals (system, utils, styled-engine, private-theming,
          // x-internals) — without this they get merged into whichever chunk references
          // them first (vendor-datagrid), dragging it into every page's startup graph
          if (id.includes('@mui/') || id.includes('@emotion')) return 'vendor-mui';
          if (
            id.includes('/react-dom/') ||
            id.includes('/react/') ||
            id.includes('/scheduler/') ||
            id.includes('use-sync-external-store') ||
            id.includes('/prop-types/') ||
            id.includes('@babel/runtime') ||
            id.includes('/clsx/')
          )
            return 'vendor-react';
          if (id.includes('react-router'))        return 'vendor-router';
          if (id.includes('i18next') || id.includes('react-i18next')) return 'vendor-i18n';
          if (id.includes('@reduxjs/toolkit') || id.includes('react-redux') || id.includes('/reselect/')) return 'vendor-redux';
          return undefined;
        },
      },
    },
  },
});
