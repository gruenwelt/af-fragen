<script lang="ts">
  export let questionLimit: number;
  export let questionLimits = [25, 100, 200];
  export let currentIndex: number;
  export let isDarkMode: boolean;
  export let sessionActive: boolean;

  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  function setLimit(limit: number) {
    dispatch('setLimit', limit);
  }

  function startSession() {
    dispatch('startSession');
  }
</script>

{#if !sessionActive}
  <div class="w-screen flex justify-center items-center min-h-screen">
    <div class="flex flex-col items-center text-center gap-6">
      <div class="flex gap-4">
        {#each questionLimits as limit}
          <button
            class="w-16 h-10 rounded-full text-sm font-medium shadow transition-all cursor-pointer"
            class:bg-[color:var(--color-theme-1)]={questionLimit === limit}
            class:text-white={questionLimit === limit}
            class:bg-white={questionLimit !== limit}
            class:text-black={questionLimit !== limit}
            on:click={() => setLimit(limit)}
          >
            <span aria-hidden="true">{limit}</span>
            <span class="sr-only">Teste {limit} Fragen</span>
          </button>
        {/each}
      </div>
      <button
        class="px-10 py-4 text-2xl rounded-full bg-green-600 text-white shadow relative cursor-pointer"
        style="border-radius: 9999px 9999px 9999px 9999px;"
        on:click={startSession}
      >
        <span class="sr-only">Los geht’s! (Test starten)</span>
        <span aria-hidden="true">Los geht’s!</span>
      </button>
    </div>
  </div>
{/if}

{#if sessionActive}
  <!-- Fixed Previous Button -->
  <button
    class={`fixed left-4 top-[66%] md:top-1/2 transform -translate-y-1/2 w-20 h-20 rounded-full ${isDarkMode ? 'bg-[#1e1e1e]' : 'bg-[rgba(255,255,255,0.7)]'} shadow-lg z-50 text-4xl cursor-pointer`}
    on:click={() => dispatch('prev')}
    disabled={currentIndex === 0}
  >
    ←
  </button>

  <!-- Fixed Next Button -->
  <button
    class={`fixed right-4 top-[66%] md:top-1/2 transform -translate-y-1/2 w-20 h-20 rounded-full ${isDarkMode ? 'bg-[#1e1e1e]' : 'bg-[rgba(255,255,255,0.7)]'} shadow-lg z-50 text-4xl cursor-pointer`}
    on:click={() => dispatch('next')}
    disabled={currentIndex >= questionLimit - 1}
  >
    →
  </button>
{/if}