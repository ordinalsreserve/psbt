import { env } from "$env/dynamic/public";

export const DUMMY_UTXO_MIN_VALUE = Number(env.PUBLIC_DUMMY_UTXO_MIN_VALUE ?? 1000);
export const DUMMY_UTXO_MAX_VALUE = Number(env.PUBLIC_DUMMY_UTXO_MAX_VALUE ?? 580);
export const DUMMY_UTXO_VALUE = Number(env.PUBLIC_DUMMY_UTXO_VALUE ?? 600);
export const ORDINALS_POSTAGE_VALUE = Number(env.PUBLIC_ORDINALS_POSTAGE_VALUE ?? 10000);