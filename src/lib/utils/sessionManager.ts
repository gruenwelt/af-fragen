import { getApplySessionState } from '$lib/utils/sessionState';
import { saveSessionState } from '$lib/utils/sessionState';
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
import { tick } from 'svelte';
import { get } from 'svelte/store';
import { page } from '$app/stores';

import { saveSessionStateCustom } from '$lib/utils/sessionState';
import type { SessionAnswer, Question, ShuffledAnswer } from '$lib/types';
import { clearSessionState } from '$lib/utils/sessionState';

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
  const selectedClassNow = get(page).url.searchParams.get('class') ?? '1';
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
  getApplySessionState({
    setSessionAnswers,
    setLimitedQuestions,
    setCurrentIndex,
    setShuffledMap
  });
}