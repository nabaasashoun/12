import { useState, useEffect } from 'react';
import { Card, CardContent } from './card';
import { User, Mail, Phone, MapPin, Edit, Heart, ShoppingCart, Bookmark, MessageSquare, Star, MoreHorizontal, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useCart } from '../../utils/CartContext';
import { useLikeBookmark } from '../../utils/LikeBookmarkContext';
import AnimatedLoader from '../UISkeleton/Loader';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const BASE_URL = API_URL.replace('/api', '');

const getFullImageUrl = (url) => {
  if (!url) return '/sample1.jpg';
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return `${BASE_URL}${url}`;
  return url;
};

const DotSpinner = () => (
  <div className="relative w-4 h-4">
    <div className="spinner-dot" style={{ animationDelay: '0.15s', backgroundColor: 'rgba(0,77,255,0.9)' }} />
    <div className="spinner-dot" style={{ animationDelay: '0.3s', backgroundColor: 'rgba(0,77,255,0.8)' }} />
    <div className="spinner-dot" style={{ animationDelay: '0.45s', backgroundColor: 'rgba(0,77,255,0.7)' }} />
    <div className="spinner-dot" style={{ animationDelay: '0.6s', backgroundColor: 'rgba(0,77,255,0.6)' }} />
    <div className="spinner-dot" style={{ animationDelay: '0.75s', backgroundColor: 'rgba(0,77,255,0.5)' }} />
  </div>
);

const AccountPage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [animatingLike, setAnimatingLike] = useState(null);
  const [animatingFavorite, setAnimatingFavorite] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState({});

  const [bookmarkedProducts, setBookmarkedProducts] = useState([]);
  const [likedProducts, setLikedProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [contentLoading, setContentLoading] = useState({
    bookmarks: false,
    liked: false,
    orders: false
  });

  const { 
    isLiked, 
    isBookmarked, 
    toggleLike, 
    toggleBookmark,
    likedPosts 
  } = useLikeBookmark();

  const { cartItems, addToCart, removeFromCart } = useCart();
  const cartPosts = cartItems.reduce((acc, item) => {
    if (item.product?.id) acc[item.product.id] = true;
    return acc;
  }, {});

  const formatCurrency = (amount) => {
    return `UGX ${parseFloat(amount).toLocaleString('en-UG')}`;
  };

  const goToImage = (postId, imageIndex) => {
    setCurrentImageIndex(prev => ({ ...prev, [postId]: imageIndex }));
  };

  const toggleDropdown = (postId) => {
    setDropdownOpen(dropdownOpen === postId ? null : postId);
  };

  const closeDropdown = () => setDropdownOpen(null);

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

  // Listen for like toggles from other components
  useEffect(() => {
    const handleLikeToggle = (event) => {
      const { productId, liked } = event.detail;
      
      // If we're on the liked tab, refresh the list
      if (activeTab === 'liked') {
        fetchLikedProducts();
      } else {
        // Otherwise, just update the local likedProducts list if the product exists
        setLikedProducts(prev => 
          liked 
            ? prev // If liked, we don't add here because we don't have the full product data
            : prev.filter(p => p.id !== productId) // If unliked, remove from list
        );
      }
    };

    window.addEventListener('likeToggled', handleLikeToggle);
    
    return () => {
      window.removeEventListener('likeToggled', handleLikeToggle);
    };
  }, [activeTab]);

  const handleToggleLike = async (productId) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      return;
    }
    
    setAnimatingLike(productId);
    setTimeout(() => setAnimatingLike(null), 600);
    
    const result = await toggleLike(productId);
    
    // If we're on the liked tab and we unliked, remove from the list
    if (activeTab === 'liked' && result && result.success && !result.liked) {
      setLikedProducts(prev => prev.filter(p => p.id !== productId));
    } else if (activeTab === 'liked' && result && result.success && result.liked) {
      // If we liked a product while on the liked tab, refresh the list
      fetchLikedProducts();
    }
  };

  const handleToggleFavorite = async (productId) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      return;
    }
    
    setAnimatingFavorite(productId);
    setTimeout(() => setAnimatingFavorite(null), 500);
    
    const result = await toggleBookmark(productId);
    
    if (activeTab === 'liked') {
      // If on liked tab, just update the bookmark status in the existing list
      setLikedProducts(prev =>
        prev.map(product =>
          product.id === productId
            ? { ...product, is_bookmarked: result.bookmarked }
            : product
        )
      );
    } else if (activeTab === 'Bookmarks') {
      // If on bookmarks tab, refresh the list
      fetchBookmarkedProducts();
    }
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

  const handleRemoveBookmark = async (productId) => {
    try {
      const result = await api.removeFromWishlist(productId);
      if (!result.error) {
        setBookmarkedProducts(prev => prev.filter(item => item.id !== productId));
        setBookmarkCount(prev => prev - 1);
        await toggleBookmark(productId);
      }
    } catch (error) {
      console.error('Error removing bookmark:', error);
    }
  };

  const fetchUserData = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const verifyResult = await api.verifyToken();
      if (verifyResult.data && verifyResult.data.user) {
        const userInfo = verifyResult.data.user;

        try {
          const buyerResult = await api.getBuyerProfile();
          if (buyerResult.data && !buyerResult.error) {
            const buyerDetails = buyerResult.data;
            
            setUserData({
              name: buyerDetails.name || userInfo.username || 'User',
              email: userInfo.email || 'No email',
              phone: buyerDetails.contact || 'Not provided',
              address: buyerDetails.location || 'Not provided',
              joinDate: new Date(userInfo.date_joined || Date.now()).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long'
              }),
              orders: 0,
              wishlist: 0,
              isSeller: false,
            });

            fetchBookmarkCount();
            fetchOrderCount();
          } else {
            setUserData({
              name: userInfo.username || 'User',
              email: userInfo.email || 'No email',
              phone: 'Not provided',
              address: 'Not provided',
              joinDate: new Date(userInfo.date_joined || Date.now()).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long'
              }),
              orders: 0,
              wishlist: 0,
              isSeller: userInfo.is_seller || false,
            });
          }
        } catch (error) {
          console.error('Error fetching buyer details:', error);
          setUserData({
            name: userInfo.username || 'User',
            email: userInfo.email || 'No email',
            phone: 'Not provided',
            address: 'Not provided',
            joinDate: new Date(userInfo.date_joined || Date.now()).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long'
            }),
            orders: 0,
            wishlist: 0,
            isSeller: userInfo.is_seller || false,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookmarkCount = async () => {
    try {
      const result = await api.getWishlist();
      if (result.data) {
        if (result.data.status === 'success') {
          setBookmarkCount(result.data.count || 0);
        } else if (Array.isArray(result.data)) {
          setBookmarkCount(result.data.length || 0);
        } else if (result.data.items && Array.isArray(result.data.items)) {
          setBookmarkCount(result.data.items.length || 0);
        }
      }
    } catch (error) {
      console.error('Error fetching bookmark count:', error);
      setBookmarkCount(0);
    }
  };

  const fetchOrderCount = async () => {
    try {
      const result = await api.getOrderCount();
      if (result.data && !result.error) {
        setOrderCount(result.data.count !== undefined ? result.data.count : 0);
      }
    } catch (error) {
      console.error('Error fetching order count:', error);
      setOrderCount(0);
    }
  };

  const fetchBookmarkedProducts = async () => {
    setContentLoading(prev => ({ ...prev, bookmarks: true }));
    try {
      const result = await api.getWishlist();
      let products = [];

      if (result.error) {
        console.error('Error fetching wishlist:', result.error);
        setBookmarkedProducts([]);
        return;
      }

      if (result.data) {
        if (result.data.status === 'success' && result.data.items) {
          products = result.data.items.map(item => {
            const product = item.product || item;
            return {
              id: product.id,
              sellerName: product.seller_name ? `${product.seller_name}'s store` : 'Seller\'s store',
              sellerUsername: product.seller?.user?.username || 'seller',
              authorAvatar: (product.seller_name || 'S').charAt(0),
              price: formatCurrency(product.unit_price || 0),
              images: product.images && product.images.length > 0
                ? product.images.map(img => getFullImageUrl(img))
                : (product.product_photo ? [getFullImageUrl(product.product_photo)] : ['/sample1.jpg']),
              product: product.name || 'Product',
              content: product.description || 'No description available',
              rating: Math.floor(product.rating_magnitude) || 0,
              ratingCount: product.rating_number || 0,
              commentCount: product.comment_count || 0,
              like_count: product.like_count || 0,
              sellerId: product.seller,
              is_bookmarked: true,
              is_liked: isLiked(product.id)
            };
          });
        } else if (Array.isArray(result.data)) {
          products = result.data.map(product => ({
            id: product.id,
            sellerName: product.seller_name ? `${product.seller_name}'s store` : 'Seller\'s store',
            sellerUsername: product.seller?.user?.username || 'seller',
            authorAvatar: (product.seller_name || 'S').charAt(0),
            price: formatCurrency(product.unit_price || 0),
            images: product.images && product.images.length > 0
              ? product.images.map(img => getFullImageUrl(img))
              : (product.product_photo ? [getFullImageUrl(product.product_photo)] : ['/sample1.jpg']),
            product: product.name || 'Product',
            content: product.description || 'No description available',
            rating: Math.floor(product.rating_magnitude) || 0,
            ratingCount: product.rating_number || 0,
            commentCount: product.comment_count || 0,
            like_count: product.like_count || 0,
            sellerId: product.seller,
            is_bookmarked: true,
            is_liked: isLiked(product.id)
          }));
        }
      }

      setBookmarkedProducts(products);
      setBookmarkCount(products.length);
    } catch (error) {
      console.error('Error fetching bookmarked products:', error);
      setBookmarkedProducts([]);
    } finally {
      setContentLoading(prev => ({ ...prev, bookmarks: false }));
    }
  };

  const fetchLikedProducts = async () => {
    setContentLoading(prev => ({ ...prev, liked: true }));
    try {
      const result = await api.getLikedProducts();
      let products = [];

      if (result.data && Array.isArray(result.data)) {
        products = result.data.map(product => ({
          id: product.id,
          sellerName: product.seller_name ? `${product.seller_name}'s store` : 'Seller\'s store',
          sellerUsername: product.seller?.user?.username || 'seller',
          authorAvatar: (product.seller_name || 'S').charAt(0),
          price: formatCurrency(product.unit_price || 0),
          images: product.images && product.images.length > 0
            ? product.images.map(img => getFullImageUrl(img))
            : (product.product_photo ? [getFullImageUrl(product.product_photo)] : ['/sample1.jpg']),
          product: product.name || 'Product',
          content: product.description || 'No description available',
          rating: Math.floor(product.rating_magnitude) || 0,
          ratingCount: product.rating_number || 0,
          commentCount: product.comment_count || 0,
          like_count: product.like_count || 0,
          sellerId: product.seller,
          is_liked: true,
          is_bookmarked: isBookmarked(product.id)
        }));
      }

      setLikedProducts(products);
    } catch (error) {
      console.error('Error fetching liked products:', error);
    } finally {
      setContentLoading(prev => ({ ...prev, liked: false }));
    }
  };

  const fetchOrders = async () => {
    setContentLoading(prev => ({ ...prev, orders: true }));
    try {
      const result = await api.request('/orders/');
      if (result.data && Array.isArray(result.data)) {
        const successfulOrders = result.data.filter(order => {
          const status = order.status?.toLowerCase() || '';
          return ['paid', 'completed', 'delivered', 'shipped'].includes(status);
        });
        setOrders(successfulOrders.slice(0, 5));
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setContentLoading(prev => ({ ...prev, orders: false }));
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'Bookmarks') {
      fetchBookmarkedProducts();
    } else if (tab === 'liked') {
      fetchLikedProducts();
    } else if (tab === 'orders') {
      fetchOrders();
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto min-h-screen flex items-center justify-center">
        <AnimatedLoader />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="text-center py-12">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Please login to view your account</h3>
          <Link to="/login" className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const getStatusBadgeClass = (status) => {
    const s = status?.toLowerCase() || '';
    if (['completed', 'delivered', 'shipped'].includes(s)) {
      return 'bg-green-100 text-green-800';
    }
    if (s === 'paid') {
      return 'bg-blue-100 text-blue-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white mb-8">
        <div className="flex items-center">
          <div className="w-20 h-12 rounded-full bg-white text-blue-500 bg-opacity-20 flex items-center justify-center text-2xl font-bold mr-4">
            {userData.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <p className="text-[23px] font-bold">{userData.name}</p>
            <p className="text-blue-100">{userData.email}</p>
            <div className="flex gap-4 mt-2">
              <span className="text-sm">Member since {userData.joinDate}</span>
              <span className="text-sm">{orderCount} orders</span>
              <span className="text-sm">{bookmarkCount} in wishlist</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
        {[
          { key: 'profile', label: 'Profile', icon: User },
          { key: 'orders', label: 'Orders', icon: ShoppingCart },
          { key: 'Bookmarks', label: 'Bookmarks', icon: Bookmark },
          { key: 'liked', label: 'Liked', icon: Heart }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`px-4 py-3 font-medium transition-all whitespace-nowrap flex items-center space-x-2 ${
              activeTab === tab.key
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon
              className={`w-5 h-5 transition-all duration-300 ${
                activeTab === tab.key
                  ? 'animate-bounce-forever scale-110'
                  : 'hover:scale-105'
              }`}
            />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4 text-black">Personal Information</h2>
              <div className="space-y-3">
                <div className="flex items-center">
                  <User className="w-5 h-5 text-gray-500 mr-3" />
                  <span className="text-black">{userData.name}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-gray-500 mr-3" />
                  <span className="text-black">{userData.email}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="w-5 h-5 text-gray-500 mr-3" />
                  <span className="text-black">{userData.phone}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 text-gray-500 mr-3" />
                  <span className="text-black">{userData.address}</span>
                </div>
              </div>
              <button className="mt-4 flex items-center text-blue-600 hover:text-blue-700">
                <Edit className="w-4 h-4 mr-1" />
                Edit Profile
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4 text-black">Account Security</h2>
              <div className="space-y-4">
                <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <h3 className="font-medium text-black">Change Password</h3>
                  <p className="text-sm text-gray-600">Update your account password</p>
                </button>
                <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <h3 className="font-medium text-black">Two-Factor Authentication</h3>
                  <p className="text-sm text-gray-600">Add an extra layer of security</p>
                </button>
                <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <h3 className="font-medium text-black">Connected Devices</h3>
                  <p className="text-sm text-gray-600">Manage your logged-in devices</p>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'orders' && (
        <div>
          <h2 className="text-lg font-semibold mb-6 text-black">Order History</h2>
          <Card>
            <CardContent className="p-6">
              {contentLoading.orders ? (
                <div className="text-center py-8">
                  <div className="flex justify-center">
                    <DotSpinner />
                  </div>
                  <p className="mt-4 text-gray-600">Loading orders...</p>
                </div>
              ) : orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium text-black">Order #{order.id}</h3>
                          <p className="text-sm text-gray-600">
                            {new Date(order.created_at || order.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-black">{formatCurrency(order.total_amount || order.total)}</p>
                          <span className={`text-sm px-2 py-1 rounded ${getStatusBadgeClass(order.status)}`}>
                            {order.status || 'Processing'}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        {order.items_count || 0} items
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingCart className={`w-12 h-12 mx-auto mb-4 animate-bounce-forever text-gray-400`} />
                  <p className="text-gray-600 mb-4">No orders yet</p>
                  <Link to="/products" className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Start Shopping
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'Bookmarks' && (
        <div>
          <h2 className="text-lg font-semibold mb-6 text-black">My Bookmarks ({bookmarkCount})</h2>
          {contentLoading.bookmarks ? (
            <div className="text-center py-8">
              <div className="flex justify-center">
                <DotSpinner />
              </div>
              <p className="mt-4 text-gray-600">Loading bookmarks...</p>
            </div>
          ) : bookmarkedProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {bookmarkedProducts.map((post) => {
                const currentIndex = currentImageIndex[post.id] || 0;
                const totalImages = post.images.length;
                const truncatedDescription = post.content.length > 40 ? post.content.substring(0, 40) + '...' : post.content;

                return (
                  <Card key={post.id} variant="elevated" className="overflow-hidden flex flex-col relative">
                    <CardContent className="p-0 flex flex-col">
                      <div className="p-0 sm:p-3 flex flex-col border-b border-gray-100">
                        <div className="flex justify-between items-center">
                          <Link
                            to={`/seller/${post.sellerId}`}
                            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                          >
                            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs">
                              {post.authorAvatar}
                            </div>
                            <span className="font-medium text-black text-xs sm:text-sm truncate">
                              {post.sellerName}
                            </span>
                          </Link>
                          <button onClick={() => toggleDropdown(post.id)} className="p-1 rounded hover:bg-gray-100">
                            <MoreHorizontal className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                          </button>
                        </div>
                        <div className="flex justify-center items-center mt-0.2">
                          <span className="text-xs text-green-600 mb-1 font-semibold">{post.price}</span>
                        </div>
                      </div>

                      <div
                        className="relative aspect-square w-full bg-gray-200 flex-1"
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
                                className={`w-1 h-1 rounded-full transition-all ${
                                  index === currentIndex ? 'bg-gray-300' : 'bg-gray-100'
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

                      <div className="p-1 sm:p-3 flex flex-col mt-0">
                        <div className="flex flex-col">
                          <div className="flex justify-between items-center mb-0">
                            <div className="flex space-x-1 sm:space-x-2">
                              <button
                                onClick={() => handleToggleLike(post.id)}
                                className={`p-1 rounded-full transition-colors sm:p-1 sm:rounded-full ${
                                  post.is_liked ? 'text-red-500 bg-red-50' : 'text-gray-600 hover:text-red-500'
                                }`}
                                style={{
                                  transform: animatingLike === post.id ? 'scale(1.3)' : 'scale(1)',
                                  animation: animatingLike === post.id ? 'heartBeat 0.6s ease-in-out' : 'none'
                                }}
                              >
                                <Heart className="w-3 h-3 sm:w-4 sm:h-4" fill={post.is_liked ? 'currentColor' : 'none'} />
                              </button>
                              <Link
                                to={`/product/${post.id}/comments`}
                                className="p-1 text-gray-600 hover:text-blue-500 rounded-full hover:bg-blue-50 flex items-center space-x-1"
                              >
                                <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                                {post.commentCount > 0 && (
                                  <span className="text-xs text-gray-500">{post.commentCount}</span>
                                )}
                              </Link>
                              <button
                                onClick={() => toggleCart(post.id)}
                                className={`p-1 rounded-full transition-colors ${
                                  cartPosts[post.id] ? 'text-green-500 bg-green-50' : 'text-gray-600 hover:text-green-500'
                                }`}
                              >
                                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                              </button>
                            </div>
                            <button
                              onClick={() => handleToggleFavorite(post.id)}
                              className={`p-1 rounded-full transition-colors sm:p-1 sm:rounded-full ${
                                post.is_bookmarked ? 'text-blue-500 bg-blue-50' : 'text-gray-600 hover:text-blue-500'
                              }`}
                              style={{
                                transform: animatingFavorite === post.id ? 'scale(1.2)' : 'scale(1)',
                                animation: animatingFavorite === post.id ? 'bookmarkPop 0.5s ease-out' : 'none'
                              }}
                            >
                              <Bookmark className="w-3 h-3 sm:w-4 sm:h-4" fill={post.is_bookmarked ? 'currentColor' : 'none'} />
                            </button>
                          </div>
                          <div className="flex items-center space-x-1 sm:justify-end">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${star <= post.rating ? 'text-yellow-500' : 'text-gray-300'}`}
                                  fill={star <= post.rating ? 'currentColor' : 'none'}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-gray-600">({post.ratingCount})</span>
                          </div>
                        </div>
                        <Link to={`/product/${post.id}`} className="text-black hover:underline text-xs font-medium truncate mb-1">
                          {post.product}
                        </Link>
                        <div className="mt-0 relative">
                          <button className="text-xs text-gray-600 text-left w-full p-1 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
                            <span className="text-left">{truncatedDescription}</span>
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Bookmark className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No bookmarks yet</p>
              <Link to="/products" className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Browse Products
              </Link>
            </div>
          )}
        </div>
      )}

      {activeTab === 'liked' && (
        <div>
          <h2 className="text-lg font-semibold mb-6 text-black">Liked Products ({likedProducts.length})</h2>
          {contentLoading.liked ? (
            <div className="text-center py-8">
              <div className="flex justify-center">
                <DotSpinner />
              </div>
              <p className="mt-4 text-gray-600">Loading liked products...</p>
            </div>
          ) : likedProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {likedProducts.map((post) => {
                const currentIndex = currentImageIndex[post.id] || 0;
                const totalImages = post.images.length;
                const truncatedDescription = post.content.length > 40 ? post.content.substring(0, 40) + '...' : post.content;

                return (
                  <Card key={post.id} variant="elevated" className="overflow-hidden flex flex-col relative">
                    <CardContent className="p-0 flex flex-col">
                      <div className="p-0 sm:p-3 flex flex-col border-b border-gray-100">
                        <div className="flex justify-between items-center">
                          <Link
                            to={`/seller/${post.sellerId}`}
                            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                          >
                            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs">
                              {post.authorAvatar}
                            </div>
                            <span className="font-medium text-black text-xs sm:text-sm truncate">
                              {post.sellerName}
                            </span>
                          </Link>
                          <button onClick={() => toggleDropdown(post.id)} className="p-1 rounded hover:bg-gray-100">
                            <MoreHorizontal className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                          </button>
                        </div>
                        <div className="flex justify-center items-center mt-0.2">
                          <span className="text-xs text-green-600 mb-1 font-semibold">{post.price}</span>
                        </div>
                      </div>

                      <div
                        className="relative aspect-square w-full bg-gray-200 flex-1"
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
                                className={`w-1 h-1 rounded-full transition-all ${
                                  index === currentIndex ? 'bg-gray-300' : 'bg-gray-100'
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

                      <div className="p-1 sm:p-3 flex flex-col mt-0">
                        <div className="flex flex-col">
                          <div className="flex justify-between items-center mb-0">
                            <div className="flex space-x-1 sm:space-x-2">
                              <button
                                onClick={() => handleToggleLike(post.id)}
                                className={`p-1 rounded-full transition-colors sm:p-1 sm:rounded-full ${
                                  post.is_liked ? 'text-red-500 bg-red-50' : 'text-gray-600 hover:text-red-500'
                                }`}
                                style={{
                                  transform: animatingLike === post.id ? 'scale(1.3)' : 'scale(1)',
                                  animation: animatingLike === post.id ? 'heartBeat 0.6s ease-in-out' : 'none'
                                }}
                              >
                                <Heart className="w-3 h-3 sm:w-4 sm:h-4" fill={post.is_liked ? 'currentColor' : 'none'} />
                              </button>
                              <Link
                                to={`/product/${post.id}/comments`}
                                className="p-1 text-gray-600 hover:text-blue-500 rounded-full hover:bg-blue-50 flex items-center space-x-1"
                              >
                                <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                                {post.commentCount > 0 && (
                                  <span className="text-xs text-gray-500">{post.commentCount}</span>
                                )}
                              </Link>
                              <button
                                onClick={() => toggleCart(post.id)}
                                className={`p-1 rounded-full transition-colors ${
                                  cartPosts[post.id] ? 'text-green-500 bg-green-50' : 'text-gray-600 hover:text-green-500'
                                }`}
                              >
                                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                              </button>
                            </div>
                            <button
                              onClick={() => handleToggleFavorite(post.id)}
                              className={`p-1 rounded-full transition-colors sm:p-1 sm:rounded-full ${
                                post.is_bookmarked ? 'text-blue-500 bg-blue-50' : 'text-gray-600 hover:text-blue-500'
                              }`}
                              style={{
                                transform: animatingFavorite === post.id ? 'scale(1.2)' : 'scale(1)',
                                animation: animatingFavorite === post.id ? 'bookmarkPop 0.5s ease-out' : 'none'
                              }}
                            >
                              <Bookmark className="w-3 h-3 sm:w-4 sm:h-4" fill={post.is_bookmarked ? 'currentColor' : 'none'} />
                            </button>
                          </div>
                          <div className="flex items-center space-x-1 sm:justify-end">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${star <= post.rating ? 'text-yellow-500' : 'text-gray-300'}`}
                                  fill={star <= post.rating ? 'currentColor' : 'none'}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-gray-600">({post.ratingCount})</span>
                          </div>
                        </div>
                        <Link to={`/product/${post.id}`} className="text-black hover:underline text-xs font-medium truncate mb-1">
                          {post.product}
                        </Link>
                        <div className="mt-0 relative">
                          <button className="text-xs text-gray-600 text-left w-full p-1 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
                            <span className="text-left">{truncatedDescription}</span>
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No liked products yet</p>
              <Link to="/products" className="inline-flex items-center px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors">
                Discover Products
              </Link>
            </div>
          )}
        </div>
      )}

      {dropdownOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeDropdown}>
          <div className="bg-white rounded-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border border-gray-200 text-center">
              <h3 className="font-semibold text-lg text-black">Post Options</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {dropdownItems.map((item, index) => (
                <button
                  key={index}
                  onClick={item.action}
                  className="w-full text-center px-4 py-3 text-sm hover:bg-gray-50 text-black first:rounded-t-lg last:rounded-b-lg transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounceUpDownForever {
          0%, 100% { transform: translateY(0); }
          25% { transform: translateY(-4px); }
          50% { transform: translateY(0); }
          75% { transform: translateY(-2px); }
        }
        .animate-bounce-forever {
          animation: bounceUpDownForever 2s ease-in-out infinite;
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
        .spinner-dot {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          animation: spinner-rotate 1.25s infinite backwards;
        }
        @keyframes spinner-rotate {
          0% {
            transform: rotate(0deg) translateY(-200%);
          }
          60%, 100% {
            transform: rotate(360deg) translateY(-200%);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-bounce-forever,
          [style*="animation"] {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AccountPage;