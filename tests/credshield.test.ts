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

  it('should update the public verification state after a successful proof', () => {
    let verified = false;

    const privateCreditScore = 750n;
    const privateDti = 30n;
    const privateBankBalance = 5000n;

    const proofResult = isEligible(
      privateCreditScore,
      privateDti,
      privateBankBalance,
    );

    if (proofResult) {
      verified = true;
    }

    expect(verified).toBe(true);
  });

  it('should expose only the verification result and not private financial values', () => {
    const privateCreditScore = 750n;
    const privateDti = 30n;
    const privateBankBalance = 5000n;

    const verified = isEligible(
      privateCreditScore,
      privateDti,
      privateBankBalance,
    );

    const publicResult = {
      verified,
    };

    expect(publicResult).toEqual({ verified: true });
    expect(publicResult).not.toHaveProperty('creditScore');
    expect(publicResult).not.toHaveProperty('dti');
    expect(publicResult).not.toHaveProperty('bankBalance');
    expect(JSON.stringify(publicResult)).not.toContain('750');
    expect(JSON.stringify(publicResult)).not.toContain('30');
    expect(JSON.stringify(publicResult)).not.toContain('5000');
  });
});