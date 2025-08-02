import type { SessionAnswer } from '$lib/types';

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
