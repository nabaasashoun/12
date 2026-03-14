import { SellerCard, SellerCardContent } from './SellerCard';
import { Heart, MessageSquare, Star, Bookmark, Edit, Settings, Search, MoreHorizontal, X, Plus, ChevronUp, ChevronDown, Camera } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useSellerDarkMode } from '../../utils/SellerDarkModeContext';

const SellerHomePage = () => {
  const { isDarkMode } = useSellerDarkMode();
  const [searchFocused, setSearchFocused] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const [likedPosts, setLikedPosts] = useState({});
  const [favoritedPosts, setFavoritedPosts] = useState({});
  const [posts, setPosts] = useState([]);
  const [expandedDescriptionId, setExpandedDescriptionId] = useState(null);
  const [expandedDescriptionPosition, setExpandedDescriptionPosition] = useState({ top: 0, left: 0, width: 0 });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    unit_price: '',
    stock_quantity: '',
    image: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Quick deals state
  const [quickDeals, setQuickDeals] = useState([]);
  const [currentVerticalIndex, setCurrentVerticalIndex] = useState(0);
  const [quickDealModalOpen, setQuickDealModalOpen] = useState(false);
  const [sellerProducts, setSellerProducts] = useState([]);
  const [newQuickDeal, setNewQuickDeal] = useState({
    product_id: '',
    caption: '',
    picture: null,
    priority: 0,
  });
  const [isCreating, setIsCreating] = useState(false);

  // Fetch seller's products
  useEffect(() => {
    fetchSellerProducts();
    fetchQuickDeals();
  }, []);

  const fetchSellerProducts = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/seller/login');
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/seller/products/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const transformed = data.map(product => ({
          id: product.id,
          sellerName: product.seller?.name || 'Your Store',
          sellerUsername: product.seller?.user?.username || 'seller',
          authorAvatar: product.seller?.name?.charAt(0) || 'S',
          price: `UGX ${Number(product.unit_price).toLocaleString()}`,
          images: product.images && product.images.length > 0 
            ? product.images 
            : (product.product_photo ? [product.product_photo] : []),
          product: product.name,
          content: product.description,
          rating: Math.floor(product.rating_magnitude) || 0,
          ratingCount: product.rating_number || 0,
          sellerId: product.seller?.id,
          like_count: product.like_count,
          is_liked: false,
          is_bookmarked: false,
          stock_quantity: product.stock_quantity,
          unit_price: product.unit_price,
          description: product.description,
        }));
        setPosts(transformed);
        setSellerProducts(data);
      } else if (response.status === 401) {
        localStorage.removeItem('accessToken');
        navigate('/seller/login');
      } else {
        console.error('Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch seller's quick deals
  const fetchQuickDeals = async () => {
    try {
      const result = await api.getSellerQuickDeals();
      if (Array.isArray(result.data)) {
        const transformed = result.data
          .map(deal => ({
            id: deal.id,
            title: deal.product?.category?.name || 'Category',
            product: deal.product?.name || 'Product',
            image: deal.picture || deal.product?.product_photo || '/placeholder.jpg',
            color: getRandomColor(),
            caption: deal.caption,
            views: deal.views,
            timestamp: deal.timestamp,
            productId: deal.product?.id,
            is_expired: deal.is_expired,  
            time_remaining: deal.time_remaining,
          }))
          .filter(deal => !deal.is_expired);   
        setQuickDeals(transformed);
      } else {
        console.error('Failed to fetch quick deals:', result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error fetching quick deals:', error);
    }
  };

  useEffect(() => {
    const maxValidIndex = Math.max(0, Math.floor((quickDeals.length - 1) / 4) * 4);
    if (currentVerticalIndex > maxValidIndex) {
      setCurrentVerticalIndex(maxValidIndex);
    }
  }, [quickDeals.length, currentVerticalIndex]);
  
  const getRandomColor = () => {
    const colors = isDarkMode 
      ? ['bg-gray-700', 'bg-gray-800', 'bg-gray-900', 'bg-blue-900', 'bg-purple-900']
      : ['bg-blue-100', 'bg-pink-100', 'bg-green-100', 'bg-orange-100', 'bg-purple-100'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Handle quick deal click
  const handleQuickDealClick = (deal) => {
    navigate(`/product/${deal.productId}`);
  };

  // Scroll quick deals vertically
  const scrollVertical = (direction) => {
    const step = 4;

    if (direction === 'up' && currentVerticalIndex > 0) {
      setCurrentVerticalIndex(prev => Math.max(0, prev - step));
    } else if (direction === 'down' && currentVerticalIndex < quickDeals.length - step) {
      setCurrentVerticalIndex(prev => prev + step);
    }
  };

  // Open quick deal creation modal
  const openQuickDealModal = () => {
    setNewQuickDeal({ product_id: '', caption: '', picture: null, priority: 0 });
    setQuickDealModalOpen(true);
  };

  // Handle quick deal form input
  const handleQuickDealInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'picture' && files.length > 0) {
      setNewQuickDeal(prev => ({ ...prev, picture: files[0] }));
    } else {
      setNewQuickDeal(prev => ({ ...prev, [name]: value }));
    }
  };

  // Submit new quick deal 
  const handleCreateQuickDeal = async (e) => {
    e.preventDefault();
    if (!newQuickDeal.product_id) {
      alert('Please select a product');
      return;
    }
    setIsCreating(true);
    try {
      const dealData = {
        product_id: newQuickDeal.product_id,
        caption: newQuickDeal.caption || '',
        priority: newQuickDeal.priority || 0,
        picture: newQuickDeal.picture,          
      };

      const result = await api.createQuickDeal(dealData);   

      console.log('Quick deal creation result:', result);

      if (result.status >= 200 && result.status < 300 && result.data?.id) {
       
        setQuickDealModalOpen(false);
        setNewQuickDeal({ product_id: '', caption: '', picture: null, priority: 0 });
        fetchQuickDeals();
        localStorage.setItem('quickDealUpdated', Date.now().toString()); 
        window.dispatchEvent(new CustomEvent('quickDealCreated'));
      } else {
        const errorMsg = result.error || JSON.stringify(result.data || {});
        alert(`Failed to create quick deal: ${errorMsg}`);
      }
    } catch (error) {
      console.error('Error creating quick deal:', error);
      alert('Error creating quick deal. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  // Function to format currency as UGX
  const formatCurrency = (amount) => {
    if (typeof amount === 'string' && amount.startsWith('UGX')) return amount;
    return `UGX ${parseFloat(amount).toLocaleString('en-UG')}`;
  };

  // Toggle description expansion
  const toggleDescriptionExpansion = (postId, event) => {
    if (expandedDescriptionId === postId) {
      setExpandedDescriptionId(null);
      return;
    }
    const button = event.currentTarget;
    const buttonRect = button.getBoundingClientRect();
    const top = buttonRect.bottom + window.scrollY + 5;
    const left = buttonRect.left + window.scrollX;
    const width = Math.min(buttonRect.width, 350);
    const viewportWidth = window.innerWidth;
    let adjustedLeft = left;
    if (left + width > viewportWidth) {
      adjustedLeft = viewportWidth - width - 10;
    }
    setExpandedDescriptionPosition({ top, left: adjustedLeft, width, maxWidth: 350 });
    setExpandedDescriptionId(postId);
  };

  // Close description overlay when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (expandedDescriptionId) {
        const isClickInside = event.target.closest('.description-expanded-box') ||
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

  const goToImage = (postId, imageIndex) => {
    setCurrentImageIndex(prev => ({ ...prev, [postId]: imageIndex }));
  };

  const toggleDropdown = (postId) => {
    setDropdownOpen(dropdownOpen === postId ? null : postId);
  };

  const closeDropdown = () => setDropdownOpen(null);

  // Like/favorite are local only
  const toggleLike = (postId) => {
    setLikedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
    setPosts(prev =>
      prev.map(post =>
        post.id === postId
          ? { ...post, like_count: prev[postId] ? post.like_count - 1 : post.like_count + 1 }
          : post
      )
    );
  };

  const toggleFavorite = (postId) => {
    setFavoritedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  // Open edit modal
  const openEditModal = (post) => {
    setEditingProduct(post);
    setEditFormData({
      name: post.product,
      description: post.content,
      unit_price: post.unit_price,
      stock_quantity: post.stock_quantity,
      image: null,
    });
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingProduct(null);
    setEditFormData({ name: '', description: '', unit_price: '', stock_quantity: '', image: null });
  };

  const handleEditFormChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image' && files.length > 0) {
      setEditFormData(prev => ({ ...prev, image: files[0] }));
    } else {
      setEditFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;

    const token = localStorage.getItem('accessToken');
    const formData = new FormData();
    formData.append('name', editFormData.name);
    formData.append('description', editFormData.description);
    formData.append('unit_price', editFormData.unit_price);
    formData.append('stock_quantity', editFormData.stock_quantity);
    if (editFormData.image) {
      formData.append('product_photo', editFormData.image);
    }

    try {
      const response = await fetch(`/api/seller/products/${editingProduct.id}/`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        const updated = await response.json();
        setPosts(prev =>
          prev.map(p =>
            p.id === editingProduct.id
              ? {
                  ...p,
                  product: updated.name,
                  content: updated.description,
                  price: `UGX ${Number(updated.unit_price).toLocaleString()}`,
                  stock_quantity: updated.stock_quantity,
                  unit_price: updated.unit_price,
                  images: updated.images && updated.images.length > 0
                    ? updated.images
                    : (updated.product_photo ? [updated.product_photo] : p.images),
                }
              : p
          )
        );
        alert('Product updated successfully!');
        closeEditModal();
      } else {
        const err = await response.json();
        alert(`Update failed: ${err.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Error updating product. Please try again.');
    }
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

  if (isLoading) {
    return (
      <div className={`p-6 max-w-4xl mx-auto text-center min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div>
          <div className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto ${isDarkMode ? 'border-green-400' : 'border-green-500'}`}></div>
          <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading your products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-2 sm:p-4 md:p-6 max-w-4xl mx-auto relative min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header section */}
      <div className="flex justify-between items-center mb-2 sm:mb-3">
        <div className={`flex w-full sm:w-64 border rounded-lg overflow-hidden ${
          isDarkMode ? 'border-gray-700' : 'border-gray-300'
        }`}>
          <select className={`w-1/5 px-2 py-1 focus:outline-none text-xs border-r ${
            isDarkMode 
              ? 'bg-gray-800 text-gray-200 border-gray-700' 
              : 'bg-white text-black border-gray-300'
          }`}>
            <option value="all">All</option>
            <option value="tech">Tech</option>
            <option value="fitness">Fitness</option>
            <option value="home">Home</option>
            <option value="fashion">Fashion</option>
          </select>
          <div className="relative w-4/5">
            <input
              type="text"
              placeholder="Search your products..."
              className={`w-full px-2 py-1 placeholder-gray-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDarkMode 
                  ? 'bg-gray-800 text-gray-200' 
                  : 'bg-white text-black'
              }`}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            />
            <Search className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`} />
          </div>
        </div>
        <div className="relative group ml-4">
          <Link to="/seller/settings" className={`p-0.5 ${isDarkMode ? 'text-gray-300 hover:text-blue-400' : 'text-black hover:text-blue-500'}`}>
            <Settings className="w-4 h-4" />
          </Link>
          <span className={`absolute hidden group-hover:block -top-6 left-1/2 transform -translate-x-1/2 text-white text-xs rounded py-1 px-2 ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-800'
          }`}>Settings</span>
        </div>
      </div>

      {/* Quick Deals Section */}
      <div className={`sticky top-0 z-40 pt-2 pb-2 mb-2 rounded-lg transition-colors ${
        isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
      }`}>
        <div className="flex items-center justify-between w-full">
          {/* Heading + Add button*/}
          <div className="flex-shrink-0 mr-4 flex items-center">
            <div className="flex flex-col leading-tight mr-2">
              <span className={`text-lg font-bold ${isDarkMode ? 'text-gray-200' : 'text-black'}`}>Quick</span>
              <span className={`text-lg font-bold ${isDarkMode ? 'text-gray-200' : 'text-black'}`}>Deals</span>
            </div>
            <button
              onClick={openQuickDealModal}
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors ${
                isDarkMode 
                  ? 'bg-green-900 hover:bg-green-800' 
                  : 'bg-green-100 hover:bg-green-200'
              }`}
              title="Add Quick Deal"
            >
              <Plus className={`w-4 h-4 sm:w-5 sm:h-5 ${
                isDarkMode ? 'text-green-400' : 'text-green-600'
              }`} />
            </button>
          </div>

          {/* Deals container */}
          <div className="flex flex-1 justify-start space-x-3 sm:space-x-4">
            {quickDeals.slice(currentVerticalIndex, currentVerticalIndex + 4).map((item) => (
              <div
                key={item.id}
                className="flex flex-col items-center flex-shrink-0 cursor-pointer"
                onClick={() => handleQuickDealClick(item)}
              >
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${item.color} flex items-center justify-center border-2 ${
                  isDarkMode ? 'border-gray-700' : 'border-white'
                } shadow-sm`}>
                  <img
                    src={item.image}
                    alt={item.product}
                    className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded-full"
                  />
                </div>
                <p className={`text-center text-xs mt-1 font-medium truncate w-12 sm:w-14 ${
                  isDarkMode ? 'text-gray-300' : 'text-black'
                }`}>
                  {item.title}
                </p>
                <p className={`text-center text-xs truncate w-12 sm:w-14 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-500'
                }`}>
                  {item.product}
                </p>
              </div>
            ))}
          </div>

          {/* Scroll up/down buttons */}
          <div className="flex flex-col space-y-1 ml-4">
            <button
              onClick={() => scrollVertical('up')}
              className={`shadow-md rounded-full p-1 transition-colors ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600' 
                  : 'bg-white hover:bg-gray-100'
              }`}
              disabled={currentVerticalIndex === 0}
            >
              <ChevronUp className={`w-3 h-3 ${
                currentVerticalIndex === 0 
                  ? isDarkMode ? 'text-gray-600' : 'text-gray-300'
                  : isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`} />
            </button>
            <button
              onClick={() => scrollVertical('down')}
              className={`shadow-md rounded-full p-1 transition-colors ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600' 
                  : 'bg-white hover:bg-gray-100'
              }`}
              disabled={currentVerticalIndex >= quickDeals.length - 4}
            >
              <ChevronDown className={`w-3 h-3 ${
                currentVerticalIndex >= quickDeals.length - 4
                  ? isDarkMode ? 'text-gray-600' : 'text-gray-300'
                  : isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`} />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className={`w-full h-1 rounded-full relative mt-3 ${
          isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
        }`}>
          <div
            className={`absolute top-0 left-0 h-1 rounded-full transition-all duration-300 ${
              isDarkMode ? 'bg-gray-400' : 'bg-gray-600'
            }`}
            style={{
              width: '25%',
              transform: `translateX(${currentVerticalIndex / 4 * 100}%)`
            }}
          />
        </div>
      </div>

      {/* Posts grid */}
      {posts.length === 0 ? (
        <div className="text-center py-12">
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>You haven't added any products yet.</p>
          <button
            onClick={() => navigate('/seller/add-product/step1')}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Add Your First Product
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {posts.map((post) => {
            const currentIndex = currentImageIndex[post.id] || 0;
            const totalImages = post.images.length;
            const truncatedDescription = post.content.length > 40 ? post.content.substring(0, 40) + '...' : post.content;

            return (
              <SellerCard key={post.id} variant="elevated" className="overflow-hidden flex flex-col relative">
                <SellerCardContent className="p-0 flex flex-col">
                  <div className={`p-0 sm:p-3 flex flex-col border-b ${
                    isDarkMode ? 'border-gray-700' : 'border-gray-100'
                  }`}>
                    <div className="flex justify-between items-center">
                      <Link
                        to={`/seller/${post.sellerId || post.id}`}
                        className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                      >
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs">
                          {post.authorAvatar}
                        </div>
                        <span className={`font-medium text-xs sm:text-sm truncate ${
                          isDarkMode ? 'text-gray-200' : 'text-black'
                        }`}>
                          {post.sellerName}
                        </span>
                      </Link>
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
                    <div className="flex justify-center items-center mt-0.2">
                      <span className="text-xs text-green-600 mb-1 font-semibold">{post.price}</span>
                    </div>
                  </div>
                  <div
                    className={`relative aspect-square w-full flex-1 ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                    }`}
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
                        src={post.images[currentIndex] || '/placeholder.jpg'}
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
                          <Link
                            to={`/product/${post.id}/comments`}
                            className={`p-1 rounded-full ${
                              isDarkMode 
                                ? 'text-gray-400 hover:text-blue-400 hover:bg-blue-900/30' 
                                : 'text-gray-600 hover:text-blue-500 hover:bg-blue-50'
                            }`}
                          >
                            <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Link>
                          <button
                            onClick={() => openEditModal(post)}
                            className={`p-1 rounded-full ${
                              isDarkMode 
                                ? 'text-gray-400 hover:text-yellow-400' 
                                : 'text-gray-600 hover:text-yellow-500'
                            }`}
                            title="Edit Product"
                          >
                            <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
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
                                star <= post.rating 
                                  ? 'text-yellow-500' 
                                  : isDarkMode ? 'text-gray-600' : 'text-gray-300'
                              }`}
                              fill={star <= post.rating ? 'currentColor' : 'none'}
                            />
                          ))}
                        </div>
                        <span className={`text-xs ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>({post.ratingCount})</span>
                      </div>
                    </div>
                    <Link to={`/product/${post.id}`} className={`hover:underline text-xs font-medium truncate mb-1 ${
                      isDarkMode ? 'text-gray-300' : 'text-black'
                    }`}>
                      {post.product}
                    </Link>
                    <div className="mt-0 relative">
                      <button
                        onClick={(e) => toggleDescriptionExpansion(post.id, e)}
                        className={`description-toggle-button text-xs text-left w-full p-1 rounded transition-colors flex items-start ${
                          isDarkMode 
                            ? 'text-gray-400 hover:text-blue-400 bg-gray-700 hover:bg-gray-600' 
                            : 'text-gray-600 hover:text-blue-500 bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <span className="text-left">{truncatedDescription}</span>
                      </button>
                    </div>
                  </div>
                </SellerCardContent>
              </SellerCard>
            );
          })}
        </div>
      )}

      {/* Expanded description overlay */}
      {expandedDescriptionId && (
        <div className="fixed inset-0 z-[100] pointer-events-none">
          <div className="absolute inset-0 pointer-events-auto" onClick={() => setExpandedDescriptionId(null)} />
          <div
            className={`description-expanded-box fixed border rounded-lg shadow-lg z-[101] animate-fadeIn max-h-[200px] overflow-y-auto pointer-events-auto ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-300'
            }`}
            style={{
              top: `${expandedDescriptionPosition.top}px`,
              left: `${expandedDescriptionPosition.left}px`,
              width: `${expandedDescriptionPosition.width}px`,
              maxWidth: `${expandedDescriptionPosition.maxWidth}px`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3">
              <div className={`flex justify-between items-center mb-2 pb-2 border-b ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <h3 className={`font-medium text-sm ${
                  isDarkMode ? 'text-gray-200' : 'text-black'
                }`}>Product Description</h3>
                <button onClick={() => setExpandedDescriptionId(null)} className={`rounded-full p-1 transition-colors ${
                  isDarkMode 
                    ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-700' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}>
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="overflow-y-auto pr-1" style={{ maxHeight: '120px' }}>
                <p className={`text-xs whitespace-pre-line leading-relaxed ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {posts.find(p => p.id === expandedDescriptionId)?.content || 'No description available'}
                </p>
              </div>
              <div className={`mt-2 pt-2 border-t ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    Seller: {posts.find(p => p.id === expandedDescriptionId)?.sellerName || 'Seller'}
                  </span>
                  <Link
                    to={`/product/${expandedDescriptionId}`}
                    className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                    onClick={() => setExpandedDescriptionId(null)}
                  >
                    View Product →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className={`p-4 border-b ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <h3 className={`font-semibold text-lg ${
                isDarkMode ? 'text-gray-200' : 'text-black'
              }`}>Edit Product</h3>
              <p className={`text-sm mt-1 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Make changes to your product.</p>
            </div>
            <form onSubmit={handleUpdateProduct} className="p-4">
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Product Name</label>
                  <input
                    type="text"
                    name="name"
                    value={editFormData.name}
                    onChange={handleEditFormChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-gray-200' 
                        : 'bg-white border-gray-300 text-black'
                    }`}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Description</label>
                  <textarea
                    name="description"
                    value={editFormData.description}
                    onChange={handleEditFormChange}
                    rows={4}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-gray-200' 
                        : 'bg-white border-gray-300 text-black'
                    }`}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Price (UGX)</label>
                    <input
                      type="number"
                      name="unit_price"
                      value={editFormData.unit_price}
                      onChange={handleEditFormChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-200' 
                          : 'bg-white border-gray-300 text-black'
                      }`}
                      required
                      min="0"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Stock Quantity</label>
                    <input
                      type="number"
                      name="stock_quantity"
                      value={editFormData.stock_quantity}
                      onChange={handleEditFormChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-gray-200' 
                          : 'bg-white border-gray-300 text-black'
                      }`}
                      required
                      min="0"
                    />
                  </div>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Product Image</label>
                  <input
                    type="file"
                    name="image"
                    onChange={handleEditFormChange}
                    accept="image/*"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-gray-200' 
                        : 'bg-white border-gray-300 text-black'
                    }`}
                  />
                  <p className={`text-xs mt-1 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-500'
                  }`}>Leave empty to keep current image</p>
                </div>
              </div>
              <div className={`flex justify-end space-x-3 mt-6 pt-4 border-t ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <button type="button" onClick={closeEditModal} className={`px-4 py-2 text-sm font-medium rounded-md ${
                  isDarkMode 
                    ? 'text-gray-300 bg-gray-700 hover:bg-gray-600' 
                    : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                }`}>
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                  Update Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Deal Creation Modal */}
      {quickDealModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className={`p-4 border-b flex justify-between items-center ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <h3 className={`font-semibold text-lg ${
                isDarkMode ? 'text-gray-200' : 'text-black'
              }`}>Create Quick Deal</h3>
              <button onClick={() => setQuickDealModalOpen(false)} className={`${
                isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
              }`}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateQuickDeal} className="p-4">
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Select Product *</label>
                  <select
                    name="product_id"
                    value={newQuickDeal.product_id}
                    onChange={handleQuickDealInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-gray-200' 
                        : 'bg-white border-gray-300 text-black'
                    }`}
                    required
                  >
                    <option value="">Choose a product</option>
                    {sellerProducts.map(prod => (
                      <option key={prod.id} value={prod.id}>
                        {prod.name} (Stock: {prod.stock_quantity})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Caption</label>
                  <input
                    type="text"
                    name="caption"
                    value={newQuickDeal.caption}
                    onChange={handleQuickDealInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-gray-200' 
                        : 'bg-white border-gray-300 text-black'
                    }`}
                    placeholder="e.g., Limited offer!"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Picture (optional)</label>
                  <input
                    type="file"
                    name="picture"
                    accept="image/*"
                    onChange={handleQuickDealInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-gray-200' 
                        : 'bg-white border-gray-300 text-black'
                    }`}
                  />
                  <p className={`text-xs mt-1 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-500'
                  }`}>If not provided, product image will be used</p>
                </div>
              </div>
              <div className={`flex justify-end space-x-3 mt-6 pt-4 border-t ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <button
                  type="button"
                  onClick={() => setQuickDealModalOpen(false)}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    isDarkMode 
                      ? 'text-gray-300 bg-gray-700 hover:bg-gray-600' 
                      : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                >
                  {isCreating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    'Create Quick Deal'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dropdown Modal */}
      {dropdownOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeDropdown}>
          <div className={`rounded-xl ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`} onClick={(e) => e.stopPropagation()}>
            <div className={`p-4 border text-center ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <h3 className={`font-semibold text-lg ${
                isDarkMode ? 'text-gray-200' : 'text-black'
              }`}>Post Options</h3>
            </div>
            <div className={`divide-y ${
              isDarkMode ? 'divide-gray-700' : 'divide-gray-100'
            }`}>
              {dropdownItems.map((item, index) => (
                <button
                  key={index}
                  onClick={item.action}
                  className={`w-full text-center px-4 py-3 text-sm first:rounded-t-lg last:rounded-b-lg transition-colors ${
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

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
      `}</style>
    </div>
  );
};

export default SellerHomePage;