import "./App.css";
import Layout from "./components/Layout";
import WalletConnect from "./components/WalletConnect";
import CircuitCall from "./components/CircuitCall";
import { useMidnight } from "./hooks/useMidnight";
import { useEffect, useState } from "react";
import type { AppPage } from "./components/AppShell";

type VerificationRecord = {
  id: string;
  timestamp: string;
  result: "Verified" | "Failed";
  network: string;
};

type ProcessStep = {
  number: string;
  title: string;
  complete: boolean;
};

const HISTORY_KEY = "credshield-verification-history";

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
  const [history, setHistory] = useState<VerificationRecord[]>([]);

  // ============================================================
  // LOAD HISTORY
  // ============================================================

  useEffect(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);

      if (!saved) {
        setHistory([]);
        return;
      }

      const parsed = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        const validRecords: VerificationRecord[] = parsed.filter(
          (record): record is VerificationRecord =>
            record &&
            typeof record.id === "string" &&
            typeof record.timestamp === "string" &&
            (record.result === "Verified" ||
              record.result === "Failed") &&
            typeof record.network === "string",
        );

        setHistory(validRecords);
      }
    } catch (error) {
      console.warn("Could not load verification history:", error);
      setHistory([]);
    }
  }, []);

  // ============================================================
  // DEBUG STATE
  // ============================================================

  useEffect(() => {
    console.log("=== CredShield App State ===");
    console.log("address:", address);
    console.log("connectedApi:", connectedApi);
    console.log("isConnecting:", isConnecting);
    console.log("walletStatus:", walletStatus);
    console.log("============================");
  }, [
    address,
    connectedApi,
    isConnecting,
    walletStatus,
  ]);

  // ============================================================
  // SAVE HISTORY
  // ============================================================

  const saveHistory = (
    result: "Verified" | "Failed",
  ) => {
    const record: VerificationRecord = {
      id:
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      result,
      network: "Midnight Preprod",
    };

    setHistory((previous) => {
      const updated = [record, ...previous];

      try {
        localStorage.setItem(
          HISTORY_KEY,
          JSON.stringify(updated),
        );

        console.log(
          "CredShield history saved:",
          record,
        );
      } catch (error) {
        console.warn(
          "Could not save verification history:",
          error,
        );
      }

      return updated;
    });
  };

  // ============================================================
  // REAL CRED-SHIELD VERIFICATION
  // ============================================================

  const handleProve = async (
    creditScore: bigint,
    dti: bigint,
    bankBalance: bigint,
  ) => {
    console.log("=================================");
    console.log("PROVE BUTTON CLICKED");
    console.log("address at prove:", address);
    console.log("connectedApi at prove:", connectedApi);
    console.log("=================================");

    setStatus("Starting verification...");
    setCircuitError(null);
    setVerified(false);

    await new Promise((resolve) =>
      setTimeout(resolve, 50),
    );

    // ----------------------------------------------------------
    // CHECK WALLET
    // ----------------------------------------------------------

    if (!connectedApi || !address) {
      console.error("WALLET LOST BEFORE PROVING");
      console.error("address:", address);
      console.error("connectedApi:", connectedApi);

      setCircuitError(
        "Wallet connection was lost. Please reconnect 1AM Wallet.",
      );

      setStatus("Verification failed.");

      saveHistory("Failed");

      return;
    }

    setIsProving(true);

    try {
      // --------------------------------------------------------
      // STEP 1 — Start
      // --------------------------------------------------------

      console.log(
        "STEP 1: Entered verification try block",
      );

      setStatus("Starting verification...");

      // --------------------------------------------------------
      // STEP 2 — Import CredShield client
      // --------------------------------------------------------

      console.log(
        "STEP 2: Creating CredShield client...",
      );

      setStatus("Initializing CredShield...");

      const { createCredShieldClient } =
        await import("./credshieldClient");

      // --------------------------------------------------------
      // STEP 3 — Create client
      // --------------------------------------------------------

      const client = await createCredShieldClient(
        connectedApi,
        setStatus,
      );

      console.log(
        "STEP 3: CredShield client created:",
        client,
      );

      console.log(
        "CredShield client initialized.",
      );

      // --------------------------------------------------------
      // STEP 4 — REAL CIRCUIT
      // --------------------------------------------------------

      setStatus(
        "Calling verifyCreditworthiness circuit...",
      );

      console.log(
        "STEP 4: Calling verifyCreditworthiness...",
      );

      const result =
        await client.verifyCreditworthiness({
          creditScore,
          dti,
          bankBalance,
        });

      console.log(
        "STEP 5: verifyCreditworthiness returned:",
        result,
      );

      console.log(
        "CredShield transaction result:",
        result,
      );

      // --------------------------------------------------------
      // STEP 5 — WAIT FOR PUBLIC VERIFICATION
      // --------------------------------------------------------

      setStatus(
        "✓ Transaction submitted. Waiting for public verification...",
      );

      /*
       * Fast public-state polling.
       *
       * Check immediately, then every 250 ms for up to 5 seconds.
       * The transaction is already submitted before this polling
       * starts, so the UI can show the result as soon as the
       * Midnight public state/indexer reflects it.
       *
       * IMPORTANT:
       * We still wait for the real on-chain public state. We do not
       * mark the user as verified before the blockchain confirms it.
       */
      const maxAttempts = 20;
      const pollInterval = 250;

      let verifiedOnChain = false;

      for (
        let attempt = 1;
        attempt <= maxAttempts;
        attempt++
      ) {
        setStatus(
          `✓ Transaction submitted. Waiting for public verification... (${attempt}/${maxAttempts})`,
        );

        try {
          verifiedOnChain =
            await client.getVerified();

          console.log(
            `Public verification attempt ${attempt}:`,
            verifiedOnChain,
          );
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
            setTimeout(resolve, pollInterval),
          );
        }
      }

      // --------------------------------------------------------
      // STEP 6 — FINAL RESULT
      // --------------------------------------------------------

      if (!verifiedOnChain) {
        /*
         * The transaction was submitted successfully, but the
         * public state/indexer has not updated within our short
         * polling window.
         *
         * Do NOT mark this as Failed and do NOT add a failed
         * history record. The transaction may still succeed.
         */
        setStatus(
          "Transaction submitted. Public verification is still pending.",
        );
        return;
      }

      // --------------------------------------------------------
      // SUCCESS
      // --------------------------------------------------------

      setVerified(true);

      setStatus(
        "✓ Creditworthiness Verified",
      );

      /*
       * IMPORTANT:
       * Save the successful verification immediately.
       * This makes it appear in both Dashboard and History.
       */
      saveHistory("Verified");

      console.log(
        "Creditworthiness verified successfully.",
      );
    } catch (error: unknown) {
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

      /*
       * A public-state timeout is NOT treated as a real
       * failed verification because the transaction itself
       * may already have succeeded.
       */
      const isPublicVerificationPending =
        userMessage.includes(
          "public verified state has not updated yet",
        );

      if (isPublicVerificationPending) {
        setStatus(
          "Transaction submitted. Public verification is still pending.",
        );
      } else {
        setStatus("Verification failed.");

        saveHistory("Failed");
      }
    } finally {
      setIsProving(false);
    }
  };

  // ============================================================
  // DISCONNECT
  // ============================================================

  const handleDisconnect = () => {
    disconnectWallet();

    setVerified(false);
    setCircuitError(null);
    setStatus("");
  };

  // ============================================================
  // CLEAR HISTORY
  // ============================================================

  const clearHistory = () => {
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch (error) {
      console.warn(
        "Could not clear verification history:",
        error,
      );
    }

    setHistory([]);
  };

  // ============================================================
  // APPLICATION
  // ============================================================

  return (
    <Layout>
      {(activePage: AppPage) => {
        // ========================================================
        // DASHBOARD
        // ========================================================

        if (activePage === "dashboard") {
          const processSteps: ProcessStep[] = [
            {
              number: "01",
              title: "Wallet",
              complete: Boolean(address),
            },
            {
              number: "02",
              title: "Private Data",
              complete: Boolean(address),
            },
            {
              number: "03",
              title: "ZK Proof",
              complete: isProving || verified,
            },
            {
              number: "04",
              title: "Transaction",
              complete:
                verified ||
                status.includes("Transaction submitted"),
            },
            {
              number: "05",
              title: "Verified",
              complete: verified,
            },
          ];

          return (
            <main className="app">
              <div className="background-glow" />

              <div className="container">
                {/* HERO */}

                <header className="hero">
                  <div className="brand">
                    <div className="brand-icon">
                      C
                    </div>

                    <span>CredShield</span>
                  </div>

                  <span className="network-badge">
                    Midnight Preprod
                  </span>

                  <h1>
                    Private creditworthiness,
                    <br />
                    <span>
                      without financial exposure.
                    </span>
                  </h1>

                  <p className="hero-description">
                    A privacy-preserving dashboard for
                    verifying lending eligibility without
                    exposing sensitive financial
                    information.
                  </p>
                </header>

                {/* STATUS CARDS */}

                <section
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "16px",
                    marginBottom: "24px",
                  }}
                >
                  {/* PRIVACY */}

                  <div className="main-card">
                    <span
                      style={{
                        fontSize: "12px",
                        opacity: 0.6,
                        letterSpacing: "1px",
                      }}
                    >
                      PRIVACY STATUS
                    </span>

                    <h2
                      style={{
                        margin: "10px 0 5px",
                      }}
                    >
                      Protected
                    </h2>

                    <p
                      style={{
                        opacity: 0.7,
                      }}
                    >
                      Financial inputs remain private.
                    </p>
                  </div>

                  {/* VERIFICATION */}

                  <div className="main-card">
                    <span
                      style={{
                        fontSize: "12px",
                        opacity: 0.6,
                        letterSpacing: "1px",
                      }}
                    >
                      VERIFICATION
                    </span>

                    <h2
                      style={{
                        margin: "10px 0 5px",
                      }}
                    >
                      {verified
                        ? "Verified"
                        : history.some(
                              (item) =>
                                item.result ===
                                "Verified",
                            )
                          ? "Verified"
                          : "Pending"}
                    </h2>

                    <p
                      style={{
                        opacity: 0.7,
                      }}
                    >
                      {verified
                        ? "Eligibility confirmed."
                        : history.some(
                              (item) =>
                                item.result ===
                                "Verified",
                            )
                          ? "Previous eligibility confirmed."
                          : "No completed verification in this session."}
                    </p>
                  </div>

                  {/* WALLET */}

                  <div className="main-card">
                    <span
                      style={{
                        fontSize: "12px",
                        opacity: 0.6,
                        letterSpacing: "1px",
                      }}
                    >
                      WALLET
                    </span>

                    <h2
                      style={{
                        margin: "10px 0 5px",
                      }}
                    >
                      {address
                        ? "Connected"
                        : "Not Connected"}
                    </h2>

                    <p
                      style={{
                        opacity: 0.7,
                      }}
                    >
                      1AM Wallet · Midnight Preprod
                    </p>
                  </div>

                  {/* VERIFICATIONS */}

                  <div className="main-card">
                    <span
                      style={{
                        fontSize: "12px",
                        opacity: 0.6,
                        letterSpacing: "1px",
                      }}
                    >
                      VERIFICATIONS
                    </span>

                    <h2
                      style={{
                        margin: "10px 0 5px",
                      }}
                    >
                      {history.length}
                    </h2>

                    <p
                      style={{
                        opacity: 0.7,
                      }}
                    >
                      Records stored locally
                    </p>
                  </div>
                </section>

                {/* VERIFICATION PROCESS */}

                <section className="main-card">
                  <h2>
                    Verification Process
                  </h2>

                  <p
                    style={{
                      opacity: 0.7,
                      marginBottom: "25px",
                    }}
                  >
                    Track the privacy-preserving
                    verification journey from wallet
                    connection to final eligibility
                    result.
                  </p>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(150px, 1fr))",
                      gap: "12px",
                    }}
                  >
                    {processSteps.map((step) => (
                      <div
                        key={step.number}
                        style={{
                          padding: "18px",
                          borderRadius: "12px",
                          border:
                            "1px solid rgba(130,140,255,0.2)",
                          background:
                            "rgba(15,20,45,0.55)",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "11px",
                            opacity: 0.5,
                          }}
                        >
                          {step.number}
                        </span>

                        <strong
                          style={{
                            display: "block",
                            marginTop: "8px",
                          }}
                        >
                          {step.title}
                        </strong>

                        <span
                          style={{
                            display: "block",
                            marginTop: "8px",
                            fontSize: "13px",
                            color: step.complete
                              ? "#8df0bd"
                              : "rgba(255,255,255,0.45)",
                          }}
                        >
                          {step.complete
                            ? "✓ Complete"
                            : "○ Waiting"}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* RECENT ACTIVITY + PRIVACY */}

                <section
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "minmax(0, 1.3fr) minmax(280px, 0.7fr)",
                    gap: "20px",
                    marginTop: "20px",
                  }}
                >
                  {/* RECENT ACTIVITY */}

                  <div className="main-card">
                    <h2>
                      Recent Activity
                    </h2>

                    {history.length === 0 ? (
                      <p
                        style={{
                          opacity: 0.6,
                        }}
                      >
                        No verification activity yet.
                        Complete a verification to see it
                        here.
                      </p>
                    ) : (
                      <div>
                        {history
                          .slice(0, 5)
                          .map((record) => (
                            <div
                              key={record.id}
                              style={{
                                display: "flex",
                                justifyContent:
                                  "space-between",
                                alignItems:
                                  "center",
                                gap: "15px",
                                padding: "14px 0",
                                borderBottom:
                                  "1px solid rgba(255,255,255,0.08)",
                              }}
                            >
                              <div>
                                <strong>
                                  Creditworthiness{" "}
                                  {record.result}
                                </strong>

                                <div
                                  style={{
                                    fontSize: "12px",
                                    opacity: 0.55,
                                    marginTop: "4px",
                                  }}
                                >
                                  {new Date(
                                    record.timestamp,
                                  ).toLocaleString()}
                                </div>
                              </div>

                              <span
                                style={{
                                  color:
                                    record.result ===
                                    "Verified"
                                      ? "#8df0bd"
                                      : "#ff9aa8",
                                  fontSize: "20px",
                                }}
                              >
                                {record.result ===
                                "Verified"
                                  ? "✓"
                                  : "✕"}
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* PRIVACY PROTECTION */}

                  <div className="privacy-model">
                    <h2>
                      Privacy Protection
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
                  </div>
                </section>

                <footer>
                  <span>CredShield</span>

                  <span>
                    Privacy-preserving lending on
                    Midnight
                  </span>
                </footer>
              </div>
            </main>
          );
        }

        // ========================================================
        // VERIFY PAGE
        // ========================================================

        if (activePage === "verify") {
          return (
            <main className="app">
              <div className="background-glow" />

              <div className="container">
                <header className="hero">
                  <div className="brand">
                    <div className="brand-icon">
                      C
                    </div>

                    <span>CredShield</span>
                  </div>

                  <span className="network-badge">
                    Midnight Preprod
                  </span>

                  <h1>
                    Verify your
                    <br />
                    <span>
                      creditworthiness privately.
                    </span>
                  </h1>

                  <p className="hero-description">
                    Submit your private financial
                    information through a
                    zero-knowledge verification without
                    exposing the underlying values.
                  </p>
                </header>

                {/* PRIVACY BANNER */}

                <section className="privacy-banner">
                  <div className="privacy-icon">
                    🔒
                  </div>

                  <div>
                    <strong>
                      Your financial data stays private
                    </strong>

                    <p>
                      CredShield uses a zero-knowledge
                      proof to reveal only whether you
                      satisfy the eligibility rules.
                    </p>
                  </div>
                </section>

                {/* SUCCESS */}

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

                {/* MAIN VERIFICATION CARD */}

                <section className="main-card">
                  {(isConnecting ||
                    walletStatus) && (
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

                  <WalletConnect
                    address={address}
                    isConnecting={isConnecting}
                    error={walletError}
                    onConnect={connectWallet}
                    onDisconnect={handleDisconnect}
                  />

                  <CircuitCall
                    connected={Boolean(address)}
                    isProving={isProving}
                    verified={verified}
                    error={circuitError}
                    onProve={handleProve}
                  />

                  {/* VERIFICATION STATUS */}

                  {(isProving ||
                    status ||
                    circuitError) && (
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

                      {isProving &&
                        status && (
                          <div
                            style={{
                              display: "flex",
                              alignItems:
                                "center",
                              gap: "10px",
                              color: "#dfe3ff",
                              marginBottom: "10px",
                            }}
                          >
                            <span className="status-spinner">
                              ⟳
                            </span>

                            <span>
                              {status}
                            </span>
                          </div>
                        )}

                      {!isProving &&
                        status &&
                        !circuitError &&
                        verified && (
                          <div
                            style={{
                              display: "flex",
                              alignItems:
                                "center",
                              gap: "10px",
                              color: "#8df0bd",
                              fontWeight: 600,
                            }}
                          >
                            <span>✓</span>

                            <span>
                              Creditworthiness
                              Verified
                            </span>
                          </div>
                        )}

                      {circuitError && (
                        <div
                          style={{
                            display: "flex",
                            alignItems:
                              "flex-start",
                            gap: "10px",
                            color: "#ff9aa8",
                          }}
                        >
                          <span>✕</span>

                          <span>
                            {circuitError}
                          </span>
                        </div>
                      )}
                    </section>
                  )}
                </section>

                {/* PRIVACY MODEL */}

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

                <footer>
                  <span>
                    CredShield
                  </span>

                  <span>
                    Privacy-preserving lending on
                    Midnight
                  </span>
                </footer>
              </div>
            </main>
          );
        }

        // ========================================================
        // HISTORY PAGE
        // ========================================================

        if (activePage === "history") {
          return (
            <main className="app">
              <div className="background-glow" />

              <div className="container">
                <header
                  style={{
                    marginBottom: "30px",
                  }}
                >
                  <span className="topbar-label">
                    VERIFICATION RECORDS
                  </span>

                  <h1
                    style={{
                      fontSize: "38px",
                      margin: "8px 0",
                    }}
                  >
                    Verification History
                  </h1>

                  <p
                    style={{
                      opacity: 0.65,
                      maxWidth: "650px",
                    }}
                  >
                    Review verification activity stored
                    locally in this browser. Sensitive
                    financial inputs are never stored here.
                  </p>
                </header>

                <section className="main-card">
                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems: "center",
                      gap: "15px",
                      marginBottom: "20px",
                    }}
                  >
                    <div>
                      <h2
                        style={{
                          marginBottom: "5px",
                        }}
                      >
                        Activity
                      </h2>

                      <p
                        style={{
                          margin: 0,
                          opacity: 0.6,
                        }}
                      >
                        {history.length}{" "}
                        verification{" "}
                        {history.length === 1
                          ? "record"
                          : "records"}
                      </p>
                    </div>

                    {history.length > 0 && (
                      <button
                        type="button"
                        onClick={clearHistory}
                        style={{
                          padding:
                            "10px 14px",
                          borderRadius: "8px",
                          border:
                            "1px solid rgba(255,255,255,0.15)",
                          background:
                            "rgba(255,255,255,0.05)",
                          color: "inherit",
                          cursor: "pointer",
                        }}
                      >
                        Clear History
                      </button>
                    )}
                  </div>

                  {history.length === 0 ? (
                    <div
                      style={{
                        padding:
                          "45px 20px",
                        textAlign: "center",
                        opacity: 0.6,
                      }}
                    >
                      <div
                        style={{
                          fontSize: "36px",
                          marginBottom: "12px",
                        }}
                      >
                        ◷
                      </div>

                      <strong>
                        No verification records yet
                      </strong>

                      <p>
                        Complete a creditworthiness
                        verification to create your
                        first record.
                      </p>
                    </div>
                  ) : (
                    <div>
                      {history.map(
                        (record, index) => (
                          <div
                            key={record.id}
                            style={{
                              display: "grid",
                              gridTemplateColumns:
                                "50px 1fr auto",
                              alignItems:
                                "center",
                              gap: "15px",
                              padding: "18px 0",
                              borderBottom:
                                index ===
                                history.length - 1
                                  ? "none"
                                  : "1px solid rgba(255,255,255,0.08)",
                            }}
                          >
                            <div
                              style={{
                                width: "38px",
                                height: "38px",
                                borderRadius:
                                  "50%",
                                display: "flex",
                                alignItems:
                                  "center",
                                justifyContent:
                                  "center",
                                background:
                                  record.result ===
                                  "Verified"
                                    ? "rgba(80,220,150,0.12)"
                                    : "rgba(255,100,120,0.12)",
                                color:
                                  record.result ===
                                  "Verified"
                                    ? "#8df0bd"
                                    : "#ff9aa8",
                                fontWeight: 700,
                              }}
                            >
                              {record.result ===
                              "Verified"
                                ? "✓"
                                : "✕"}
                            </div>

                            <div>
                              <strong>
                                Creditworthiness{" "}
                                {record.result}
                              </strong>

                              <p
                                style={{
                                  margin:
                                    "5px 0 0",
                                  fontSize:
                                    "13px",
                                  opacity: 0.55,
                                }}
                              >
                                {new Date(
                                  record.timestamp,
                                ).toLocaleString()}
                              </p>
                            </div>

                            <span
                              style={{
                                fontSize:
                                  "12px",
                                opacity: 0.6,
                              }}
                            >
                              {record.network}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </section>

                <section className="privacy-banner">
                  <div className="privacy-icon">
                    🔒
                  </div>

                  <div>
                    <strong>
                      Sensitive financial data is not
                      stored
                    </strong>

                    <p>
                      History contains only verification
                      status, timestamp and network
                      information.
                    </p>
                  </div>
                </section>
              </div>
            </main>
          );
        }

        // ========================================================
        // SETTINGS PAGE
        // ========================================================

        return (
          <main className="app">
            <div className="background-glow" />

            <div className="container">
              <header
                style={{
                  marginBottom: "30px",
                }}
              >
                <span className="topbar-label">
                  APPLICATION CONFIGURATION
                </span>

                <h1
                  style={{
                    fontSize: "38px",
                    margin: "8px 0",
                  }}
                >
                  Settings
                </h1>

                <p
                  style={{
                    opacity: 0.65,
                    maxWidth: "650px",
                  }}
                >
                  Manage your wallet connection,
                  network information and privacy
                  preferences.
                </p>
              </header>

              {/* WALLET SETTINGS */}

              <section
                className="main-card"
                style={{
                  marginBottom: "20px",
                }}
              >
                <h2>Wallet</h2>

                <p
                  style={{
                    opacity: 0.65,
                  }}
                >
                  Current wallet connection status.
                </p>

                <div
                  style={{
                    marginTop: "20px",
                    padding: "16px",
                    borderRadius: "10px",
                    background:
                      "rgba(255,255,255,0.04)",
                    border:
                      "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      fontSize: "12px",
                      opacity: 0.5,
                      marginBottom: "6px",
                    }}
                  >
                    CONNECTION
                  </span>

                  <strong>
                    {address
                      ? "1AM Wallet Connected"
                      : "Wallet Not Connected"}
                  </strong>

                  {address && (
                    <p
                      style={{
                        marginTop: "8px",
                        fontSize: "12px",
                        opacity: 0.5,
                        wordBreak:
                          "break-all",
                      }}
                    >
                      {address}
                    </p>
                  )}
                </div>
              </section>

              {/* NETWORK SETTINGS */}

              <section
                className="main-card"
                style={{
                  marginBottom: "20px",
                }}
              >
                <h2>Network</h2>

                <p
                  style={{
                    opacity: 0.65,
                  }}
                >
                  CredShield currently operates on the
                  Midnight Preprod network.
                </p>

                <div
                  style={{
                    marginTop: "20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "16px",
                    borderRadius: "10px",
                    background:
                      "rgba(80,220,150,0.06)",
                    border:
                      "1px solid rgba(80,220,150,0.15)",
                  }}
                >
                  <span className="status-dot" />

                  <div>
                    <strong>
                      Midnight Preprod
                    </strong>

                    <p
                      style={{
                        margin:
                          "4px 0 0",
                        fontSize:
                          "13px",
                        opacity: 0.6,
                      }}
                    >
                      Network configured for
                      CredShield
                    </p>
                  </div>
                </div>
              </section>

              {/* PRIVACY SETTINGS */}

              <section className="main-card">
                <h2>Privacy</h2>

                <p
                  style={{
                    opacity: 0.65,
                  }}
                >
                  CredShield is designed to keep the
                  underlying financial information private.
                </p>

                <div
                  style={{
                    marginTop: "20px",
                  }}
                >
                  {[
                    "Credit score remains private",
                    "Debt-to-income ratio remains private",
                    "Bank balance remains private",
                    "Only the eligibility result is revealed",
                  ].map((item) => (
                    <div
                      key={item}
                      style={{
                        display: "flex",
                        gap: "10px",
                        alignItems:
                          "center",
                        padding:
                          "12px 0",
                        borderBottom:
                          "1px solid rgba(255,255,255,0.07)",
                      }}
                    >
                      <span
                        style={{
                          color:
                            "#8df0bd",
                        }}
                      >
                        ✓
                      </span>

                      <span>
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </main>
        );
      }}
    </Layout>
  );
}

export default App;