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
// Imports
// ==============================

let headerReady = false;
import { onMount, tick } from 'svelte';
import { isMobile } from '$lib/stores/device';
import QuestionCard from '$lib/components/QuestionCard.svelte';
import { browser } from '$app/environment';
import { get } from 'svelte/store';
import { base } from '$app/paths';
import { sessionStarted } from '$lib/stores/session';
import { restoreSessionState, persistSessionState } from '$lib/utils/sessionState';
import { getShuffledAnswers } from '$lib/utils/shufflingAnswers';
import type { ShuffledAnswer } from '$lib/utils/shufflingAnswers';
// Use questions from layout data

// ==============================
// Types
// ==============================
import type { Question } from '$lib/utils/questionLoader';

type SessionAnswer = { questionNumber: string; selectedIndex: number; isCorrect: boolean };

// ==============================
// Data & Derived Data
// ==============================
import { collectQuestions } from '$lib/utils/questionLoader';
import { filterQuestionsByClass } from '$lib/utils/filterByClass';
import { page } from '$app/stores';
// Questions and allQuestions will be initialized reactively before session starts
let questions: any = null;
let allQuestions: Question[] = [];


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

let questionLimit = 25;
let shuffledAnswers: ShuffledAnswer[] = [];
export let selectedAnswerIndex: number | null = null;
let shuffledMap: Record<string, ShuffledAnswer[]> = {};
let wrongQuestions: SessionAnswer[] = [];

// ==============================
// Functions and Utilities
// ==============================

function showResultsOverlay() {
  showResults = true;
}
// ==============================
// Lifecycle & Reactivity
// ==============================

// Mobile detection state
$: isMobileValue = $isMobile;

onMount(() => {
  // Restore session state from sessionStorage if available
  if (browser) {
    const restored = restoreSessionState();
    if (restored) {
      sessionAnswers = restored.sessionAnswers;
      limitedQuestions = restored.limitedQuestions;
      currentIndex = restored.currentIndex;
      sessionStarted.set(true);
    }
  }

  setTimeout(() => {
    headerReady = true;
  }, 0);
});

// Selected class from query params (reactive)
$: selectedClass = browser ? get(page).url.searchParams.get('class') ?? '1' : '1';

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
  let target: Question[] = filterQuestionsByClass(allQuestions, selectedClass);
  setTimeout(() => {
    filteredQuestions = target;
    isLoading = false;
  }, 300);
}

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
    shuffledMap[q.number] = getShuffledAnswers(q);
  }
  shuffledAnswers = shuffledMap[q.number];
  selectedAnswerIndex = previous ? previous.selectedIndex : null;
}

// Index of correct answer in shuffledAnswers
$: correctIndex = shuffledAnswers.findIndex(a => a.originalIndex === 0);

let setSelected = (index: number) => {
  const q = limitedQuestions[currentIndex];
  if (!q) return;

  selectedAnswerIndex = index;
  const isCorrect = shuffledAnswers[index]?.originalIndex === 0;

  const alreadyAnswered = sessionAnswers.find((a) => a.questionNumber === q.number);
  if (!alreadyAnswered) {
    const answer = { questionNumber: q.number, selectedIndex: index, isCorrect };
    sessionAnswers.push(answer);
    // Persist session state to sessionStorage
    persistSessionState({ sessionAnswers, limitedQuestions, currentIndex });
    if (isCorrect) {
      winCount++;
    } else {
      wrongQuestions.push(answer);
    }
  }

  if (browser) {
    sessionStorage.setItem(`answer-${q.number}`, index.toString());
  }
};
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
            const selectedClassNow = get(page).url.searchParams.get('class') ?? '1';
            await tick();
            if (!questions) {
              const data = get(page).data;
              questions = data?.fragenkatalog;
              if (!questions) {
                const module = await import('$lib/data/fragenkatalog3b_prerendered.json');
                questions = module.default;
              }
              allQuestions = collectQuestions(questions);
            }

            let target: Question[] = filterQuestionsByClass(allQuestions, selectedClassNow);
            filteredQuestions = target;
            limitedQuestions = [...filteredQuestions].sort(() => Math.random() - 0.5).slice(0, questionLimit);
            sessionAnswers = [];
            shuffledMap = {};
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
    <div class="flex flex-col max-w-2xl w-full mx-auto min-h-screen px-4">
      <section
        bind:this={questionsContainer}
        class="w-full flex justify-center items-start pt-[10px]"
        aria-label="Scrollable questions container"
      >
        {#if limitedQuestions.length > 0}
          <div class="w-full flex justify-center pb-[200px]">
            <div class="w-full max-w-2xl">
              {#key currentIndex}
                {#if limitedQuestions[currentIndex]}
                  <QuestionCard
                    q={limitedQuestions[currentIndex]}
                    {base}
                    {shuffledAnswers}
                    {selectedAnswerIndex}
                    {correctIndex}
                    onSelect={(i) => selectedAnswerIndex === null && setSelected(i)}
                  />
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
          class="fixed left-4 top-[66%] md:top-1/2 transform -translate-y-1/2 w-20 h-20 rounded-full bg-white shadow-lg z-50 text-4xl cursor-pointer"
          on:click={() => currentIndex = Math.max(0, currentIndex - 1)}
          disabled={currentIndex === 0}
        >
          ←
        </button>
        <!-- Fixed Next Button -->
        <button
          class="fixed right-4 top-[66%] md:top-1/2 transform -translate-y-1/2 w-20 h-20 rounded-full bg-white shadow-lg z-50 text-4xl cursor-pointer"
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


<style global>
  html,
  body,
  * {
    scrollbar-width: none;            /* Firefox */
    -ms-overflow-style: none;         /* IE/Edge */
  }

  html::-webkit-scrollbar,
  body::-webkit-scrollbar,
  *::-webkit-scrollbar {
    display: none;                    /* Chrome/Safari */
  }

  /* Dark mode overrides */
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
          class="w-16 h-10 py-1 rounded-full text-sm font-medium shadow transition-all cursor-pointer bg-blue-600 text-white hover:bg-blue-700"
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