import { serve } from '@hono/node-server';
import app from './index';

const port = Number(process.env.PORT) || 3000;
console.log(`Servidor API Litúrgica ejecutándose en http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
