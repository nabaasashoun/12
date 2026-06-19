// FilterBar.jsx - New component for advanced filtering

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, MapPin, X, Filter, ChevronDown, Check } from 'lucide-react';

const FilterBar = ({ 
  onFilter, 
  categories = [], 
  isDarkMode,
  initialCategory = '',
  initialLocation = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || '');
  const [selectedLocation, setSelectedLocation] = useState(initialLocation || '');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [locations, setLocations] = useState([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  
  const categoryRef = useRef(null);
  const locationRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Fetch locations on mount
  useEffect(() => {
    const fetchLocations = async () => {
      setIsLoadingLocations(true);
      try {
        // Assuming you have an API endpoint for locations
        const response = await fetch('/api/locations/');
        if (response.ok) {
          const data = await response.json();
          setLocations(data);
        } else {
          // Fallback locations
          setLocations([
            'Kampala', 'Entebbe', 'Jinja', 'Mbarara', 'Gulu',
            'Arua', 'Mbale', 'Masaka', 'Kasese', 'Fort Portal'
          ]);
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
        setLocations([
          'Kampala', 'Entebbe', 'Jinja', 'Mbarara', 'Gulu',
          'Arua', 'Mbale', 'Masaka', 'Kasese', 'Fort Portal'
        ]);
      } finally {
        setIsLoadingLocations(false);
      }
    };
    fetchLocations();
  }, []);

  // Handle filter changes with debounce
  const applyFilters = useCallback(() => {
    onFilter({
      search: searchQuery,
      category: selectedCategory,
      location: selectedLocation
    });
  }, [searchQuery, selectedCategory, selectedLocation, onFilter]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      applyFilters();
    }, 300);
    return () => clearTimeout(searchTimeoutRef.current);
  }, [searchQuery, applyFilters]);

  // Apply filters when category or location changes
  useEffect(() => {
    applyFilters();
  }, [selectedCategory, selectedLocation, applyFilters]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedLocation('');
    onFilter({ search: '', category: '', location: '' });
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
      }
      if (locationRef.current && !locationRef.current.contains(event.target)) {
        setShowLocationDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasActiveFilters = searchQuery || selectedCategory || selectedLocation;

  return (
    <div className={`w-full space-y-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
      {/* Main Search Bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-400'
          }`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-blue-500' 
                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500'
            } border focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
          />
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className={`p-2 rounded-xl transition-all duration-200 ${
              isDarkMode 
                ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' 
                : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
            }`}
            aria-label="Clear filters"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Category Filter */}
        <div className="relative" ref={categoryRef}>
          <button
            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              selectedCategory
                ? isDarkMode
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-500 text-white'
                : isDarkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Filter className="w-3 h-3" />
            {selectedCategory 
              ? categories.find(c => c.id === selectedCategory)?.name || 'Category'
              : 'Category'
            }
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${
              showCategoryDropdown ? 'rotate-180' : ''
            }`} />
          </button>

          {/* Category Dropdown */}
          {showCategoryDropdown && (
            <div className={`absolute top-full left-0 mt-1 w-48 max-h-60 overflow-y-auto rounded-xl shadow-lg z-50 ${
              isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
            }`}>
              <button
                onClick={() => {
                  setSelectedCategory('');
                  setShowCategoryDropdown(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  !selectedCategory
                    ? isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'
                    : isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                All Categories
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setShowCategoryDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between ${
                    selectedCategory === category.id
                      ? isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'
                      : isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {category.name}
                  {selectedCategory === category.id && (
                    <Check className="w-3 h-3" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Location Filter */}
        <div className="relative" ref={locationRef}>
          <button
            onClick={() => setShowLocationDropdown(!showLocationDropdown)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              selectedLocation
                ? isDarkMode
                  ? 'bg-green-600 text-white'
                  : 'bg-green-500 text-white'
                : isDarkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <MapPin className="w-3 h-3" />
            {selectedLocation || 'Location'}
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${
              showLocationDropdown ? 'rotate-180' : ''
            }`} />
          </button>

          {/* Location Dropdown */}
          {showLocationDropdown && (
            <div className={`absolute top-full left-0 mt-1 w-48 max-h-60 overflow-y-auto rounded-xl shadow-lg z-50 ${
              isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
            }`}>
              <button
                onClick={() => {
                  setSelectedLocation('');
                  setShowLocationDropdown(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  !selectedLocation
                    ? isDarkMode ? 'bg-green-600 text-white' : 'bg-green-50 text-green-600'
                    : isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                All Locations
              </button>
              {isLoadingLocations ? (
                <div className="px-3 py-2 text-sm text-gray-400">Loading...</div>
              ) : (
                locations.map((location) => (
                  <button
                    key={location}
                    onClick={() => {
                      setSelectedLocation(location);
                      setShowLocationDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between ${
                      selectedLocation === location
                        ? isDarkMode ? 'bg-green-600 text-white' : 'bg-green-50 text-green-600'
                        : isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {location}
                    {selectedLocation === location && (
                      <Check className="w-3 h-3" />
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Active Filters Count */}
        {hasActiveFilters && (
          <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            ({[searchQuery, selectedCategory, selectedLocation].filter(Boolean).length} filters)
          </span>
        )}
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-1.5 mt-1">
        {searchQuery && (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
            isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
          }`}>
            {searchQuery}
            <button
              onClick={() => setSearchQuery('')}
              className="hover:text-red-500 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        )}
        {selectedCategory && categories.find(c => c.id === selectedCategory) && (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
            isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-600'
          }`}>
            {categories.find(c => c.id === selectedCategory)?.name}
            <button
              onClick={() => setSelectedCategory('')}
              className="hover:text-red-500 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        )}
        {selectedLocation && (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
            isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-50 text-green-600'
          }`}>
            📍 {selectedLocation}
            <button
              onClick={() => setSelectedLocation('')}
              className="hover:text-red-500 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        )}
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .filter-dropdown {
          animation: slideDown 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default FilterBar;