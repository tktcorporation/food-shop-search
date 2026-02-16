import UnifiedSearchResultsScreen from './components/UnifiedSearchResultsScreen';
import useRestaurantSearch from './composables/useRestaurantSearch';
import { ExternalLink } from 'lucide-react';

function App() {
  const {
    filteredRestaurants,
    isLoading,
    error,
    searchNearbyRestaurants,
    reapplyFilters,
  } = useRestaurantSearch();

  return (
    <div className="min-h-screen bg-surface">
      <UnifiedSearchResultsScreen
        restaurants={filteredRestaurants}
        searchNearbyRestaurants={searchNearbyRestaurants}
        reapplyFilters={reapplyFilters}
        isLoading={isLoading}
        error={error}
      />
      {/* Footer */}
      <footer className="flex items-center justify-center py-4 bg-primary-50 border-t border-primary-100">
        <a
          href="https://forms.gle/MyyDc8ybQJcR5JYs9"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-text-muted text-sm hover:text-primary-600 transition-colors"
        >
          <span>お問い合わせ・要望・バグ報告</span>
          <ExternalLink size={14} />
        </a>
      </footer>
    </div>
  );
}

export default App;
