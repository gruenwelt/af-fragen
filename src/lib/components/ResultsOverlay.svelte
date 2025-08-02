<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let winCount: number;
  export let questionLimit: number;

  const dispatch = createEventDispatcher();

  $: passPercentage = Math.round((winCount / questionLimit) * 100);
  $: passed = winCount >= 19 && passPercentage >= 76;
</script>

<div class="fixed inset-0 z-[999] flex items-center justify-center px-4 bg-black/30 backdrop-blur-sm transition-opacity duration-300">
  <div class="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center transform transition-all duration-300 scale-100 opacity-100 min-h-[416px] flex flex-col justify-center items-center">
    {#if passed}
      <p class="text-lg font-bold mt-6 mb-8 leading-relaxed">🎉 Super gemacht! Du hast bestanden!</p>
    {:else if passPercentage >= 60}
      <p class="text-lg font-bold mt-6 mb-8 leading-relaxed">😌 Noch nicht ganz – aber du bist fast am Ziel!</p>
    {:else if passPercentage < 25}
      <p class="text-lg font-bold mt-6 mb-8 leading-relaxed">📚 Vielleicht hilft noch etwas Lernen?</p>
    {:else}
      <p class="text-lg font-bold mt-6 mb-8 leading-relaxed">💡 Leider nicht bestanden!</p>
    {/if}

    <p class="text-3xl font-bold mb-10 leading-snug {passed ? 'text-green-600' : 'text-[color:var(--color-theme-1)]'}">
      {winCount} richtige Antworten ({passPercentage}%)
    </p>

    <div class="flex justify-around mt-10 gap-6">
      <button
        class="w-48 h-14 py-2 rounded-full text-base font-medium shadow transition-all cursor-pointer bg-blue-600 hover:bg-blue-700 text-white"
        on:click={() => dispatch('close')}
      >
        Überblick
      </button>
      <button
        class="w-48 h-14 py-2 rounded-full text-base font-medium shadow transition-all cursor-pointer bg-[color:var(--color-theme-1)] text-white"
        on:click={() => dispatch('restart')}
      >
        Beenden
      </button>
    </div>
  </div>
</div>