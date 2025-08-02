export type { Question } from '$lib/types';
import type { Question } from '$lib/types';

export function collectQuestions(tree: any, path: string[] = []): Question[] {
  const sections = tree.sections ?? tree;
  let questions: Question[] = [];
  for (const section of sections) {
    const currentPath = [...path, section.title];
    if (section.questions) {
      questions.push(
        ...section.questions.map((q: any) => ({
          ...q,
          section1: (currentPath[0] || '').replace('Prüfungsfragen im Prüfungsteil: ', ''),
          section2: currentPath[1] || '',
          section3: currentPath[2] || '',
          topLevelClass:
            currentPath[0]?.includes('Technische')
              ? q.class
              : currentPath[0]?.includes('Betriebliche')
              ? 'B'
              : currentPath[0]?.includes('Vorschriften')
              ? 'V'
              : undefined
        }))
      );
    }
    if (section.sections) {
      questions.push(...collectQuestions(section.sections, currentPath));
    }
  }
  return questions;
}