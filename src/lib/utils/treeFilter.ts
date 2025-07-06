export function filterTreeByClass(tree: any[], selectedClass: string): any[] {
  function filterSection(section: any): any | null {
    if (selectedClass === 'Alle' || !section.classes || section.classes.includes(selectedClass)) {
      const filtered = {
        ...section,
        sections: section.sections?.map(filterSection).filter(Boolean) ?? [],
        questions: section.questions ?? []
      };
      return filtered.sections.length > 0 || (section.question_numbers?.length ?? 0) > 0 ? filtered : null;
    }
    return null;
  }

  return tree.map(filterSection).filter(Boolean);
}
