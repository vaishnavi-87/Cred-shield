/**
 * CLI for interacting with mn-demo Counter contract
 */

import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { WebSocket } from 'ws';

import { findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import {
  resolveNetwork,
  getOrCreateWallet,
  formatWalletBackupNotice,
  getDeployment,
} from './network';
import {
  createWallet,
  persistWalletState,
  unshieldedToken,
  type WalletContext,
} from './wallet';
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';

import * as Counter from '../contracts/managed/counter/contract/index.js';

// @ts-expect-error Required for wallet sync
globalThis.WebSocket = WebSocket;

type CounterPrivateState = {
  secret: bigint;
};

const PRIVATE_STATE_ID = 'counterPrivateState';

const { network, config: networkConfig } = resolveNetwork();
const WALLET = getOrCreateWallet(network);
const SEED = WALLET.seed;

{
  const notice = formatWalletBackupNotice(WALLET, network);
  if (notice) console.log(notice);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const zkConfigPath = path.resolve(
  __dirname,
  '..',
  'contracts',
  'managed',
  'counter',
);

const contractPath = path.join(
  zkConfigPath,
  'contract',
  'index.js',
);

if (!fs.existsSync(contractPath)) {
  console.error('\n❌ Contract not compiled! Run: npm run compile\n');
  process.exit(1);
}

const compiledContract = CompiledContract.make<
  Counter.Contract<CounterPrivateState>
>(
  'counter',
  Counter.Contract<CounterPrivateState>,
).pipe(
  CompiledContract.withWitnesses({
    secret: (context) => [
      context.privateState,
      context.privateState.secret,
    ],
  }),
  CompiledContract.withCompiledFileAssets(zkConfigPath),
);

async function createProviders(walletCtx: WalletContext) {
  const privateStatePassword =
    process.env.PRIVATE_STATE_PASSWORD?.trim() ||
    'Local-Devnet-Development-Placeholder-1';

  const walletProvider = {
    getCoinPublicKey: () =>
      walletCtx.shieldedSecretKeys.coinPublicKey,

    getEncryptionPublicKey: () =>
      walletCtx.shieldedSecretKeys.encryptionPublicKey,

    async balanceTx(tx: any, ttl?: Date) {
      const recipe =
        await walletCtx.wallet.balanceUnboundTransaction(
          tx,
          {
            shieldedSecretKeys:
              walletCtx.shieldedSecretKeys,
            dustSecretKey: walletCtx.dustSecretKey,
          },
          {
            ttl:
              ttl ??
              new Date(Date.now() + 30 * 60 * 1000),
          },
        );

      return walletCtx.wallet.finalizeRecipe(recipe);
    },

    submitTx: (tx: any) =>
      walletCtx.wallet.submitTransaction(tx) as any,
  };

  const zkConfigProvider =
    new NodeZkConfigProvider(zkConfigPath);

  const accountId =
    walletCtx.unshieldedKeystore
      .getBech32Address()
      .toString();

  return {
    privateStateProvider:
      levelPrivateStateProvider({
        privateStateStoreName: 'counter-private-state',
        accountId,
        privateStoragePasswordProvider:
          () => privateStatePassword,
      }),

    publicDataProvider:
      indexerPublicDataProvider(
        networkConfig.indexer,
        networkConfig.indexerWS,
      ),

    zkConfigProvider,

    proofProvider:
      httpClientProofProvider(
        networkConfig.proofServer,
        zkConfigProvider,
      ),

    walletProvider,
    midnightProvider: walletProvider,
  };
}

async function main() {
  console.log(
    '\n╔══════════════════════════════════════════════════════════════╗',
  );
  console.log(
    '║                  mn-demo Counter CLI                       ║',
  );
  console.log(
    '╚══════════════════════════════════════════════════════════════╝\n',
  );

  const rl = createInterface({
    input: stdin,
    output: stdout,
  });

  const deployment = getDeployment(network);

  if (!deployment) {
    console.error(
      `No deployment found for ${network}. Run npm run deploy first.`,
    );
    process.exit(1);
  }

  console.log(`Contract: ${deployment.address}`);
  console.log(`Network: ${network}\n`);

  try {
    console.log('Connecting to wallet...');

    const walletCtx = await createWallet({
      network,
      networkConfig,
      seed: SEED,
    });

    const restoredCount =
      Object.values(walletCtx.restored).filter(Boolean).length;

    if (restoredCount > 0) {
      console.log(
        `Restored ${restoredCount}/3 child wallets.`,
      );
    }

    console.log('Syncing with network...');

    const state =
      await walletCtx.wallet.waitForSyncedState();

    await persistWalletState(network, walletCtx);

    console.log('✓ Synced with network.');

    const balance =
      state.unshielded.balances[
        unshieldedToken().raw
      ] ?? 0n;

    console.log(
      `Balance: ${balance.toLocaleString()} tNight\n`,
    );

    console.log('Connecting to Counter contract...');

    const providers =
      await createProviders(walletCtx);

    const deployed: any =
  await findDeployedContract(providers, {
    compiledContract:
      compiledContract as any,
    contractAddress: deployment.address,
    privateStateId: PRIVATE_STATE_ID,
  });
    console.log('✅ Connected!\n');

    let running = true;

    while (running) {
      console.log(
        '─── Menu ───────────────────────────────────────────────────────',
      );
      console.log('  1. Increment counter');
      console.log('  2. Read current count');
      console.log('  3. Check wallet balance');
      console.log('  4. Exit\n');

      const choice =
        await rl.question('Your choice: ');

      switch (choice.trim()) {
        case '1': {
          console.log(
            '\nSubmitting increment transaction...',
          );
          console.log(
            'Generating zero-knowledge proof. Please wait...\n',
          );

          try {
            const tx =
              await deployed.callTx.increment();

            console.log(
              '\n✅ Counter incremented successfully!',
            );

            console.log(
              `Transaction ID: ${tx.public.txId}`,
            );

            console.log(
              `Block height: ${tx.public.blockHeight}\n`,
            );
          } catch (error) {
  console.error('\n❌ Increment failed:');
  console.error(error);
  console.error('\nCause:', (error as any)?.cause);
  console.error('\nStack:', (error as any)?.stack);
}
          break;
        }

        case '2': {
          console.log(
            '\nReading counter from blockchain...',
          );

          try {
            const contractState =
              await providers.publicDataProvider
                .queryContractState(
                  deployment.address,
                );

            if (contractState) {
              const ledgerState =
                Counter.ledger(contractState.data);

              console.log(
                `\n📊 Current count: ${ledgerState.count}\n`,
              );
            } else {
              console.log(
                '\n📊 Contract state not found.\n',
              );
            }
          } catch (error) {
            console.error(
              '\n❌ Failed:',
              error instanceof Error
                ? error.message
                : error,
            );
          }

          break;
        }

        case '3': {
          const currentState =
            await walletCtx.wallet.waitForSyncedState();

          const currentBalance =
            currentState.unshielded.balances[
              unshieldedToken().raw
            ] ?? 0n;

          const dustBalance =
            currentState.dust.balance(new Date());

          console.log(
            `\ntNight: ${currentBalance.toLocaleString()}`,
          );

          console.log(
            `DUST: ${dustBalance.toLocaleString()}\n`,
          );

          break;
        }

        case '4':
          running = false;
          break;

        default:
          console.log(
            '\nPlease choose 1, 2, 3, or 4.\n',
          );
      }
    }

    rl.close();
    console.log('\nGoodbye! 👋\n');
  } catch (error) {
    console.error(
      '\n❌ Error:',
      error instanceof Error
        ? error.message
        : error,
    );

    rl.close();
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
