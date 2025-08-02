import type { SessionAnswer, Question, ShuffledAnswer } from '$lib/types';
import { setSelectedAnswer, handleSkipQuestion, incrementWinCount } from './sessionManager';

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