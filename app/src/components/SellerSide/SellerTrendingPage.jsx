import React, { useState, useEffect } from 'react';
import { Heart, MessageSquare, Star, Bookmark, Search, MoreHorizontal, X, TrendingUp } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useSellerDarkMode } from '../../utils/SellerDarkModeContext';

const SellerTrendingPage = () => {
  const { isDarkMode } = useSellerDarkMode();
  const navigate = useNavigate();
  const [searchFocused, setSearchFocused] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const [likedPosts, setLikedPosts] = useState({});
  const [favoritedPosts, setFavoritedPosts] = useState({});
  const [filter, setFilter] = useState('All');
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/seller/login');
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch('/api/products/?ordering=-like_count,-view_count', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        if (response.ok) {
          const data = await response.json();
          setPosts(data);
        } else if (response.status === 401) {
          localStorage.removeItem('accessToken');
          navigate('/seller/login');
        }
      } catch (error) {
        console.error('Error fetching trending:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTrending();
  }, [navigate]);

  const goToImage = (postId, imageIndex) => {
    setCurrentImageIndex(prev => ({ ...prev, [postId]: imageIndex }));
  };

  const toggleDropdown = (postId) => {
    setDropdownOpen(dropdownOpen === postId ? null : postId);
  };

  const closeDropdown = () => {
    setDropdownOpen(null);
  };

  const toggleLike = (postId) => {
    setLikedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const toggleFavorite = (postId) => {
    setFavoritedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const formatCurrency = (amount) => {
    return `UGX ${parseFloat(amount || 0).toLocaleString('en-UG')}`;
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

  const categories = ['All', 'Tech', 'Fitness', 'Home', 'Fashion', 'Food'];

  if (isLoading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} pb-16 md:pb-0`}>
        <div className="p-6 max-w-4xl mx-auto min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto ${isDarkMode ? 'border-green-400' : 'border-green-500'}`}></div>
            <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading trending products...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} pb-16 md:pb-0`}>
      {/* Header */}
      <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b sticky top-0 z-10`}>
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <p className={`text-[23px] font-bold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>Trending</p>
            <div className="relative group">
              <button 
                onClick={() => navigate('/seller/settings')}
                className={`${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'} p-1`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <span className={`absolute hidden group-hover:block -top-8 left-1/2 transform -translate-x-1/2 text-white text-xs rounded py-1 px-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-800'}`}>
                Settings
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-4 md:p-6 max-w-4xl mx-auto">
        {/* Search Bar */}
        <div className="flex justify-end items-center mb-4 sm:mb-6 gap-2 sm:gap-3">
          <div className="flex items-center w-full sm:w-auto">
            <div className={`flex w-full sm:w-64 border rounded-lg overflow-hidden ${
              isDarkMode ? 'border-gray-700' : 'border-gray-300'
            }`}>
              <select 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className={`w-1/5 px-3 py-2 focus:outline-none text-sm border-r ${
                  isDarkMode 
                    ? 'bg-gray-800 text-gray-200 border-gray-700' 
                    : 'bg-white text-black border-gray-300'
                }`}
              >
                {categories.map((title, index) => (
                  <option key={index} value={title}>
                    {title}
                  </option>
                ))}
              </select>
              <div className="relative w-4/5">
                <input
                  type="text"
                  placeholder="Search products..."
                  className={`w-full px-3 py-2 placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode 
                      ? 'bg-gray-800 text-gray-200' 
                      : 'bg-white text-black'
                  }`}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                />
                <Search className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`} />
              </div>
            </div>
          </div>
        </div>

        {/* Trending Posts Grid */}
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <TrendingUp className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              No trending products found
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {posts.map((post) => {
              const images = post.images && post.images.length > 0 
                ? post.images 
                : (post.product_photo ? [post.product_photo] : ['/placeholder.jpg']);
              const currentIndex = currentImageIndex[post.id] || 0;
              const totalImages = images.length;

              return (
                <div key={post.id} className={`rounded-lg overflow-hidden flex flex-col border ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700' 
                    : 'bg-white border-gray-200'
                } shadow-sm`}>
                  <div className="p-0 flex flex-col">
                    <div className={`p-2 sm:p-3 flex flex-col border-b ${
                      isDarkMode ? 'border-gray-700' : 'border-gray-100'
                    }`}>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs">
                            {post.name?.charAt(0) || 'P'}
                          </div>
                          <span className={`font-medium text-xs sm:text-sm truncate ${
                            isDarkMode ? 'text-gray-200' : 'text-black'
                          }`}>
                            {post.seller_name || 'Seller'}
                          </span>
                        </div>
                        <button
                          onClick={() => toggleDropdown(post.id)}
                          className={`p-1 rounded ${
                            isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                          }`}
                        >
                          <MoreHorizontal className={`w-3 h-3 sm:w-4 sm:h-4 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`} />
                        </button>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-green-600 font-semibold">
                          {formatCurrency(post.unit_price)}
                        </span>
                        <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          {post.like_count || 0} likes
                        </span>
                      </div>
                    </div>

                    <div
                      className="relative aspect-square w-full bg-gray-200 dark:bg-gray-700 flex-1"
                      onTouchStart={(e) => {
                        const touchStartX = e.touches[0].clientX;
                        setCurrentImageIndex((prev) => ({
                          ...prev,
                          touchStartX,
                        }));
                      }}
                      onTouchMove={(e) => {
                        const touchEndX = e.touches[0].clientX;
                        setCurrentImageIndex((prev) => ({
                          ...prev,
                          touchEndX,
                        }));
                      }}
                      onTouchEnd={() => {
                        const startX = currentImageIndex.touchStartX;
                        const endX = currentImageIndex.touchEndX;
                        const diff = startX - endX;

                        if (Math.abs(diff) > 50) {
                          if (diff > 0 && currentIndex < totalImages - 1) {
                            goToImage(post.id, currentIndex + 1);
                          }
                          if (diff < 0 && currentIndex > 0) {
                            goToImage(post.id, currentIndex - 1);
                          }
                        }

                        setCurrentImageIndex((prev) => ({
                          ...prev,
                          touchStartX: null,
                          touchEndX: null,
                        }));
                      }}
                    >
                      {totalImages > 1 && (
                        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10 flex space-x-1 px-2 py-1">
                          {images.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => goToImage(post.id, index)}
                              className={`w-1 h-1 rounded-full transition-all ${
                                index === currentIndex 
                                  ? isDarkMode ? 'bg-gray-400' : 'bg-gray-300'
                                  : isDarkMode ? 'bg-gray-600' : 'bg-gray-100'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                      <Link to={`/product/${post.id}`}>
                        <img
                          src={images[currentIndex] || '/placeholder.jpg'}
                          alt={post.name}
                          className="absolute inset-0 w-full h-full object-cover select-none"
                          onError={(e) => {
                            e.target.src = '/placeholder.jpg';
                          }}
                        />
                      </Link>
                    </div>

                    <div className="p-2 sm:p-3 flex flex-col mt-1">
                      <div className="flex flex-col">
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex space-x-1 sm:space-x-2">
                            <button
                              onClick={() => toggleLike(post.id)}
                              className={`p-1 rounded-full transition-colors ${
                                likedPosts[post.id] 
                                  ? 'text-red-500 bg-red-50 dark:bg-red-900/30' 
                                  : isDarkMode 
                                    ? 'text-gray-400 hover:text-red-400' 
                                    : 'text-gray-600 hover:text-red-500'
                              }`}
                            >
                              <Heart className="w-3 h-3 sm:w-4 sm:h-4" fill={likedPosts[post.id] ? 'currentColor' : 'none'} />
                            </button>
                            <button 
                              className={`p-1 rounded-full transition-colors ${
                                isDarkMode 
                                  ? 'text-gray-400 hover:text-blue-400' 
                                  : 'text-gray-600 hover:text-blue-500'
                              }`}
                            >
                              <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          </div>
                          <button
                            onClick={() => toggleFavorite(post.id)}
                            className={`p-1 rounded-full transition-colors ${
                              favoritedPosts[post.id] 
                                ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/30' 
                                : isDarkMode 
                                  ? 'text-gray-400 hover:text-blue-400' 
                                  : 'text-gray-600 hover:text-blue-500'
                            }`}
                          >
                            <Bookmark className="w-3 h-3 sm:w-4 sm:h-4" fill={favoritedPosts[post.id] ? 'currentColor' : 'none'} />
                          </button>
                        </div>
                        <div className="flex items-center space-x-1 sm:justify-end">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${
                                  star <= (post.rating_magnitude || 0) 
                                    ? 'text-yellow-500' 
                                    : isDarkMode ? 'text-gray-600' : 'text-gray-300'
                                }`}
                                fill={star <= (post.rating_magnitude || 0) ? 'currentColor' : 'none'}
                              />
                            ))}
                          </div>
                          <span className={`text-xs ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>({post.rating_number || 0})</span>
                        </div>
                      </div>
                      <Link 
                        to={`/product/${post.id}`} 
                        className={`hover:underline text-xs font-medium truncate mt-1 ${
                          isDarkMode ? 'text-gray-200' : 'text-black'
                        }`}
                      >
                        {post.name || 'Product Name'}
                      </Link>
                      <p className={`text-xs truncate mt-1 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {post.description || 'No description available'}...
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Dropdown Modal */}
        {dropdownOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closeDropdown}
          >
            <div
              className={`rounded-xl ${
                isDarkMode ? 'bg-gray-800' : 'bg-white'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`p-4 border text-center ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <h3 className={`font-semibold text-lg ${
                  isDarkMode ? 'text-gray-100' : 'text-black'
                }`}>Post Options</h3>
              </div>
              <div className={`divide-y ${
                isDarkMode ? 'divide-gray-700' : 'divide-gray-100'
              }`}>
                {dropdownItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={item.action}
                    className={`w-full text-center px-4 py-3 text-sm transition-colors first:rounded-t-lg last:rounded-b-lg ${
                      isDarkMode 
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

        {/* Search Results Placeholder */}
        {searchFocused && (
          <div className="mt-4">
            <p className={`text-center py-8 text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>Type to search for products, people, and topics</p>
            <div className="mt-4">
              <h3 className={`text-sm mb-3 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>Recent searches</h3>
              <div className="space-y-2">
                {['wireless headphones', 'fitness tracker', 'laptop backpack'].map((term, index) => (
                  <div key={index} className={`flex items-center p-3 rounded-lg cursor-pointer ${
                    isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                  }`}>
                    <Search className={`w-4 h-4 mr-3 ${
                      isDarkMode ? 'text-gray-600' : 'text-gray-400'
                    }`} />
                    <span className={`text-sm ${
                      isDarkMode ? 'text-gray-300' : 'text-black'
                    }`}>{term}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerTrendingPage;