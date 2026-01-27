import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  RotateCw,
  MapPin,
  Star,
  DollarSign,
  Tag,
  Share2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getKeywordLabel } from '../utils/keywordOptions';
import type { Restaurant } from '../schemas';

interface RouletteScreenProps {
  restaurants: Restaurant[];
  setScreen: (screen: string) => void;
  isSpinning: boolean;
  selectedRestaurant: Restaurant | null;
  startRoulette: () => void;
}

const RouletteScreen: React.FC<RouletteScreenProps> = ({
  restaurants,
  setScreen,
  isSpinning,
  selectedRestaurant,
  startRoulette,
}) => {
  const [displayedRestaurants, setDisplayedRestaurants] = useState<
    Restaurant[]
  >([]);

  useEffect(() => {
    if (isSpinning) {
      const interval = setInterval(() => {
        const randomRestaurant =
          restaurants[Math.floor(Math.random() * restaurants.length)];
        setDisplayedRestaurants((prev) => [
          ...prev.slice(-4),
          randomRestaurant,
        ]);
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isSpinning, restaurants]);

  const shareResult = () => {
    if (selectedRestaurant) {
      const text = `ルーレットで選ばれたレストラン: ${selectedRestaurant.name}`;
      if (navigator.share) {
        navigator
          .share({
            title: '選ばれたレストラン',
            text: text,
          })
          .catch((error) => console.error('Error sharing:', error));
      } else {
        alert(text);
      }
    }
  };

  const getTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      restaurant: 'レストラン',
      cafe: 'カフェ',
      bar: 'バー',
      meal_takeaway: 'ファストフード',
      meal_delivery: '定食屋',
    };
    return typeLabels[type] || type;
  };

  const getMainTypes = (types: string[]) => {
    const mainTypes = [
      'restaurant',
      'cafe',
      'bar',
      'meal_takeaway',
      'meal_delivery',
    ];
    return types.filter((type) => mainTypes.includes(type));
  };

  const getSearchKeywordLabels = (searchKeywords: string[]) => {
    return searchKeywords.map(getKeywordLabel).join(', ');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-semibold text-primary-800">
          レストランルーレット
        </h2>
        <button
          onClick={() => setScreen('results')}
          className="btn btn-secondary flex items-center"
        >
          <ArrowLeft size={20} className="mr-2" />
          結果に戻る
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex justify-center mb-6">
          <button
            onClick={startRoulette}
            disabled={isSpinning}
            className="btn btn-primary flex items-center text-xl"
          >
            <RotateCw
              size={24}
              className={`mr-2 ${isSpinning ? 'animate-spin' : ''}`}
            />
            {isSpinning ? 'スピン中...' : 'スピンする'}
          </button>
        </div>

        <div className="h-64 overflow-hidden relative border-2 border-primary-500 rounded-lg">
          {displayedRestaurants.map((restaurant, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="absolute w-full text-center py-2 bg-primary-100"
              style={{ top: `${index * 25}%` }}
            >
              <span className="font-semibold">{restaurant.name}</span>
              <div className="flex flex-wrap justify-center gap-1 mt-1">
                {getMainTypes(restaurant.types).map((type, typeIndex) => (
                  <span key={typeIndex} className="text-xs text-accent-600">
                    {getTypeLabel(type)}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {selectedRestaurant && !isSpinning && (
          <div className="mt-8 p-4 bg-secondary-100 rounded-lg">
            <div className="flex flex-wrap justify-between items-start mb-4">
              <h3 className="text-2xl font-semibold mb-2">
                {selectedRestaurant.name}
              </h3>
              <div className="flex flex-wrap gap-1">
                {getMainTypes(selectedRestaurant.types).map((type, index) => (
                  <span
                    key={index}
                    className="bg-accent-500 text-white text-xs font-bold py-1 px-2 rounded"
                  >
                    {getTypeLabel(type)}
                  </span>
                ))}
              </div>
            </div>
            <p className="text-gray-600 mb-2">
              <MapPin className="inline-block mr-1" size={16} />
              {selectedRestaurant.vicinity}
            </p>
            <p className="text-gray-600 mb-2">
              <Star className="inline-block mr-1" size={16} />
              {selectedRestaurant.rating} (
              {selectedRestaurant.user_ratings_total} 件の評価)
            </p>
            <p className="text-gray-600 mb-2">
              <DollarSign className="inline-block mr-1" size={16} />
              {'¥'.repeat(selectedRestaurant.price_level)}
            </p>
            <p className="text-gray-600 mb-2">
              <Tag className="inline-block mr-1" size={16} />
              {selectedRestaurant.types
                .filter(
                  (type) =>
                    !getMainTypes(selectedRestaurant.types).includes(type),
                )
                .map(getTypeLabel)
                .join(', ')}
            </p>
            <p className="text-sm text-accent-600 mt-2">
              検索タイプ:{' '}
              {getSearchKeywordLabels(selectedRestaurant.searchKeywords)}
            </p>
            <button
              onClick={shareResult}
              className="btn btn-secondary mt-4 flex items-center"
            >
              <Share2 size={20} className="mr-2" />
              結果をシェア
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RouletteScreen;
