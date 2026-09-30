# CredShield Preprod Evidence

## Network

- Network: Midnight Preprod
- Contract Address: `c5018b936e1223442e1bc25631155045bb3ab05decb961f00fbbc4a4fa996953`
- Circuit: `verifyCreditworthiness`

## Verified On-Chain Transaction

- Transaction Hash: `7668ae52ab575088a2ba93a8b3a737e79432a5be112e81bbcec2cf79644bcf31`
- Block Height: `2446816`
- Transaction Type: `ContractCall`
- Entry Point: `verifyCreditworthiness`

## User Validation

- Preprod wallet addresses recorded: **50**
- Feedback responses collected: **52**
- Wallet connection successful: **52/52**
- ZK proof generation successful: **52/52**
- Verification transaction successful: **51/52**

## Privacy Validation

CredShield is designed to verify creditworthiness without publicly exposing the user's exact:

- Credit score
- Debt-to-income ratio
- Bank balance
- Financial information

The public result is the eligibility/verification result.

## Evidence Limitation

The 50 collected Preprod wallet addresses are recorded in `USERS.md`.

The available Midnight Indexer transaction query confirms CredShield verification activity on Preprod. However, the indexed verification transaction does not expose a direct sender wallet address through the fields currently queried.

Therefore, this document does **not** claim that the individual 50 wallet addresses have each been independently linked to a specific verification transaction.

