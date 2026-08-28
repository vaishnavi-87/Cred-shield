import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ConnectedAPI,
  InitialAPI,
} from "@midnight-ntwrk/dapp-connector-api";

type WalletState = {
  address: string | null;
  connectedApi: ConnectedAPI | null;
  isConnecting: boolean;
  error: string | null;
  status: string;
};

const NETWORK_ID = "preprod";
const WALLET_INJECTION_TIMEOUT_MS = 5000;
const WALLET_INJECTION_POLL_MS = 100;

const SESSION_KEY = "credshield_1am_connected";

/*
 * Keep the live ConnectedAPI outside React state.
 *
 * This prevents a React remount during ZK proving from destroying
 * the wallet connection object.
 */
let savedConnectedApi: ConnectedAPI | null = null;
let savedAddress: string | null = null;

function getWallet(): InitialAPI | undefined {
  return window.midnight?.["1am"] as InitialAPI | undefined;
}

function errorText(error: unknown, fallback: string): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "reason" in error
  ) {
    return String((error as { reason: unknown }).reason);
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

async function waitForWallet(): Promise<InitialAPI> {
  let wallet = getWallet();

  if (wallet) {
    return wallet;
  }

  const deadline =
    Date.now() + WALLET_INJECTION_TIMEOUT_MS;

  while (!wallet && Date.now() < deadline) {
    await new Promise((resolve) =>
      setTimeout(resolve, WALLET_INJECTION_POLL_MS),
    );

    wallet = getWallet();
  }

  if (!wallet) {
    throw new Error(
      "1AM Wallet was not detected. Please install, unlock, and reload the page.",
    );
  }

  return wallet;
}

async function connectToWallet(): Promise<{
  api: ConnectedAPI;
  address: string;
}> {
  const wallet = await waitForWallet();

  const api = await wallet.connect(NETWORK_ID);

  const connectionStatus =
    await api.getConnectionStatus();

  if (connectionStatus.status === "disconnected") {
    throw new Error(
      "1AM Wallet is disconnected. Please unlock the wallet.",
    );
  }

  if (connectionStatus.networkId !== NETWORK_ID) {
    throw new Error(
      `Wrong network: ${connectionStatus.networkId}. Please switch to Midnight Preprod.`,
    );
  }

  const addressResult =
    await api.getUnshieldedAddress();

  const address =
    addressResult.unshieldedAddress;

  if (!address) {
    throw new Error(
      "Could not obtain the Midnight Preprod wallet address.",
    );
  }

  return {
    api,
    address,
  };
}

export function useMidnight() {
  const restoringRef = useRef(false);

  const [state, setState] =
    useState<WalletState>({
      address: savedAddress,
      connectedApi: savedConnectedApi,
      isConnecting: false,
      error: null,
      status: savedAddress
        ? "✓ 1AM Wallet connected"
        : "",
    });

  /*
   * Automatically restore the already-authorized wallet
   * if React remounts during proving.
   */
  useEffect(() => {
    if (restoringRef.current) {
      return;
    }

    if (
      savedConnectedApi &&
      savedAddress
    ) {
      setState({
        address: savedAddress,
        connectedApi: savedConnectedApi,
        isConnecting: false,
        error: null,
        status: "✓ 1AM Wallet connected",
      });

      return;
    }

    const wasConnected =
      sessionStorage.getItem(
        SESSION_KEY,
      ) === "true";

    if (!wasConnected) {
      return;
    }

    restoringRef.current = true;

    setState((previous) => ({
      ...previous,
      isConnecting: true,
      error: null,
      status:
        "⟳ Restoring 1AM Wallet connection...",
    }));

    connectToWallet()
      .then(({ api, address }) => {
        savedConnectedApi = api;
        savedAddress = address;

        setState({
          address,
          connectedApi: api,
          isConnecting: false,
          error: null,
          status:
            "✓ 1AM Wallet connection restored",
        });
      })
      .catch((error: unknown) => {
        console.warn(
          "Wallet restoration failed:",
          error,
        );

        sessionStorage.removeItem(
          SESSION_KEY,
        );

        setState((previous) => ({
          ...previous,
          isConnecting: false,
          error: null,
          status: "",
        }));
      })
      .finally(() => {
        restoringRef.current = false;
      });
  }, []);

  const connectWallet =
    useCallback(async () => {
      if (
        savedConnectedApi &&
        savedAddress
      ) {
        setState({
          address: savedAddress,
          connectedApi:
            savedConnectedApi,
          isConnecting: false,
          error: null,
          status:
            "✓ 1AM Wallet already connected",
        });

        return;
      }

      setState((previous) => ({
        ...previous,
        isConnecting: true,
        error: null,
        status:
          "⟳ Connecting to 1AM Wallet...",
      }));

      try {
        const { api, address } =
          await connectToWallet();

        savedConnectedApi = api;
        savedAddress = address;

        /*
         * Remember that this browser session has
         * already authorized CredShield.
         */
        sessionStorage.setItem(
          SESSION_KEY,
          "true",
        );

        setState({
          address,
          connectedApi: api,
          isConnecting: false,
          error: null,
          status:
            "✓ 1AM Wallet connected successfully",
        });
      } catch (error: unknown) {
        console.error(
          "1AM Wallet connection failed:",
          error,
        );

        setState((previous) => ({
          ...previous,
          isConnecting: false,
          error: errorText(
            error,
            "Failed to connect to 1AM Wallet.",
          ),
          status: "Wallet connection failed.",
        }));
      }
    }, []);

  const disconnectWallet =
    useCallback(() => {
      savedConnectedApi = null;
      savedAddress = null;

      sessionStorage.removeItem(
        SESSION_KEY,
      );

      setState({
        address: null,
        connectedApi: null,
        isConnecting: false,
        error: null,
        status: "",
      });
    }, []);

  return {
    ...state,
    connectWallet,
    disconnectWallet,
  };
}
