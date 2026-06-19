// Header.jsx - Updated with Settings page navigation
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Search, Settings, X, 
  ChevronDown, Check, MapPin, Filter 
} from 'lucide-react';
import { useDarkMode } from '../../utils/BuyerDarkModeContext';
import api from '../../utils/api';

const DEFAULT_LOCATIONS = [
  'Kampala', 'Entebbe', 'Jinja', 'Mbarara', 'Gulu',
  'Arua', 'Mbale', 'Masaka', 'Kasese', 'Fort Portal',
  'Lira', 'Soroti', 'Kabale', 'Mukono', 'Njeru',
  'Busia', 'Tororo', 'Moroto', 'Kotido', 'Adjumani'
];

const Header = ({ 
  showBackButton = false, 
  onSearch, 
  categories = [], 
  isDarkMode: propIsDarkMode,
  initialCategory = '',
  initialLocation = '',
  showFilters = true,
  onFilterChange,
  showSettings = true,
  settingsPath = '/settings'
}) => {
  const { isDarkMode: contextDarkMode } = useDarkMode();
  const isDarkMode = propIsDarkMode !== undefined ? propIsDarkMode : contextDarkMode;
  
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || '');
  const [selectedLocation, setSelectedLocation] = useState(initialLocation || '');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [locations, setLocations] = useState(DEFAULT_LOCATIONS);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [locationsFetched, setLocationsFetched] = useState(false);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  
  const categoryRef = useRef(null);
  const locationRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recentSearches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {}
    }
  }, []);

  // Save recent searches to localStorage
  const addToRecentSearches = useCallback((term) => {
    if (!term || term.trim() === '') return;
    const trimmed = term.trim();
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s !== trimmed);
      const updated = [trimmed, ...filtered].slice(0, 5);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Fetch locations - with caching
  useEffect(() => {
    if (locationsFetched) return;
    
    const fetchLocations = async () => {
      setIsLoadingLocations(true);
      try {
        const locationData = await api.getLocations();
        if (locationData && locationData.length > 0) {
          setLocations(locationData);
        }
      } catch (error) {
        console.log('Using default locations');
      } finally {
        setIsLoadingLocations(false);
        setLocationsFetched(true);
      }
    };
    
    fetchLocations();
  }, [locationsFetched]);

  // Update dropdown position
  const updateDropdownPosition = useCallback(() => {
    if (searchInputRef.current) {
      const rect = searchInputRef.current.getBoundingClientRect();
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      setDropdownPosition({
        top: rect.bottom + scrollTop + 5,
        left: rect.left,
        width: rect.width,
      });
    }
  }, []);

  // Handle search with debounce
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      if (value.trim()) {
        addToRecentSearches(value);
      }
      applyFilters(value, selectedCategory, selectedLocation);
    }, 300);
  }, [selectedCategory, selectedLocation, addToRecentSearches]);

  // Apply filters
  const applyFilters = useCallback((query, category, location) => {
    if (onSearch) {
      onSearch(query || '', category || '', location || '');
    }
    if (onFilterChange) {
      onFilterChange({ search: query || '', category: category || '', location: location || '' });
    }
  }, [onSearch, onFilterChange]);

  // Handle category selection
  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setShowCategoryDropdown(false);
    applyFilters(searchQuery, categoryId, selectedLocation);
  };

  // Handle location selection
  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setShowLocationDropdown(false);
    applyFilters(searchQuery, selectedCategory, location);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedLocation('');
    if (searchInputRef.current) {
      searchInputRef.current.value = '';
    }
    applyFilters('', '', '');
  };

  // Select recent search
  const selectRecentSearch = (term) => {
    setSearchQuery(term);
    if (searchInputRef.current) {
      searchInputRef.current.value = term;
    }
    setShowRecentSearches(false);
    addToRecentSearches(term);
    applyFilters(term, selectedCategory, selectedLocation);
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

  // Handle search input focus
  const handleSearchFocus = () => {
    updateDropdownPosition();
    setShowRecentSearches(true);
  };

  const handleSearchBlur = () => {
    setTimeout(() => {
      if (!document.activeElement || !document.activeElement.closest('.recent-searches-dropdown')) {
        setShowRecentSearches(false);
      }
    }, 200);
  };

  const hasActiveFilters = searchQuery || selectedCategory || selectedLocation;

  // Navigate to settings
  const handleSettingsClick = () => {
    navigate(settingsPath);
  };

  return (
    <div className="w-full space-y-3">
      {/* Top Row: Back Button, Search Bar, Settings */}
      <div className="flex items-center gap-2">
        {showBackButton && (
          <button
            onClick={() => navigate(-1)}
            className={`p-2 rounded-full transition-colors flex-shrink-0 ${
              isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
            }`}
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {/* Search Bar - takes remaining space */}
        <div className="flex-1 relative">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-400'
          }`} />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search products..."
            defaultValue={searchQuery}
            onChange={handleSearchChange}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-blue-500' 
                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500'
            } border focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
          />
        </div>

        {/* Settings Icon - Navigates to Settings Page */}
        {showSettings && (
          <button
            onClick={handleSettingsClick}
            className={`p-2 rounded-full transition-colors flex-shrink-0 ${
              isDarkMode 
                ? 'hover:bg-gray-700 text-gray-300' 
                : 'hover:bg-gray-100 text-gray-600'
            }`}
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Recent Searches Dropdown */}
      {showRecentSearches && recentSearches.length > 0 && (
        <div
          className="recent-searches-dropdown fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden animate-slideDown"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            maxHeight: '200px',
            overflowY: 'auto'
          }}
        >
          <div className={`px-3 py-2 text-xs font-semibold border-b ${
            isDarkMode ? 'text-gray-400 border-gray-700' : 'text-gray-500 border-gray-200'
          }`}>
            Recent searches
          </div>
          {recentSearches.map((term, idx) => (
            <button
              key={idx}
              onClick={() => selectRecentSearch(term)}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                isDarkMode 
                  ? 'text-gray-300 hover:bg-gray-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {term}
            </button>
          ))}
        </div>
      )}

      {/* Filter Row */}
      {showFilters && (
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

            {showCategoryDropdown && (
              <div className={`absolute top-full left-0 mt-1 w-48 max-h-60 overflow-y-auto rounded-xl shadow-lg z-50 ${
                isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
              }`}>
                <button
                  onClick={() => handleCategorySelect('')}
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
                    onClick={() => handleCategorySelect(category.id)}
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

            {showLocationDropdown && (
              <div className={`absolute top-full left-0 mt-1 w-48 max-h-60 overflow-y-auto rounded-xl shadow-lg z-50 ${
                isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
              }`}>
                <button
                  onClick={() => handleLocationSelect('')}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                    !selectedLocation
                      ? isDarkMode ? 'bg-green-600 text-white' : 'bg-green-50 text-green-600'
                      : isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  All Locations
                </button>
                {isLoadingLocations ? (
                  <div className="px-3 py-2 text-sm text-gray-400 flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    Loading locations...
                  </div>
                ) : (
                  locations.map((location) => (
                    <button
                      key={location}
                      onClick={() => handleLocationSelect(location)}
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

          {hasActiveFilters && (
            <>
              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                ({[searchQuery, selectedCategory, selectedLocation].filter(Boolean).length} filters)
              </span>
              <button
                onClick={clearFilters}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' 
                    : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                }`}
                aria-label="Clear filters"
              >
                <X className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
      )}

      {/* Filter Chips */}
      {showFilters && hasActiveFilters && (
        <div className="flex flex-wrap gap-1.5">
          {searchQuery && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
              isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
            }`}>
              {searchQuery}
              <button
                onClick={() => {
                  setSearchQuery('');
                  if (searchInputRef.current) {
                    searchInputRef.current.value = '';
                  }
                  applyFilters('', selectedCategory, selectedLocation);
                }}
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
                onClick={() => {
                  setSelectedCategory('');
                  applyFilters(searchQuery, '', selectedLocation);
                }}
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
                onClick={() => {
                  setSelectedLocation('');
                  applyFilters(searchQuery, selectedCategory, '');
                }}
                className="hover:text-red-500 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Header;