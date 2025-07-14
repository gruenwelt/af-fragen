<svelte:head>
  <title>Übungsmodus – Amateurfunkprüfung Simulator (N, E, A, B, V)</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <meta name="description" content="Simuliere die deutsche Amateurfunkprüfung für die Klassen N, E, A, B und V. Wähle 25, 100 oder 200 Fragen im Übungsmodus mit zufälliger Reihenfolge." />
  <link rel="canonical" href="https://funkfragen.de/" />
  <meta name="keywords" content="Amateurfunk, Prüfungssimulator, Funkprüfung, Klasse N, Klasse E, Klasse A, Klasse B, Klasse V, Prüfungsfragen, Lernapp, Testmodus, Fragenkatalog, Amateurfunkzeugnis" />
  <meta property="og:title" content="Üben – Funkfragen: Prüfungssimulator für Amateurfunk" />
  <meta property="og:description" content="Simuliere die deutsche Amateurfunkprüfung im Übungsmodus: Wähle zufällige Fragen zur deutschen Amateurfunkprüfung (N, E, A, B, V) und bereite dich gezielt vor." />
  <script type="application/ld+json">{ 
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Funkfragen Übungsmodus",
    "url": "https://funkfragen.de",
    "applicationCategory": "EducationalApplication",
    "operatingSystem": "All",
    "description": "Simuliere die deutsche Amateurfunkprüfung für die Klassen N, E, A, B und V. Wähle 25, 100 oder 200 Fragen im Übungsmodus mit zufälliger Reihenfolge.",
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
  {#if $showNoIndex}
    <meta name="robots" content="noindex" />
  {/if}
</svelte:head>

<script lang="ts">
// Imports
// ==============================

import QuestionButtons from '$lib/components/Buttons.svelte';
let headerReady = false;
import { onMount, tick } from 'svelte';
import { isMobile } from '$lib/stores/device';
import { isDarkMode } from '$lib/stores/theme';
let QuestionCard: typeof import('$lib/components/QuestionCard.svelte').default | null = null;
import { browser } from '$app/environment';
import { base } from '$app/paths';
import { sessionStarted } from '$lib/stores/session';
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
// Dynamic imports will be used for collectQuestions and filterQuestionsByClass
import { page } from '$app/stores';
import { derived, get } from 'svelte/store';
const showNoIndex = derived(page, ($page) => {
  // Guard against accessing searchParams during prerendering (when $page.url may not be available)
  if (!browser || !$page?.url?.searchParams) return false;
  return $page.url.searchParams.has('class');
});

// Dark mode tracking
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

function startSession() {
  isLoading = true;
  const selectedClassNow = get(page).url.searchParams.get('class') ?? '1';
  tick().then(async () => {
    if (!QuestionCard) {
      const module = await import('$lib/components/QuestionCard.svelte');
      QuestionCard = module.default;
    }
    if (!questions) {
      const data = get(page).data;
      questions = data?.fragenkatalog;
      if (!questions) {
        const module = await import('$lib/data/fragenkatalog3b_prerendered.json');
        questions = module.default;
      }
      const { collectQuestions } = await import('$lib/utils/questionLoader');
      allQuestions = collectQuestions(questions);
    }

    const { filterQuestionsByClass } = await import('$lib/utils/filterByClass');
    let target: Question[] = filterQuestionsByClass(allQuestions, selectedClassNow);
    filteredQuestions = target;
    limitedQuestions = [...filteredQuestions].sort(() => Math.random() - 0.5).slice(0, questionLimit);
    sessionAnswers = [];
    shuffledMap = {};
    sessionStorage.setItem('af-session-started', 'true');
    sessionStorage.setItem('af-session-answers', JSON.stringify(sessionAnswers));
    sessionStorage.setItem('af-limited-questions', JSON.stringify(limitedQuestions));
    sessionStorage.setItem('af-current-index', currentIndex.toString());
    isLoading = false;
    sessionStarted.set(true);
  });
}

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
    (async () => {
      const { restoreSessionState } = await import('$lib/utils/sessionState');
      const restored = restoreSessionState();
      if (restored) {
        sessionAnswers = restored.sessionAnswers;
        limitedQuestions = restored.limitedQuestions;
        currentIndex = restored.currentIndex;
        sessionStarted.set(true);
      }
    })();
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
  (async () => {
    const { filterQuestionsByClass } = await import('$lib/utils/filterByClass');
    let target: Question[] = filterQuestionsByClass(allQuestions, selectedClass);
    setTimeout(() => {
      filteredQuestions = target;
      isLoading = false;
    }, 300);
  })();
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
    (async () => {
      const { getShuffledAnswers } = await import('$lib/utils/shufflingAnswers');
      shuffledMap[q.number] = getShuffledAnswers(q);
      shuffledAnswers = shuffledMap[q.number];
      selectedAnswerIndex = previous ? previous.selectedIndex : null;
    })();
  } else {
    shuffledAnswers = shuffledMap[q.number];
    selectedAnswerIndex = previous ? previous.selectedIndex : null;
  }
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
    (async () => {
      const { persistSessionState } = await import('$lib/utils/sessionState');
      persistSessionState({ sessionAnswers, limitedQuestions, currentIndex });
    })();
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
    <QuestionButtons {questionLimit} on:setLimit={(e) => questionLimit = e.detail} on:startSession={startSession} />
  {:else if sessionStarted && !sessionEnded}
    <!-- ============================== -->
    <!-- ✅ Unified Question Layout (Desktop & Mobile) -->
    <!-- ============================== -->
    <div class="flex flex-col max-w-2xl w-full mx-auto min-h-screen px-4">
      {#if limitedQuestions.length > 0}
        <section
          bind:this={questionsContainer}
          class="w-full flex justify-center items-start pt-[10px]"
          aria-label="Scrollable questions container"
        >
          <div class="w-full flex justify-center pb-[200px]">
            <div class="w-full max-w-2xl">
              {#key currentIndex}
                {#if QuestionCard}
                  <svelte:component
                    this={QuestionCard}
                    q={limitedQuestions[currentIndex]}
                    {base}
                    {shuffledAnswers}
                    {selectedAnswerIndex}
                    {correctIndex}
                    onSelect={(i: number) => selectedAnswerIndex === null && setSelected(i)}
                  />
                {/if}
              {/key}
            </div>
          </div>
        </section>
      {/if}
      {#if limitedQuestions.length > 0}
        <div class="fixed bottom-[10px] left-1/2 md:left-1/2 -translate-x-1/2 md:-translate-x-1/2 bg-white/80 backdrop-blur px-4 rounded-full shadow flex justify-between items-center z-50 w-[calc(60%)] max-w-full md:w-[calc(60%)] md:max-w-xl">
          <div class="w-[25%] flex justify-start items-center text-sm ml-1">
            {currentIndex + 1} / {limitedQuestions.length}
          </div>
          <div class="w-[50%] flex justify-center items-center text-sm text-green-600 whitespace-nowrap truncate font-bold">
            {winCount}
          </div>
          <div class="w-[25%] flex justify-end items-center pr-0 mr-[-20px]">
            <button
              class="w-12 h-12 rounded-full bg-red-500 text-lg font-bold cursor-pointer text-white"
              on:click={showResultsOverlay}
            >
              X
            </button>
          </div>
        </div>
        <!-- Fixed Previous Button -->
        <button
          class={`fixed left-4 top-[66%] md:top-1/2 transform -translate-y-1/2 w-20 h-20 rounded-full ${$isDarkMode ? 'bg-[#1e1e1e]' : 'bg-[rgba(255,255,255,0.7)]'} shadow-lg z-50 text-4xl cursor-pointer`}
          on:click={() => currentIndex = Math.max(0, currentIndex - 1)}
          disabled={currentIndex === 0}
        >
          ←
        </button>
        <!-- Fixed Next Button -->
        <button
          class={`fixed right-4 top-[66%] md:top-1/2 transform -translate-y-1/2 w-20 h-20 rounded-full ${$isDarkMode ? 'bg-[#1e1e1e]' : 'bg-[rgba(255,255,255,0.7)]'} shadow-lg z-50 text-4xl cursor-pointer`}
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



{#if showResults}
  <div class="fixed inset-0 z-[999] flex items-center justify-center px-4 bg-black/30 backdrop-blur-sm transition-opacity duration-300">
    <div class="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center transform transition-all duration-300 scale-100 opacity-100 min-h-[416px] flex flex-col justify-center items-center">
      {#if winCount >= 19 && Math.round((winCount / questionLimit) * 100) >= 76}
        <p class="text-lg font-bold mt-6 mb-8 leading-relaxed">🎉 Super gemacht! Du hast bestanden!</p>
      {:else if Math.round((winCount / questionLimit) * 100) >= 60}
        <p class="text-lg font-bold mt-6 mb-8 leading-relaxed">😌 Noch nicht ganz – aber du bist fast am Ziel!</p>
      {:else if Math.round((winCount / questionLimit) * 100) < 25}
        <p class="text-lg font-bold mt-6 mb-8 leading-relaxed">📚 Vielleicht hilft noch etwas Lernen?</p>
      {:else}
        <p class="text-lg font-bold mt-6 mb-8 leading-relaxed">💡 Leider nicht bestanden!</p>
      {/if}

      <p class="text-3xl font-bold mb-10 leading-snug {winCount >= 19 && Math.round((winCount / questionLimit) * 100) >= 76 ? 'text-green-600' : 'text-[color:var(--color-theme-1)]'}">
        {winCount} richtige Antworten ({Math.round((winCount / questionLimit) * 100)}%)
      </p>

      <div class="flex justify-around mt-10 gap-6">
        <button
          class="w-24 h-14 py-2 rounded-full text-base font-medium shadow transition-all cursor-pointer bg-blue-600 hover:bg-blue-700 text-white"
          on:click={() => showResults = false}
        >
          ←
        </button>
        <button
          class="w-24 h-14 py-2 rounded-full text-base font-medium shadow transition-all cursor-pointer bg-[color:var(--color-theme-1)] text-white"
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