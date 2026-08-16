import type { ConnectedAPI } from "@midnight-ntwrk/dapp-connector-api";

import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";

import {
  findDeployedContract,
} from "@midnight-ntwrk/midnight-js-contracts";

import {
  CompiledContract,
} from "@midnight-ntwrk/midnight-js-protocol/compact-js";

import {
  type ContractAddress,
} from "@midnight-ntwrk/midnight-js-protocol/compact-runtime";

import {
  Binding,
  FinalizedTransaction,
  Proof,
  SignatureEnabled,
  Transaction,
} from "@midnight-ntwrk/midnight-js-protocol/ledger";

import {
  httpClientProofProvider,
} from "@midnight-ntwrk/midnight-js-http-client-proof-provider";

import {
  indexerPublicDataProvider,
} from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";

import {
  FetchZkConfigProvider,
} from "@midnight-ntwrk/midnight-js-fetch-zk-config-provider";

import {
  createProofProvider,
  type UnboundTransaction,
} from "@midnight-ntwrk/midnight-js-types";

import * as CredShield from "../contracts/managed/credshield/contract/index.js";

import {
  inMemoryPrivateStateProvider,
} from "./in-memory-private-state-provider";


// ─────────────────────────────────────────────────────────────────────────────
// DEPLOYED CONTRACT
// ─────────────────────────────────────────────────────────────────────────────

const CONTRACT_ADDRESS =
  "4e9bdd092a84c65e48b7b4a87f4c0a7b96ac5dcdc0b773a170ff3d11acc6db9f" as ContractAddress;

const PRIVATE_STATE_ID = "credshieldPrivateState";


// ─────────────────────────────────────────────────────────────────────────────
// PRIVATE STATE
// ─────────────────────────────────────────────────────────────────────────────

export type CredShieldPrivateState = {
  creditScore: bigint;
  dti: bigint;
  bankBalance: bigint;
};

export type CreditData = {
  creditScore: bigint;
  dti: bigint;
  bankBalance: bigint;
};


// ─────────────────────────────────────────────────────────────────────────────
// COMPILED CONTRACT
// ─────────────────────────────────────────────────────────────────────────────

const compiledContract =
  CompiledContract.make<
    CredShield.Contract<CredShieldPrivateState>
  >(
    "credshield",
    CredShield.Contract<CredShieldPrivateState>,
  ).pipe(
    CompiledContract.withWitnesses({

      creditScore: (context) => [
        context.privateState,
        context.privateState.creditScore,
      ],

      dti: (context) => [
        context.privateState,
        context.privateState.dti,
      ],

      bankBalance: (context) => [
        context.privateState,
        context.privateState.bankBalance,
      ],

    }),
  );


// ─────────────────────────────────────────────────────────────────────────────
// CLIENT FACTORY
// ─────────────────────────────────────────────────────────────────────────────

export async function createCredShieldClient(
  connectedAPI: ConnectedAPI,
  onStatus?: (status: string) => void | Promise<void>,
) {
  /*
   * IMPORTANT:
   *
   * Every UI status is awaited.
   *
   * Two requestAnimationFrame calls are used so that:
   * 1. React receives the state update.
   * 2. The browser gets an opportunity to paint it.
   * 3. Only then does the next Midnight operation begin.
   *
   * This prevents the UI from appearing frozen until DevTools/Console
   * is opened.
   */
  const updateStatus = async (message: string) => {
    await onStatus?.(message);

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve();
        });
      });
    });
  };

  await updateStatus(
    "Starting verification...",
  );

  await updateStatus(
    "Initializing CredShield...",
  );

  console.log(
    "Initializing CredShield browser client...",
  );


  // ───────────────────────────────────────────────────────────────────────────
  // NETWORK CONFIGURATION
  // ───────────────────────────────────────────────────────────────────────────

  const config =
    await connectedAPI.getConfiguration();

  console.log(
    "Midnight network configuration:",
    {
      networkId: config.networkId,
      indexerUri: config.indexerUri,
      hasProverServerUri:
        Boolean(config.proverServerUri),
    },
  );

  setNetworkId(
    config.networkId,
  );

  console.log(
    "Midnight.js network ID configured:",
    config.networkId,
  );


  // ───────────────────────────────────────────────────────────────────────────
  // ZK CONFIG PROVIDER
  // ───────────────────────────────────────────────────────────────────────────

  const zkConfigPath =
    `${window.location.origin}/credshield`;

  const zkConfigProvider =
    new FetchZkConfigProvider<any>(
      zkConfigPath,
      fetch.bind(window),
    );


  // ───────────────────────────────────────────────────────────────────────────
  // PROOF PROVIDER
  // ───────────────────────────────────────────────────────────────────────────

  let proofProvider;

  try {

    await updateStatus(
      "Getting proving provider from 1AM Wallet...",
    );

    console.log(
      "Requesting proving provider from 1AM Wallet...",
    );

    const provingProvider =
      await connectedAPI.getProvingProvider(
        zkConfigProvider,
      );

    console.log(
      "1AM Wallet proving provider obtained.",
    );

    await updateStatus(
      "✓ 1AM Wallet proving provider obtained.",
    );

    proofProvider =
      createProofProvider(
        provingProvider,
      );

    console.log(
      "Midnight.js proof provider created.",
    );

    await updateStatus(
      "✓ Midnight.js proving provider ready.",
    );

  } catch (provingProviderErr) {

    console.warn(
      "getProvingProvider not supported by this wallet version. " +
      "Attempting fallback to proverServerUri.",
      provingProviderErr,
    );

    if (!config.proverServerUri) {

      await updateStatus(
        "✗ Unable to get proving provider from 1AM Wallet.",
      );

      throw new Error(
        "1AM Wallet does not provide a proving service and no " +
        "proverServerUri was found in the wallet configuration. " +
        "Please ensure 1AM Wallet is connected to Midnight Preview.",
      );
    }

    console.log(
      "Using HTTP proof server fallback.",
    );

    await updateStatus(
      "✓ Using Midnight proof server fallback.",
    );

    proofProvider =
      httpClientProofProvider(
        config.proverServerUri!,
        zkConfigProvider,
      );
  }


  // ───────────────────────────────────────────────────────────────────────────
  // PRIVATE STATE PROVIDER
  // ───────────────────────────────────────────────────────────────────────────

  const privateStateProvider =
    inMemoryPrivateStateProvider<
      string,
      CredShieldPrivateState
    >();

  privateStateProvider.setContractAddress(
    CONTRACT_ADDRESS,
  );


  // ───────────────────────────────────────────────────────────────────────────
  // WALLET PROVIDER
  // ───────────────────────────────────────────────────────────────────────────

  const shieldedAddresses =
    await connectedAPI.getShieldedAddresses();

  const walletProvider = {

    getCoinPublicKey() {
      return shieldedAddresses
        .shieldedCoinPublicKey;
    },

    getEncryptionPublicKey() {
      return shieldedAddresses
        .shieldedEncryptionPublicKey;
    },


    // ─────────────────────────────────────────────────────────────────────────
    // BALANCE TRANSACTION
    // ─────────────────────────────────────────────────────────────────────────

    async balanceTx(
      tx: UnboundTransaction,
      ttl?: Date,
    ): Promise<FinalizedTransaction> {

      await updateStatus(
        "Preparing transaction...",
      );

      console.log(
        "STEP 1.5: Transaction prepared, serializing for 1AM...",
      );

      const unsealedHex =
        Buffer
          .from(
            tx.serialize(),
          )
          .toString("hex");


      await updateStatus(
        "Waiting for 1AM Wallet approval...",
      );

      console.log(
        "STEP 1.6: Waiting for 1AM Wallet approval...",
      );


      let received;

      try {

        received =
          await connectedAPI
            .balanceUnsealedTransaction(
              unsealedHex,
            );

      } catch (error) {

        await updateStatus(
          "✗ 1AM Wallet approval failed.",
        );

        console.error(
          "1AM Wallet transaction approval failed:",
          error,
        );

        throw error;
      }


      await updateStatus(
        "✓ 1AM Wallet approved the transaction.",
      );

      console.log(
        "STEP 1.7: 1AM Wallet returned an approved and balanced transaction.",
      );


      const finalized =
        Transaction.deserialize<
          SignatureEnabled,
          Proof,
          Binding
        >(
          "signature",
          "proof",
          "binding",
          Uint8Array.from(
            received.tx
              .match(/.{1,2}/g)!
              .map(
                (byte) =>
                  parseInt(
                    byte,
                    16,
                  ),
              ),
          ),
        );


      await updateStatus(
        "✓ Transaction finalized.",
      );

      console.log(
        "STEP 1.8: Finalized transaction deserialized successfully.",
      );


      return finalized;
    },
  };


  // ───────────────────────────────────────────────────────────────────────────
  // MIDNIGHT PROVIDER
  // ───────────────────────────────────────────────────────────────────────────

  const midnightProvider = {

    async submitTx(
      tx: FinalizedTransaction,
    ) {

      await updateStatus(
        "Submitting transaction to Midnight Preview...",
      );

      console.log(
        "STEP 2: Submitting transaction to Midnight Preview via 1AM...",
      );


      const serialized =
        Buffer
          .from(
            tx.serialize(),
          )
          .toString("hex");


      try {

        await connectedAPI.submitTransaction(
          serialized,
        );

      } catch (error) {

        console.error(
          "Transaction submission failed:",
          error,
        );

        await updateStatus(
          "✗ Transaction submission failed.",
        );

        throw error;
      }


      await updateStatus(
        "✓ Transaction submitted. Waiting for public verification...",
      );

      console.log(
        "STEP 2 done: Transaction submitted to Midnight Preview.",
      );


      return tx.identifiers()[0];
    },
  };


  // ───────────────────────────────────────────────────────────────────────────
  // PROVIDERS
  // ───────────────────────────────────────────────────────────────────────────

  const providers = {

    privateStateProvider,

    zkConfigProvider,

    proofProvider,

    publicDataProvider:
      indexerPublicDataProvider(
        config.indexerUri,
        config.indexerWsUri,
      ),

    walletProvider,

    midnightProvider,
  };


  // ───────────────────────────────────────────────────────────────────────────
  // INITIAL PRIVATE STATE
  // ───────────────────────────────────────────────────────────────────────────

  const initialPrivateState:
    CredShieldPrivateState = {

      creditScore: 0n,

      dti: 0n,

      bankBalance: 0n,
    };


  // ───────────────────────────────────────────────────────────────────────────
  // CONNECT TO DEPLOYED CONTRACT
  // ───────────────────────────────────────────────────────────────────────────

  await updateStatus(
    "Connecting to deployed CredShield contract...",
  );

  console.log(
    "Connecting to deployed CredShield contract on Midnight Preview...",
  );


  const deployed =
    await findDeployedContract(
      providers,
      {

        contractAddress:
          CONTRACT_ADDRESS,

        compiledContract:
          compiledContract as any,

        privateStateId:
          PRIVATE_STATE_ID,

        initialPrivateState,
      },
    );


  console.log(
    "Connected to CredShield contract:",
    CONTRACT_ADDRESS,
  );


  await updateStatus(
    "✓ CredShield contract connected.",
  );


  // ───────────────────────────────────────────────────────────────────────────
  // CLIENT METHODS
  // ───────────────────────────────────────────────────────────────────────────

  return {


    // ═══════════════════════════════════════════════════════════════════════════
    // VERIFY CREDITWORTHINESS
    // ═══════════════════════════════════════════════════════════════════════════

    async verifyCreditworthiness(
      creditData: CreditData,
    ) {

      // Store private financial data ONLY in memory.
      await privateStateProvider.set(
        PRIVATE_STATE_ID,
        {

          creditScore:
            creditData.creditScore,

          dti:
            creditData.dti,

          bankBalance:
            creditData.bankBalance,
        },
      );


      await updateStatus(
        "Calling verifyCreditworthiness circuit...",
      );

      console.log(
        "STEP 1: Calling verifyCreditworthiness circuit...",
      );

      console.log(
        "Private inputs stored in memory. " +
        "Values will NOT appear in the public ledger.",
      );


      // ───────────────────────────────────────────────────────────────────────
      // ZK PROOF
      // ───────────────────────────────────────────────────────────────────────

      await updateStatus(
        "Generating private ZK proof...",
      );

      console.log(
        "STEP 1.1: Starting ZK proof generation...",
      );


      let tx;

      try {

        tx =
          await deployed.callTx
            .verifyCreditworthiness();


        /*
         * This is the important frontend requirement:
         * the circuit has now successfully executed from the frontend.
         */
        await updateStatus(
          "✓ verifyCreditworthiness circuit called successfully from frontend.",
        );

        await updateStatus(
          "✓ Private ZK proof generated.",
        );

        console.log(
          "STEP 1.2: ZK proof generated successfully.",
        );

      } catch (error: unknown) {

        console.error(
          "CIRCUIT/PROOF GENERATION FAILED:",
          error,
        );

        await updateStatus(
          "✗ ZK proof generation failed.",
        );

        throw error;
      }


      // ───────────────────────────────────────────────────────────────────────
      // TRANSACTION COMPLETED
      // ───────────────────────────────────────────────────────────────────────

      console.log(
        "CredShield transaction executed and submitted.",
        {
          txId:
            tx.public.txId,

          blockHeight:
            tx.public.blockHeight,

          status:
            tx.public.status,
        },
      );


      return {

        txId:
          tx.public.txHash ??
          tx.public.txId,

        blockHeight:
          tx.public.blockHeight,
      };
    },


    // ═══════════════════════════════════════════════════════════════════════════
    // READ PUBLIC VERIFIED STATE
    // ═══════════════════════════════════════════════════════════════════════════

    async getVerified() {

      const maxAttempts = 40;
const retryDelayMs = 3000;


     await updateStatus(
  "✓ Transaction submitted. Waiting for public verification...",
);

      for (
        let attempt = 1;
        attempt <= maxAttempts;
        attempt++
      ) {

        console.log(
          `STEP 3: Reading public verified state ` +
          `(attempt ${attempt}/${maxAttempts})...`,
        );


        try {

          const state =
            await providers
              .publicDataProvider
              .queryContractState(
                CONTRACT_ADDRESS,
              );


          if (state) {

            const verified =
              CredShield
                .ledger(
                  state.data,
                )
                .verified;


            console.log(
              "Public on-chain verified state:",
              verified,
            );


            if (verified) {

              await updateStatus(
                "✓ Creditworthiness Verified",
              );

              console.log(
                "STEP 3 done: Verification confirmed on Midnight Preview.",
              );

              return true;
            }
          }

        } catch (error) {

          console.warn(
            "Indexer read attempt failed:",
            error,
          );
        }


        if (
          attempt < maxAttempts
        ) {

          await updateStatus(
            `Waiting for public verification... (${attempt}/${maxAttempts})`,
          );


          await new Promise(
            (resolve) =>
              setTimeout(
                resolve,
                retryDelayMs,
              ),
          );
        }
      }


      await updateStatus(
        "Transaction submitted, but public verification is still pending.",
      );

      console.warn(
        "Public verified state did not become true within retry budget.",
      );


      return false;
    },
  };
}
