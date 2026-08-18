# CredShield Product Proposal

## 1. What is the product, and who uses it?

CredShield is a privacy-preserving creditworthiness verification dApp.

The product allows a borrower to prove that they satisfy predefined lending eligibility conditions without publicly revealing sensitive financial information.

### Target Users

- Borrowers who want to prove lending eligibility
- Lenders that need eligibility verification
- Financial applications that should minimize exposure of sensitive borrower data

## 2. Why Midnight specifically?

CredShield requires privacy because the inputs used for creditworthiness verification are sensitive financial information.

The application uses Midnight's privacy model to keep the borrower's financial values private while allowing an observer to verify the resulting eligibility status.

The current implementation uses a Midnight Compact circuit named `verifyCreditworthiness`.

## 3. Data Model

| Data Point | Visibility | Who Can Learn It |
|---|---|---|
| Exact credit score | Private | Borrower / private witness |
| Exact DTI | Private | Borrower / private witness |
| Exact bank balance | Private | Borrower / private witness |
| Financial records | Private | Borrower |
| Identity | Private | Borrower |
| Eligibility result | Public | Blockchain observers |
| Required contract state | Public | Blockchain observers |

## 4. Mainnet Feasibility

CredShield can be extended toward a production deployment by connecting it to real lending applications and replacing demonstration financial inputs with appropriately authorized data sources.

The privacy-preserving verification model can allow lenders to verify eligibility without requiring unnecessary disclosure of the borrower's underlying financial values.

Further production work would include security auditing, production infrastructure, trusted financial-data integration, compliance requirements, and deployment on the appropriate Midnight network.
