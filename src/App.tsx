import { useLoadScript } from '@react-google-maps/api';
import UnifiedSearchResultsScreen from './components/UnifiedSearchResultsScreen';
import useRestaurantSearch from './composables/useRestaurantSearch';
import ErrorAlert from './components/ui/ErrorAlert';
import { ExternalLink, Loader2 } from 'lucide-react';

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
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <ErrorAlert message="Google Maps APIの読み込みに失敗しました。ページを再読み込みしてください。" />
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
          <p className="text-gray-600 text-sm">読み込み中...</p>
        </div>
      </div>
    );
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
      <div className="flex items-center justify-center py-3 bg-secondary-500 text-white text-sm">
        <a
          href="https://forms.gle/MyyDc8ybQJcR5JYs9"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:text-secondary-100 transition-colors duration-200"
        >
          <span>お問い合わせ・要望・バグ報告</span>
          <ExternalLink size={20} />
        </a>
      </div>
    </div>
  );
}

export default App;
