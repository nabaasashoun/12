import { BuyerCard, BuyerCardContent } from './BuyerCard';
import {
  Heart, MessageSquare, Star, Bookmark, Plus, MoreHorizontal
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Loader from '../UISkeleton/Loader';
import { useDarkMode } from '../../utils/BuyerDarkModeContext';
import { useLikeBookmark } from '../../utils/LikeBookmarkContext';
import { useCart } from '../../utils/CartContext';
import { usePageLoading } from '../../utils/PageLoadingContext';
import api from '../../utils/api';
import Header from './Header';

const formatCurrency = (amount) => {
  return `UGX ${parseFloat(amount).toLocaleString('en-UG')}`;
};

const TrendingPage = () => {
  const { isDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const { isLiked, isBookmarked, toggleLike, toggleBookmark } = useLikeBookmark();
  const { cartItems, addToCart, removeFromCart } = useCart();
  const { setIsPageLoading } = usePageLoading();

  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);

  // Animations
  const [animatingLike, setAnimatingLike] = useState(null);
  const [animatingFavorite, setAnimatingFavorite] = useState(null);

  // Check if product is in cart
  const cartPosts = cartItems.reduce((acc, item) => {
    if (item.product?.id) acc[item.product.id] = true;
    return acc;
  }, {});

  // Fetch categories for the dropdown
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

  // Fetch products (trending initially)
  const fetchProducts = useCallback(async (params = {}) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      return;
    }

    setIsPageLoading(true);
    setLoading(true);
    try {
      let productsResult;
      const hasSearch = params.search && params.search.trim() !== '';
      const hasCategory = params.category && params.category !== 'all' && params.category !== '';

      if (hasSearch || hasCategory) {
        // Search with term and/or category
        productsResult = await api.searchProducts(params.search || '', params.category);
      } else {
        // No search, fetch trending (ordered by like_count)
        productsResult = await api.getProducts({ ordering: '-like_count' });
      }

      const products = productsResult.data || [];
      const transformedPosts = products.map(product => ({
        id: product.id,
        sellerName: product.seller_name || product.seller?.name || 'Seller',
        sellerUsername: product.seller?.user?.username || 'seller',
        authorAvatar: (product.seller_name || product.seller?.name || 'S').charAt(0),
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
      }));
      setPosts(transformedPosts);
    } catch (error) {
      console.error('Error fetching products:', error);
      setPosts([]);
    } finally {
      setLoading(false);
      setIsPageLoading(false);
    }
  }, [navigate, setIsPageLoading]);

  // Initial load: trending products
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handle search from Header
  const handleSearch = useCallback((query, category) => {
    fetchProducts({ search: query, category });
  }, [fetchProducts]);

  // Image carousel navigation
  const goToImage = (postId, imageIndex) => {
    setCurrentImageIndex(prev => ({ ...prev, [postId]: imageIndex }));
  };

  // Dropdown
  const toggleDropdown = (postId) => {
    setDropdownOpen(dropdownOpen === postId ? null : postId);
  };
  const closeDropdown = () => setDropdownOpen(null);

  // Like handler (uses context)
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

  // Bookmark handler
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

  // Cart handler
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

  if (loading) {
    return (
      <div className={`p-3 sm:p-4 md:p-6 max-w-4xl mx-auto min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Loader />
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="p-2 sm:p-4 md:p-6 max-w-6xl mx-auto relative">
        {/* Header with back button, search bar, and settings */}
        <Header
          showBackButton={true}
          onSearch={handleSearch}
          categories={categories}
          isDarkMode={isDarkMode}
        />

        {/* Trending Posts Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mt-4">
          {posts.map((post) => {
            const currentIndex = currentImageIndex[post.id] || 0;
            const totalImages = post.images.length;

            return (
              <BuyerCard key={post.id} variant="elevated" className="overflow-hidden flex flex-col">
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
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-green-600 dark:text-green-400 font-semibold">{post.price}</span>
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
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/300'; }}
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
                      className={`text-xs font-medium truncate mt-1 ${isDarkMode ? 'text-gray-200 hover:text-blue-400' : 'text-black hover:underline'}`}
                    >
                      {post.product}
                    </Link>
                    <p className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{post.content.length > 60 ? post.content.substring(0, 60) + '...' : post.content}</p>
                  </div>
                </BuyerCardContent>
              </BuyerCard>
            );
          })}
        </div>

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

          /* Force search inputs to have black text in ALL situations */
          input[type="text"],
          input[type="search"],
          input[placeholder*="Search"],
          input.search-input,
          input[type="text"]::placeholder,
          input[type="search"]::placeholder {
            color: #000000 !important;
            -webkit-text-fill-color: #000000 !important;
          }

          /* Placeholder should be gray, not disappearing or too light */
          input::placeholder {
            color: #6b7280 !important;
            opacity: 1 !important;
          }

          /* When focused — still keep text black */
          input:focus {
            color: #000000 !important;
          }

          /* Prevent dark mode / system preferences from overriding */
          @media (prefers-color-scheme: dark) {
            input[type="text"],
            input[type="search"] {
              color: #000000 !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default TrendingPage;