import { tick } from 'svelte';
import { get } from 'svelte/store';
import { onMount } from 'svelte';
import { page } from '$app/stores';
import { browser } from '$app/environment';


import type {
  SessionAnswer,
  Question,
  ShuffledAnswer,
  PersistedSessionState
} from '$lib/types';
export async function initializeSession({
  selectedClassNow,
  questionLimitArg,
  questionsArg,
  allQuestionsArg
}: {
  selectedClassNow: string;
  questionLimitArg: number;
  questionsArg: any;
  allQuestionsArg: Question[];
}) {
  let questionsLocal = questionsArg;
  let allQuestionsLocal = allQuestionsArg;

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
  const filteredQuestionsLocal = filterQuestionsByClass(allQuestionsLocal, selectedClassNow);
  const limitedQuestionsLocal = [...filteredQuestionsLocal].sort(() => Math.random() - 0.5).slice(0, questionLimitArg);
  const sessionAnswersLocal: SessionAnswer[] = [];
  const shuffledMapLocal: Record<string, ShuffledAnswer[]> = {};

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

export function skipCurrentQuestion({
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


export function evaluateAnswer({
  index,
  shuffledAnswersArg
}: {
  index: number,
  shuffledAnswersArg: ShuffledAnswer[]
}): boolean {
  return shuffledAnswersArg[index]?.originalIndex === 0;
}

export function updateSessionWithAnswer({
  q,
  index,
  isCorrect,
  sessionAnswersArg,
  wrongQuestionsArg,
  winCallback,
  limitedQuestionsArg,
  currentIndexArg,
  shuffledMapArg
}: {
  q: Question,
  index: number,
  isCorrect: boolean,
  sessionAnswersArg: SessionAnswer[],
  wrongQuestionsArg: SessionAnswer[],
  winCallback?: () => void,
  limitedQuestionsArg: Question[],
  currentIndexArg: number,
  shuffledMapArg: Record<string, ShuffledAnswer[]>
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
      limitedQuestionsArg,
      currentIndexArg,
      shuffledMapArg
    });
  }
  return { sessionAnswers: sessionAnswersNew, wrongQuestions: wrongQuestionsNew };
}
export function showResultsOverlay(setShowResults: (v: boolean) => void) {
  setShowResults(true);
}

export function setSelectedAnswer({
  index,
  limitedQuestions,
  currentIndex,
  shuffledAnswers,
  sessionAnswers,
  wrongQuestions,
  shuffledMap,
  setSelectedAnswerIndex,
  setSessionAnswers,
  setWrongQuestions,
  incrementWinCount
}: {
  index: number;
  limitedQuestions: Question[];
  currentIndex: number;
  shuffledAnswers: ShuffledAnswer[];
  sessionAnswers: SessionAnswer[];
  wrongQuestions: SessionAnswer[];
  shuffledMap: Record<string, ShuffledAnswer[]>;
  setSelectedAnswerIndex: (v: number) => void;
  setSessionAnswers: (v: SessionAnswer[]) => void;
  setWrongQuestions: (v: SessionAnswer[]) => void;
  incrementWinCount: () => void;
}) {
  const q = limitedQuestions[currentIndex];
  if (!q) return;

  setSelectedAnswerIndex(index);

  const isCorrect = evaluateAnswer({ index, shuffledAnswersArg: shuffledAnswers });

  const { sessionAnswers: sessionAnswersNew, wrongQuestions: wrongQuestionsNew } = updateSessionWithAnswer({
    q,
    index,
    isCorrect,
    sessionAnswersArg: sessionAnswers,
    wrongQuestionsArg: wrongQuestions,
    winCallback: incrementWinCount,
    limitedQuestionsArg: limitedQuestions,
    currentIndexArg: currentIndex,
    shuffledMapArg: shuffledMap
  });

  setSessionAnswers(sessionAnswersNew);
  setWrongQuestions(wrongQuestionsNew);

  if (typeof window !== 'undefined') {
    sessionStorage.setItem(`answer-${q.number}`, index.toString());
  }
}

export async function startSession({
  questionLimit,
  questionsArg,
  allQuestionsArg,
  setQuestions,
  setAllQuestions,
  setFilteredQuestions,
  setLimitedQuestions,
  setSessionAnswers,
  setShuffledMap,
  setCurrentIndex,
  setIsLoading,
  onSessionStart
}: {
  questionLimit: number;
  questionsArg: any;
  allQuestionsArg: Question[];
  setQuestions: (v: any) => void;
  setAllQuestions: (v: Question[]) => void;
  setFilteredQuestions: (v: Question[]) => void;
  setLimitedQuestions: (v: Question[]) => void;
  setSessionAnswers: (v: SessionAnswer[]) => void;
  setShuffledMap: (v: Record<string, ShuffledAnswer[]>) => void;
  setCurrentIndex: (v: number) => void;
  setIsLoading: (v: boolean) => void;
  onSessionStart: () => void;
}) {
  const selectedClassNow = get(page).url.searchParams.get('class') ?? 'V';
  setIsLoading(true);
  await tick();
  const result = await initializeSession({
    selectedClassNow,
    questionLimitArg: questionLimit,
    questionsArg,
    allQuestionsArg
  });
  setQuestions(result.questions);
  setAllQuestions(result.allQuestions);
  setFilteredQuestions(result.filteredQuestions);
  setLimitedQuestions(result.limitedQuestions);
  setSessionAnswers(result.sessionAnswers);
  setShuffledMap(result.shuffledMap);
  setCurrentIndex(result.currentIndex);
  setIsLoading(false);
  onSessionStart();
}
export function handleSkipQuestion({
  sessionAnswers,
  wrongQuestions,
  limitedQuestions,
  currentIndex,
  shuffledMap,
  setSessionAnswers,
  setWrongQuestions,
  setCurrentIndex
}: {
  sessionAnswers: SessionAnswer[];
  wrongQuestions: SessionAnswer[];
  limitedQuestions: Question[];
  currentIndex: number;
  shuffledMap: Record<string, ShuffledAnswer[]>;
  setSessionAnswers: (v: SessionAnswer[]) => void;
  setWrongQuestions: (v: SessionAnswer[]) => void;
  setCurrentIndex: (v: number) => void;
}) {
  const { sessionAnswers: sa, wrongQuestions: wq, currentIndex: ci } = skipCurrentQuestion({
    sessionAnswersArg: sessionAnswers,
    wrongQuestionsArg: wrongQuestions,
    limitedQuestionsArg: limitedQuestions,
    currentIndexArg: currentIndex
  });

  setSessionAnswers(sa);
  setWrongQuestions(wq);
  setCurrentIndex(ci);

  saveSessionState(sa, limitedQuestions, ci, shuffledMap);
}


export function resetSession({
  setSessionEnded,
  setSessionAnswers,
  setCurrentIndex,
  setWrongQuestions,
  setReviewingWrongAnswers,
  setSelectedAnswerIndex,
  setLimitedQuestions,
  setShuffledMap,
  setSessionStarted,
  setShowResults
}: {
  setSessionEnded: (v: boolean) => void;
  setSessionAnswers: (v: SessionAnswer[]) => void;
  setCurrentIndex: (v: number) => void;
  setWrongQuestions: (v: SessionAnswer[]) => void;
  setReviewingWrongAnswers: (v: boolean) => void;
  setSelectedAnswerIndex: (v: number | null) => void;
  setLimitedQuestions: (v: Question[]) => void;
  setShuffledMap: (v: Record<string, ShuffledAnswer[]>) => void;
  setSessionStarted: (v: boolean) => void;
  setShowResults: (v: boolean) => void;
}) {
  setSessionEnded(false);
  setSessionAnswers([]);
  setCurrentIndex(0);
  setWrongQuestions([]);
  setReviewingWrongAnswers(false);
  setSelectedAnswerIndex(null);
  setLimitedQuestions([]);
  setShuffledMap({});
  clearSessionState();
  setSessionStarted(false);
  setShowResults(false);
}
// Wrapper to apply restored session state to stores
export function restoreSessionState({
  setSessionAnswers,
  setLimitedQuestions,
  setCurrentIndex,
  setShuffledMap
}: {
  setSessionAnswers: (v: SessionAnswer[]) => void;
  setLimitedQuestions: (v: Question[]) => void;
  setCurrentIndex: (v: number) => void;
  setShuffledMap: (v: Record<string, ShuffledAnswer[]>) => void;
}) {
  return getApplySessionState({
    setSessionAnswers,
    setLimitedQuestions,
    setCurrentIndex,
    setShuffledMap
  });
}
// Utility function to increment win count
export function incrementWinCount(current: number, set: (v: number) => void) {
  set(current + 1);
}
// Update filtered questions based on class and update URL if needed
export async function updateFilteredQuestions({
  allQuestions,
  selectedClass,
  setFilteredQuestions,
  setIsLoading
}: {
  allQuestions: Question[];
  selectedClass: string;
  setFilteredQuestions: (q: Question[]) => void;
  setIsLoading: (v: boolean) => void;
}) {
  if (typeof window !== 'undefined' && window.location?.search !== undefined) {
    const currentParams = new URLSearchParams(window.location.search);
    if (!currentParams.has('class')) {
      currentParams.set('class', 'V');
      const newUrl = `${window.location.pathname}?${currentParams.toString()}`;
      window.history.replaceState({}, '', newUrl);
    }
  }

  setIsLoading(true);
  const { filterQuestionsByClass } = await import('$lib/utils/filterByClass');
  const target = filterQuestionsByClass(allQuestions, selectedClass);
  setTimeout(() => {
    setFilteredQuestions(target);
    setIsLoading(false);
  }, 300);
}
export function getCorrectIndex(shuffled: ShuffledAnswer[]): number {
  return shuffled.findIndex(a => a.originalIndex === 0);
}

export async function getOrShuffleAnswers({
  q,
  shuffledMap
}: {
  q: Question;
  shuffledMap: Record<string, ShuffledAnswer[]>;
}): Promise<ShuffledAnswer[]> {
  if (shuffledMap[q.number]) {
    return shuffledMap[q.number];
  } else {
    const { getShuffledAnswers } = await import('$lib/utils/shufflingAnswers');
    const shuffled = getShuffledAnswers(q);
    shuffledMap[q.number] = shuffled;
    return shuffled;
  }
}

export function calculateWinCount(answers: SessionAnswer[]): number {
  return answers.filter((a) => a.isCorrect).length;
}

// Factory function to create a handler for starting a session
export function createHandleStartSession({
  questionLimit,
  questions,
  allQuestions,
  setQuestions,
  setAllQuestions,
  setFilteredQuestions,
  setLimitedQuestions,
  setSessionAnswers,
  setShuffledMap,
  setCurrentIndex,
  setIsLoading,
  setSessionStarted
}: {
  questionLimit: number;
  questions: any;
  allQuestions: Question[];
  setQuestions: (v: any) => void;
  setAllQuestions: (v: Question[]) => void;
  setFilteredQuestions: (v: Question[]) => void;
  setLimitedQuestions: (v: Question[]) => void;
  setSessionAnswers: (v: SessionAnswer[]) => void;
  setShuffledMap: (v: Record<string, ShuffledAnswer[]>) => void;
  setCurrentIndex: (v: number) => void;
  setIsLoading: (v: boolean) => void;
  setSessionStarted: (v: boolean) => void;
}) {
  return () => {
    startSession({
      questionLimit,
      questionsArg: questions,
      allQuestionsArg: allQuestions,
      setQuestions,
      setAllQuestions,
      setFilteredQuestions,
      setLimitedQuestions,
      setSessionAnswers,
      setShuffledMap,
      setCurrentIndex,
      setIsLoading,
      onSessionStart: () => setSessionStarted(true)
    });
  };
}

export function handleAnswerSelect(
  i: number,
  selectedAnswerIndex: number | null,
  limitedQuestions: Question[],
  currentIndex: number,
  shuffledAnswers: ShuffledAnswer[],
  sessionAnswers: SessionAnswer[],
  wrongQuestions: SessionAnswer[],
  shuffledMap: Record<string, ShuffledAnswer[]>,
  setSelectedAnswerIndex: (v: number) => void,
  setSessionAnswers: (v: SessionAnswer[]) => void,
  setWrongQuestions: (v: SessionAnswer[]) => void,
  setWinCount: (v: number) => void
) {
  if (selectedAnswerIndex !== null) return;
  setSelectedAnswer({
    index: i,
    limitedQuestions,
    currentIndex,
    shuffledAnswers,
    sessionAnswers,
    wrongQuestions,
    shuffledMap,
    setSelectedAnswerIndex,
    setSessionAnswers,
    setWrongQuestions,
    incrementWinCount: () => incrementWinCount(sessionAnswers.filter(a => a.isCorrect).length, setWinCount)
  });
}

export function handlePrevQuestion(
  currentIndex: number,
  setCurrentIndex: (v: number) => void
) {
  setCurrentIndex(Math.max(0, currentIndex - 1));
}

export function handleNextQuestion(
  sessionAnswers: SessionAnswer[],
  wrongQuestions: SessionAnswer[],
  limitedQuestions: Question[],
  currentIndex: number,
  shuffledMap: Record<string, ShuffledAnswer[]>,
  setSessionAnswers: (v: SessionAnswer[]) => void,
  setWrongQuestions: (v: SessionAnswer[]) => void,
  setCurrentIndex: (v: number) => void
) {
  handleSkipQuestion({
    sessionAnswers,
    wrongQuestions,
    limitedQuestions,
    currentIndex,
    shuffledMap,
    setSessionAnswers,
    setWrongQuestions,
    setCurrentIndex
  });
}

export function handleShowResults(setShowResults: (v: boolean) => void) {
  setShowResults(true);
}

export function handleSelect(
  index: number,
  selectedAnswerIndex: number | null,
  limitedQuestions: Question[],
  currentIndex: number,
  shuffledAnswers: ShuffledAnswer[],
  sessionAnswers: SessionAnswer[],
  wrongQuestions: SessionAnswer[],
  shuffledMap: Record<string, ShuffledAnswer[]>,
  setSelectedAnswerIndex: (v: number) => void,
  setSessionAnswers: (v: SessionAnswer[]) => void,
  setWrongQuestions: (v: SessionAnswer[]) => void,
  setWinCount: (v: number) => void
) {
  handleAnswerSelect(
    index,
    selectedAnswerIndex,
    limitedQuestions,
    currentIndex,
    shuffledAnswers,
    sessionAnswers,
    wrongQuestions,
    shuffledMap,
    setSelectedAnswerIndex,
    setSessionAnswers,
    setWrongQuestions,
    setWinCount
  );
}

export function handlePrev(currentIndex: number, setCurrentIndex: (v: number) => void) {
  handlePrevQuestion(currentIndex, setCurrentIndex);
}

export function handleNext(
  sessionAnswers: SessionAnswer[],
  wrongQuestions: SessionAnswer[],
  limitedQuestions: Question[],
  currentIndex: number,
  shuffledMap: Record<string, ShuffledAnswer[]>,
  setSessionAnswers: (v: SessionAnswer[]) => void,
  setWrongQuestions: (v: SessionAnswer[]) => void,
  setCurrentIndex: (v: number) => void
) {
  handleNextQuestion(
    sessionAnswers,
    wrongQuestions,
    limitedQuestions,
    currentIndex,
    shuffledMap,
    setSessionAnswers,
    setWrongQuestions,
    setCurrentIndex
  );
}



export function getWinCount(sessionAnswers: SessionAnswer[]): number {
  return sessionAnswers.filter((a) => a.isCorrect).length;
}

export function getPassPercentage(winCount: number, questionLimit: number): number {
  return Math.round((winCount / questionLimit) * 100);
}

export function didPass(winCount: number, passPercentage: number): boolean {
  return winCount >= 19 && passPercentage >= 76;
}

export function getSessionMetrics(answers: SessionAnswer[], questionLimit: number) {
  const winCount = getWinCount(answers);
  const passPercentage = getPassPercentage(winCount, questionLimit);
  const passed = didPass(winCount, passPercentage);
  return { winCount, passPercentage, passed };
}




export function initializeOnMount(
  QuestionCard: any,
  setQuestionCard: (q: any) => void,
  setSessionAnswers: (a: SessionAnswer[]) => void,
  setLimitedQuestions: (q: Question[]) => void,
  setCurrentIndex: (i: number) => void,
  setShuffledMap: (m: Record<string, ShuffledAnswer[]>) => void,
  setHeaderReady: (v: boolean) => void
) {
  if (browser) {
    if (!QuestionCard) {
      import('$lib/components/QuestionCard.svelte').then((module) => {
        setQuestionCard(module.default);
      });
    }

    restoreSessionState({
      setSessionAnswers,
      setLimitedQuestions,
      setCurrentIndex,
      setShuffledMap
    });
  }

  setTimeout(() => {
    setHeaderReady(true);
  }, 0);
}

export function getSelectedClass(): string {
  return browser ? get(page).url.searchParams.get('class') ?? 'V' : 'V';
}

export function getTimeLimitMinutes(selectedClass: string, questionLimit: number): number | null {
  if (questionLimit !== 25) return null;
  // Class '3' corresponds to E->A based on existing filters
  return selectedClass === '3' ? 60 : 45;
}

export function updateFilteredState(
  allQuestions: Question[],
  selectedClass: string,
  setFilteredQuestions: (q: Question[]) => void,
  setIsLoading: (v: boolean) => void
) {
  updateFilteredQuestions({
    allQuestions,
    selectedClass,
    setFilteredQuestions,
    setIsLoading
  });
}

export async function syncShuffledState(
  limitedQuestions: Question[],
  currentIndex: number,
  sessionAnswers: SessionAnswer[],
  shuffledMap: Record<string, ShuffledAnswer[]>,
  setShuffledAnswers: (a: ShuffledAnswer[]) => void,
  setSelectedAnswerIndex: (i: number | null) => void
) {
  const q = limitedQuestions[currentIndex];
  const previous = sessionAnswers.find(a => a.questionNumber === q.number);
  const shuffled = await getOrShuffleAnswers({ q, shuffledMap });
  setShuffledAnswers(shuffled);
  setSelectedAnswerIndex(previous ? previous.selectedIndex : null);
}
export function runSessionOnMount(
  QuestionCard: any,
  setQuestionCard: (q: any) => void,
  setSessionAnswers: (a: SessionAnswer[]) => void,
  setLimitedQuestions: (q: Question[]) => void,
  setCurrentIndex: (i: number) => void,
  setShuffledMap: (m: Record<string, ShuffledAnswer[]>) => void,
  setHeaderReady: (v: boolean) => void
) {
  onMount(() => {
    initializeOnMount(
      QuestionCard,
      setQuestionCard,
      setSessionAnswers,
      setLimitedQuestions,
      setCurrentIndex,
      setShuffledMap,
      setHeaderReady
    );
  });
}


// --- Session State Persistence Functions ---

export function restoreSessionStateRaw() {
  try {
    const started = sessionStorage.getItem('af-session-started') === 'true';
    if (!started) return null;

    return {
      sessionAnswers: JSON.parse(sessionStorage.getItem('af-session-answers') || '[]'),
      limitedQuestions: JSON.parse(sessionStorage.getItem('af-limited-questions') || '[]'),
      currentIndex: parseInt(sessionStorage.getItem('af-current-index') || '0'),
      shuffledMap: JSON.parse(sessionStorage.getItem('af-shuffled-map') || '{}')
    };
  } catch (e) {
    console.warn('Failed to restore session state', e);
    return null;
  }
}

export function persistSessionState({
  sessionAnswers,
  limitedQuestions,
  currentIndex,
  shuffledMap
}: PersistedSessionState) {
  sessionStorage.setItem('af-session-started', 'true');
  sessionStorage.setItem('af-session-answers', JSON.stringify(sessionAnswers));
  sessionStorage.setItem('af-limited-questions', JSON.stringify(limitedQuestions));
  sessionStorage.setItem('af-current-index', currentIndex.toString());
  sessionStorage.setItem('af-shuffled-map', JSON.stringify(shuffledMap));
}

export function clearSessionState() {
  sessionStorage.removeItem('af-session-started');
  sessionStorage.removeItem('af-session-answers');
  sessionStorage.removeItem('af-limited-questions');
  sessionStorage.removeItem('af-current-index');
  sessionStorage.removeItem('af-shuffled-map');
}

// Save session state with custom argument names
export function saveSessionStateCustom({
  sessionAnswersArg,
  limitedQuestionsArg,
  currentIndexArg,
  shuffledMapArg
}: {
  sessionAnswersArg: SessionAnswer[];
  limitedQuestionsArg: Question[];
  currentIndexArg: number;
  shuffledMapArg: Record<string, ShuffledAnswer[]>;
}) {
  persistSessionState({
    sessionAnswers: sessionAnswersArg,
    limitedQuestions: limitedQuestionsArg,
    currentIndex: currentIndexArg,
    shuffledMap: shuffledMapArg
  });
}

// Save session state with positional arguments
export function saveSessionState(
  sessionAnswers: SessionAnswer[],
  limitedQuestions: Question[],
  currentIndex: number,
  shuffledMap: Record<string, ShuffledAnswer[]>
) {
  saveSessionStateCustom({
    sessionAnswersArg: sessionAnswers,
    limitedQuestionsArg: limitedQuestions,
    currentIndexArg: currentIndex,
    shuffledMapArg: shuffledMap
  });
}

// Apply session state to handlers
export function getApplySessionState({
  setSessionAnswers,
  setLimitedQuestions,
  setCurrentIndex,
  setShuffledMap
}: {
  setSessionAnswers: (a: SessionAnswer[]) => void;
  setLimitedQuestions: (q: Question[]) => void;
  setCurrentIndex: (i: number) => void;
  setShuffledMap: (m: Record<string, ShuffledAnswer[]>) => void;
}) {
  const restored = restoreSessionStateRaw();
  if (!restored) return false;

  setSessionAnswers(restored.sessionAnswers);
  setLimitedQuestions(restored.limitedQuestions);
  setCurrentIndex(restored.currentIndex);
  setShuffledMap(restored.shuffledMap);

  return true;
}