// TrendingPage.jsx - Updated with main product image and share UI
import { BuyerCard, BuyerCardContent } from './BuyerCard';
import {
  Heart, MessageSquare, Star, Bookmark, Plus, MoreHorizontal, Share2, ExternalLink
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Loader from '../UISkeleton/Loader';
import { useDarkMode } from '../../utils/BuyerDarkModeContext';
import { useLikeBookmark } from '../../utils/LikeBookmarkContext';
import { useCart } from '../../utils/CartContext';
import { usePageLoading } from '../../utils/PageLoadingContext';
import { useChat } from '../../utils/ChatContext';
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
  const { startChat } = useChat();

  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [showShareModal, setShowShareModal] = useState(null);

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
      const hasLocation = params.location && params.location.trim() !== '';

      if (hasSearch || hasCategory || hasLocation) {
        productsResult = await api.searchProducts(params.search || '', params.category, params.location || '');
      } else {
        productsResult = await api.getProducts({ ordering: '-like_count' });
      }

      const products = productsResult.data || [];
      const transformedPosts = products.map(product => ({
        id: product.id,
        sellerName: product.seller_name || product.seller?.name || 'Seller',
        sellerUsername: product.seller?.user?.username || 'seller',
        authorAvatar: (product.seller_name || product.seller?.name || 'S').charAt(0),
        price: formatCurrency(product.unit_price || 0),
        // Use product_photo as main image, fallback to first image, then placeholder
        mainImage: product.product_photo || (product.images && product.images.length > 0 ? product.images[0] : null),
        images: product.images && product.images.length > 0
          ? product.images
          : (product.product_photo ? [product.product_photo] : ['/sample1.jpg']),
        product: product.name || 'Product',
        content: product.description || 'No description available',
        rating: Math.round(product.rating_magnitude) || 0,
        ratingCount: product.rating_number || 0,
        commentCount: product.comment_count || 0,
        like_count: product.like_count || 0,
        sellerId: product.seller,
        sellerUserId: product.seller_user_id,
        location: product.location || product.seller?.location || '',
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
  const handleSearch = useCallback((query, category, location) => {
    setFilterCategory(category || '');
    setFilterLocation(location || '');
    fetchProducts({ search: query, category, location });
  }, [fetchProducts]);

  // Handle filter change
  const handleFilterChange = useCallback((filters) => {
    setFilterCategory(filters.category || '');
    setFilterLocation(filters.location || '');
    fetchProducts({ 
      search: filters.search || '', 
      category: filters.category || '', 
      location: filters.location || '' 
    });
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

  // Share handlers
  const handleShare = (postId) => {
    setShowShareModal(postId);
    closeDropdown();
  };

  const closeShareModal = () => setShowShareModal(null);

  const handleCopyLink = async (postId) => {
    const url = `${window.location.origin}/product/${postId}`;
    try {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    } catch (err) {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Link copied to clipboard!');
    }
    closeShareModal();
  };

  const handleShareSocial = (postId, platform) => {
    const url = `${window.location.origin}/product/${postId}`;
    const text = `Check out this product on TrendSync!`;
    let shareUrl = '';
    
    switch(platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=Check out this product&body=${encodeURIComponent(text + '\n\n' + url)}`;
        break;
      default:
        return;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
    closeShareModal();
  };

  // Like handler
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

  const dropdownItems = (postId) => {
    const post = posts.find(p => p.id === postId);
    return [
      { label: 'Report', action: () => {} },
      { 
        label: 'Message Seller', 
        action: async () => {
          closeDropdown();
          let targetUserId = post?.sellerUserId;
          if (!targetUserId && post?.sellerId) {
            const r = await api.getSellerUserID(post.sellerId);
            if (!r.error && r.data?.user) {
              targetUserId = r.data.user;
            }
          }
          if (targetUserId) {
            startChat(targetUserId);
            navigate('/chat');
          } else {
            console.warn('Could not resolve seller user ID', post);
          }
        }
      },
      { label: 'Go to Post', action: () => { closeDropdown(); navigate(`/product/${postId}`); } },
      { label: 'Share', action: () => handleShare(postId) },
      { label: 'Copy Link', action: () => { handleCopyLink(postId); closeDropdown(); } },
      { label: 'Remove from Cart', action: () => {} },
      { label: 'Unfollow', action: () => {} },
      { label: 'Cancel', action: closeDropdown },
    ];
  };

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
        {/* Header with back button, search bar, filters, and Settings icon */}
        <Header
          showBackButton={true}
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          categories={categories}
          isDarkMode={isDarkMode}
          initialCategory={filterCategory}
          initialLocation={filterLocation}
          showFilters={true}
          showSettings={true}
          settingsPath="/settings"
        />

        {/* Trending Posts Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mt-4">
          {posts.map((post) => {
            const currentIndex = currentImageIndex[post.id] || 0;
            const totalImages = post.images.length;
            // Use mainImage if available, otherwise use the first image from the carousel
            const displayImage = post.mainImage || post.images[currentIndex] || '/sample1.jpg';

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

                  {/* Image - Main product image with link */}
                  <Link to={`/product/${post.id}`} className="relative aspect-square w-full bg-gray-200 dark:bg-gray-700 flex-1 block">
                    <img
                      src={displayImage}
                      alt={post.product}
                      className="absolute inset-0 w-full h-full object-cover select-none"
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/300?text=No+Image'; }}
                    />
                    {/* Image indicator dots for carousel */}
                    {totalImages > 1 && (
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-10 flex space-x-1 px-2 py-1 bg-black/30 rounded-full backdrop-blur-sm">
                        {post.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={(e) => {
                              e.preventDefault();
                              goToImage(post.id, index);
                            }}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${index === currentIndex
                              ? 'bg-white'
                              : 'bg-white/50 hover:bg-white/75'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </Link>

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
                            onClick={() => handleShare(post.id)}
                            className={`p-1 rounded-full transition-colors ${isDarkMode
                              ? 'text-gray-400 hover:text-blue-400 hover:bg-blue-900/30'
                              : 'text-gray-600 hover:text-blue-500 hover:bg-blue-50'
                            }`}
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
                        <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          ({post.ratingCount})
                        </span>
                      </div>
                      <Link
                        to={`/product/${post.id}`}
                        className={`text-xs sm:text-sm font-medium truncate mt-0.5 hover:underline ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}
                      >
                        {post.product}
                      </Link>
                      <p className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {post.content.length > 50 ? post.content.substring(0, 50) + '...' : post.content}
                      </p>
                    </div>
                  </div>
                </BuyerCardContent>
              </BuyerCard>
            );
          })}
        </div>

        {/* Share Modal */}
        {showShareModal && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closeShareModal}
          >
            <div className={`rounded-xl max-w-sm w-full transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
              <div className={`p-4 border-b text-center ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className={`font-semibold text-lg ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Share Product</h3>
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Share this product with your friends</p>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => handleShareSocial(showShareModal, 'whatsapp')}
                    className={`p-3 rounded-lg text-center transition-all hover:scale-105 ${isDarkMode ? 'bg-green-900/30 hover:bg-green-900/50' : 'bg-green-50 hover:bg-green-100'}`}
                  >
                    <div className="text-2xl mb-1">💬</div>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>WhatsApp</span>
                  </button>
                  <button
                    onClick={() => handleShareSocial(showShareModal, 'facebook')}
                    className={`p-3 rounded-lg text-center transition-all hover:scale-105 ${isDarkMode ? 'bg-blue-900/30 hover:bg-blue-900/50' : 'bg-blue-50 hover:bg-blue-100'}`}
                  >
                    <div className="text-2xl mb-1">📘</div>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Facebook</span>
                  </button>
                  <button
                    onClick={() => handleShareSocial(showShareModal, 'twitter')}
                    className={`p-3 rounded-lg text-center transition-all hover:scale-105 ${isDarkMode ? 'bg-blue-900/30 hover:bg-blue-900/50' : 'bg-blue-50 hover:bg-blue-100'}`}
                  >
                    <div className="text-2xl mb-1">🐦</div>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Twitter</span>
                  </button>
                  <button
                    onClick={() => handleShareSocial(showShareModal, 'email')}
                    className={`p-3 rounded-lg text-center transition-all hover:scale-105 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                  >
                    <div className="text-2xl mb-1">📧</div>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email</span>
                  </button>
                  <button
                    onClick={() => handleCopyLink(showShareModal)}
                    className={`p-3 rounded-lg text-center transition-all hover:scale-105 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} col-span-1`}
                  >
                    <div className="text-2xl mb-1">🔗</div>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Copy Link</span>
                  </button>
                </div>
              </div>
              <div className={`p-3 border-t text-center ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <button
                  onClick={closeShareModal}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dropdown Modal */}
        {dropdownOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closeDropdown}
          >
            <div className={`rounded-xl max-w-sm w-full transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
              <div className={`p-4 border-b text-center ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className={`font-semibold text-lg ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Post Options</h3>
              </div>
              <div className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
                {dropdownItems(dropdownOpen).map((item, index) => (
                  <button
                    key={index}
                    onClick={item.action}
                    className={`w-full text-center px-4 py-3 text-sm transition-all first:rounded-t-lg last:rounded-b-lg ${isDarkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-indigo-400' : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes heartBeat {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.3); }
          50% { transform: scale(1); }
          75% { transform: scale(1.3); }
        }
        @keyframes bookmarkPop {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default TrendingPage;