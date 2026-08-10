Midnight Level 1 – Privacy Counter

A Level 1 Midnight Network smart contract demonstrating public ledger state, private witness data, and selective disclosure using Compact.

Project Overview

This project implements a privacy-aware counter on the Midnight Network.

The counter value is stored as public ledger state, while a secret value is supplied privately through a Compact witness. The contract checks the secret and deliberately discloses only whether the secret is valid, without exposing the secret itself.

Level 1 Objectives

This project demonstrates:

Public ledger state
Private witness data
Selective disclosure using disclose()
Compact smart contract development
Zero-knowledge circuit generation
Local Midnight development network
Wallet setup and synchronization
Contract compilation
Contract deployment
Automated testing
TypeScript validation
CLI interaction with the deployed contract
Git and GitHub project submission
Privacy Counter

The main Level 1 contract is:

contracts/counter.compact
Public Ledger State
export ledger count: Uint<32>;

The count value is stored as public ledger state.

Private Witness
witness secret(): Uint<32>;

The secret is supplied privately through a witness and is not stored directly on the public ledger.

Selective Disclosure
const isValid = privateSecret > 0;
disclose(isValid);

The contract checks whether the private secret is greater than zero.

Only the boolean validation result is deliberately disclosed. The actual secret remains private.

Counter Update
count = count + 1 as Uint<32>;

The circuit updates the public counter.

Privacy Model
              PRIVATE
                 │
                 ▼
          secret() witness
                 │
                 ▼
       Check secret > 0
                 │
                 ▼
        disclose(isValid)
                 │
                 ▼
     Only validation result
          is disclosed
                 │
                 ▼
              PUBLIC
                 │
                 ▼
        count = count + 1
Public Information
count
Private Information
secret
Deliberately Disclosed Information
isValid

This demonstrates the basic Midnight privacy model where private information can be used inside a circuit while only a selected result is disclosed.

Technologies Used
Midnight Network
Compact
Compact Standard Library
Compact Runtime
Midnight.js
Zero-Knowledge Proofs
TypeScript
Vitest
Docker
Docker Compose
Git
GitHub
Project Structure
mn-demo/
├── contracts/
│   ├── counter.compact
│   └── hello-world.compact
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
│   └── Level 1 project evidence
│
├── docker-compose.yml
├── package.json
├── package-lock.json
├── tsconfig.json
└── .gitignore

Generated contract artifacts are created inside:

contracts/managed/counter/

These generated artifacts are ignored by Git.

Requirements
Node.js 22+
Docker with Docker Compose
Compact compiler
Git
Installation

Install the project dependencies:

npm install
Local Midnight Development Network

The project uses a local Midnight development network through Docker Compose.

Start the services:

docker compose up -d

Check the running containers:

docker ps

The local environment contains:

Service	Port	Purpose
Midnight Node	9944	Local blockchain node
Indexer	8088	Blockchain data and indexing
Proof Server	6300	Zero-knowledge proof generation

The local network was successfully started with all required services running.

To stop the local network:

docker compose down
Compile the Counter Contract

Compile the Compact contract:

npm run compile

Successful compilation produces:

Compiling 1 circuits:
circuit "increment" (k=7, rows=91)

The generated contract is stored under:

contracts/managed/counter/

The generated artifacts include the contract interface, circuit information, prover/verifier keys, and ZK circuit artifacts.

Automated Tests

The project uses Vitest for testing.

Run:

npm test

Current test result:

Test Files  1 passed
Tests       3 passed

The tests cover:

Private secret initialization
Positive secret validation
Public counter increment logic
TypeScript Validation

Run:

npx tsc --noEmit

The project passes TypeScript validation without errors.

Wallet Setup

Check the local wallet balance:

npm run check-balance

The local wallet successfully synchronized with the Midnight development network and was funded with tNight and DUST.

The wallet was ready for contract deployment and transaction processing.

Contract Deployment

After starting the local network and compiling the contract, deploy the Counter contract:

npm run deploy

The contract was successfully deployed to the local undeployed network.

Deployed Contract Address
363d721dcace17e12999b7407fc6e9145b7685267699f8512ae59d684a8c6d70

Deployment information is stored locally in:

.midnight-state.json

This file is ignored by Git and is not included in the repository.

Counter CLI

Start the interactive Counter CLI:

npm run cli

The CLI provides:

1. Increment counter
2. Read current count
3. Check wallet balance
4. Exit

The CLI successfully:

Restores the wallet
Synchronizes with the local network
Displays the wallet balance
Connects to the deployed Counter contract
Provides the Counter interaction menu
Project Screenshots

The screenshots/ directory contains evidence collected during the Level 1 implementation.

The screenshots document the major development stages, including:

Counter contract compilation
Automated tests
TypeScript validation
Docker services
Wallet balance
Contract deployment
CLI connection
Git commit and GitHub submission
Transaction Status

The project successfully demonstrates:

Compact Counter contract creation
Public ledger state
Private witness
Selective disclosure
Circuit compilation
ZK circuit artifact generation
Automated tests
TypeScript validation
Local Midnight development network
Wallet synchronization
Wallet funding
Contract deployment
CLI connection
Git commit
GitHub push

During the final CLI transaction test, the increment() transaction encountered the following Midnight.js runtime error:

Error: expected instance of StateValue

The error occurs during Midnight.js transaction state processing.

Therefore, this project does not claim that the on-chain increment() transaction was successfully completed.

The project demonstrates the Level 1 contract structure, privacy model, compilation, testing, local deployment, and CLI integration.

Runtime Dependency Alignment

The relevant Midnight runtime dependency was aligned to:

@midnight-ntwrk/onchain-runtime-v3 = 3.0.0

The dependency tree was checked to ensure that the relevant Midnight packages use the same runtime version.

Level 1 Completion Summary
Level 1 Requirement	Status
Compact Counter contract	Complete
Public ledger state	Complete
Private witness	Complete
Selective disclosure	Complete
Zero-knowledge circuit	Compiled
Contract testing	Complete — 3/3 tests passed
TypeScript validation	Passed
Local Midnight network	Complete
Wallet synchronization	Complete
Wallet funding	Complete
Contract deployment	Complete
CLI connection	Complete
Screenshots/evidence	Complete
Git commit	Complete
GitHub push	Complete
Successful on-chain increment	Runtime issue
Security Note

The local development environment uses a predefined development wallet/seed to provide funds on the local devnet.

This setup is intended for local development and testing only.

Do not use development seeds or private keys on public testnets, mainnet, or any environment containing real value.

Never commit:

Wallet recovery phrases
Private keys
Wallet seeds
Passwords
.env files
Private state
Other sensitive credentials
GitHub Repository

https://github.com/vaishnavi-87/midnight-level1-counter

Author

Vaishnavi Raut

Blockchain Technology Student
Pune, Maharashtra