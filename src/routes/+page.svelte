<script lang="ts">
// ==============================
// Imports
// ==============================

// Svelte core
import { onMount, tick } from 'svelte';
import { derived, get } from 'svelte/store';

// App-specific
import { page } from '$app/stores';
import { browser } from '$app/environment';
import { base } from '$app/paths';

// Stores
import { sessionStarted } from '$lib/stores/session';
import { isDarkMode } from '$lib/stores/theme';
import { isMobile } from '$lib/stores/device';

// Components
import SeoHead from '$lib/components/SeoHead.svelte';
import QuestionButtons from '$lib/components/Buttons.svelte';
import SessionFooter from '$lib/components/SessionFooter.svelte';
import NavigationButtons from '$lib/components/Buttons.svelte';
import ResultsOverlay from '$lib/components/ResultsOverlay.svelte';
import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
import Session from '$lib/components/Session.svelte';
import StartControls from '$lib/components/StartControls.svelte';

// Utils
import {
  skipCurrentQuestion,
  startSession,
  handleSkipQuestion,
  resetSession,
  restoreSessionState,
  incrementWinCount,
  updateFilteredQuestions,
  getCorrectIndex,
  getOrShuffleAnswers,
  updateSessionWithAnswer,
  setSelectedAnswer,
  createHandleStartSession
} from '$lib/utils/sessionManager';

import {
  handleAnswerSelect,
  handlePrevQuestion,
  handleNextQuestion,
  handleShowResults as handleShow
} from '$lib/utils/sessionControls';

import {
  initializeOnMount,
  getSelectedClass,
  updateFilteredState,
  syncShuffledState
} from '$lib/utils/sessionLifecycle';

// Types
import type { Question, SessionAnswer, ShuffledAnswer } from '$lib/types';


// ==============================
// State
// ==============================
let headerReady = false;
let questions: any = null;
let allQuestions: Question[] = [];
let filteredQuestions: Question[] = [];
let limitedQuestions: Question[] = [];
let sessionAnswers: SessionAnswer[] = [];
let currentIndex = 0;
let showResults = false;
let selectedAnswerIndex: number | null = null;
let shuffledMap: Record<string, ShuffledAnswer[]> = {};
let wrongQuestions: SessionAnswer[] = [];
let shuffledAnswers: ShuffledAnswer[] = [];
let sessionEnded = false;
let reviewingWrongAnswers = false;
let isLoading = false;
let questionLimit = 25;
let QuestionCard: typeof import('$lib/components/QuestionCard.svelte').default | null = null;
let resultsTriggered = false;


// ==============================
// Derived State
// ==============================
import {
  getWinCount,
  getPassPercentage,
  didPass
} from '$lib/utils/sessionHelpers';

let winCount: number;
let passPercentage: number;
let passed: boolean;
let isMobileValue: boolean;
let selectedClass: string;

const noIndexMeta = derived(page, ($page) => {
  if (!browser || !$page?.url?.searchParams) return false;
  return $page.url.searchParams.has('class');
});


// ==============================
// Event Handlers
// ==============================
function handleSelect(index: number) {
  handleAnswerSelect(
    index,
    selectedAnswerIndex,
    limitedQuestions,
    currentIndex,
    shuffledAnswers,
    sessionAnswers,
    wrongQuestions,
    shuffledMap,
    (v) => selectedAnswerIndex = v,
    (v) => sessionAnswers = v,
    (v) => wrongQuestions = v,
    (v) => winCount = v
  );
}

function handlePrev() {
  handlePrevQuestion(currentIndex, (v) => currentIndex = v);
}

function handleNext() {
  handleNextQuestion(
    sessionAnswers,
    wrongQuestions,
    limitedQuestions,
    currentIndex,
    shuffledMap,
    (v) => sessionAnswers = v,
    (v) => wrongQuestions = v,
    (v) => currentIndex = v
  );
}


// ==============================
// Session Setup
// ==============================
const handleStartSession = createHandleStartSession({
  questionLimit,
  questions,
  allQuestions,
  setQuestions: (v) => questions = v,
  setAllQuestions: (v) => allQuestions = v,
  setFilteredQuestions: (v) => filteredQuestions = v,
  setLimitedQuestions: (v) => limitedQuestions = v,
  setSessionAnswers: (v) => sessionAnswers = v,
  setShuffledMap: (v) => shuffledMap = v,
  setCurrentIndex: (v) => currentIndex = v,
  setIsLoading: (v) => isLoading = v,
  setSessionStarted: (v) => {
    resultsTriggered = false;
    sessionStarted.set(v);
  }
});


// ==============================
// Lifecycle
// ==============================
onMount(() => {
  initializeOnMount(
    QuestionCard,
    (v) => QuestionCard = v,
    (v) => sessionAnswers = v,
    (v) => limitedQuestions = v,
    (v) => currentIndex = v,
    (v) => shuffledMap = v,
    (v) => headerReady = v
  );
});


// ==============================
// Reactive Statements
// ==============================
$: winCount = getWinCount(sessionAnswers);
$: passPercentage = getPassPercentage(winCount, questionLimit);
$: passed = didPass(winCount, passPercentage);
$: isMobileValue = $isMobile;
$: selectedClass = getSelectedClass();

$: if (browser && allQuestions.length > 0) {
  updateFilteredState(
    allQuestions,
    selectedClass,
    (v) => filteredQuestions = v,
    (v) => isLoading = v
  );
}

$: if (limitedQuestions.length > 0 && currentIndex >= 0 && currentIndex < limitedQuestions.length) {
  syncShuffledState(
    limitedQuestions,
    currentIndex,
    sessionAnswers,
    shuffledMap,
    (v) => shuffledAnswers = v,
    (v) => selectedAnswerIndex = v
  );
}

$: correctIndex = getCorrectIndex(shuffledAnswers);

// Show results overlay after last answer with delay
$: if (
  $sessionStarted &&
  sessionAnswers.length === limitedQuestions.length &&
  !sessionEnded &&
  !showResults &&
  !resultsTriggered
) {
  resultsTriggered = true;
  setTimeout(() => {
    showResults = true;
  }, 400);
}
</script>

<SeoHead />

{#if isLoading}
  <LoadingSpinner />
{:else if headerReady}
  {#if !$sessionStarted}
    <StartControls
      {questionLimit}
      onSetLimit={(limit) => questionLimit = limit}
      onStartSession={handleStartSession}
    />
  {:else if sessionStarted && !sessionEnded}
    <Session
      {limitedQuestions}
      {currentIndex}
      {winCount}
      {questionLimit}
      isDarkMode={$isDarkMode}
      {QuestionCard}
      {shuffledAnswers}
      {selectedAnswerIndex}
      {correctIndex}
      {base}
      onSelect={handleSelect}
      onPrev={handlePrev}
      onNext={handleNext}
      onShowResults={() => handleShow((v) => showResults = v)}
    />
  {/if}
{/if}



{#if showResults}
  <ResultsOverlay
    {winCount}
    {questionLimit}
    on:close={() => showResults = false}
    on:restart={() => {
      resultsTriggered = false;
      resetSession({
        setSessionEnded: (v) => sessionEnded = v,
        setSessionAnswers: (v) => sessionAnswers = v,
        setCurrentIndex: (v) => currentIndex = v,
        setWrongQuestions: (v) => wrongQuestions = v,
        setReviewingWrongAnswers: (v) => reviewingWrongAnswers = v,
        setSelectedAnswerIndex: (v) => selectedAnswerIndex = v,
        setLimitedQuestions: (v) => limitedQuestions = v,
        setShuffledMap: (v) => shuffledMap = v,
        setSessionStarted: (v) => sessionStarted.set(v),
        setShowResults: (v) => showResults = v
      });
    }}
  />
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