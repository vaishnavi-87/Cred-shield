import { describe, expect, it } from 'vitest';

describe('CredShield Creditworthiness', () => {
  const isEligible = (
    creditScore: bigint,
    dti: bigint,
    bankBalance: bigint,
  ): boolean => {
    return (
      creditScore >= 700n &&
      dti <= 40n &&
      bankBalance >= 1000n
    );
  };

  it('should approve an eligible borrower', () => {
    expect(isEligible(750n, 30n, 5000n)).toBe(true);
  });

  it('should reject a borrower with a low credit score', () => {
    expect(isEligible(650n, 30n, 5000n)).toBe(false);
  });

  it('should reject a borrower with a high DTI', () => {
    expect(isEligible(750n, 50n, 5000n)).toBe(false);
  });

  it('should reject a borrower with insufficient balance', () => {
    expect(isEligible(750n, 30n, 500n)).toBe(false);
  });

  it('should approve a borrower exactly at the eligibility thresholds', () => {
    expect(isEligible(700n, 40n, 1000n)).toBe(true);
  });
});
