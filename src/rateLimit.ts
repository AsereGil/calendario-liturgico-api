import type { MiddlewareHandler } from 'hono';

/**
 * Limitador de peticiones en memoria por dirección IP (ventana fija).
 *
 * Suficiente para un solo proceso (Railway, Node). En entornos con varias instancias
 * cada una lleva su propio conteo, lo cual sigue siendo una protección razonable
 * contra abuso para una API de solo lectura.
 */
export interface RateLimitOptions {
  /** Peticiones permitidas por ventana. */
  limit: number;
  /** Duración de la ventana en milisegundos. */
  windowMs: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

export function rateLimit(opts: RateLimitOptions): MiddlewareHandler {
  const buckets = new Map<string, Bucket>();

  // Limpieza periódica para que el mapa no crezca sin límite.
  const cleanup = () => {
    const now = Date.now();
    for (const [ip, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(ip);
    }
  };
  const timer = setInterval(cleanup, opts.windowMs);
  // No mantener vivo el proceso solo por este temporizador (Node).
  if (typeof timer === 'object' && timer && 'unref' in timer) {
    (timer as NodeJS.Timeout).unref();
  }

  return async (c, next) => {
    // Railway y Cloudflare están detrás de un proxy: la IP real viene en x-forwarded-for.
    const forwarded = c.req.header('x-forwarded-for');
    const ip =
      (forwarded ? forwarded.split(',')[0].trim() : '') ||
      c.req.header('cf-connecting-ip') ||
      c.req.header('x-real-ip') ||
      'desconocida';

    const now = Date.now();
    let bucket = buckets.get(ip);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + opts.windowMs };
      buckets.set(ip, bucket);
    }
    bucket.count++;

    const remaining = Math.max(0, opts.limit - bucket.count);
    const resetSeconds = Math.ceil((bucket.resetAt - now) / 1000);
    c.header('X-RateLimit-Limit', String(opts.limit));
    c.header('X-RateLimit-Remaining', String(remaining));
    c.header('X-RateLimit-Reset', String(resetSeconds));

    if (bucket.count > opts.limit) {
      c.header('Retry-After', String(resetSeconds));
      return c.json(
        {
          error: 'Demasiadas peticiones. Intenta de nuevo en unos segundos.',
          limite_por_minuto: opts.limit,
          reintentar_en_segundos: resetSeconds,
        },
        429
      );
    }

    await next();
  };
}
