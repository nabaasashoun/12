import { BuyerCard, BuyerCardContent } from './BuyerCard';
import {
  Heart, MessageSquare, Star, Bookmark, Plus, Settings,
  MoreHorizontal, X, ChevronUp, ChevronDown, Moon, Sun
} from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useCart } from '../../utils/CartContext';
import { useLikeBookmark } from '../../utils/LikeBookmarkContext';
import Loader from '../UISkeleton/Loader';
import { usePageLoading } from '../../utils/PageLoadingContext';
import Header from './Header';
import { useDarkMode } from '../../utils/BuyerDarkModeContext';

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

const BuyerHomePage = () => {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
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
  const navigate = useNavigate();
  const { cartItems, addToCart, removeFromCart } = useCart();
  const { setIsPageLoading } = usePageLoading();
  const [categories, setCategories] = useState([]);

  const cartPosts = cartItems.reduce((acc, item) => {
    if (item.product?.id) acc[item.product.id] = true;
    return acc;
  }, {});

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

  const fetchProductsWithParams = useCallback(async (params = {}) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      return;
    }

    setIsPageLoading(true);
    setIsLoading(true);
    try {
      let productsResult;
      if (params.search && params.search.trim() !== '') {
        productsResult = await api.searchProducts(params.search, params.category);
      } else {
        productsResult = await api.getProducts();
      }
      const products = productsResult.data || [];

      const transformedPosts = products.map(product => {
        const productId = product.id;
        const sellerName = product.seller_name || product.seller?.name || 'Seller';
        const storeDisplay = `${sellerName}'s store`;

        return {
          id: productId,
          sellerName: storeDisplay,
          sellerUsername: product.seller?.user?.username || 'seller',
          authorAvatar: sellerName.charAt(0),
          price: formatCurrency(product.unit_price || 0),
          images: product.images && product.images.length > 0
            ? product.images
            : (product.product_photo ? [product.product_photo] : ['/sample1.jpg']),
          product: product.name || 'Product',
          content: product.description || 'No description available',
          rating: Math.round(product.rating_magnitude) || 0,
          ratingCount: product.rating_number || 0,
          commentCount: product.comment_count || 0,
          like_count: product.like_count || 0,
          sellerId: product.seller
        };
      });

      setPosts(transformedPosts);
    } catch (error) {
      console.error('Error fetching data:', error);
      setPosts(samplePosts);
    } finally {
      setIsLoading(false);
      setIsPageLoading(false);
    }
  }, [navigate, setIsPageLoading]);

  const handleSearch = (query, category) => {
    fetchProductsWithParams({ search: query, category });
  };

  useEffect(() => {
    fetchProductsWithParams();
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
        console.warn('Unexpected API response format, using sample data', result);
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

  if (contextLoading || !initialFetchDone || isLoading) {
    return (
      <div className={`p-3 sm:p-4 md:p-6 max-w-4xl mx-auto min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Loader />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className={`p-3 sm:p-4 md:p-6 max-w-4xl mx-auto ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center py-8">
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
            No products found.
          </p>
        </div>
      </div>
    );
  }

  const dropdownItems = [
    { label: 'Report', action: () => {} },
    { label: 'Message Seller', action: () => {} },
    { label: 'Go to Post', action: () => {} },
    { label: 'Share to', action: () => {} },
    { label: 'Copy Link', action: () => {} },
    { label: 'Remove from Cart', action: () => {} },
    { label: 'Unfollow', action: () => {} },
    { label: 'Cancel', action: closeDropdown },
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="p-2 sm:p-4 md:p-6 max-w-6xl mx-auto relative">
        {/* Dark Mode Toggle Button */}
        <button
          onClick={toggleDarkMode}
          className={`fixed top-4 right-4 z-50 p-3 rounded-full shadow-lg transition-colors ${isDarkMode 
            ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' 
            : 'bg-white text-gray-800 hover:bg-gray-100'
          }`}
          aria-label="Toggle dark mode"
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <Header
          showBackButton={true}
          onSearch={handleSearch}
          categories={categories}
          isDarkMode={isDarkMode}
        />

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
                  className="flex flex-col items-center flex-shrink-0 cursor-pointer"
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
                className="overflow-hidden flex flex-col relative"
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
                          ? 'text-gray-300 hover:text-blue-400 bg-gray-700 hover:bg-gray-600' 
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" 
            onClick={closeDropdown}
          >
            <div 
              className={`rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`} 
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`p-4 border text-center ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className={`font-semibold text-lg ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>Post Options</h3>
              </div>
              <div className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
                {dropdownItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={item.action}
                    className={`w-full text-center px-4 py-3 text-sm transition-colors first:rounded-t-lg last:rounded-b-lg ${isDarkMode 
                      ? 'text-gray-300 hover:bg-gray-700' 
                      : 'text-black hover:bg-gray-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <style>{`
          @keyframes heartBeat {
            0% { transform: scale(1); }
            25% { transform: scale(1.3); }
            50% { transform: scale(1); }
            75% { transform: scale(1.3); }
            100% { transform: scale(1); }
          }
          @keyframes bookmarkPop {
            0% { transform: scale(1); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-5px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.2s ease-out;
          }
        `}</style>
      </div>
    </div>
  );
};

export default BuyerHomePage;