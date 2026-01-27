import { useLoadScript } from '@react-google-maps/api';
import UnifiedSearchResultsScreen from './components/UnifiedSearchResultsScreen';
import useRestaurantSearch from './composables/useRestaurantSearch';
import { ExternalLink } from 'lucide-react';

const libraries: ('places' | 'geometry')[] = ['places', 'geometry'];

function App() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const {
    filteredRestaurants,
    isLoading,
    error,
    searchNearbyRestaurants,
    reapplyFilters,
  } = useRestaurantSearch();

  if (loadError) {
    return <div>Google Maps APIの読み込みに失敗しました。</div>;
  }

  if (!isLoaded) {
    return <div>読み込み中...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      <UnifiedSearchResultsScreen
        restaurants={filteredRestaurants}
        searchNearbyRestaurants={searchNearbyRestaurants}
        reapplyFilters={reapplyFilters}
        isLoading={isLoading}
        error={error}
      />
      {/* お問い合わせフォーム */}
      <div className="flex items-center justify-center py-3 bg-primary-300 text-white text-sm">
        <a
          href="https://forms.gle/MyyDc8ybQJcR5JYs9"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2"
        >
          <span>お問い合わせ・要望・バグ報告</span>
          <ExternalLink size={20} />
        </a>
      </div>
    </div>
  );
}

export default App;
