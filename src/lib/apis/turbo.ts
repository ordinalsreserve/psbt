import type { AddressTxsUtxo } from "@mempool/mempool.js/lib/interfaces/bitcoin/addresses";
import type { Inscription } from "../interfaces";
import { decodeOutpoint } from "../utils";

const BASE_URL = 'https://turbo.ordinalswallet.com';
const ORDINALS_RESERVE_BASE_URL = 'https://ordinalsreserve.com';

export const getUTXO = async (id: string) => {
  if (!id) {
    throw new Error('Inscription ID required')
  }
  const resp = await fetch(`${BASE_URL}/inscription/${id}/outpoint`);
  if (resp.status === 200) {
    const data = await resp.json();
    if (data.inscription.outpoint) {
      const { txid, index } = decodeOutpoint(data.inscription.outpoint);
      return { txid, index, value: data.sats };
    }
  }
  throw new Error('UTXO not found')
}

export const getInscription = async (id: string) => {
  const resp = await fetch(`${BASE_URL}/inscription/${id}`);
  if (resp.status === 200) {
    return await resp.json();
  }
  return null;
}

export const getInscriptionsForAddress = async (address: string) => {
  const resp = await fetch(`${BASE_URL}/wallet/${address}/inscriptions`);
  if (resp.status === 200) {
    const inscriptions = (await resp.json()).map((i: Inscription) => {
      const preview = i.content_type.includes('image') ?
        `${BASE_URL}/inscription/content/${i.id}` : `${ORDINALS_RESERVE_BASE_URL}/preview/${i.id}`
        return {...i, preview, owner: address}
      });
      console.log(inscriptions)
    return inscriptions;
  }
  return [];
}

export const doesUtxoContainInscription = async (
  inscriptionId: string,
  utxo: AddressTxsUtxo
): Promise<boolean> => {
  // If it's confirmed, we check the outpoint of the inscription utxo
  if (utxo.status.confirmed) {
    try {
      const inscriptionUTXO = await getUTXO(inscriptionId);
      return inscriptionUTXO.txid === utxo.txid && inscriptionUTXO.index === utxo.vout;
    } catch (err) {
      return true; // if error, we pretend that the utxo contains an inscription for safety
    }
  }

  throw new Error('UTXO not confirmed');
}