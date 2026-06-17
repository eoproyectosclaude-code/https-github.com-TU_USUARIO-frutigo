/**
 * Generación de CSV segura y sin dependencias.
 * Escapa comas, comillas y saltos de línea según RFC 4180.
 */
export interface CsvColumn<T> {
  /** Encabezado de la columna. */
  header: string;
  /** Extrae el valor de la fila. */
  value: (row: T) => unknown;
}

function escapeCell(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[",\n\r]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

/** Convierte filas a CSV con las columnas dadas. */
export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const head = columns.map((c) => escapeCell(c.header)).join(',');
  const body = rows.map((r) => columns.map((c) => escapeCell(c.value(r))).join(',')).join('\n');
  return body ? `${head}\n${body}` : head;
}
