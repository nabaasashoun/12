import { useState, useEffect } from 'react';
import { BuyerCard, BuyerCardContent } from './BuyerCard';
import { 
  User, Mail, Phone, MapPin, Edit, Heart, ShoppingCart, Bookmark, 
  MessageSquare, Star, MoreHorizontal, Plus, Award, ThumbsUp, X,
  Package, Truck, Clock, CheckCircle, AlertCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useCart } from '../../utils/CartContext';
import { useLikeBookmark } from '../../utils/LikeBookmarkContext';
import AnimatedLoader from '../UISkeleton/Loader';
import { useDarkMode } from '../../utils/BuyerDarkModeContext';

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
  const { isDarkMode } = useDarkMode();                   
  const [activeTab, setActiveTab] = useState('profile');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const navigate = useNavigate();

  // Rating modal state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trustRating, setTrustRating] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingSuccess, setRatingSuccess] = useState(false);
  const [ratingError, setRatingError] = useState('');
  const [updatedTrustScore, setUpdatedTrustScore] = useState(null);

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

  // rating functions

  const openRatingModal = (order) => {
    setSelectedOrder(order);
    setTrustRating(5);
    setRatingComment('');
    setRatingError('');
    setRatingSuccess(false);
    setUpdatedTrustScore(null);
    setShowRatingModal(true);
  };

  const closeRatingModal = () => {
    setShowRatingModal(false);
    setSelectedOrder(null);
    setUpdatedTrustScore(null);
  };

  const submitTrustRating = async () => {
    if (!selectedOrder || !selectedOrder.seller_id) {
      setRatingError('Seller information not available');
      return;
    }

    setSubmittingRating(true);
    setRatingError('');

    try {
      const ratingData = {
        seller_id: selectedOrder.seller_id,
        rating: trustRating,
        comment: ratingComment,
        order_id: selectedOrder.id
      };

      const response = await api.rateSeller(ratingData);
      
      if (!response.error && response.data?.success) {
        setRatingSuccess(true);
        
        setOrders(prev => prev.map(order => 
          order.id === selectedOrder.id 
            ? { 
                ...order, 
                has_rated: true, 
                trustRating: trustRating,
                sellerTrust: response.data.seller_trust 
              }
            : order
        ));

        setTimeout(() => {
          closeRatingModal();
        }, 2000);
      } else {
        const errorMsg = response.data?.error || response.data?.message || 'Failed to submit rating';
        setRatingError(errorMsg);
        setSubmittingRating(false);
      }

    } catch (error) {
      console.error('Error submitting rating:', error);
      setRatingError('Network error. Please try again.');
      setSubmittingRating(false);
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
            fetchOrders();
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
            fetchOrders();
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
          fetchOrders();
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
    try {
      setContentLoading(prev => ({ ...prev, liked: true }));
      
      const response = await api.getLikedProducts();
      if (response.data && Array.isArray(response.data)) {
        const rawProducts = response.data;

        const processed = rawProducts
          .filter(product => isLiked(product.id))
          .map(product => ({
            id: product.id,
            sellerName: product.seller_name 
              ? `${product.seller_name}'s store` 
              : "Seller's store",
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
            is_bookmarked: isBookmarked(product.id),
            is_liked: true
          }));

        setLikedProducts(processed);
      }
    } catch (err) {
      console.error("Failed to load liked products:", err);
    } finally {
      setContentLoading(prev => ({ ...prev, liked: false }));
    }
  };

  const fetchOrders = async () => {
    setContentLoading(prev => ({ ...prev, orders: true }));
    try {
      const result = await api.request('/orders/');
      
      if (!result.error && result.data && Array.isArray(result.data) && result.data.length > 0) {
        const processedOrders = result.data.map(order => ({
          id: order.id,
          order_date: order.order_date || new Date().toISOString(),
          total_amount: order.total_amount || 0,
          status: order.status || 'pending',
          items_count: order.items_count || 1,
          seller_id: order.seller_id || 1,
          seller_name: order.seller_name || 'Timo',
          product_name: order.product_name || 'Sample Product',
          has_rated: order.has_rated || false,
          trustRating: order.trustRating || null
        }));
        setOrders(processedOrders);
        setOrderCount(processedOrders.length);
      } else {
        const testOrders = [
          {
            id: 1001,
            order_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            total_amount: 45000,
            status: 'delivered',
            items_count: 3,
            seller_id: 1,
            seller_name: 'Timo',
            product_name: 'Wireless Headphones',
            has_rated: false,
            status_badge: 'delivered'
          },
          {
            id: 1002,
            order_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            total_amount: 32500,
            status: 'delivered',
            items_count: 2,
            seller_id: 1,
            seller_name: 'Timo',
            product_name: 'Leather Wallet',
            has_rated: true,
            trustRating: 4,
            status_badge: 'delivered'
          },
          {
            id: 1003,
            order_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            total_amount: 89000,
            status: 'shipped',
            items_count: 1,
            seller_id: 1,
            seller_name: 'Timo',
            product_name: 'Smart Watch',
            has_rated: false,
            status_badge: 'shipped'
          },
          {
            id: 1004,
            order_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            total_amount: 12500,
            status: 'processing',
            items_count: 2,
            seller_id: 1,
            seller_name: 'Timo',
            product_name: 'Decorative Pillows',
            has_rated: false,
            status_badge: 'processing'
          },
          {
            id: 1005,
            order_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            total_amount: 67500,
            status: 'delivered',
            items_count: 4,
            seller_id: 1,
            seller_name: 'Timo',
            product_name: 'Running Shoes',
            has_rated: false,
            status_badge: 'delivered'
          }
        ];
        setOrders(testOrders);
        setOrderCount(testOrders.length);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      const testOrders = [
        {
          id: 1001,
          order_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          total_amount: 45000,
          status: 'delivered',
          items_count: 3,
          seller_id: 1,
          seller_name: 'Timo',
          product_name: 'Wireless Headphones',
          has_rated: false,
          status_badge: 'delivered'
        },
        {
          id: 1002,
          order_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          total_amount: 32500,
          status: 'delivered',
          items_count: 2,
          seller_id: 1,
          seller_name: 'Timo',
          product_name: 'Leather Wallet',
          has_rated: true,
          trustRating: 4,
          status_badge: 'delivered'
        }
      ];
      setOrders(testOrders);
      setOrderCount(testOrders.length);
    } finally {
      setContentLoading(prev => ({ ...prev, orders: false }));
    }
  };

  useEffect(() => {
    const handleLikeToggle = (event) => {
      const { productId, liked } = event.detail;
      if (activeTab === 'liked') {
        if (!liked) {
          setLikedProducts(prev => prev.filter(p => p.id !== productId));
        } else {
          fetchLikedProducts();
        }
      } else {
        if (!liked) {
          setLikedProducts(prev => prev.filter(p => p.id !== productId));
        }
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
    
    if (activeTab === 'liked') {
      if (!result.liked) {
        setLikedProducts(prev => prev.filter(p => p.id !== productId));
      } else {
        await fetchLikedProducts();
      }
    } else {
      if (!result.liked) {
        setLikedProducts(prev => prev.filter(p => p.id !== productId));
      }
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
      setLikedProducts(prev =>
        prev.map(product =>
          product.id === productId
            ? { ...product, is_bookmarked: result.bookmarked }
            : product
        )
      );
    } else if (activeTab === 'Bookmarks') {
      fetchBookmarkedProducts();
      fetchBookmarkCount();
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

  const getStatusBadgeClass = (status) => {
    const s = status?.toLowerCase() || '';
    if (s === 'delivered') return 'bg-green-100 text-green-800';
    if (s === 'shipped') return 'bg-blue-100 text-blue-800';
    if (s === 'processing') return 'bg-yellow-100 text-yellow-800';
    if (s === 'cancelled') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const s = status?.toLowerCase() || '';
    if (s === 'delivered') return <CheckCircle className="w-3 h-3" />;
    if (s === 'shipped') return <Truck className="w-3 h-3" />;
    if (s === 'processing') return <Clock className="w-3 h-3" />;
    if (s === 'cancelled') return <AlertCircle className="w-3 h-3" />;
    return <Package className="w-3 h-3" />;
  };

  if (loading) {
    return (
      <div className={`p-6 max-w-6xl mx-auto min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <AnimatedLoader />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className={`p-6 max-w-6xl mx-auto ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center py-12">
          <User className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
          <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-700'}`}>Please login to view your account</h3>
          <Link to="/login" className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 max-w-6xl mx-auto min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Profile Header */}
      <div className={`bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white mb-8 ${isDarkMode ? 'from-blue-600 to-indigo-700' : ''}`}>
        <div className="flex items-center">
          <div className="w-20 h-20 rounded-full bg-white text-blue-500 bg-opacity-20 flex items-center justify-center text-2xl font-bold mr-4">
            {userData.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
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

      {/* Tabs */}
      <div className={`flex border-b mb-6 overflow-x-auto ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        {[
          { key: 'profile', label: 'Profile', icon: User },
          { key: 'orders', label: 'Orders', icon: ShoppingCart },
          { key: 'Bookmarks', label: 'Bookmarks', icon: Bookmark },
          { key: 'liked', label: 'Liked', icon: Heart }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`px-4 py-3 font-medium transition-all whitespace-nowrap flex items-center space-x-2 ${activeTab === tab.key
              ? `text-blue-600 border-b-2 border-blue-600 ${isDarkMode ? 'text-blue-400 border-blue-400' : ''}`
              : `${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`
            }`}
          >
            <tab.icon
              className={`w-5 h-5 transition-all duration-300 ${activeTab === tab.key ? 'animate-bounce-forever scale-110' : 'hover:scale-105'}`}
            />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BuyerCard>
            <BuyerCardContent className="p-6">
              <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>Personal Information</h2>
              <div className="space-y-3">
                <div className="flex items-center">
                  <User className={`w-5 h-5 mr-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <span className={isDarkMode ? 'text-gray-200' : 'text-black'}>{userData.name}</span>
                </div>
                <div className="flex items-center">
                  <Mail className={`w-5 h-5 mr-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <span className={isDarkMode ? 'text-gray-200' : 'text-black'}>{userData.email}</span>
                </div>
                <div className="flex items-center">
                  <Phone className={`w-5 h-5 mr-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <span className={isDarkMode ? 'text-gray-200' : 'text-black'}>{userData.phone}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className={`w-5 h-5 mr-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <span className={isDarkMode ? 'text-gray-200' : 'text-black'}>{userData.address}</span>
                </div>
              </div>
              <Link to="/settings" className={`mt-4 flex items-center ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}>
                <Edit className="w-4 h-4 mr-1" />
                Edit Profile
              </Link>
            </BuyerCardContent>
          </BuyerCard>

          <BuyerCard>
            <BuyerCardContent className="p-6">
              <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>Account Security</h2>
              <div className="space-y-4">
                <Link to="/settings" className={`block w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors ${isDarkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200'}`}>
                  <h3 className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>Change Password</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Update your account password</p>
                </Link>
                <button className={`w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors ${isDarkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200'}`}>
                  <h3 className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>Two-Factor Authentication</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Add an extra layer of security</p>
                </button>
                <button className={`w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors ${isDarkMode ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200'}`}>
                  <h3 className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>Connected Devices</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Manage your logged-in devices</p>
                </button>
              </div>
            </BuyerCardContent>
          </BuyerCard>
        </div>
      )}

      {/* Orders Tab with Rating Button */}
      {activeTab === 'orders' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>Order History</h2>
            <button
              onClick={fetchOrders}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Refresh Orders
            </button>
          </div>
          
          <BuyerCard>
            <BuyerCardContent className="p-6">
              {contentLoading.orders ? (
                <div className="text-center py-8">
                  <div className="flex justify-center">
                    <DotSpinner />
                  </div>
                  <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading orders...</p>
                </div>
              ) : orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className={`border rounded-lg p-4 hover:bg-gray-50 transition-colors ${isDarkMode ? 'border-gray-700 hover:bg-gray-800' : ''}`}>
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className={`font-medium ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>Order #{order.id}</h3>
                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${getStatusBadgeClass(order.status_badge || order.status)}`}>
                              {getStatusIcon(order.status_badge || order.status)}
                              {(order.status_badge || order.status || 'Processing').charAt(0).toUpperCase() + 
                               (order.status_badge || order.status || 'Processing').slice(1)}
                            </span>
                          </div>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {new Date(order.order_date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                          <div className="mt-2 space-y-1">
                            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              <span className="font-medium">Product:</span> {order.product_name || 'Sample Product'}
                            </p>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              <span className="font-medium">Seller:</span> {order.seller_name || 'Sample Seller'}
                            </p>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              <span className="font-medium">Items:</span> {order.items_count || 1}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <p className={`font-semibold text-lg ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>{formatCurrency(order.total_amount || 0)}</p>
                          
                          <button
                            onClick={() => openRatingModal(order)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors text-xs ${order.has_rated ? 'bg-green-100 text-green-700 cursor-not-allowed' : 'bg-yellow-500 text-white hover:bg-yellow-600'}`}
                            disabled={order.has_rated}
                          >
                            <Award className="w-3 h-3" />
                            {order.has_rated ? `Rated ${order.trustRating}/5` : 'Rate Seller Trust'}
                          </button>
                          
                          <Link 
                            to={`/orders/${order.id}`}
                            className={`text-xs ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} mt-1`}
                          >
                            View Details →
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className={`mt-6 p-4 rounded-lg border ${isDarkMode ? 'bg-blue-900/30 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-500 rounded-full p-1">
                        <Award className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingCart className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  <p className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No orders yet</p>
                  <Link to="/products" className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Start Shopping
                  </Link>
                  
                  <div className={`mt-8 p-4 rounded-lg border ${isDarkMode ? 'bg-yellow-900/30 border-yellow-800' : 'bg-yellow-50 border-yellow-200'}`}>
                    <p className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>Demo Mode</p>
                    <p className={`text-xs mb-3 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>
                      Click the button below to test the rating system with a sample order.
                    </p>
                    <button
                      onClick={() => openRatingModal({
                        id: 9999,
                        seller_id: 1,  
                        seller_name: 'Timo',
                        product_name: 'Sample Product'
                      })}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm"
                    >
                      <Award className="w-4 h-4" />
                      Test Rating Modal
                    </button>
                  </div>
                </div>
              )}
            </BuyerCardContent>
          </BuyerCard>
        </div>
      )}

      {/* Bookmarks Tab */}
      {activeTab === 'Bookmarks' && (
        <div>
          <h2 className={`text-lg font-semibold mb-6 ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>My Bookmarks ({bookmarkCount})</h2>
          {contentLoading.bookmarks ? (
            <div className="text-center py-8">
              <div className="flex justify-center">
                <DotSpinner />
              </div>
              <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading bookmarks...</p>
            </div>
          ) : bookmarkedProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {bookmarkedProducts.map((post) => {
                const currentIndex = currentImageIndex[post.id] || 0;
                const totalImages = post.images.length;
                const truncatedDescription = post.content.length > 40 ? post.content.substring(0, 40) + '...' : post.content;

                return (
                  <BuyerCard key={post.id} variant="elevated" className="overflow-hidden flex flex-col relative">
                    <BuyerCardContent className="p-0 flex flex-col">
                      <div className={`p-0 sm:p-3 flex flex-col border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                        <div className="flex justify-between items-center">
                          {post.sellerId ? (
                            <Link to={`/seller/${post.sellerId}`} className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs">
                                {post.authorAvatar}
                              </div>
                              <span className={`font-medium text-xs sm:text-sm truncate ${isDarkMode ? 'text-gray-200' : 'text-black'}`}>
                                {post.sellerName}
                              </span>
                            </Link>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs">
                                {post.authorAvatar}
                              </div>
                              <span className={`font-medium text-xs sm:text-sm truncate ${isDarkMode ? 'text-gray-200' : 'text-black'}`}>
                                {post.sellerName}
                              </span>
                            </div>
                          )}
                          <button onClick={() => toggleDropdown(post.id)} className={`p-1 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                            <MoreHorizontal className={`w-3 h-3 sm:w-4 sm:h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                          </button>
                        </div>
                        <div className="flex justify-center items-center mt-0.2">
                          <span className="text-xs text-green-600 dark:text-green-400 mb-1 font-semibold">{post.price}</span>
                        </div>
                      </div>

                      <div className="relative aspect-square w-full bg-gray-200 dark:bg-gray-700 flex-1" onTouchStart={(e) => { const touchStartX = e.touches[0].clientX; setCurrentImageIndex((prev) => ({ ...prev, touchStartX })); }} onTouchMove={(e) => { const touchEndX = e.touches[0].clientX; setCurrentImageIndex((prev) => ({ ...prev, touchEndX })); }} onTouchEnd={() => { const startX = currentImageIndex.touchStartX; const endX = currentImageIndex.touchEndX; const diff = startX - endX; if (Math.abs(diff) > 50) { if (diff > 0 && currentIndex < totalImages - 1) goToImage(post.id, currentIndex + 1); if (diff < 0 && currentIndex > 0) goToImage(post.id, currentIndex - 1); } setCurrentImageIndex((prev) => ({ ...prev, touchStartX: null, touchEndX: null })); }}>
                        {totalImages > 1 && (
                          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10 flex space-x-1 px-2 py-1">
                            {post.images.map((_, index) => (
                              <button key={index} onClick={() => goToImage(post.id, index)} className={`w-1 h-1 rounded-full transition-all ${index === currentIndex ? (isDarkMode ? 'bg-gray-400' : 'bg-gray-300') : (isDarkMode ? 'bg-gray-600' : 'bg-gray-100')}`} />
                            ))}
                          </div>
                        )}
                        <Link to={`/product/${post.id}`}>
                          <img src={post.images[currentIndex]} alt={post.product} className="absolute inset-0 w-full h-full object-cover select-none" />
                        </Link>
                      </div>

                      <div className="p-1 sm:p-3 flex flex-col mt-0">
                        <div className="flex flex-col">
                          <div className="flex justify-between items-center mb-0">
                            <div className="flex space-x-1 sm:space-x-2">
                              <button onClick={() => handleToggleLike(post.id)} className={`p-1 rounded-full transition-colors sm:p-1 sm:rounded-full ${isLiked(post.id) ? 'text-red-500 bg-red-50 dark:bg-red-900/30' : isDarkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-600 hover:text-red-500'}`} style={{ transform: animatingLike === post.id ? 'scale(1.3)' : 'scale(1)', animation: animatingLike === post.id ? 'heartBeat 0.6s ease-in-out' : 'none' }}>
                                <Heart className="w-3 h-3 sm:w-4 sm:h-4" fill={isLiked(post.id) ? 'currentColor' : 'none'} />
                              </button>
                              <Link to={`/product/${post.id}/comments`} className={`p-1 text-gray-600 hover:text-blue-500 rounded-full hover:bg-blue-50 flex items-center space-x-1 ${isDarkMode ? 'text-gray-400 hover:text-blue-400 hover:bg-blue-900/30' : ''}`}>
                                <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                                {post.commentCount > 0 && <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{post.commentCount}</span>}
                              </Link>
                              <button onClick={() => toggleCart(post.id)} className={`p-1 rounded-full transition-colors ${cartPosts[post.id] ? 'text-green-500 bg-green-50 dark:bg-green-900/30' : isDarkMode ? 'text-gray-400 hover:text-green-400' : 'text-gray-600 hover:text-green-500'}`}>
                                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                              </button>
                            </div>
                            <button onClick={() => handleToggleFavorite(post.id)} className={`p-1 rounded-full transition-colors sm:p-1 sm:rounded-full ${isBookmarked(post.id) ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/30' : isDarkMode ? 'text-gray-400 hover:text-blue-400' : 'text-gray-600 hover:text-blue-500'}`} style={{ transform: animatingFavorite === post.id ? 'scale(1.2)' : 'scale(1)', animation: animatingFavorite === post.id ? 'bookmarkPop 0.5s ease-out' : 'none' }}>
                              <Bookmark className="w-3 h-3 sm:w-4 sm:h-4" fill={isBookmarked(post.id) ? 'currentColor' : 'none'} />
                            </button>
                          </div>
                          <div className="flex items-center space-x-1 sm:justify-end">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${star <= post.rating ? 'text-yellow-500' : isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} fill={star <= post.rating ? 'currentColor' : 'none'} />
                              ))}
                            </div>
                            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>({post.ratingCount})</span>
                          </div>
                        </div>
                        <Link to={`/product/${post.id}`} className={`hover:underline text-xs font-medium truncate mb-1 ${isDarkMode ? 'text-gray-200' : 'text-black'}`}>
                          {post.product}
                        </Link>
                        <div className="mt-0 relative">
                          <button className={`text-xs text-left w-full p-1 rounded transition-colors flex items-start ${isDarkMode ? 'text-gray-300 hover:text-blue-400 bg-gray-700 hover:bg-gray-600' : 'text-gray-600 hover:text-blue-500 bg-gray-50 hover:bg-gray-100'}`}>
                            <span className="text-left">{truncatedDescription}</span>
                          </button>
                        </div>
                      </div>
                    </BuyerCardContent>
                  </BuyerCard>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Bookmark className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <p className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No bookmarks yet</p>
              <Link to="/products" className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Browse Products
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Liked Tab */}
      {activeTab === 'liked' && (
        <div>
          <h2 className={`text-lg font-semibold mb-6 ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>Liked Products ({likedProducts.length})</h2>
          {contentLoading.liked ? (
            <div className="text-center py-8">
              <div className="flex justify-center">
                <DotSpinner />
              </div>
              <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading liked products...</p>
            </div>
          ) : likedProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {likedProducts.map((post) => {
                const currentIndex = currentImageIndex[post.id] || 0;
                const totalImages = post.images.length;
                const truncatedDescription = post.content?.length > 40 ? post.content.substring(0, 40) + '...' : post.content || '';
                
                return (
                  <BuyerCard key={post.id} variant="elevated" className="overflow-hidden flex flex-col relative">
                    <BuyerCardContent className="p-0 flex flex-col">
                      <div className={`p-0 sm:p-3 flex flex-col border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                        <div className="flex justify-between items-center">
                          {post.sellerId ? (
                            <Link to={`/seller/${post.sellerId}`} className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs">
                                {post.authorAvatar}
                              </div>
                              <span className={`font-medium text-xs sm:text-sm truncate ${isDarkMode ? 'text-gray-200' : 'text-black'}`}>
                                {post.sellerName}
                              </span>
                            </Link>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs">
                                {post.authorAvatar}
                              </div>
                              <span className={`font-medium text-xs sm:text-sm truncate ${isDarkMode ? 'text-gray-200' : 'text-black'}`}>
                                {post.sellerName}
                              </span>
                            </div>
                          )}
                          <button onClick={() => toggleDropdown(post.id)} className={`p-1 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                            <MoreHorizontal className={`w-3 h-3 sm:w-4 sm:h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                          </button>
                        </div>
                        <div className="flex justify-center items-center mt-0.2">
                          <span className="text-xs text-green-600 dark:text-green-400 mb-1 font-semibold">{post.price}</span>
                        </div>
                      </div>

                      <div className="relative aspect-square w-full bg-gray-200 dark:bg-gray-700 flex-1" onTouchStart={(e) => { const touchStartX = e.touches[0].clientX; setCurrentImageIndex((prev) => ({ ...prev, touchStartX })); }} onTouchMove={(e) => { const touchEndX = e.touches[0].clientX; setCurrentImageIndex((prev) => ({ ...prev, touchEndX })); }} onTouchEnd={() => { const startX = currentImageIndex.touchStartX; const endX = currentImageIndex.touchEndX; const diff = startX - endX; if (Math.abs(diff) > 50) { if (diff > 0 && currentIndex < totalImages - 1) goToImage(post.id, currentIndex + 1); if (diff < 0 && currentIndex > 0) goToImage(post.id, currentIndex - 1); } setCurrentImageIndex((prev) => ({ ...prev, touchStartX: null, touchEndX: null })); }}>
                        {totalImages > 1 && (
                          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10 flex space-x-1 px-2 py-1">
                            {post.images.map((_, index) => (
                              <button key={index} onClick={() => goToImage(post.id, index)} className={`w-1 h-1 rounded-full transition-all ${index === currentIndex ? (isDarkMode ? 'bg-gray-400' : 'bg-gray-300') : (isDarkMode ? 'bg-gray-600' : 'bg-gray-100')}`} />
                            ))}
                          </div>
                        )}
                        <Link to={`/product/${post.id}`}>
                          <img src={post.images[currentIndex]} alt={post.product} className="absolute inset-0 w-full h-full object-cover select-none" />
                        </Link>
                      </div>

                      <div className="p-1 sm:p-3 flex flex-col mt-0">
                        <div className="flex flex-col">
                          <div className="flex justify-between items-center mb-0">
                            <div className="flex space-x-1 sm:space-x-2">
                              <button onClick={() => handleToggleLike(post.id)} className={`p-1 rounded-full transition-colors sm:p-1 sm:rounded-full ${isLiked(post.id) ? 'text-red-500 bg-red-50 dark:bg-red-900/30' : isDarkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-600 hover:text-red-500'}`} style={{ transform: animatingLike === post.id ? 'scale(1.3)' : 'scale(1)', animation: animatingLike === post.id ? 'heartBeat 0.6s ease-in-out' : 'none' }}>
                                <Heart className="w-3 h-3 sm:w-4 sm:h-4" fill={isLiked(post.id) ? 'currentColor' : 'none'} />
                              </button>
                              <Link to={`/product/${post.id}/comments`} className={`p-1 text-gray-600 hover:text-blue-500 rounded-full hover:bg-blue-50 flex items-center space-x-1 ${isDarkMode ? 'text-gray-400 hover:text-blue-400 hover:bg-blue-900/30' : ''}`}>
                                <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                                {post.commentCount > 0 && <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{post.commentCount}</span>}
                              </Link>
                              <button onClick={() => toggleCart(post.id)} className={`p-1 rounded-full transition-colors ${cartPosts[post.id] ? 'text-green-500 bg-green-50 dark:bg-green-900/30' : isDarkMode ? 'text-gray-400 hover:text-green-400' : 'text-gray-600 hover:text-green-500'}`}>
                                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                              </button>
                            </div>
                            <button onClick={() => handleToggleFavorite(post.id)} className={`p-1 rounded-full transition-colors sm:p-1 sm:rounded-full ${isBookmarked(post.id) ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/30' : isDarkMode ? 'text-gray-400 hover:text-blue-400' : 'text-gray-600 hover:text-blue-500'}`} style={{ transform: animatingFavorite === post.id ? 'scale(1.2)' : 'scale(1)', animation: animatingFavorite === post.id ? 'bookmarkPop 0.5s ease-out' : 'none' }}>
                              <Bookmark className="w-3 h-3 sm:w-4 sm:h-4" fill={isBookmarked(post.id) ? 'currentColor' : 'none'} />
                            </button>
                          </div>
                          <div className="flex items-center space-x-1 sm:justify-end">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${star <= post.rating ? 'text-yellow-500' : isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} fill={star <= post.rating ? 'currentColor' : 'none'} />
                              ))}
                            </div>
                            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>({post.ratingCount})</span>
                          </div>
                        </div>
                        <Link to={`/product/${post.id}`} className={`hover:underline text-xs font-medium truncate mb-1 ${isDarkMode ? 'text-gray-200' : 'text-black'}`}>
                          {post.product}
                        </Link>
                        <div className="mt-0 relative">
                          <button className={`text-xs text-left w-full p-1 rounded transition-colors flex items-start ${isDarkMode ? 'text-gray-300 hover:text-blue-400 bg-gray-700 hover:bg-gray-600' : 'text-gray-600 hover:text-blue-500 bg-gray-50 hover:bg-gray-100'}`}>
                            <span className="text-left">{truncatedDescription}</span>
                          </button>
                        </div>
                      </div>
                    </BuyerCardContent>
                  </BuyerCard>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Heart className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <p className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No liked products yet</p>
              <Link to="/products" className="inline-flex items-center px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors">
                Discover Products
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeRatingModal}>
          <div className={`rounded-xl max-w-md w-full p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>Rate Your Experience</h3>
              <button onClick={closeRatingModal} className={`p-1 hover:bg-gray-100 rounded-full ${isDarkMode ? 'hover:bg-gray-700' : ''}`}>
                <X className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </button>
            </div>

            {ratingSuccess ? (
              <div className="text-center py-8">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDarkMode ? 'bg-green-900/30' : 'bg-green-100'}`}>
                  <ThumbsUp className={`w-8 h-8 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                </div>
                <h4 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>Thank You!</h4>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Your rating has been submitted successfully.</p>
                {updatedTrustScore && (
                  <p className={`text-sm font-medium mt-2 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                    Seller trust score updated to {updatedTrustScore.toFixed(1)}%
                  </p>
                )}
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <div className={`p-3 rounded-lg mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <span className="font-medium">Order:</span> #{selectedOrder.id}
                    </p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <span className="font-medium">Product:</span> {selectedOrder.product_name || 'Sample Product'}
                    </p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      <span className="font-medium">Seller:</span> {selectedOrder.seller_name || 'Sample Seller'}
                    </p>
                  </div>
                  
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    How would you rate your experience with this seller?
                  </label>
                  
                  <div className="flex justify-center gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} onClick={() => setTrustRating(star)} className="focus:outline-none transform hover:scale-110 transition-transform">
                        <Star className={`w-8 h-8 transition-all ${star <= trustRating ? 'text-yellow-400 fill-yellow-400' : isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                      </button>
                    ))}
                  </div>
                  
                  <div className="text-center mb-4">
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {trustRating === 1 && 'Poor'}
                      {trustRating === 2 && 'Fair'}
                      {trustRating === 3 && 'Good'}
                      {trustRating === 4 && 'Very Good'}
                      {trustRating === 5 && 'Excellent'}
                    </span>
                  </div>
                  
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Additional Comments (Optional)
                  </label>
                  <textarea
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    rows="3"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'border-gray-300 text-black'}`}
                    placeholder="Share your experience with this seller..."
                  />
                  
                  {ratingError && <p className="mt-2 text-sm text-red-600">{ratingError}</p>}
                </div>

                <div className="flex gap-3">
                  <button onClick={closeRatingModal} className={`flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700'}`}>
                    Cancel
                  </button>
                  <button onClick={submitTrustRating} disabled={submittingRating} className={`flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:bg-yellow-300 flex items-center justify-center gap-2`}>
                    {submittingRating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Submitting...
                      </>
                    ) : (
                      'Submit Rating'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Dropdown Modal */}
      {dropdownOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeDropdown}>
          <div className={`rounded-xl max-w-sm w-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
            <div className={`p-4 border-b text-center ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`font-semibold text-lg ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>Post Options</h3>
            </div>
            <div className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
              {dropdownItems.map((item, index) => (
                <button key={index} onClick={item.action} className={`w-full text-center px-4 py-3 text-sm transition-colors first:rounded-t-lg last:rounded-b-lg ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-black hover:bg-gray-50'}`}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Styles */}
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
          0% { transform: rotate(0deg) translateY(-200%); }
          60%, 100% { transform: rotate(360deg) translateY(-200%); }
        }
      `}</style>
    </div>
  );
};

export default AccountPage;