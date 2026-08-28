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

const STORAGE_KEY = "credshield-private-inputs";

type SavedInputs = {
  creditScore: string;
  dti: string;
  bankBalance: string;
};

function loadSavedInputs(): SavedInputs {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);

    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignore storage errors.
  }

  return {
    creditScore: "",
    dti: "",
    bankBalance: "",
  };
}

function CircuitCall({
  connected,
  isProving,
  verified,
  error,
  onProve,
}: CircuitCallProps) {
  const saved = loadSavedInputs();

  const [creditScore, setCreditScore] = useState(
    saved.creditScore,
  );

  const [dti, setDti] = useState(saved.dti);

  const [bankBalance, setBankBalance] = useState(
    saved.bankBalance,
  );

  const [validationError, setValidationError] =
    useState<string | null>(null);

  const saveInputs = (
    score: string,
    dtiValue: string,
    balance: string,
  ) => {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          creditScore: score,
          dti: dtiValue,
          bankBalance: balance,
        }),
      );
    } catch {
      // Ignore storage errors.
    }
  };

  const handleSubmit = () => {
    if (isProving || verified) {
      return;
    }

    setValidationError(null);

    if (!creditScore || !dti || !bankBalance) {
      setValidationError(
        "Please enter your Credit Score, DTI, and Bank Balance.",
      );
      return;
    }

    if (!/^\d+$/.test(creditScore)) {
      setValidationError(
        "Credit Score must be a whole number.",
      );
      return;
    }

    if (!/^\d+$/.test(dti)) {
      setValidationError(
        "DTI must be a whole number.",
      );
      return;
    }

    if (!/^\d+$/.test(bankBalance)) {
      setValidationError(
        "Bank Balance must be a whole number.",
      );
      return;
    }

    const score = BigInt(creditScore);
    const dtiValue = BigInt(dti);
    const balance = BigInt(bankBalance);

    if (score < 0n || score > 850n) {
      setValidationError(
        "Credit Score must be between 0 and 850.",
      );
      return;
    }

    if (dtiValue < 0n || dtiValue > 100n) {
      setValidationError(
        "DTI must be between 0% and 100%.",
      );
      return;
    }

    if (balance < 0n) {
      setValidationError(
        "Bank Balance cannot be negative.",
      );
      return;
    }

    // Save once so React remounts do not erase the values.
    saveInputs(
      creditScore,
      dti,
      bankBalance,
    );

    // Start the real verification flow exactly once.
    onProve(
      score,
      dtiValue,
      balance,
    );
  };

  if (!connected) {
    return (
      <section className="verification-card disabled-card">
        <div className="section-icon">🔐</div>

        <h2>Private Credit Verification</h2>

        <p>
          Connect your 1AM Wallet to begin a private
          creditworthiness proof on Midnight Preprod.
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
        used only as private witness inputs for the
        ZK circuit.
      </p>

      {!verified && (
        <div className="private-inputs">
          <label>
            Credit Score

            <input
              id="input-credit-score"
              type="number"
              inputMode="numeric"
              min="0"
              max="850"
              value={creditScore}
              onChange={(e) => {
                const value = e.target.value;

                setCreditScore(value);

                saveInputs(
                  value,
                  dti,
                  bankBalance,
                );

                setValidationError(null);
              }}
              placeholder="0 – 850"
              autoComplete="off"
              disabled={isProving}
            />
          </label>

          <label>
            Debt-to-Income Ratio

            <input
              id="input-dti"
              type="number"
              inputMode="numeric"
              min="0"
              max="100"
              value={dti}
              onChange={(e) => {
                const value = e.target.value;

                setDti(value);

                saveInputs(
                  creditScore,
                  value,
                  bankBalance,
                );

                setValidationError(null);
              }}
              placeholder="0 – 100%"
              autoComplete="off"
              disabled={isProving}
            />
          </label>

          <label>
            Bank Balance

            <input
              id="input-bank-balance"
              type="number"
              inputMode="numeric"
              min="0"
              value={bankBalance}
              onChange={(e) => {
                const value = e.target.value;

                setBankBalance(value);

                saveInputs(
                  creditScore,
                  dti,
                  value,
                );

                setValidationError(null);
              }}
              placeholder="Enter your balance"
              autoComplete="off"
              disabled={isProving}
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
            ? "Generating Private Proof..."
            : "Prove My Creditworthiness"}
        </button>
      )}

      {isProving && (
        <div className="proof-status">
          <div className="spinner" />

          <div>
            <strong>
              Generating ZK proof...
            </strong>

            <span>
              Your financial values remain private.
            </span>

            <span>
              Approve the transaction in 1AM Wallet
              when prompted.
            </span>
          </div>
        </div>
      )}

      {error && !isProving && (
        <div className="error-message">
          ✕ {error}
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
              Only the eligibility result is publicly
              recorded. Your financial values remain
              private.
            </span>
          </div>
        </div>
      )}
    </section>
  );
}

export default CircuitCall;
