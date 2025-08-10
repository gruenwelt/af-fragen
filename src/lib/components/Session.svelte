<script lang="ts">
  import SessionFooter from '$lib/components/SessionFooter.svelte';
  import NavigationButtons from '$lib/components/Buttons.svelte';
  import type { Question, ShuffledAnswer, SessionAnswer } from '$lib/types';
  import { onMount, onDestroy } from 'svelte';
  import { getSelectedClass, getTimeLimitMinutes } from '$lib/utils/sessionLogic';

  export let onSelect: (index: number) => void;

  export let limitedQuestions: Question[] = [];
  export let currentIndex: number;
  export let winCount: number;
  export let questionLimit: number;
  export let isDarkMode: boolean;
  export let QuestionCard: any;
  export let shuffledAnswers: ShuffledAnswer[] = [];
  export let selectedAnswerIndex: number | null;
  export let correctIndex: number;
  export let base: string;
  export let onPrev: () => void;
  export let onNext: () => void;
  export let onShowResults: () => void;

  // --- Timer state (25-question sessions only) ---
  let endAtMs: number | null = null;
  let remainingMs = 0;
  let intervalId: ReturnType<typeof setInterval> | null = null;

  // Determine default limit from class filter: class '3' (E->A) -> 60, others -> 45; only when 25 questions
  $: defaultLimit = getTimeLimitMinutes(getSelectedClass(), questionLimit);
  $: activeLimitMinutes = defaultLimit !== null ? defaultLimit : null;

  function tickTimer() {
    if (endAtMs == null) return;
    const now = Date.now();
    remainingMs = Math.max(0, endAtMs - now);
    if (remainingMs === 0 && intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function startTimerIfNeeded() {
    if (activeLimitMinutes == null) return;
    if (endAtMs == null) {
      endAtMs = Date.now() + activeLimitMinutes * 60_000;
    }
    tickTimer();
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(tickTimer, 1000);
  }

  function stopTimer() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  // React when session/questions become available or when the limit condition changes
  $: {
    if (limitedQuestions.length > 0 && activeLimitMinutes != null) {
      startTimerIfNeeded();
    } else {
      stopTimer();
      endAtMs = null;
      remainingMs = 0;
    }
  }

  onMount(() => {
    if (limitedQuestions.length > 0 && activeLimitMinutes != null) {
      startTimerIfNeeded();
    }
  });

  onDestroy(() => {
    stopTimer();
  });

  function formatTimer(ms: number): string {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');
    return `${mm}:${ss}`;
  }

  $: timerString = activeLimitMinutes != null && endAtMs != null ? formatTimer(remainingMs) : null;
</script>

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
                {base}
                onSelect={onSelect}
              />
            {/if}
          {/key}
        </div>
      </div>
    </section>
    <SessionFooter
      {currentIndex}
      {limitedQuestions}
      {winCount}
      timer={timerString}
      on:showResults={() => onShowResults()}
    />
    <NavigationButtons
      {currentIndex}
      {questionLimit}
      {isDarkMode}
      sessionActive={true}
      on:prev={() => onPrev()}
      on:next={() => onNext()}
    />
  {/if}
</div>