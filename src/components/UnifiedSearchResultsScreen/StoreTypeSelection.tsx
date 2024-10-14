import React from 'react';
import { Plus, X } from 'lucide-react';
import { keyWordOptions } from '../../utils/keywordOptions';

interface StoreTypeSelectionProps {
  selectedKeywords: string[];
  setSelectedKeywords: (keywords: string[]) => void;
  customKeywords: string[];
  setCustomKeywords: (keywords: string[]) => void;
  toggleAllKeywords: () => void;
  toggleKeyword: (keyword: string) => void;
  removeCustomKeyword: (keyword: string) => void;
  setIsModalOpen: (isOpen: boolean) => void;
}

const StoreTypeSelection: React.FC<StoreTypeSelectionProps> = ({
  selectedKeywords,
  toggleAllKeywords,
  toggleKeyword,
  customKeywords,
  removeCustomKeyword,
  setIsModalOpen,
}) => {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        店舗タイプ
      </label>
      <div className="flex flex-wrap gap-2 mb-2">
        <button
          onClick={toggleAllKeywords}
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            selectedKeywords.length === keyWordOptions.length + customKeywords.length
              ? 'bg-primary-500 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          {selectedKeywords.length === keyWordOptions.length + customKeywords.length ? '全解除' : '全選択'}
        </button>
        {[...keyWordOptions, ...customKeywords.map(k => ({ value: k, label: k }))].map((option) => (
          <button
            key={option.value}
            onClick={() => toggleKeyword(option.value)}
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              selectedKeywords.includes(option.value)
                ? 'bg-primary-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            {option.label}
            {customKeywords.includes(option.value) && (
              <X
                size={14}
                className="ml-1 inline-block"
                onClick={(e) => {
                  e.stopPropagation();
                  removeCustomKeyword(option.value);
                }}
              />
            )}
          </button>
        ))}
      </div>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-3 py-1 rounded-full text-sm font-medium bg-secondary-500 text-white"
      >
        <Plus size={14} className="inline-block mr-1" />
        新しい店舗タイプを追加
      </button>
    </div>
  );
};

export default StoreTypeSelection;