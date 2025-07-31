<script lang="ts">
  // Environment and routing imports
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { get } from 'svelte/store';
  import { onMount } from 'svelte';
  import 'katex/dist/katex.min.css';

  // Component props
  export let q: any; // Current question object
  export let base: string; // Base path for image resources
  export let isHighlighted: boolean = false; // Whether to visually highlight the question card
  export let shuffledAnswers: any[] = []; // Optional externally provided answer order
  export let selectedAnswerIndex: number | null = null; // Index of selected answer
  export let correctIndex: number | null = null; // Index of correct answer
  export let onSelect: (idx: number) => void = () => {}; // Answer selection handler

  // Determine if we are in "Üben" mode (shuffle answers) or "Fragen" mode (preserve order)
  const pathname = get(page).url.pathname;
  const shuffleAnswers = !pathname.startsWith('/fragen');

  // Device size detection (desktop vs mobile)
  let isDesktop = true;
  if (browser) {
    isDesktop = window.innerWidth > 768;
  }

  // Generate default answers if none provided, with optional shuffling
  onMount(() => {
    if (!shuffledAnswers || shuffledAnswers.length === 0) {
      const answers = ['a', 'b', 'c', 'd'].map((key) => ({
        html: q[`answer${key.toUpperCase()}Html`],
        picture: q[`picture_${key}`]
      }));
      shuffledAnswers = shuffleAnswers
        ? [...answers].sort(() => Math.random() - 0.5)
        : answers;
    }
  });

  // Helper to decode HTML entities for proper rendering of encoded tags and symbols
  function decodeHtmlEntities(str: string): string {
    if (!browser) return str;
    const div = document.createElement('div');
    div.innerHTML = str;
    return div.textContent || str;
  }

  function isLongAnswer(q: any): boolean {
    const threshold = isDesktop ? 60 : 12;
    const hasLongText = ['answer_a', 'answer_b', 'answer_c', 'answer_d'].some(
      (key) => (q[key]?.length || 0) > threshold
    );
    const hasImages = ['picture_a', 'picture_b', 'picture_c', 'picture_d'].some(
      (key) => !!q[key]
    );
    return hasLongText && !hasImages;
  }
</script>

<article
  data-question-id={q.number}
  class={`bg-white shadow-md rounded-lg p-4 border ${
    isHighlighted && isDesktop ? 'border-[color:var(--color-theme-1)]' : 'border-gray-200'
  }`}
>
  {#if q.picture_question}
    <div class="mb-2"></div>
    <div class="flex justify-center mb-5">
      <img src={`${base}/svgs-2x/${q.picture_question}.svg`} alt="Bild zur Frage" class="w-auto h-auto mx-auto" />
    </div>
  {/if}

  {#if typeof q.questionHtml === 'string' && q.questionHtml.includes('katex')}
    <div class="text-center">
      {@html q.questionHtml}
    </div>
  {:else}
    <div class="text-center">{@html decodeHtmlEntities(q.questionHtml ?? '')}</div>
  {/if}

  <div class="h-4"></div>

  <div class={
    (q && isLongAnswer(q)) || (!isDesktop && shuffledAnswers.some(ans => ans.picture))
      ? "grid grid-cols-1 gap-3"
      : "grid grid-cols-2 gap-3"
  }>
    {#each shuffledAnswers as ans, idx}
      <button
        type="button"
        class={[
          'answer-box',
          'answer-border',
          'answer-text',
          (!onSelect || selectedAnswerIndex !== null) ? 'cursor-default' : 'cursor-pointer',
          selectedAnswerIndex !== null
            ? selectedAnswerIndex === idx
              ? correctIndex !== null
                ? idx === correctIndex
                  ? 'bg-green-600'
                  : 'bg-theme-color'
                : 'bg-theme-color'
              : idx === correctIndex
              ? 'bg-green-600'
              : 'border-gray-200'
            : 'border-gray-200'
        ].join(' ')}
        disabled={!onSelect || selectedAnswerIndex !== null}
        on:click={() => onSelect(idx)}
        aria-pressed={selectedAnswerIndex === idx}
      >
        {#if ans.picture}
          <img
            src={`${base}/svgs-2x/${ans.picture}.svg`}
            alt="Bild Antwort"
            class={`w-auto h-auto mx-auto ${
              selectedAnswerIndex !== null
                ? selectedAnswerIndex === idx
                  ? correctIndex !== null
                    ? idx === correctIndex
                      ? 'invert-[.9] hue-rotate-180'
                      : 'invert-[.9] hue-rotate-180'
                    : ''
                  : idx === correctIndex
                  ? 'invert-[.9] hue-rotate-180'
                  : ''
                : ''
            }`}
          />
        {:else if typeof ans.html === 'string' && ans.html.includes('katex')}
          <div class="text-center">
            {@html ans.html}
          </div>
        {:else}
          <div class="text-center">{@html decodeHtmlEntities(ans.html ?? '')}</div>
        {/if}
      </button>
    {/each}
  </div>

  <footer class="mt-4 text-[0.6rem] text-gray-500 italic text-center">
    {q.number} – {q.section1}; {q.section2}; {q.section3}
  </footer>
</article>

<style>
  .answer-box {
    border-radius: 0.5rem;
    padding: 0.75rem;
    min-height: 1rem;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
  }

  .answer-border {
    border: 1px solid #d1d5db; /* Tailwind's border-gray-300 */
  }


  :global(.dark) .answer-border {
    border-color: #666;
  }


  :global(.dark) article.bg-white {
    background-color: #1e1e1e;
    border-color: #444;
    color: #eee;
  }

  :global(.dark) footer.text-gray-500 {
    color: #aaa;
  }

  /* Light mode styles */
  .answer-box.bg-green-600 {
    background-color: #16a34a;
    border-color: #16a34a;
    color: #fff;
  }

  .answer-box.bg-theme-color {
    background-color: var(--color-theme-1);
    border-color: var(--color-theme-1);
    color: #fff;
  }

  /* Dark mode transparency for selected answers */
  :global(.dark) .answer-box.bg-green-600 {
    background-color: rgba(22, 163, 74, 0.3);
    border-color: rgba(22, 163, 74, 0.3);
    color: #fff;
  }

  :global(.dark) .answer-box.bg-theme-color {
    background-color: rgba(255, 62, 0, 0.3);
    border-color: rgba(255, 62, 0, 0.3);
    color: #fff;
  }

  :global(.dark) .answer-box img,
  :global(.dark) article img {
    filter: invert(1) hue-rotate(180deg);
  }

  :global(html.dark) article.border-\[color\:var\(--color-theme-1\)\] {
    border-color: rgba(255, 62, 0, 0.5);
  }
</style>