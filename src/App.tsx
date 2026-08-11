import "./App.css";
import WalletConnect from "./components/WalletConnect";
import { useMidnight } from "./hooks/useMidnight";

function App() {
  const {
    address,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
  } = useMidnight();

  return (
    <div className="app">
      <div className="card">
        <h1>🌙 Midnight Privacy Counter</h1>

        <p>
          A privacy-preserving counter powered by Midnight.
        </p>

        <WalletConnect
          address={address}
          isConnecting={isConnecting}
          error={error}
          onConnect={connectWallet}
          onDisconnect={disconnectWallet}
        />

        <div className="privacy">
          🔒 Proved without revealing your private input
        </div>
      </div>
    </div>
  );
}

export default App;