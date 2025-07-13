import type { Question } from './questionLoader';

export function filterQuestionsByClass(questions: Question[], selectedClass: string): Question[] {
  if (['1', '2', '3', 'B', 'V'].includes(selectedClass)) {
    return questions.filter((q) => q.topLevelClass === selectedClass);
  }
  return questions;
}
