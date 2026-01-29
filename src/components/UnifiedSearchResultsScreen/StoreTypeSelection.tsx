import { useState } from 'react';
import type React from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import { keywordCategories } from '../../utils/keywordOptions';
import ToggleChip from '../ui/ToggleChip';

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
  // Initialize with all categories expanded
  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    keywordCategories.map((category) => category.name),
  );

  const toggleCategory = (categoryName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCategories((prev) =>
      prev.includes(categoryName)
        ? prev.filter((name) => name !== categoryName)
        : [...prev, categoryName],
    );
  };

  const toggleKeyword = (keyword: string) => {
    setSelectedKeywords((prev) =>
      prev.includes(keyword)
        ? prev.filter((k) => k !== keyword)
        : [...prev, keyword],
    );
  };

  const toggleCategoryKeywords = (
    categoryKeywords: { value: string }[],
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    const categoryValues = categoryKeywords.map((k) => k.value);
    const allSelected = categoryValues.every((value) =>
      selectedKeywords.includes(value),
    );

    if (allSelected) {
      setSelectedKeywords((prev) =>
        prev.filter((k) => !categoryValues.includes(k)),
      );
    } else {
      setSelectedKeywords((prev) => {
        const filtered = prev.filter((k) => !categoryValues.includes(k));
        return [...filtered, ...categoryValues];
      });
    }
  };

  const toggleAllKeywords = () => {
    const allKeywords = keywordCategories.flatMap((category) =>
      category.keywords.map((k) => k.value),
    );

    if (selectedKeywords.length === allKeywords.length) {
      setSelectedKeywords([]);
    } else {
      setSelectedKeywords(allKeywords);
    }
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-text mb-2">
        店舗タイプ
      </label>

      <ToggleChip
        selected={
          selectedKeywords.length ===
          keywordCategories.flatMap((c) => c.keywords).length
        }
        onClick={toggleAllKeywords}
        className="mb-2"
      >
        {selectedKeywords.length ===
        keywordCategories.flatMap((c) => c.keywords).length
          ? '全解除'
          : '全選択'}
      </ToggleChip>

      <div className="space-y-2">
        {keywordCategories.map((category) => {
          const categoryKeywords = category.keywords.map((k) => k.value);
          const selectedCount = categoryKeywords.filter((k) =>
            selectedKeywords.includes(k),
          ).length;
          const isPartiallySelected =
            selectedCount > 0 && selectedCount < categoryKeywords.length;
          const isFullySelected = selectedCount === categoryKeywords.length;

          return (
            <div
              key={category.name}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              <div className="flex items-center bg-surface-muted">
                <button
                  onClick={(e) => toggleCategoryKeywords(category.keywords, e)}
                  className="flex-1 px-4 py-2 text-left hover:bg-gray-200 flex items-center gap-2 cursor-pointer transition-colors duration-200"
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors duration-200
                    ${
                      isFullySelected
                        ? 'bg-primary-500 border-primary-500'
                        : isPartiallySelected
                          ? 'bg-primary-200 border-primary-500'
                          : 'border-gray-300'
                    }`}
                  >
                    {isFullySelected && (
                      <svg
                        className="w-3 h-3 text-text-inverse"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                    {isPartiallySelected && (
                      <div className="w-2 h-2 bg-primary-500 rounded-sm"></div>
                    )}
                  </div>
                  <span className="font-medium flex-1 text-text">
                    {category.name}
                  </span>
                  <span className="text-sm text-text-muted">
                    {selectedCount}/{categoryKeywords.length}
                  </span>
                </button>
                <button
                  onClick={(e) => toggleCategory(category.name, e)}
                  className="px-4 py-2 hover:bg-gray-200 cursor-pointer transition-colors duration-200"
                >
                  {expandedCategories.includes(category.name) ? (
                    <ChevronUp size={20} />
                  ) : (
                    <ChevronDown size={20} />
                  )}
                </button>
              </div>

              {expandedCategories.includes(category.name) && (
                <div className="p-3 bg-surface-card">
                  <div className="flex flex-wrap gap-2">
                    {category.keywords.map((keyword) => (
                      <ToggleChip
                        key={keyword.value}
                        selected={selectedKeywords.includes(keyword.value)}
                        onClick={() => toggleKeyword(keyword.value)}
                      >
                        {keyword.label}
                      </ToggleChip>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {customKeywords.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-text mb-2">
            カスタム検索タイプ
          </h4>
          <div className="flex flex-wrap gap-2">
            {customKeywords.map((keyword) => (
              <ToggleChip
                key={keyword}
                selected={selectedKeywords.includes(keyword)}
                onClick={() => toggleKeyword(keyword)}
                className="group"
              >
                {keyword}
                <X
                  size={14}
                  className="ml-1 inline-block opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveCustomKeyword(keyword);
                  }}
                />
              </ToggleChip>
            ))}
          </div>
        </div>
      )}

      <button onClick={onAddCustomKeyword} className="btn-cta mt-4 text-sm">
        <Plus size={14} className="inline-block mr-1" />
        新しい店舗タイプを追加
      </button>
    </div>
  );
};

export default StoreTypeSelection;
