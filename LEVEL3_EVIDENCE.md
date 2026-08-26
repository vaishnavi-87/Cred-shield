# CredShield Level 3 Evidence

## Automated Tests

CredShield currently has 13 automated tests covering:

- Creditworthiness eligibility
- Invalid borrower conditions
- Eligibility thresholds
- Privacy behavior
- Public verification result

Evidence:

`screenshots/level3/03-privacy-tests.png`

## CI/CD

GitHub Actions automatically:

1. Installs dependencies
2. Installs Compact 0.31.1
3. Compiles the Compact contract
4. Runs the automated tests

Evidence:

`screenshots/level3/02-ci-passing.png`

## Privacy Model

Private:

- Credit score
- DTI
- Bank balance
- Financial records
- Identity

Public:

- Verification result
- Required contract state

## Deployment

Network:

**Midnight Preprod**

Circuit:

`verifyCreditworthiness`

## Product Proposal

See:

`PROPOSAL.md`

## Demo

The final submission includes a one-minute demonstration showing:

1. Wallet connection
2. Private financial inputs
3. ZK proof generation
4. Wallet transaction approval
5. Successful creditworthiness verification
