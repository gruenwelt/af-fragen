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
import SessionFooter from '$lib/components/SessionFooter.svelte';
import NavigationButtons from '$lib/components/Buttons.svelte';
import ResultsOverlay from '$lib/components/ResultsOverlay.svelte';
import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
import SessionLayout from '$lib/components/SessionLayout.svelte';
import StartControls from '$lib/components/StartControls.svelte';
let headerReady = false;
import { onMount, tick } from 'svelte';
import { isMobile } from '$lib/stores/device';
import { isDarkMode } from '$lib/stores/theme';
let QuestionCard: typeof import('$lib/components/QuestionCard.svelte').default | null = null;
import { browser } from '$app/environment';
import { sessionStarted } from '$lib/stores/session';
import type { ShuffledAnswer } from '$lib/types';
import { base } from '$app/paths';
// Session state utilities removed as unused
// Use questions from layout data

// ==============================
// Types
// ==============================
import type { Question } from '$lib/types';
import type { SessionAnswer } from '$lib/types';

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
let filteredQuestions: Question[] = [];
let isLoading = false;
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

import { skipCurrentQuestion, startSession, handleSkipQuestion, resetSession, restoreSessionState, incrementWinCount, updateFilteredQuestions, getCorrectIndex, getOrShuffleAnswers } from '$lib/utils/sessionManager';

// ==============================
// Lifecycle & Reactivity
// ==============================

// Mobile detection state
$: isMobileValue = $isMobile;


onMount(() => {
  if (browser) {
    // Eagerly load QuestionCard if not already loaded
    if (!QuestionCard) {
      import('$lib/components/QuestionCard.svelte').then((module) => {
        QuestionCard = module.default;
      });
    }

    restoreSessionState({
      setSessionAnswers: (a: SessionAnswer[]) => sessionAnswers = a,
      setLimitedQuestions: (l: Question[]) => limitedQuestions = l,
      setCurrentIndex: (i: number) => currentIndex = i,
      setShuffledMap: (m: Record<string, ShuffledAnswer[]>) => shuffledMap = m
    });
  }

  setTimeout(() => {
    headerReady = true;
  }, 0);
});

// Selected class from query params (reactive)
$: selectedClass = browser ? get(page).url.searchParams.get('class') ?? '1' : '1';

$: if (browser && allQuestions.length > 0) {
  updateFilteredQuestions({
    allQuestions,
    selectedClass,
    setFilteredQuestions: (v) => filteredQuestions = v,
    setIsLoading: (v) => isLoading = v
  });
}


// limitedQuestions will be set when session starts or resets
let limitedQuestions: Question[] = [];


// Shuffle answers or get from map; set selectedAnswerIndex from previous answer
$: if (limitedQuestions.length > 0 && currentIndex >= 0 && currentIndex < limitedQuestions.length) {
  const q = limitedQuestions[currentIndex];
  const previous = sessionAnswers.find(a => a.questionNumber === q.number);
  (async () => {
    shuffledAnswers = await getOrShuffleAnswers({ q, shuffledMap });
    selectedAnswerIndex = previous ? previous.selectedIndex : null;
  })();
}

// Index of correct answer in shuffledAnswers
$: correctIndex = getCorrectIndex(shuffledAnswers);

// Pass percentage and passed reactive statements
$: passPercentage = Math.round((winCount / questionLimit) * 100);
$: passed = winCount >= 19 && passPercentage >= 76;

import { updateSessionWithAnswer, setSelectedAnswer } from '$lib/utils/sessionManager';
</script>


{#if isLoading}
  <LoadingSpinner />
{:else if headerReady}
  {#if !$sessionStarted}
    <StartControls
      {questionLimit}
      onSetLimit={(limit) => questionLimit = limit}
      onStartSession={() =>
        startSession({
          questionLimit,
          questionsArg: questions,
          allQuestionsArg: allQuestions,
          setQuestions: (v) => questions = v,
          setAllQuestions: (v) => allQuestions = v,
          setFilteredQuestions: (v) => filteredQuestions = v,
          setLimitedQuestions: (v) => limitedQuestions = v,
          setSessionAnswers: (v) => sessionAnswers = v,
          setShuffledMap: (v) => shuffledMap = v,
          setCurrentIndex: (v) => currentIndex = v,
          setIsLoading: (v) => isLoading = v,
          onSessionStart: () => sessionStarted.set(true)
        })
      }
    />
  {:else if sessionStarted && !sessionEnded}
    <SessionLayout
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
      onSelect={(i: number) =>
        selectedAnswerIndex === null && setSelectedAnswer({
          index: i,
          limitedQuestions,
          currentIndex,
          shuffledAnswers,
          sessionAnswers,
          wrongQuestions,
          shuffledMap,
          setSelectedAnswerIndex: (v) => selectedAnswerIndex = v,
          setSessionAnswers: (v) => sessionAnswers = v,
          setWrongQuestions: (v) => wrongQuestions = v,
          incrementWinCount: () => incrementWinCount(winCount, (v) => winCount = v)
        })
      }
      onPrev={() => currentIndex = Math.max(0, currentIndex - 1)}
      onNext={() =>
        handleSkipQuestion({
          sessionAnswers,
          wrongQuestions,
          limitedQuestions,
          currentIndex,
          shuffledMap,
          setSessionAnswers: (v) => sessionAnswers = v,
          setWrongQuestions: (v) => wrongQuestions = v,
          setCurrentIndex: (v) => currentIndex = v
        })
      }
      onShowResults={() => showResults = true}
    />
  {/if}
{/if}



{#if showResults}
  <ResultsOverlay
    {winCount}
    {questionLimit}
    on:close={() => showResults = false}
    on:restart={() =>
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
      })
    }
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