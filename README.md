# API de Calendario y Santoral Litúrgico Católico (TypeScript + Hono)

Motor de cálculo del calendario litúrgico católico según el **Calendario Romano General con el propio de México (CEM)**, expuesto como API REST y utilizable también sin servidor dentro de cualquier app.

Todo se calcula en memoria, sin base de datos:

- **Pascua perpetua** (algoritmo de Meeus/Jones/Butcher) para cualquier año entre 1583 y 4099.
- **Ciclo Temporal completo**: Triduo Pascual, domingos de Adviento, Navidad, Cuaresma y Pascua (con sus introitos en latín), domingos del Tiempo Ordinario con la numeración correcta de cada año, ferias privilegiadas y ordinarias.
- **Calendario propio de México**: Epifanía y Ascensión en domingo, Bautismo del Señor al lunes cuando corresponde, Corpus Christi en jueves, Nuestra Señora de Guadalupe en domingo de Adviento por indulto de la CEM.
- **Traslados automáticos de solemnidades** (Anunciación, San José, Inmaculada, San Juan Bautista…) cuando chocan con Semana Santa, la Octava de Pascua, domingos de tiempos fuertes o solemnidades del Señor. El campo `trasladada_desde` indica la fecha original.
- **Ciclo de los Misterios del Señor, de la Virgen y de los Ángeles**, fijos y móviles.
- **Santoral de 366 días** (`src/data/santoral.json`) con varios santos por fecha; el campo `santo_del_dia` devuelve siempre el santo destacado de la fecha, aunque litúrgicamente ese día sea feria.
- **Misas votivas y devoción del día de la semana**, con la excepción pastoral (IGMR 376) para primer jueves, viernes y sábado de mes.
- **Piedad popular**: devociones mensuales, dedicación del mes y temporadas móviles (Cuaresma de San Miguel, Siete Domingos de San José, Viernes de Dolores, novenas, Témporas, DOMUND, Docenario Guadalupano, Posadas).

---

## Endpoints

| Ruta | Descripción | Caché |
|---|---|---|
| `GET /` | Índice de la API y versión | — |
| `GET /health` | Verificación de vida (`{ ok, version, timestamp }`) | sin caché |
| `GET /api/v1/hoy?tz=America/Mexico_City` | Liturgia del día actual en la zona horaria indicada | 5 min |
| `GET /api/v1/fecha/2026-10-27` | Cualquier fecha `YYYY-MM-DD` | 1 año |
| `GET /api/v1/mes/2026/10` | Todos los días de un mes | 1 año |
| `GET /api/v1/anio/2026` | Los 365/366 días del año | 1 año |
| `GET /api/v1/santoral` | Catálogos base (`santoral.json` y `misteriosFijos.json`) | 1 año |

Las respuestas de fechas concretas nunca cambian, por eso llevan `Cache-Control` de un año: los navegadores y apps que las consumen no vuelven a pedirlas.

**Límite de uso:** 120 peticiones por minuto por dirección IP en `/api/*`. Al superarlo la API responde `429` con las cabeceras `X-RateLimit-*` y `Retry-After`.

**CORS:** abierto. La API es pública y de solo lectura; puede consumirse desde cualquier sitio web o aplicación.

### Campos principales de la respuesta

```jsonc
{
  "fecha": "2026-10-27",
  "tiempo_liturgico": "Tiempo Ordinario (Segunda Parte)",
  "ciclo_dominical": "Ciclo A",
  "ciclo_ferial": "Año II (Par)",
  "celebracion_principal": { "celebracion": "Feria del Tiempo Ordinario", "rango": "...", "color": "Verde", "prioridad": 11.5 },
  "santo_del_dia": { "celebracion": "Beato Salvador Ventura Mollar", "rango": "Memoria Libre", "color": "Rojo" },
  "es_libre_eleccion_ferial": true,
  "tabla_ciclos": { "ciclo_temporal": {}, "ciclo_misterios": {}, "ciclo_santoral": {}, "santos_del_dia": [], "misa_votiva_devocion_dia": {} },
  "piedad_popular": { "devociones_mensuales": [], "dedicacion_del_mes": "...", "devociones_temporadas_moviles": [] }
}
```

`celebracion_principal` es lo que litúrgicamente se celebra ese día (feria, memoria obligatoria, fiesta o solemnidad). `santo_del_dia` es el santo destacado de la fecha y siempre está presente, incluso cuando la celebración principal es una feria. Las apps deben mostrar ambos.

---

## Desarrollo local

```bash
npm install
npm run dev:node      # servidor en http://localhost:3000 con recarga automática
npm test              # pruebas de regresión del motor (85 casos)
npm run typecheck     # verificación de tipos
```

---

## Despliegue en Railway

El proyecto está listo para Railway sin configuración adicional:

1. Sube el repositorio a GitHub.
2. En Railway: **+ New → GitHub Repo** y elige este repositorio. Railway detecta Node y ejecuta `npm start`.
3. `railway.json` ya define `npm start` como comando de inicio y `/health` como ruta de verificación; Railway no manda tráfico hasta que el servicio responde.
4. Cuando termine el deploy: **Settings → Networking → Generate Domain** para obtener la URL pública.
5. Comprueba:
   - `https://TU-DOMINIO/health`
   - `https://TU-DOMINIO/api/v1/hoy`
   - `https://TU-DOMINIO/api/v1/fecha/2027-12-12` (Guadalupe en domingo de Adviento)
   - `https://TU-DOMINIO/api/v1/anio/2026`

No requiere variables de entorno: `PORT` lo inyecta Railway. Cada `git push` a la rama principal redespliega automáticamente.

### Otros destinos

- **Cloudflare Workers:** `npm run deploy:worker` (`wrangler.toml` incluido). Ten en cuenta que `/api/v1/anio` usa ~15 ms de CPU y el plan gratuito permite 10 ms por petición; la caché mitiga esto pero no lo elimina.
- **Node en cualquier servidor:** `npm install && npm start`. Escucha en `process.env.PORT` o 3000.

---

## Uso sin servidor (React Native / Expo / web estática)

`src/engine.ts` no depende de Hono ni de ninguna librería. Copia `src/engine.ts` y la carpeta `src/data/` dentro de tu app y llama directamente:

```typescript
import { calcularDiaLiturgico } from './engine';

const hoy = calcularDiaLiturgico('2026-10-27');
console.log(hoy.celebracion_principal.celebracion); // "Feria del Tiempo Ordinario"
console.log(hoy.santo_del_dia?.celebracion);         // "Beato Salvador Ventura Mollar"
```

Así la app funciona sin conexión y sin depender de la API en línea.

---

## Nota litúrgica sobre el 12 de diciembre (Nuestra Señora de Guadalupe)

En México, por **indulto apostólico** concedido a la Conferencia del Episcopado Mexicano (CEM), cuando la Solemnidad de **Nuestra Señora de Guadalupe (12 de diciembre)** coincide con un domingo de Adviento (como en 2021, 2027 y 2032), se celebra ese mismo domingo sin trasladarla al lunes 13. El permiso original es de la Congregación para el Culto Divino (1971, Prot. 1582/71); desde 2013 la CEM emite un decreto en cada año de coincidencia.

- **Horizonte de revisión (2032):** la interpretación actual de la CEM contempla hasta el 12 de diciembre de 2032. Para años posteriores (el siguiente domingo es 2038), el motor incluye un aviso automático en el campo `notas` para recordar verificar la disposición vigente.

---

## Estructura

```
src/
  engine.ts          Motor de cálculo (sin dependencias)
  index.ts           API REST (Hono): rutas, caché, CORS
  rateLimit.ts       Limitador de peticiones por IP
  server-node.ts     Arranque en Node.js (Railway, servidores)
  data/
    santoral.json    Santoral, 366 días, varios santos por fecha
    misteriosFijos.json
tests/
  engine.test.ts     Pruebas de regresión (npm test)
railway.json         Configuración de despliegue en Railway
wrangler.toml        Configuración para Cloudflare Workers
```
