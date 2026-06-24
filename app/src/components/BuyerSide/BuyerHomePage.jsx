// BuyerHomePage.jsx - Updated with fixed filtering and random organization
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BuyerCard, BuyerCardContent } from './BuyerCard';
import {
  Heart, MessageSquare, Star, Bookmark, Plus, Settings,
  MoreHorizontal, X, ChevronUp, ChevronDown, Share2,
  Search, MapPin, Filter, Check, Flag, ArrowLeft,
  ArrowUp, Sliders, DollarSign, TrendingUp, Clock,
  Award, Users, ChevronRight, Trash2, Sparkles, RefreshCw
} from 'lucide-react';
import api from '../../utils/api';
import { useCart } from '../../utils/CartContext';
import { useLikeBookmark } from '../../utils/LikeBookmarkContext';
import { useChat } from '../../utils/ChatContext';
import Loader from '../UISkeleton/Loader';
import { usePageLoading } from '../../utils/PageLoadingContext';
import { useDarkMode } from '../../utils/BuyerDarkModeContext';
import ShareModal from './ShareModal';
import ProductMetaTags from './ProductMetaTags';
import ReportModal from './ReportModal';
import { getProductShareLink, copyToClipboard } from '../../utils/shareUtils';
import Header from './Header';

// API Base URL - defined once at the top
const API_BASE_URL = 'http://localhost:8000';

// Local storage key for recent searches
const RECENT_SEARCHES_KEY = 'recentSearches';

const formatCurrency = (amount) => {
  return `UGX ${parseFloat(amount).toLocaleString('en-UG')}`;
};

const samplePosts = [
  {
    id: 1,
    sellerName: "Tech Gadgets Ltd's store",
    sellerUsername: 'techgadgets',
    authorAvatar: 'T',
    price: formatCurrency(1100000),
    images: ['/sample1.jpg', '/sample2.jpg', '/sample3.jpg'],
    product: 'Wireless Headphones',
    content: 'Premium wireless headphones with noise cancellation...',
    rating: 4,
    ratingCount: 123,
    sellerId: 1,
    is_liked: false,
    is_bookmarked: false
  },
  {
    id: 2,
    sellerName: "Sport Gear Hub's store",
    sellerUsername: 'sportgear',
    authorAvatar: 'S',
    price: formatCurrency(470000),
    images: ['/sample4.jpg'],
    product: 'Running Shoes',
    content: 'High performance running shoes with responsive cushioning...',
    rating: 5,
    ratingCount: 89,
    sellerId: 2,
    is_liked: false,
    is_bookmarked: false
  }
];

const sampleQuickDeals = [
  { id: 1, title: 'Tech', product: 'Headphones Pro', image: '/sample1.jpg', color: 'bg-blue-100 dark:bg-blue-900/30' },
  { id: 2, title: 'Fitness', product: 'Smart Tracker', image: '/sample2.jpg', color: 'bg-pink-100 dark:bg-pink-900/30' }
];

// Filter options for the "Others" modal
const FILTER_OPTIONS = {
  price: {
    label: 'Price Range',
    options: [
      { value: 'all', label: 'All Prices' },
      { value: 'under_500k', label: 'Under 500,000 UGX' },
      { value: '500k_1m', label: '500,000 - 1,000,000 UGX' },
      { value: '1m_5m', label: '1,000,000 - 5,000,000 UGX' },
      { value: 'above_5m', label: 'Above 5,000,000 UGX' },
    ]
  },
  rating: {
    label: 'Minimum Rating',
    options: [
      { value: 0, label: 'Any Rating' },
      { value: 1, label: '⭐ 1+ Stars' },
      { value: 2, label: '⭐⭐ 2+ Stars' },
      { value: 3, label: '⭐⭐⭐ 3+ Stars' },
      { value: 4, label: '⭐⭐⭐⭐ 4+ Stars' },
      { value: 5, label: '⭐⭐⭐⭐⭐ 5 Stars' },
    ]
  },
  stock: {
    label: 'Stock Status',
    options: [
      { value: 'all', label: 'All Products' },
      { value: 'in_stock', label: 'In Stock' },
      { value: 'low_stock', label: 'Low Stock (< 10)' },
      { value: 'out_of_stock', label: 'Out of Stock' },
    ]
  }
};

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First', icon: Clock },
  { value: 'price_low', label: 'Price: Low to High', icon: DollarSign },
  { value: 'price_high', label: 'Price: High to Low', icon: DollarSign },
  { value: 'rating', label: 'Best Rating', icon: Award },
  { value: 'popularity', label: 'Most Popular', icon: TrendingUp },
  { value: 'relevance', label: 'Relevance', icon: Sparkles },
];

// Fisher-Yates shuffle algorithm for randomizing array
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const BuyerHomePage = () => {
  const { isDarkMode } = useDarkMode();
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const { 
    isLiked, 
    isBookmarked, 
    toggleLike, 
    toggleBookmark,
    loading: contextLoading,
    initialFetchDone
  } = useLikeBookmark();

  const [animatingLike, setAnimatingLike] = useState(null);
  const [animatingFavorite, setAnimatingFavorite] = useState(null);
  const [currentVerticalIndex, setCurrentVerticalIndex] = useState(0);
  const [posts, setPosts] = useState([]);
  const [expandedDescriptionId, setExpandedDescriptionId] = useState(null);
  const [expandedDescriptionPosition, setExpandedDescriptionPosition] = useState({ top: 0, left: 0, buttonWidth: 0 });
  const [quickDeals, setQuickDeals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchToast, setSearchToast] = useState('');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [shareToast, setShareToast] = useState('');
  const navigate = useNavigate();
  const { startChat } = useChat();
  const { cartItems, addToCart, removeFromCart } = useCart();
  const { setIsPageLoading } = usePageLoading();
  const [categories, setCategories] = useState([]);
  
  // Filter state
  const [filterCategory, setFilterCategory] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterSort, setFilterSort] = useState('newest'); // Default to newest
  const [filterPrice, setFilterPrice] = useState('all');
  const [filterRating, setFilterRating] = useState(0);
  const [filterStock, setFilterStock] = useState('all');
  const [isFilterApplied, setIsFilterApplied] = useState(false);

  // Others filter modal state
  const [othersModalOpen, setOthersModalOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState({
    price: 'all',
    rating: 0,
    stock: 'all',
    sort: 'newest'
  });

  // Recent searches state
  const [recentSearches, setRecentSearches] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchBarFocused, setSearchBarFocused] = useState(false);
  const searchInputRef = useRef(null);

  // State for the product being shared via meta tags
  const [sharingProduct, setSharingProduct] = useState(null);

  // Report modal state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportingSellerId, setReportingSellerId] = useState(null);
  const [reportingSellerName, setReportingSellerName] = useState('');
  const [reportingProductId, setReportingProductId] = useState(null);
  const [reportingProductName, setReportingProductName] = useState('');

  // Back to top button state
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Error loading recent searches:', e);
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearches = useCallback((searches) => {
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
      setRecentSearches(searches);
    } catch (e) {
      console.error('Error saving recent searches:', e);
    }
  }, []);

  // Add search term to recent searches
  const addRecentSearch = useCallback((term) => {
    if (!term || !term.trim()) return;
    const trimmed = term.trim();
    const updated = [
      trimmed,
      ...recentSearches.filter(s => s.toLowerCase() !== trimmed.toLowerCase())
    ].slice(0, 5);
    saveRecentSearches(updated);
  }, [recentSearches, saveRecentSearches]);

  // Clear all recent searches
  const clearRecentSearches = useCallback(() => {
    saveRecentSearches([]);
  }, [saveRecentSearches]);

  // Back to top scroll handler
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

// BuyerHomePage.jsx - Fully updated fetchProductsWithParams
  // Fully Updated fetchProductsWithParams
  const fetchProductsWithParams = useCallback(async (params = {}) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      return;
    }

    setIsPageLoading(true);
    setIsLoading(true);

    try {
      const queryParams = new URLSearchParams();

      // Search text
      if (params.search?.trim()) {
        queryParams.append('search', params.search.trim());
      }

      // Category
      if (params.category && params.category !== 'all' && params.category !== '') {
        queryParams.append('category', params.category);
      }

      // Location
      if (params.location?.trim()) {
        queryParams.append('location', params.location.trim());
      }

      // Price Range
      if (params.price && params.price !== 'all') {
        queryParams.append('price_range', params.price);
      }

      // Minimum Rating
      if (params.rating && params.rating > 0) {
        queryParams.append('min_rating', params.rating);
      }

      // Stock Status
      if (params.stock && params.stock !== 'all') {
        queryParams.append('stock_status', params.stock);
      }

      // Sort (Backend handles most, frontend handles 'random')
      // Always send sort unless it's the default 'newest' (optional)
      if (params.sort && params.sort !== 'newest') {
        queryParams.append('sort', params.sort);
      }

      // Pagination (optional for future use)
      if (params.page) queryParams.append('page', params.page);
      if (params.page_size) queryParams.append('page_size', params.page_size);

      // Build final URL
      let url = `${API_BASE_URL}/api/products/search/`;
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }

      console.log('🔍 Fetching products from:', url);
      console.log('📋 Params sent:', Object.fromEntries(queryParams));
      console.log('🔍 Final fetch params:', {
        search: params.search,
        category: params.category,
        location: params.location,
        price: params.price,
        rating: params.rating,
        stock: params.stock,
        sort: params.sort
      });

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error(`❌ API Error ${response.status}: ${response.statusText}`);
        throw new Error(`Failed to fetch products: ${response.status}`);
      }

      const result = await response.json();
      console.log('📦 Products API response:', result);

      // Extract products
      let products = result.data || result.results || result || [];

      // Handle random sorting on frontend
      if (params.sort === 'random' || !params.sort) {
        products = shuffleArray(products);
      }

      // Transform products for UI
      const transformedPosts = products.map(product => {
        const sellerName = product.seller_name || product.seller?.name || 'Seller';
        const storeDisplay = `${sellerName}'s store`;

        return {
          id: product.id,
          sellerName: storeDisplay,
          sellerUsername: product.seller?.user?.username || product.seller?.username || 'seller',
          authorAvatar: sellerName.charAt(0).toUpperCase(),
          price: formatCurrency(product.unit_price || 0),
          images: product.images && product.images.length > 0
            ? product.images
            : (product.product_photo ? [product.product_photo] : ['/sample1.jpg']),
          product: product.name || 'Product',
          content: product.description || 'No description available',
          rating: Math.round(product.rating_magnitude || 0),
          ratingCount: product.rating_number || 0,
          commentCount: product.comment_count || 0,
          like_count: product.like_count || 0,
          sellerId: product.seller?.id || product.seller,
          sellerUserId: product.seller_user_id || product.seller?.user?.id,
          unit_price: product.unit_price,
          location: product.location || product.seller?.location || '',
          description: product.description || '',
          stock_quantity: product.stock_quantity || 0,
          category: product.category,
          date_of_post: product.date_of_post,
        };
      });

      setPosts(transformedPosts);

      // Detect if any filter is active
      const hasActiveFilter = !!(
        params.search?.trim() ||
        (params.category && params.category !== 'all' && params.category !== '') ||
        params.location?.trim() ||
        (params.price && params.price !== 'all') ||
        (params.rating && params.rating > 0) ||
        (params.stock && params.stock !== 'all') ||
        (params.sort && params.sort !== 'newest')   // ← Changed from 'random'
      );

      setIsFilterApplied(hasActiveFilter);

      // Toast messages
      if (transformedPosts.length === 0) {
        setSearchToast(hasActiveFilter 
          ? 'No products found matching your filters.' 
          : 'No products available at the moment.');
      } else {
        setSearchToast('');
      }

    } catch (error) {
      console.error('❌ Error fetching products:', error);
      setPosts(shuffleArray(samplePosts));
      setSearchToast('Failed to load products. Showing sample data.');
    } finally {
      setIsLoading(false);
      setIsPageLoading(false);
    }
  }, [navigate, setIsPageLoading]);

  const handleSearch = useCallback((query, category, location) => {
    setFilterCategory(category || '');
    setFilterLocation(location || '');

    if (query?.trim()) {
      addRecentSearch(query.trim());
    }

    fetchProductsWithParams({
      search: query || '',
      category: category || '',
      location: location || '',
      price: filterPrice,
      rating: filterRating,
      stock: filterStock,
      sort: filterSort
    });
  }, [fetchProductsWithParams, filterPrice, filterRating, filterStock, filterSort, addRecentSearch]);

  const handleFilterChange = useCallback((filters) => {
    console.log('📨 Filter change from Header:', filters);

    setFilterCategory(filters.category || '');
    setFilterLocation(filters.location || '');

    // IMPORTANT: Use ALL values from Header, do NOT fall back to old local state
    fetchProductsWithParams({
      search: filters.search || '',
      category: filters.category || '',
      location: filters.location || '',
      price: filters.price || 'all',
      rating: filters.rating || 0,
      stock: filters.stock || 'all',
      sort: filters.sort || 'random'
    });
  }, [fetchProductsWithParams]);   // ← Minimal dependencies

  const applyAllFilters = useCallback(() => {
    console.log('🚀 Applying Advanced Filters from Modal:', tempFilters);

    setFilterPrice(tempFilters.price);
    setFilterRating(tempFilters.rating);
    setFilterStock(tempFilters.stock);
    setFilterSort(tempFilters.sort);

    setOthersModalOpen(false);

    fetchProductsWithParams({
      search: searchQuery?.trim() || '',
      category: filterCategory || '',
      location: filterLocation || '',
      price: tempFilters.price,
      rating: tempFilters.rating,
      stock: tempFilters.stock,
      sort: tempFilters.sort
    });
  }, [tempFilters, fetchProductsWithParams, searchQuery, filterCategory, filterLocation]);

  // Handle search input change for recent searches
  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchInputFocus = () => {
    setSearchBarFocused(true);
  };

  const handleSearchInputBlur = () => {
    setTimeout(() => setSearchBarFocused(false), 200);
  };

  const handleRecentSearchClick = (term) => {
    setSearchQuery(term);
    setSearchBarFocused(false);
    handleSearch(term, filterCategory, filterLocation);
  };

  // Clear toasts after 3 seconds
  useEffect(() => {
    if (searchToast) {
      const timer = setTimeout(() => setSearchToast(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [searchToast]);

  useEffect(() => {
    if (shareToast) {
      const timer = setTimeout(() => setShareToast(''), 2000);
      return () => clearTimeout(timer);
    }
  }, [shareToast]);

  const cartPosts = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      if (item.product?.id) acc[item.product.id] = true;
      return acc;
    }, {});
  }, [cartItems]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const result = await api.getCategories();
        if (result.data && Array.isArray(result.data)) {
          setCategories(result.data.map(cat => ({ id: cat.id, name: cat.name })));
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Initial load - random order
// Initial load - only once (empty dependency array is important!)
// Initial load - ONLY ONCE (critical fix)
// Initial load - default to newest (no more random)
  useEffect(() => {
    console.log('🏠 Initial load with newest sort');
    fetchProductsWithParams({ 
      sort: 'newest' 
    });
  }, [fetchProductsWithParams]);

  const fetchQuickDeals = useCallback(async () => {
    try {
      const result = await api.getQuickDeals();
      if (result.data && result.data.status === 'success' && Array.isArray(result.data.deals)) {
        const transformedDeals = result.data.deals.map(deal => ({
          id: deal.id,
          title: deal.category_name || deal.product?.category?.name || 'Category',
          product: deal.product?.name || 'Product',
          image: deal.picture || deal.product?.product_photo || '/assets/glasses.jpg',
          color: getRandomColor(),
          caption: deal.caption,
          views: deal.views,
          timestamp: deal.timestamp,
          productId: deal.product?.id
        }));
        setQuickDeals(transformedDeals);
      } else {
        setQuickDeals(sampleQuickDeals);
      }
    } catch (error) {
      console.error('Error fetching quick deals:', error);
      setQuickDeals(sampleQuickDeals);
    }
  }, []);

  useEffect(() => {
    fetchQuickDeals();
    const intervalId = setInterval(fetchQuickDeals, 30000);
    const handleQuickDealCreated = () => fetchQuickDeals();
    const handleStorageChange = (e) => {
      if (e.key === 'quickDealUpdated') fetchQuickDeals();
    };
    window.addEventListener('quickDealCreated', handleQuickDealCreated);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('quickDealCreated', handleQuickDealCreated);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchQuickDeals]);

  const getRandomColor = () => {
    const colors = [
      'bg-blue-100 dark:bg-blue-900/30',
      'bg-pink-100 dark:bg-pink-900/30',
      'bg-green-100 dark:bg-green-900/30',
      'bg-orange-100 dark:bg-orange-900/30',
      'bg-purple-100 dark:bg-purple-900/30'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleQuickDealClick = async (deal) => {
    try {
      await api.incrementQuickDealViews(deal.id);
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
    if (deal.productId) {
      navigate(`/product/${deal.productId}`);
    }
  };

  const goToImage = (postId, imageIndex) => {
    setCurrentImageIndex(prev => ({ ...prev, [postId]: imageIndex }));
  };

  const toggleDropdown = (postId) => {
    setDropdownOpen(dropdownOpen === postId ? null : postId);
  };
  const closeDropdown = () => setDropdownOpen(null);

  const handleToggleLike = async (postId) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      return;
    }
    
    setAnimatingLike(postId);
    setTimeout(() => setAnimatingLike(null), 600);
    
    await toggleLike(postId);
  };

  const handleToggleFavorite = async (postId) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      return;
    }
    
    setAnimatingFavorite(postId);
    setTimeout(() => setAnimatingFavorite(null), 500);
    
    await toggleBookmark(postId);
  };

  const toggleCart = async (postId) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      return;
    }
    if (cartPosts[postId]) {
      await removeFromCart(postId);
    } else {
      await addToCart(postId, 1);
    }
  };

  const handleCopyLink = async (postId) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    const shareLink = getProductShareLink(postId);
    await copyToClipboard(
      shareLink,
      () => {
        setShareToast('Link copied to clipboard! ✓');
        setTimeout(() => setShareToast(''), 2000);
      },
      () => {
        setShareToast('Failed to copy link');
        setTimeout(() => setShareToast(''), 2000);
      }
    );
    closeDropdown();
  };

  const handleShareTo = (post) => {
    const productForSharing = {
      id: post.id,
      name: post.product,
      product: post.product,
      price: post.price,
      images: post.images,
      sellerName: post.sellerName,
      sellerId: post.sellerId,
      description: post.content,
      unit_price: parseFloat(post.price.replace(/[^0-9.]/g, '')) || 0,
    };
    
    setSharingProduct(productForSharing);
    setSelectedProduct({
      id: post.id,
      name: post.product,
      product: post.product,
      price: post.price,
      images: post.images,
      sellerName: post.sellerName,
      sellerId: post.sellerId
    });
    setShareModalOpen(true);
    closeDropdown();
  };

  const handleReportSeller = (post) => {
    closeDropdown();
    setReportingSellerId(post.sellerId);
    setReportingSellerName(post.sellerName);
    setReportingProductId(post.id);
    setReportingProductName(post.product);
    setReportModalOpen(true);
  };

  const toggleDescriptionExpansion = (postId, event) => {
    if (expandedDescriptionId === postId) {
      setExpandedDescriptionId(null);
      return;
    }
    const button = event.currentTarget;
    const buttonRect = button.getBoundingClientRect();
    const top = buttonRect.bottom + window.scrollY + 10;
    const left = buttonRect.left + window.scrollX;
    setExpandedDescriptionPosition({ top, left, buttonWidth: buttonRect.width });
    setExpandedDescriptionId(postId);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (expandedDescriptionId) {
        const isClickInside = event.target.closest('.description-tooltip') ||
                              event.target.closest('.description-toggle-button');
        if (!isClickInside) setExpandedDescriptionId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [expandedDescriptionId]);

  const scrollVertical = (direction) => {
    if (direction === 'up' && currentVerticalIndex > 0) {
      setCurrentVerticalIndex(prev => prev - 5);
    } else if (direction === 'down' && currentVerticalIndex < quickDeals.length - 5) {
      setCurrentVerticalIndex(prev => prev + 5);
    }
  };

  const dropdownItems = useCallback((post) => {
    return [
      { 
        label: 'Report Seller', 
        action: () => handleReportSeller(post)
      },
      { 
        label: 'Message Seller', 
        icon: MessageSquare,
        action: async () => {
          closeDropdown();
          let targetUserId = post?.sellerUserId;
          if (!targetUserId && post?.sellerId) {
            try {
              const r = await api.getSellerUserID(post.sellerId);
              if (!r.error && r.data?.user) {
                targetUserId = r.data.user;
              }
            } catch (e) {
              console.error('Error fetching seller user ID:', e);
            }
          }
          if (targetUserId) {
            const sellerName = post.sellerName || 'Seller';
            navigate(`/chat?userId=${targetUserId}&name=${encodeURIComponent(sellerName)}`);
            startChat(targetUserId);
          } else {
            console.warn('Could not resolve seller user ID', post);
            setShareToast('Unable to message seller');
            setTimeout(() => setShareToast(''), 2000);
          }
        }
      },
      { label: 'Go to Post', icon: null, action: () => { closeDropdown(); navigate(`/product/${post.id}`); } },
      { 
        label: 'Share to', 
        icon: Share2,
        action: () => handleShareTo(post)
      },
      { 
        label: 'Copy Link', 
        icon: null,
        action: () => handleCopyLink(post.id)
      },
      { label: 'Cancel', icon: null, action: closeDropdown },
    ];
  }, [navigate, startChat, handleShareTo, handleCopyLink]);

  // Get the product image for meta tags
  const getProductImage = (product) => {
    if (!product) return null;
    return product.images && product.images.length > 0 
      ? product.images[0] 
      : product.product_photo || null;
  };

  // Reset filters to default (random)
  const resetAllFilters = () => {
    setFilterPrice('all');
    setFilterRating(0);
    setFilterStock('all');
    setFilterSort('random');
    setFilterCategory('');
    setFilterLocation('');
    setSearchQuery('');
    setTempFilters({ price: 'all', rating: 0, stock: 'all', sort: 'random' });
    setIsFilterApplied(false);
    if (searchInputRef.current) {
      searchInputRef.current.value = '';
    }
    fetchProductsWithParams({ sort: 'random' });
  };

  // Others Filter Modal Component
  const OthersFilterModal = () => {
    return (
      <div 
        className={`fixed inset-0 z-[200] flex items-center justify-center p-4 ${
          othersModalOpen ? 'animate-fadeIn' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setOthersModalOpen(false)}
      >
        <div 
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm ${othersModalOpen ? 'animate-fadeIn' : ''}`}
        />
        <div 
          className={`relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          } ${othersModalOpen ? 'animate-scaleIn' : 'scale-95'}`}
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
              onClick={() => setOthersModalOpen(false)}
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
                  const isSelected = tempFilters.sort === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setTempFilters(prev => ({ ...prev, sort: option.value }))}
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
                {FILTER_OPTIONS.price.options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTempFilters(prev => ({ ...prev, price: option.value }))}
                    className={`px-4 py-2 rounded-xl text-sm transition-all ${
                      tempFilters.price === option.value
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
                {FILTER_OPTIONS.rating.options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTempFilters(prev => ({ ...prev, rating: option.value }))}
                    className={`px-4 py-2 rounded-xl text-sm transition-all ${
                      tempFilters.rating === option.value
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
                {FILTER_OPTIONS.stock.options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTempFilters(prev => ({ ...prev, stock: option.value }))}
                    className={`px-4 py-2 rounded-xl text-sm transition-all ${
                      tempFilters.stock === option.value
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
              onClick={() => {
                setTempFilters({ price: 'all', rating: 0, stock: 'all', sort: 'random' });
                setOthersModalOpen(false);
                resetAllFilters();
              }}
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isDarkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Reset All
            </button>
            <button
              onClick={applyAllFilters}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/25"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Recent Searches Dropdown
  const RecentSearchesDropdown = () => {
    if (!searchBarFocused || recentSearches.length === 0) return null;
    
    return (
      <div 
        className={`absolute top-full left-0 right-0 mt-2 rounded-xl shadow-xl overflow-hidden ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } border animate-slideDown z-50`}
      >
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
          <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
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
          {recentSearches.map((term, index) => (
            <button
              key={index}
              onClick={() => handleRecentSearchClick(term)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all ${
                isDarkMode
                  ? 'text-gray-300 hover:bg-gray-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Clock className={`w-4 h-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <span>{term}</span>
              <ChevronRight className={`w-4 h-4 ml-auto ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
            </button>
          ))}
        </div>
      </div>
    );
  };

  if (contextLoading || !initialFetchDone || isLoading) {
    return (
      <div className={`p-3 sm:p-4 md:p-6 max-w-4xl mx-auto min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Loader />
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* ProductMetaTags for sharing */}
      {sharingProduct && (
        <ProductMetaTags 
          product={sharingProduct}
          productImage={getProductImage(sharingProduct)}
          productDescription={sharingProduct.description}
        />
      )}
      
      <div className="p-2 sm:p-4 md:p-6 max-w-6xl mx-auto relative">

        {/* Back to Top Button */}
        {showBackToTop && (
          <button
            onClick={scrollToTop}
            className={`fixed bottom-8 right-8 z-50 p-3 rounded-full shadow-lg transition-all transform hover:scale-110 ${
              isDarkMode
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } animate-fadeIn`}
            aria-label="Back to top"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        )}

        {/* Header with Search, Filters, and Settings Icon */}
        <Header 
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          categories={categories}
          isDarkMode={isDarkMode}
          searchQuery={searchQuery}
          onSearchInputChange={handleSearchInputChange}
          onSearchInputFocus={handleSearchInputFocus}
          onSearchInputBlur={handleSearchInputBlur}
          searchInputRef={searchInputRef}
        />


        {/* Recent Searches Dropdown */}
        <RecentSearchesDropdown />

        {/* Search Toast */}
        {searchToast && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-slideDown">
            <div className="px-4 py-2 rounded-lg shadow-lg bg-red-600 text-white text-sm font-medium">
              {searchToast}
            </div>
          </div>
        )}

        {/* Share Toast */}
        {shareToast && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] animate-slideDown">
            <div className={`px-4 py-2 rounded-lg shadow-lg text-sm font-medium ${
              shareToast.includes('Failed') ? 'bg-red-500' : 'bg-green-500'
            } text-white`}>
              {shareToast}
            </div>
          </div>
        )}

        {/* Quick Deals Section */}
        <div className={`sticky top-0 z-40 pt-1 pb-2 mb-2 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between w-full">
            <div className="flex-shrink-0 mr-4">
              <div className="flex flex-col leading-tight">
                <span className={`text-[15px] font-bold ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>Quick</span>
                <span className={`text-[15px] font-bold ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>Deals</span>
              </div>
            </div>
            <div className="flex flex-1 justify-start space-x-3 sm:space-x-4">
              {quickDeals.slice(currentVerticalIndex, currentVerticalIndex + 5).map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col items-center flex-shrink-0 cursor-pointer hover:scale-105 transition-transform duration-200"
                  onClick={() => handleQuickDealClick(item)}
                >
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${item.color} flex items-center justify-center border-2 ${isDarkMode ? 'border-gray-700' : 'border-white'} shadow-sm`}>
                    <img src={item.image} alt={item.product} className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded-full" />
                  </div>
                  <p className={`text-center text-xs mt-1 font-medium truncate w-12 sm:w-14 ${isDarkMode ? 'text-gray-300' : 'text-black'}`}>{item.title}</p>
                  <p className={`text-center text-xs truncate w-12 sm:w-14 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>{item.product}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-col space-y-1 ml-4">
              <button
                onClick={() => scrollVertical('up')}
                className={`shadow-md rounded-full p-1 transition-colors ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'}`}
                disabled={currentVerticalIndex === 0}
              >
                <ChevronUp className={`w-3 h-3 ${currentVerticalIndex === 0 ? (isDarkMode ? 'text-gray-600' : 'text-gray-300') : (isDarkMode ? 'text-gray-400' : 'text-gray-600')}`} />
              </button>
              <button
                onClick={() => scrollVertical('down')}
                className={`shadow-md rounded-full p-1 transition-colors ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'}`}
                disabled={currentVerticalIndex >= quickDeals.length - 5}
              >
                <ChevronDown className={`w-3 h-3 ${currentVerticalIndex >= quickDeals.length - 5 ? (isDarkMode ? 'text-gray-600' : 'text-gray-300') : (isDarkMode ? 'text-gray-400' : 'text-gray-600')}`} />
              </button>
            </div>
          </div>
          <div className={`w-full h-1 rounded-full relative mt-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}>
            <div
              className={`absolute top-0 left-0 h-1 rounded-full transition-all duration-300 ${isDarkMode ? 'bg-gray-500' : 'bg-gray-600'}`}
              style={{ width: '20%', transform: `translateX(${currentVerticalIndex / 5 * 100}%)` }}
            />
          </div>
        </div>

        {/* Filter Status Bar */}
        {isFilterApplied && (
          <div className="flex justify-end mb-3">
            <button
              onClick={resetAllFilters}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-1 transition-colors underline-offset-2 hover:underline"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {posts.map((post) => {
            const currentIndex = currentImageIndex[post.id] || 0;
            const totalImages = post.images.length;
            const truncatedDescription = post.content.length > 40 ? post.content.substring(0, 40) + '...' : post.content;

            return (
              <BuyerCard 
                key={post.id} 
                variant="elevated" 
                className="overflow-hidden flex flex-col relative hover:shadow-xl transition-shadow duration-300"
              >
                <BuyerCardContent className="p-0 flex flex-col">
                  {/* Header */}
                  <div className={`p-0 sm:p-3 flex flex-col border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                    <div className="flex justify-between items-center">
                      <Link
                        to={`/seller/${post.sellerId}`}
                        className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                      >
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs">
                          {post.authorAvatar}
                        </div>
                        <span className={`font-medium text-xs sm:text-sm truncate ${isDarkMode ? 'text-gray-200' : 'text-black'}`}>
                          {post.sellerName}
                        </span>
                      </Link>
                      <button 
                        onClick={() => toggleDropdown(post.id)} 
                        className={`p-1 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                      >
                        <MoreHorizontal className={`w-3 h-3 sm:w-4 sm:h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      </button>
                    </div>
                    <div className="flex justify-center items-center mt-0.5">
                      <span className="text-xs text-green-600 dark:text-green-400 mb-1 font-semibold">
                        {post.price}
                      </span>
                    </div>
                  </div>

                  {/* Image */}
                  <div
                    className="relative aspect-square w-full bg-gray-200 dark:bg-gray-700 flex-1"
                    onTouchStart={(e) => {
                      const touchStartX = e.touches[0].clientX;
                      setCurrentImageIndex((prev) => ({ ...prev, touchStartX }));
                    }}
                    onTouchMove={(e) => {
                      const touchEndX = e.touches[0].clientX;
                      setCurrentImageIndex((prev) => ({ ...prev, touchEndX }));
                    }}
                    onTouchEnd={() => {
                      const startX = currentImageIndex.touchStartX;
                      const endX = currentImageIndex.touchEndX;
                      const diff = startX - endX;
                      if (Math.abs(diff) > 50) {
                        if (diff > 0 && currentIndex < totalImages - 1) goToImage(post.id, currentIndex + 1);
                        if (diff < 0 && currentIndex > 0) goToImage(post.id, currentIndex - 1);
                      }
                      setCurrentImageIndex((prev) => ({ ...prev, touchStartX: null, touchEndX: null }));
                    }}
                  >
                    {totalImages > 1 && (
                      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10 flex space-x-1 px-2 py-1">
                        {post.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => goToImage(post.id, index)}
                            className={`w-1 h-1 rounded-full transition-all ${index === currentIndex 
                              ? isDarkMode ? 'bg-gray-400' : 'bg-gray-300'
                              : isDarkMode ? 'bg-gray-600' : 'bg-gray-100'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                    <Link to={`/product/${post.id}`}>
                      <img
                        src={post.images[currentIndex]}
                        alt={post.product}
                        className="absolute inset-0 w-full h-full object-cover select-none"
                      />
                    </Link>
                  </div>

                  {/* Footer */}
                  <div className="p-1 sm:p-3 flex flex-col mt-0">
                    <div className="flex flex-col">
                      <div className="flex justify-between items-center mb-0">
                        <div className="flex space-x-1 sm:space-x-2">
                          <button
                            onClick={() => handleToggleLike(post.id)}
                            className={`p-1 rounded-full transition-colors sm:p-1 sm:rounded-full ${isLiked(post.id) 
                              ? 'text-red-500 bg-red-50 dark:bg-red-900/30' 
                              : isDarkMode 
                                ? 'text-gray-400 hover:text-red-400' 
                                : 'text-gray-600 hover:text-red-500'
                            }`}
                            style={{
                              transform: animatingLike === post.id ? 'scale(1.3)' : 'scale(1)',
                              animation: animatingLike === post.id ? 'heartBeat 0.6s ease-in-out' : 'none'
                            }}
                          >
                            <Heart className="w-3 h-3 sm:w-4 sm:h-4" fill={isLiked(post.id) ? 'currentColor' : 'none'} />
                          </button>
                          <Link
                            to={`/product/${post.id}/comments`}
                            className={`p-1 rounded-full transition-colors flex items-center space-x-1 ${isDarkMode 
                              ? 'text-gray-400 hover:text-blue-400 hover:bg-blue-900/30' 
                              : 'text-gray-600 hover:text-blue-500 hover:bg-blue-50'
                            }`}
                          >
                            <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                            {post.commentCount > 0 && (
                              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{post.commentCount}</span>
                            )}
                          </Link>
                          <button
                            onClick={() => toggleCart(post.id)}
                            className={`p-1 rounded-full transition-colors ${cartPosts[post.id] 
                              ? 'text-green-500 bg-green-50 dark:bg-green-900/30' 
                              : isDarkMode 
                                ? 'text-gray-400 hover:text-green-400' 
                                : 'text-gray-600 hover:text-green-500'
                            }`}
                          >
                            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleShareTo(post)}
                            className={`p-1 rounded-full transition-colors ${isDarkMode 
                              ? 'text-gray-400 hover:text-blue-400' 
                              : 'text-gray-600 hover:text-blue-500'
                            }`}
                            aria-label="Share"
                          >
                            <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleFavorite(post.id)}
                            className={`p-1 rounded-full transition-colors sm:p-1 sm:rounded-full ${isBookmarked(post.id) 
                              ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/30' 
                              : isDarkMode 
                                ? 'text-gray-400 hover:text-blue-400' 
                                : 'text-gray-600 hover:text-blue-500'
                            }`}
                            style={{
                              transform: animatingFavorite === post.id ? 'scale(1.2)' : 'scale(1)',
                              animation: animatingFavorite === post.id ? 'bookmarkPop 0.5s ease-out' : 'none'
                            }}
                          >
                            <Bookmark className="w-3 h-3 sm:w-4 sm:h-4" fill={isBookmarked(post.id) ? 'currentColor' : 'none'} />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 sm:justify-end">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${star <= post.rating 
                                ? 'text-yellow-500' 
                                : isDarkMode ? 'text-gray-600' : 'text-gray-300'
                              }`}
                              fill={star <= post.rating ? 'currentColor' : 'none'}
                            />
                          ))}
                        </div>
                        <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>({post.ratingCount})</span>
                      </div>
                    </div>
                    <Link 
                      to={`/product/${post.id}`} 
                      className={`hover:underline text-xs font-medium truncate mb-1 ${isDarkMode ? 'text-gray-200' : 'text-black'}`}
                    >
                      {post.product}
                    </Link>
                    <div className="mt-0 relative">
                      <button
                        onClick={(e) => toggleDescriptionExpansion(post.id, e)}
                        className={`description-toggle-button text-xs text-left w-full p-1 rounded transition-colors flex items-start ${isDarkMode 
                          ? 'text-gray-300 hover:text-blue-400 bg-gray-800 hover:bg-gray-700' 
                          : 'text-gray-600 hover:text-blue-500 bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <span className="text-left">{truncatedDescription}</span>
                      </button>
                    </div>
                  </div>
                </BuyerCardContent>
              </BuyerCard>
            );
          })}
        </div>

        {/* Empty State */}
        {posts.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
              No products found
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Try adjusting your filters or search terms
            </p>
            <button
              onClick={resetAllFilters}
              className="mt-4 px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Description Tooltip */}
        {expandedDescriptionId && (
          <div
            className="description-tooltip fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl max-h-[250px] w-[300px] overflow-hidden z-[101] pointer-events-auto animate-fadeIn"
            style={{
              top: `${expandedDescriptionPosition.top}px`,
              left: `${expandedDescriptionPosition.left}px`,
            }}
          >
            <div
              className="absolute -top-2 w-4 h-4 bg-white dark:bg-gray-800 border-l border-t border-gray-200 dark:border-gray-700 rotate-45 shadow-sm"
              style={{ left: `${Math.min(20, expandedDescriptionPosition.buttonWidth - 20)}px` }}
            />

            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-xl">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Product Description</h3>
              <button 
                onClick={() => setExpandedDescriptionId(null)} 
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 text-sm text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-line max-h-[150px] overflow-y-auto bg-white dark:bg-gray-800">
              {posts.find(p => p.id === expandedDescriptionId)?.content || 'No description available'}
            </div>

            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 flex justify-between items-center text-xs rounded-b-xl">
              <span className="text-gray-500 dark:text-gray-400">
                Seller: {posts.find(p => p.id === expandedDescriptionId)?.sellerName || 'Seller'}
              </span>
              <Link
                to={`/product/${expandedDescriptionId}`}
                className="text-blue-600 dark:text-blue-400 font-medium hover:underline transition-colors"
                onClick={() => setExpandedDescriptionId(null)}
              >
                View Product →
              </Link>
            </div>
          </div>
        )}

        {/* Dropdown Modal */}
        {dropdownOpen && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn" 
            onClick={closeDropdown}
          >
            <div 
              className={`rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} w-72 max-w-[90%] animate-scaleIn`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`p-4 border-b text-center ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className={`font-semibold text-lg ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>Post Options</h3>
              </div>
              <div className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
                {dropdownOpen && dropdownItems(posts.find(p => p.id === dropdownOpen)).map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={index}
                      onClick={item.action}
                      className={`w-full text-center px-4 py-3 text-sm transition-colors first:rounded-t-lg last:rounded-b-lg flex items-center justify-center gap-2 ${
                        isDarkMode 
                          ? 'text-gray-300 hover:bg-gray-700' 
                          : 'text-black hover:bg-gray-50'
                      } ${item.label === 'Report Seller' ? 'text-red-500 hover:text-red-600' : ''}`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Others Filter Modal */}
        <OthersFilterModal />

        {/* Share Modal */}
        {shareModalOpen && selectedProduct && (
          <ShareModal
            isOpen={shareModalOpen}
            onClose={() => {
              setShareModalOpen(false);
              setSelectedProduct(null);
              setSharingProduct(null);
            }}
            product={selectedProduct}
            isDarkMode={isDarkMode}
          />
        )}

        {/* Report Modal */}
        <ReportModal
          isOpen={reportModalOpen}
          onClose={() => {
            setReportModalOpen(false);
            setReportingSellerId(null);
            setReportingSellerName('');
            setReportingProductId(null);
            setReportingProductName('');
          }}
          sellerId={reportingSellerId}
          sellerName={reportingSellerName}
          productId={reportingProductId}
          productName={reportingProductName}
          isDarkMode={isDarkMode}
        />
      </div>
    </div>
  );
};

export default BuyerHomePage;