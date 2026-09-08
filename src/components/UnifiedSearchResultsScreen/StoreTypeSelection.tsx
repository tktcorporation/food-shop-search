import type React from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Plus, X } from 'lucide-react';
import { keywordCategories } from '../../utils/keywordOptions';
import ToggleChip from '../ui/ToggleChip';

interface StoreTypeSelectionProps {
  selectedKeywords: string[];
  setSelectedKeywords: Dispatch<SetStateAction<string[]>>;
  customKeywords: string[];
  onAddCustomKeyword: () => void;
  onRemoveCustomKeyword: (keyword: string) => void;
}

const allDefaultKeywords = keywordCategories.flatMap((c) =>
  c.keywords.map((k) => k.value),
);

const StoreTypeSelection: React.FC<StoreTypeSelectionProps> = ({
  selectedKeywords,
  setSelectedKeywords,
  customKeywords,
  onAddCustomKeyword,
  onRemoveCustomKeyword,
}) => {
  const toggleKeyword = (keyword: string) => {
    setSelectedKeywords((prev) =>
      prev.includes(keyword)
        ? prev.filter((k) => k !== keyword)
        : [...prev, keyword],
    );
  };

  const toggleAllKeywords = () => {
    const allKeywords = [...allDefaultKeywords, ...customKeywords];
    if (selectedKeywords.length === allKeywords.length) {
      setSelectedKeywords([]);
    } else {
      setSelectedKeywords(allKeywords);
    }
  };

  const isAllSelected =
    selectedKeywords.length ===
    allDefaultKeywords.length + customKeywords.length;

  return (
    <div className="space-y-4">
      {/* 全選択/全解除 */}
      <ToggleChip selected={isAllSelected} onClick={toggleAllKeywords}>
        {isAllSelected ? '全解除' : '全選択'}
      </ToggleChip>

      {/* カテゴリ別チップ */}
      {keywordCategories.map((category) => (
        <div key={category.name}>
          <label className="filter-label mb-2 block">{category.name}</label>
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
      ))}

      {/* カスタムキーワード */}
      {customKeywords.length > 0 && (
        <div>
          <label className="filter-label mb-2 block">カスタム</label>
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
                  className="ml-1 inline-block opacity-0 group-hover:opacity-100 transition-opacity"
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

      {/* カスタムキーワード追加 */}
      <button onClick={onAddCustomKeyword} className="btn-ghost text-sm">
        <Plus size={16} className="mr-1.5" />
        カスタムキーワードを追加
      </button>
    </div>
  );
};

export default StoreTypeSelection;
