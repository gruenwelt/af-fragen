<svelte:head>
  <title>Übungsmodus – Amateurfunkprüfung Simulator (N, E, A, B, V)</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <meta name="description" content="Simuliere die deutsche Amateurfunkprüfung für die Klassen N, E, A, B und V. Wähle 25, 100 oder 200 Fragen im Übungsmodus mit zufälliger Reihenfolge." />
  <link rel="canonical" href="https://funkfragen.de/" />
  <meta name="keywords" content="Amateurfunk, Prüfungssimulator, Funkprüfung, Klasse N, Klasse E, Klasse A, Klasse B, Klasse V, Prüfungsfragen, Lernapp, Testmodus, Fragenkatalog, Amateurfunkzeugnis" />
  <meta property="og:title" content="Üben – Funkfragen: Prüfungssimulator für Amateurfunk" />
  <meta property="og:description" content="Simuliere die deutsche Amateurfunkprüfung im Übungsmodus: Wähle zufällige Fragen zur deutschen Amateurfunkprüfung (N, E, A, B, V) und bereite dich gezielt vor." />
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "name": "Funkfragen",
        "url": "https://funkfragen.de",
        "description": "Trainiere für die deutsche Amateurfunkprüfung der Klassen N, E, A, B und V mit offiziellen Fragen im Übungsmodus oder als Fragenkatalog.",
        "inLanguage": "de",
        "mainEntityOfPage": "https://funkfragen.de",
        "publisher": {
          "@type": "Organization",
          "name": "Funkfragen"
        }
      },
      {
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
      }
    ]
  }
  </script>
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
import { sessionStarted } from '$lib/stores/session';
import type { ShuffledAnswer } from '$lib/utils/shufflingAnswers';
import { base } from '$app/paths';
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
// let selectedClass: string = 'Alle';
// let questionsContainer: HTMLElement | null = null;
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

// --- Session state management (to be moved to sessionState.ts or sessionManager.ts) ---
function saveSessionStateCustom({
  sessionAnswersArg,
  limitedQuestionsArg,
  currentIndexArg,
  shuffledMapArg
}: {
  sessionAnswersArg: typeof sessionAnswers,
  limitedQuestionsArg: typeof limitedQuestions,
  currentIndexArg: number,
  shuffledMapArg: typeof shuffledMap
}) {
  sessionStorage.setItem('af-session-started', 'true');
  sessionStorage.setItem('af-session-answers', JSON.stringify(sessionAnswersArg));
  sessionStorage.setItem('af-limited-questions', JSON.stringify(limitedQuestionsArg));
  sessionStorage.setItem('af-current-index', currentIndexArg.toString());
  sessionStorage.setItem('af-shuffled-map', JSON.stringify(shuffledMapArg));
}

function saveSessionState() {
  saveSessionStateCustom({
    sessionAnswersArg: sessionAnswers,
    limitedQuestionsArg: limitedQuestions,
    currentIndexArg: currentIndex,
    shuffledMapArg: shuffledMap
  });
}

function clearSessionState() {
  sessionStorage.removeItem('af-session-started');
  sessionStorage.removeItem('af-session-answers');
  sessionStorage.removeItem('af-limited-questions');
  sessionStorage.removeItem('af-current-index');
  sessionStorage.removeItem('af-shuffled-map');
}

/**
 * Skip the current question by providing all state as parameters.
 * Returns the new state after skipping.
 */
function skipCurrentQuestion({
  sessionAnswersArg,
  wrongQuestionsArg,
  limitedQuestionsArg,
  currentIndexArg
}: {
  sessionAnswersArg: SessionAnswer[],
  wrongQuestionsArg: SessionAnswer[],
  limitedQuestionsArg: Question[],
  currentIndexArg: number
}) {
  const q = limitedQuestionsArg[currentIndexArg];
  let sessionAnswersNew = sessionAnswersArg.slice();
  let wrongQuestionsNew = wrongQuestionsArg.slice();
  if (!sessionAnswersNew.some((a) => a.questionNumber === q.number)) {
    const skippedAnswer = {
      questionNumber: q.number,
      selectedIndex: -1,
      isCorrect: false
    };
    sessionAnswersNew.push(skippedAnswer);
    wrongQuestionsNew.push(skippedAnswer);
  }
  const nextIndex = Math.min(limitedQuestionsArg.length - 1, currentIndexArg + 1);
  return { sessionAnswers: sessionAnswersNew, wrongQuestions: wrongQuestionsNew, currentIndex: nextIndex };
}

/**
 * Initializes a new session for the given class, returns the new session state.
 * All dependencies passed as parameters for isolation.
 */
async function initializeSession({
  selectedClassNow,
  questionLimitArg,
  questionsArg,
  allQuestionsArg
}: {
  selectedClassNow: string,
  questionLimitArg: number,
  questionsArg: any,
  allQuestionsArg: Question[]
}) {
  let questionsLocal = questionsArg;
  let allQuestionsLocal = allQuestionsArg;
  if (!QuestionCard) {
    const module = await import('$lib/components/QuestionCard.svelte');
    QuestionCard = module.default;
  }
  if (!questionsLocal) {
    const data = get(page).data;
    questionsLocal = data?.fragenkatalog;
    if (!questionsLocal) {
      const module = await import('$lib/data/fragenkatalog3b_prerendered.json');
      questionsLocal = module.default;
    }
    const { collectQuestions } = await import('$lib/utils/questionLoader');
    allQuestionsLocal = collectQuestions(questionsLocal);
  }
  const { filterQuestionsByClass } = await import('$lib/utils/filterByClass');
  let target: Question[] = filterQuestionsByClass(allQuestionsLocal, selectedClassNow);
  let filteredQuestionsLocal = target;
  let limitedQuestionsLocal = [...filteredQuestionsLocal].sort(() => Math.random() - 0.5).slice(0, questionLimitArg);
  let sessionAnswersLocal: SessionAnswer[] = [];
  let shuffledMapLocal: typeof shuffledMap = {};
  saveSessionStateCustom({
    sessionAnswersArg: sessionAnswersLocal,
    limitedQuestionsArg: limitedQuestionsLocal,
    currentIndexArg: 0,
    shuffledMapArg: shuffledMapLocal
  });
  return {
    questions: questionsLocal,
    allQuestions: allQuestionsLocal,
    filteredQuestions: filteredQuestionsLocal,
    limitedQuestions: limitedQuestionsLocal,
    sessionAnswers: sessionAnswersLocal,
    shuffledMap: shuffledMapLocal,
    currentIndex: 0
  };
}

async function startSession() {
  const selectedClassNow = get(page).url.searchParams.get('class') ?? '1';
  isLoading = true;
  await tick();
  const result = await initializeSession({
    selectedClassNow,
    questionLimitArg: questionLimit,
    questionsArg: questions,
    allQuestionsArg: allQuestions
  });
  questions = result.questions;
  allQuestions = result.allQuestions;
  filteredQuestions = result.filteredQuestions;
  limitedQuestions = result.limitedQuestions;
  sessionAnswers = result.sessionAnswers;
  shuffledMap = result.shuffledMap;
  currentIndex = result.currentIndex;
  isLoading = false;
  sessionStarted.set(true);
}

function showResultsOverlay() {
  showResults = true;
}
// ==============================
// Lifecycle & Reactivity
// ==============================

// Mobile detection state
$: isMobileValue = $isMobile;

/**
 * Returns a function that applies a restored session state to given setters, not bound to lexical scope.
 */
function getApplySessionState({ setSessionAnswers, setLimitedQuestions, setCurrentIndex, setShuffledMap }: {
  setSessionAnswers: (a: typeof sessionAnswers) => void,
  setLimitedQuestions: (l: typeof limitedQuestions) => void,
  setCurrentIndex: (i: number) => void,
  setShuffledMap: (m: typeof shuffledMap) => void
}) {
  return function(restored: {
    sessionAnswers: typeof sessionAnswers,
    limitedQuestions: typeof limitedQuestions,
    currentIndex: number,
    shuffledMap?: typeof shuffledMap
  }) {
    setSessionAnswers(restored.sessionAnswers);
    setLimitedQuestions(restored.limitedQuestions);
    setCurrentIndex(restored.currentIndex);
    setShuffledMap(restored.shuffledMap || {});
  };
}

/**
 * Restores the session state from sessionStorage and initializes UI state.
 * Loads the QuestionCard component if needed.
 * Accepts setter functions for side-effect isolation.
 */
async function restoreAndInitializeSessionCustom({
  setSessionAnswers,
  setLimitedQuestions,
  setCurrentIndex,
  setShuffledMap
}: {
  setSessionAnswers: (a: typeof sessionAnswers) => void,
  setLimitedQuestions: (l: typeof limitedQuestions) => void,
  setCurrentIndex: (i: number) => void,
  setShuffledMap: (m: typeof shuffledMap) => void
}) {
  const { restoreSessionState } = await import('$lib/utils/sessionState');
  const restored = restoreSessionState();
  if (restored) {
    getApplySessionState({
      setSessionAnswers,
      setLimitedQuestions,
      setCurrentIndex,
      setShuffledMap
    })(restored);
    sessionStarted.set(true);
    await tick();
    if (!QuestionCard) {
      const module = await import('$lib/components/QuestionCard.svelte');
      QuestionCard = module.default;
    }
  }
}

onMount(() => {
  if (browser) {
    restoreAndInitializeSessionCustom({
      setSessionAnswers: (a) => sessionAnswers = a,
      setLimitedQuestions: (l) => limitedQuestions = l,
      setCurrentIndex: (i) => currentIndex = i,
      setShuffledMap: (m) => shuffledMap = m
    });
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


// limitedQuestions will be set when session starts or resets
let limitedQuestions: Question[] = [];


// Shuffle answers whenever question changes, but avoid reshuffling if already saved
$: if (limitedQuestions.length > 0 && currentIndex >= 0 && currentIndex < limitedQuestions.length) {
  const q = limitedQuestions[currentIndex];
  const previous = sessionAnswers.find(a => a.questionNumber === q.number);
  if (shuffledMap[q.number]) {
    shuffledAnswers = shuffledMap[q.number];
  } else {
    (async () => {
      const { getShuffledAnswers } = await import('$lib/utils/shufflingAnswers');
      shuffledMap[q.number] = getShuffledAnswers(q);
      shuffledAnswers = shuffledMap[q.number];
    })();
  }
  selectedAnswerIndex = previous ? previous.selectedIndex : null;
}

// Index of correct answer in shuffledAnswers
$: correctIndex = shuffledAnswers.findIndex(a => a.originalIndex === 0);


/**
 * Evaluate if the selected answer is correct for the current question.
 * Returns a boolean. Accepts all data as arguments.
 */
function evaluateAnswer({
  index,
  shuffledAnswersArg
}: {
  index: number,
  shuffledAnswersArg: ShuffledAnswer[]
}): boolean {
  return shuffledAnswersArg[index]?.originalIndex === 0;
}

/**
 * Updates the session state with the given answer.
 * Pure function, returns new state. Accepts a callback for side-effects (e.g. winCount increment).
 */
function updateSessionWithAnswer({
  q,
  index,
  isCorrect,
  sessionAnswersArg,
  wrongQuestionsArg,
  winCallback
}: {
  q: Question,
  index: number,
  isCorrect: boolean,
  sessionAnswersArg: SessionAnswer[],
  wrongQuestionsArg: SessionAnswer[],
  winCallback?: () => void
}) {
  const alreadyAnswered = sessionAnswersArg.find((a) => a.questionNumber === q.number);
  let sessionAnswersNew = sessionAnswersArg.slice();
  let wrongQuestionsNew = wrongQuestionsArg.slice();
  if (!alreadyAnswered) {
    const answer = { questionNumber: q.number, selectedIndex: index, isCorrect };
    sessionAnswersNew.push(answer);
    if (isCorrect) {
      if (winCallback) winCallback();
    } else {
      wrongQuestionsNew.push(answer);
    }
    saveSessionStateCustom({
      sessionAnswersArg: sessionAnswersNew,
      limitedQuestionsArg: limitedQuestions,
      currentIndexArg: currentIndex,
      shuffledMapArg: shuffledMap
    });
  }
  return { sessionAnswers: sessionAnswersNew, wrongQuestions: wrongQuestionsNew };
}

let setSelected = (index: number) => {
  const q = limitedQuestions[currentIndex];
  if (!q) return;
  selectedAnswerIndex = index;
  const isCorrect = evaluateAnswer({ index, shuffledAnswersArg: shuffledAnswers });
  const { sessionAnswers: sessionAnswersNew, wrongQuestions: wrongQuestionsNew } = updateSessionWithAnswer({
    q,
    index,
    isCorrect,
    sessionAnswersArg: sessionAnswers,
    wrongQuestionsArg: wrongQuestions,
    winCallback: () => { winCount++; }
  });
  sessionAnswers = sessionAnswersNew;
  wrongQuestions = wrongQuestionsNew;
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
                    {shuffledAnswers}
                    {selectedAnswerIndex}
                    {correctIndex}
                    base={base}
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
              on:click={() => {
                showResultsOverlay();
              }}
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
            const { sessionAnswers: sa, wrongQuestions: wq, currentIndex: ci } = skipCurrentQuestion({
              sessionAnswersArg: sessionAnswers,
              wrongQuestionsArg: wrongQuestions,
              limitedQuestionsArg: limitedQuestions,
              currentIndexArg: currentIndex
            });
            sessionAnswers = sa;
            wrongQuestions = wq;
            currentIndex = ci;
            saveSessionState();
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
            clearSessionState();
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
<style>
  :global(html), :global(body) {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  :global(html::-webkit-scrollbar), :global(body::-webkit-scrollbar) {
    display: none;
  }
</style>