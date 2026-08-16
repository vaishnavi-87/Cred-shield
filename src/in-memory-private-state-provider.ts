import type {
  ContractAddress,
  SigningKey,
} from "@midnight-ntwrk/midnight-js-protocol/compact-runtime";

import type {
  PrivateStateProvider,
} from "@midnight-ntwrk/midnight-js-types";

export const inMemoryPrivateStateProvider = <
  PSI extends string,
  PS = unknown,
>(): PrivateStateProvider<PSI, PS> => {
  let contractAddress: ContractAddress | null = null;

  const states = new Map<PSI, PS>();
  const signingKeys = new Map<ContractAddress, SigningKey>();

  const requireAddress = () => {
    if (!contractAddress) {
      throw new Error("Contract address has not been configured.");
    }

    return contractAddress;
  };

  return {
    setContractAddress(address: ContractAddress) {
      contractAddress = address;
    },

    set(key: PSI, state: PS) {
      requireAddress();
      states.set(key, state);
      return Promise.resolve();
    },

    get(key: PSI) {
      requireAddress();
      return Promise.resolve(states.get(key) ?? null);
    },

    remove(key: PSI) {
      requireAddress();
      states.delete(key);
      return Promise.resolve();
    },

    clear() {
      requireAddress();
      states.clear();
      return Promise.resolve();
    },

    setSigningKey(
      address: ContractAddress,
      signingKey: SigningKey,
    ) {
      signingKeys.set(address, signingKey);
      return Promise.resolve();
    },

    getSigningKey(address: ContractAddress) {
      return Promise.resolve(signingKeys.get(address) ?? null);
    },

    removeSigningKey(address: ContractAddress) {
      signingKeys.delete(address);
      return Promise.resolve();
    },

    clearSigningKeys() {
      signingKeys.clear();
      return Promise.resolve();
    },

    exportPrivateStates: async () => ({
      format: "midnight-private-state-export",
      encryptedPayload: "{}",
      salt: "credshield",
    }),

    importPrivateStates: async () => ({
      imported: 0,
      skipped: 0,
      overwritten: 0,
    }),

    exportSigningKeys: async () => ({
      format: "midnight-signing-key-export",
      encryptedPayload: "{}",
      salt: "credshield",
    }),

    importSigningKeys: async () => ({
      imported: 0,
      skipped: 0,
      overwritten: 0,
    }),
  };
};
