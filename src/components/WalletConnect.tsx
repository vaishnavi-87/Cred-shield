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

  return (
    <div className="wallet-section">
      <div className="status">
        <span>Wallet Status</span>

        <strong>
          {connected ? "Connected" : "Disconnected"}
        </strong>
      </div>

      {connected && address && (
        <div className="address">
          <span>Preprod Address</span>
          <code>{address}</code>
        </div>
      )}

      {!connected ? (
        <button
          onClick={onConnect}
          disabled={isConnecting}
        >
          {isConnecting ? "Connecting to Lace..." : "Connect Lace"}
        </button>
      ) : (
        <button onClick={onDisconnect}>
          Disconnect
        </button>
      )}

      {error && (
        <div className="error">
          {error}
        </div>
      )}
    </div>
  );
}

export default WalletConnect;