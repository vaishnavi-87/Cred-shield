import { useState } from "react";

type CircuitCallProps = {
  connected: boolean;
  isProving: boolean;
  verified: boolean;
  error: string | null;
  onProve: (
    creditScore: bigint,
    dti: bigint,
    bankBalance: bigint,
  ) => void;
};

function CircuitCall({
  connected,
  isProving,
  verified,
  error,
  onProve,
}: CircuitCallProps) {
  const [creditScore, setCreditScore] = useState("");
  const [dti, setDti] = useState("");
  const [bankBalance, setBankBalance] = useState("");
const [validationError, setValidationError] = useState<string | null>(null);
  const handleSubmit = () => {
  setValidationError(null);

  if (!creditScore || !dti || !bankBalance) {
    setValidationError("Please enter all three financial values.");
    return;
  }

  if (
    !/^\d+$/.test(creditScore) ||
    !/^\d+$/.test(dti) ||
    !/^\d+$/.test(bankBalance)
  ) {
    setValidationError("Please enter valid non-negative numbers.");
    return;
  }

  const score = BigInt(creditScore);
  const dtiValue = BigInt(dti);
  const balance = BigInt(bankBalance);

  if (score < 0n || score > 850n) {
    setValidationError("Credit score must be between 0 and 850.");
    return;
  }

  if (dtiValue < 0n || dtiValue > 100n) {
    setValidationError("DTI must be between 0% and 100%.");
    return;
  }

  if (balance < 0n) {
    setValidationError("Bank balance cannot be negative.");
    return;
  }

  onProve(score, dtiValue, balance);
};

  if (!connected) {
    return (
      <section className="verification-card disabled-card">
        <div className="section-icon">🔐</div>

        <h2>Private Credit Verification</h2>

        <p>
          Connect your 1AM Wallet to begin a
          private creditworthiness proof on Midnight Preview.
        </p>
      </section>
    );
  }

  return (
    <section className="verification-card">
      <div className="section-icon">🔐</div>

      <h2>Private Credit Verification</h2>

      <p>
        Enter your financial information privately.
        These values remain in your browser and are
        used only as private witness inputs to the
        ZK circuit — they are never sent to the network.
      </p>

      {!verified && (
        <div className="private-inputs">
          <label>
            Credit Score
         <input
  id="input-credit-score"
  type="password"
  inputMode="numeric"
  min="0"
  max="850"
  value={creditScore}
  onChange={(e) => {
    setCreditScore(e.target.value);
    setValidationError(null);
  }}
  placeholder="Private"
  autoComplete="off"
/>
          </label>

          <label>
            Debt-to-Income Ratio (%)
        <input
  id="input-dti"
  type="password"
  inputMode="numeric"
  min="0"
  max="100"
  value={dti}
  onChange={(e) => {
    setDti(e.target.value);
    setValidationError(null);
  }}
  placeholder="Private"
  autoComplete="off"
/>
          </label>

          <label>
            Bank Balance
          <input
  id="input-bank-balance"
  type="password"
  inputMode="numeric"
  min="0"
  value={bankBalance}
  onChange={(e) => {
    setBankBalance(e.target.value);
    setValidationError(null);
  }}
  placeholder="Private"
  autoComplete="off"
/>
          </label>
        </div>
      )}

      <div className="privacy-list">
        <span>✓ Credit score stays private</span>
        <span>✓ DTI stays private</span>
        <span>✓ Bank balance stays private</span>
      </div>

      {!verified && (
        <button
          id="prove-creditworthiness-btn"
          className="prove-button"
          onClick={handleSubmit}
          disabled={
            isProving ||
            !creditScore ||
            !dti ||
            !bankBalance
          }
        >
          {isProving
            ? "Generating Private Proof…"
            : "Prove My Creditworthiness"}
        </button>
      )}

      {isProving && (
        <div className="proof-status">
          <div className="spinner" />

          <div>
            <strong>
              Generating ZK proof…
            </strong>

            <span>
              Your financial information is not
              displayed or sent to the public ledger.
            </span>

            <span>
              When 1AM Wallet asks you to approve,
              confirm the transaction to submit it to
              Midnight Preview.
            </span>
          </div>
        </div>
      )}

      {verified && (
        <div className="success-card">
          <div className="success-icon">
            ✓
          </div>

          <div>
            <strong>
              Creditworthiness Verified
            </strong>

            <span>
              Eligibility was proven without
              revealing your financial information.
            </span>

            <span className="privacy-note">
              The circuit proves the eligibility conditions
              without disclosing the underlying financial values.
              Only the boolean result is recorded on-chain.
            </span>
          </div>
        </div>
      )}

      {(validationError || error) && (
  <div className="error-message">
    {validationError || error}
  </div>
)}
    </section>
  );
}

export default CircuitCall;
