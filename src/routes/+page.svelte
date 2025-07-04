<svelte:head>
	<title>Fragenkatalog</title>
	<meta name="description" content="Prüfungsfragen zum Erwerb von Amateurfunkprüfungsbescheinigungen" />
</svelte:head>

<script lang="ts">
// --- External Imports ---
import { onMount, tick } from 'svelte';
import { page } from '$app/stores';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { base } from '$app/paths';
import { browser } from '$app/environment';

// --- Data Imports ---
import data from '$lib/data/fragenkatalog3b.json';
import fullTree from '$lib/data/tree_combined.json';

// --- Component Imports ---
import Tree from '$lib/components/Tree.svelte';
import KatexRenderer from '$lib/components/KatexRenderer.svelte';

// --- Types ---
type Question = {
  question: string;
  answer_a: string;
  answer_b: string;
  answer_c: string;
  answer_d: string;
  class: string;
  number: string;
  picture_question?: string;
  picture_a?: string;
  picture_b?: string;
  picture_c?: string;
  picture_d?: string;
  section1?: string;
  section2?: string;
  section3?: string;
};

// --- Utility Functions ---

/**
 * Recursively collects all questions from nested sections, attaching section header titles.
 */
function collectQuestions(sections: any[], path: string[] = []): Question[] {
  let questions: Question[] = [];
  for (const section of sections) {
    const currentPath = [...path, section.title];
    if (section.questions) {
      questions.push(
        ...section.questions.map((q: any) => ({
          question: q.question,
          answer_a: q.answer_a,
          answer_b: q.answer_b,
          answer_c: q.answer_c,
          answer_d: q.answer_d,
          class: q.class,
          picture_question: q.picture_question,
          picture_a: q.picture_a,
          picture_b: q.picture_b,
          picture_c: q.picture_c,
          picture_d: q.picture_d,
          number: q.number,
          section1: (currentPath[0] || '').replace('Prüfungsfragen im Prüfungsteil: ', ''),
          section2: currentPath[1] || '',
          section3: currentPath[2] || ''
        }))
      );
    }
    if (section.sections) {
      questions.push(...collectQuestions(section.sections, currentPath));
    }
  }
  return questions;
}

// --- Component State ---

let questions: Question[] = collectQuestions(data.sections);

// --- Reactive Statements ---

// Filter questions based on class query parameter
$: filteredQuestions = (() => {
  if (!browser) return [];
  const c = $page.url.searchParams.get('class');
  if (c === '1' || c === '2' || c === '3') {
    return questions.filter(q => q.class === c);
  }
  return questions;
})();

// Select the tree data for the left menu based on class query param
$: selectedClass = browser ? $page.url.searchParams.get('class') || 'Alle' : 'Alle';

$: treeData = (() => {
  function filterTreeByClass(nodes: any[], selectedClass: string): any[] {
    if (!nodes) return [];

    return nodes
      .map((node: any) => {
        if (selectedClass === 'Alle' || (node.classes && node.classes.includes(selectedClass))) {
          return {
            ...node,
            sections: filterTreeByClass(node.sections, selectedClass)
          };
        }
        return null;
      })
      .filter(Boolean);
  }

  return filterTreeByClass(fullTree, selectedClass);
})();

// --- References ---
let questionsContainer: HTMLElement | null = null;

// --- Methods ---

async function scrollToQuestion(questionId: string) {
  if (!questionId) return;

  const index = filteredQuestions.findIndex(q => q.number === questionId);
  if (index === -1) return;

  await tick();
  const container = questionsContainer;
  const target = container?.querySelector(`[data-question-id="${questionId}"]`);
  if (target && container) {
    const containerTop = container.getBoundingClientRect().top;
    const targetTop = target.getBoundingClientRect().top;
    const scrollOffset = targetTop - containerTop + container.scrollTop;
    container.scrollTo({ top: scrollOffset, behavior: 'smooth' });
  }
}

</script>

<!-- Container for sidebar and questions content -->
<div class="flex max-w-5xl mx-auto p-4 gap-4 overflow-x-hidden flex-grow overflow-auto">
  <!-- Sidebar: Navigation tree -->
  <nav
    class="w-[35%] rounded-lg p-4 max-h-[80vh] overflow-y-auto bg-white/70"
    aria-label="Left sidebar navigation menu"
  >
  <Tree
    nodes={treeData}
    level={1}
    on:sectionclick={(e) => {
      const node = e.detail;
      const currentClass = $page.url.searchParams.get('class') || 'Alle';

      if (!node.question_numbers || node.question_numbers.length === 0) {
        return;
      }

      let first;

      if (currentClass === 'Alle') {
        first = node.question_numbers[0];
      } else {
        first = node.question_numbers.find((qn: string) =>
          filteredQuestions.some(q => q.number === qn)
        );
      }

      if (first) {
        scrollToQuestion(first);
      } else {
        return;
      }
    }}
  />
  </nav>

  <!-- Questions container -->
  <section
    bind:this={questionsContainer}
    class="w-[65%] space-y-6 max-h-[80vh] overflow-y-auto flex-grow overflow-x-hidden"
    aria-label="Scrollable questions container"
  >
    {#if filteredQuestions.length === 0}
      <!-- Loading state -->
      <p class="text-center text-gray-500">Ladefragen...</p>
    {:else}
      {#each filteredQuestions as q}
        <article
          data-question-id={q.number}
          class="border border-gray-300 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200 bg-white/70"
          aria-label="Question and answers"
        >
          <div class="text-center">
            <KatexRenderer latexString={q.question} />
          </div>
          {#if q.picture_question}
            <div class="flex justify-center mb-5">
              <img src={`${base}/svgs/${q.picture_question}.svg`} alt="Bild zur Frage" class="max-h-48" />
            </div>
          {:else}
            <div class="mb-5"></div>
          {/if}
          <div class="grid grid-cols-2 gap-3">
            <div class="border border-gray-300 rounded-lg p-3 min-h-[1rem] flex items-center justify-center text-gray-700">
              {#if q.picture_a}
                <img src={`${base}/svgs/${q.picture_a}.svg`} alt="Bild Antwort A" class="max-h-24 mx-auto" />
              {:else}
                <KatexRenderer latexString={q.answer_a} />
              {/if}
            </div>
            <div class="border border-gray-300 rounded-lg p-3 min-h-[1rem] flex items-center justify-center text-gray-700">
              {#if q.picture_b}
                <img src={`${base}/svgs/${q.picture_b}.svg`} alt="Bild Antwort B" class="max-h-24 mx-auto" />
              {:else}
                <KatexRenderer latexString={q.answer_b} />
              {/if}
            </div>
            <div class="border border-gray-300 rounded-lg p-3 min-h-[1rem] flex items-center justify-center text-gray-700">
              {#if q.picture_c}
                <img src={`${base}/svgs/${q.picture_c}.svg`} alt="Bild Antwort C" class="max-h-24 mx-auto" />
              {:else}
                <KatexRenderer latexString={q.answer_c} />
              {/if}
            </div>
            <div class="border border-gray-300 rounded-lg p-3 min-h-[1rem] flex items-center justify-center text-gray-700">
              {#if q.picture_d}
                <img src={`${base}/svgs/${q.picture_d}.svg`} alt="Bild Antwort D" class="max-h-24 mx-auto" />
              {:else}
                <KatexRenderer latexString={q.answer_d} />
              {/if}
            </div>
          </div>
          <footer class="mt-4 text-[0.6rem] text-gray-500 italic text-center">
            {q.number} – {q.section1}, {q.section2}, {q.section3}
          </footer>
        </article>
      {/each}
    {/if}
  </section>
</div>