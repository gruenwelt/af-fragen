

import { browser } from '$app/environment';
import { get } from 'svelte/store';
import { page } from '$app/stores';
import { restoreSessionState, updateFilteredQuestions, getOrShuffleAnswers } from './sessionManager';
import type { Question, SessionAnswer, ShuffledAnswer } from '$lib/types';

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
  return browser ? get(page).url.searchParams.get('class') ?? '1' : '1';
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