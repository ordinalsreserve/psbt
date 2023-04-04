<script lang="ts">
  import type { Psbt } from "bitcoinjs-lib";
  import { onMount } from "svelte";

  export let psbt: Psbt;

  function getInputs() {
    return psbt.data.inputs.map((input, index) => {
      const witnessUtxo = input.witnessUtxo || null;
      return {
        index,
        value: witnessUtxo ? witnessUtxo.value : "N/A",
      };
    });
  }

  function getOutputs() {
    return psbt.data.outputs.map((output, index) => {
      return {
        index,
        address: output.address,
        value: output.value,
      };
    });
  }

  onMount(() => {
    console.log(psbt.extractTransaction());
  });
</script>

<div class="psbt-info">
  <h1 class="text-xl font-semibold mb-4">PSBT Information</h1>

  <div class="mb-8">
    <h2 class="text-lg font-semibold mb-2">Inputs</h2>
    <table class="w-full border-collapse">
      <thead>
        <tr class="border-b">
          <th class="border px-2 py-1 bg-gray-200 text-slate-700">Index</th>
          <th class="border px-2 py-1 bg-gray-200 text-slate-700"
            >Transaction Hash</th
          >
          <th class="border px-2 py-1 bg-gray-200 text-slate-700">Value</th>
        </tr>
      </thead>
      <tbody>
        {#each getInputs() as input}
          <tr>
            <td class="border px-2 py-1">{input.index}</td>
            <td class="border px-2 py-1">{input.hash}</td>
            <td class="border px-2 py-1">{input.value}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  <div>
    <h2 class="text-lg font-semibold mb-2">Outputs</h2>
    <table class="w-full border-collapse">
      <thead>
        <tr class="border-b">
          <th class="border px-2 py-1 bg-gray-200 text-slate-700">Index</th>
          <th class="border px-2 py-1 bg-gray-200 text-slate-700">Address</th>
          <th class="border px-2 py-1 bg-gray-200 text-slate-700">Value</th>
        </tr>
      </thead>
      <tbody>
        {#each getOutputs() as output}
          <tr>
            <td class="border px-2 py-1">{output.index}</td>
            <td class="border px-2 py-1">{output.address}</td>
            <td class="border px-2 py-1">{output.value}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
