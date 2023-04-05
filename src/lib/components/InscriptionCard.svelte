<script lang="ts">
  import { goto } from "$app/navigation";
  import { signPSBT } from "$lib/wallets/unisat";
  import type { Inscription } from "../interfaces";
  import { generateUnsignedPSBT, psbtTransformer } from "../psbt";

  export let publicKey: string | null;
  export let inscription: Inscription;
  let price: number = 51000000;

  const sell = async () => {
    if (publicKey) {
      const psbtHex = await generateUnsignedPSBT({
        inscriptionId: inscription.id,
        price,
        receiveAddress: inscription.owner,
        tapInternalKey: publicKey,
      });
      const signed = await signPSBT(psbtHex);
      const b64 = encodeURIComponent(psbtTransformer.hexToBase64(signed));
      goto(`/tx?psbt=${b64}&inscriptionId=${inscription.id}`);
    }
  };
</script>

<div class="card w-96 bg-base-100 shadow-xl">
  <figure>
    {#if inscription.content_type.includes("image")}
      <img src={inscription.preview} alt={inscription.id} />
    {:else}
      <iframe src={inscription.preview} title={inscription.id} />
    {/if}
  </figure>
  <div class="card-body">
    <h2 class="card-title truncate">{inscription.id}</h2>
    <p>Content Type: {inscription.content_type}</p>
    <div class="card-actions justify-end">
      <label for="my-modal" class="btn btn-primary">Sell</label>
    </div>
  </div>
</div>

<input type="checkbox" id="my-modal" class="modal-toggle" />
<div class="modal">
  <div class="modal-box">
    <h3 class="font-bold text-lg">Sell Inscription #{inscription.num}</h3>
    <p class="py-4">
      <input
        type="text"
        placeholder="Price"
        class="input input-bordered w-full max-w-xs"
        bind:value={price}
      />
    </p>
    <div class="modal-action">
      <label for="my-modal" class="btn" on:click={sell}>Sell</label>
    </div>
  </div>
</div>
