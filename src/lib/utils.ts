import { Buffer } from 'buffer/';

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
