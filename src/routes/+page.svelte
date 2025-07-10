<svelte:head>
  <title>Übungsmodus – Amateurfunkprüfung Simulator (N, E, A)</title>
  <meta name="description" content="Simuliere die deutsche Amateurfunkprüfung für die Klassen N, E und A. Wähle 25, 100 oder 200 Fragen im Übungsmodus mit zufälliger Reihenfolge." />
  <link rel="canonical" href="https://funkfragen.de/" />
  <meta name="keywords" content="Amateurfunk, Prüfungssimulator, Funkprüfung, Klasse N, Klasse E, Klasse A, Prüfungsfragen, Lernapp, Testmodus" />
  <meta property="og:title" content="Üben – Funkfragen: Prüfungssimulator für Amateurfunk" />
  <meta property="og:description" content="Simuliere die deutsche Amateurfunkprüfung im Übungsmodus: Wähle zufällige Fragen der Klassen N, E oder A und bereite dich gezielt vor." />
  <script type="application/ld+json">{ 
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Funkfragen Übungsmodus",
    "url": "https://funkfragen.de",
    "applicationCategory": "EducationalApplication",
    "operatingSystem": "All",
    "description": "Simuliere die deutsche Amateurfunkprüfung für die Klassen N, E und A. Wähle 25, 100 oder 200 Fragen im Übungsmodus mit zufälliger Reihenfolge.",
    "inLanguage": "de",
    "mainEntityOfPage": "https://funkfragen.de",
    "publisher": {
      "@type": "Organization",
      "name": "Funkfragen"
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "EUR"
    }
  }</script>
</svelte:head>

<script lang="ts">
// Utility functions for dynamic answer/picture keys
function getAnswerHtml(q: Question, key: string): string {
  const map: Record<string, keyof Question> = {
    a: 'answerAHtml',
    b: 'answerBHtml',
    c: 'answerCHtml',
    d: 'answerDHtml',
  };
  return q[map[key]] || '';
}

function getPictureKey(q: Question, key: string): string | undefined {
  const map: Record<string, keyof Question> = {
    a: 'picture_a',
    b: 'picture_b',
    c: 'picture_c',
    d: 'picture_d',
  };
  return q[map[key]];
}

// Decode HTML entities utility
function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  if (typeof window === 'undefined') return str;
  const txt = document.createElement('textarea');
  txt.innerHTML = str;
  return txt.value;
}
// Imports
// ==============================

let headerReady = false;
import { onMount, tick } from 'svelte';
import QuestionCard from '$lib/components/QuestionCard.svelte';
import 'katex/dist/katex.min.css';
import { browser } from '$app/environment';
import { get } from 'svelte/store';
import { base } from '$app/paths';
import { sessionStarted } from '$lib/stores/session';
// Use questions from layout data

// ==============================
// Types
// ==============================
type Question = {
	question: string;
	questionHtml: string;
	answer_a: string;
	answerAHtml: string;
	answer_b: string;
	answerBHtml: string;
	answer_c: string;
	answerCHtml: string;
	answer_d: string;
	answerDHtml: string;
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

type SessionAnswer = { questionNumber: string; selectedIndex: number; isCorrect: boolean };
type ShuffledAnswer = { text: string; html: string; index: number };

// ==============================
// Data & Derived Data
// ==============================
function extractQuestions(tree: any): Question[] {
	const result: Question[] = [];
	for (const s1 of tree.sections || []) {
		for (const s2 of s1.sections || []) {
			for (const s3 of s2.sections || []) {
				if (Array.isArray(s3.questions)) {
					result.push(...s3.questions.map((q: any) => ({
						...q,
						section1: s1.title,
						section2: s2.title,
						section3: s3.title
					})));
				}
			}
		}
	}
	return result;
}
import { page } from '$app/stores';
// Questions and allQuestions will be initialized reactively before session starts
let questions: any = null;
let allQuestions: Question[] = [];

const answerKeys = { a: 'answer_a', b: 'answer_b', c: 'answer_c', d: 'answer_d' } as const;
const answerHtmlKeys = { a: 'answerAHtml', b: 'answerBHtml', c: 'answerCHtml', d: 'answerDHtml' } as const;
const pictureKeys = { a: 'picture_a', b: 'picture_b', c: 'picture_c', d: 'picture_d' } as const;

// ==============================
// State
// ==============================
const questionLimits = [25, 100, 200];
let filteredQuestions: Question[] = [];
let isLoading = false;
let selectedClass: string = 'Alle';
let questionsContainer: HTMLElement | null = null;
let showSidebar = false;
let sessionEnded = false;
let reviewingWrongAnswers = false;
let sessionAnswers: SessionAnswer[] = [];
let currentIndex = 0;
let showResults = false;

// Make winCount reactive to sessionAnswers
$: winCount = sessionAnswers.filter((a) => a.isCorrect).length;

// ==============================
// Success Rate (reactive)
// ==============================
// (Removed: successRate calculation is now only in final results overlay.)
let questionLimit = 25;
let shuffledAnswers: ShuffledAnswer[] = [];
export let selectedAnswerIndex: number | null = null;
let shuffledMap: Record<string, ShuffledAnswer[]> = {};
let wrongQuestions: SessionAnswer[] = [];

// ==============================
// Functions
// ==============================
function isLongAnswer(q: Question): boolean {
  // Use a dynamic threshold based on isMobile
  const threshold = isMobile ? 12 : 60;
  const hasLongText = [q.answer_a, q.answer_b, q.answer_c, q.answer_d].some(
    (a) => a.length > threshold
  );
  const hasImages = !!(q.picture_a || q.picture_b || q.picture_c || q.picture_d);
  return hasLongText && !hasImages;
}

function showResultsOverlay() {
  showResults = true;
}
// ==============================
// Mobile detection state
// ==============================
let isMobile = false;

onMount(() => {
  const checkMobile = () => {
    isMobile = window.innerWidth <= 768;
  };

  checkMobile();
  window.addEventListener('resize', checkMobile);

  // Restore session state from sessionStorage if available
  if (browser) {
    const started = sessionStorage.getItem('af-session-started') === 'true';
    if (started) {
      try {
        const restoredAnswers = JSON.parse(sessionStorage.getItem('af-session-answers') || '[]');
        const restoredQuestions = JSON.parse(sessionStorage.getItem('af-limited-questions') || '[]');
        const restoredIndex = parseInt(sessionStorage.getItem('af-current-index') || '0');

        sessionAnswers = restoredAnswers;
        limitedQuestions = restoredQuestions;
        currentIndex = isNaN(restoredIndex) ? 0 : restoredIndex;
        sessionStarted.set(true);
      } catch (e) {
        console.warn('Failed to restore session', e);
      }
    }
  }

  setTimeout(() => {
    headerReady = true;
  }, 0);
  return () => window.removeEventListener('resize', checkMobile);
});

function isCorrectAnswer(q: Question, key: string) {
	const i = ['a', 'b', 'c', 'd'].indexOf(key);
	return showCorrect && shuffledAnswers[i]?.index === 0;
}

function isSelected(i: number) {
	return selectedAnswerIndex === i;
}

let setSelected = (index: number) => {
  const q = limitedQuestions[currentIndex];
  if (!q) return;

  selectedAnswerIndex = index;
  const isCorrect = shuffledAnswers[index]?.index === 0;

  const alreadyAnswered = sessionAnswers.find((a) => a.questionNumber === q.number);
  if (!alreadyAnswered) {
    const answer = { questionNumber: q.number, selectedIndex: index, isCorrect };
    sessionAnswers.push(answer);
    // Persist session state to sessionStorage
    sessionStorage.setItem('af-session-started', 'true');
    sessionStorage.setItem('af-session-answers', JSON.stringify(sessionAnswers, null, 0));
    sessionStorage.setItem('af-limited-questions', JSON.stringify(limitedQuestions));
    sessionStorage.setItem('af-current-index', currentIndex.toString());
    if (isCorrect) {
      winCount++;
    } else {
      wrongQuestions.push(answer);
    }
    // (Removed: successRate recalculation)
  }

  if (browser) {
    sessionStorage.setItem(`answer-${q.number}`, index.toString());
  }
  // selectedAnswerIndex = null; // REMOVED: keep selected answer for highlighting
};

// ==============================
// Lifecycle
// ==============================
// Update filteredQuestions reactively based on selectedClass (from query param)
$: if (browser && allQuestions.length > 0) {
  // Ensure ?class param is present
  if (window && window.location && window.location.search !== undefined) {
    const currentParams = new URLSearchParams(window.location.search);
    if (!currentParams.has('class')) {
      currentParams.set('class', '1');
      const newUrl = `${window.location.pathname}?${currentParams.toString()}`;
      window.history.replaceState({}, '', newUrl);
    }
  }
  // Now, update filteredQuestions whenever selectedClass changes
  isLoading = true;
  let target: Question[];
  if (selectedClass === '1' || selectedClass === '2' || selectedClass === '3') {
    target = allQuestions.filter((q) => q.class === selectedClass);
  } else if (selectedClass === 'Alle') {
    target = allQuestions;
  } else {
    target = [];
  }
  setTimeout(() => {
    filteredQuestions = target;
    isLoading = false;
  }, 300);
}


// ==============================
// Reactivity
// ==============================
// Selected class from query params (reactive)
$: selectedClass = browser ? get(page).url.searchParams.get('class') ?? '1' : '1';

// Layout class for answers (mobile-aware, 4x1 if any picture on mobile)
$: answerLayoutClass =
  limitedQuestions[currentIndex]
    ? (isLongAnswer(limitedQuestions[currentIndex]) ||
       (isMobile && ['a', 'b', 'c', 'd'].some(k => {
         const key = k as keyof typeof pictureKeys;
         return limitedQuestions[currentIndex][pictureKeys[key]];
       })))
      ? 'grid grid-cols-1 gap-3'
      : 'grid grid-cols-2 gap-3'
    : 'grid grid-cols-2 gap-3';

// Show correct highlight when an answer is selected
$: showCorrect = selectedAnswerIndex !== null;

// limitedQuestions will be set when session starts or resets
let limitedQuestions: Question[] = [];

// Use all session answers for wrong answer review, not just those in limitedQuestions
$: relevantSessionAnswers = sessionAnswers;


// Shuffle answers whenever question changes, but keep shuffle per question
$: if (limitedQuestions.length > 0 && currentIndex >= 0 && currentIndex < limitedQuestions.length) {
  const q = limitedQuestions[currentIndex];
  const previous = sessionAnswers.find(a => a.questionNumber === q.number);
  if (!shuffledMap[q.number]) {
    const answers = [
      { text: q.answer_a, html: q.answerAHtml, index: 0 },
      { text: q.answer_b, html: q.answerBHtml, index: 1 },
      { text: q.answer_c, html: q.answerCHtml, index: 2 },
      { text: q.answer_d, html: q.answerDHtml, index: 3 }
    ];
    shuffledMap[q.number] = [...answers].sort(() => Math.random() - 0.5);
  }
  shuffledAnswers = shuffledMap[q.number];
  selectedAnswerIndex = previous ? previous.selectedIndex : null;
}

// Index of correct answer in shuffledAnswers
$: correctIndex = shuffledAnswers.findIndex(a => a.index === 0);

// Debug logging for session end and review
</script>


{#if isLoading}
  <div class="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
    <div class="w-4 h-4 bg-gray-400 rounded-full animate-pulse"></div>
  </div>
{:else if headerReady}
  {#if !$sessionStarted}
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
              on:click={() => questionLimit = limit}
            >
              {limit}
            </button>
          {/each}
        </div>
        <button
          class="px-10 py-4 text-2xl rounded-full bg-green-600 text-white shadow relative cursor-pointer"
          style="border-radius: 9999px 9999px 9999px 9999px;"
          on:click={async () => {
            // Use fresh selectedClass from page store to avoid stale closure
            const selectedClassNow = get(page).url.searchParams.get('class') ?? '1';
            await tick();
            if (!questions) {
              // @ts-ignore
              questions = $page.data?.fragenkatalog;
              allQuestions = extractQuestions(questions ?? {});
            }

            let target: Question[];
            if (selectedClassNow === '1' || selectedClassNow === '2' || selectedClassNow === '3') {
              target = allQuestions.filter((q) => q.class === selectedClassNow);
            } else {
              target = allQuestions;
            }

            filteredQuestions = target;
            limitedQuestions = [...filteredQuestions].sort(() => Math.random() - 0.5).slice(0, questionLimit);
            sessionAnswers = [];
            shuffledMap = {};
            // Persist session state to sessionStorage before session starts
            sessionStorage.setItem('af-session-started', 'true');
            sessionStorage.setItem('af-session-answers', JSON.stringify(sessionAnswers));
            sessionStorage.setItem('af-limited-questions', JSON.stringify(limitedQuestions));
            sessionStorage.setItem('af-current-index', currentIndex.toString());
            sessionStarted.set(true);
          }}
        >
          Los geht’s!
        </button>
      </div>
    </div>
  {:else if sessionStarted && !sessionEnded}
    <!-- ============================== -->
    <!-- ✅ Unified Question Layout (Desktop & Mobile) -->
    <!-- ============================== -->
    {#if !isMobile}
      <div class="flex flex-col max-w-2xl w-full mx-auto min-h-screen px-4">
        <section
          bind:this={questionsContainer}
          class="w-full flex justify-center items-start pt-[30px]"
          aria-label="Scrollable questions container"
        >
          {#if limitedQuestions.length > 0}
            <div class="w-full flex justify-center pb-[200px]">
              <div class="w-full max-w-2xl">
                {#key currentIndex}
                  {#if limitedQuestions[currentIndex]}
                    <div class="relative">
                      <article
                        data-question-id={limitedQuestions[currentIndex].number}
                        class="w-full max-w-2xl bg-white shadow-md rounded-lg p-4 border border-gray-200 mx-auto"
                      >
                      {#if limitedQuestions[currentIndex].picture_question}
                        <div class="mb-2"></div>
                        <div class="flex justify-center mb-5">
                          <img src={`${base}/svgs-2x/${limitedQuestions[currentIndex].picture_question}.svg`}
                            alt="Bild zur Frage"
                            class="w-auto h-auto mx-auto"
                          />
                        </div>
                      {/if}
                      {#if typeof limitedQuestions[currentIndex].questionHtml === 'string' && limitedQuestions[currentIndex].questionHtml.includes('katex')}
                        <div class="text-center">
                          {@html limitedQuestions[currentIndex].questionHtml}
                        </div>
                      {:else}
                        <div class="text-center">
                          {@html decodeHtmlEntities(limitedQuestions[currentIndex].questionHtml ?? '')}
                        </div>
                      {/if}
                      <div class="h-4"></div>
                      <div class={answerLayoutClass}>
                        {#each shuffledAnswers as answer, i (answer.index)}
                          <button
                            type="button"
                            class="answer-box"
                            class:border-green-600={selectedAnswerIndex !== null && i === correctIndex}
                            class:border-[color:var(--color-theme-1)]={selectedAnswerIndex === i && i !== correctIndex}
                            class:border-gray-300={selectedAnswerIndex === null || (selectedAnswerIndex !== i && i !== correctIndex)}
                            class:bg-green-600={selectedAnswerIndex !== null && i === correctIndex}
                            class:bg-[color:var(--color-theme-1)]={selectedAnswerIndex === i && i !== correctIndex}
                            class:text-white={selectedAnswerIndex !== null && (i === correctIndex || selectedAnswerIndex === i)}
                            on:click={() => selectedAnswerIndex === null && setSelected(i)}
                            data-answer-index={i}
                          >
                            {#if limitedQuestions[currentIndex][pictureKeys[Object.keys(answerKeys)[answer.index] as keyof typeof pictureKeys]]}
                              <img
                                src={`${base}/svgs-2x/${limitedQuestions[currentIndex][pictureKeys[Object.keys(answerKeys)[answer.index] as keyof typeof pictureKeys]]}.svg`}
                                alt={"Bild Antwort " + Object.keys(answerKeys)[answer.index].toUpperCase()}
                                class="w-auto h-auto mx-auto"
                                class:invert={selectedAnswerIndex !== null && (i === correctIndex || selectedAnswerIndex === i)}
                              />
                            {:else if answer.html?.includes('katex')}
                              <div class="text-center">
                                {@html answer.html}
                              </div>
                            {:else}
                              <div class="text-center">
                                {@html answer.html ?? ''}
                              </div>
                            {/if}
                          </button>
                        {/each}
                      </div>
                      <footer class="mt-4 text-[0.6rem] text-gray-500 italic text-center whitespace-normal overflow-auto">
                        {limitedQuestions[currentIndex].number} – {limitedQuestions[currentIndex].section1}; {limitedQuestions[currentIndex].section2}; {limitedQuestions[currentIndex].section3}
                      </footer>
                      </article>
                    </div>
                  {/if}
                {/key}
              </div>
            </div>
          {/if}
        </section>
        {#if limitedQuestions.length > 0}
          <div class="fixed bottom-[10px] left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur px-4 py-3 rounded-full shadow flex justify-between items-center z-50 w-[calc(100%-20px)] max-w-2xl">
            <div class="w-[25%] flex justify-start items-center text-sm text-gray-600 ml-1">
              {currentIndex + 1} / {limitedQuestions.length}
            </div>
            <div class="w-[50%] flex justify-center items-center text-sm text-green-600 whitespace-nowrap truncate font-bold">
              {winCount}
            </div>
            <div class="w-[25%] flex justify-end items-center">
              <button
                class="px-4 py-0 rounded-l-full rounded-r-full bg-red-500 text-white cursor-pointer"
                on:click={showResultsOverlay}
              >
                X
              </button>
            </div>
          </div>
          <!-- Fixed Previous Button -->
          <button
            class="fixed left-4 top-1/2 transform -translate-y-1/2 w-20 h-20 rounded-full bg-white shadow-lg z-50 text-4xl cursor-pointer"
            on:click={() => currentIndex = Math.max(0, currentIndex - 1)}
            disabled={currentIndex === 0}
          >
            ←
          </button>
          <!-- Fixed Next Button -->
          <button
            class="fixed right-4 top-1/2 transform -translate-y-1/2 w-20 h-20 rounded-full bg-white shadow-lg z-50 text-4xl cursor-pointer"
            on:click={() => {
              const q = limitedQuestions[currentIndex];
              if (!sessionAnswers.some((a) => a.questionNumber === q.number)) {
                const skippedAnswer = {
                  questionNumber: q.number,
                  selectedIndex: -1,
                  isCorrect: false
                };
                sessionAnswers.push(skippedAnswer);
                wrongQuestions.push(skippedAnswer);
              }
              // (Removed: successRate recalculation after skip)
              sessionStorage.setItem('af-session-answers', JSON.stringify(sessionAnswers));
              currentIndex = Math.min(limitedQuestions.length - 1, currentIndex + 1);
            }}
            disabled={currentIndex >= limitedQuestions.length - 1}
          >
            →
          </button>
        {/if}
      </div>
    {:else}
      <div class="flex flex-col max-w-full mx-auto min-h-screen px-1 pt-1">
        <section
          bind:this={questionsContainer}
          class="w-full flex justify-center items-start pt-[4px] px-[2px]"
          aria-label="Scrollable questions container"
        >
          {#if limitedQuestions.length > 0}
            <div class="w-full pb-[80px] flex justify-center">
              <div class="w-full max-w-2xl">
                <div class="flex-grow">
                {#key currentIndex}
                  {#if limitedQuestions[currentIndex]}
                    <div class="relative">
                      <article
                        data-question-id={limitedQuestions[currentIndex].number}
                        class="bg-white shadow-md rounded-lg p-4 border border-gray-200"
                      >
                      {#if limitedQuestions[currentIndex].picture_question}
                        <div class="mb-1"></div>
                        <div class="flex justify-center mb-3">
                          <img src={`${base}/svgs-2x/${limitedQuestions[currentIndex].picture_question}.svg`}
                            alt="Bild zur Frage"
                            class="w-auto h-auto mx-auto"
                          />
                        </div>
                      {/if}
                      {#if typeof limitedQuestions[currentIndex].questionHtml === 'string' && limitedQuestions[currentIndex].questionHtml.includes('katex')}
                        <div class="text-center">
                          {@html limitedQuestions[currentIndex].questionHtml}
                        </div>
                      {:else}
                        <div class="text-center">
                          {@html decodeHtmlEntities(limitedQuestions[currentIndex].questionHtml ?? '')}
                        </div>
                      {/if}
                      <div class="h-2"></div>
                      <div class={answerLayoutClass}>
                        {#each shuffledAnswers as answer, i (answer.index)}
                          <button
                            type="button"
                            class="answer-box text-xs"
                            class:border-green-600={selectedAnswerIndex !== null && i === correctIndex}
                            class:border-[color:var(--color-theme-1)]={selectedAnswerIndex === i && i !== correctIndex}
                            class:border-gray-300={selectedAnswerIndex === null || (selectedAnswerIndex !== i && i !== correctIndex)}
                            class:bg-green-600={selectedAnswerIndex !== null && i === correctIndex}
                            class:bg-[color:var(--color-theme-1)]={selectedAnswerIndex === i && i !== correctIndex}
                            class:text-white={selectedAnswerIndex !== null && (i === correctIndex || selectedAnswerIndex === i)}
                            on:click={() => selectedAnswerIndex === null && setSelected(i)}
                            data-answer-index={i}
                          >
                            {#if limitedQuestions[currentIndex][pictureKeys[Object.keys(answerKeys)[answer.index] as keyof typeof pictureKeys]]}
                              <img
                                src={`${base}/svgs-2x/${limitedQuestions[currentIndex][pictureKeys[Object.keys(answerKeys)[answer.index] as keyof typeof pictureKeys]]}.svg`}
                                alt={"Bild Antwort " + Object.keys(answerKeys)[answer.index].toUpperCase()}
                                class="w-auto h-auto mx-auto"
                                class:invert={selectedAnswerIndex !== null && (i === correctIndex || selectedAnswerIndex === i)}
                              />
                            {:else if answer.html?.includes('katex')}
                              <div class="text-center">
                                {@html answer.html}
                              </div>
                            {:else}
                              <div class="text-center">
                                {@html answer.html ?? ''}
                              </div>
                            {/if}
                          </button>
                        {/each}
                      </div>
                      <footer class="mt-4 text-[0.6rem] text-gray-500 italic text-center whitespace-normal overflow-auto">
                        {limitedQuestions[currentIndex].number} – {limitedQuestions[currentIndex].section1}; {limitedQuestions[currentIndex].section2}; {limitedQuestions[currentIndex].section3}
                      </footer>
                      </article>
                    </div>
                  {/if}
                {/key}
                </div>
              </div>
            </div>
          {/if}
        </section>
        {#if limitedQuestions.length > 0}
          <div class="fixed bottom-[10px] left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur px-4 py-3 rounded-full shadow flex justify-between items-center z-50 w-[calc(100%-20px)] max-w-2xl">
            <div class="w-[25%] flex justify-start items-center text-base text-gray-600 ml-1">
              {currentIndex + 1} / {limitedQuestions.length}
            </div>
            <div class="w-[50%] flex justify-center items-center text-base text-green-600 whitespace-nowrap truncate font-bold">
              {winCount}
            </div>
            <div class="w-[25%] flex justify-end items-center">
              <button
                class="px-4 py-1 rounded-l-full rounded-r-full bg-red-500 text-white cursor-pointer text-sm"
                on:click={showResultsOverlay}
              >
                X
              </button>
            </div>
          </div>
          <!-- Fixed Previous Button -->
          <button
            class="fixed left-2 top-120 transform -translate-y-1/2 w-16 h-16 rounded-full bg-white shadow-lg z-50 text-3xl cursor-pointer"
            on:click={() => currentIndex = Math.max(0, currentIndex - 1)}
            disabled={currentIndex === 0}
          >
            ←
          </button>
          <!-- Fixed Next Button -->
          <button
            class="fixed right-2 top-120 transform -translate-y-1/2 w-16 h-16 rounded-full bg-white shadow-lg z-50 text-3xl cursor-pointer"
            on:click={() => {
              const q = limitedQuestions[currentIndex];
              if (!sessionAnswers.some((a) => a.questionNumber === q.number)) {
                const skippedAnswer = {
                  questionNumber: q.number,
                  selectedIndex: -1,
                  isCorrect: false
                };
                sessionAnswers.push(skippedAnswer);
                wrongQuestions.push(skippedAnswer);
              }
              // (Removed: successRate recalculation after skip)
              sessionStorage.setItem('af-session-answers', JSON.stringify(sessionAnswers));
              currentIndex = Math.min(limitedQuestions.length - 1, currentIndex + 1);
            }}
            disabled={currentIndex >= limitedQuestions.length - 1}
          >
            →
          </button>
        {/if}
      </div>
    {/if}
  {/if}
{/if}


<style global>
	html,
	body {
		height: 100%;
		overflow-y: auto;
		scrollbar-width: none;            /* Firefox */
		-ms-overflow-style: none;         /* Internet Explorer/Edge */
	}

	html::-webkit-scrollbar,
	body::-webkit-scrollbar {
		display: none;                    /* Chrome, Safari */
	}

	/* Universal scrollbar hiding for all scrollable containers */
	* {
		scrollbar-width: none;            /* Firefox */
		-ms-overflow-style: none;         /* Internet Explorer/Edge */
	}
	*::-webkit-scrollbar {
		display: none;                    /* Chrome, Safari */
	}

	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	/* @media (max-width: 768px) {
		html,
		body {
			overflow: hidden;
		}
	} */
	/* Prevent double-tap zoom on buttons, links, and question cards */
	button, a, article {
		touch-action: manipulation;
	}


	/* Restore default border for .answer-box in light mode */
	.answer-box {
		border-width: 1px;
		border-style: solid;
		border-color: #d1d5db; /* Tailwind gray-300 */
	}

	/* Ensure white text for right and wrong answers in light mode */
	.answer-box.bg-green-600,
	.answer-box.bg-\[color\:var\(--color-theme-1\)\] {
		color: #fff;
	}

	/* Selected answer borders in light mode */
	.answer-box.bg-green-600 {
		color: #fff;
		border-color: #16a34a;
	}

	.answer-box.bg-\[color\:var\(--color-theme-1\)\] {
		color: #fff;
		border-color: var(--color-theme-1);
	}

	.dark article.bg-white {
		background-color: #1e1e1e;
		border-color: #444;
		color: #eee;
	}

	.dark .text-gray-500 {
		color: #aaa;
	}

	.dark .text-gray-600 {
		color: #ccc;
	}

	.dark .bg-white\/80 {
		background-color: rgba(30, 30, 30, 0.8);
	}

	.dark .bg-white {
		background-color: #222;
	}

	.dark .bg-gray-400 {
		background-color: #888;
	}

	.dark .shadow-md,
	.dark .shadow-lg,
	.dark .shadow {
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
	}

	.dark .answer-box {
		border-width: 1px;
		border-style: solid;
		border-color: #666;
	}

	.dark .answer-box.bg-green-600 {
		background-color: rgba(22, 163, 74, 0.3) !important;
		border-color: rgba(22, 163, 74, 0.3) !important;
	}

	.dark .answer-box.bg-\[color\:var\(--color-theme-1\)\] {
		background-color: rgba(255, 62, 0, 0.3) !important;
		border-color: rgba(255, 62, 0, 0.3) !important;
	}

	.dark .answer-box img,
	.dark article img {
		filter: invert(1) hue-rotate(180deg);
	}
</style>

{#if showResults}
  <div class="fixed inset-0 z-[999] flex items-center justify-center px-4 bg-black/30 backdrop-blur-sm transition-opacity duration-300">
    <div class="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center transform transition-all duration-300 scale-100 opacity-100 min-h-[320px] flex flex-col justify-center items-center">
      {#if winCount >= 19 && Math.round((winCount / questionLimit) * 100) >= 76}
        <p class="text-lg font-bold mb-6">🎉 Super gemacht! Du hast bestanden!</p>
      {:else if Math.round((winCount / questionLimit) * 100) >= 60}
        <p class="text-lg font-bold mt-4 mb-6">😌 Noch nicht ganz – aber du bist fast am Ziel!</p>
      {:else if Math.round((winCount / questionLimit) * 100) < 25}
        <p class="text-lg font-bold mt-4 mb-6">📚 Vielleicht hilft noch etwas Lernen?</p>
      {:else}
        <p class="text-lg font-bold mt-4 mb-6">💡 Leider nicht bestanden!</p>
      {/if}

      <p class="text-3xl font-bold mb-6 {winCount >= 19 && Math.round((winCount / questionLimit) * 100) >= 76 ? 'text-green-600' : 'text-[color:var(--color-theme-1)]'}">
        {winCount} richtige Antworten ({Math.round((winCount / questionLimit) * 100)}%)
      </p>

      <div class="flex justify-around mt-6 gap-4">
        <button
          class="w-16 h-10 py-1 rounded-full text-sm font-medium shadow transition-all cursor-pointer bg-green-600 text-white"
          on:click={() => showResults = false}
        >
          ←
        </button>
        <button
          class="w-16 h-10 py-1 rounded-full text-sm font-medium shadow transition-all cursor-pointer bg-[color:var(--color-theme-1)] text-white"
          on:click={() => {
            sessionEnded = false;
            sessionAnswers = [];
            currentIndex = 0;
            wrongQuestions = [];
            reviewingWrongAnswers = false;
            selectedAnswerIndex = null;
            limitedQuestions = [];
            shuffledMap = {};
            sessionStorage.removeItem('af-session-started');
            sessionStorage.removeItem('af-session-answers');
            sessionStorage.removeItem('af-limited-questions');
            sessionStorage.removeItem('af-current-index');
            sessionStarted.set(false);
            showResults = false;
          }}
        >
          X
        </button>
      </div>
    </div>
  </div>
{/if}