import React from 'react';

interface SearchFiltersProps {
  priceLevel: string;
  setPriceLevel: (level: string) => void;
  minRating: number;
  setMinRating: (rating: number) => void;
  minReviews: number;
  setMinReviews: (reviews: number) => void;
  isOpenNow: boolean;
  setIsOpenNow: (isOpen: boolean) => void;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({
  priceLevel,
  setPriceLevel,
  minRating,
  setMinRating,
  minReviews,
  setMinReviews,
  isOpenNow,
  setIsOpenNow,
}) => {
  return (
    <>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          価格帯
        </label>
        <select
          value={priceLevel}
          onChange={(e) => setPriceLevel(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">指定なし</option>
          <option value="1">¥ (安価)</option>
          <option value="2">¥¥ (普通)</option>
          <option value="3">¥¥¥ (高価)</option>
          <option value="4">¥¥¥¥ (非常に高価)</option>
        </select>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          最低評価
        </label>
        <select
          value={minRating}
          onChange={(e) => setMinRating(parseFloat(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
        >
          <option value={0}>指定なし</option>
          <option value={3}>3以上</option>
          <option value={3.5}>3.5以上</option>
          <option value={4}>4以上</option>
          <option value={4.5}>4.5以上</option>
        </select>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          最低レビュー数
        </label>
        <select
          value={minReviews}
          onChange={(e) => setMinReviews(parseInt(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
        >
          <option value={0}>指定なし</option>
          <option value={50}>50件以上</option>
          <option value={100}>100件以上</option>
          <option value={200}>200件以上</option>
          <option value={500}>500件以上</option>
        </select>
      </div>

      <div className="mb-6">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={isOpenNow}
            onChange={(e) => setIsOpenNow(e.target.checked)}
            className="form-checkbox h-5 w-5 text-primary-600"
          />
          <span className="ml-2 text-sm text-gray-700">営業中のみ表示</span>
        </label>
      </div>
    </>
  );
};

export default SearchFilters;