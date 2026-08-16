# CredShield

**Level 2 · Midnight Builder Challenge · Rise In**

CredShield is a privacy-preserving credit-scoring engine. It lets a borrower
prove on-chain that they satisfy lending eligibility conditions without
revealing their credit score, debt-to-income ratio (DTI), bank balance,
financial records, or identity. The proof is generated locally from the
borrower's private inputs, approved and submitted by the 1AM Wallet, and
verified against a contract deployed on Midnight Preview — only the public
eligibility result is ever written to the ledger.

---

## Project

| Field | Value |
|---|---|
| **Project** | CredShield — Private Creditworthiness Verification |
| **Wallet** | 1AM Wallet |
| **Network** | Midnight Preview |
| **Circuit** | `verifyCreditworthiness` |
| **Contract** | `4e9bdd092a84c65e48b7b4a87f4c0a7b96ac5dcdc0b773a170ff3d11acc6db9f` |

---

## Contract Address

| Network | Address |
|---|---|
| Midnight Preview | `4e9bdd092a84c65e48b7b4a87f4c0a7b96ac5dcdc0b773a170ff3d11acc6db9f` |

The contract is deployed on the **Midnight Preview** test network. It is
reachable through the public Preview indexer:

```
https://indexer.preview.midnight.network
```

---

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

---

## Privacy Model

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

---

## Tech Stack

- Midnight Network (Preview)
- Compact (Midnight's smart-contract language)
- Midnight.js (`midnight-js-*` packages, v4.1.x)
- 1AM Wallet (Midnight DApp Connector API v4)
- React 19
- TypeScript
- Vite

---

## Prerequisites

- Node.js >= 22
- **1AM Wallet** browser extension installed and unlocked
  - Install from: https://1am.xyz
  - Configure the wallet for **Midnight Preview**
- Midnight Preview access (the deployed contract is already live)

---

## Run Locally

```bash
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
```

Then open http://localhost:5173, click **Connect 1AM Wallet**,
authorize the connection in the 1AM extension (Midnight Preview),
enter private test values, and press **Prove My Creditworthiness**.

The 1AM Wallet will prompt for transaction approval. After approval,
the UI shows **✓ Creditworthiness Verified** once the public contract
state reports `verified = true`.

---

## ZK Configuration Files

The circuit proving/verifying keys and ZKIR are served from the Vite public
directory so the browser can load them:

```
public/credshield/keys/verifyCreditworthiness.prover
public/credshield/keys/verifyCreditworthiness.verifier
public/credshield/zkir/verifyCreditworthiness.bzkir
public/credshield/zkir/verifyCreditworthiness.zkir
```

`npm run compile` regenerates the artifacts under
`contracts/managed/credshield/` and syncs them into `public/credshield/`.
They are copied into the production bundle and served at
`/credshield/keys/...` and `/credshield/zkir/...`.

---

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
│   ├── deploy.ts                   # Preview deployment script
│   └── network.ts                  # Network configuration
├── tests/
│   └── credshield.test.ts          # Eligibility logic unit tests
├── docker-compose.yml              # Proof server (and local devnet)
└── vite.config.ts
```

---

## Wallet Integration — 1AM Wallet

CredShield uses the **1AM Wallet** via the standard Midnight DApp Connector API v4.

### Connection flow:
1. `useMidnight.ts` detects the 1AM Wallet at `window.midnight['1am']`
2. Calls `wallet.connect('preview')` → triggers 1AM authorization popup
3. `hintUsage([...])` pre-declares which methods will be used
4. Retrieves the connected Midnight Preview address
5. Stores `ConnectedAPI` for use in the circuit call

### Transaction flow:
1. User enters private financial values (password-masked inputs)
2. `credshieldClient.ts` stores them in the in-memory private state provider
3. `deployed.callTx.verifyCreditworthiness()` calls the real circuit
4. The proof is generated using `getProvingProvider` from 1AM
5. `balanceUnsealedTransaction()` is called on the 1AM ConnectedAPI → triggers 1AM approval popup
6. `submitTransaction()` submits to Midnight Preview
7. `getVerified()` polls the indexer until `verified = true`

---

## Level 2 Evidence — Screenshots to Capture

For submission, capture the following screenshots:

1. **1AM Wallet connection/authorization** — The 1AM popup requesting authorization for `localhost:5173`
2. **Connected wallet + Midnight address** — The UI showing "1AM Wallet Connected" with the shortened Midnight Preview address
3. **Private input screen** — The three password-masked input fields (credit score, DTI, bank balance)
4. **Proof generation spinner** — The "Generating ZK proof…" spinner while the proof runs
5. **1AM transaction approval** — The 1AM wallet approval/signing dialog for the `verifyCreditworthiness` transaction
6. **Successful verification** — The "✓ Creditworthiness Verified" success card in the UI
7. **Browser console** — Console showing:
   - `STEP 1: Calling verifyCreditworthiness circuit...`
   - `STEP 1.6: Waiting for 1AM Wallet approval...`
   - `STEP 1.7: 1AM Wallet returned an approved and balanced transaction.`
   - `STEP 2: Submitting transaction to Midnight Preview via 1AM...`
   - `STEP 3: Reading public verified state from indexer...`
   - `STEP 3 done: Verification confirmed on Midnight Preview.`
8. **Privacy section** — The "What remains private?" grid showing PRIVATE / PUBLIC RESULT labels
9. **Contract address** — The README or browser showing the deployed contract address
10. **Production build** — Terminal output of `npm run build` completing successfully

---

## Manual Demo Steps

1. Install the 1AM Wallet browser extension from https://1am.xyz
2. Configure it for **Midnight Preview** and ensure you have tNIGHT and DUST
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

---

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

---

## Vercel Deployment

The project is ready to deploy to Vercel:

- **Build command:** `npm run build`
- **Output directory:** `dist`
- **ZK files** are included in the production bundle at `/credshield/keys/` and `/credshield/zkir/`

> **Note:** The production deployment requires visitors to have the 1AM Wallet
> extension installed. Vercel's build does not include a proof server — proving
> is delegated to 1AM Wallet's `getProvingProvider` (in-browser WASM or Proof Station).

---

## Security Notes

- Wallet recovery phrases, seeds, and `.midnight-state.json` are never
  committed to Git.
- The exact credit score, DTI, and bank balance are private witness inputs
  only; they are **never logged to the console**, never displayed publicly,
  and never written to the ledger.
- The deployed contract is on Midnight Preview. The Preprod network is not
  used because it is significantly slower.
- Private financial values are held in an in-memory provider that exists
  only for the lifetime of a single verification call.
