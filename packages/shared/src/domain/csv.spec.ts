import { toCsv } from './csv';

interface Row { a: string; n: number; }

describe('toCsv', () => {
  it('genera encabezado + filas', () => {
    const csv = toCsv<Row>(
      [{ a: 'x', n: 1 }, { a: 'y', n: 2 }],
      [{ header: 'A', value: (r) => r.a }, { header: 'N', value: (r) => r.n }],
    );
    expect(csv).toBe('A,N\nx,1\ny,2');
  });

  it('escapa comas, comillas y saltos de línea', () => {
    const csv = toCsv<{ v: string }>(
      [{ v: 'a,b' }, { v: 'di"jo' }, { v: 'l1\nl2' }],
      [{ header: 'V', value: (r) => r.v }],
    );
    expect(csv).toBe('V\n"a,b"\n"di""jo"\n"l1\nl2"');
  });

  it('lista vacía ⇒ solo encabezado', () => {
    expect(toCsv<Row>([], [{ header: 'A', value: (r) => r.a }])).toBe('A');
  });

  it('null/undefined ⇒ celda vacía', () => {
    const csv = toCsv<{ v: unknown }>([{ v: null }, { v: undefined }], [{ header: 'V', value: (r) => r.v }]);
    expect(csv).toBe('V\n\n');
  });
});
