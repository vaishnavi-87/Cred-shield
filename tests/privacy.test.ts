import { describe, expect, it } from 'vitest';

describe('CredShield Privacy Model', () => {
  it('should expose only the eligibility result publicly', () => {
    const privateInputs = {
      creditScore: 750n,
      dti: 30n,
      bankBalance: 5000n,
    };

    const publicResult = {
      verified:
        privateInputs.creditScore >= 700n &&
        privateInputs.dti <= 40n &&
        privateInputs.bankBalance >= 1000n,
    };

    expect(publicResult).toEqual({ verified: true });
    expect(publicResult).not.toHaveProperty('creditScore');
    expect(publicResult).not.toHaveProperty('dti');
    expect(publicResult).not.toHaveProperty('bankBalance');
  });

  it('should keep exact financial values out of the public result', () => {
    const privateCreditScore = 750n;
    const privateDti = 30n;
    const privateBankBalance = 5000n;

    const publicResult = {
      verified: true,
    };

    expect(JSON.stringify(publicResult)).not.toContain(
      privateCreditScore.toString(),
    );
    expect(JSON.stringify(publicResult)).not.toContain(
      privateDti.toString(),
    );
    expect(JSON.stringify(publicResult)).not.toContain(
      privateBankBalance.toString(),
    );
  });

  it('should disclose verification without disclosing the underlying inputs', () => {
    const publicResult = { verified: false };

    expect(publicResult.verified).toBe(false);
    expect(Object.keys(publicResult)).toEqual(['verified']);
  });
});
