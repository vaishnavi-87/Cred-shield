# How to Use CredShield

CredShield lets a borrower prove that they meet predefined creditworthiness
requirements without publicly revealing their exact financial information.

## What You Need

Before using CredShield, you need:

- A supported browser
- 1AM Wallet
- A funded Midnight Preview wallet
- Access to the CredShield application
- Your private creditworthiness information

Your private inputs are:

- Credit score
- Debt-to-income ratio (DTI)
- Bank balance

These values are used as private witness inputs during verification.

## Step-by-Step Guide

### 1. Open CredShield

Open the CredShield application in your browser.

### 2. Connect your wallet

Click the wallet connection option and connect your 1AM Wallet.

Make sure the wallet is connected to the Midnight Preview network.

### 3. Enter your private information

Enter your:

- Credit score
- Debt-to-income ratio
- Bank balance

These values are sensitive and should not be shared publicly.

### 4. Start verification

Click the verification button.

CredShield sends the private inputs to the verification circuit as
private witness data.

### 5. Wait for the proof

The application will show a loading status while the zero-knowledge
verification is being generated and submitted.

Do not close the application or disconnect your wallet while verification
is in progress.

### 6. View the result

If all requirements are satisfied, CredShield displays:

**Creditworthiness Verified**

The public result confirms eligibility without displaying the exact
financial values used to reach that result.

## What Gets Proved (and What Stays Private)

### Public

The following result can be verified on-chain:

- Whether the creditworthiness requirements were satisfied
- The contract's public `verified` state
- The transaction associated with the verification

### Private

The following information remains private:

- Exact credit score
- Exact debt-to-income ratio
- Exact bank balance
- Private witness values

### What CredShield Proves

CredShield checks that:

- Credit score is at least 700
- DTI is at most 40
- Bank balance is at least 1000

The proof demonstrates that the private inputs satisfy these conditions
without requiring the exact values to be publicly disclosed.

## Troubleshooting

### Wallet will not connect

Make sure:

1. 1AM Wallet is installed.
2. The wallet is unlocked.
3. The wallet is connected to the Midnight Preview network.
4. Your browser allows the wallet connection.

If necessary, disconnect and reconnect the wallet.

### Verification fails

Check that:

- Your wallet is connected.
- Your wallet has sufficient funds for the transaction.
- All input values are valid.
- You have not closed or refreshed the application during verification.

Then try the verification again.

### Verification is still pending

The transaction may have been submitted while the public verification
state is still updating.

Wait for the application to finish checking the public state.

### The application shows an error

Read the error message displayed by the application.

If the problem continues, check that the deployed contract and Midnight
Preview network configuration are correct.
