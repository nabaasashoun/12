import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Plus, Check, MessageCircle, MessageSquare, Heart, Star, Bookmark, MoreHorizontal, Settings, Search } from 'lucide-react';
import { Card, CardContent } from './card';
import { api } from '../../utils/api';
import { useCart } from '../../utils/CartContext';
import Loader from '../UISkeleton/Loader';


const SellerPage = () => {
  const { sellerId } = useParams();
  const [searchFocused, setSearchFocused] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [sellerMenuOpen, setSellerMenuOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const [likedPosts, setLikedPosts] = useState({});
  const [favoritedPosts, setFavoritedPosts] = useState({});
  const [isFollowing, setIsFollowing] = useState(false);
  const [showLocationTooltip, setShowLocationTooltip] = useState(false);
  const [animatingLike, setAnimatingLike] = useState(null);
  const [animatingFavorite, setAnimatingFavorite] = useState(null);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Cart context
  const { cartItems, addToCart, removeFromCart } = useCart();
  const cartPosts = cartItems.reduce((acc, item) => {
    if (item.product?.id) acc[item.product.id] = true;
    return acc;
  }, {});

  const formatCurrency = (amount) => {
    return `UGX ${parseFloat(amount).toLocaleString('en-UG')}`;
  };

  // Toggle like
  const toggleLike = async (postId) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const result = await api.toggleLike(postId);
      if (result.data) {
        const newLikedStatus = result.data.liked;
        setLikedPosts(prev => ({ ...prev, [postId]: newLikedStatus }));
        setSeller(prev => ({
          ...prev,
          products: prev.products.map(p =>
            p.id === postId ? { ...p, like_count: result.data.like_count } : p
          )
        }));
        setAnimatingLike(postId);
        setTimeout(() => setAnimatingLike(null), 600);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  // Toggle bookmark
  const toggleFavorite = async (postId) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const result = await api.toggleWishlist(postId);
      if (result.data) {
        const isNowBookmarked = result.data.action === 'added';
        setFavoritedPosts(prev => ({ ...prev, [postId]: isNowBookmarked }));
        setAnimatingFavorite(postId);
        setTimeout(() => setAnimatingFavorite(null), 500);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
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

  // Toggle follow seller
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
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
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

        // Transform products
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
          is_liked: false,
          is_bookmarked: false
        }));

        setSeller({ ...sellerData, products });
        setIsFollowing(sellerData.is_following || false);

        // Fetch liked and bookmarked statuses
        const token = localStorage.getItem('accessToken');
        if (token) {
          const likedMap = {};
          const bookmarkedMap = {};

          const likedResult = await api.getLikedProducts();
          if (likedResult.data && Array.isArray(likedResult.data)) {
            likedResult.data.forEach(p => { likedMap[p.id] = true; });
          }

          const wishlistResult = await api.getWishlist();
          if (wishlistResult.data && wishlistResult.data.status === 'success' && wishlistResult.data.items) {
            wishlistResult.data.items.forEach(item => {
              if (item.product && item.product.id) bookmarkedMap[item.product.id] = true;
            });
          }

          setLikedPosts(likedMap);
          setFavoritedPosts(bookmarkedMap);
        }
      } catch (error) {
        console.error('Error in fetchSellerData:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSellerData();
  }, [sellerId, navigate]);

  // Sync liked/bookmarked status into seller.products
  useEffect(() => {
    if (seller) {
      setSeller(prev => ({
        ...prev,
        products: prev.products.map(p => ({
          ...p,
          is_liked: likedPosts[p.id] || false,
          is_bookmarked: favoritedPosts[p.id] || false
        }))
      }));
    }
  }, [likedPosts, favoritedPosts]);

  // Helper functions
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
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <div className="flex-1 bg-white rounded-t-3xl relative px-6 pt-8 pb-8 flex items-center justify-center">
          <Loader />
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <div className="flex-1 bg-white rounded-t-3xl relative px-6 pt-8 pb-8 text-center">
          <p className="text-red-600">Seller not found</p>
          <button onClick={() => navigate('/')} className="mt-4 text-indigo-500 hover:underline">
            Go back home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* White Card */}
      <div className="flex-1 bg-white rounded-t-3xl relative px-6 pt-4 pb-4">
        <div className="max-w-4xl mx-auto" style={{ animation: 'fadeIn 0.5s ease-out' }}>
          {/* Search and Settings */}
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <div className="flex w-full sm:w-64">
              <select
                className="w-1/3 px-3 py-2 bg-gray-50 border-0 rounded-l-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                onChange={(e) => {}}
              >
                <option value="all">All</option>
                <option value="tech">Tech</option>
                <option value="fitness">Fitness</option>
                <option value="home">Home</option>
                <option value="fashion">Fashion</option>
              </select>
              <div className="relative w-2/3">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full px-3 py-2 bg-gray-50 border-0 rounded-r-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
            </div>
            <div className="relative group ml-4">
              <button className="text-gray-600 hover:text-indigo-500 p-2 transition-all duration-300 hover:rotate-90">
                <Settings className="w-5 h-5" />
              </button>
              <span className="absolute hidden group-hover:block -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                Settings
              </span>
            </div>
          </div>

          {/* Seller Header - New UI */}
          <div className="flex items-center gap-4 p-4 bg-white rounded-lg mb-4 border border-gray-100" style={{ animation: 'slideUp 0.3s ease-out' }}>
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
              {/* Username and Menu */}
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-900">{seller.name}'s store</h2>
                <button
                  onClick={() => setSellerMenuOpen(!sellerMenuOpen)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <MoreHorizontal className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Stats */}
              <div className="flex gap-8">
                <div className="text-center">
                  <span className="block font-semibold text-gray-900">{seller.followers?.toLocaleString() || '0'}</span>
                  <span className="text-sm text-gray-500">followers</span>
                </div>
                <div className="text-center">
                  <span className="block font-semibold text-gray-900">{seller.sales || '0'}</span>
                  <span className="text-sm text-gray-500">sales</span>
                </div>
                <div className="text-center">
                  <span className="block font-semibold text-gray-900">{seller.trust || 0}%</span>
                  <span className="text-sm text-gray-500">trust</span>
                </div>
              </div>
            </div>
          </div>

          {/* Seller Menu Dropdown */}
          {sellerMenuOpen && (
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              style={{ animation: 'fadeIn 0.2s ease-out' }}
              onClick={() => setSellerMenuOpen(false)}
            >
              <div
                className="bg-white rounded-xl max-w-sm w-full"
                style={{
                  animation: 'scaleUp 0.3s ease-out',
                  animationFillMode: 'both'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 border-b border-gray-200 text-center">
                  <h3 className="font-semibold text-lg text-gray-900">Seller Options</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {[
                    { label: 'Report Seller', action: () => {} },
                    { label: 'Share Profile', action: () => {} },
                    { label: 'Copy Link', action: () => {} },
                    { label: 'Cancel', action: () => setSellerMenuOpen(false) },
                  ].map((item, index) => (
                    <button
                      key={index}
                      onClick={item.action}
                      className="w-full text-center px-4 py-3 text-sm hover:bg-gray-50 text-gray-700 first:rounded-t-lg last:rounded-b-lg transition-all hover:text-indigo-600"
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
                icon: isFollowing ? (
                  <Check className="w-5 h-5 group-hover:scale-125 transition-transform" />
                ) : (
                  <span className="text-xs font-medium group-hover:scale-110 transition-transform">B+</span>
                ),
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
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    index === 1 && isFollowing
                      ? 'bg-green-100 text-green-600 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } hover:scale-110 active:scale-95 group`}
                >
                  {btn.icon}
                </button>
                {btn.tooltip && showLocationTooltip && index === 0 && (
                  <span className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                    {btn.tooltip}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* About Section */}
          <div className="mb-6">
            <p className="text-base font-medium text-gray-900 mb-1 hover:text-indigo-600 transition-colors">
              About
            </p>
            <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 hover:line-clamp-none hover:bg-gray-50 hover:p-2 hover:rounded-lg transition-all">
              {seller.about || 'No about information provided.'}
            </p>
          </div>

          {/* Seller Products */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {seller.products.map((post, index) => {
              const currentIndex = currentImageIndex[post.id] || 0;
              const totalImages = post.images.length;

              return (
                <Card
                  key={post.id}
                  variant="elevated"
                  className="overflow-hidden flex flex-col transition-all duration-500 hover:scale-[1.02] hover:shadow-xl group bg-white border-0"
                  style={{
                    animation: `fadeInUp 0.5s ease-out ${index * 100}ms`,
                    animationFillMode: 'both'
                  }}
                >
                  <CardContent className="p-0 flex flex-col">
                    {/* Top section */}
                    <div className="p-3 flex flex-col border-b border-gray-100">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-green-600 font-semibold hover:text-green-700 transition-colors">
                          {post.price}
                        </span>
                        <button
                          onClick={() => toggleDropdown(post.id)}
                          className="p-1 rounded hover:bg-gray-100 transition-all hover:rotate-90"
                        >
                          <MoreHorizontal className="w-4 h-4 text-gray-500 group-hover:text-gray-700" />
                        </button>
                      </div>
                    </div>

                    {/* Image section */}
                    <div className="relative aspect-square w-full bg-gray-200 overflow-hidden">
                      {totalImages > 1 && (
                        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10 flex space-x-1 px-2 py-1 bg-black/50 rounded-full backdrop-blur-sm">
                          {post.images.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => goToImage(post.id, idx)}
                              className={`w-1.5 h-1.5 rounded-full transition-all ${
                                idx === currentIndex
                                  ? 'bg-white scale-125'
                                  : 'bg-white/50 hover:bg-white/75'
                              }`}
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
                            onClick={() => toggleLike(post.id)}
                            className={`p-1 rounded-full transition-all ${
                              likedPosts[post.id]
                                ? 'text-red-500 bg-red-50 hover:bg-red-100'
                                : 'text-gray-600 hover:text-red-500 hover:bg-red-50'
                            } hover:scale-110 active:scale-95`}
                            style={{
                              transform: animatingLike === post.id ? 'scale(1.3)' : 'scale(1)',
                              animation: animatingLike === post.id ? 'heartBeat 0.6s ease-in-out' : 'none'
                            }}
                          >
                            <Heart className="w-4 h-4" fill={likedPosts[post.id] ? 'currentColor' : 'none'} />
                          </button>

                          <button className="p-1 text-gray-600 hover:text-indigo-500 rounded-full hover:bg-indigo-50 transition-all hover:scale-110 active:scale-95">
                            <MessageSquare className="w-4 h-4" />
                          </button>

                          {/* Cart */}
                          <button
                            onClick={() => toggleCart(post.id)}
                            className={`p-1 rounded-full transition-all ${
                              cartPosts[post.id]
                                ? 'text-green-500 bg-green-50 hover:bg-green-100'
                                : 'text-gray-600 hover:text-green-500 hover:bg-green-50'
                            } hover:scale-110 active:scale-95`}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Bookmark */}
                        <button
                          onClick={() => toggleFavorite(post.id)}
                          className={`p-1 rounded-full transition-all ${
                            favoritedPosts[post.id]
                              ? 'text-indigo-500 bg-indigo-50 hover:bg-indigo-100'
                              : 'text-gray-600 hover:text-indigo-500 hover:bg-indigo-50'
                          } hover:scale-110 active:scale-95`}
                          style={{
                            transform: animatingFavorite === post.id ? 'scale(1.2)' : 'scale(1)',
                            animation: animatingFavorite === post.id ? 'bookmarkPop 0.5s ease-out' : 'none'
                          }}
                        >
                          <Bookmark className="w-4 h-4" fill={favoritedPosts[post.id] ? 'currentColor' : 'none'} />
                        </button>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center space-x-1">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3 h-3 transition-transform hover:scale-125 ${
                                  star <= post.rating ? 'text-yellow-500' : 'text-gray-300'
                                }`}
                                fill={star <= post.rating ? 'currentColor' : 'none'}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-gray-500 hover:text-gray-700 transition-colors">
                            ({post.ratingCount})
                          </span>
                        </div>
                      </div>

                      <Link
                        to={`/product/${post.id}`}
                        className="text-gray-900 hover:text-indigo-600 text-sm font-medium truncate transition-colors mt-1"
                      >
                        {post.product}
                      </Link>
                      <p className="text-xs text-gray-500 truncate hover:text-gray-700 transition-colors">
                        {post.content.length > 40 ? post.content.substring(0, 40) + '...' : post.content}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Dropdown Modal for Posts */}
          {dropdownOpen && (
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              style={{ animation: 'fadeIn 0.2s ease-out' }}
              onClick={closeDropdown}
            >
              <div
                className="bg-white rounded-xl max-w-sm w-full"
                style={{
                  animation: 'scaleUp 0.3s ease-out',
                  animationFillMode: 'both'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 border-b border-gray-200 text-center">
                  <h3 className="font-semibold text-lg text-gray-900">Post Options</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {dropdownItems.map((item, index) => (
                    <button
                      key={index}
                      onClick={item.action}
                      className="w-full text-center px-4 py-3 text-sm hover:bg-gray-50 text-gray-700 first:rounded-t-lg last:rounded-b-lg transition-all hover:text-indigo-600"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Search Results */}
          {searchFocused && (
            <div className="mt-6" style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <p className="text-gray-500 text-center py-8 text-sm animate-pulse">
                Type to search for products, people, and topics
              </p>
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Recent searches</h3>
                <div className="space-y-2">
                  {['wireless headphones', 'fitness tracker', 'laptop backpack'].map((term, index) => (
                    <div
                      key={index}
                      className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-all hover:translate-x-2"
                      style={{ animation: `slideInRight 0.3s ease-out ${index * 100}ms` }}
                    >
                      <Search className="w-4 h-4 text-gray-400 mr-3" />
                      <span className="text-gray-700 text-sm hover:text-indigo-600 transition-colors">
                        {term}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Animations */}
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
        @keyframes slideInRight {
          from { transform: translateX(20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeInUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
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
      `}</style>
    </div>
  );
};

export default SellerPage;