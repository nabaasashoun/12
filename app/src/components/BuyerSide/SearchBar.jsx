import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useSearch } from '../../utils/useSearch';
import { useNavigate } from 'react-router-dom';

export default function SearchBar({ initialCategory = 'all', onSearchSubmit }) {
  const {
    query,
    setQuery,
    category,
    setCategory,
    categories,
    results,
    recentSearches,
    loading,
    focused,
    setFocused,
    search,
  } = useSearch(initialCategory);

  const inputRef = useRef(null);
  const overlayRef = useRef(null);
  const navigate = useNavigate();

  // Close overlay when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (overlayRef.current && !overlayRef.current.contains(e.target) && !inputRef.current.contains(e.target)) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setFocused]);

  // Perform search when Enter is pressed
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      search();
      if (onSearchSubmit) onSearchSubmit(query, category);
      else navigate(`/search?q=${encodeURIComponent(query)}&cat=${category}`);
    }
  };

  const handleResultClick = (productId) => {
    setFocused(false);
    navigate(`/product/${productId}`);
  };

  return (
    <div className="relative w-full sm:w-64">
      <div className="flex border border-gray-300 rounded-lg overflow-hidden">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-1/5 px-2 py-1 bg-white text-black focus:outline-none text-xs border-r border-gray-300"
        >
          <option value="all">All</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <div className="relative w-4/5">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search products..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onKeyDown={handleKeyDown}
            className="w-full px-2 py-1 bg-white text-black placeholder-gray-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-6 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
        </div>
      </div>

      {/* Search Overlay */}
      {focused && (
        <div
          ref={overlayRef}
          className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto"
          style={{ top: '100%' }}
        >
          {loading ? (
            <div className="p-4 text-center text-gray-500 text-sm">Searching...</div>
          ) : query.trim() ? (
            results.length > 0 ? (
              <div className="py-2">
                {results.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => handleResultClick(product.id)}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center space-x-3"
                  >
                    <img
                      src={product.product_photo || '/placeholder.jpg'}
                      alt={product.name}
                      className="w-8 h-8 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                      <p className="text-xs text-gray-500 truncate">{product.seller_name}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500 text-sm">No products found</div>
            )
          ) : (
            // Recent searches
            <div className="p-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Recent searches</h3>
              {recentSearches.length > 0 ? (
                <div className="space-y-1">
                  {recentSearches.map((term, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setQuery(term);
                        search(term);
                      }}
                      className="flex items-center px-2 py-1.5 hover:bg-gray-100 rounded cursor-pointer text-sm"
                    >
                      <Search className="w-3.5 h-3.5 text-gray-400 mr-2" />
                      <span className="text-gray-700">{term}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No recent searches</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}