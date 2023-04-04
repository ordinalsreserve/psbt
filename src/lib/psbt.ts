import * as bitcoin from 'bitcoinjs-lib';
import { getTxHex } from './apis/mempool';
import { getInscription, getUTXO } from './apis/turbo';
import { toXOnly } from './utils';
import * as ecc from 'tiny-secp256k1';
import mempool from '@mempool/mempool.js';
import type { AddressTxsUtxo } from '@mempool/mempool.js/lib/interfaces/bitcoin/addresses';
import type { utxo } from './interfaces';

bitcoin.initEccLib(ecc);

interface GeneratePSBTParams {
  inscriptionId: string;
  tapInternalKey: string;
  price: number;
  receiveAddress: string;
}

export const psbtTransformer = {
  hexToBase64: (psbtHex: string) => bitcoin.Psbt.fromHex(psbtHex).toBase64(),
  base64ToHex: (psbtBase64: string) => bitcoin.Psbt.fromBase64(psbtBase64).toHex(),
  toClass: (psbtHex: string) => bitcoin.Psbt.fromHex(psbtHex)
}

export const txTransformer = {
  toClass: (txHex: string) => bitcoin.Transaction.fromHex(txHex)
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

export const verifySignedPSBT = async (signedPSBTBase64: string) => {
  const psbt = bitcoin.Psbt.fromBase64(signedPSBTBase64, { network: bitcoin.networks.bitcoin });

  // psbt.finalizeTaprootInput(0)
  // psbt.finalizeAllInputs()

  psbt.data.inputs.forEach((input) => {
    if (input.tapInternalKey) {
      const finalScriptWitness = input.finalScriptWitness;

      if (finalScriptWitness && finalScriptWitness.length > 0) {
        // Validate that the finalScriptWitness is not empty (and not just the initial value, without the tapKeySig)
        if (finalScriptWitness.toString('hex') === '0141') {
          throw new Error(
            `Invalid signature - no taproot signature present on the finalScriptWitness`,
          );
        }
      } else {
        throw new Error(
          `Invalid signature - no finalScriptWitness`,
        );
      }
    }
  });

  // HOW TO verify w/o full node
  // verify signatures valid, so that the psbt is signed by the item owner
  // if (
  //   (await FullnodeRPC.analyzepsbt(req.signedListingPSBTBase64))?.inputs[0]
  //     ?.is_final !== true
  // ) {
  //   throw new Error(`Invalid signature`);
  // }

  // verify that the input's sellerOrdAddress is the same as the sellerOrdAddress of the utxo
  if (psbt.inputCount !== 1) {
    throw new Error(`Invalid number of inputs`);
  }

  // Need Reverse Lookup
  // const ordItem = await getInscription(`${psbt.txInputs[0].hash.toString('hex')}i${psbt.txInputs[0].index}`)
  // verify that the ordItem's selling price matches the output value with makerFeeBp
  // const output = psbt.txOutputs[0];
  // const expectedOutputValue = price + ordItem.outputValue;
  // if (output.value !== expectedOutputValue) {
  //   throw new Error(`Invalid price`);
  // }

  // verify that the output address is the same as the seller's receive address
  // if (output.address !== sellerReceiveAddress) {
  //   throw new Error(`Invalid sellerReceiveAddress`);
  // }

  // verify that the seller address is a match
  // const sellerAddressFromPSBT = bitcoin.address.fromOutputScript(
  //   bitcoin.Transaction.fromHex(
  //     await FullnodeRPC.getrawtransaction(
  //       generateTxidFromHash(psbt.txInputs[0].hash),
  //     ),
  //   ).outs[psbt.txInputs[0].index].script,
  //   network,
  // );
  // if (ordItem?.owner !== sellerAddressFromPSBT) {
  //   throw new Error(`Invalid seller address`);
  // }
}

export const selectDummyUTXOs = async (utxos: AddressTxsUtxo[]): Promise<utxo[] | null> => {
  let result = [];
  for (const utxo of utxos) {
    if (await )
  }
}