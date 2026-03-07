import { useState, useEffect } from 'react';
import { Card, CardContent } from './card';
import { User, Mail, Phone, MapPin, Edit, Heart, ShoppingCart, Bookmark, Eye, X, Plus, MessageSquare, Star, MoreHorizontal } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useCart } from '../../utils/CartContext';
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

  const [animatingLike, setAnimatingLike] = useState(null);
  const [animatingFavorite, setAnimatingFavorite] = useState(null);

  const [bookmarkedProducts, setBookmarkedProducts] = useState([]);
  const [likedProducts, setLikedProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [contentLoading, setContentLoading] = useState({
    bookmarks: false,
    liked: false,
    orders: false
  });

  const [likedPosts, setLikedPosts] = useState({});
  const [favoritedPosts, setFavoritedPosts] = useState({});
  const [currentImageIndex, setCurrentImageIndex] = useState({});

  const { cartItems, addToCart, removeFromCart } = useCart();
  const cartPosts = cartItems.reduce((acc, item) => {
    if (item.product?.id) acc[item.product.id] = true;
    return acc;
  }, {});

  const formatCurrency = (amount) => {
    return `UGX ${parseFloat(amount).toLocaleString('en-UG')}`;
  };

  useEffect(() => {
    const handleLikeToggle = (event) => {
      const { productId, liked, likeCount } = event.detail;

      setLikedPosts(prev => ({ ...prev, [productId]: liked }));

      setLikedProducts(prev =>
        prev.map(product =>
          product.id === productId
            ? { ...product, is_liked: liked, like_count: likeCount }
            : product
        )
      );

      setBookmarkedProducts(prev =>
        prev.map(product =>
          product.id === productId
            ? { ...product, is_liked: liked, like_count: likeCount }
            : product
        )
      );

      if (activeTab === 'liked' && !liked) {
        setLikedProducts(prev => prev.filter(p => p.id !== productId));
      }
    };

    const handleBookmarkToggle = (event) => {
      const { productId, bookmarked } = event.detail;

      setFavoritedPosts(prev => ({ ...prev, [productId]: bookmarked }));

      setBookmarkedProducts(prev =>
        prev.map(product =>
          product.id === productId
            ? { ...product, is_bookmarked: bookmarked }
            : product
        )
      );

      setLikedProducts(prev =>
        prev.map(product =>
          product.id === productId
            ? { ...product, is_bookmarked: bookmarked }
            : product
        )
      );

      if (activeTab === 'Bookmarks' && !bookmarked) {
        setBookmarkedProducts(prev => prev.filter(p => p.id !== productId));
        setBookmarkCount(prev => prev - 1);
      } else if (activeTab === 'Bookmarks' && bookmarked) {
        setBookmarkCount(prev => prev + 1);
        if (activeTab === 'Bookmarks') fetchBookmarkedProducts();
      } else {
        setBookmarkCount(prev => bookmarked ? prev + 1 : prev - 1);
      }
    };

    window.addEventListener('likeToggled', handleLikeToggle);
    window.addEventListener('bookmarkToggled', handleBookmarkToggle);

    return () => {
      window.removeEventListener('likeToggled', handleLikeToggle);
      window.removeEventListener('bookmarkToggled', handleBookmarkToggle);
    };
  }, [activeTab]);

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
        const newLikeCount = result.data.like_count;

        setLikedPosts(prev => ({ ...prev, [postId]: newLikedStatus }));

        setLikedProducts(prev =>
          prev.map(product =>
            product.id === postId
              ? { ...product, like_count: newLikeCount, is_liked: newLikedStatus }
              : product
          )
        );
        setBookmarkedProducts(prev =>
          prev.map(product =>
            product.id === postId
              ? { ...product, like_count: newLikeCount, is_liked: newLikedStatus }
              : product
          )
        );

        setAnimatingLike(postId);
        setTimeout(() => setAnimatingLike(null), 600);

        window.dispatchEvent(new CustomEvent('likeToggled', {
          detail: { productId: postId, liked: newLikedStatus, likeCount: newLikeCount }
        }));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const toggleFavorite = async (productId) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const result = await api.toggleWishlist(productId);
      if (result.data) {
        const isNowBookmarked = result.data.action === 'added';

        setFavoritedPosts(prev => ({ ...prev, [productId]: isNowBookmarked }));

        if (activeTab === 'Bookmarks') {
          if (isNowBookmarked) {
            fetchBookmarkedProducts();
          } else {
            setBookmarkedProducts(prev => prev.filter(p => p.id !== productId));
            setBookmarkCount(prev => prev - 1);
          }
        }

        setLikedProducts(prev =>
          prev.map(product =>
            product.id === productId
              ? { ...product, is_bookmarked: isNowBookmarked }
              : product
          )
        );

        setBookmarkedProducts(prev =>
          prev.map(product =>
            product.id === productId
              ? { ...product, is_bookmarked: isNowBookmarked }
              : product
          )
        );

        setAnimatingFavorite(productId);
        setTimeout(() => setAnimatingFavorite(null), 500);

        setBookmarkCount(prev => isNowBookmarked ? prev + 1 : prev - 1);

        window.dispatchEvent(new CustomEvent('bookmarkToggled', {
          detail: { productId, bookmarked: isNowBookmarked }
        }));
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
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
        setFavoritedPosts(prev => ({ ...prev, [productId]: false }));

        window.dispatchEvent(new CustomEvent('bookmarkToggled', {
          detail: { productId, bookmarked: false }
        }));
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
          if (buyerResult.data) {
            const buyerDetails = buyerResult.data;
            let userName = buyerDetails.name || buyerDetails.full_name || buyerDetails.username || userInfo.username || 'User';

            setUserData({
              name: userName,
              email: userInfo.email || 'No email',
              phone: buyerDetails.contact || buyerDetails.phone || buyerDetails.mobile || 'Not provided',
              address: buyerDetails.location || buyerDetails.address || 'Not provided',
              joinDate: new Date(userInfo.date_joined || Date.now()).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long'
              }),
              orders: 0,
              wishlist: 0,
              isSeller: userInfo.is_seller || false,
            });

            fetchBookmarkCount();
            fetchOrderCount();
            fetchBookmarkedProducts();
            fetchLikedProducts();
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
      if (result.data) {
        setOrderCount(result.data.count !== undefined ? result.data.count : 0);
      }
    } catch (error) {
      setOrderCount(0);
    }
  };

  const fetchBookmarkedProducts = async () => {
    setContentLoading(prev => ({ ...prev, bookmarks: true }));
    try {
      const result = await api.getWishlist();
      let products = [];

      const extractProducts = (data) => {
        if (Array.isArray(data)) return data;
        if (data.products && Array.isArray(data.products)) return data.products;
        if (data.items && Array.isArray(data.items)) {
          return data.items.map(item => item.product || item);
        }
        return [];
      };

      const rawProducts = extractProducts(result.data);

      products = rawProducts.map(product => {
        const sellerName = product.seller_name || product.seller?.name || 'Seller';

        return {
          id: product.id,
          seller: { id: product.seller, name: sellerName },
          price: product.unit_price || 0,
          images: product.images && product.images.length > 0
            ? product.images.map(img => getFullImageUrl(img))
            : (product.product_photo ? [getFullImageUrl(product.product_photo)] : ['/sample1.jpg']),
          name: product.name || 'Product',
          content: product.description || 'No description available',
          rating: Math.floor(product.rating_magnitude) || Math.floor(Math.random() * 5) + 1,
          ratingCount: product.rating_number || Math.floor(Math.random() * 100),
          like_count: product.like_count || 0,
          is_liked: product.is_liked || false,
          is_bookmarked: true
        };
      });

      setBookmarkedProducts(products);

      const bookmarkMap = {};
      products.forEach(p => { bookmarkMap[p.id] = true; });
      setFavoritedPosts(bookmarkMap);
    } catch (error) {
      console.error('Error fetching bookmarked products:', error);
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
        products = result.data.map(product => {
          const sellerName = product.seller_name || product.seller?.name || 'Seller';

          return {
            id: product.id,
            seller: { id: product.seller, name: sellerName },
            price: product.unit_price || 0,
            images: product.images && product.images.length > 0
              ? product.images.map(img => getFullImageUrl(img))
              : (product.product_photo ? [getFullImageUrl(product.product_photo)] : ['/sample1.jpg']),
            name: product.name || 'Product',
            content: product.description || 'No description available',
            rating: Math.floor(product.rating_magnitude) || Math.floor(Math.random() * 5) + 1,
            ratingCount: product.rating_number || Math.floor(Math.random() * 100),
            like_count: product.like_count || 0,
            is_liked: true
          };
        });
      }

      setLikedProducts(products);

      const likeMap = {};
      products.forEach(p => { likeMap[p.id] = true; });
      setLikedPosts(likeMap);
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
    if (tab === 'Bookmarks' && bookmarkedProducts.length === 0) {
      fetchBookmarkedProducts();
    } else if (tab === 'liked' && likedProducts.length === 0) {
      fetchLikedProducts();
    } else if (tab === 'orders' && orders.length === 0) {
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
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {bookmarkedProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden">
                  <Link to={`/product/${product.id}`}>
                    <div className="aspect-square w-full bg-gray-200">
                      <img 
                        src={product.images[0]} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => e.target.src = '/sample1.jpg'}
                      />
                    </div>
                  </Link>
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start mb-1">
                      <Link to={`/product/${product.id}`} className="font-medium text-sm hover:underline text-black">
                        {product.name}
                      </Link>
                      <button
                        onClick={() => handleRemoveBookmark(product.id)}
                        className="text-blue-500 hover:text-blue-600"
                      >
                        <Bookmark className="w-4 h-4 fill-current" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mb-2 line-clamp-2">{product.content}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-green-600">
                        {formatCurrency(product.price)}
                      </span>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => toggleLike(product.id)}
                          className={`p-1 rounded-full ${product.is_liked ? 'text-red-500' : 'text-gray-400'}`}
                        >
                          <Heart className="w-3 h-3" fill={product.is_liked ? 'currentColor' : 'none'} />
                        </button>
                        <span className="text-xs text-gray-500">{product.like_count}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {likedProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden">
                  <Link to={`/product/${product.id}`}>
                    <div className="aspect-square w-full bg-gray-200">
                      <img 
                        src={product.images[0]} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => e.target.src = '/sample1.jpg'}
                      />
                    </div>
                  </Link>
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start mb-1">
                      <Link to={`/product/${product.id}`} className="font-medium text-sm hover:underline text-black">
                        {product.name}
                      </Link>
                      <button
                        onClick={() => toggleFavorite(product.id)}
                        className={`${product.is_bookmarked ? 'text-blue-500' : 'text-gray-400'} hover:text-blue-600`}
                      >
                        <Bookmark className="w-4 h-4" fill={product.is_bookmarked ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mb-2 line-clamp-2">{product.content}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-green-600">
                        {formatCurrency(product.price)}
                      </span>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => toggleLike(product.id)}
                          className="text-red-500"
                        >
                          <Heart className="w-3 h-3 fill-current" />
                        </button>
                        <span className="text-xs text-gray-500">{product.like_count}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
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