<script lang="ts">
  import InscriptionCard from "../../lib/components/InscriptionCard.svelte";
  import { connectUnisat, unisatWallet } from "../../lib/wallets/unisat";
</script>

<div class="flex">
  {#if $unisatWallet.addresses.length === 0}
    <button on:click={connectUnisat} class="btn btn-primary"
      >Connect Unisat</button
    >
  {:else}
    <button class="btn btn-disabled">Unisat Connected</button>
  {/if}
</div>

{#if $unisatWallet.addresses.length > 0}
  <h1>Unisat</h1>
  <div>
    {#each $unisatWallet.addresses as address}
      Address: {address}
    {/each}
  </div>
  <div>
    {#each $unisatWallet.inscriptions as inscription}
      <InscriptionCard {inscription} publicKey={$unisatWallet.publicKey} />
    {/each}
  </div>
{/if}
