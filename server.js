import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import app from './backend/hono';

const port = parseInt(process.env.PORT || '3000', 10);

app.use('/assets/*', serveStatic({ root: './dist' }));
app.use('/_expo/*', serveStatic({ root: './dist' }));
app.use('/static/*', serveStatic({ root: './dist' }));

app.get('*', serveStatic({ root: './dist', rewriteRequestPath: (path) => '/index.html' }));

console.log(`[Server] Starting on port ${port}...`);

serve({
  fetch: app.fetch,
  port,
});

console.log(`[Server] Running at http://localhost:${port}`);
