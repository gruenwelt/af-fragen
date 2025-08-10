<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  export let currentIndex: number;
  export let limitedQuestions: any[] = [];
  export let winCount: number;
  export let timer: string | null = null;

  const dispatch = createEventDispatcher();
</script>

{#if limitedQuestions.length > 0}
  <footer
    class="fixed bottom-[10px] left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur px-4 rounded-full shadow flex justify-between items-center z-50 w-[calc(60%)] max-w-full md:max-w-xl"
    aria-label="Session progress and controls"
  >
    <!-- Progress -->
    <div class="w-[25%] flex justify-start items-center text-sm ml-1">
      {currentIndex + 1} / {limitedQuestions.length}
    </div>

    {#if timer}
      <div class="w-[25%] flex justify-center items-center text-sm whitespace-nowrap truncate font-bold" aria-live="polite">
        {timer}
      </div>
    {/if}

    {#if timer}
      <div class="w-[25%] flex justify-center items-center text-sm text-green-600 whitespace-nowrap truncate font-bold">
        {winCount}
      </div>
    {:else}
      <div class="w-[50%] flex justify-center items-center text-sm text-green-600 whitespace-nowrap truncate font-bold">
        {winCount}
      </div>
    {/if}

    <!-- Results Button -->
    <div class="w-[25%] flex justify-end items-center pr-0 mr-[-20px]">
      <button
        class="w-12 h-12 rounded-full bg-red-500 text-lg font-bold cursor-pointer text-white"
        on:click={() => dispatch('showResults')}
        aria-label="Show results"
      >
        X
      </button>
    </div>
  </footer>
{/if}