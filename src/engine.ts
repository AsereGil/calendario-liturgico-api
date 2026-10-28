import santoralData from './data/santoral.json';
import misteriosFijosData from './data/misteriosFijos.json';

export const PRIORIDAD_FERIA = 11.5;

export interface OpcionLiturgica {
  ciclo: string;
  celebracion: string;
  categoria?: string;
  rango: string;
  color: string;
  prioridad: number;
  orden?: number;
  es_principal_diocesano?: boolean;
  trasladada_desde?: string;
  notas?: string;
}

export interface RespuestaDiaLiturgico {
  fecha: string;
  anio: number;
  mes: number;
  dia: number;
  dia_semana_iso: number; // 1 = Lunes ... 7 = Domingo
  dia_semana_nombre: string;
  domingo_pascua: string;
  tiempo_liturgico: string;
  ciclo_dominical: 'Ciclo A' | 'Ciclo B' | 'Ciclo C';
  ciclo_ferial: 'Año I (Impar)' | 'Año II (Par)';
  calendario_ciclo_liturgico: string;
  celebracion_principal: OpcionLiturgica;
  santo_del_dia: OpcionLiturgica | null;
  es_libre_eleccion_ferial: boolean;
  tabla_ciclos: {
    ciclo_temporal: OpcionLiturgica;
    ciclo_misterios: OpcionLiturgica | null;
    ciclo_santoral: OpcionLiturgica | null;
    santos_del_dia: OpcionLiturgica[];
    santo_del_dia: OpcionLiturgica | null;
    otros_santos_texto: string;
    misa_votiva_devocion_dia: OpcionLiturgica | null;
  };
  piedad_popular: {
    devociones_mensuales: string[];
    devociones_mensuales_texto: string;
    dedicacion_del_mes: string;
    devociones_temporadas_moviles: string[];
    devociones_temporadas_moviles_texto: string;
  };
}

const DIAS_SEMANA = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
];

const ROMANOS = [
  '', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
  'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX',
  'XXI', 'XXII', 'XXIII', 'XXIV', 'XXV', 'XXVI', 'XXVII', 'XXVIII', 'XXIX', 'XXX',
  'XXXI', 'XXXII', 'XXXIII', 'XXXIV'
];

const DEDICACION_MES: Record<number, string> = {
  1: 'Enero: Mes del Santísimo Nombre de Jesús y de la Divina Infancia',
  2: 'Febrero: Mes de la Sagrada Familia y de la Purificación de María',
  3: 'Marzo: Mes de San José, Esposo de la Virgen María',
  4: 'Abril: Mes de la Santísima Eucaristía y del Espíritu Santo',
  5: 'Mayo: Mes de la Santísima Virgen María (Flores de Mayo)',
  6: 'Junio: Mes del Sagrado Corazón de Jesús',
  7: 'Julio: Mes de la Preciosísima Sangre de Nuestro Señor Jesucristo',
  8: 'Agosto: Mes del Inmaculado Corazón de María',
  9: 'Septiembre: Mes de la Biblia y de Nuestra Señora de los Dolores',
  10: 'Octubre: Mes del Santo Rosario y de las Misiones',
  11: 'Noviembre: Mes de las Benditas Ánimas del Purgatorio',
  12: 'Diciembre: Mes del Adviento y de la Inmaculada Concepción y Natividad del Señor',
};

const DEVOCIONES_DIA_FIJO: Record<number, string> = {
  1: 'Día 1: Santísima Trinidad y Divina Providencia (Encendido del cirio mensual)',
  3: 'Día 3: San Martín de Porres / Santa Cruz',
  8: 'Día 8: Conmemoración mensual de la Inmaculada Concepción',
  11: 'Día 11: Conmemoración mensual de Nuestra Señora de Lourdes (Oración por los enfermos)',
  12: 'Día 12: Conmemoración mensual de Nuestra Señora de Guadalupe',
  13: 'Día 13: Conmemoración mensual de Nuestra Señora de Fátima',
  16: 'Día 16: Conmemoración mensual de Nuestra Señora del Carmen (Santo Escapulario)',
  19: 'Día 19: Conmemoración mensual de San José',
  22: 'Día 22: Conmemoración mensual de Santa Rita de Casia',
  23: 'Día 23: Conmemoración mensual de San Padre Pío de Pietrelcina',
  24: 'Día 24: Conmemoración mensual de María Auxiliadora',
  25: 'Día 25: Conmemoración mensual de la Natividad del Señor (Divino Niño / Santo Niño de Atocha)',
  27: 'Día 27: Conmemoración mensual de Nuestra Señora de la Medalla Milagrosa',
  28: 'Día 28: Conmemoración mensual de San Judas Tadeo',
  29: 'Día 29: Conmemoración mensual de San Miguel Arcángel',
  31: 'Día 31: Conmemoración mensual de San Juan Bosco',
};

function makeUTCDate(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m - 1, d));
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86400000);
}

function diffDays(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}

function formatISO(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Devuelve día de la semana ISO (1 = Lunes ... 7 = Domingo)
 */
function isoWeekday(date: Date): number {
  const w = date.getUTCDay();
  return w === 0 ? 7 : w;
}

/**
 * Algoritmo de Meeus/Jones/Butcher para calcular el Domingo de Pascua (Gregoriano)
 */
export function calcularDomingoPascua(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return makeUTCDate(year, month, day);
}

/**
 * Determina si una fecha cae en un día de Prioridad 1 o 2 del Ciclo Temporal
 * o en una Solemnidad móvil del Señor (Trinidad, Corpus Christi, Sagrado Corazón)
 * que impide la celebración de una Solemnidad fija de la Virgen o de los Santos (NUALC 5 y 60)
 */
function esDiaImpedidoParaSolemnidad(
  fecha: Date,
  pascua: Date,
  miercolesCeniza: Date,
  domingoRamos: Date,
  pentecostes: Date,
  primerDomingoAdviento: Date
): boolean {
  const wd = isoWeekday(fecha);
  // 1. Semana Santa + Triduo Pascual + Octava de Pascua (desde Domingo de Ramos hasta II Domingo de Pascua inclusive)
  if (fecha >= domingoRamos && fecha <= addDays(pascua, 7)) {
    return true;
  }
  // 2. Miércoles de Ceniza
  if (diffDays(fecha, miercolesCeniza) === 0) {
    return true;
  }
  // 3. Domingos de Cuaresma, Pascua y Adviento
  if (wd === 7) {
    if (fecha >= miercolesCeniza && fecha <= pentecostes) return true;
    if (fecha >= primerDomingoAdviento && fecha <= makeUTCDate(fecha.getUTCFullYear(), 12, 24)) return true;
  }
  // 4. Pentecostés y Solemnidades móviles del Señor (Santísima Trinidad +56, Corpus Christi +60, Sagrado Corazón +68)
  if (
    diffDays(fecha, pentecostes) === 0 ||
    diffDays(fecha, addDays(pascua, 56)) === 0 ||
    diffDays(fecha, addDays(pascua, 60)) === 0 ||
    diffDays(fecha, addDays(pascua, 68)) === 0
  ) {
    return true;
  }
  return false;
}

/**
 * Calcula la fecha efectiva en que se celebra una Solemnidad de fecha fija en el año dado,
 * aplicando las reglas de traslado litúrgico (NUALC 5 y 60):
 * - Si cae en Semana Santa o en la Octava de Pascua (ej. Anunciación en 2024 o 2027),
 *   se traslada al lunes siguiente al II Domingo de Pascua (pascua + 8).
 * - Caso especial San José (19 de marzo): si cae en Domingo de Ramos o Semana Santa, en las normas
 *   de la Santa Sede se anticipa al sábado anterior al Domingo de Ramos (pascua - 8), y si cae en
 *   Domingo de Cuaresma se traslada al lunes siguiente (20 de marzo).
 * - Caso especial Natividad de San Juan Bautista (24 de junio) cuando coincide con el Sagrado Corazón de Jesús
 *   (ej. 2022, 2033, 2044, cuando Pascua cae el 17 de abril): conforme a la disposición del Dicasterio para el Culto Divino,
 *   se anticipa al jueves 23 de junio (ya que el viernes 24 es Sagrado Corazón y el sábado 25 es Inmaculado Corazón).
 * - Si cualquier otra Solemnidad (ej. Inmaculada el 8 de dic en Domingo de Adviento, como en 2024, o San Juan Bautista en Corpus en 2038)
 *   cae en un día impedido, se traslada al primer día libre siguiente.
 * - Excepción propia de México (CEM): Nuestra Señora de Guadalupe (12 de diciembre) NUNCA se traslada
 *   aunque coincida con el III Domingo de Adviento (ej. 2027, 2032); se celebra el mismo 12 de diciembre.
 */
function calcularFechaEfectivaSolemnidad(
  year: number,
  mesOriginal: number,
  diaOriginal: number,
  pascua: Date,
  miercolesCeniza: Date,
  domingoRamos: Date,
  pentecostes: Date,
  primerDomingoAdviento: Date
): Date {
  const fechaOrig = makeUTCDate(year, mesOriginal, diaOriginal);

  // Indulto propio de México (CEM): 12 de diciembre (Nuestra Señora de Guadalupe) se celebra en su mismo día
  // aunque caiga en Domingo de Adviento. Nota: La interpretación actual de la CEM contempla hasta el
  // 12 de diciembre de 2032 (que cae en domingo); después de 2032 habrá que revisar si se renueva o modifica.
  if (mesOriginal === 12 && diaOriginal === 12) {
    return fechaOrig;
  }

  if (
    !esDiaImpedidoParaSolemnidad(
      fechaOrig,
      pascua,
      miercolesCeniza,
      domingoRamos,
      pentecostes,
      primerDomingoAdviento
    )
  ) {
    return fechaOrig;
  }

  // Caso San José (19 de marzo) en Semana Santa -> se anticipa al sábado anterior al Domingo de Ramos
  if (mesOriginal === 3 && diaOriginal === 19 && fechaOrig >= domingoRamos) {
    return addDays(domingoRamos, -1);
  }

  // Caso San Juan Bautista (24 de junio) cuando choca con el Sagrado Corazón de Jesús (pascua + 68, ej. 2022, 2033, 2044)
  // -> Se anticipa al jueves 23 de junio
  if (
    mesOriginal === 6 &&
    diaOriginal === 24 &&
    diffDays(fechaOrig, addDays(pascua, 68)) === 0
  ) {
    return makeUTCDate(year, 6, 23);
  }

  // Caso Anunciación (25 de marzo) u otra solemnidad entre Domingo de Ramos y II Domingo de Pascua -> Lunes tras la Octava (pascua + 8)
  if (fechaOrig >= domingoRamos && fechaOrig <= addDays(pascua, 7)) {
    return addDays(pascua, 8);
  }

  // Cualquier otro choque (ej. Domingo de Cuaresma, Domingo de Adviento como el 8 dic 2024, o Corpus el 24 jun 2038) -> Siguiente día libre
  let candidata = addDays(fechaOrig, 1);
  while (
    esDiaImpedidoParaSolemnidad(
      candidata,
      pascua,
      miercolesCeniza,
      domingoRamos,
      pentecostes,
      primerDomingoAdviento
    )
  ) {
    candidata = addDays(candidata, 1);
  }
  return candidata;
}

export function calcularDiaLiturgico(fechaStr: string): RespuestaDiaLiturgico {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fechaStr.trim());
  if (!match) {
    throw new Error('Formato de fecha inválido. Use YYYY-MM-DD (ej. 2026-10-27).');
  }
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const f = makeUTCDate(y, m, d);
  if (f.getUTCFullYear() !== y || f.getUTCMonth() + 1 !== m || f.getUTCDate() !== d) {
    throw new Error('Fecha inexistente en el calendario.');
  }

  const wd = isoWeekday(f);
  const pascua = calcularDomingoPascua(y);
  const jan2 = makeUTCDate(y, 1, 2);
  const dec24 = makeUTCDate(y, 12, 24);
  const dec25 = makeUTCDate(y, 12, 25);

  // Hitos móviles del año según el Calendario Propio de México (CEM):
  // 1. Epifanía del Señor: Domingo entre el 2 y el 8 de enero
  const epifania = addDays(jan2, (7 - isoWeekday(jan2)) % 7);
  // 2. Bautismo del Señor: Domingo siguiente a Epifanía; pero si Epifanía cae el 7 u 8 de enero, el Bautismo pasa al lunes siguiente (8 o 9 de enero)
  const bautismo =
    epifania.getUTCDate() >= 7 ? addDays(epifania, 1) : addDays(epifania, 7);

  const miercolesCeniza = addDays(pascua, -46);
  const domingoRamos = addDays(pascua, -7);
  const juevesSanto = addDays(pascua, -3);
  const viernesSanto = addDays(pascua, -2);
  const sabadoSanto = addDays(pascua, -1);

  // 3. La Ascensión del Señor: En México se traslada al VII Domingo de Pascua (pascua + 42)
  const ascension = addDays(pascua, 42);
  const pentecostes = addDays(pascua, 49);
  const jesucristoSumoSacerdote = addDays(pascua, 53);
  const santisimaTrinidad = addDays(pascua, 56);
  // 4. Corpus Christi: En México conserva su día litúrgico propio en Jueves (pascua + 60)
  const corpusChristi = addDays(pascua, 60);
  const sagradoCorazon = addDays(pascua, 68);
  // 5. Inmaculado Corazón de María: Sábado siguiente al Sagrado Corazón (pascua + 69)
  const inmaculadoCorazon = addDays(pascua, 69);

  const primerDomingoAdviento = addDays(makeUTCDate(y, 12, 4), -isoWeekday(dec25));
  const cristoRey = addDays(primerDomingoAdviento, -7);

  // Sagrada Familia: Domingo dentro de la Octava de Navidad, o 30 de diciembre si Navidad cae en domingo
  const sagradaFamilia =
    isoWeekday(dec25) === 7
      ? makeUTCDate(y, 12, 30)
      : addDays(dec25, 7 - isoWeekday(dec25));

  // 1. Determinar Tiempo Litúrgico y Ciclos (Hoy!B7)
  let tiempoLiturgico = '';
  if (f >= primerDomingoAdviento && f <= dec24) {
    tiempoLiturgico = 'Tiempo de Adviento';
  } else if (f >= dec25 || f <= bautismo) {
    tiempoLiturgico = 'Tiempo de Navidad';
  } else if (f >= miercolesCeniza && f <= addDays(pascua, -4)) {
    tiempoLiturgico = 'Tiempo de Cuaresma';
  } else if (f >= juevesSanto && f <= sabadoSanto) {
    tiempoLiturgico = 'Triduo Pascual';
  } else if (f >= pascua && f <= pentecostes) {
    tiempoLiturgico = 'Tiempo Pascual';
  } else if (f > bautismo && f < miercolesCeniza) {
    tiempoLiturgico = 'Tiempo Ordinario (Primera Parte)';
  } else {
    tiempoLiturgico = 'Tiempo Ordinario (Segunda Parte)';
  }

  const anioLiturgico = f >= primerDomingoAdviento ? y + 1 : y;
  const modCiclo = anioLiturgico % 3;
  const cicloDominical: 'Ciclo A' | 'Ciclo B' | 'Ciclo C' =
    modCiclo === 1 ? 'Ciclo A' : modCiclo === 2 ? 'Ciclo B' : 'Ciclo C';
  const cicloFerial: 'Año I (Impar)' | 'Año II (Par)' =
    anioLiturgico % 2 === 1 ? 'Año I (Impar)' : 'Año II (Par)';
  const calendarioCicloLiturgico = `${tiempoLiturgico} - ${cicloDominical}`;

  // 2. Evaluar Ciclo Temporal (Hoy!B10:E10)
  // Nota: Aquí solo van las celebraciones propias del Ciclo Temporal (Domingos, Triduo, Solemnidades/Fiestas móviles del Tiempo y Ferias),
  // de modo que las fiestas de fecha fija nunca oculten la Feria ni el Domingo correspondiente.
  const candidatosTemporal: OpcionLiturgica[] = [];
  const pushTemp = (
    celebracion: string,
    rango: string,
    color: string,
    prioridad: number,
    categoria?: string
  ) => {
    candidatosTemporal.push({
      ciclo: 'Ciclo Temporal',
      celebracion,
      categoria,
      rango,
      color,
      prioridad,
    });
  };

  // Triduo y Pascua
  if (diffDays(f, juevesSanto) === 0) {
    pushTemp('Jueves Santo de la Cena del Señor', 'Misa del Triduo', 'Blanco', 1, 'Triduo Pascual');
  }
  if (diffDays(f, viernesSanto) === 0) {
    pushTemp('Viernes Santo en la Pasión del Señor', 'Liturgia de la Pasión', 'Rojo', 1, 'Triduo Pascual');
  }
  if (diffDays(f, sabadoSanto) === 0) {
    pushTemp('Sábado Santo (y Vigilia Pascual)', 'Triduo Pascual / Solemnidad de Solemnidades', 'Blanco', 1, 'Triduo Pascual');
  }
  if (diffDays(f, pascua) === 0) {
    pushTemp('Domingo de Resurrección / Pascua (Resurrexi)', 'Solemnidad de Solemnidades', 'Blanco', 1, 'Domingo de Pascua');
  }

  // Domingos II a VI de Pascua (el VII Domingo en México lo ocupa la Solemnidad de la Ascensión del Señor)
  const nombresPascua: Record<number, string> = {
    2: 'II Domingo de Pascua (Quasi modo / In Albis - Divina Misericordia)',
    3: 'III Domingo de Pascua (Misericordia Domini)',
    4: 'IV Domingo de Pascua (Jubilate Deo - Buen Pastor)',
    5: 'V Domingo de Pascua (Cantate Domino)',
    6: 'VI Domingo de Pascua (Vocem jucunditatis)',
  };
  for (let k = 2; k <= 6; k++) {
    if (diffDays(f, addDays(pascua, 7 * (k - 1))) === 0) {
      pushTemp(nombresPascua[k], 'Domingo Privilegiado', 'Blanco', 2, 'Domingo de Pascua');
    }
  }

  if (diffDays(f, ascension) === 0) {
    pushTemp('La Ascensión del Señor (VII Domingo de Pascua)', 'Solemnidad', 'Blanco', 2, 'Solemnidad del Señor');
  }
  if (diffDays(f, pentecostes) === 0) {
    pushTemp('Domingo de Pentecostés (Spiritus Domini)', 'Solemnidad', 'Rojo', 2, 'Solemnidad del Señor');
  }
  if (diffDays(f, jesucristoSumoSacerdote) === 0) {
    pushTemp('Jesucristo, Sumo y Eterno Sacerdote', 'Fiesta', 'Blanco', 5, 'Fiesta del Señor');
  }
  if (diffDays(f, santisimaTrinidad) === 0) {
    pushTemp('La Santísima Trinidad', 'Solemnidad', 'Blanco', 4, 'Solemnidad del Señor');
  }
  if (diffDays(f, corpusChristi) === 0) {
    pushTemp('Corpus Christi (Cuerpo y Sangre de Cristo)', 'Solemnidad', 'Blanco', 4, 'Solemnidad del Señor');
  }
  if (diffDays(f, sagradoCorazon) === 0) {
    pushTemp('El Sagrado Corazón de Jesús', 'Solemnidad', 'Blanco', 4, 'Solemnidad del Señor');
  }
  if (diffDays(f, cristoRey) === 0) {
    pushTemp('Jesucristo, Rey del Universo', 'Solemnidad', 'Blanco', 4, 'Solemnidad del Señor');
  }

  // Cuaresma y Semana Santa
  if (diffDays(f, miercolesCeniza) === 0) {
    pushTemp('Miércoles de Ceniza', 'Día Penitencial Mayor', 'Morado', 2, 'Cuaresma');
  }
  const nombresCuaresma: Record<number, { nombre: string; color: string }> = {
    1: { nombre: 'I Domingo de Cuaresma (Invocabit)', color: 'Morado' },
    2: { nombre: 'II Domingo de Cuaresma (Reminiscere)', color: 'Morado' },
    3: { nombre: 'III Domingo de Cuaresma (Oculi)', color: 'Morado' },
    4: { nombre: 'IV Domingo de Cuaresma (Laetare)', color: 'Morado / Rosa' },
    5: { nombre: 'V Domingo de Cuaresma (Judica)', color: 'Morado' },
  };
  for (let k = 1; k <= 5; k++) {
    if (diffDays(f, addDays(pascua, -7 * (7 - k))) === 0) {
      pushTemp(nombresCuaresma[k].nombre, 'Domingo Privilegiado', nombresCuaresma[k].color, 2, 'Domingo de Cuaresma');
    }
  }
  if (diffDays(f, domingoRamos) === 0) {
    pushTemp('Domingo de Ramos en la Pasión del Señor (Domine, ne longe)', 'Domingo Privilegiado', 'Rojo', 2, 'Semana Santa');
  }

  // Adviento
  const nombresAdviento: Record<number, { nombre: string; color: string }> = {
    1: { nombre: 'I Domingo de Adviento (Ad te levavi)', color: 'Morado' },
    2: { nombre: 'II Domingo de Adviento (Populus Sion)', color: 'Morado' },
    3: { nombre: 'III Domingo de Adviento (Gaudete)', color: 'Morado / Rosa' },
    4: { nombre: 'IV Domingo de Adviento (Rorate)', color: 'Morado' },
  };
  for (let k = 1; k <= 4; k++) {
    if (diffDays(f, addDays(primerDomingoAdviento, 7 * (k - 1))) === 0) {
      pushTemp(nombresAdviento[k].nombre, 'Domingo Privilegiado', nombresAdviento[k].color, 2, 'Domingo de Adviento');
    }
  }

  // Navidad, Epifanía (en domingo en México) y Bautismo del Señor
  if (m === 12 && d === 24) {
    pushTemp('Nochebuena (Vigilia de Navidad)', 'Vigilia de Solemnidad', 'Blanco', 9, 'Adviento');
  }
  if (m === 12 && d === 25) {
    pushTemp('Natividad del Señor (Navidad)', 'Solemnidad', 'Blanco', 2, 'Navidad');
  }
  if (diffDays(f, sagradaFamilia) === 0) {
    pushTemp('La Sagrada Familia de Jesús, María y José', 'Fiesta', 'Blanco', 5, 'Navidad');
  }
  if (diffDays(f, epifania) === 0) {
    pushTemp('La Epifanía del Señor', 'Solemnidad', 'Blanco', 2, 'Navidad');
  }
  if (diffDays(f, bautismo) === 0) {
    pushTemp('El Bautismo del Señor', 'Fiesta', 'Blanco', 5, 'Navidad');
  }

  // Domingos del Tiempo Ordinario (II al XXXIII)
  // El I Domingo del Tiempo Ordinario corresponde a la semana que inicia tras el Bautismo del Señor
  const domBasePrimeraParte =
    isoWeekday(bautismo) === 7 ? bautismo : addDays(bautismo, -1);
  for (let k = 2; k <= 33; k++) {
    const d1 = addDays(domBasePrimeraParte, 7 * (k - 1));
    const d2 = addDays(cristoRey, -7 * (34 - k));
    if (
      (d1 < miercolesCeniza && diffDays(f, d1) === 0) ||
      (d2 > santisimaTrinidad && diffDays(f, d2) === 0)
    ) {
      pushTemp(
        `${ROMANOS[k]} Domingo del Tiempo Ordinario`,
        'Domingo del Tiempo Ordinario',
        'Verde',
        6,
        'Domingo del Tiempo Ordinario'
      );
    }
  }

  candidatosTemporal.sort((a, b) => a.prioridad - b.prioridad);

  let cicloTemporal: OpcionLiturgica;
  if (candidatosTemporal.length > 0) {
    cicloTemporal = candidatosTemporal[0];
  } else {
    // Fallback Ferial con las prioridades oficiales corregidas:
    // Semana Santa y Octava de Pascua tienen prioridad 2 (Grupo I de la Tabla de Precedencia)
    if (m === 12 && d >= 17 && d <= 23) {
      cicloTemporal = {
        ciclo: 'Ciclo Temporal',
        celebracion: 'Feria Privilegiada de Adviento',
        rango: 'Feria Privilegiada',
        color: 'Morado',
        prioridad: 9,
      };
    } else if (f >= primerDomingoAdviento && f <= makeUTCDate(y, 12, 16)) {
      cicloTemporal = {
        ciclo: 'Ciclo Temporal',
        celebracion: 'Feria de Adviento',
        rango: 'Tiempo Ferial Privilegiado',
        color: 'Morado',
        prioridad: PRIORIDAD_FERIA,
      };
    } else if ((m === 12 && d >= 26) || (m === 1 && d === 1)) {
      cicloTemporal = {
        ciclo: 'Ciclo Temporal',
        celebracion: 'Día dentro de la Octava de Navidad',
        rango: 'Octava de Navidad',
        color: 'Blanco',
        prioridad: 9,
      };
    } else if (m === 1 && f <= bautismo) {
      cicloTemporal = {
        ciclo: 'Ciclo Temporal',
        celebracion: 'Feria del Tiempo de Navidad',
        rango: 'Tiempo Festivo',
        color: 'Blanco',
        prioridad: PRIORIDAD_FERIA,
      };
    } else if (f > domingoRamos && f < juevesSanto) {
      cicloTemporal = {
        ciclo: 'Ciclo Temporal',
        celebracion: 'Feria de Semana Santa',
        rango: 'Semana Santa',
        color: 'Morado',
        prioridad: 2,
      };
    } else if (f > miercolesCeniza && f < domingoRamos) {
      cicloTemporal = {
        ciclo: 'Ciclo Temporal',
        celebracion: 'Feria de Cuaresma',
        rango: 'Tiempo Penitencial',
        color: 'Morado',
        prioridad: 9,
      };
    } else if (f > pascua && f <= addDays(pascua, 7)) {
      cicloTemporal = {
        ciclo: 'Ciclo Temporal',
        celebracion: 'Día de la Octava de Pascua',
        rango: 'Octava de Pascua',
        color: 'Blanco',
        prioridad: 2,
      };
    } else if (f > addDays(pascua, 7) && f < pentecostes) {
      cicloTemporal = {
        ciclo: 'Ciclo Temporal',
        celebracion: 'Feria del Tiempo Pascual',
        rango: 'Tiempo Festivo',
        color: 'Blanco',
        prioridad: PRIORIDAD_FERIA,
      };
    } else {
      cicloTemporal = {
        ciclo: 'Ciclo Temporal',
        celebracion: 'Feria del Tiempo Ordinario',
        rango: 'Tiempo Ferial Ordinario',
        color: 'Verde',
        prioridad: PRIORIDAD_FERIA,
      };
    }
  }

  // 3. Evaluar Ciclo de los Misterios del Señor, de la Virgen y de los Ángeles (Hoy!B11:E11)
  // Incluye traslados automáticos de Solemnidades (ej. Anunciación el 25 mar -> 8 abr en 2024 o 5 abr en 2027; Inmaculada el 8 dic -> 9 dic en 2024)
  // y el indulto de México para Nuestra Señora de Guadalupe (12 de diciembre, prioridad 2 para prevalecer incluso en Domingo de Adviento).
  const candidatosMisterios: OpcionLiturgica[] = [];
  for (const item of misteriosFijosData as any[]) {
    const esSolemnidad = item.prioridad <= 4 && item.rango === 'Solemnidad';
    if (esSolemnidad) {
      const fechaEfectiva = calcularFechaEfectivaSolemnidad(
        y,
        item.mes,
        item.dia,
        pascua,
        miercolesCeniza,
        domingoRamos,
        pentecostes,
        primerDomingoAdviento
      );
      if (diffDays(f, fechaEfectiva) === 0) {
        const fueTrasladada =
          fechaEfectiva.getUTCMonth() + 1 !== item.mes ||
          fechaEfectiva.getUTCDate() !== item.dia;
        const fechaOrigISO = `${y}-${String(item.mes).padStart(2, '0')}-${String(item.dia).padStart(2, '0')}`;
        // En México, por indulto concedido a la CEM, Nuestra Señora de Guadalupe (12 dic) se celebra con precedencia
        // incluso cuando coincide con el III Domingo de Adviento. La interpretación de la CEM abarca hasta 2032
        // (el 12 de diciembre de 2032 cae en domingo); posterior a esa fecha habrá que revisar las normas vigentes.
        const esGuadalupe = item.mes === 12 && item.dia === 12;
        // Prioridad explícita 1.5 para Nuestra Señora de Guadalupe (12 dic) en México para garantizar
        // que prevalezca sobre el III Domingo de Adviento (prioridad 2) sin depender del orden del arreglo.
        const prioridadEfectiva = esGuadalupe ? 1.5 : item.prioridad;
        let notaEfectiva = item.notas;
        if (esGuadalupe && wd === 7) {
          notaEfectiva =
            y <= 2032
              ? `${item.notas} [Domingo de Adviento ${y}: Celebrada en domingo por indulto de la CEM vigente hasta el 12 dic 2032].`
              : `${item.notas} [AVISO (>2032): El 12 de diciembre de ${y} cae en domingo; revisar si continúa vigente el indulto de la CEM posterior a 2032].`;
        }
        candidatosMisterios.push({
          ciclo: 'Ciclo de los Misterios del Señor, de la Virgen y de los Ángeles',
          celebracion: fueTrasladada
            ? `${item.celebracion} (Trasladada del ${item.dia}/${item.mes})`
            : item.celebracion,
          categoria: item.categoria,
          rango: item.rango,
          color: item.color,
          prioridad: prioridadEfectiva,
          ...(fueTrasladada ? { trasladada_desde: fechaOrigISO } : {}),
          notas: notaEfectiva,
        });
      }
    } else {
      if (item.mes === m && item.dia === d) {
        candidatosMisterios.push({
          ciclo: 'Ciclo de los Misterios del Señor, de la Virgen y de los Ángeles',
          celebracion: item.celebracion,
          categoria: item.categoria,
          rango: item.rango,
          color: item.color,
          prioridad: item.prioridad,
          notas: item.notas,
        });
      }
    }
  }

  // Celebraciones marianas móviles:
  // - Bienaventurada Virgen María, Madre de la Iglesia = Lunes después de Pentecostés (pascua + 50)
  // - Inmaculado Corazón de la Santísima Virgen María = Sábado después del Sagrado Corazón (pascua + 69)
  if (diffDays(f, addDays(pascua, 50)) === 0) {
    candidatosMisterios.push({
      ciclo: 'Ciclo de los Misterios del Señor, de la Virgen y de los Ángeles',
      celebracion: 'Bienaventurada Virgen María, Madre de la Iglesia',
      categoria: 'Memoria Mariana Universal',
      rango: 'Memoria Obligatoria',
      color: 'Blanco',
      prioridad: 10,
      notas: 'Lunes después de Pentecostés.',
    });
  }
  if (diffDays(f, inmaculadoCorazon) === 0) {
    candidatosMisterios.push({
      ciclo: 'Ciclo de los Misterios del Señor, de la Virgen y de los Ángeles',
      celebracion: 'Inmaculado Corazón de la Santísima Virgen María',
      categoria: 'Memoria Mariana',
      rango: 'Memoria Obligatoria',
      color: 'Blanco',
      prioridad: 10,
      notas: 'Sábado siguiente al segundo domingo después de Pentecostés (día posterior al Sagrado Corazón de Jesús).',
    });
  }
  candidatosMisterios.sort((a, b) => a.prioridad - b.prioridad);
  const cicloMisterios = candidatosMisterios.length > 0 ? candidatosMisterios[0] : null;

  // 4. Evaluar Ciclo Santoral (Hoy!B12:E12)
  // Incluye traslados automáticos para las Solemnidades del Santoral (San José 19 mar, San Juan Bautista 24 jun, San Pedro y San Pablo 29 jun, Todos los Santos 1 nov)
  const candidatosSantoral: OpcionLiturgica[] = [];
  for (const s of santoralData as any[]) {
    const esSolemnidadSantoral = s.prioridad <= 4 && s.rango === 'Solemnidad';
    if (esSolemnidadSantoral) {
      const fechaEfectiva = calcularFechaEfectivaSolemnidad(
        y,
        s.mes,
        s.dia,
        pascua,
        miercolesCeniza,
        domingoRamos,
        pentecostes,
        primerDomingoAdviento
      );
      if (diffDays(f, fechaEfectiva) === 0) {
        const fueTrasladada =
          fechaEfectiva.getUTCMonth() + 1 !== s.mes ||
          fechaEfectiva.getUTCDate() !== s.dia;
        const fechaOrigISO = `${y}-${String(s.mes).padStart(2, '0')}-${String(s.dia).padStart(2, '0')}`;
        candidatosSantoral.push({
          ciclo: 'Ciclo Santoral',
          celebracion: fueTrasladada
            ? `${s.celebracion} (Trasladada del ${s.dia}/${s.mes})`
            : s.celebracion,
          categoria: s.categoria,
          rango: s.rango,
          color: s.color,
          prioridad: s.prioridad,
          orden: 0, // Si una Solemnidad se trasladó a hoy o es titular hoy, encabeza el santoral del día
          es_principal_diocesano: s.es_principal_diocesano ?? true,
          ...(fueTrasladada ? { trasladada_desde: fechaOrigISO } : {}),
          notas: s.notas,
        });
      }
    } else if (s.mes === m && s.dia === d) {
      candidatosSantoral.push({
        ciclo: 'Ciclo Santoral',
        celebracion: s.celebracion,
        categoria: s.categoria,
        rango: s.rango,
        color: s.color,
        prioridad: s.prioridad,
        orden: s.orden ?? 1,
        es_principal_diocesano: s.es_principal_diocesano ?? true,
        notas: s.notas,
      });
    }
  }
  candidatosSantoral.sort((a, b) => {
    const ordenA = a.orden ?? 1;
    const ordenB = b.orden ?? 1;
    if (ordenA !== ordenB) return ordenA - ordenB;
    return a.prioridad - b.prioridad;
  });
  const cicloSantoral = candidatosSantoral.length > 0 ? candidatosSantoral[0] : null;
  const santoDelDia = candidatosSantoral.find(s => (s.orden ?? 1) === 0) || candidatosSantoral.find(s => (s.orden ?? 1) === 1) || null;
  const otrosSantosTexto =
    candidatosSantoral.length > 1
      ? candidatosSantoral
          .slice(1)
          .map((s) => s.celebracion)
          .join(' • ')
      : '-';

  // 5. Evaluar Misa Votiva / Devoción del Día (Hoy!B13:E13, con regla IGMR 376 para Primer Jueves/Viernes/Sábado)
  const prioridadesDia = [
    cicloTemporal.prioridad,
    ...(cicloMisterios ? [cicloMisterios.prioridad] : []),
    ...(cicloSantoral ? [cicloSantoral.prioridad] : []),
  ];
  const minPrioridad = Math.min(...prioridadesDia);
  const esTiempoOrdinario = tiempoLiturgico.includes('Tiempo Ordinario');
  const esPrimeroMes = d <= 7 && (wd === 4 || wd === 5 || wd === 6);

  let misaVotiva: OpcionLiturgica | null = null;
  if (wd < 7 && esTiempoOrdinario) {
    if (esPrimeroMes && minPrioridad >= 10) {
      const pVotiva = minPrioridad <= 11 ? minPrioridad : 11;
      if (wd === 4) {
        misaVotiva = {
          ciclo: 'Misa Votiva / Devoción del Día',
          celebracion: 'Misa Votiva de la Santísima Eucaristía / Vocaciones (Primer Jueves de Mes)',
          rango: minPrioridad <= 11 ? 'Misa Votiva (Utilidad Pastoral - IGMR 376)' : 'Misa Votiva (Primer Jueves)',
          color: 'Blanco (o Verde)',
          prioridad: pVotiva,
        };
      } else if (wd === 5) {
        misaVotiva = {
          ciclo: 'Misa Votiva / Devoción del Día',
          celebracion: 'Misa Votiva del Sagrado Corazón de Jesús (Primer Viernes de Mes)',
          rango: minPrioridad <= 11 ? 'Misa Votiva (Utilidad Pastoral - IGMR 376)' : 'Misa Votiva (Primer Viernes)',
          color: 'Blanco (o Verde)',
          prioridad: pVotiva,
        };
      } else if (wd === 6) {
        misaVotiva = {
          ciclo: 'Misa Votiva / Devoción del Día',
          celebracion: 'Misa del Inmaculado Corazón de María (Primer Sábado de Mes)',
          rango: minPrioridad <= 11 ? 'Misa Votiva Mariana (Utilidad Pastoral - IGMR 376)' : 'Memoria Santa María en Sábado (Primer Sábado)',
          color: 'Blanco (o Verde)',
          prioridad: pVotiva,
        };
      }
    } else if (!esPrimeroMes && minPrioridad >= PRIORIDAD_FERIA) {
      const votivasSemana: Record<number, { cel: string; rango: string; color: string }> = {
        1: {
          cel: 'Misa Votiva de la Santísima Trinidad / Santos Ángeles',
          rango: 'Misa Votiva (Opcional)',
          color: 'Blanco (o Verde)',
        },
        2: {
          cel: 'Misa Votiva de los Santos Ángeles / Santos Apóstoles',
          rango: 'Misa Votiva (Opcional)',
          color: 'Blanco / Rojo (o Verde)',
        },
        3: {
          cel: 'Misa Votiva de San José',
          rango: 'Misa Votiva (Opcional)',
          color: 'Blanco (o Verde)',
        },
        4: {
          cel: 'Misa Votiva de la Santísima Eucaristía / Jesucristo Sumo y Eterno Sacerdote',
          rango: 'Misa Votiva (Opcional)',
          color: 'Blanco (o Verde)',
        },
        5: {
          cel: 'Misa Votiva del Sagrado Corazón de Jesús / Santa Cruz',
          rango: 'Misa Votiva (Opcional)',
          color: 'Blanco / Rojo (o Verde)',
        },
        6: {
          cel: 'Santa María en Sábado',
          rango: 'Memoria Libre Mariana',
          color: 'Blanco (o Verde)',
        },
      };
      const v = votivasSemana[wd];
      misaVotiva = {
        ciclo: 'Misa Votiva / Devoción del Día',
        celebracion: v.cel,
        rango: v.rango,
        color: v.color,
        prioridad: 12,
      };
    }
  }

  // 6. Determinar Celebración Principal Sugerida
  // Si hay empate en prioridad <= 2 (ej. 12 de diciembre en Domingo de Adviento en México), prevalece Nuestra Señora de Guadalupe
  const todasLasOpciones: OpcionLiturgica[] = [
    ...(cicloMisterios ? [cicloMisterios] : []),
    cicloTemporal,
    ...(cicloSantoral ? [cicloSantoral] : []),
    ...(misaVotiva ? [misaVotiva] : []),
  ];
  todasLasOpciones.sort((a, b) => a.prioridad - b.prioridad);
  const celebracionPrincipal = todasLasOpciones[0];
  const esLibreEleccionFerial = celebracionPrincipal.prioridad >= PRIORIDAD_FERIA;

  // 7. Evaluar Devociones Mensuales (Hoy!B15)
  const devocionesMensuales: string[] = [];
  if (d <= 7) {
    if (wd === 4) devocionesMensuales.push('Primer Jueves de Mes: Jueves Sacerdotal y Eucarístico');
    if (wd === 5) devocionesMensuales.push('Primer Viernes de Mes: Devoción de los Nueve Primeros Viernes al Sagrado Corazón de Jesús');
    if (wd === 6) devocionesMensuales.push('Primer Sábado de Mes: Devoción de los Cinco Primeros Sábados al Inmaculado Corazón de María (Virgen de Fátima)');
    if (wd === 7) devocionesMensuales.push('Primer Domingo de Mes: Día de la Divina Providencia');
  }
  if (DEVOCIONES_DIA_FIJO[d]) {
    devocionesMensuales.push(DEVOCIONES_DIA_FIJO[d]);
  }

  // 8. Evaluar Devociones de Ciclos Móviles / Temporadas (Hoy!B17)
  const devocionesTemporadas: string[] = [];

  if (f >= makeUTCDate(y, 8, 15) && f <= makeUTCDate(y, 9, 28)) {
    devocionesTemporadas.push('Cuaresma de San Miguel Arcángel (15 ago - 28 sep)');
  }
  if (f >= viernesSanto && f <= addDays(pascua, 6)) {
    devocionesTemporadas.push('Novena a la Divina Misericordia');
  }
  if (f >= addDays(pascua, 40) && f <= addDays(pascua, 48)) {
    devocionesTemporadas.push('Novena al Espíritu Santo en preparación a Pentecostés');
  }
  if (m === 1 && d >= 18 && d <= 25) {
    devocionesTemporadas.push('Semana de Oración por la Unidad de los Cristianos (18 - 25 ene)');
  }
  if (m === 12 && d >= 1 && d <= 11) {
    devocionesTemporadas.push('Docenario / Novenario de preparación a Nuestra Señora de Guadalupe');
  }
  if (m === 12 && d >= 16 && d <= 24) {
    devocionesTemporadas.push('Novenario de Las Posadas (16 - 24 dic)');
  }

  if (diffDays(f, addDays(pascua, -9)) === 0) {
    devocionesTemporadas.push('Viernes de Dolores (Tradición de los Altares de Dolores)');
  }
  const oct31 = makeUTCDate(y, 10, 31);
  const domund = addDays(oct31, -(isoWeekday(oct31) % 7) - 7);
  if (diffDays(f, domund) === 0) {
    devocionesTemporadas.push('Domingo Mundial de las Misiones (DOMUND)');
  }

  const mar19 = makeUTCDate(y, 3, 19);
  const dom7SanJose = addDays(mar19, -isoWeekday(mar19));
  for (let k = 1; k <= 7; k++) {
    const domK = addDays(dom7SanJose, -7 * (7 - k));
    if (diffDays(f, domK) === 0) {
      devocionesTemporadas.push(`Siete Domingos de San José (Domingo ${k} de 7)`);
    }
  }

  if (wd === 3 || wd === 5 || wd === 6) {
    const iDomCuaresma = addDays(pascua, -42);
    if (f > iDomCuaresma && f < addDays(pascua, -35)) {
      devocionesTemporadas.push('Témporas de Cuaresma (Primavera)');
    }
    if (f > pentecostes && f < santisimaTrinidad) {
      devocionesTemporadas.push('Témporas de Pentecostés (Verano)');
    }
    const sep14 = makeUTCDate(y, 9, 14);
    const domPostSep14 = addDays(sep14, 7 - (isoWeekday(sep14) % 7));
    if (f > domPostSep14 && f < addDays(domPostSep14, 7)) {
      devocionesTemporadas.push('Témporas de San Mateo / Septiembre (Otoño)');
    }
    const iiiDomAdv = addDays(primerDomingoAdviento, 14);
    if (f > iiiDomAdv && f < addDays(iiiDomAdv, 7)) {
      devocionesTemporadas.push('Témporas de Adviento (Invierno)');
    }
  }

  return {
    fecha: formatISO(f),
    anio: y,
    mes: m,
    dia: d,
    dia_semana_iso: wd,
    dia_semana_nombre: DIAS_SEMANA[wd - 1],
    domingo_pascua: formatISO(pascua),
    tiempo_liturgico: tiempoLiturgico,
    ciclo_dominical: cicloDominical,
    ciclo_ferial: cicloFerial,
    calendario_ciclo_liturgico: calendarioCicloLiturgico,
    celebracion_principal: celebracionPrincipal,
    santo_del_dia: santoDelDia,
    es_libre_eleccion_ferial: esLibreEleccionFerial,
    tabla_ciclos: {
      ciclo_temporal: cicloTemporal,
      ciclo_misterios: cicloMisterios,
      ciclo_santoral: cicloSantoral,
      santos_del_dia: candidatosSantoral,
      santo_del_dia: santoDelDia,
      otros_santos_texto: otrosSantosTexto,
      misa_votiva_devocion_dia: misaVotiva,
    },
    piedad_popular: {
      devociones_mensuales: devocionesMensuales,
      devociones_mensuales_texto: devocionesMensuales.length > 0 ? devocionesMensuales.join(' • ') : '-',
      dedicacion_del_mes: DEDICACION_MES[m] || '-',
      devociones_temporadas_moviles: devocionesTemporadas,
      devociones_temporadas_moviles_texto: devocionesTemporadas.length > 0 ? devocionesTemporadas.join(' • ') : '-',
    },
  };
}

export function calcularMesLiturgico(year: number, month: number): RespuestaDiaLiturgico[] {
  if (!Number.isInteger(year) || year < 1583 || year > 4099) {
    throw new Error('El año debe ser un número entero válido entre 1583 y 4099.');
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error('El mes debe ser un número entero entre 1 y 12.');
  }
  const resultados: RespuestaDiaLiturgico[] = [];
  const d = makeUTCDate(year, month, 1);
  while (d.getUTCMonth() + 1 === month) {
    resultados.push(calcularDiaLiturgico(formatISO(d)));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return resultados;
}

export function calcularAnioLiturgico(year: number): RespuestaDiaLiturgico[] {
  if (!Number.isInteger(year) || year < 1583 || year > 4099) {
    throw new Error('El año debe ser un número entero válido entre 1583 y 4099.');
  }
  const resultados: RespuestaDiaLiturgico[] = [];
  for (let m = 1; m <= 12; m++) {
    resultados.push(...calcularMesLiturgico(year, m));
  }
  return resultados;
}
