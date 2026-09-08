import type React from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Plus, X } from 'lucide-react';
import { keywordCategories } from '../../utils/keywordOptions';
import ToggleChip from '../ui/ToggleChip';
import { DEFAULT_KEYWORDS, MAX_SELECTED_KEYWORDS } from '../../constants';

interface StoreTypeSelectionProps {
  selectedKeywords: string[];
  setSelectedKeywords: Dispatch<SetStateAction<string[]>>;
  customKeywords: string[];
  onAddCustomKeyword: () => void;
  onRemoveCustomKeyword: (keyword: string) => void;
}

const StoreTypeSelection: React.FC<StoreTypeSelectionProps> = ({
  selectedKeywords,
  setSelectedKeywords,
  customKeywords,
  onAddCustomKeyword,
  onRemoveCustomKeyword,
}) => {
  const toggleKeyword = (keyword: string) => {
    setSelectedKeywords((prev) => {
      if (prev.includes(keyword)) {
        return prev.filter((k) => k !== keyword);
      }
      if (prev.length >= MAX_SELECTED_KEYWORDS) {
        return prev;
      }
      return [...prev, keyword];
    });
  };

  const selectRecommended = () => {
    setSelectedKeywords([...DEFAULT_KEYWORDS]);
  };

  const clearAll = () => {
    setSelectedKeywords([]);
  };

  const isRecommendedSelected =
    selectedKeywords.length === DEFAULT_KEYWORDS.length &&
    DEFAULT_KEYWORDS.every((k) => selectedKeywords.includes(k));

  const atLimit = selectedKeywords.length >= MAX_SELECTED_KEYWORDS;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <ToggleChip
          selected={isRecommendedSelected}
          onClick={selectRecommended}
        >
          おすすめ
        </ToggleChip>
        {selectedKeywords.length > 0 && (
          <ToggleChip selected={false} onClick={clearAll}>
            全解除
          </ToggleChip>
        )}
        <span className="text-xs text-text-muted">
          {selectedKeywords.length}/{MAX_SELECTED_KEYWORDS}
        </span>
      </div>

      {keywordCategories.map((category) => (
        <div key={category.name}>
          <label className="filter-label mb-2 block">{category.name}</label>
          <div className="flex flex-wrap gap-2">
            {category.keywords.map((keyword) => {
              const selected = selectedKeywords.includes(keyword.value);
              const disabled = !selected && atLimit;
              return (
                <ToggleChip
                  key={keyword.value}
                  selected={selected}
                  onClick={() => {
                    if (!disabled) toggleKeyword(keyword.value);
                  }}
                  className={
                    disabled ? 'opacity-40 cursor-not-allowed' : undefined
                  }
                >
                  {keyword.label}
                </ToggleChip>
              );
            })}
          </div>
        </div>
      ))}

      {customKeywords.length > 0 && (
        <div>
          <label className="filter-label mb-2 block">カスタム</label>
          <div className="flex flex-wrap gap-2">
            {customKeywords.map((keyword) => {
              const selected = selectedKeywords.includes(keyword);
              const disabled = !selected && atLimit;
              return (
                <ToggleChip
                  key={keyword}
                  selected={selected}
                  onClick={() => {
                    if (!disabled) toggleKeyword(keyword);
                  }}
                  className={`group${disabled ? ' opacity-40 cursor-not-allowed' : ''}`}
                >
                  {keyword}
                  <X
                    size={14}
                    className="ml-1 inline-block opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveCustomKeyword(keyword);
                    }}
                  />
                </ToggleChip>
              );
            })}
          </div>
        </div>
      )}

      <button onClick={onAddCustomKeyword} className="btn-ghost text-sm">
        <Plus size={16} className="mr-1.5" />
        カスタムキーワードを追加
      </button>
    </div>
  );
};

export default StoreTypeSelection;
