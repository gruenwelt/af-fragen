

<script lang="ts">
  export let questionLimit: number;
  export let onSetLimit: (limit: number) => void;
  export let onStartSession: () => void;
</script>

<div class="w-screen flex justify-center items-center min-h-screen">
  <div class="flex flex-col items-center text-center gap-6">
    <div class="flex gap-4">
      {#each [25, 100, 200] as limit}
        <button
          class="w-16 h-10 rounded-full text-sm font-medium shadow transition-all cursor-pointer"
          class:bg-[color:var(--color-theme-1)]={questionLimit === limit}
          class:text-white={questionLimit === limit}
          class:bg-white={questionLimit !== limit}
          class:text-black={questionLimit !== limit}
          on:click={() => onSetLimit(limit)}
        >
          <span aria-hidden="true">{limit}</span>
          <span class="sr-only">Teste {limit} Fragen</span>
        </button>
      {/each}
    </div>
    <button
      class="px-10 py-4 text-2xl rounded-full bg-green-600 text-white shadow relative cursor-pointer"
      style="border-radius: 9999px"
      on:click={onStartSession}
    >
      <span class="sr-only">Los geht’s! (Test starten)</span>
      <span aria-hidden="true">Los geht’s!</span>
    </button>
  </div>
</div>