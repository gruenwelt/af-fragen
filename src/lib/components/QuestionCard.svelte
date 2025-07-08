<script lang="ts">
  import { browser } from '$app/environment';

  export let q: any;
  export let isLongAnswer: (q: any) => boolean;
  export let base: string;
  export let isHighlighted: boolean = false;

  let isDesktop = true;

  if (browser) {
    isDesktop = window.innerWidth > 768;
  }

  function decodeHtmlEntities(str: string): string {
    if (!browser) return str;
    const div = document.createElement('div');
    div.innerHTML = str;
    return div.textContent || str;
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
    isLongAnswer(q) || (!isDesktop && ['a', 'b', 'c', 'd'].some(k => q[`picture_${k}`]))
      ? "grid grid-cols-1 gap-3"
      : "grid grid-cols-2 gap-3"
  }>
    {#each ['a', 'b', 'c', 'd'] as key}
      <div class="border border-gray-300 rounded-lg p-3 min-h-[1rem] flex items-center justify-center text-gray-700">
        {#if q[`picture_${key}`]}
          <img src={`${base}/svgs-2x/${q[`picture_${key}`]}.svg`} alt={`Bild Antwort ${key.toUpperCase()}`} class="w-auto h-auto mx-auto" />
        {:else if typeof q[`answer${key.toUpperCase()}Html`] === 'string' && q[`answer${key.toUpperCase()}Html`].includes('katex')}
          <div class="text-center">
            {@html q[`answer${key.toUpperCase()}Html`]}
          </div>
        {:else}
          <div class="text-center">{@html q[`answer${key.toUpperCase()}Html`] ?? ''}</div>
        {/if}
      </div>
    {/each}
  </div>

  <footer class="mt-4 text-[0.6rem] text-gray-500 italic text-center">
    {q.number} – {q.section1}; {q.section2}; {q.section3}
  </footer>
</article>