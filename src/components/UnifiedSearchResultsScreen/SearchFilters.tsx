import type React from 'react';
import type { Dispatch, SetStateAction } from 'react';
import ToggleChip from '../ui/ToggleChip';

interface SearchFiltersProps {
  selectedPriceLevels: number[];
  setSelectedPriceLevels: Dispatch<SetStateAction<number[]>>;
  minRating: number;
  setMinRating: (rating: number) => void;
  minReviews: number;
  setMinReviews: (reviews: number) => void;
  isOpenNow: boolean;
  setIsOpenNow: (isOpen: boolean) => void;
  searchRadius: number;
  setSearchRadius: (radius: number) => void;
}

const PRICE_LEVELS = [
  { value: 1, label: '¥ (安価)' },
  { value: 2, label: '¥¥ (普通)' },
  { value: 3, label: '¥¥¥ (高価)' },
  { value: 4, label: '¥¥¥¥ (非常に高価)' },
];

const RADIUS_OPTIONS = [
  { value: 50, label: '50m' },
  { value: 100, label: '100m' },
  { value: 300, label: '300m' },
  { value: 500, label: '500m' },
];

const SearchFilters: React.FC<SearchFiltersProps> = ({
  selectedPriceLevels,
  setSelectedPriceLevels,
  minRating,
  setMinRating,
  minReviews,
  setMinReviews,
  isOpenNow,
  setIsOpenNow,
  searchRadius,
  setSearchRadius,
}) => {
  const togglePriceLevel = (level: number) => {
    setSelectedPriceLevels((prev) =>
      prev.includes(level)
        ? prev.filter((l) => l !== level)
        : [...prev, level].sort((a, b) => a - b),
    );
  };

  const toggleAllPriceLevels = () => {
    if (selectedPriceLevels.length === PRICE_LEVELS.length) {
      setSelectedPriceLevels([]);
    } else {
      setSelectedPriceLevels(PRICE_LEVELS.map((level) => level.value));
    }
  };

  return (
    <div className="space-y-4">
      {/* 検索範囲 */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-2">
          検索範囲
        </label>
        <div className="flex flex-wrap gap-2">
          {RADIUS_OPTIONS.map((option) => (
            <ToggleChip
              key={option.value}
              selected={searchRadius === option.value}
              onClick={() => setSearchRadius(option.value)}
            >
              {option.label}
            </ToggleChip>
          ))}
        </div>
      </div>

      {/* 価格帯 */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-2">
          価格帯
        </label>
        <div className="flex flex-wrap gap-2">
          <ToggleChip
            selected={selectedPriceLevels.length === PRICE_LEVELS.length}
            onClick={toggleAllPriceLevels}
          >
            {selectedPriceLevels.length === PRICE_LEVELS.length
              ? '全解除'
              : '全選択'}
          </ToggleChip>
          {PRICE_LEVELS.map((level) => (
            <ToggleChip
              key={level.value}
              selected={selectedPriceLevels.includes(level.value)}
              onClick={() => togglePriceLevel(level.value)}
            >
              {level.label}
            </ToggleChip>
          ))}
        </div>
      </div>

      {/* 評価・レビュー数のセレクト（グリッドで並べる） */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">
            最低評価
          </label>
          <select
            value={minRating}
            onChange={(e) => setMinRating(parseFloat(e.target.value))}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
          >
            <option value={0}>指定なし</option>
            <option value={3}>3.0+</option>
            <option value={3.5}>3.5+</option>
            <option value={4}>4.0+</option>
            <option value={4.5}>4.5+</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">
            最低レビュー数
          </label>
          <select
            value={minReviews}
            onChange={(e) => setMinReviews(parseInt(e.target.value))}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
          >
            <option value={0}>指定なし</option>
            <option value={50}>50+</option>
            <option value={100}>100+</option>
            <option value={200}>200+</option>
            <option value={500}>500+</option>
          </select>
        </div>
      </div>

      {/* 営業中のみ表示 */}
      <div className="pt-2 border-t border-gray-100">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isOpenNow}
            onChange={(e) => setIsOpenNow(e.target.checked)}
            className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
          />
          <span className="ml-2 text-sm text-gray-700">営業中のみ表示</span>
        </label>
      </div>
    </div>
  );
};

export default SearchFilters;
