<script lang="ts">
  import { page } from "$app/stores";
  import { psbtTransformer, txTransformer, verifySignedPSBT } from "$lib/psbt";
  import { onMount } from "svelte";

  $: psbt = psbtTransformer.toClass(
    psbtTransformer.base64ToHex($page.url.searchParams.get("psbt") ?? "")
  );

  onMount(async () => {
    const verified = await verifySignedPSBT(
      $page.url.searchParams.get("psbt") ?? ""
    );
  });
</script>

<div class="break-words">{$page.url.searchParams.get("psbt")}</div>
<div class="flex gap-4 whitespace-pre-wrap justify-between">
  <div class="flex flex-col gap-4">
    {#each psbt.data.inputs as input}
      {#if input.witnessUtxo}
        <h2 class="text-yellow-400">Witness UTXO</h2>
        <div>
          Script:
          {input.witnessUtxo.script.toString("hex")}
        </div>
        <div>
          Amount:
          {input.witnessUtxo.value}
        </div>
      {/if}
      {#if input.nonWitnessUtxo}
        <h2 class="text-yellow-400">Non Witness UTXO</h2>
        {#each txTransformer.toClass(input.nonWitnessUtxo.toString("hex")).ins as input2}
          <h2 class="text-yellow-400">Input</h2>
          <div>
            Hash: {input2.hash.toString("hex")}
          </div>
          <div>
            Index: {input2.index}
          </div>
          <div>
            Script: {input2.script.toString("hex")}
          </div>
          <div>
            Sequence: {input2.sequence}
          </div>
          {#each input2.witness as witness}
            <div>
              Witness: {witness.toString("hex")}
            </div>
          {/each}
        {/each}
        {#each txTransformer.toClass(input.nonWitnessUtxo.toString("hex")).outs as output2}
          <h2 class="text-yellow-400">Output</h2>

          <div>
            Value: {output2.value}
          </div>
          <div>
            Script: {output2.script.toString("hex")}
          </div>
          <!-- {JSON.stringify(output2, null, 2)} -->
        {/each}
        <!-- {JSON.stringify(
          txTransformer.toClass(input.nonWitnessUtxo.toString("hex")),
          null,
          2
        )} -->
      {/if}
    {/each}
  </div>
  <div class="flex flex-col gap-4">
    {#each psbt.data.outputs as output}
      {JSON.stringify(output, null, 2)}
    {/each}
  </div>
</div>
