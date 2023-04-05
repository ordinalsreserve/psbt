import type { AddressTxsUtxo } from '@mempool/mempool.js/lib/interfaces/bitcoin/addresses';
import type { TxStatus } from '@mempool/mempool.js/lib/interfaces/bitcoin/transactions';
import type * as bitcoin from 'bitcoinjs-lib';

export interface Inscription {
  id: string;
  content_type: string;
  num: number;
  preview: string;
  owner: string;
}

export interface WalletStore {
  addresses: string[],
  inscriptions: Inscription[],
  publicKey: string
}

export interface utxo {
  txid: string;
  vout: number;
  value: number;
  status: TxStatus;
  tx: bitcoin.Transaction;
}

export interface WitnessUtxo {
  script: Buffer;
  value: number;
}

export interface GenerateSellerPSBTParams {
  inscriptionId: string;
  tapInternalKey: string;
  price: number;
  receiveAddress: string;
}

export interface GenerateBuyerPSBTParams {
  sellerPSBT: bitcoin.Psbt;
  inscriptionId: string;
  // tapInternalKey: string;
  // price: number;
  buyerAddress: string;
  buyerPublicKey: string;
  buyerOrdinalAddress: string;
  dummyUTXOs: utxo[];
  paymentUTXOs: utxo[];
  feeRateTier: FeeRates;
  unqualifiedUtxos: AddressTxsUtxo[],
}

export type FeeRates = 'fastestFee' | 'halfHourFee' | 'hourFee' | 'minimumFee';