# CredShield

![CredShield CI](actions/workflows/ci.yml/badge.svg)

**Level 4 · Midnight Builder Challenge · Rise In**

CredShield is a privacy-preserving credit-scoring engine. It lets a borrower prove on-chain that they satisfy lending eligibility conditions without revealing their credit score, debt-to-income ratio (DTI), bank balance, financial records, or identity. The proof is generated locally from the
borrower's private inputs, approved and submitted by the 1AM Wallet, and
verified against a contract deployed on Midnight Preprod — only the public
eligibility result is ever written to the ledger.

## Project

| Field | Value |
|---|---|
| **Project** | CredShield — Private Creditworthiness Verification |
| **Wallet** | 1AM Wallet |
| **Network** | Midnight Preprod |
| **Circuit** | `verifyCreditworthiness` |
| **Contract** | `c5018b936e1223442e1bc25631155045bb3ab05decb961f00fbbc4a4fa996953` |


## Links (Demo, Video)

- **Live Demo:** Level 4 deployment pending
- **Demo Video:** https://drive.google.com/file/d/1VfiSE8tjYONT_v9OloXZGoKp1uOKEZCK/view?usp=sharing

## Contract Address

| Network | Address |
|---|---|
| Midnight Preprod | `c5018b936e1223442e1bc25631155045bb3ab05decb961f00fbbc4a4fa996953` |

The contract is deployed on the **Midnight Preprod** test network. It is
reachable through the public Preprod indexer:

https://indexer.preview.midnight.network



## What This Does

CredShield allows a borrower to enter their private financial data
(credit score, DTI, bank balance) into a local browser form. Those values are
used only as private witness inputs to a Midnight Compact circuit. The
circuit `verifyCreditworthiness` checks the eligibility conditions:

- credit score ≥ 700
- DTI ≤ 40
- bank balance ≥ 1,000

If all conditions hold, the circuit discloses only the boolean
`verified = true` to the public ledger. The raw financial values are never
written to the ledger and never leave the browser as public data.


## Privacy Model

CredShield uses zero-knowledge verification so that an observer can
verify the eligibility result without learning the user's underlying
financial information.

### What an observer can learn

An observer can see:

- That a verification transaction was submitted.
- That the verification was successfully completed.
- The public eligibility result.
- Public blockchain transaction information such as transaction
  metadata and network information.

### What an observer cannot learn

An observer cannot learn:

- The user's credit score.
- The user's debt-to-income ratio (DTI).
- The user's bank balance.
- The private financial values used as inputs to the proof.
- The underlying private witness data used by the circuit.

### Privacy Model

| Information | Observer can see? |
|---|---|
| Verification transaction | Yes |
| Eligibility result | Yes |
| Credit Score | No |
| Debt-to-Income Ratio | No |
| Bank Balance | No |
| Private witness values | No |

The key privacy property is that the system reveals **whether the
eligibility conditions are satisfied, not the financial values used to
satisfy them**.

### Privacy Flow

User's Private Data
        ↓
Credit Score ─────┐
DTI ──────────────┼──→ Zero-Knowledge Proof
Bank Balance ─────┘
                         ↓
                  Eligibility Result
                         ↓
                 Publicly Verifiable

Private financial values remain hidden.
Only the verification result is exposed.

### Private (never disclosed):
- exact credit score
- exact DTI
- exact bank balance
- financial records
- identity

### Public (only result disclosed):
- the verification/eligibility result (`verified = true` or `false`)
- the contract transaction and contract state required to verify the result

The privacy model is enforced by the ZK circuit itself: private financial
values are consumed as witnesses inside the proof and are never part of the
disclosed public state. The frontend never displays or transmits the exact
values after verification.

### Privacy Claim

> "An observer can verify that the borrower satisfied the eligibility
> conditions, but cannot see the exact credit score, DTI, bank balance,
> financial records, or identity."


## Tech Stack

- Midnight Network (Preprod)
- Compact (Midnight's smart-contract language)
- Midnight.js (`midnight-js-*` packages, v4.1.x)
- 1AM Wallet (Midnight DApp Connector API v4)
- React 19
- TypeScript
- Vite


## Prerequisites

- Node.js >= 22
- **1AM Wallet** browser extension installed and unlocked
  - Install from: https://1am.xyz
  - Configure the wallet for **Midnight Preprod**
- Midnight Preprod access (the deployed contract is already live)


## Run Locally

bash
# 1. Install dependencies
npm install

# 2. Start the local proof server (optional — 1AM can provide proving)
npm run proof-server:start

# 3. Compile the CredShield contract (also syncs ZK files to public/credshield)
npm run compile

# 4. Type-check, test, and build
npx tsc --noEmit
npm test
npm run build

# 5. Start the frontend
npm run dev


Then open http://localhost:5173, click **Connect 1AM Wallet**,
authorize the connection in the 1AM extension (Midnight Preprod),
enter private test values, and press **Prove My Creditworthiness**.

The 1AM Wallet will prompt for transaction approval. After approval,
the UI shows **✓ Creditworthiness Verified** once the public contract
state reports `verified = true`.

## Usage Guide

See [docs/USAGE.md](docs/USAGE.md) for the complete CredShield
user flow, privacy behavior, verification steps, and troubleshooting guide.
## ZK Configuration Files

The circuit proving/verifying keys and ZKIR are served from the Vite public
directory so the browser can load them:


public/credshield/keys/verifyCreditworthiness.prover
public/credshield/keys/verifyCreditworthiness.verifier
public/credshield/zkir/verifyCreditworthiness.bzkir
public/credshield/zkir/verifyCreditworthiness.zkir

`npm run compile` regenerates the artifacts under
`contracts/managed/credshield/` and syncs them into `public/credshield/`.
They are copied into the production bundle and served at
`/credshield/keys/...` and `/credshield/zkir/...`.

## Project Structure

```
mn-demo/
├── contracts/
│   ├── credshield.compact          # CredShield Compact contract
│   └── managed/credshield/         # Compiled artifacts (contract, keys, zkir)
├── public/credshield/              # ZK config served to the browser
├── src/
│   ├── App.tsx                     # CredShield UI + main flow
│   ├── globals.ts                  # Buffer/process polyfills (loaded first)
│   ├── credshieldClient.ts         # Midnight.js circuit client
│   ├── in-memory-private-state-provider.ts
│   ├── hooks/useMidnight.ts        # 1AM wallet connect/disconnect
│   ├── components/WalletConnect.tsx
│   ├── components/CircuitCall.tsx
│   ├── deploy.ts                   # Preprod deployment script
│   └── network.ts                  # Network configuration
├── tests/
│   └── credshield.test.ts          # Eligibility logic unit tests
├── docker-compose.yml              # Proof server (and local devnet)
└── vite.config.ts

```
## Wallet Integration — 1AM Wallet

CredShield uses the **1AM Wallet** via the standard Midnight DApp Connector API v4.

### Connection flow:
1. `useMidnight.ts` detects the 1AM Wallet at `window.midnight['1am']`
2. Calls `wallet.connect('preview')` → triggers 1AM authorization popup
3. `hintUsage([...])` pre-declares which methods will be used
4. Retrieves the connected Midnight Preprod address
5. Stores `ConnectedAPI` for use in the circuit call

### Transaction flow:
1. User enters private financial values (password-masked inputs)
2. `credshieldClient.ts` stores them in the in-memory private state provider
3. `deployed.callTx.verifyCreditworthiness()` calls the real circuit
4. The proof is generated using `getProvingProvider` from 1AM
5. `balanceUnsealedTransaction()` is called on the 1AM ConnectedAPI → triggers 1AM approval popup
6. `submitTransaction()` submits to Midnight Preprod
7. `getVerified()` polls the indexer until `verified = true`


## Level 2 Evidence — Screenshots to Capture

For submission, capture the following screenshots:

1. **1AM Wallet connection/authorization** — The 1AM popup requesting authorization for `localhost:5173`
2. **Connected wallet + Midnight address** — The UI showing "1AM Wallet Connected" with the shortened Midnight Preprod address
3. **Private input screen** — The three password-masked input fields (credit score, DTI, bank balance)
4. **Proof generation spinner** — The "Generating ZK proof…" spinner while the proof runs
5. **1AM transaction approval** — The 1AM wallet approval/signing dialog for the `verifyCreditworthiness` transaction
6. **Successful verification** — The "✓ Creditworthiness Verified" success card in the UI
7. **Browser console** — Console showing:
   - `STEP 1: Calling verifyCreditworthiness circuit...`
   - `STEP 1.6: Waiting for 1AM Wallet approval...`
   - `STEP 1.7: 1AM Wallet returned an approved and balanced transaction.`
   - `STEP 2: Submitting transaction to Midnight Preprod via 1AM...`
   - `STEP 3: Reading public verified state from indexer...`
   - `STEP 3 done: Verification confirmed on Midnight Preprod.`
8. **Privacy section** — The "What remains private?" grid showing PRIVATE / PUBLIC RESULT labels
9. **Contract address** — The README or browser showing the deployed contract address
10. **Production build** — Terminal output of `npm run build` completing successfully


## Manual Demo Steps

1. Install the 1AM Wallet browser extension from https://1am.xyz
2. Configure it for **Midnight Preprod** and ensure you have tNIGHT and DUST
3. Open http://localhost:5173 (or the Vercel deployment URL)
4. Click **Connect 1AM Wallet**
5. Authorize CredShield in the 1AM popup
6. Observe the connected address in the UI
7. Enter test values: Credit Score = `750`, DTI = `30`, Bank Balance = `5000`
8. Click **Prove My Creditworthiness**
9. When 1AM shows its approval dialog, approve the transaction
10. Wait for the indexer to confirm (up to ~30 seconds)
11. Observe **✓ Creditworthiness Verified** in the UI

Note: Steps 8–11 require the 1AM Wallet to have DUST tokens for proof fees.


## Testing & CI/CD

## Live Demo & Product Profile

- **Live Demo:** https://cred-shield.vercel.app
- **Product X:** https://x.com/CredShielddlxo

### Tests

CredShield includes automated tests covering:

- Creditworthiness eligibility logic
- Rejection of invalid credit conditions
- Eligibility threshold behavior
- Public verification state transition
- Privacy behavior showing that private financial values are not included in the public result

Run the complete test suite with:

```bash
npm test


## Available Scripts

| Command | Description |
|---|---|
| `npm run compile` | Compile the Compact contract, sync ZK files |
| `npm run build` | Type-check and produce the production bundle |
| `npm run deploy` | Deploy the compiled contract |
| `npm run network` | Display the active network |
| `npm test` | Run automated tests |
| `npx tsc --noEmit` | Validate TypeScript |
| `npm run proof-server:start` | Start the local proof server (Docker) |
| `npm run proof-server:stop` | Stop the local proof server |
| `npm run dev` | Start the Vite dev server |


## Vercel Deployment

The project is ready to deploy to Vercel:

- **Build command:** `npm run build`
- **Output directory:** `dist`
- **ZK files** are included in the production bundle at `/credshield/keys/` and `/credshield/zkir/`

> **Note:** The production deployment requires visitors to have the 1AM Wallet
> extension installed. Vercel's build does not include a proof server — proving
> is delegated to 1AM Wallet's `getProvingProvider` (in-browser WASM or Proof Station).



## Security Notes

- Wallet recovery phrases, seeds, and `.midnight-state.json` are never
  committed to Git.
- The exact credit score, DTI, and bank balance are private witness inputs
  only; they are **never logged to the console**, never displayed publicly,
  and never written to the ledger.
- The deployed contract is on Midnight Preprod. The Preprod network is not
  used because it is significantly slower.
- Private financial values are held in an in-memory provider that exists
  only for the lifetime of a single verification call.

## Level 4 MVP Status

- [x] Level 4 MVP branch created
- [x] CredShield privacy model documented
- [x] Compact verification circuit compiled
- [x] 1AM Wallet integration retained
- [x] Frontend MVP layout integrated
- [x] Usage guide added
- [x] TypeScript production build passes
- [x] 13 automated tests passing
- [x] GitHub Actions CI configured
- [x] Midnight Preprod contract deployed
- [ ] Final Level 4 demo evidence
- [ ] Final Level 4 demo video
- [ ] Push Level 4 branch to GitHub
