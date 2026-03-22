import { useState, useEffect, useRef } from 'react'; 
import { useParams, useNavigate } from 'react-router-dom';
import {
  Minus, Plus, Star, Settings, ChevronLeft, ChevronDown,
  CheckCircle, User, Clock, Heart, Bookmark
} from 'lucide-react';
import { useLikeBookmark } from '../../utils/LikeBookmarkContext';
import { useCart } from '../../utils/CartContext';
import { useDarkMode } from '../../utils/BuyerDarkModeContext';
import { getFullImageUrl, PLACEHOLDER_IMAGE } from '../../utils/imageUtils';

const Product = () => {
  const { isDarkMode } = useDarkMode();  
  console.log('getFullImageUrl function:', getFullImageUrl);
  console.log('PLACEHOLDER_IMAGE:', PLACEHOLDER_IMAGE);
  console.log('Product images data:', product?.images);
  console.log('Product photo:', product?.product_photo);                 
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [comments, setComments] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [zoom, setZoom] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showQuestions, setShowQuestions] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState([]);
  const [questionAnswers, setQuestionAnswers] = useState({});
  const [animatingLike, setAnimatingLike] = useState(false);
  const [animatingFavorite, setAnimatingFavorite] = useState(false);
  const [cartMessage, setCartMessage] = useState('');
  const [isSavingAnswers, setIsSavingAnswers] = useState(false);

  const { isLiked, isBookmarked, toggleLike, toggleBookmark } = useLikeBookmark();
  const { addToCart, cartItems } = useCart();

  const touchStartX = useRef(null);
  const carouselRef = useRef(null);

  const navigate = useNavigate();

  const formatCurrency = (amount) => {
    return `UGX ${Number(amount).toLocaleString('en-UG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isInCart = cartItems.some(item => item.product?.id === parseInt(productId));

  useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;

    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        navigate('/login');
        return;
      }
      
      try {
        const response = await fetch(`/api/products/${productId}/`, {
          headers: { Authorization: `JWT ${token}` },
          signal,
        });
        
        if (response.ok) {
          const data = await response.json();
          if (!signal.aborted) {
            setProduct(data);
            setQuantity(data.min_order || 1);
            
            setQuestionAnswers(prev => {
              if (!prev[productId]) {
                const newAnswers = { ...prev, [productId]: {} };
                localStorage.setItem('cartQuestionAnswers', JSON.stringify(newAnswers));
                return newAnswers;
              }
              return prev;
            });
          }
        } else if (response.status === 401) {
          localStorage.removeItem('accessToken');
          navigate('/login');
        } else {
          setError(`Failed to fetch product: ${response.statusText}`);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error fetching product:', err);
          setError('Network error. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchComments = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      
      try {
        const response = await fetch(`/api/products/${productId}/comments/`, {
          headers: { Authorization: `JWT ${token}` },
          signal,
        });
        if (response.ok) {
          const data = await response.json();
          if (!signal.aborted) setComments(data);
        }
      } catch (err) {
        if (err.name !== 'AbortError') console.error('Error fetching comments:', err);
      }
    };

    const fetchRelated = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      
      try {
        const response = await fetch(`/api/products/${productId}/related/`, {
          headers: { Authorization: `JWT ${token}` },
          signal,
        });
        if (response.ok) {
          const data = await response.json();
          if (!signal.aborted) setRelatedProducts(data);
        } else {
          const allRes = await fetch('/api/products/', {
            headers: { Authorization: `JWT ${token}` },
            signal,
          });
          if (allRes.ok) {
            const all = await allRes.json();
            const filtered = all.filter(p => p.id.toString() !== productId).slice(0, 4);
            if (!signal.aborted) setRelatedProducts(filtered);
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError') console.error('Error fetching related:', err);
      }
    };

    const loadSavedAnswers = () => {
      const saved = localStorage.getItem('cartQuestionAnswers');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setQuestionAnswers(parsed);
        } catch (e) {
          console.error('Error parsing saved answers:', e);
        }
      } else {
        const initialAnswers = {};
        localStorage.setItem('cartQuestionAnswers', JSON.stringify(initialAnswers));
        setQuestionAnswers(initialAnswers);
      }
    };

    loadSavedAnswers();
    fetchProduct();
    fetchComments();
    fetchRelated();

    return () => {
      abortController.abort();
    };
  }, [productId, navigate]);
  
  // Set up non-passive touchmove listener for swipe prevention
  useEffect(() => {
    const element = carouselRef.current;
    if (!element) return;

    const handleTouchMoveNative = (e) => {
      if (touchStartX.current) {
        e.preventDefault();
      }
    };

    element.addEventListener('touchmove', handleTouchMoveNative, { passive: false });

    return () => {
      element.removeEventListener('touchmove', handleTouchMoveNative);
    };
  }, []);

  const handleAnswerChange = (qId, value) => {
    setQuestionAnswers(prev => {
      const newAnswers = {
        ...prev,
        [productId]: {
          ...(prev[productId] || {}),
          [qId]: value,
        },
      };
      localStorage.setItem('cartQuestionAnswers', JSON.stringify(newAnswers));
      return newAnswers;
    });
  };

  const saveAnswers = () => {
    setIsSavingAnswers(true);
    
    setTimeout(() => {
      localStorage.setItem('cartQuestionAnswers', JSON.stringify(questionAnswers));
      setIsSavingAnswers(false);
    }, 300);
  };

  const allRequiredAnswered = () => {
    if (!product?.questions?.length) return true;
    const required = product.questions.filter(q => q.required);
    if (!required.length) return true;
    const answers = questionAnswers[productId] || {};
    return required.every(q => {
      const answer = answers[q.id];
      if (answer === undefined || answer === null) return false;
      if (typeof answer === 'string') return answer.trim() !== '';
      return answer !== '';
    });
  };

  const handleToggleLike = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      return;
    }
    
    setAnimatingLike(true);
    setTimeout(() => setAnimatingLike(false), 600);
    
    await toggleLike(parseInt(productId));
  };

  const handleToggleFavorite = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      return;
    }
    
    setAnimatingFavorite(true);
    setTimeout(() => setAnimatingFavorite(false), 500);
    
    await toggleBookmark(parseInt(productId));
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    if (isInCart) {
      setCartMessage('Item already in cart!');
      setTimeout(() => setCartMessage(''), 3000);
      return;
    }
    
    if (quantity < product.min_order) {
      setCartMessage(`Minimum order quantity is ${product.min_order}`);
      setTimeout(() => setCartMessage(''), 3000);
      return;
    }
    if (quantity > product.max_order) {
      setCartMessage(`Maximum order quantity is ${product.max_order}`);
      setTimeout(() => setCartMessage(''), 3000);
      return;
    }

    setIsAddingToCart(true);
    try {
      await addToCart(
        parseInt(productId), 
        quantity, 
        questionAnswers[productId] || {} 
      );
    } catch (error) {
      setCartMessage('Error adding to cart.');
      console.error('Add to cart error:', error);
    } finally {
      setIsAddingToCart(false);
      setTimeout(() => setCartMessage(''), 3000);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > product.min_order) setQuantity(q => q - 1);
  };

  const increaseQuantity = () => {
    if (quantity < product.max_order) setQuantity(q => q + 1);
  };

  const handleQuantityChange = (e) => {
    const val = parseInt(e.target.value);
    if (isNaN(val)) return;
    if (val < product.min_order) setQuantity(product.min_order);
    else if (val > product.max_order) setQuantity(product.max_order);
    else setQuantity(val);
  };

  const handleImageDoubleClick = (e) => {
    if (!zoom) {
      const rect = e.target.getBoundingClientRect();
      setZoomPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setZoom(true);
    } else {
      setZoom(false);
    }
  };

  const handleMouseMove = (e) => {
    if (zoom) {
      const rect = e.target.getBoundingClientRect();
      setZoomPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  
  const handleTouchEnd = (e) => {
    if (!touchStartX.current) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (Math.abs(diff) > 50) {
      const images = product?.images?.length ? product.images : product?.product_photo ? [product.product_photo] : [];
      if (diff > 0) setCurrentImageIndex(prev => Math.min(prev + 1, images.length - 1));
      else setCurrentImageIndex(prev => Math.max(prev - 1, 0));
    }
    touchStartX.current = null;
  };

  const handleRelatedClick = (id) => navigate(`/product/${id}`);

  const toggleQuestion = (idx) => {
    setExpandedQuestions(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  if (error) {
    return <div className={`p-4 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>Error: {error}</div>;
  }
  if (loading || !product) {
    return <div className={`p-4 ${isDarkMode ? 'text-gray-400' : 'text-black'}`}>Loading...</div>;
  }

  const images = product.images?.length ? product.images.map(img => getFullImageUrl(img)) : 
                   product.product_photo ? [getFullImageUrl(product.product_photo)] : 
                   [PLACEHOLDER_IMAGE];
  
  const averageRating = Number(product.rating_magnitude) || 0;
  const totalReviews = Number(product.rating_number) || 0;
  const answers = questionAnswers[productId] || {};
  const productIdNum = parseInt(productId);

  return (
    <div className={`p-3 sm:p-4 md:p-6 max-w-4xl mx-auto min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-black'}`}>

      {/* Cart Message Toast */}
      {cartMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-slideDown">
          <div className={`px-6 py-3 rounded-full shadow-lg flex items-center gap-2 ${cartMessage.includes('Failed') || cartMessage.includes('Please') ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
            <span className="font-medium">{cartMessage}</span>
          </div>
        </div>
      )}

      {/* Fixed Top Bar */}
      <div className={`fixed top-0 left-0 right-0 z-20 py-2 px-3 sm:px-4 md:px-6 border-b transition-colors ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex justify-between items-center">
          <button
            onClick={() => navigate(-1)}
            className={`flex items-center font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
          >
            <ChevronLeft className="w-5 h-5 mr-1" /> Back
          </button>
          <div className="flex-1 max-w-md mx-4" /> 
          <div className="flex gap-3">
            <Settings
              className={`w-5 h-5 cursor-pointer ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}
              onClick={() => navigate('/settings')}
            />
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-10 mb-4">
          <h2 className={`text-[15px] font-bold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>Related Products</h2>
          <div className="flex overflow-x-auto space-x-4 pb-2 scrollbar-hide">
            {relatedProducts.map((rp) => (
              <div
                key={rp.id}
                onClick={() => handleRelatedClick(rp.id)}
                className={`flex-shrink-0 w-20 h-20 border rounded-lg shadow-sm hover:shadow-md cursor-pointer transition-all ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
              >
                <img
                  src={getFullImageUrl(rp.product_photo) || PLACEHOLDER_IMAGE}
                  alt={rp.name}
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Product Image */}
      <div className="relative mt-2">
        {/* Carousel container */}
        <div
          ref={carouselRef}
          className="flex items-center justify-center w-full overflow-hidden rounded-xl"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Previous image (if exists) */}
          {currentImageIndex > 0 && (
            <div
              className="flex-shrink-0 w-1/6 md:w-1/8 opacity-20 hover:opacity-75 transition-opacity cursor-pointer"
              onClick={() => setCurrentImageIndex(prev => prev - 1)}
            >
              <img
                src={images[currentImageIndex - 1]}
                alt="Previous product view"
                className="w-full h-70 object-cover rounded-l-xl"
                onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
              />
            </div>
          )}

          {/* Main image */}
          <div
            className={`
              flex-shrink-0 transition-all
              ${currentImageIndex > 0 && currentImageIndex < images.length - 1
                ? 'w-4/5 md:w-2/3'
                : (currentImageIndex > 0 || currentImageIndex < images.length - 1)
                  ? 'w-4/5'
                  : 'w-full'
              }
            `}
          >
            <img
              src={images[currentImageIndex]}
              alt={product.name}
              className={`w-full h-70 object-cover transition-all duration-300 rounded-xl ${zoom ? 'scale-150' : ''}`}
              style={zoom ? { transformOrigin: `${zoomPos.x}px ${zoomPos.y}px` } : {}}
              onDoubleClick={handleImageDoubleClick}
              onMouseMove={handleMouseMove}
              onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
            />
          </div>

          {/* Next image (if exists) */}
          {currentImageIndex < images.length - 1 && (
            <div
              className="flex-shrink-0 w-1/6 md:w-1/8 opacity-20 hover:opacity-75 transition-opacity cursor-pointer"
              onClick={() => setCurrentImageIndex(prev => prev + 1)}
            >
              <img
                src={images[currentImageIndex + 1]}
                alt="Next product view"
                className="w-full h-70 object-cover rounded-r-xl"
                onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }}
              />
            </div>
          )}
        </div>

        {/* Dot indicators */}
        {images.length > 1 && (
          <div className="flex justify-center mt-3 space-x-2">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImageIndex(idx)}
                className={`w-2 h-2 rounded-full transition-colors ${idx === currentImageIndex ? 'bg-blue-500' : isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <p className={`text-[32px] font-bold mt-6 ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>{product.name}</p>
      <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>{product.description}</p>
      <p className={`text-2xl font-bold mt-3 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{formatCurrency(product.unit_price)}</p>

      <div className="flex items-center mt-3">
        <div className="flex mr-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-5 h-5 ${star <= averageRating ? 'text-yellow-400 fill-yellow-400' : isDarkMode ? 'text-gray-600' : 'text-gray-300'}`}
            />
          ))}
        </div>
        <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-black'}`}>{averageRating.toFixed(1)}</span>
        <span className={`ml-2 text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
          ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
        </span>
      </div>

      <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Stock: {product.stock_quantity}</p>
      <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
        Min Order: {product.min_order} | Max Order: {product.max_order}
      </p>

      {/* Like & Bookmark Buttons */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={handleToggleLike}
          className={`flex-1 py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 ${isLiked(productIdNum) ? 'bg-red-600 text-white' : isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'}`}
          style={{ transform: animatingLike ? 'scale(1.05)' : 'scale(1)' }}
        >
          <Heart className="w-5 h-5" fill={isLiked(productIdNum) ? 'white' : 'none'} />
          Like
        </button>

        <button
          onClick={handleToggleFavorite}
          className={`flex-1 py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 ${isBookmarked(productIdNum) ? 'bg-indigo-600 text-white' : isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-200 hover:bg-gray-300'}`}
          style={{ transform: animatingFavorite ? 'scale(1.05)' : 'scale(1)' }}
        >
          <Bookmark className="w-5 h-5" fill={isBookmarked(productIdNum) ? 'white' : 'none'} />
          Bookmark
        </button>
      </div>

      {/* Quantity + Add to Cart */}
      <div className="flex items-center mt-8">
        <button
          onClick={decreaseQuantity}
          disabled={quantity <= product.min_order}
          className={`p-3 rounded-xl transition-all ${quantity <= product.min_order ? 'bg-gray-700 cursor-not-allowed' : isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
        >
          <Minus className="w-5 h-5" />
        </button>

        <input
          type="number"
          value={quantity}
          onChange={handleQuantityChange}
          min={product.min_order}
          max={product.max_order}
          className={`mx-4 w-16 text-center text-xl font-medium border rounded-xl py-3 focus:outline-none ${isDarkMode ? 'bg-gray-800 border-gray-600 text-gray-100' : 'bg-white border-gray-300'}`}
        />

        <button
          onClick={increaseQuantity}
          disabled={quantity >= product.max_order}
          className={`p-3 rounded-xl transition-all ${quantity >= product.max_order ? 'bg-gray-700 cursor-not-allowed' : isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
        >
          <Plus className="w-5 h-5" />
        </button>

        <button
          onClick={handleAddToCart}
          disabled={isAddingToCart || isInCart}
          className={`ml-6 flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${isAddingToCart || isInCart ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 text-white'}`}
        >
          {isAddingToCart ? 'Adding...' : isInCart ? 'Already in Cart' : 'Add to Cart'}
        </button>
      </div>

      {/* Customer Reviews */}
      <div className="mt-10">
        <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>Customer Reviews</h2>
        {comments.length === 0 ? (
          <div className={`text-center py-10 border rounded-2xl ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>No reviews yet. Be the first!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.slice(0, 2).map((comment) => (
              <div key={comment.id} className={`border rounded-2xl p-5 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-start">
                  <div className={`w-10 h-10 rounded-full flex-shrink-0 mr-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    {comment.user_photo ? (
                      <img src={getFullImageUrl(comment.user_photo)} alt="" className="w-full h-full rounded-full object-cover" onError={(e) => { e.target.src = PLACEHOLDER_IMAGE; }} />
                    ) : (
                      <User className={`w-5 h-5 mx-auto mt-2.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-black'}`}>{comment.user_name}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`w-3 h-3 ${s <= comment.rating ? 'text-yellow-400 fill-yellow-400' : isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      <span className={isDarkMode ? 'text-gray-500' : 'text-gray-500'}>{formatDate(comment.created_at)}</span>
                    </div>
                    <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{comment.comment}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Seller Questions Section */}
      {product.questions?.length > 0 && (
        <div className="mt-10">
          <button
            onClick={() => setShowQuestions(!showQuestions)}
            className={`w-full py-4 px-5 rounded-2xl flex justify-between items-center font-medium transition-all ${
              isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Seller Questions
            <ChevronDown
              className={`w-5 h-5 transition-transform ${showQuestions ? 'rotate-180' : ''}`}
            />
          </button>

          {showQuestions && (
            <div
              className={`mt-3 space-y-3 p-5 rounded-2xl ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
              }`}
            >
              {product.questions.map((q, idx) => {
                const requiredUnanswered =
                  q.required && (!answers[q.id] || !answers[q.id].trim());

                return (
                  <div
                    key={q.id}
                    className={`border rounded-2xl overflow-hidden ${
                      requiredUnanswered
                        ? isDarkMode
                          ? 'border-red-500 bg-red-900/20'
                          : 'border-red-300 bg-red-50'
                        : isDarkMode
                        ? 'border-gray-700'
                        : 'border-gray-200'
                    }`}
                  >
                    <button
                      onClick={() => toggleQuestion(idx)}
                      className={`w-full px-4 py-3 flex justify-between items-center text-left font-medium transition-colors ${
                        isDarkMode
                          ? 'bg-gray-800 hover:bg-gray-700 text-gray-100'
                          : 'bg-white hover:bg-gray-50 text-black'
                      }`}
                    >
                      <span>
                        {q.question_text}
                        {q.required && <span className="text-red-500 ml-1">*</span>}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          expandedQuestions.includes(idx) ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        expandedQuestions.includes(idx)
                          ? 'max-h-96 opacity-100'
                          : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div
                        className={`px-4 py-3 ${
                          isDarkMode
                            ? 'bg-gray-800 border-gray-700'
                            : 'bg-white border-gray-200'
                        } border-t`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          {q.required && (
                            <span
                              className={`text-sm ${
                                isDarkMode ? 'text-red-400' : 'text-red-500'
                              }`}
                            >
                              Required
                            </span>
                          )}
                          {answers[q.id]?.trim() && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                        </div>

                        {q.question_type === 'text' ? (
                          <textarea
                            value={answers[q.id] || ''}
                            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                              requiredUnanswered
                                ? isDarkMode
                                  ? 'border-red-500 bg-gray-700 text-gray-100'
                                  : 'border-red-300'
                                : isDarkMode
                                ? 'border-gray-600 bg-gray-700 text-gray-100'
                                : 'border-gray-300'
                            }`}
                            rows={3}
                            placeholder="Type your answer here..."
                          />
                        ) : q.question_type === 'multi-select' && q.options?.length ? (
                          <div className="space-y-2">
                            {q.options.map((opt, optIdx) => (
                              <label
                                key={optIdx}
                                className={`flex items-center space-x-3 p-2 rounded cursor-pointer transition-colors ${
                                  isDarkMode
                                    ? 'hover:bg-gray-700'
                                    : 'hover:bg-gray-50'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`question-${q.id}`}
                                  checked={answers[q.id] === opt.option_text}
                                  onChange={() => handleAnswerChange(q.id, opt.option_text)}
                                  className="text-blue-600"
                                />
                                <span
                                  className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}
                                >
                                  {opt.option_text}
                                </span>
                              </label>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}

              <button
                onClick={saveAnswers}
                disabled={isSavingAnswers}
                className="mt-4 w-full bg-blue-600 text-white py-3 rounded-2xl font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingAnswers ? 'Saving...' : 'Save Answers'}
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideDown { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes heartBeat { 0%{transform:scale(1)} 25%{transform:scale(1.3)} 50%{transform:scale(1)} 75%{transform:scale(1.3)} 100%{transform:scale(1)} }
        @keyframes bookmarkPop { 0%{transform:scale(1)} 50%{transform:scale(1.2)} 100%{transform:scale(1)} }
      `}</style>
    </div>
  );
};

export default Product;