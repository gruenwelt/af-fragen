export interface ShuffledAnswer {
  html: string;
  picture?: string;
  originalIndex: number;
}

export function getShuffledAnswers(q: any): ShuffledAnswer[] {
  const answers: ShuffledAnswer[] = ['a', 'b', 'c', 'd'].map((key, idx) => ({
    html: q[`answer${key.toUpperCase()}Html`],
    picture: q[`picture_${key}`],
    originalIndex: idx
  }));

  return [...answers].sort(() => Math.random() - 0.5);
}
