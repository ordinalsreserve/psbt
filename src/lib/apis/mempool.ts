import type { FeeRates } from '$lib/interfaces';
import mempool from '@mempool/mempool.js';
import type { AddressTxsUtxo } from '@mempool/mempool.js/lib/interfaces/bitcoin/addresses';

const { bitcoin } = mempool({
  hostname: 'mempool.space',
  network: 'mainnet'
})

export const getTxHex = async (txid: string) => {
  return await bitcoin.transactions.getTxHex({ txid });
}

export async function getFees(feeRateTier: FeeRates) {
  const res = await bitcoin.fees.getFeesRecommended();
  switch (feeRateTier) {
    case 'fastestFee':
      return res.fastestFee;
    case 'halfHourFee':
      return res.halfHourFee;
    case 'hourFee':
      return res.hourFee;
    case 'minimumFee':
      return res.minimumFee;
    default:
      return res.hourFee;
  }
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

export const getUTXOsForAddress = async (address: string): Promise<AddressTxsUtxo[]> => {
  return await bitcoin.addresses.getAddressTxsUtxo({ address })
}