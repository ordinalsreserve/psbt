import { writable, type Writable } from "svelte/store";
import type { Inscription, WalletStore } from "../interfaces";

const initialState: WalletStore = {
  addresses: [],
  inscriptions: [],
  publicKey: null
}

export const createWalletStore = () => {
  const { subscribe, set, update }: Writable<WalletStore> = writable(initialState);

  const addAddress = (address: string): void => {
    update((state) => {
      return { ...state, addresses: [...state.addresses, address] };
    });
  };

  const addAddresses = (addresses: string[]): void => {
    update((state) => {
      return { ...state, addresses: [...state.addresses, ...addresses] };
    });
  };

  const addInscription = (inscription: Inscription): void => {
    update((state) => {
      return { ...state, inscriptions: [...state.inscriptions, inscription] };
    });
  };

  const addInscriptions = (inscriptions: Inscription[]): void => {
    update((state) => {
      return { ...state, inscriptions: [...state.inscriptions, ...inscriptions] };
    });
  };

  const setPublicKey = (publicKey: string): void => {
    update((state) => {
      return { ...state, publicKey }
    })
  }

  const reset = (): void => {
    set(initialState);
  };

  return {
    subscribe,
    addAddress,
    addAddresses,
    setPublicKey,
    addInscription,
    addInscriptions,
    reset,
  };
};