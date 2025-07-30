export function restoreSessionState() {
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
}: {
  sessionAnswers: any[];
  limitedQuestions: any[];
  currentIndex: number;
  shuffledMap: Record<string, any>;
}) {
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