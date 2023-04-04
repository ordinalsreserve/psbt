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
  publicKey: string | null
}

export interface utxo {
  txid: string;
  vout: number;
  value: number;
  status: TxStatus;
  tx: bitcoin.Transaction;
}