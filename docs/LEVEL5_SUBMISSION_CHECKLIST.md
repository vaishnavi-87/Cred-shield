# CredShield Level 5 Submission Checklist

## Core Requirements

- [x] Public GitHub repository
- [x] Level 5 branch: `level5-users-feedback`
- [x] Working CredShield MVP
- [x] Midnight Preprod deployment
- [x] 50 Preprod wallet addresses recorded
- [x] User feedback collected and documented
- [x] Updated project documentation
- [x] CI/CD workflow enabled
- [x] User registry validation included in CI
- [x] Demo video prepared
- [x] Product X profile linked
- [x] Meaningful Level 5 development commits

## User Validation

- 50 wallet addresses recorded
- 52 feedback responses collected
- 52/52 wallet connections successful
- 52/52 ZK proof generation successful
- 51/52 verification transactions successful

## On-Chain Evidence

- Network: Midnight Preprod
- Contract: `c5018b936e1223442e1bc25631155045bb3ab05decb961f00fbbc4a4fa996953`
- Verified contract call: `verifyCreditworthiness`
- Transaction: `7668ae52ab575088a2ba93a8b3a737e79432a5be112e81bbcec2cf79644bcf31`
- Block: `2446816`

## Evidence Note

The recorded wallet addresses are listed in `USERS.md`. The available
Indexer query confirms CredShield verification activity on Preprod,
but the indexed transaction does not expose a direct sender wallet
field. Individual wallet-to-transaction attribution is therefore not
claimed without additional evidence.
