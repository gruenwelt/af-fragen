<svelte:head>
	<!-- ============================== -->
	<!-- ✅ Head Metadata               -->
	<!-- ============================== -->
	<title>Fragenkatalog</title>
	<meta name="description" content="Prüfungsfragen zum Erwerb von Amateurfunkprüfungsbescheinigungen" />
</svelte:head>

<script lang="ts">
// ==============================
// Utility functions for dynamic answer/picture keys
// ==============================
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
// Imports
// ==============================
import { onMount } from 'svelte';
import QuestionCard from '$lib/components/QuestionCard.svelte';
import 'katex/dist/katex.min.css';
import { browser } from '$app/environment';
import { get } from 'svelte/store';
import { base } from '$app/paths';
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
// Get questions from layout data
// @ts-ignore
const questions = $page.data?.fragenkatalog;
const allQuestions: Question[] = extractQuestions(questions ?? {});

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
let sessionStarted = false;
let sessionEnded = false;
let reviewingWrongAnswers = false;
let sessionAnswers: SessionAnswer[] = [];
let currentIndex = 0;

// Make winCount reactive to sessionAnswers
$: winCount = sessionAnswers.filter((a) => a.isCorrect).length;
let questionLimit = 25;
let shuffledAnswers: ShuffledAnswer[] = [];
export let selectedAnswerIndex: number | null = null;
const shuffledMap: Record<string, ShuffledAnswer[]> = {};
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
    if (isCorrect) {
      winCount++;
    } else {
      wrongQuestions.push(answer);
    }
  }

  console.log("📥 Answer recorded:", {
    question: q.number,
    selectedIndex: index,
    isCorrect,
    shuffled: shuffledAnswers.map(a => a.index)
  });

  if (browser) {
    sessionStorage.setItem(`answer-${q.number}`, index.toString());
  }
  // selectedAnswerIndex = null; // REMOVED: keep selected answer for highlighting
};

// ==============================
// Lifecycle
// ==============================
onMount(() => {
	console.log("MOUNTED");
	const currentParams = new URLSearchParams(window.location.search);
	if (!currentParams.has('class')) {
		currentParams.set('class', 'Alle');
		const newUrl = `${window.location.pathname}?${currentParams.toString()}`;
		window.history.replaceState({}, '', newUrl);
	}
	if (browser && get(page).url) {
		const c = get(page).url.searchParams.get('class') || 'Alle';
		isLoading = true;
		let target: Question[];
		if (c === '1' || c === '2' || c === '3') {
			target = allQuestions.filter((q) => q.class === c);
		} else if (c === 'Alle') {
			target = allQuestions;
		} else {
			target = [];
		}
		setTimeout(() => {
			filteredQuestions = target;
			isLoading = false;
		}, 300);
	}
});

onMount(() => {
	if (browser && filteredQuestions.length > 0) {
		const saved = sessionStorage.getItem(`answer-${filteredQuestions[currentIndex].number}`);
		if (saved !== null) {
			selectedAnswerIndex = parseInt(saved);
		}
	}
});

// ==============================
// Reactivity
// ==============================
// Selected class from query params (reactive)
$: selectedClass = browser ? get(page).url.searchParams.get('class') || 'Alle' : 'Alle';

// Layout class for answers
$: answerLayoutClass =
  limitedQuestions[currentIndex]
    ? isLongAnswer(limitedQuestions[currentIndex])
      ? 'flex flex-col gap-3'
      : 'grid grid-cols-2 gap-3'
    : 'grid grid-cols-2 gap-3';

// Show correct highlight when an answer is selected
$: showCorrect = selectedAnswerIndex !== null;

// Shuffle questions for the session
$: limitedQuestions = [...filteredQuestions]
	.sort(() => Math.random() - 0.5)
	.slice(0, questionLimit);

// Use all session answers for wrong answer review, not just those in limitedQuestions
$: relevantSessionAnswers = sessionAnswers;

// Win percentage
$: winPercentage = sessionAnswers.length > 0 ? Math.round((winCount / sessionAnswers.length) * 100) : 0;

// Shuffle answers whenever question changes, but keep shuffle per question
$: if (limitedQuestions.length > 0 && currentIndex >= 0 && currentIndex < limitedQuestions.length) {
  selectedAnswerIndex = null;
  const q = limitedQuestions[currentIndex];
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
}

// Index of correct answer in shuffledAnswers
$: correctIndex = shuffledAnswers.findIndex(a => a.index === 0);

// Debug logging for session end and review
$: if (sessionEnded) {
	console.log("📌 Session Ended");
	console.log("✅ sessionAnswers:", sessionAnswers);
	console.log("❌ wrongQuestions:", wrongQuestions);
	console.log("📦 limitedQuestions:", limitedQuestions.map(q => q.number));
	console.log("🔑 comparing against:", wrongQuestions.map(a => a.questionNumber));
}
</script>

{#if isLoading}
  <div class="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
    <div class="w-4 h-4 bg-gray-400 rounded-full animate-pulse"></div>
  </div>
{:else}

  {#if !sessionStarted}
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
          on:click={() => { sessionStarted = true; }}
        >
          Session starten
        </button>
      </div>
    </div>
  {:else if sessionEnded}
    <div class="w-screen flex justify-center items-center min-h-screen">
      <div class="flex flex-col items-center text-center gap-6">
        <h2 class="text-xl font-semibold">Session beendet</h2>
        <p class="text-green-700 text-lg">
          Richtig beantwortet: {winCount} von {sessionAnswers.length} ({winPercentage}%)
        </p>
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
          class="px-10 py-4 text-2xl rounded-full bg-green-600 text-white shadow cursor-pointer"
          on:click={() => {
            sessionEnded = false;
            sessionAnswers = [];
            currentIndex = 0;
            wrongQuestions = [];
            reviewingWrongAnswers = false;
            selectedAnswerIndex = null;
            limitedQuestions = [...filteredQuestions].sort(() => Math.random() - 0.5).slice(0, questionLimit);
          }}
        >
          Neue session starten
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
                          <img src={`${base}/svgs/${limitedQuestions[currentIndex].picture_question}.svg`}
                            alt="Bild zur Frage"
                            class="w-auto h-auto max-h-[300px] mx-auto"
                          />
                        </div>
                      {/if}
                      {#if typeof limitedQuestions[currentIndex].questionHtml === 'string' && limitedQuestions[currentIndex].questionHtml.includes('katex')}
                        <div class="text-center">
                          {@html limitedQuestions[currentIndex].questionHtml}
                        </div>
                      {:else}
                        <div class="text-center">
                          {@html limitedQuestions[currentIndex].questionHtml ?? ''}
                        </div>
                      {/if}
                      <div class="h-4"></div>
                      <div class={answerLayoutClass}>
                        {#each shuffledAnswers as answer, i (answer.index)}
                          <button
                            type="button"
                            class="border border-gray-300 rounded-lg p-3 min-h-[1rem] flex items-center justify-center text-gray-700 cursor-pointer hover:border-[color:var(--color-theme-1)] w-full"
                            class:border-[color:var(--color-theme-1)]={selectedAnswerIndex === i}
                            class:border-green-500={selectedAnswerIndex !== null && i === correctIndex}
                            on:click={() => selectedAnswerIndex === null && setSelected(i)}
                            data-answer-index={i}
                          >
                            {#if limitedQuestions[currentIndex][pictureKeys[Object.keys(answerKeys)[answer.index] as keyof typeof pictureKeys]]}
                              <img src={`${base}/svgs/${limitedQuestions[currentIndex][pictureKeys[Object.keys(answerKeys)[answer.index] as keyof typeof pictureKeys]]}.svg`}
                                alt={"Bild Antwort " + Object.keys(answerKeys)[answer.index].toUpperCase()}
                                class="w-auto h-auto max-h-[300px] mx-auto"
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
                      <footer class="mt-4 text-[0.6rem] text-gray-500 italic text-center whitespace-nowrap overflow-auto">
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
          <div class="fixed bottom-[10px] left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur px-4 py-2 rounded-full shadow flex items-center gap-4 z-50">
            <div class="flex items-center text-sm text-gray-600">
              {currentIndex + 1} / {limitedQuestions.length}
            </div>
            <div class="flex items-center text-sm text-green-600 ml-4">
              Siege: {winCount} ({winPercentage}%)
            </div>
            <button
              class="ml-4 px-4 py-1 rounded-l-full rounded-r-full bg-red-500 text-white cursor-pointer"
              on:click={() => sessionEnded = true}
            >
              X
            </button>
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
            on:click={() => currentIndex = Math.min(limitedQuestions.length - 1, currentIndex + 1)}
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
                          <img src={`${base}/svgs/${limitedQuestions[currentIndex].picture_question}.svg`}
                            alt="Bild zur Frage"
                            class="w-auto h-auto max-h-[160px] mx-auto"
                          />
                        </div>
                      {/if}
                      {#if typeof limitedQuestions[currentIndex].questionHtml === 'string' && limitedQuestions[currentIndex].questionHtml.includes('katex')}
                        <div class="text-center">
                          {@html limitedQuestions[currentIndex].questionHtml}
                        </div>
                      {:else}
                        <div class="text-center">
                          {@html limitedQuestions[currentIndex].questionHtml ?? ''}
                        </div>
                      {/if}
                      <div class="h-2"></div>
                      <div class={answerLayoutClass}>
                        {#each shuffledAnswers as answer, i (answer.index)}
                          <button
                            type="button"
                            class="border border-gray-300 rounded-lg p-2 min-h-[1rem] flex items-center justify-center text-gray-700 cursor-pointer hover:border-[color:var(--color-theme-1)] w-full text-xs"
                            class:border-[color:var(--color-theme-1)]={selectedAnswerIndex === i}
                            class:border-green-500={selectedAnswerIndex !== null && i === correctIndex}
                            on:click={() => selectedAnswerIndex === null && setSelected(i)}
                            data-answer-index={i}
                          >
                            {#if limitedQuestions[currentIndex][pictureKeys[Object.keys(answerKeys)[answer.index] as keyof typeof pictureKeys]]}
                              <img src={`${base}/svgs/${limitedQuestions[currentIndex][pictureKeys[Object.keys(answerKeys)[answer.index] as keyof typeof pictureKeys]]}.svg`}
                                alt={"Bild Antwort " + Object.keys(answerKeys)[answer.index].toUpperCase()}
                                class="w-auto h-auto max-h-[100px] mx-auto"
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
                      <footer class="mt-4 text-[0.6rem] text-gray-500 italic text-center whitespace-nowrap overflow-auto">
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
          <div class="fixed bottom-[10px] left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur px-2 py-2 rounded-full shadow flex items-center gap-2 z-50">
            <div class="flex items-center text-sm text-gray-600">
              {currentIndex + 1} / {limitedQuestions.length}
            </div>
            <div class="flex items-center text-green-600 ml-2 text-sm">
              Siege: {winCount} ({winPercentage}%)
            </div>
            <button
              class="ml-0 px-2 py-0 rounded-l-full rounded-r-full bg-red-500 text-white cursor-pointer text-sm"
              on:click={() => sessionEnded = true}
            >
              X
            </button>
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
            on:click={() => currentIndex = Math.min(limitedQuestions.length - 1, currentIndex + 1)}
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
	}
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	@media (max-width: 768px) {
		html,
		body {
			overflow: hidden;
		}
	}
</style>
