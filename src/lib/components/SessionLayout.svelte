<script lang="ts">
  import SessionFooter from '$lib/components/SessionFooter.svelte';
  import NavigationButtons from '$lib/components/Buttons.svelte';
  import type { Question, ShuffledAnswer, SessionAnswer } from '$lib/types';

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