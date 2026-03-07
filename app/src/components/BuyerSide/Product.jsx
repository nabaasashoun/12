import { useState, useEffect, useRef } from 'react'; 
import { useParams, useNavigate } from 'react-router-dom';
import {
  Minus, Plus, Star, Settings, ChevronLeft, ChevronDown,
  CheckCircle, User, Clock, Heart, Bookmark
} from 'lucide-react';
import { useLikeBookmark } from '../../utils/LikeBookmarkContext';
import { useCart } from '../../utils/CartContext';

const Product = () => {
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

  const { isLiked, isBookmarked, toggleLike, toggleBookmark } = useLikeBookmark();
  const { addToCart, cartItems } = useCart();

  const touchStartX = useRef(null);

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
            
            // Initialize answers for this product if they don't exist
            setQuestionAnswers(prev => {
              // Check if answers for this product already exist
              if (!prev[productId]) {
                console.log(`Initializing empty answers for product ${productId}`);
                const newAnswers = {
                  ...prev,
                  [productId]: {}
                };
                // Save to localStorage
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
          // Fallback to fetching all products and filtering
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

    // Load saved answers from localStorage
    const loadSavedAnswers = () => {
      const saved = localStorage.getItem('cartQuestionAnswers');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setQuestionAnswers(parsed);
          console.log('Loaded saved answers from localStorage:', parsed);
        } catch (e) {
          console.error('Error parsing saved answers:', e);
        }
      } else {
        // Initialize empty answers object if nothing in localStorage
        const initialAnswers = {};
        localStorage.setItem('cartQuestionAnswers', JSON.stringify(initialAnswers));
        setQuestionAnswers(initialAnswers);
      }
    };

    // Execute all fetch operations
    loadSavedAnswers();
    fetchProduct();
    fetchComments();
    fetchRelated();

    // Cleanup function to abort all fetch requests
    return () => {
      abortController.abort();
    };
  }, [productId, navigate]);
  
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
    localStorage.setItem('cartQuestionAnswers', JSON.stringify(questionAnswers));
    setCartMessage('Answers saved successfully!');
    setTimeout(() => setCartMessage(''), 3000);
  };

  const allRequiredAnswered = () => {
    if (!product?.questions?.length) return true;
    
    const required = product.questions.filter(q => q.required);
    if (!required.length) return true;
    
    const answers = questionAnswers[productId] || {};
    
    // Debug log to see what's being checked
    console.log('Checking required answers:', {
      productId,
      requiredQuestions: required.map(q => ({ id: q.id, text: q.question_text })),
      currentAnswers: answers
    });
    
    return required.every(q => {
      const answer = answers[q.id];
      
      // If no answer exists at all
      if (answer === undefined || answer === null) {
        console.log(`Question ${q.id} has no answer`);
        return false;
      }
      
      // For text inputs, check if it's not just empty/whitespace
      if (typeof answer === 'string') {
        const isValid = answer.trim() !== '';
        console.log(`Question ${q.id} text answer validation:`, { answer, isValid });
        return isValid;
      }
      
      // For multi-select/radio, check if answer exists and is not empty
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
    
    // Check if already in cart
    if (isInCart) {
      setCartMessage('Item already in cart!');
      setTimeout(() => setCartMessage(''), 3000);
      return;
    }
    
    // Validate quantity
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
      
      const success = await addToCart(
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
    if (quantity > product.min_order) {
      setQuantity(q => q - 1);
    }
  };

  const increaseQuantity = () => {
    if (quantity < product.max_order) {
      setQuantity(q => q + 1);
    }
  };

  const handleQuantityChange = (e) => {
    const val = parseInt(e.target.value);
    if (isNaN(val)) return;
    if (val < product.min_order) {
      setQuantity(product.min_order);
    } else if (val > product.max_order) {
      setQuantity(product.max_order);
    } else {
      setQuantity(val);
    }
  };

  const handleImageDoubleClick = (e) => {
    if (!zoom) {
      const rect = e.target.getBoundingClientRect();
      setZoomPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setZoom(true);
    } else {
      setZoom(false);
    }
  };

  const handleMouseMove = (e) => {
    if (zoom) {
      const rect = e.target.getBoundingClientRect();
      setZoomPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    if (!touchStartX.current) return;
    const currentX = e.touches[0].clientX;
    const diff = touchStartX.current - currentX;
    if (Math.abs(diff) > 10) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e) => {
    if (!touchStartX.current) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      const images = product?.images?.length
        ? product.images
        : product?.product_photo
        ? [product.product_photo]
        : [];
      if (diff > 0) {
        setCurrentImageIndex(prev => Math.min(prev + 1, images.length - 1));
      } else {
        setCurrentImageIndex(prev => Math.max(prev - 1, 0));
      }
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
    return <div className="text-red-600 p-4">Error: {error}</div>;
  }
  if (loading || !product) {
    return <div className="text-black p-4">Loading...</div>;
  }

  const images = product.images?.length
    ? product.images
    : product.product_photo
    ? [product.product_photo]
    : [];

  const averageRating = Number(product.rating_magnitude) || 0;
  const totalReviews = Number(product.rating_number) || 0;
  const answers = questionAnswers[productId] || {};
  const productIdNum = parseInt(productId);

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-4xl mx-auto text-black">
      {/* Cart Message Toast */}
      {cartMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-slideDown">
          <div className={`px-6 py-3 rounded-full shadow-lg flex items-center gap-2 ${
            cartMessage.includes('Failed') || cartMessage.includes('Please')
              ? 'bg-red-600 text-white'
              : 'bg-green-600 text-white'
          }`}>
            <span className="font-medium">{cartMessage}</span>
          </div>
        </div>
      )}

      <div className="fixed top-0 left-0 right-0 z-20 bg-white py-2 px-3 sm:px-4 md:px-6 border-b">
        <div className="flex justify-between items-center">
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 flex items-center font-medium"
          >
            <ChevronLeft className="w-5 h-5 mr-1" /> Back
          </button>
          <div className="flex-1 max-w-md mx-4" /> 
          <div className="flex gap-3">
            <Settings
              className="w-5 h-5 text-gray-700 cursor-pointer"
              onClick={() => navigate('/settings')}
            />
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div className="mt-10 mb-4">
          <h2 className="text-[15px] font-bold text-black mb-2">Related Products</h2>
          <div className="flex overflow-x-auto space-x-4 pb-2 scrollbar-hide">
            {relatedProducts.map((rp) => (
              <div
                key={rp.id}
                onClick={() => handleRelatedClick(rp.id)}
                className="flex-shrink-0 w-20 h-20 bg-white border rounded-lg shadow-sm hover:shadow-md cursor-pointer"
              >
                <img
                  src={rp.product_photo || 'https://via.placeholder.com/150'}
                  alt={rp.name}
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/150';
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="relative">
        <div
          className="overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <img
            src={images[currentImageIndex]}
            alt={product.name}
            className={`w-full h-64 object-cover rounded-lg transition-all duration-300 ${
              zoom ? 'scale-150' : ''
            }`}
            style={
              zoom
                ? { transformOrigin: `${zoomPos.x}px ${zoomPos.y}px` }
                : {}
            }
            onDoubleClick={handleImageDoubleClick}
            onMouseMove={handleMouseMove}
          />
        </div>
        {images.length > 1 && (
          <>
            <div className="flex justify-center mt-2 space-x-2">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    idx === currentImageIndex ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                  aria-label={`Go to image ${idx + 1}`}
                />
              ))}
            </div>
           
          </>
        )}
      </div>

      
      <p className="text-[32px] font-bold mt-4">{product.name}</p>
      <p className="text-gray-700">{product.description}</p>
      <p className="text-lg font-bold mt-2">{formatCurrency(product.unit_price)}</p>

      <div className="flex items-center mt-2">
        <div className="flex mr-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-4 h-4 ${
                star <= averageRating
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <span className="text-sm font-medium">{averageRating.toFixed(1)}</span>
        <span className="text-sm text-gray-500 ml-1">
          ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
        </span>
      </div>

      <p className="mt-2">Stock: {product.stock_quantity}</p>
      <p>
        Min Order: {product.min_order} | Max Order: {product.max_order}
      </p>

      <div className="flex gap-3 mt-4">
        <button
          onClick={handleToggleLike}
          className={`py-2 px-4 rounded transition flex items-center gap-2 ${
            isLiked(productIdNum)
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }`}
          style={{
            transform: animatingLike ? 'scale(1.1)' : 'scale(1)',
            animation: animatingLike ? 'heartBeat 0.6s ease-in-out' : 'none'
          }}
        >
          <Heart className="w-4 h-4" fill={isLiked(productIdNum) ? 'white' : 'none'} />
          <span>{isLiked(productIdNum) ? 'Liked' : 'Like'} ({product.like_count || 0})</span>
        </button>

        <button
          onClick={handleToggleFavorite}
          className={`py-2 px-4 rounded transition flex items-center gap-2 ${
            isBookmarked(productIdNum)
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }`}
          style={{
            transform: animatingFavorite ? 'scale(1.1)' : 'scale(1)',
            animation: animatingFavorite ? 'bookmarkPop 0.5s ease-out' : 'none'
          }}
        >
          <Bookmark className="w-4 h-4" fill={isBookmarked(productIdNum) ? 'white' : 'none'} />
          <span>{isBookmarked(productIdNum) ? 'Bookmarked' : 'Bookmark'}</span>
        </button>
      </div>

      <div className="flex items-center mt-4">
        <button
          onClick={decreaseQuantity}
          disabled={quantity <= product.min_order}
          className={`p-2 rounded ${
            quantity <= product.min_order
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          <Minus className="w-4 h-4" />
        </button>

        <input
          type="number"
          value={quantity}
          onChange={handleQuantityChange}
          min={product.min_order}
          max={product.max_order}
          className="mx-2 w-16 text-center border rounded py-1"
        />

        <button
          onClick={increaseQuantity}
          disabled={quantity >= product.max_order}
          className={`p-2 rounded ${
            quantity >= product.max_order
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          <Plus className="w-4 h-4" />
        </button>

        <button
          onClick={handleAddToCart}
          disabled={isAddingToCart || isInCart}
          className={`ml-4 py-2 px-4 rounded ${
            isAddingToCart || isInCart
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
          } text-white`}
        >
          {isAddingToCart ? 'Adding...' : isInCart ? 'In Cart' : 'Add to Cart'}
        </button>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-bold">Customer Reviews</h2>
        {comments.length === 0 ? (
          <div className="text-center py-8 border rounded-lg bg-gray-50">
            <p className="text-gray-600">No reviews yet. Be the first to review!</p>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            {comments.slice(0, 2).map((comment) => (
              <div key={comment.id} className="border rounded-lg p-4 bg-white shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                      {comment.user_photo ? (
                        <img
                          src={comment.user_photo}
                          alt={comment.user_name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-black">{comment.user_name}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <div className="flex mr-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3 h-3 ${
                                star <= comment.rating
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <Clock className="w-3 h-3 mr-1" />
                        <span>{formatDate(comment.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 mt-2">{comment.comment}</p>
              </div>
            ))}
            {totalReviews > 2 && (
              <button
                onClick={() => navigate(`/product/${productId}/comments`)}
                className="text-blue-600 text-sm font-medium hover:underline mt-2"
              >
                See all {totalReviews} reviews →
              </button>
            )}
          </div>
        )}
      </div>

      {product.questions?.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => setShowQuestions(!showQuestions)}
            className="w-full bg-gray-200 py-3 px-4 rounded flex justify-between items-center font-medium"
          >
            Seller Questions
            <span className="flex items-center">
              {showQuestions ? 'Show less' : 'Show more'}
              <ChevronDown
                className={`w-4 h-4 ml-2 transition-transform ${
                  showQuestions ? 'rotate-180' : ''
                }`}
              />
            </span>
          </button>

          {showQuestions && (
            <div className="mt-2 space-y-2 p-4 bg-gray-50 rounded-lg">
              {product.questions.map((q, idx) => {
                const requiredUnanswered = q.required && (!answers[q.id] || !answers[q.id].trim());
                
                return (
                  <div key={q.id} className={`border rounded-lg overflow-hidden ${
                    requiredUnanswered ? 'border-red-300 bg-red-50' : 'border-gray-200'
                  }`}>
                    <button
                      onClick={() => toggleQuestion(idx)}
                      className="w-full px-4 py-3 bg-white flex justify-between items-center text-left font-medium hover:bg-gray-50"
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
                      <div className="px-4 py-3 bg-white border-t border-gray-200">
                        <div className="flex justify-between items-start mb-3">
                          {q.required && (
                            <span className="text-sm text-red-500">Required</span>
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
                              requiredUnanswered ? 'border-red-300' : 'border-gray-300'
                            }`}
                            rows={3}
                            placeholder="Type your answer here..."
                          />
                        ) : q.question_type === 'multi-select' && q.options?.length ? (
                          <div className="space-y-2">
                            {q.options.map((opt, optIdx) => (
                              <label
                                key={optIdx}
                                className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                              >
                                <input
                                  type="radio"
                                  name={`question-${q.id}`}
                                  checked={answers[q.id] === opt.option_text}
                                  onChange={() => handleAnswerChange(q.id, opt.option_text)}
                                  className="text-blue-600"
                                />
                                <span className="text-gray-700">{opt.option_text}</span>
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
                className="mt-4 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
              >
                Save Answers
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideDown {
          from { transform: translateY(-20px); opacity: 0; }
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
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default Product;