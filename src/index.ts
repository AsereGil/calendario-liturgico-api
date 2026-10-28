import { Hono } from 'hono';
import { cors } from 'hono/cors';
import {
  calcularDiaLiturgico,
  calcularMesLiturgico,
  calcularAnioLiturgico,
} from './engine';
import { rateLimit } from './rateLimit';
import santoralData from './data/santoral.json';
import misteriosFijosData from './data/misteriosFijos.json';
import pkg from '../package.json';

const app = new Hono();

// Los resultados de una fecha nunca cambian: se pueden cachear indefinidamente.
const CACHE_INMUTABLE = 'public, max-age=31536000, immutable';
// "Hoy" depende del reloj: caché corta.
const CACHE_HOY = 'public, max-age=300';

// CORS abierto: API pública de solo lectura, consumible desde cualquier web o app.
app.use('/*', cors());

// Límite de peticiones por IP (120 por minuto). Protege el consumo en Railway.
app.use('/api/*', rateLimit({ limit: 120, windowMs: 60_000 }));

app.get('/', (c) => {
  return c.json({
    nombre: 'API de Calendario y Santoral Litúrgico Católico',
    version: pkg.version,
    calendario: 'Calendario Romano General con propio de México (CEM)',
    endpoints: {
      hoy: '/api/v1/hoy (opcional: ?tz=America/Mexico_City)',
      por_fecha: '/api/v1/fecha/:fecha (ej. /api/v1/fecha/2026-10-27)',
      por_mes: '/api/v1/mes/:anio/:mes (ej. /api/v1/mes/2026/10)',
      por_anio: '/api/v1/anio/:anio (ej. /api/v1/anio/2026)',
      catalogo_santoral: '/api/v1/santoral',
      salud: '/health',
    },
  });
});

// Verificación de vida para Railway (Healthcheck Path) y monitoreo.
app.get('/health', (c) => {
  c.header('Cache-Control', 'no-store');
  return c.json({ ok: true, version: pkg.version, timestamp: new Date().toISOString() });
});

app.get('/api/v1/hoy', (c) => {
  const tz = c.req.query('tz') || 'America/Mexico_City';
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const fechaHoy = formatter.format(new Date()); // YYYY-MM-DD
    const data = calcularDiaLiturgico(fechaHoy);
    c.header('Cache-Control', CACHE_HOY);
    return c.json(data);
  } catch (err: any) {
    // Intl lanza RangeError si la zona horaria no existe.
    const mensaje =
      err instanceof RangeError ? `Zona horaria inválida: "${tz}".` : err.message;
    return c.json({ error: mensaje }, 400);
  }
});

app.get('/api/v1/fecha/:fecha', (c) => {
  const fecha = c.req.param('fecha');
  try {
    const data = calcularDiaLiturgico(fecha);
    c.header('Cache-Control', CACHE_INMUTABLE);
    return c.json(data);
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
});

app.get('/api/v1/mes/:anio/:mes', (c) => {
  const anio = Number(c.req.param('anio'));
  const mes = Number(c.req.param('mes'));
  try {
    const dias = calcularMesLiturgico(anio, mes);
    c.header('Cache-Control', CACHE_INMUTABLE);
    return c.json({ anio, mes, total_dias: dias.length, dias });
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
});

app.get('/api/v1/anio/:anio', (c) => {
  const anio = Number(c.req.param('anio'));
  try {
    const dias = calcularAnioLiturgico(anio);
    c.header('Cache-Control', CACHE_INMUTABLE);
    return c.json({ anio, total_dias: dias.length, dias });
  } catch (err: any) {
    return c.json({ error: err.message }, 400);
  }
});

app.get('/api/v1/santoral', (c) => {
  c.header('Cache-Control', CACHE_INMUTABLE);
  return c.json({
    total_santoral: santoralData.length,
    total_misterios_fijos: misteriosFijosData.length,
    misterios_fijos: misteriosFijosData,
    santoral: santoralData,
  });
});

app.notFound((c) => {
  return c.json(
    { error: 'Ruta no encontrada. Consulta GET / para ver los endpoints disponibles.' },
    404
  );
});

export default app;
