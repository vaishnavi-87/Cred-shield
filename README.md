# Midnight Level 1 — Privacy Counter
Level 1 · **New Moon** submission for the Midnight builder program.
A privacy-aware Counter smart contract built on the Midnight Network using Compact.
The project demonstrates the core Midnight privacy model by separating public ledger state from private witness data and selectively disclosing only the information required by the circuit.

## Project Idea
The Privacy Counter is a simple Midnight smart contract designed to demonstrate how private information can be used inside a zero-knowledge circuit while keeping the original private value hidden.
The contract maintains a public counter on the ledger.
A private `secret` value is provided through a Compact witness. The circuit checks whether the secret is valid and deliberately discloses only the boolean validation result.
The actual secret is not stored as public ledger state.

This provides a simple demonstration of the Midnight pattern:

Private witness
      |
      v
Use private information inside circuit
      |
      v
Selective disclosure
      |
      v
Public ledger state

# Public information
count

# Private information
secret

# Deliberately disclosed information
isValid
The important privacy property is that the private witness can be used inside the circuit without deliberately publishing the secret itself.

## Initial Product Idea

CredShield is a privacy-preserving credit verification engine for DeFi lending that allows users to prove they meet predefined financial requirements without revealing their actual financial information. A user's credit score or bank balance can be provided privately to a Compact circuit, which verifies conditions such as a minimum credit score and selectively discloses only the eligibility result. This demonstrates how Midnight's privacy and zero-knowledge capabilities can enable financial verification while keeping sensitive user data private.

# Contract
The main Compact contract is:
contracts/counter.compact

The Counter contains:
export ledger count: Uint<32>;
witness secret(): Uint<32>;
and an increment circuit that validates the private secret, selectively discloses the validation result, and updates the public counter.

# Screenshots
Evidence for the Level 1 submission is stored in:
screenshots/
The evidence includes:

| Step | Screenshot |
| --- | --- |
| Compact compile (circuits + keys generated) | [`screenshots/01-counter-compilation.png`](screenshots/01-counter-compilation.png) |
| Contract deployed to Preview (address shown) | [`screenshots/06-contract-deployed.png`](screenshots/06-contract-deployed.png) |

```
| #  | Screenshot                       | Evidence                     |
| -- | -------------------------------- | ---------------------------- |
| 01 | `02-tests-passed.png`        | Automated tests              |
| 02 | `03-typescript-check.png`    | TypeScript validation        |
| 03 | `04-docker-running.png`      | Local Midnight services      |
| 04 | `05-wallet-funded.png`       | Wallet funding/balance       |
| 05 | `07-cli-connected.png`       | CLI connection               |
| 06 | `08-git-commit.png`          | Git/commit evidence          |

```

# Deployed Contract
The canonical Level 1 submission deployment is on the Midnight Preview public test network.

| Network                      | Contract address                                                   |
| ---------------------------- | ------------------------------------------------------------------ |
| **Preview (public testnet)** | `0f11691eb93ff25b840ada38e3976c1c23a5e358b7dc08ba7582fd5ce3c9e19e` |
| undeployed (local devnet)    | `1f6822f2bd0455a54226b6b660bbb9630f1847e28c2cabff170630da76dd22f0` |

The Preview deployment is the canonical submission deployment.

The Preview deployment was successfully completed on:

2026-08-14

Deployment state is persisted locally in:
.midnight-state.json

This file is intentionally excluded from Git because it contains wallet secrets.
```
## Quick Start
# Requirements
-Node.js 22+
-Docker
-Docker Compose
-Compact compiler
-Git
```
Install dependencies:
npm install
```
```
# Compile
Compile the Counter contract with:
npm run compile

Successful compilation produces:
Compiling 1 circuits:
  circuit "increment" (k=7, rows=97)

The compiled contract artifacts are generated under:
contracts/managed/counter/

The managed artifacts are included in the repository for Level 1 submission verification.

The generated directory contains artifacts including:
compiler/
contract/
keys/
zkir/
```
Example generated files include:

contracts/managed/counter/compiler/contract-info.json
contracts/managed/counter/contract/index.d.ts
contracts/managed/counter/contract/index.js
contracts/managed/counter/contract/index.js.map
contracts/managed/counter/keys/increment.prover
contracts/managed/counter/keys/increment.verifier
contracts/managed/counter/zkir/increment.bzkir
contracts/managed/counter/zkir/increment.zkir
```
# Automated Tests
The project uses Vitest.

Run:
npm test

The Level 1 test suite contains three tests.

The tests cover:
-Private secret initialization
-Positive secret validation
-Public counter increment logic

Expected result:
Test Files  1 passed
Tests       3 passed
```
# TypeScript Validation
Run:
npx tsc --noEmit

The project passes TypeScript validation without errors.
```
# Local Devnet
The project includes a local Midnight development environment through Docker Compose.

Start the services:
docker compose up -d

Check the services:
docker compose ps

The local environment contains:

| Service        | Port | Purpose                         |
| -------------- | ---- | ------------------------------- |
| `node`         | 9944 | Midnight blockchain node        |
| `indexer`      | 8088 | GraphQL blockchain indexer      |
| `proof-server` | 6300 | Zero-knowledge proof generation |

The proof server is required by the deployment process when using the local proof-server configuration.

Stop the services:
docker compose down
```
# Networks
The project supports three network configurations:

| Network      | Purpose                            |
| ------------ | ---------------------------------- |
| `undeployed` | Local Midnight development network |
| `preview`    | Midnight public Preview testnet    |
| `preprod`    | Midnight public Preprod testnet    |

The active network can be checked using:
npm run network

Switch to Preview:
npm run network preview

The project was successfully switched to:
Active network: preview

# Preview Wallet
The Preview deployment uses a public testnet wallet.
```
The wallet was successfully:
1. Created/configured for Preview.
2. Funded with testnet tNIGHT.
3. Synchronized with the Preview network.
4. Used to generate the required DUST.
5. Used to deploy the Counter contract.
```
The final Preview deployment successfully reported:
✓ Synced with network.
Balance: 5,000,000,000 tNight
DUST tokens ready!

Wallet recovery phrases and seeds are stored only in local state and are not committed to GitHub.
```
# Wallet Security
Public-network wallet recovery phrases and seeds are sensitive credentials.

The following files must never be committed:

.midnight-state.json
.midnight-state.backup.json
.midnight-wallet-state/
.midnight-wallet-state.backup/

The following information must never be committed:

Recovery phrases
Wallet seeds
Private keys
Passwords
.env files
Private credentials

The .gitignore configuration excludes sensitive wallet state from the repository.
```
# Contract Deployment
The Counter contract was deployed to Midnight Preview using:
npm run deploy

The deployment process included:

Wallet setup
      ↓
Preview network synchronization
      ↓
Wallet funding
      ↓
DUST token generation
      ↓
Proof server verification
      ↓
Compact contract deployment
      ↓
Preview contract address

The successful Preview contract address is:
0f11691eb93ff25b840ada38e3976c1c23a5e358b7dc08ba7582fd5ce3c9e19e
```
# Counter CLI
The project contains an interactive Counter CLI.

Run:
npm run cli

The CLI provides functionality for:
1. Increment counter
2. Read current count
3. Check wallet balance
4. Exit

The CLI is designed to restore the wallet, synchronize with the configured Midnight network, and interact with the deployed Counter contract.
```
# Transaction Status

-The project successfully demonstrates:
-Compact Counter contract development
-Public ledger state
-Private witness data
-Selective disclosure
-Zero-knowledge circuit compilation
-Generated managed contract artifacts
-Automated testing
-TypeScript validation
-Wallet setup
-Wallet synchronization
-Testnet funding
-DUST generation
-Preview network deployment
-CLI integration
-Git/GitHub submission
```
During development, an earlier CLI transaction attempt encountered:

Error: expected instance of StateValue

This occurred during Midnight.js transaction state processing.

Therefore, the project does not claim that the earlier CLI increment() transaction was successfully finalized on-chain.

The verified deployment requirement is satisfied by the successful deployment of the Counter contract to the Midnight Preview public test network.
```
# Available Scripts

| Command                   | Description                          |
| ------------------------- | ------------------------------------ |
| `npm run compile`         | Compile the Compact Counter contract |
| `npm run deploy`          | Deploy the compiled Counter contract |
| `npm run cli`             | Start the Counter interaction CLI    |
| `npm run check-balance`   | Check wallet balance                 |
| `npm run network`         | Display the active network           |
| `npm run network preview` | Switch to Preview                    |
| `npm test`                | Run automated tests                  |
| `npx tsc --noEmit`        | Validate TypeScript                  |
| `docker compose up -d`    | Start local development services     |
| `docker compose down`     | Stop local development services      |

```
# Project Structure
```
mn-demo/
├── contracts/
│   ├── counter.compact
│   ├── hello-world.compact
│   └── managed/
│       └── counter/
│           ├── compiler/
│           ├── contract/
│           ├── keys/
│           └── zkir/
│
├── src/
│   ├── cli.ts
│   ├── deploy.ts
│   ├── check-balance.ts
│   ├── network.ts
│   ├── setup.ts
│   ├── wallet-state.ts
│   └── wallet.ts
│
├── tests/
│   └── counter.test.ts
│
├── screenshots/
│   └── Level 1 evidence
│
├── docker-compose.yml
├── package.json
├── package-lock.json
├── tsconfig.json
└── .gitignore
```
```
# Level 1 Submission Checklist
Before submission, verify:

[ ] contracts/counter.compact exists
[ ] contracts/managed/counter/ exists
[ ] managed artifacts are tracked by Git
[ ] npm run compile succeeds
[ ] npm test succeeds
[ ] npx tsc --noEmit succeeds
[ ] Preview deployment address is present in README
[ ] Preview deployment is the canonical deployment
[ ] README does not contain wallet secrets
[ ] .midnight-state.json is not committed
[ ] .midnight-wallet-state/ is not committed
[ ] screenshots/ contains submission evidence
[ ] Git history contains at least 5 meaningful commits
[ ] GitHub repository is pushed
```
