import { getInscriptionsForAddress } from "../apis/turbo";
import { createWalletStore } from "./common"

export const unisatWallet = createWalletStore();

export const connectUnisat = async () => {
  const addresses = await window.unisat.requestAccounts()
  unisatWallet.addAddresses(addresses)
  const publicKey = await window.unisat.getPublicKey();
  unisatWallet.setPublicKey(publicKey);
  for (const address of addresses) {
    const inscriptions = await getInscriptionsForAddress(address)
    unisatWallet.addInscriptions(inscriptions)
  }
}

export const signPSBT = async (psbt: string) => {
  const resp = await window.unisat.signPsbt(psbt);
  console.log(resp)
  return resp;
}