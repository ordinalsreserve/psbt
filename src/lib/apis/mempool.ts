import mempool from '@mempool/mempool.js';

const { bitcoin } = mempool({
  hostname: 'mempool.space',
  network: 'mainnet'
})

export const getTxHex = async (txid: string) => {
  return await bitcoin.transactions.getTxHex({ txid });
}

export async function getFees(feeRateTier: string) {
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