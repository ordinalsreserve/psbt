import mempool from '@mempool/mempool.js';

const { bitcoin } = mempool({
  hostname: 'mempool.space',
  network: 'mainnet'
})

export const getTxHex = async (txid: string) => {
  return await bitcoin.transactions.getTxHex({ txid });
}
