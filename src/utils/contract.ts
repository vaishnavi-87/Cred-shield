/**
 * CredShield contract interaction helpers.
 *
 * The actual contract interaction remains in the existing
 * credshieldClient.ts implementation. These helpers provide
 * a small Level 4 utility boundary for the frontend.
 */

export const CRED_SHIELD_CONTRACT_NAME = "credshield";

export const CRED_SHIELD_CIRCUIT_NAME =
  "verifyCreditworthiness";

export const CRED_SHIELD_THRESHOLDS = {
  minimumCreditScore: 700,
  maximumDti: 40,
  minimumBankBalance: 1000,
} as const;

/**
 * Returns a human-readable description of what the
 * verification circuit proves without exposing the
 * underlying private financial values.
 */
export function getPrivacyProofDescription(): string {
  return (
    "CredShield proves creditworthiness eligibility " +
    "without publicly revealing the credit score, " +
    "debt-to-income ratio, or bank balance."
  );
}
