import { useCallback, useState } from "react";
import type {
  ConnectedAPI,
  InitialAPI,
} from "@midnight-ntwrk/dapp-connector-api";

type WalletState = {
  address: string | null;
  connectedApi: ConnectedAPI | null;
  isConnecting: boolean;
  error: string | null;
};

export function useMidnight() {
  const [state, setState] = useState<WalletState>({
    address: null,
    connectedApi: null,
    isConnecting: false,
    error: null,
  });

  const connectWallet = useCallback(async () => {
    setState((previous) => ({
      ...previous,
      isConnecting: true,
      error: null,
    }));

    try {
      const wallets = window.midnight;

      if (!wallets) {
        throw new Error(
          "No Midnight wallet was detected. Please make sure Lace is installed and unlocked."
        );
      }

      // Find Lace using its official RDNS identifier.
      const laceWallet: InitialAPI | undefined = Object.values(
        wallets
      ).find((wallet) => wallet.rdns === "io.lace.wallet");

      if (!laceWallet) {
        throw new Error(
          "Lace wallet was not detected. Please make sure Lace is installed and unlocked."
        );
      }

      console.log("Lace detected:", {
        name: laceWallet.name,
        rdns: laceWallet.rdns,
        apiVersion: laceWallet.apiVersion,
      });

      // Connect specifically to Midnight Preprod.
      const connectedApi = await laceWallet.connect("preprod");

      console.log("Lace connected to Preprod");

      const addressResult =
        await connectedApi.getUnshieldedAddress();

      console.log(
        "Connected Midnight address:",
        addressResult.unshieldedAddress
      );

      setState({
        address: addressResult.unshieldedAddress,
        connectedApi,
        isConnecting: false,
        error: null,
      });
    } catch (error: unknown) {
      console.error("Lace connection failed:", error);

      const message =
        typeof error === "object" &&
        error !== null &&
        "reason" in error
          ? String((error as { reason: unknown }).reason)
          : error instanceof Error
            ? error.message
            : "Failed to connect to Lace.";

      setState((previous) => ({
        ...previous,
        isConnecting: false,
        error: message,
      }));
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setState({
      address: null,
      connectedApi: null,
      isConnecting: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    connectWallet,
    disconnectWallet,
  };
}