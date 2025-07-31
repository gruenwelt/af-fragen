import { saveSessionStateCustom } from '$lib/utils/sessionState';
import type { SessionAnswer, Question, ShuffledAnswer } from '$lib/types';

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