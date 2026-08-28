type WalletConnectProps = {
  address: string | null;
  isConnecting: boolean;
  error: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
};

function WalletConnect({
  address,
  isConnecting,
  error,
  onConnect,
  onDisconnect,
}: WalletConnectProps) {
  const connected = Boolean(address);

  // Show a shortened address: first 8 + "…" + last 6 chars
  const shortAddress = address
    ? `${address.slice(0, 8)}…${address.slice(-6)}`
    : null;

  return (
    <div className="wallet-section">
      <div className="wallet-status">
        <div>
          <span className="label">Wallet</span>
          <strong>
            {connected ? "1AM Wallet Connected" : "Not connected"}
          </strong>
        </div>

        <span className={connected ? "status-pill connected" : "status-pill"}>
          {connected ? "● Connected" : "○ Disconnected"}
        </span>
      </div>

      {connected && address && (
        <div className="wallet-address">
          <span>Midnight Preprod</span>
          <code title={address}>{shortAddress}</code>
        </div>
      )}

      {!connected ? (
        <button
          id="connect-wallet-btn"
          className="primary-button"
          onClick={onConnect}
          disabled={isConnecting}
        >
          {isConnecting
            ? "Waiting for 1AM Wallet…"
            : "Connect Wallet"}
        </button>
      ) : (
        <button
          id="disconnect-wallet-btn"
          className="secondary-button"
          onClick={onDisconnect}
        >
          Disconnect Wallet
        </button>
      )}

      {connected && (
        <p className="wallet-hint">
          1AM Wallet keeps this site authorized until you
          revoke it inside the 1AM Wallet extension.
        </p>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </div>
  );
}

export default WalletConnect;
