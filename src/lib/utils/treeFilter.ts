type SectionNode = {
  title?: string;
  sections?: SectionNode[];
  question_numbers?: string[];
  questions?: any[];
};

function inferTopLevelClass(title: string): '1' | '2' | '3' | 'B' | 'V' | undefined {
  if (title.includes('Technische')) return undefined; // defer to question class
  if (title.includes('Betriebliche')) return 'B';
  if (title.includes('Vorschriften')) return 'V';
  return undefined;
}

function hasMatchingQuestionNumbers(section: SectionNode, prefix: string): boolean {
  return (
    (section.question_numbers?.some(q => q.startsWith(prefix)) ?? false) ||
    (section.sections?.some(s => hasMatchingQuestionNumbers(s, prefix)) ?? false)
  );
}

export function filterTreeByClass(tree: SectionNode[], selectedClass: string): SectionNode[] {
  function filterSection(section: SectionNode, topLevelTitle: string): SectionNode | null {
    const inferred = inferTopLevelClass(topLevelTitle);
    const classToPrefixMap: Record<string, string> = { '1': 'N', '2': 'E', '3': 'A' };
    const classPrefix = classToPrefixMap[selectedClass];

    const isMatchingSection =
      selectedClass === 'Alle' ||
      (inferred === undefined &&
        classPrefix &&
        hasMatchingQuestionNumbers(section, classPrefix)) ||
      inferred === selectedClass;

    if (isMatchingSection) {
      const filtered = {
        ...section,
        sections: section.sections?.map((s) => filterSection(s, topLevelTitle)).filter(Boolean) as SectionNode[] ?? [],
        questions: section.questions ?? []
      };
      return filtered.sections.length > 0 || (section.question_numbers?.length ?? 0) > 0 ? filtered : null;
    }

    return null;
  }

  return tree.map((s) => filterSection(s, s.title ?? '')).filter(Boolean) as SectionNode[];
}
