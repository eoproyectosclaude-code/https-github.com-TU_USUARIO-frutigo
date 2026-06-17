import { generateManifestRef, isValidWindow } from './provisioning';

describe('ship provisioning', () => {
  it('valida ventana de entrega (fin posterior al inicio)', () => {
    expect(isValidWindow('2026-06-20T08:00', '2026-06-20T14:00')).toBe(true);
    expect(isValidWindow('2026-06-20T14:00', '2026-06-20T08:00')).toBe(false);
    expect(isValidWindow('basura', '2026-06-20T08:00')).toBe(false);
  });

  it('genera referencia de manifiesto con prefijo de puerto', () => {
    const ref = generateManifestRef('BALBOA', new Date('2026-06-20T08:00:00Z'));
    expect(ref).toMatch(/^MF-BALBOA-20260620-\d{5}$/);
  });
});
