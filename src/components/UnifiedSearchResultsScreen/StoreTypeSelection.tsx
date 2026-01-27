import { useState } from 'react';
import type React from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import { keywordCategories } from '../../utils/keywordOptions';

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
      <label className="block text-sm font-medium text-gray-700 mb-2">
        店舗タイプ
      </label>

      <button
        onClick={toggleAllKeywords}
        className={`mb-2 px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200
          ${
            selectedKeywords.length ===
            keywordCategories.flatMap((c) => c.keywords).length
              ? 'bg-primary-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
      >
        {selectedKeywords.length ===
        keywordCategories.flatMap((c) => c.keywords).length
          ? '全解除'
          : '全選択'}
      </button>

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
              className="border rounded-lg overflow-hidden"
            >
              <div className="flex items-center bg-gray-50">
                <button
                  onClick={(e) => toggleCategoryKeywords(category.keywords, e)}
                  className={`flex-1 px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2`}
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center
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
                        className="w-3 h-3 text-white"
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
                  <span className="font-medium flex-1">{category.name}</span>
                  <span className="text-sm text-gray-500">
                    {selectedCount}/{categoryKeywords.length}
                  </span>
                </button>
                <button
                  onClick={(e) => toggleCategory(category.name, e)}
                  className="px-4 py-2 hover:bg-gray-100"
                >
                  {expandedCategories.includes(category.name) ? (
                    <ChevronUp size={20} />
                  ) : (
                    <ChevronDown size={20} />
                  )}
                </button>
              </div>

              {expandedCategories.includes(category.name) && (
                <div className="p-2 bg-white">
                  <div className="flex flex-wrap gap-2">
                    {category.keywords.map((keyword) => (
                      <button
                        key={keyword.value}
                        onClick={() => toggleKeyword(keyword.value)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200
                          ${
                            selectedKeywords.includes(keyword.value)
                              ? 'bg-primary-500 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                      >
                        {keyword.label}
                      </button>
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
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            カスタム検索タイプ
          </h4>
          <div className="flex flex-wrap gap-2">
            {customKeywords.map((keyword) => (
              <button
                key={keyword}
                onClick={() => toggleKeyword(keyword)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 group
                  ${
                    selectedKeywords.includes(keyword)
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
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
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onAddCustomKeyword}
        className="mt-4 px-3 py-1 rounded-full text-sm font-medium bg-secondary-500 text-white transition-colors duration-200 hover:bg-secondary-600"
      >
        <Plus size={14} className="inline-block mr-1" />
        新しい店舗タイプを追加
      </button>
    </div>
  );
};

export default StoreTypeSelection;
