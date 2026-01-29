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
    <div className="card space-y-5">
      {/* Search Radius */}
      <div>
        <label className="block text-sm font-semibold text-text mb-3">
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

      <div className="divider !my-4" />

      {/* Price Levels */}
      <div>
        <label className="block text-sm font-semibold text-text mb-3">
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

      <div className="divider !my-4" />

      {/* Min Rating & Reviews */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-text mb-2">
            最低評価
          </label>
          <select
            value={minRating}
            onChange={(e) => setMinRating(parseFloat(e.target.value))}
            className="select"
          >
            <option value={0}>指定なし</option>
            <option value={3}>3以上</option>
            <option value={3.5}>3.5以上</option>
            <option value={4}>4以上</option>
            <option value={4.5}>4.5以上</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-text mb-2">
            最低レビュー数
          </label>
          <select
            value={minReviews}
            onChange={(e) => setMinReviews(parseInt(e.target.value))}
            className="select"
          >
            <option value={0}>指定なし</option>
            <option value={50}>50件以上</option>
            <option value={100}>100件以上</option>
            <option value={200}>200件以上</option>
            <option value={500}>500件以上</option>
          </select>
        </div>
      </div>

      <div className="divider !my-4" />

      {/* Open Now Toggle */}
      <div>
        <label className="flex items-center cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              checked={isOpenNow}
              onChange={(e) => setIsOpenNow(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-surface-muted border border-primary-200 rounded-full peer peer-checked:bg-gradient-to-b peer-checked:from-primary-500 peer-checked:to-primary-600 peer-checked:border-primary-500 transition-all duration-200"></div>
            <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow-sm transition-transform duration-200 peer-checked:translate-x-5"></div>
          </div>
          <span className="ml-3 text-sm font-medium text-text group-hover:text-primary-600 transition-colors">
            営業中のみ表示
          </span>
        </label>
      </div>
    </div>
  );
};

export default SearchFilters;
