import * as bitcoin from 'bitcoinjs-lib';
import { getTxHex } from './apis/mempool';
import { doesUtxoContainInscription, getUTXO } from './apis/turbo';
import { calculateTxBytesFee, isP2SHAddress, mapUtxos, toXOnly } from './utils';
import * as ecc from 'tiny-secp256k1';
import type { AddressTxsUtxo } from '@mempool/mempool.js/lib/interfaces/bitcoin/addresses';
import type { utxo } from './interfaces';
import { DUMMY_UTXO_MAX_VALUE, DUMMY_UTXO_MIN_VALUE, DUMMY_UTXO_VALUE } from './constants';

bitcoin.initEccLib(ecc);

interface GenerateSellerPSBTParams {
  inscriptionId: string;
  tapInternalKey: string;
  price: number;
  receiveAddress: string;
}

interface GenerateBuyerPSBTParams {
  // inscriptionId: string;
  // tapInternalKey: string;
  // price: number;
  buyerAddress: string;
  buyerOrdinalAddress: string;
  dummyUTXOs: utxo[];
  paymentUTXOs: utxo[];
}

export const psbtTransformer = {
  hexToBase64: (psbtHex: string) => bitcoin.Psbt.fromHex(psbtHex).toBase64(),
  base64ToHex: (psbtBase64: string) => bitcoin.Psbt.fromBase64(psbtBase64).toHex(),
  toClass: (psbtHex: string) => bitcoin.Psbt.fromHex(psbtHex)
}

export const txTransformer = {
  toClass: (txHex: string) => bitcoin.Transaction.fromHex(txHex)
}

export const generateUnsignedPSBT = async (params: GenerateSellerPSBTParams): Promise<string> => {
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

export const selectDummyUTXOs = async (inscriptionId: string, utxos: AddressTxsUtxo[]): Promise<utxo[] | null> => {
  let result = [];
  for (const utxo of utxos) {
    if (await doesUtxoContainInscription(inscriptionId, utxo)) {
      continue;
    }

    if (
      utxo.value >= DUMMY_UTXO_MIN_VALUE &&
      utxo.value <= DUMMY_UTXO_MAX_VALUE
    ) {
      result.push((await mapUtxos([utxo]))[0]);
      if (result.length === 2) return result;
    }
  }

  return null;
}

export const selectPaymentUTXOs = async (
  inscriptionId: string,
  utxos: AddressTxsUtxo[],
  amount: number, // amount is expected total output (except tx fee)
  vinsLength: number,
  voutsLength: number,
  feeRateTier: string
) => {
  let selectedUtxos = [];
  let selectedAmount = 0;

  utxos = utxos
    .filter((x) => x.value > DUMMY_UTXO_VALUE)
    .sort((a, b) => b.value - a.value);

  for (const utxo of utxos) {
    if (await doesUtxoContainInscription(inscriptionId, utxo)) {
      continue;
    }
    selectedUtxos.push(utxo);
    selectedAmount += utxo.value;
    const fees = await calculateTxBytesFee(vinsLength + selectedUtxos.length, voutsLength, feeRateTier)

    if (selectedAmount >= amount + fees) {
      break;
    }
  }

  if (selectedAmount < amount) {
    throw new Error(`Not enough cardinal spendable funds.
    Address has: ${selectedAmount} sats
    Needed: ${amount} sats`)
  }

  return selectedUtxos;
}

export const getSellerInputAndOutput = async (psbt: bitcoin.Psbt) => {
  // const utxo = await getUTXO(inscriptionId);
  // const tx = bitcoin.Transaction.fromHex(await getTxHex(utxo.txid));

  // const sellerInput: any = {
  //   hash: utxo.txid,
  //   index: utxo.index,
  //   nonWitnessUtxo: tx.toBuffer(),
  //   // No problem in always adding a witnessUtxo here
  //   witnessUtxo: tx.outs[utxo.index],
  // };
  // // If taproot is used, we need to add the internal key
  // sellerInput.tapInternalKey = toXOnly(
  //   tx.toBuffer().constructor(tapInternalKey, 'hex'),
  // );
  if (psbt.txInputs.length !== 1 && psbt.txOutputs.length !== 1) {
    throw new Error('Only 1 input and 1 output should be in Seller PSBT')
  }
  const ret = {
    sellerInput: psbt.txInputs[0],
    sellerOutput: psbt.txOutputs[0],
  };

  return ret;
}

export const generateUnsignedBuyingPSBTBase64 = async (params: GenerateBuyerPSBTParams) => {
  const network = bitcoin.networks.bitcoin;
  const psbt = new bitcoin.Psbt({ network });
  if (
    !params.buyerAddress ||
    !params.buyerOrdinalAddress
  ) {
    throw new Error('Buyer addresses are not set');
  }

  if (
    params.dummyUTXOs.length !== 2 ||
    !params.paymentUTXOs
  ) {
    throw new Error('Not enough utxos');
  }

  let totalInput = 0;

  // Add two dummyUtxos
  for (const dummyUtxo of params.dummyUTXOs) {
    const input: any = {
      hash: dummyUtxo.txid,
      index: dummyUtxo.vout,
      nonWitnessUtxo: dummyUtxo.tx.toBuffer(),
    };

    const p2shInputRedeemScript: any = {};
    const p2shInputWitnessUTXO: any = {};

    if (isP2SHAddress(params.buyerAddress, network)) {
      const redeemScript = bitcoin.payments.p2wpkh({
        // bitcoin.address.fromBase58Check(params.buyerAddress),
        // TODO GET PUB KEY FROM ADDRESS
        pubkey: Buffer.from(params.buyerPublicKey!, 'hex'),
      }).output;
      const p2sh = bitcoin.payments.p2sh({
        redeem: { output: redeemScript },
      });
      p2shInputWitnessUTXO.witnessUtxo = {
        script: p2sh.output,
        value: dummyUtxo.value,
      } as WitnessUtxo;
      p2shInputRedeemScript.redeemScript = p2sh.redeem?.output;
    }

    psbt.addInput({
      ...input,
      ...p2shInputWitnessUTXO,
      ...p2shInputRedeemScript,
    });
    totalInput += dummyUtxo.value;
  }

  // Add dummy output
  psbt.addOutput({
    address: listing.buyer.buyerAddress,
    value:
      listing.buyer.buyerDummyUTXOs[0].value +
      listing.buyer.buyerDummyUTXOs[1].value +
      Number(listing.seller.ordItem.location.split(':')[2]),
  });
  // Add ordinal output
  psbt.addOutput({
    address: listing.buyer.buyerTokenReceiveAddress,
    value: ORDINALS_POSTAGE_VALUE,
  });

  const { sellerInput, sellerOutput } = await getSellerInputAndOutput(
    listing,
  );

  psbt.addInput(sellerInput);
  psbt.addOutput(sellerOutput);

  // Add payment utxo inputs
  for (const utxo of listing.buyer.buyerPaymentUTXOs) {
    const input: any = {
      hash: utxo.txid,
      index: utxo.vout,
      nonWitnessUtxo: utxo.tx.toBuffer(),
    };

    const p2shInputWitnessUTXOUn: any = {};
    const p2shInputRedeemScriptUn: any = {};

    if (isP2SHAddress(listing.buyer.buyerAddress, network)) {
      const redeemScript = bitcoin.payments.p2wpkh({
        pubkey: Buffer.from(listing.buyer.buyerPublicKey!, 'hex'),
      }).output;
      const p2sh = bitcoin.payments.p2sh({
        redeem: { output: redeemScript },
      });
      p2shInputWitnessUTXOUn.witnessUtxo = {
        script: p2sh.output,
        value: utxo.value,
      } as WitnessUtxo;
      p2shInputRedeemScriptUn.redeemScript = p2sh.redeem?.output;
    }

    psbt.addInput({
      ...input,
      ...p2shInputWitnessUTXOUn,
      ...p2shInputRedeemScriptUn,
    });

    totalInput += utxo.value;
  }

  // Create a platform fee output
  let platformFeeValue = Math.floor(
    (listing.seller.price *
      (listing.buyer.takerFeeBp + listing.seller.makerFeeBp)) /
      10000,
  );
  platformFeeValue =
    platformFeeValue > DUMMY_UTXO_MIN_VALUE ? platformFeeValue : 0;

  if (platformFeeValue > 0) {
    psbt.addOutput({
      address: PLATFORM_FEE_ADDRESS,
      value: platformFeeValue,
    });
  }

  // Create two new dummy utxo output for the next purchase
  psbt.addOutput({
    address: listing.buyer.buyerAddress,
    value: DUMMY_UTXO_VALUE,
  });
  psbt.addOutput({
    address: listing.buyer.buyerAddress,
    value: DUMMY_UTXO_VALUE,
  });

  const fee = await calculateTxBytesFee(
    psbt.txInputs.length,
    psbt.txOutputs.length, // already taken care of the exchange output bytes calculation
    listing.buyer.feeRateTier,
  );

  const totalOutput = psbt.txOutputs.reduce(
    (partialSum, a) => partialSum + a.value,
    0,
  );
  const changeValue = totalInput - totalOutput - fee;

  if (changeValue < 0) {
    throw `Your wallet address doesn't have enough funds to buy this inscription.
Price:      ${satToBtc(listing.seller.price)} BTC
Required:   ${satToBtc(totalOutput + fee)} BTC
Missing:    ${satToBtc(-changeValue)} BTC`;
  }

  // Change utxo
  if (changeValue > DUMMY_UTXO_MIN_VALUE) {
    psbt.addOutput({
      address: listing.buyer.buyerAddress,
      value: changeValue,
    });
  }

  listing.buyer.unsignedBuyingPSBTBase64 = psbt.toBase64();
  listing.buyer.unsignedBuyingPSBTInputSize = psbt.data.inputs.length;
  return listing;
}