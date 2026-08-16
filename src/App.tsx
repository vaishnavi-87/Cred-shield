import "./App.css";
import WalletConnect from "./components/WalletConnect";
import CircuitCall from "./components/CircuitCall";
import { useMidnight } from "./hooks/useMidnight";
import { useState } from "react";

function App() {
  const {
    address,
    connectedApi,
    isConnecting,
    error: walletError,
    status: walletStatus,
    connectWallet,
    disconnectWallet,
  } = useMidnight();

  const [isProving, setIsProving] = useState(false);
  const [verified, setVerified] = useState(false);
  const [circuitError, setCircuitError] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  const handleProve = async (
    creditScore: bigint,
    dti: bigint,
    bankBalance: bigint,
  ) => {
    setStatus("Starting verification...");
    setCircuitError(null);
    setVerified(false);

    await new Promise((resolve) => setTimeout(resolve, 50));

    if (!connectedApi) {
      setCircuitError("Please connect 1AM Wallet first.");
      return;
    }

    setIsProving(true);

    try {
      setStatus("Starting verification...");

      console.log("Starting real CredShield verification...");

      // ------------------------------------------------------------
      // Initialize CredShield client
      // ------------------------------------------------------------

      setStatus("Initializing CredShield...");

      const { createCredShieldClient } =
        await import("./credshieldClient");

      const client = await createCredShieldClient(
        connectedApi,
        setStatus,
      );

      console.log("CredShield client initialized.");

      // ------------------------------------------------------------
      // Call the real circuit
      // ------------------------------------------------------------

      setStatus("Calling verifyCreditworthiness circuit...");

      const result = await client.verifyCreditworthiness({
        creditScore,
        dti,
        bankBalance,
      });

      console.log(
        "CredShield transaction result:",
        result,
      );

      // ------------------------------------------------------------
      // Transaction has been submitted.
      // Wait for the public state/indexer.
      // ------------------------------------------------------------

      setStatus(
        "✓ Transaction submitted. Waiting for public verification...",
      );

      const maxAttempts = 10;

      let verifiedOnChain = false;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        setStatus(
          `Waiting for public verification... (${attempt}/${maxAttempts})`,
        );

        try {
          verifiedOnChain =
            await client.getVerified();
        } catch (readError) {
          console.warn(
            "Could not read public verified state:",
            readError,
          );
        }

        if (verifiedOnChain) {
          break;
        }

        if (attempt < maxAttempts) {
          await new Promise((resolve) =>
            setTimeout(resolve, 3000),
          );
        }
      }

      // ------------------------------------------------------------
      // Final result
      // ------------------------------------------------------------

      if (!verifiedOnChain) {
        setStatus(
          "Transaction submitted, but public verification is still pending.",
        );

        throw new Error(
          "Transaction completed, but the public verified state has not updated yet.",
        );
      }

      setVerified(true);

      setStatus(
        "✓ Creditworthiness Verified",
      );

      console.log(
        "Creditworthiness verified successfully.",
      );
    } catch (error) {
      console.error(
        "CredShield verification failed:",
        error,
      );

      let userMessage =
        "Creditworthiness verification failed.";

      if (
        typeof error === "object" &&
        error !== null &&
        "reason" in error
      ) {
        userMessage = String(
          (error as { reason: unknown }).reason,
        );
      } else if (error instanceof Error) {
        userMessage = error.message;
      }

      setCircuitError(userMessage);

      setStatus("Verification failed.");
    } finally {
      setIsProving(false);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();

    setVerified(false);
    setCircuitError(null);
    setStatus("");
  };

  return (
    <main className="app">
      <div className="background-glow" />

      <div className="container">

        {/* ============================================================
            HERO
        ============================================================ */}

        <header className="hero">
          <div className="brand">
            <div className="brand-icon">C</div>

            <span>CredShield</span>
          </div>

          <span className="network-badge">
            Midnight Preview
          </span>

          <h1>
            Private creditworthiness,
            <br />
            <span>
              without financial exposure.
            </span>
          </h1>

          <p className="hero-description">
            Prove that you meet lending eligibility
            conditions without revealing your credit
            score, DTI, bank balance, or identity.
          </p>
        </header>

        {/* ============================================================
            PRIVACY BANNER
        ============================================================ */}

        <section className="privacy-banner">
          <div className="privacy-icon">
            🔒
          </div>

          <div>
            <strong>
              Your financial data stays private
            </strong>

            <p>
              CredShield uses a zero-knowledge proof
              to reveal only whether you satisfy the
              eligibility rules.
            </p>
          </div>
        </section>

        {/* ============================================================
            SUCCESS BANNER
        ============================================================ */}

        {verified && (
          <div
            className="wallet-status success"
            style={{
              marginBottom: "18px",
              justifyContent: "center",
              fontWeight: 600,
              fontSize: "16px",
            }}
          >
            <span>✓</span>

            <span>
              Creditworthiness Verified
            </span>
          </div>
        )}

        {/* ============================================================
            MAIN CARD
        ============================================================ */}

        <section className="main-card">

          {/* ========================================================
              WALLET CONNECTION STATUS
          ======================================================== */}

          {(isConnecting || walletStatus) && (
            <div
              className={`wallet-status ${
                walletError
                  ? "error"
                  : !isConnecting &&
                      address
                    ? "success"
                    : ""
              }`}
            >
              {isConnecting ? (
                <span className="status-spinner">
                  ⟳
                </span>
              ) : walletError ? (
                <span>✕</span>
              ) : (
                <span>✓</span>
              )}

              <span>
                {walletError ||
                  walletStatus ||
                  "Connecting to 1AM Wallet..."}
              </span>
            </div>
          )}

          {/* ========================================================
              WALLET CONNECT COMPONENT
          ======================================================== */}

          <WalletConnect
            address={address}
            isConnecting={isConnecting}
            error={walletError}
            onConnect={connectWallet}
            onDisconnect={handleDisconnect}
          />

          {/* ========================================================
              CIRCUIT / CREDIT VERIFICATION
          ======================================================== */}

          <CircuitCall
            connected={Boolean(address)}
            isProving={isProving}
            verified={verified}
            error={circuitError}
            onProve={handleProve}
          />

          {/* ========================================================
              VERIFICATION STATUS
          ======================================================== */}

          {(isProving || status || circuitError) && (
            <section
              className="verification-status"
              style={{
                marginTop: "20px",
                padding: "20px",
                borderRadius: "14px",
                border:
                  "1px solid rgba(130, 140, 255, 0.25)",
                background:
                  "rgba(15, 20, 45, 0.75)",
              }}
            >
              <h3
                style={{
                  marginTop: 0,
                  marginBottom: "15px",
                }}
              >
                CredShield Verification
              </h3>

              {isProving && status && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    color: "#dfe3ff",
                    marginBottom: "10px",
                  }}
                >
                  <span className="status-spinner">
                    ⟳
                  </span>

                  <span>{status}</span>
                </div>
              )}

              {!isProving &&
                status &&
                !circuitError &&
                verified && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      color: "#8df0bd",
                      fontWeight: 600,
                    }}
                  >
                    <span>✓</span>

                    <span>
                      Creditworthiness Verified
                    </span>
                  </div>
                )}

              {circuitError && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    color: "#ff9aa8",
                  }}
                >
                  <span>✕</span>

                  <span>
                    {status === "Verification failed."
                      ? "Verification failed."
                      : circuitError}
                  </span>
                </div>
              )}
            </section>
          )}
        </section>

        {/* ============================================================
            PRIVACY MODEL
        ============================================================ */}

        <section className="privacy-model">
          <h2>
            What remains private?
          </h2>

          <div className="privacy-grid">

            <div>
              <span>PRIVATE</span>
              <strong>
                Credit Score
              </strong>
            </div>

            <div>
              <span>PRIVATE</span>
              <strong>
                Debt-to-Income
              </strong>
            </div>

            <div>
              <span>PRIVATE</span>
              <strong>
                Bank Balance
              </strong>
            </div>

            <div className="public-result">
              <span>
                PUBLIC RESULT
              </span>

              <strong>
                Eligibility status
              </strong>
            </div>

          </div>
        </section>

        {/* ============================================================
            FOOTER
        ============================================================ */}

        <footer>
          <span>
            CredShield
          </span>

          <span>
            Privacy-preserving lending on Midnight
          </span>
        </footer>

      </div>
    </main>
  );
}

export default App;