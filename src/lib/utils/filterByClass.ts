import type { Question } from './questionLoader';

export function filterQuestionsByClass(questions: Question[], selectedClass: string): Question[] {
  if (['1', '2', '3'].includes(selectedClass)) {
    return questions.filter((q) => q.class === selectedClass);
  }
  return questions;
}
