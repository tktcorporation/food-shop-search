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
  { value: 1, label: '¥' },
  { value: 2, label: '¥¥' },
  { value: 3, label: '¥¥¥' },
  { value: 4, label: '¥¥¥¥' },
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
        <label className="filter-label mb-2 block">検索範囲</label>
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
        <label className="filter-label mb-2 block">価格帯</label>
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

      {/* 評価・レビュー数 */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="filter-label mb-1.5 block">最低評価</label>
          <select
            value={minRating}
            onChange={(e) => setMinRating(parseFloat(e.target.value))}
            className="select text-sm !py-1.5"
          >
            <option value={0}>指定なし</option>
            <option value={3}>3.0+</option>
            <option value={3.5}>3.5+</option>
            <option value={4}>4.0+</option>
            <option value={4.5}>4.5+</option>
          </select>
        </div>

        <div>
          <label className="filter-label mb-1.5 block">レビュー数</label>
          <select
            value={minReviews}
            onChange={(e) => setMinReviews(parseInt(e.target.value))}
            className="select text-sm !py-1.5"
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
      <label className="flex items-center cursor-pointer py-1">
        <div className="relative">
          <input
            type="checkbox"
            checked={isOpenNow}
            onChange={(e) => setIsOpenNow(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-primary-100 rounded-full peer peer-checked:bg-primary-600 transition-colors duration-200"></div>
          <div className="absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-200 peer-checked:translate-x-4"></div>
        </div>
        <span className="ml-2.5 text-sm text-text">営業中のみ表示</span>
      </label>
    </div>
  );
};

export default SearchFilters;
