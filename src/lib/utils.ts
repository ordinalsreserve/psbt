import type { AddressTxsUtxo } from '@mempool/mempool.js/lib/interfaces/bitcoin/addresses';
import { Buffer } from 'buffer/';
import type { FeeRates, utxo } from './interfaces';
import * as bitcoin from "bitcoinjs-lib";
import { getFees, getTxHex } from './apis/mempool';

export function hexToLittleEndian(hex: string) {
  return Buffer.from(hex, 'hex').reverse().toString('hex');
}

export function decodeOutpoint(outpointHex: string) {
  const outpointData = Buffer.from(outpointHex, 'hex');
  const txid = hexToLittleEndian(outpointData.slice(0, 32).toString('hex'));
  const index = outpointData.readUInt32LE(32);

  return { txid, index };
}

export const toXOnly = (pubKey: Buffer) =>
  pubKey.length === 32 ? pubKey : pubKey.subarray(1, 33);

export async function mapUtxos(
  utxosFromMempool: AddressTxsUtxo[],
): Promise<utxo[]> {
  console.error(utxosFromMempool)
  const ret: utxo[] = [];
  for (const utxoFromMempool of utxosFromMempool) {
    ret.push({
      txid: utxoFromMempool.txid,
      vout: utxoFromMempool.vout,
      value: utxoFromMempool.value,
      status: utxoFromMempool.status,
      tx: bitcoin.Transaction.fromHex(await getTxHex(utxoFromMempool.txid))
    });
  }
  return ret;
}

export async function calculateTxBytesFee(
  vinsLength: number,
  voutsLength: number,
  feeRateTier: FeeRates,
  includeChangeOutput: 0 | 1 = 1,
) {
  const recommendedFeeRate = await getFees(feeRateTier);
  return calculateTxBytesFeeWithRate(
    vinsLength,
    voutsLength,
    recommendedFeeRate,
    includeChangeOutput,
  );
}

export function calculateTxBytesFeeWithRate(
  vinsLength: number,
  voutsLength: number,
  feeRate: number,
  includeChangeOutput: 0 | 1 = 1,
): number {
  const baseTxSize = 10;
  const inSize = 180;
  const outSize = 34;

  const txSize =
    baseTxSize +
    vinsLength * inSize +
    voutsLength * outSize +
    includeChangeOutput * outSize;
  const fee = txSize * feeRate;
  return fee;
}

export function isP2SHAddress(
  address: string,
  network: bitcoin.Network,
): boolean {
  try {
    const { version, hash } = bitcoin.address.fromBase58Check(address);
    return version === network.scriptHash && hash.length === 20;
  } catch (error) {
    return false;
  }
}