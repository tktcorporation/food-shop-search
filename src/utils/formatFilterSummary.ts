const MAX_VISIBLE_LABELS = 3;

export const formatKeywordSummary = (
  selectedKeywords: string[],
  getLabel: (value: string) => string,
): string => {
  if (selectedKeywords.length === 0) return '未選択';

  const visibleLabels = selectedKeywords
    .slice(0, MAX_VISIBLE_LABELS)
    .map(getLabel)
    .join('、');

  const remaining = selectedKeywords.length - MAX_VISIBLE_LABELS;
  return remaining > 0 ? `${visibleLabels} 他${remaining}件` : visibleLabels;
};
