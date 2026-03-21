import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Plus, Check, MessageCircle, MessageSquare, Heart, Star, Bookmark, MoreHorizontal } from 'lucide-react';
import { BuyerCard, BuyerCardContent } from './BuyerCard';
import api from '../../utils/api';
import { useCart } from '../../utils/CartContext';
import { useLikeBookmark } from '../../utils/LikeBookmarkContext';
import Loader from '../UISkeleton/Loader';
import { useDarkMode } from '../../utils/BuyerDarkModeContext';
import { useNotifications } from '../../utils/NotificationContext';
import Header from './Header'; // <-- import Header

const SellerPage = () => {
  const { isDarkMode } = useDarkMode();
  const { fetchNotifications } = useNotifications();
  const { sellerId } = useParams();
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [sellerMenuOpen, setSellerMenuOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const [isFollowing, setIsFollowing] = useState(false);
  const [showLocationTooltip, setShowLocationTooltip] = useState(false);
  const [animatingLike, setAnimatingLike] = useState(null);
  const [animatingFavorite, setAnimatingFavorite] = useState(null);
  const [followMessage, setFollowMessage] = useState('');
  const [followMessageType, setFollowMessageType] = useState('success');
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState(''); // client‑side filter
  const navigate = useNavigate();

  const { cartItems, addToCart, removeFromCart } = useCart();
  const { isLiked, isBookmarked, toggleLike, toggleBookmark } = useLikeBookmark();

  const cartPosts = cartItems.reduce((acc, item) => {
    if (item.product?.id) acc[item.product.id] = true;
    return acc;
  }, {});

  const formatCurrency = (amount) => {
    return `UGX ${parseFloat(amount).toLocaleString('en-UG')}`;
  };

  // Fetch categories for the Header dropdown
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

  // Handle search from Header – only filter products client‑side
  const handleSearch = (query, category) => {
    setSearchQuery(query);
    // category could be used later if we want to filter by category as well
  };

  // Filter products by name (client‑side) – only show products from this seller
  const filteredProducts = seller?.products.filter(product =>
    product.product.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Toggle like
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

  // Toggle bookmark
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

  // Toggle cart
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

  const toggleFollow = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const result = await api.toggleFollowSeller(sellerId);
      if (result.data) {
        setIsFollowing(result.data.following);
        setSeller(prev => ({
          ...prev,
          followers: result.data.followers_count
        }));
        setFollowMessageType('success');
        setFollowMessage(result.data.following ? 'Followed seller!' : 'Unfollowed seller');
        fetchNotifications();
        setTimeout(() => setFollowMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      setFollowMessageType('error');
      setFollowMessage('Failed to follow. Please try again.');
      setTimeout(() => setFollowMessage(''), 3000);
    }
  };

  // Fetch seller data
  useEffect(() => {
    const fetchSellerData = async () => {
      setLoading(true);
      try {
        const sellerResult = await api.request(`/sellers/${sellerId}/`);
        if (sellerResult.error) {
          if (sellerResult.status === 401) {
            localStorage.removeItem('accessToken');
            navigate('/login');
          }
          return;
        }

        const sellerData = sellerResult.data;

        let products = (sellerData.products || []).map(product => ({
          id: product.id,
          price: formatCurrency(product.unit_price),
          images: product.images?.length > 0
            ? product.images
            : (product.product_photo ? [product.product_photo] : ['/sample1.jpg']),
          product: product.name,
          content: product.description || 'No description',
          rating: Math.floor(product.rating_magnitude) || 0,
          ratingCount: product.rating_number || 0,
          like_count: product.like_count || 0,
          sellerId: sellerId
        }));

        setSeller({ ...sellerData, products });
        setIsFollowing(sellerData.is_following || false);

      } catch (error) {
        console.error('Error in fetchSellerData:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSellerData();
  }, [sellerId, navigate]);

  const goToImage = (postId, imageIndex) => {
    setCurrentImageIndex(prev => ({ ...prev, [postId]: imageIndex }));
  };

  const toggleDropdown = (postId) => {
    setDropdownOpen(dropdownOpen === postId ? null : postId);
  };

  const closeDropdown = () => {
    setDropdownOpen(null);
  };

  const dropdownItems = [
    { label: 'Report', action: () => {} },
    { label: 'Message Buyer', action: () => {} },
    { label: 'Go to Post', action: () => {} },
    { label: 'Share to', action: () => {} },
    { label: 'Copy Link', action: () => {} },
    { label: 'Remove from Cart', action: () => {} },
    { label: 'Unfollow', action: () => {} },
    { label: 'Cancel', action: closeDropdown },
  ];

  if (loading) {
    return (
      <div className={`min-h-screen transition-colors duration-300 flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className={`flex-1 rounded-t-3xl relative px-6 pt-8 pb-8 flex items-center justify-center transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <Loader />
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className={`min-h-screen transition-colors duration-300 flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className={`flex-1 rounded-t-3xl relative px-6 pt-8 pb-8 text-center transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <p className={`${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>Seller not found</p>
          <button 
            onClick={() => navigate('/')} 
            className={`mt-4 hover:underline transition-colors ${isDarkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-500 hover:text-indigo-700'}`}
          >
            Go back home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className={`flex-1 rounded-t-3xl relative px-6 pt-4 pb-4 transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="max-w-4xl mx-auto" style={{ animation: 'fadeIn 0.5s ease-out' }}>
          {/* Header with back button, search, and settings */}
          <Header
            showBackButton={true}
            onSearch={handleSearch}
            categories={categories}
            isDarkMode={isDarkMode}
          />

          {/* Follow Notification Message */}
          {followMessage && (
            <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-slideDown">
              <div className={`px-6 py-3 rounded-full shadow-lg flex items-center gap-2 ${followMessageType === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
                {followMessageType === 'success' ? <Check className="w-5 h-5" /> : <span className="text-lg">⚠️</span>}
                <span className="font-medium">{followMessage}</span>
              </div>
            </div>
          )}

          {/* Seller Header */}
          <div className={`flex items-center gap-4 p-4 rounded-lg mb-4 border transition-colors duration-300 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`} style={{ animation: 'slideUp 0.3s ease-out' }}>
            {/* Profile Avatar */}
            <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-r from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-2xl font-semibold">
              {seller.profile_photo ? (
                <img src={seller.profile_photo} alt={seller.name} className="w-full h-full object-cover" />
              ) : (
                <span>{seller.name?.charAt(0) || 'S'}</span>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{seller.name}'s store</h2>
                <button
                  onClick={() => setSellerMenuOpen(!sellerMenuOpen)}
                  className={`p-1 rounded-full transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <MoreHorizontal className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                </button>
              </div>

              {/* Stats */}
              <div className="flex gap-8">
                <div className="text-center">
                  <span className={`block font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{seller.followers?.toLocaleString() || '0'}</span>
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>followers</span>
                </div>
                <div className="text-center">
                  <span className={`block font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{seller.sales || '0'}</span>
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>sales</span>
                </div>
                <div className="text-center">
                  <span className={`block font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{Math.round(seller.trust || 0)}%</span>
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>trust</span>
                </div>
              </div>
            </div>
          </div>

          {/* Seller Menu Dropdown */}
          {sellerMenuOpen && (
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setSellerMenuOpen(false)}
            >
              <div className={`rounded-xl max-w-sm w-full transition-colors duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
                <div className={`p-4 border-b text-center ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h3 className={`font-semibold text-lg ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Seller Options</h3>
                </div>
                <div className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
                  {[
                    { label: 'Report Seller', action: () => {} },
                    { label: 'Share Profile', action: () => {} },
                    { label: 'Copy Link', action: () => {} },
                    { label: 'Cancel', action: () => setSellerMenuOpen(false) },
                  ].map((item, index) => (
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

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center w-full mb-4">
            {[
              {
                icon: <MapPin className="w-5 h-5 group-hover:scale-125 transition-transform" />,
                tooltip: seller.location || 'Location not set',
                action: () => setShowLocationTooltip(!showLocationTooltip)
              },
              {
                icon: isFollowing ? <Check className="w-5 h-5 group-hover:scale-125 transition-transform" /> : <span className="text-xs font-medium group-hover:scale-110 transition-transform">B+</span>,
                action: toggleFollow
              },
              {
                icon: <MessageCircle className="w-5 h-5 group-hover:scale-125 transition-transform" />,
                action: () => {}
              },
              {
                icon: <MessageSquare className="w-5 h-5 group-hover:scale-125 transition-transform" />,
                action: () => {}
              }
            ].map((btn, index) => (
              <div key={index} className="relative">
                <button
                  onClick={btn.action}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group ${
                    index === 1 && isFollowing
                      ? 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'
                      : isDarkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {btn.icon}
                </button>
                {btn.tooltip && showLocationTooltip && index === 0 && (
                  <span className={`absolute top-full mt-2 left-1/2 transform -translate-x-1/2 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-800'}`}>
                    {btn.tooltip}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* About Section */}
          <div className="mb-6">
            <p className={`text-base font-medium mb-1 transition-colors ${isDarkMode ? 'text-gray-200 hover:text-indigo-400' : 'text-gray-900 hover:text-indigo-600'}`}>
              About
            </p>
            <p className={`text-sm leading-relaxed line-clamp-2 hover:line-clamp-none hover:p-2 hover:rounded-lg transition-all ${isDarkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50'}`}>
              {seller.about || 'No about information provided.'}
            </p>
          </div>

          {/* Seller Products */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {(searchQuery ? filteredProducts : seller.products).map((post, index) => {
              const currentIndex = currentImageIndex[post.id] || 0;
              const totalImages = post.images.length;

              return (
                <BuyerCard
                  key={post.id}
                  variant="elevated"
                  className="overflow-hidden flex flex-col transition-all duration-500 hover:scale-[1.02] hover:shadow-xl group"
                  style={{
                    animation: `fadeInUp 0.5s ease-out ${index * 100}ms`,
                    animationFillMode: 'both'
                  }}
                >
                  <BuyerCardContent className="p-0 flex flex-col">
                    {/* Top section */}
                    <div className={`p-3 flex flex-col border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-green-600 font-semibold hover:text-green-700 transition-colors dark:text-green-400 dark:hover:text-green-300">
                          {post.price}
                        </span>
                        <button
                          onClick={() => toggleDropdown(post.id)}
                          className={`p-1 rounded transition-all hover:rotate-90 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                        >
                          <MoreHorizontal className={`w-4 h-4 ${isDarkMode ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-500 group-hover:text-gray-700'}`} />
                        </button>
                      </div>
                    </div>

                    {/* Image section */}
                    <div className={`relative aspect-square w-full overflow-hidden ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      {totalImages > 1 && (
                        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10 flex space-x-1 px-2 py-1 bg-black/50 rounded-full backdrop-blur-sm">
                          {post.images.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => goToImage(post.id, idx)}
                              className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentIndex ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/75'}`}
                            />
                          ))}
                        </div>
                      )}

                      <Link to={`/product/${post.id}`}>
                        <img
                          src={post.images[currentIndex]}
                          alt={post.product}
                          className="absolute inset-0 w-full h-full object-cover select-none transition-transform duration-700 group-hover:scale-110"
                        />
                      </Link>
                    </div>

                    {/* Bottom section */}
                    <div className="p-3 flex flex-col">
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex space-x-1">
                          {/* Like */}
                          <button
                            onClick={() => handleToggleLike(post.id)}
                            className={`p-1 rounded-full transition-all hover:scale-110 active:scale-95 ${isLiked(post.id) ? 'text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50' : isDarkMode ? 'text-gray-400 hover:text-red-400 hover:bg-red-900/30' : 'text-gray-600 hover:text-red-500 hover:bg-red-50'}`}
                            style={{
                              transform: animatingLike === post.id ? 'scale(1.3)' : 'scale(1)',
                              animation: animatingLike === post.id ? 'heartBeat 0.6s ease-in-out' : 'none'
                            }}
                          >
                            <Heart className="w-4 h-4" fill={isLiked(post.id) ? 'currentColor' : 'none'} />
                          </button>

                          <button className={`p-1 rounded-full transition-all hover:scale-110 active:scale-95 ${isDarkMode ? 'text-gray-400 hover:text-indigo-400 hover:bg-indigo-900/30' : 'text-gray-600 hover:text-indigo-500 hover:bg-indigo-50'}`}>
                            <MessageSquare className="w-4 h-4" />
                          </button>

                          {/* Cart */}
                          <button
                            onClick={() => toggleCart(post.id)}
                            className={`p-1 rounded-full transition-all hover:scale-110 active:scale-95 ${cartPosts[post.id] ? 'text-green-500 bg-green-50 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50' : isDarkMode ? 'text-gray-400 hover:text-green-400 hover:bg-green-900/30' : 'text-gray-600 hover:text-green-500 hover:bg-green-50'}`}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Bookmark */}
                        <button
                          onClick={() => handleToggleFavorite(post.id)}
                          className={`p-1 rounded-full transition-all hover:scale-110 active:scale-95 ${isBookmarked(post.id) ? 'text-indigo-500 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50' : isDarkMode ? 'text-gray-400 hover:text-indigo-400 hover:bg-indigo-900/30' : 'text-gray-600 hover:text-indigo-500 hover:bg-indigo-50'}`}
                          style={{
                            transform: animatingFavorite === post.id ? 'scale(1.2)' : 'scale(1)',
                            animation: animatingFavorite === post.id ? 'bookmarkPop 0.5s ease-out' : 'none'
                          }}
                        >
                          <Bookmark className="w-4 h-4" fill={isBookmarked(post.id) ? 'currentColor' : 'none'} />
                        </button>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center space-x-1">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3 h-3 transition-transform hover:scale-125 ${star <= post.rating ? 'text-yellow-500' : isDarkMode ? 'text-gray-600' : 'text-gray-300'}`}
                                fill={star <= post.rating ? 'currentColor' : 'none'}
                              />
                            ))}
                          </div>
                          <span className={`text-xs transition-colors ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}>
                            ({post.ratingCount})
                          </span>
                        </div>
                      </div>

                      <Link
                        to={`/product/${post.id}`}
                        className={`text-sm font-medium truncate transition-colors mt-1 ${isDarkMode ? 'text-gray-200 hover:text-indigo-400' : 'text-gray-900 hover:text-indigo-600'}`}
                      >
                        {post.product}
                      </Link>
                      <p className={`text-xs truncate transition-colors ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}>
                        {post.content.length > 40 ? post.content.substring(0, 40) + '...' : post.content}
                      </p>
                    </div>
                  </BuyerCardContent>
                </BuyerCard>
              );
            })}
          </div>

          {/* Dropdown Modal for Posts */}
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
                  {dropdownItems.map((item, index) => (
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
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideDown {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeInUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
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
        /* Force black text in search input */
        input[type="text"],
        input[type="search"],
        input[placeholder*="Search"],
        input.search-input {
          color: black !important;
          -webkit-text-fill-color: black !important;
        }
      `}</style>
    </div>
  );
};

export default SellerPage;