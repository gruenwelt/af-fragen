export type SessionAnswer = {
  questionNumber: string;
  selectedIndex: number;
  isCorrect: boolean;
};

export type ShuffledAnswer = {
  answer: string;
  originalIndex: number;
};

export type Question = {
  number: string;
  question: string;
  answer_a: string;
  answer_b: string;
  answer_c: string;
  correctAnswer: string;
};

export type SessionState = {
  answers: SessionAnswer[];
  questions: Question[];
  currentQuestionIndex: number;
  shuffledMap: Record<string, ShuffledAnswer[]>;
};

export type PersistedSessionState = {
  sessionAnswers: SessionAnswer[];
  limitedQuestions: Question[];
  currentIndex: number;
  shuffledMap: Record<string, ShuffledAnswer[]>;
};

export type RestoredSessionState = PersistedSessionState | null;

export type SessionAnswerType = SessionAnswer;
export type ShuffledAnswerType = ShuffledAnswer;
export type QuestionType = Question;
export type SessionStateType = SessionState;
export type PersistedSessionStateType = PersistedSessionState;
export type RestoredSessionStateType = RestoredSessionState;
