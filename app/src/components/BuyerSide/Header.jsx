// Header.jsx - Fully updated with all features
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Search, Settings, X, 
  ChevronDown, Check, MapPin, Filter,
  Sliders, Clock, Sparkles, Award,
  DollarSign, TrendingUp, Star, Trash2
} from 'lucide-react';
import { useDarkMode } from '../../utils/BuyerDarkModeContext';
import api from '../../utils/api';

const DEFAULT_LOCATIONS = [
  'Kampala', 'Entebbe', 'Jinja', 'Mbarara', 'Gulu',
  'Arua', 'Mbale', 'Masaka', 'Kasese', 'Fort Portal',
  'Lira', 'Soroti', 'Kabale', 'Mukono', 'Njeru',
  'Busia', 'Tororo', 'Moroto', 'Kotido', 'Adjumani'
];

// Sort options
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First', icon: Clock },
  { value: 'price_low', label: 'Price: Low to High', icon: DollarSign },
  { value: 'price_high', label: 'Price: High to Low', icon: DollarSign },
  { value: 'rating', label: 'Best Rating', icon: Award },
  { value: 'popularity', label: 'Most Popular', icon: TrendingUp },
  { value: 'relevance', label: 'Relevance', icon: Sparkles },
];

const PRICE_OPTIONS = [
  { value: 'all', label: 'All Prices' },
  { value: 'under_500k', label: 'Under 500,000 UGX' },
  { value: '500k_1m', label: '500,000 - 1,000,000 UGX' },
  { value: '1m_5m', label: '1,000,000 - 5,000,000 UGX' },
  { value: 'above_5m', label: 'Above 5,000,000 UGX' },
];

const RATING_OPTIONS = [
  { value: 0, label: 'Any Rating' },
  { value: 1, label: '⭐ 1+ Stars' },
  { value: 2, label: '⭐⭐ 2+ Stars' },
  { value: 3, label: '⭐⭐⭐ 3+ Stars' },
  { value: 4, label: '⭐⭐⭐⭐ 4+ Stars' },
  { value: 5, label: '⭐⭐⭐⭐⭐ 5 Stars' },
];

const STOCK_OPTIONS = [
  { value: 'all', label: 'All Products' },
  { value: 'in_stock', label: 'In Stock' },
  { value: 'low_stock', label: 'Low Stock (< 10)' },
  { value: 'out_of_stock', label: 'Out of Stock' },
];

const Header = ({ 
  showBackButton = false,
  backButtonIcon = null,
  onBack = null,
  onSearch, 
  categories = [], 
  isDarkMode: propIsDarkMode,
  initialCategory = '',
  initialLocation = '',
  showFilters = true,
  onFilterChange,
  showSettings = true,
  settingsPath = '/settings',
  // Props for search input control
  searchQuery: externalSearchQuery = '',
  onSearchInputChange = null,
  onSearchInputFocus = null,
  onSearchInputBlur = null,
  searchInputRef: externalSearchInputRef = null
}) => {
  const { isDarkMode: contextDarkMode } = useDarkMode();
  const isDarkMode = propIsDarkMode !== undefined ? propIsDarkMode : contextDarkMode;
  
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(externalSearchQuery || '');
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
  
  // "Others" filter modal state
  const [showOthersModal, setShowOthersModal] = useState(false);
  const [tempSort, setTempSort] = useState('newest');
  const [tempPrice, setTempPrice] = useState('all');
  const [tempRating, setTempRating] = useState(0);
  const [tempStock, setTempStock] = useState('all');
  
  // Applied filter values (from parent or local)
  const [appliedSort, setAppliedSort] = useState('newest');
  const [appliedPrice, setAppliedPrice] = useState('all');
  const [appliedRating, setAppliedRating] = useState(0);
  const [appliedStock, setAppliedStock] = useState('all');
  
  const categoryRef = useRef(null);
  const locationRef = useRef(null);
  const internalSearchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const othersModalRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Use external ref if provided, otherwise internal
  const searchInputRef = externalSearchInputRef || internalSearchInputRef;

  // Sync with external search query
  useEffect(() => {
    if (externalSearchQuery !== undefined) {
      setSearchQuery(externalSearchQuery);
    }
  }, [externalSearchQuery]);

  // Sync with initial category/location
  useEffect(() => {
    setSelectedCategory(initialCategory || '');
    setSelectedLocation(initialLocation || '');
  }, [initialCategory, initialLocation]);

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
      const filtered = prev.filter(s => s.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 5);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Clear all recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
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
    if (searchInputRef && searchInputRef.current) {
      const rect = searchInputRef.current.getBoundingClientRect();
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      setDropdownPosition({
        top: rect.bottom + scrollTop + 5,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [searchInputRef]);

  // Handle search with debounce
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Call parent's onSearchInputChange if provided
    if (onSearchInputChange) {
      onSearchInputChange(e);
    }
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      if (value.trim()) {
        addToRecentSearches(value);
      }
      applyAllFilters(value, selectedCategory, selectedLocation, appliedSort, appliedPrice, appliedRating, appliedStock);
    }, 300);
  }, [selectedCategory, selectedLocation, appliedSort, appliedPrice, appliedRating, appliedStock, addToRecentSearches, onSearchInputChange]);

  // Apply all filters
  const applyAllFilters = useCallback((query, category, location, sort, price, rating, stock) => {
    const searchTerm = query || searchQuery || '';
    const cat = category || selectedCategory || '';
    const loc = location || selectedLocation || '';
    
    if (onSearch) {
      onSearch(searchTerm, cat, loc);
    }
    if (onFilterChange) {
      onFilterChange({ 
        search: searchTerm, 
        category: cat, 
        location: loc,
        sort: sort || appliedSort,
        price: price || appliedPrice,
        rating: rating || appliedRating,
        stock: stock || appliedStock
      });
    }
  }, [onSearch, onFilterChange, searchQuery, selectedCategory, selectedLocation, appliedSort, appliedPrice, appliedRating, appliedStock]);

  // Handle category selection
  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setShowCategoryDropdown(false);
    applyAllFilters(searchQuery, categoryId, selectedLocation, appliedSort, appliedPrice, appliedRating, appliedStock);
  };

  // Handle location selection
  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setShowLocationDropdown(false);
    applyAllFilters(searchQuery, selectedCategory, location, appliedSort, appliedPrice, appliedRating, appliedStock);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedLocation('');
    setAppliedSort('newest');
    setAppliedPrice('all');
    setAppliedRating(0);
    setAppliedStock('all');
    setTempSort('newest');
    setTempPrice('all');
    setTempRating(0);
    setTempStock('all');
    
    if (searchInputRef && searchInputRef.current) {
      searchInputRef.current.value = '';
    }
    
    // Call parent's onSearchInputChange if provided
    if (onSearchInputChange) {
      onSearchInputChange({ target: { value: '' } });
    }
    
    applyAllFilters('', '', '', 'newest', 'all', 0, 'all');
  };

  // Select recent search
  const selectRecentSearch = (term) => {
    setSearchQuery(term);
    if (searchInputRef && searchInputRef.current) {
      searchInputRef.current.value = term;
    }
    setShowRecentSearches(false);
    addToRecentSearches(term);
    
    // Call parent's onSearchInputChange if provided
    if (onSearchInputChange) {
      onSearchInputChange({ target: { value: term } });
    }
    
    applyAllFilters(term, selectedCategory, selectedLocation, appliedSort, appliedPrice, appliedRating, appliedStock);
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
      if (othersModalRef.current && !othersModalRef.current.contains(event.target) && showOthersModal) {
        setShowOthersModal(false);
      }
      // Don't close recent searches on outside click if clicking within search container
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        // Only close if not clicking on recent searches dropdown
        if (!event.target.closest('.recent-searches-dropdown')) {
          setShowRecentSearches(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showOthersModal]);

  // Handle search input focus
  const handleSearchFocus = (e) => {
    updateDropdownPosition();
    setShowRecentSearches(true);
    if (onSearchInputFocus) {
      onSearchInputFocus(e);
    }
  };

  const handleSearchBlur = (e) => {
    // Delay to allow click on recent search items
    setTimeout(() => {
      if (!document.activeElement || !document.activeElement.closest('.recent-searches-dropdown')) {
        setShowRecentSearches(false);
      }
    }, 200);
    if (onSearchInputBlur) {
      onSearchInputBlur(e);
    }
  };

  // Apply others filters
  const applyOthersFilters = () => {
    setAppliedSort(tempSort);
    setAppliedPrice(tempPrice);
    setAppliedRating(tempRating);
    setAppliedStock(tempStock);
    setShowOthersModal(false);
    applyAllFilters(searchQuery, selectedCategory, selectedLocation, tempSort, tempPrice, tempRating, tempStock);
  };

  // Reset others filters
  const resetOthersFilters = () => {
    setTempSort('newest');
    setTempPrice('all');
    setTempRating(0);
    setTempStock('all');
    setAppliedSort('newest');
    setAppliedPrice('all');
    setAppliedRating(0);
    setAppliedStock('all');
    setShowOthersModal(false);
    applyAllFilters(searchQuery, selectedCategory, selectedLocation, 'newest', 'all', 0, 'all');
  };

  const hasActiveFilters = searchQuery || selectedCategory || selectedLocation || 
                           appliedSort !== 'newest' || appliedPrice !== 'all' || 
                           appliedRating > 0 || appliedStock !== 'all';

  const hasOthersFilters = appliedSort !== 'newest' || appliedPrice !== 'all' || 
                           appliedRating > 0 || appliedStock !== 'all';

  // Navigate back
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* Top Row: Back Button, Search Bar, Settings */}
      <div className="flex items-center gap-2" ref={searchContainerRef}>
        {showBackButton && (
          <button
            onClick={handleBack}
            className={`p-2 rounded-full transition-colors flex-shrink-0 ${
              isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
            }`}
            aria-label="Go back"
          >
            {backButtonIcon || <ArrowLeft className="w-5 h-5" />}
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
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-blue-500' 
                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500'
            } border focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
          />
          
          {/* Recent Searches Dropdown */}
          {showRecentSearches && recentSearches.length > 0 && (
            <div
              className="recent-searches-dropdown fixed z-[60] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-slideDown"
              style={{
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
                width: `${dropdownPosition.width}px`,
                maxHeight: '220px',
                overflowY: 'auto'
              }}
            >
              <div className={`flex items-center justify-between px-4 py-2.5 border-b ${
                isDarkMode ? 'border-gray-700' : 'border-gray-100'
              }`}>
                <span className={`text-xs font-medium flex items-center gap-2 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <Clock className="w-3.5 h-3.5" />
                  Recent Searches
                </span>
                <button
                  onClick={clearRecentSearches}
                  className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear All
                </button>
              </div>
              <div className="py-1">
                {recentSearches.map((term, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectRecentSearch(term)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                      isDarkMode 
                        ? 'text-gray-300 hover:bg-gray-700' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="truncate">{term}</span>
                    <ChevronDown className={`w-3.5 h-3.5 rotate-[-90deg] ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-300'
                    }`} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* "Others" Filter Button */}
        {showFilters && (
          <button
            onClick={() => {
              setTempSort(appliedSort);
              setTempPrice(appliedPrice);
              setTempRating(appliedRating);
              setTempStock(appliedStock);
              setShowOthersModal(true);
            }}
            className={`p-2 rounded-xl transition-all flex-shrink-0 relative ${
              hasOthersFilters
                ? isDarkMode
                  ? 'bg-purple-600 text-white'
                  : 'bg-purple-500 text-white'
                : isDarkMode
                  ? 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-gray-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
            }`}
            aria-label="Advanced filters"
          >
            <Sliders className="w-4 h-4" />
            {hasOthersFilters && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white dark:border-gray-800" />
            )}
          </button>
        )}

        {/* Settings Icon */}
        {showSettings && (
          <button
            onClick={() => navigate(settingsPath)}
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

          {/* Active filters indicator */}
          {hasActiveFilters && (
            <>
              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                ({[searchQuery, selectedCategory, selectedLocation, hasOthersFilters ? 'others' : null]
                  .filter(Boolean).length} filters)
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
              "{searchQuery}"
              <button
                onClick={() => {
                  setSearchQuery('');
                  if (searchInputRef && searchInputRef.current) {
                    searchInputRef.current.value = '';
                  }
                  if (onSearchInputChange) {
                    onSearchInputChange({ target: { value: '' } });
                  }
                  applyAllFilters('', selectedCategory, selectedLocation, appliedSort, appliedPrice, appliedRating, appliedStock);
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
                  applyAllFilters(searchQuery, '', selectedLocation, appliedSort, appliedPrice, appliedRating, appliedStock);
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
                  applyAllFilters(searchQuery, selectedCategory, '', appliedSort, appliedPrice, appliedRating, appliedStock);
                }}
                className="hover:text-red-500 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {appliedSort !== 'newest' && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
              isDarkMode ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-50 text-purple-600'
            }`}>
              {SORT_OPTIONS.find(s => s.value === appliedSort)?.label}
              <button
                onClick={() => {
                  setAppliedSort('newest');
                  setTempSort('newest');
                  applyAllFilters(searchQuery, selectedCategory, selectedLocation, 'newest', appliedPrice, appliedRating, appliedStock);
                }}
                className="hover:text-red-500 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {appliedPrice !== 'all' && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
              isDarkMode ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-50 text-yellow-600'
            }`}>
              {PRICE_OPTIONS.find(p => p.value === appliedPrice)?.label}
              <button
                onClick={() => {
                  setAppliedPrice('all');
                  setTempPrice('all');
                  applyAllFilters(searchQuery, selectedCategory, selectedLocation, appliedSort, 'all', appliedRating, appliedStock);
                }}
                className="hover:text-red-500 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {appliedRating > 0 && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
              isDarkMode ? 'bg-orange-900/30 text-orange-300' : 'bg-orange-50 text-orange-600'
            }`}>
              {RATING_OPTIONS.find(r => r.value === appliedRating)?.label}
              <button
                onClick={() => {
                  setAppliedRating(0);
                  setTempRating(0);
                  applyAllFilters(searchQuery, selectedCategory, selectedLocation, appliedSort, appliedPrice, 0, appliedStock);
                }}
                className="hover:text-red-500 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {appliedStock !== 'all' && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
              isDarkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-600'
            }`}>
              {STOCK_OPTIONS.find(s => s.value === appliedStock)?.label}
              <button
                onClick={() => {
                  setAppliedStock('all');
                  setTempStock('all');
                  applyAllFilters(searchQuery, selectedCategory, selectedLocation, appliedSort, appliedPrice, appliedRating, 'all');
                }}
                className="hover:text-red-500 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Others Filter Modal */}
      {showOthersModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowOthersModal(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div 
            ref={othersModalRef}
            className={`relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            } animate-scaleIn`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`sticky top-0 z-10 flex items-center justify-between p-4 border-b ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            } ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-t-2xl`}>
              <div className="flex items-center gap-3">
                <Sliders className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Advanced Filters
                </h2>
              </div>
              <button
                onClick={() => setShowOthersModal(false)}
                className={`p-2 rounded-full transition-colors ${
                  isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <X className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-6">
              {/* Sort Section */}
              <div>
                <label className={`block text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Sort By
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {SORT_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const isSelected = tempSort === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setTempSort(option.value)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          isSelected
                            ? isDarkMode
                              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                              : 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                            : isDarkMode
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{option.label}</span>
                        {isSelected && <Check className="w-4 h-4 ml-auto" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price Filter */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Price Range
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRICE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setTempPrice(option.value)}
                      className={`px-4 py-2 rounded-xl text-sm transition-all ${
                        tempPrice === option.value
                          ? isDarkMode
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-600 text-white'
                          : isDarkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating Filter */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Minimum Rating
                </label>
                <div className="flex flex-wrap gap-2">
                  {RATING_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setTempRating(option.value)}
                      className={`px-4 py-2 rounded-xl text-sm transition-all ${
                        tempRating === option.value
                          ? isDarkMode
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-600 text-white'
                          : isDarkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stock Filter */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Stock Status
                </label>
                <div className="flex flex-wrap gap-2">
                  {STOCK_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setTempStock(option.value)}
                      className={`px-4 py-2 rounded-xl text-sm transition-all ${
                        tempStock === option.value
                          ? isDarkMode
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-600 text-white'
                          : isDarkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className={`sticky bottom-0 flex gap-3 p-4 border-t ${
              isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
            } rounded-b-2xl`}>
              <button
                onClick={resetOthersFilters}
                className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Reset All
              </button>
              <button
                onClick={applyOthersFilters}
                className="flex-1 px-4 py-3 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/25"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;