import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

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

// ============================================================
// CONFIGURATION
// ============================================================

const NETWORK_ID = "preprod";

const WALLET_INJECTION_TIMEOUT_MS = 5000;
const WALLET_INJECTION_POLL_MS = 100;

const SESSION_KEY = "credshield_1am_connected";

// ============================================================
// KEEP CONNECTION OUTSIDE REACT STATE
// ============================================================

let savedConnectedApi: ConnectedAPI | null = null;
let savedAddress: string | null = null;

// Prevent multiple simultaneous wallet.connect() calls.
let connectionInFlight:
  | Promise<{
      api: ConnectedAPI;
      address: string;
    }>
  | null = null;

// ============================================================
// HELPERS
// ============================================================

function getWallet(): InitialAPI | undefined {
  return window.midnight?.["1am"] as
    | InitialAPI
    | undefined;
}

function errorText(
  error: unknown,
  fallback: string,
): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "reason" in error
  ) {
    return String(
      (error as { reason: unknown }).reason,
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

// ============================================================
// WAIT FOR 1AM WALLET INJECTION
// ============================================================

async function waitForWallet(): Promise<InitialAPI> {
  let wallet = getWallet();

  // Wallet already injected.
  if (wallet) {
    return wallet;
  }

  console.log(
    "Waiting for 1AM Wallet extension...",
  );

  const deadline =
    Date.now() + WALLET_INJECTION_TIMEOUT_MS;

  while (
    !wallet &&
    Date.now() < deadline
  ) {
    await new Promise((resolve) =>
      setTimeout(
        resolve,
        WALLET_INJECTION_POLL_MS,
      ),
    );

    wallet = getWallet();
  }

  if (!wallet) {
    throw new Error(
      "1AM Wallet was not detected. Please install and unlock the 1AM Wallet extension.",
    );
  }

  console.log(
    "1AM Wallet detected.",
  );

  return wallet;
}

// ============================================================
// CONNECT TO 1AM WALLET
// ============================================================

async function connectToWallet(): Promise<{
  api: ConnectedAPI;
  address: string;
}> {
  // ----------------------------------------------------------
  // IMPORTANT:
  // If another connection is already running, reuse it.
  // This prevents first-click race conditions.
  // ----------------------------------------------------------

  if (connectionInFlight) {
    console.log(
      "Reusing existing 1AM Wallet connection attempt...",
    );

    return connectionInFlight;
  }

  connectionInFlight = (async () => {
    try {
      const wallet = await waitForWallet();

      console.log(
        "Requesting 1AM Wallet connection to Midnight Preprod...",
      );

      // --------------------------------------------------------
      // Connect to Midnight Preprod
      // --------------------------------------------------------

      const api =
        await wallet.connect(NETWORK_ID);

      console.log(
        "1AM Wallet connect() completed.",
      );

      // --------------------------------------------------------
      // Verify connection status
      // --------------------------------------------------------

      const connectionStatus =
        await api.getConnectionStatus();

      console.log(
        "1AM Wallet connection status:",
        connectionStatus,
      );

      if (
        connectionStatus.status ===
        "disconnected"
      ) {
        throw new Error(
          "1AM Wallet is disconnected. Please unlock the wallet.",
        );
      }

      if (
        connectionStatus.networkId !==
        NETWORK_ID
      ) {
        throw new Error(
          `Wrong network: ${connectionStatus.networkId}. Please switch to Midnight Preprod.`,
        );
      }

      // --------------------------------------------------------
      // Get Midnight address
      // --------------------------------------------------------

      const addressResult =
        await api.getUnshieldedAddress();

      const address =
        addressResult.unshieldedAddress;

      if (!address) {
        throw new Error(
          "Could not obtain the Midnight Preprod wallet address.",
        );
      }

      console.log(
        "1AM Wallet address obtained:",
        address,
      );

      return {
        api,
        address,
      };
    } finally {
      // Allow a future connection after this attempt finishes.
      connectionInFlight = null;
    }
  })();

  return connectionInFlight;
}

// ============================================================
// HOOK
// ============================================================

export function useMidnight() {
  const restoringRef =
    useRef(false);

  const [state, setState] =
    useState<WalletState>({
      address: savedAddress,
      connectedApi:
        savedConnectedApi,
      isConnecting: false,
      error: null,
      status: savedAddress
        ? "✓ 1AM Wallet connected"
        : "",
    });

  // ==========================================================
  // AUTOMATICALLY RESTORE AUTHORIZED WALLET
  // ==========================================================

  useEffect(() => {
    if (restoringRef.current) {
      return;
    }

    // Already connected in this browser session.
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
          "✓ 1AM Wallet connected",
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

        console.log(
          "1AM Wallet connection restored.",
        );
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

  // ==========================================================
  // CONNECT BUTTON
  // ==========================================================

  const connectWallet =
    useCallback(async () => {
      // --------------------------------------------------------
      // Already connected
      // --------------------------------------------------------

      if (
        savedConnectedApi &&
        savedAddress
      ) {
        console.log(
          "1AM Wallet already connected.",
        );

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

      // --------------------------------------------------------
      // Prevent duplicate clicks while connecting
      // --------------------------------------------------------

      if (connectionInFlight) {
        console.log(
          "Connection already in progress. Waiting for it...",
        );

        setState((previous) => ({
          ...previous,
          isConnecting: true,
          error: null,
          status:
            "⟳ Connecting to 1AM Wallet...",
        }));

        try {
          const {
            api,
            address,
          } = await connectionInFlight;

          savedConnectedApi = api;
          savedAddress = address;

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

          return;
        } catch {
          // The original connection attempt will
          // report the actual error below.
          return;
        }
      }

      setState((previous) => ({
        ...previous,
        isConnecting: true,
        error: null,
        status:
          "⟳ Connecting to 1AM Wallet...",
      }));

      try {
        console.log(
          "Starting 1AM Wallet connection...",
        );

        const {
          api,
          address,
        } = await connectToWallet();

        // ------------------------------------------------------
        // Save successful connection
        // ------------------------------------------------------

        savedConnectedApi = api;
        savedAddress = address;

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

        console.log(
          "✓ 1AM Wallet connected successfully",
        );
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
          status:
            "Wallet connection failed.",
        }));
      }
    }, []);

  // ==========================================================
  // DISCONNECT
  // ==========================================================

  const disconnectWallet =
    useCallback(() => {
      console.log(
        "Disconnecting 1AM Wallet...",
      );

      savedConnectedApi = null;
      savedAddress = null;
      connectionInFlight = null;

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

  // ==========================================================
  // RETURN
  // ==========================================================

  return {
    ...state,
    connectWallet,
    disconnectWallet,
  };
}