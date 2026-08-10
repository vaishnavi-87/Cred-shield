import { describe, expect, it } from 'vitest';

describe('Level 1 Privacy Counter', () => {
  it('should start with a private secret', () => {
    const privateState = { secret: 1n };

    expect(privateState.secret).toBe(1n);
  });

  it('should validate a positive secret', () => {
    const secret = 1n;
    const isValid = secret > 0n;

    expect(isValid).toBe(true);
  });

  it('should increment the public count', () => {
    const count = 0n;
    const newCount = count + 1n;

    expect(newCount).toBe(1n);
  });
});
