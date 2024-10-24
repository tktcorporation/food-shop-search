import React from 'react';
import { Plus, X } from 'lucide-react';
import { keyWordOptions, getKeywordLabel } from '../../utils/keywordOptions';

interface StoreTypeSelectionProps {
  selectedKeywords: string[];
  setSelectedKeywords: (keywords: string[]) => void;
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
    setSelectedKeywords(prev =>
      prev.includes(keyword)
        ? prev.filter(k => k !== keyword)
        : [...prev, keyword]
    );
  };

  const toggleAllKeywords = () => {
    const allKeywords = [...keyWordOptions, ...customKeywords.map(k => ({ value: k }))];
    if (selectedKeywords.length === allKeywords.length) {
      setSelectedKeywords([]);
    } else {
      setSelectedKeywords(allKeywords.map(option => option.value));
    }
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        店舗タイプ
      </label>
      <div className="flex flex-wrap gap-2 mb-2">
        <button
          onClick={toggleAllKeywords}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200
            ${selectedKeywords.length === keyWordOptions.length + customKeywords.length
              ? 'bg-primary-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          {selectedKeywords.length === keyWordOptions.length + customKeywords.length ? '全解除' : '全選択'}
        </button>
        {[...keyWordOptions, ...customKeywords.map(k => ({ value: k, label: k }))].map((option) => (
          <button
            key={option.value}
            onClick={() => toggleKeyword(option.value)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200
              ${selectedKeywords.includes(option.value)
                ? 'bg-primary-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            {getKeywordLabel(option.value)}
            {customKeywords.includes(option.value) && (
              <X
                size={14}
                className="ml-1 inline-block"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveCustomKeyword(option.value);
                }}
              />
            )}
          </button>
        ))}
      </div>
      <button
        onClick={onAddCustomKeyword}
        className="px-3 py-1 rounded-full text-sm font-medium bg-secondary-500 text-white transition-colors duration-200 hover:bg-secondary-600"
      >
        <Plus size={14} className="inline-block mr-1" />
        新しい店舗タイプを追加
      </button>
    </div>
  );
};

export default StoreTypeSelection;