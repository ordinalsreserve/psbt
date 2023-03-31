<script lang="ts">
  import "../app.css";
  import { onMount } from 'svelte'
  import { themeChange } from 'theme-change'

  onMount(() => {
    themeChange(false)
  })
</script>

<div class="p-3">
  <slot/>
</div>
