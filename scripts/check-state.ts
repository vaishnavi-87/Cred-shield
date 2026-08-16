import { ContractState } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import * as CredShield from '../contracts/managed/credshield/contract/index.js';

const ADDRESS = '4e9bdd092a84c65e48b7b4a87f4c0a7b96ac5dcdc0b773a170ff3d11acc6db9f';

async function main() {
  const res = await fetch('https://indexer.preview.midnight.network/api/v4/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: `query { contract(address: "${ADDRESS}") { state } }` }),
  });
  const json = await res.json();
  const hex = json.data.contract.state as string;
  const bytes = Uint8Array.from(hex.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)));
  const state = ContractState.deserialize(bytes);
  const ledger = CredShield.ledger((state as any).data);
  console.log('verified =', ledger.verified);
}

main().catch((e) => { console.error(e); process.exit(1); });
