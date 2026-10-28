/**
 * Pruebas de regresión del motor litúrgico.
 * Ejecutar con: npm test
 *
 * Cada caso es una fecha con el resultado esperado según el Calendario Romano General
 * y el calendario propio de México (CEM). Si alguna falla, el motor cambió de comportamiento.
 */
import {
  calcularDiaLiturgico,
  calcularDomingoPascua,
  calcularAnioLiturgico,
  calcularMesLiturgico,
} from '../src/engine';

let total = 0;
let fallos = 0;

function check(nombre: string, condicion: boolean, detalle = '') {
  total++;
  if (condicion) {
    console.log(`  ✔ ${nombre}`);
  } else {
    fallos++;
    console.log(`  ✘ ${nombre}${detalle ? `  →  ${detalle}` : ''}`);
  }
}

function principal(fecha: string) {
  return calcularDiaLiturgico(fecha).celebracion_principal.celebracion;
}
function temporal(fecha: string) {
  return calcularDiaLiturgico(fecha).tabla_ciclos.ciclo_temporal.celebracion;
}
function esperaPrincipal(fecha: string, contiene: string) {
  const p = principal(fecha);
  check(`${fecha} principal incluye "${contiene}"`, p.includes(contiene), `obtenido: "${p}"`);
}
function esperaTemporal(fecha: string, contiene: string) {
  const t = temporal(fecha);
  check(`${fecha} temporal incluye "${contiene}"`, t.includes(contiene), `obtenido: "${t}"`);
}
function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}

console.log('\n■ Domingo de Pascua');
for (const [y, esperado] of [
  [2024, '2024-03-31'],
  [2025, '2025-04-20'],
  [2026, '2026-04-05'],
  [2027, '2027-03-28'],
  [2038, '2038-04-25'],
] as const) {
  check(`Pascua ${y} = ${esperado}`, iso(calcularDomingoPascua(y)) === esperado, iso(calcularDomingoPascua(y)));
}

console.log('\n■ Calendario propio de México: Epifanía, Bautismo, Ascensión, Corpus');
esperaTemporal('2026-01-04', 'Epifanía');
esperaTemporal('2027-01-03', 'Epifanía');
esperaTemporal('2026-01-11', 'Bautismo');
esperaTemporal('2023-01-08', 'Epifanía'); // Epifanía el 8 de enero
esperaTemporal('2023-01-09', 'Bautismo'); // → Bautismo pasa al lunes
esperaTemporal('2024-01-07', 'Epifanía');
esperaTemporal('2024-01-08', 'Bautismo');
esperaTemporal('2026-05-17', 'Ascensión'); // VII Domingo de Pascua
esperaPrincipal('2026-05-14', 'San Matías'); // El jueves queda libre
esperaTemporal('2026-06-04', 'Corpus Christi'); // Jueves
esperaTemporal('2026-05-24', 'Pentecostés');
esperaPrincipal('2026-05-25', 'Madre de la Iglesia');
esperaPrincipal('2026-06-12', 'Sagrado Corazón');
esperaPrincipal('2026-06-13', 'Inmaculado Corazón'); // Sábado siguiente

console.log('\n■ Traslados de solemnidades');
esperaPrincipal('2024-03-25', 'Feria de Semana Santa'); // Lunes Santo
esperaPrincipal('2024-04-08', 'Anunciación'); // → lunes tras la Octava
esperaPrincipal('2027-03-25', 'Jueves Santo');
esperaPrincipal('2027-04-05', 'Anunciación');
esperaPrincipal('2012-03-26', 'Anunciación'); // 25 fue V Domingo de Cuaresma
esperaPrincipal('2024-12-08', 'II Domingo de Adviento');
esperaPrincipal('2024-12-09', 'Inmaculada'); // → lunes
esperaPrincipal('2023-03-19', 'IV Domingo de Cuaresma');
esperaPrincipal('2023-03-20', 'San José'); // → lunes
esperaPrincipal('2008-03-15', 'San José'); // 19 fue Miércoles Santo → sábado antes de Ramos
esperaPrincipal('2016-03-19', 'San José'); // Sábado antes de Ramos: se queda
esperaPrincipal('2022-06-24', 'Sagrado Corazón');
esperaPrincipal('2022-06-23', 'San Juan Bautista'); // → se anticipa al jueves
esperaPrincipal('2038-06-24', 'Corpus Christi');
esperaPrincipal('2038-06-25', 'San Juan Bautista'); // → viernes
esperaPrincipal('2025-06-29', 'San Pedro y San Pablo'); // Domingo TO: la solemnidad gana
esperaPrincipal('2026-11-01', 'Todos los Santos'); // Domingo TO
esperaPrincipal('2025-11-02', 'Fieles Difuntos'); // Domingo TO
check('2024-04-08 marca trasladada_desde', calcularDiaLiturgico('2024-04-08').celebracion_principal.trasladada_desde === '2024-03-25');

console.log('\n■ Nuestra Señora de Guadalupe (indulto CEM)');
esperaPrincipal('2021-12-12', 'Guadalupe'); // Domingo III de Adviento
esperaPrincipal('2027-12-12', 'Guadalupe');
esperaPrincipal('2032-12-12', 'Guadalupe');
esperaPrincipal('2026-12-12', 'Guadalupe'); // Sábado
esperaPrincipal('2027-12-13', 'Santa Lucía'); // No se traslada al 13
check('2038-12-12 (domingo, después de 2032) lleva AVISO en notas', (calcularDiaLiturgico('2038-12-12').tabla_ciclos.ciclo_misterios?.notas ?? '').includes('AVISO'));

console.log('\n■ Precedencia en tiempos fuertes');
esperaPrincipal('2026-02-23', 'Feria de Cuaresma'); // feria gana a memorias
esperaPrincipal('2026-03-30', 'Feria de Semana Santa');
esperaPrincipal('2026-04-06', 'Octava de Pascua');
esperaPrincipal('2026-12-07', 'San Ambrosio'); // memoria obligatoria gana a feria de Adviento (antes del 17)
esperaPrincipal('2026-12-17', 'Feria Privilegiada'); // 17-23 dic la feria gana
esperaPrincipal('2026-12-26', 'San Esteban'); // fiesta gana a la octava de Navidad
esperaPrincipal('2026-01-01', 'Madre de Dios');
esperaPrincipal('2026-12-27', 'Sagrada Familia');
esperaPrincipal('2022-12-30', 'Sagrada Familia'); // Navidad en domingo → 30 dic
esperaPrincipal('2026-02-02', 'Presentación'); // fiesta del Señor en día de semana
esperaPrincipal('2025-11-09', 'Letrán'); // fiesta del Señor sustituye al domingo TO
esperaPrincipal('2026-11-22', 'Rey del Universo');

console.log('\n■ Santoral: rangos corregidos y santo del día');
esperaPrincipal('2026-02-05', 'San Felipe de Jesús');
check('2026-02-05 San Felipe de Jesús es Fiesta', calcularDiaLiturgico('2026-02-05').celebracion_principal.rango === 'Fiesta');
esperaPrincipal('2026-12-09', 'San Juan Diego');
esperaPrincipal('2026-05-21', 'Cristóbal Magallanes');
esperaPrincipal('2026-07-29', 'Marta, María y Lázaro');
esperaPrincipal('2026-10-27', 'Feria del Tiempo Ordinario'); // feria, no el beato
check('2026-10-27 santo_del_dia presente', !!calcularDiaLiturgico('2026-10-27').santo_del_dia);
check('2026-03-19 santo_del_dia es San José', (calcularDiaLiturgico('2026-03-19').santo_del_dia?.celebracion ?? '').includes('San José'));
check('2024-02-29 santo_del_dia presente', !!calcularDiaLiturgico('2024-02-29').santo_del_dia);

console.log('\n■ Misas votivas y libre elección');
{
  const a = calcularAnioLiturgico(2026);
  const votivas = a.filter((r) => r.tabla_ciclos.misa_votiva_devocion_dia).length;
  const libres = a.filter((r) => r.es_libre_eleccion_ferial);
  check('2026 tiene misas votivas entre semana (>100)', votivas > 100, String(votivas));
  check('2026 tiene días de libre elección (>100)', libres.length > 100, String(libres.length));
  check('ningún día de libre elección en Cuaresma o 17-23 dic', libres.every((r) => !/Cuaresma|Privilegiada|Semana Santa/.test(r.celebracion_principal.celebracion)));
  check('ningún santo de prioridad 12 como principal', a.every((r) => !(r.celebracion_principal.ciclo === 'Ciclo Santoral' && r.celebracion_principal.prioridad >= 12)));
  esperaPrincipal('2026-07-02', 'Primer Jueves');
}

console.log('\n■ Domingos del Tiempo Ordinario 2020-2040');
{
  let sinNombre = 0;
  for (let y = 2020; y <= 2040; y++) {
    for (const r of calcularAnioLiturgico(y)) {
      if (r.dia_semana_iso === 7 && r.tabla_ciclos.ciclo_temporal.celebracion.startsWith('Feria')) sinNombre++;
    }
  }
  check('ningún domingo queda como feria', sinNombre === 0, String(sinNombre));
  const seq = (y: number) =>
    calcularAnioLiturgico(y)
      .filter((r) => r.dia_semana_iso === 7)
      .map((r) => r.tabla_ciclos.ciclo_temporal.celebracion)
      .filter((s) => s.includes('Domingo del Tiempo Ordinario'))
      .map((s) => s.split(' ')[0])
      .join(',');
  check('2026 salta VII-IX (Pentecostés/Trinidad)', seq(2026).startsWith('II,III,IV,V,VI,X,XI'), seq(2026));
  check('2038 (Pascua tardía) salta X-XII', seq(2038).includes('IX,XIII,XIV'), seq(2038));
  check('todos los años terminan en XXXIII', [2023, 2024, 2026, 2027, 2038].every((y) => seq(y).endsWith('XXXIII')));
}

console.log('\n■ Validación de entradas');
for (const bad of ['2026-13-01', '2026-02-30', 'hola', '26-10-27']) {
  let lanzo = false;
  try { calcularDiaLiturgico(bad); } catch { lanzo = true; }
  check(`rechaza fecha "${bad}"`, lanzo);
}
for (const bad of [NaN, 0, 1500, 2026.5]) {
  let lanzo = false;
  try { calcularAnioLiturgico(bad); } catch { lanzo = true; }
  check(`rechaza año ${bad}`, lanzo);
}
{
  let lanzo = false;
  try { calcularMesLiturgico(2026, 13); } catch { lanzo = true; }
  check('rechaza mes 13', lanzo);
  check('febrero 2024 tiene 29 días', calcularMesLiturgico(2024, 2).length === 29);
  check('2026 tiene 365 días', calcularAnioLiturgico(2026).length === 365);
}

console.log(`\n${total - fallos}/${total} pruebas correctas${fallos ? `, ${fallos} fallaron` : ''}.\n`);
process.exit(fallos ? 1 : 0);
