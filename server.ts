import express from 'express';
import { createServer as createHttpServer } from 'node:http';
import { resolve } from 'node:path';
import apiHandler from './api/[...path].ts';

const app = express();
const server = createHttpServer(app);
const port = Number(process.env.PORT) || 3000;

app.disable('x-powered-by');
app.use(express.json({ limit: '2mb' }));

// Reuse the same API handler locally and on Replit that Vercel calls as a Function.
app.use((req, res, next) => {
  if (req.path !== '/api' && !req.path.startsWith('/api/')) return next();
  void apiHandler(req, res).catch(next);
});

if (process.env.NODE_ENV === 'production') {
  const distPath = resolve(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get(/.*/, (_req, res) => res.sendFile(resolve(distPath, 'index.html')));
} else {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    appType: 'spa',
    server: {
      middlewareMode: true,
      hmr: { server },
    },
  });
  app.use(vite.middlewares);
}

app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Sunucu hatası.' });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`10n-Girls sunucusu ${port} portunda çalışıyor.`);
});
