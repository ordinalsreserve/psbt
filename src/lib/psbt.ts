import * as bitcoin from 'bitcoinjs-lib';
import { getTxHex } from './apis/mempool';
import { getUTXO } from './apis/turbo';
import { toXOnly } from './utils';
import * as ecc from 'tiny-secp256k1';
import mempool from '@mempool/mempool.js';

bitcoin.initEccLib(ecc);

interface GeneratePSBTParams {
  inscriptionId: string;
  tapInternalKey: string;
  price: number;
  receiveAddress: string;
}

export const generateUnsignedPSBT = async (params: GeneratePSBTParams): Promise<string> => {
  const psbt = new bitcoin.Psbt({ network: bitcoin.networks.bitcoin })
  const { txid, index, value } = await getUTXO(params.inscriptionId)

  const tx = bitcoin.Transaction.fromHex(
    await getTxHex(txid)
  )

  const input: any = {
    hash: txid,
    index: index,
    nonWitnessUtxo: tx.toBuffer(),
    witnessUtxo: tx.outs[index],
    sighashType: bitcoin.Transaction.SIGHASH_SINGLE | bitcoin.Transaction.SIGHASH_ANYONECANPAY,
    tapInternalKey: toXOnly(
      tx.toBuffer().constructor(params.tapInternalKey, 'hex')
    )
  }
  psbt.addInput(input);

  const output: any = {
    address: params.receiveAddress,
    value: params.price + value
  }
  psbt.addOutput(output);

  return psbt.toHex();
}

export const verifySignedPSBT = async (signedPSBT: string) => {
  const psbt = bitcoin.Psbt.fromHex(signedPSBT, { network: bitcoin.networks.bitcoin });
  console.log(psbt.data.inputs)
  // psbt.finalizeTaprootInput(0)
  // psbt.finalizeAllInputs()

  psbt.data.inputs.forEach((input) => {
    if (input.tapInternalKey) {
      const finalScriptWitness = input.finalScriptWitness;
      if (finalScriptWitness && finalScriptWitness.length > 0) {
        if (finalScriptWitness.toString('hex') === '0141') {
          throw new Error(`Invalid signature - no taproot signature present on the finalScriptWitness`);
        }
      } else {
        throw new Error(`Invalid signature - no finalScriptWitness`)
      }
    }
  })

}