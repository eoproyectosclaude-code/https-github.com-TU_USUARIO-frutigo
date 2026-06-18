import { generateReferralCode, normalizeReferralCode, canApplyReferral, REFERRAL } from './referral';

describe('referral', () => {
  it('genera código determinista de la longitud configurada', () => {
    const a = generateReferralCode('user-1|Joven');
    const b = generateReferralCode('user-1|Joven');
    expect(a).toBe(b);
    expect(a).toHaveLength(REFERRAL.codeLength);
  });

  it('códigos distintos para seeds distintas', () => {
    expect(generateReferralCode('user-1')).not.toBe(generateReferralCode('user-2'));
  });

  it('no usa caracteres ambiguos (0,O,1,I)', () => {
    const code = generateReferralCode('abc-xyz-123');
    expect(/[01OI]/.test(code)).toBe(false);
  });

  it('normaliza a mayúsculas sin espacios', () => {
    expect(normalizeReferralCode('  ab cd ')).toBe('ABCD');
  });

  it('canApplyReferral: válido cuando el código existe y no está referido', () => {
    expect(canApplyReferral({ newUserCode: 'NEW1', referrerCode: 'REF1', alreadyReferred: false })).toBe(true);
  });

  it('canApplyReferral: rechaza auto-referido, ya referido y vacío', () => {
    expect(canApplyReferral({ newUserCode: 'SAME', referrerCode: 'same', alreadyReferred: false })).toBe(false);
    expect(canApplyReferral({ newUserCode: 'NEW1', referrerCode: 'REF1', alreadyReferred: true })).toBe(false);
    expect(canApplyReferral({ newUserCode: 'NEW1', referrerCode: '', alreadyReferred: false })).toBe(false);
  });
});
