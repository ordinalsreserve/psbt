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