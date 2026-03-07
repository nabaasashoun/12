import { useState, useEffect } from 'react';
import { Card, CardContent } from './card';
import { 
  ShoppingCart, Trash2, Plus, Minus, ArrowLeft, AlertCircle, 
  Package, CreditCard, Truck, X, HelpCircle, CheckCircle, Save, Loader2 
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from  '../../utils/api';
import styled from 'styled-components';
import Loader from '../UISkeleton/Loader';  

const CustomCheckbox = ({ checked, onChange, id, value }) => {
  return (
    <StyledWrapper>
      <div className="checkbox-wrapper-12">
        <div className="cbx">
          <input
            type="checkbox"
            id={id}
            checked={checked}
            onChange={(e) => onChange(e.target.checked ? value : '')}
            value={value}
          />
          <label htmlFor={id} />
          <svg fill="none" viewBox="0 0 15 14" height={14} width={15}>
            <path d="M2 8.36364L6.23077 12L13 2" />
          </svg>
        </div>
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="goo-12">
              <feGaussianBlur result="blur" stdDeviation={4} in="SourceGraphic" />
              <feColorMatrix result="goo-12" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -7" mode="matrix" in="blur" />
              <feBlend in2="goo-12" in="SourceGraphic" />
            </filter>
          </defs>
        </svg>
      </div>
    </StyledWrapper>
  );
};


const StyledWrapper = styled.div`
  .checkbox-wrapper-12 {
    position: relative;
  }

  .checkbox-wrapper-12 > svg {
    position: absolute;
    top: -130%;
    left: -170%;
    width: 110px;
    pointer-events: none;
  }

  .checkbox-wrapper-12 * {
    box-sizing: border-box;
  }

  .checkbox-wrapper-12 input[type="checkbox"] {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    -webkit-tap-highlight-color: transparent;
    cursor: pointer;
    margin: 0;
  }

  .checkbox-wrapper-12 input[type="checkbox"]:focus {
    outline: 0;
  }

  .checkbox-wrapper-12 .cbx {
    width: 24px;
    height: 24px;
    top: calc(100px - 12px);
    left: calc(100px - 12px);
  }

  .checkbox-wrapper-12 .cbx input {
    position: absolute;
    top: 0;
    left: 0;
    width: 24px;
    height: 24px;
    border: 2px solid #bfbfc0;
    border-radius: 50%;
  }

  .checkbox-wrapper-12 .cbx label {
    width: 24px;
    height: 24px;
    background: none;
    border-radius: 50%;
    position: absolute;
    top: 0;
    left: 0;
    transform: trasnlate3d(0, 0, 0);
    pointer-events: none;
  }

  .checkbox-wrapper-12 .cbx svg {
    position: absolute;
    top: 5px;
    left: 4px;
    z-index: 1;
    pointer-events: none;
  }

  .checkbox-wrapper-12 .cbx svg path {
    stroke: #fff;
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-dasharray: 19;
    stroke-dashoffset: 19;
    transition: stroke-dashoffset 0.3s ease;
    transition-delay: 0.2s;
  }

  .checkbox-wrapper-12 .cbx input:checked + label {
    animation: splash-12 0.6s ease forwards;
  }

  .checkbox-wrapper-12 .cbx input:checked + label + svg path {
    stroke-dashoffset: 0;
  }

  @keyframes splash-12 {
    40% {
      background: #866efb;
      box-shadow: 0 -18px 0 -8px #866efb, 16px -8px 0 -8px #866efb, 16px 8px 0 -8px #866efb, 0 18px 0 -8px #866efb, -16px 8px 0 -8px #866efb, -16px -8px 0 -8px #866efb;
    }
    100% {
      background: #866efb;
      box-shadow: 0 -36px 0 -10px transparent, 32px -16px 0 -10px transparent, 32px 16px 0 -10px transparent, 0 36px 0 -10px transparent, -32px 16px 0 -10px transparent, -32px -16px 0 -10px transparent;
    }
  }
`;

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [cartTotal, setCartTotal] = useState(0);
  const [questionAnswers, setQuestionAnswers] = useState({});
  const [openQuestionModal, setOpenQuestionModal] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const navigate = useNavigate();

  const formatCurrency = (amount) => {
    return `UGX ${parseFloat(amount).toLocaleString('en-UG')}`;
  };

  const getProductImage = (product) => {
    if (product?.product_photo) {
      if (typeof product.product_photo === 'string') {
        if (product.product_photo.startsWith('http')) {
          return product.product_photo;
        } else {
          return `http://localhost:8000${product.product_photo}`;
        }
      } else if (typeof product.product_photo === 'object' && product.product_photo.url) {
        if (product.product_photo.url.startsWith('http')) {
          return product.product_photo.url;
        } else {
          return `http://localhost:8000${product.product_photo.url}`;
        }
      }
    }
    return '/sample1.jpg';
  };

  const triggerCartUpdate = () => {
    window.dispatchEvent(new CustomEvent('cartUpdated'));
    localStorage.setItem('cartUpdated', Date.now().toString());
  };

  const fetchCartItems = async () => {
    try {
      setLoading(true);
      const result = await api.getCart();
      
      if (result.error) {
        console.error('Failed to fetch cart items:', result.error);
        setError(result.error);
        if (result.status === 401) {
          setError('Please login to view your cart');
          setTimeout(() => navigate('/login'), 2000);
        }
      } else if (result.data) {
        const items = result.data.items || (Array.isArray(result.data) ? result.data : []);
        setCartItems(items);
        
        const total = items.reduce((sum, item) => {
          const subtotal = item.subtotal || (item.quantity * (item.product?.unit_price || 0));
          return sum + parseFloat(subtotal);
        }, 0);
        setCartTotal(total);
        
        triggerCartUpdate();
        
        const savedAnswers = localStorage.getItem('cartQuestionAnswers');
        let mergedAnswers = savedAnswers ? JSON.parse(savedAnswers) : {};
        
        items.forEach(item => {
          if (item.answers && Object.keys(item.answers).length > 0) {
            mergedAnswers[item.product.id] = item.answers;
          }
        });
        
        setQuestionAnswers(mergedAnswers);
        localStorage.setItem('cartQuestionAnswers', JSON.stringify(mergedAnswers));
      }
    } catch (err) {
      console.error('Error fetching cart items:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCartItems();
  }, []);

  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }
    try {
      const result = await api.updateCartItem(productId, newQuantity);
      if (result.error) {
        setNotification({ type: 'error', message: 'Failed to update quantity. Please try again.' });
        setTimeout(() => setNotification(null), 3000);
        return;
      }
      if (result.data) {
        setCartItems(prev =>
          prev.map(item =>
            item.product.id === productId
              ? { ...item, quantity: result.data.quantity, subtotal: result.data.subtotal }
              : item
          )
        );
        const updatedItems = cartItems.map(item =>
          item.product.id === productId
            ? { ...item, quantity: result.data.quantity, subtotal: result.data.subtotal }
            : item
        );
        const newTotal = updatedItems.reduce((sum, item) => {
          const subtotal = item.subtotal || (item.quantity * (item.product?.unit_price || 0));
          return sum + parseFloat(subtotal);
        }, 0);
        setCartTotal(newTotal);
        triggerCartUpdate();
      }
    } catch (err) {
      setNotification({ type: 'error', message: 'Network error. Please check your connection.' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const result = await api.removeFromCart(productId);
      if (result.error) {
        setNotification({ type: 'error', message: 'Failed to remove item. Please try again.' });
        setTimeout(() => setNotification(null), 3000);
        return;
      }
      setCartItems(prev => prev.filter(item => item.product.id !== productId));
      const updatedItems = cartItems.filter(item => item.product.id !== productId);
      const newTotal = updatedItems.reduce((sum, item) => {
        const subtotal = item.subtotal || (item.quantity * (item.product?.unit_price || 0));
        return sum + parseFloat(subtotal);
      }, 0);
      setCartTotal(newTotal);
      const updatedAnswers = { ...questionAnswers };
      delete updatedAnswers[productId];
      setQuestionAnswers(updatedAnswers);
      localStorage.setItem('cartQuestionAnswers', JSON.stringify(updatedAnswers));
      triggerCartUpdate();
      setNotification({ type: 'success', message: 'Item removed from cart!' });
      setTimeout(() => setNotification(null), 2000);
    } catch (err) {
      setNotification({ type: 'error', message: 'Network error. Please check your connection.' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const clearCart = async () => {
    try {
      const result = await api.clearCart();
      if (result.error) {
        setNotification({ type: 'error', message: 'Failed to clear cart. Please try again.' });
        setTimeout(() => setNotification(null), 3000);
        return;
      }
      setCartItems([]);
      setCartTotal(0);
      setQuestionAnswers({});
      localStorage.removeItem('cartQuestionAnswers');
      triggerCartUpdate();
      setNotification({ type: 'success', message: 'Cart cleared successfully!' });
      setTimeout(() => setNotification(null), 2000);
    } catch (err) {
      setNotification({ type: 'error', message: 'Network error. Please check your connection.' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const areAllRequiredQuestionsAnswered = (product) => {
    const productQuestions = product?.questions || [];
    const requiredQuestions = productQuestions.filter(q => q.required);
    if (requiredQuestions.length === 0) return true;
    const answers = questionAnswers[product.id] || {};
    return requiredQuestions.every(question => {
      const answer = answers[question.id];
      return answer && answer.trim() !== '';
    });
  };

  const hasUnansweredRequiredQuestions = () => {
    return cartItems.some(item => !areAllRequiredQuestionsAnswered(item.product));
  };

  const handleAnswerChange = (productId, questionId, value) => {
    setQuestionAnswers(prev => {
      const newAnswers = {
        ...prev,
        [productId]: {
          ...prev[productId],
          [questionId]: value
        }
      };
      localStorage.setItem('cartQuestionAnswers', JSON.stringify(newAnswers));
      return newAnswers;
    });
  };

  const saveAnswersToBackend = async (productId, answers) => {
    const result = await api.updateCartItem(productId, null, answers);
    if (result.error) throw new Error(result.error);
    return result.data;
  };

  const saveAnswers = async (productId) => {
    try {
      const answers = questionAnswers[productId] || {};
      await saveAnswersToBackend(productId, answers);
      setOpenQuestionModal(null);
      setNotification({ type: 'success', message: 'Answers saved successfully!' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error saving answers:', error);
      setNotification({ type: 'error', message: 'Failed to save answers. Please try again.' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const getProductQuestions = (product) => {
    return product?.questions || [];
  };

  const handleCheckout = async () => {
    if (hasUnansweredRequiredQuestions()) {
      setNotification({
        type: 'error',
        message: 'Please answer all required questions before proceeding to checkout.'
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    setCheckoutLoading(true);
    try {
      console.log('Step 1: Creating order from cart...');
      const orderResponse = await api.createOrderFromCart();
      if (orderResponse.error) {
        throw new Error('Order creation failed: ' + orderResponse.error);
      }
      const orderId = orderResponse.data.order_id;
      console.log('Order created successfully with ID:', orderId);

      setQuestionAnswers({});
      localStorage.removeItem('cartQuestionAnswers');

      console.log('Step 2: Initiating payment for order', orderId);
      const paymentResponse = await api.initiatePayment(orderId);
      if (paymentResponse.error) {
        throw new Error('Payment initiation failed: ' + paymentResponse.error);
      }

      const redirectUrl = paymentResponse.data.redirect_url;
      if (!redirectUrl) {
        throw new Error('No redirect URL received from payment initiation');
      }

      console.log('Redirecting to Pesapal:', redirectUrl);
      window.location.href = redirectUrl;
    } catch (error) {
      console.error('Checkout error:', error);
      setNotification({ type: 'error', message: error.message });
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="text-center py-12">
          <Loader />
        </div>
      </div>
    );
  }



  if (error) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
          <p className="text-red-700">{error}</p>
        </div>
        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-2">
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <p className="text-[23px] font-bold text-black">Shopping Cart</p>
        </div>
        <p className="text-gray-600">
          {cartItems.length === 0 
            ? 'Your cart is empty. Start adding products!'
            : `You have ${cartItems.length} item${cartItems.length !== 1 ? 's' : ''} in your cart`
          }
        </p>
      </div>

      {notification && (
        <div className={`mb-4 p-4 rounded-lg ${notification.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          <div className="flex items-center">
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 mr-3 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 mr-3 text-red-500" />
            )}
            <p>{notification.message}</p>
          </div>
        </div>
      )}

      {cartItems.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold text-black">Cart Items</h2>
              <button
                onClick={clearCart}
                className="text-sm text-red-600 hover:text-red-700 flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear All
              </button>
            </div>

            <div className="space-y-4">
              {cartItems.map((item) => {
                const productImage = getProductImage(item.product);
                const hasQuestions = getProductQuestions(item.product).length > 0;
                const allRequiredAnswered = areAllRequiredQuestionsAnswered(item.product);
                
                return (
                  <Card key={item.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex">
                        {/* Product Image */}
                        <div className="w-24 h-24 flex-shrink-0 mr-4">
                          <img
                            src={productImage}
                            alt={item.product.name}
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              console.log('Image failed to load:', productImage);
                              e.target.src = '/sample1.jpg';
                            }}
                          />
                        </div>

                        {/* Product Details */}
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <div>
                              <Link 
                                to={`/product/${item.product.id}`}
                                className="font-semibold text-black hover:underline"
                              >
                                {item.product.name}
                              </Link>
                              <p className="text-sm text-gray-600 mt-1">
                                {formatCurrency(item.product.unit_price)}
                              </p>
                              <p className="text-sm text-green-600 mt-1">
                                Subtotal: {formatCurrency(item.subtotal || (item.quantity * item.product.unit_price))}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              {hasQuestions && (
                                <button
                                  onClick={() => setOpenQuestionModal(item.product.id)}
                                  className={`p-2 rounded-full hover:opacity-80 transition-opacity ${
                                    allRequiredAnswered 
                                      ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                                      : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                  }`}
                                  title={allRequiredAnswered ? "All questions answered" : "Answer seller questions"}
                                >
                                  {allRequiredAnswered ? (
                                    <CheckCircle className="w-5 h-5" />
                                  ) : (
                                    <HelpCircle className="w-5 h-5" />
                                  )}
                                </button>
                              )}
                              <button
                                onClick={() => removeFromCart(item.product.id)}
                                className="text-gray-400 hover:text-red-500 p-1"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                className="p-1 rounded-full border border-gray-300 hover:bg-gray-100"
                              >
                                <Minus className="text-black w-4 h-4" />
                              </button>
                              <span className="w-12 text-black text-center font-medium">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                className="p-1 rounded-full border border-gray-300 hover:bg-gray-100"
                              >
                                <Plus className="text-black w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-6">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-6 text-black">Order Summary</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-black">{formatCurrency(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium text-black">{formatCurrency(0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium text-black">{formatCurrency(0)}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between">
                    <span className="font-semibold text-lg text-black">Total</span>
                    <span className="font-bold text-xl text-blue-600">
                      {formatCurrency(cartTotal)}
                    </span>
                  </div>
                </div>

                {hasUnansweredRequiredQuestions() && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start">
                      <AlertCircle className="w-5 h-5 text-amber-500 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm text-amber-800 font-medium">
                          Answer Required Questions
                        </p>
                        <p className="text-xs text-amber-700 mt-1">
                          Please answer all required seller questions before checkout.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleCheckout}
                  disabled={hasUnansweredRequiredQuestions() || checkoutLoading}
                  className={`w-full py-3 rounded-lg font-semibold transition-colors mb-4 flex items-center justify-center ${
                    hasUnansweredRequiredQuestions() || checkoutLoading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {checkoutLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : hasUnansweredRequiredQuestions() ? (
                    'Answer Questions to Checkout'
                  ) : (
                    'Proceed to Checkout'
                  )}
                </button>

                <div className="text-center">
                  <Link
                    to="/"
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Continue Shopping
                  </Link>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <CreditCard className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-black">Secure Payment</p>
                        <p className="text-xs text-gray-600">100% secure payment</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <Truck className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-black">Easy Returns</p>
                        <p className="text-xs text-gray-600">30-day return policy</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Your cart is empty
          </h3>
          <p className="text-gray-600 mb-6">
            Add some products to your cart and they will appear here!
          </p>
          <div className="space-x-4">
            <Link
              to="/"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Products
            </Link>
            <Link
              to="/account"
              className="inline-flex items-center px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Go to Account
            </Link>
          </div>
        </div>
      )}

      {/* Questions Modal */}
      {openQuestionModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setOpenQuestionModal(null)}
        >
          <div
            className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg text-black">Seller Questions</h3>
                <button
                  onClick={() => setOpenQuestionModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-4">
              {(() => {
                const cartItem = cartItems.find(item => item.product.id === openQuestionModal);
                if (!cartItem) return null;
                
                const product = cartItem.product;
                const questions = getProductQuestions(product);
                const answers = questionAnswers[product.id] || {};
                
                return (
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <img
                        src={getProductImage(product)}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded-lg"
                        onError={(e) => e.target.src = '/sample1.jpg'}
                      />
                      <div>
                        <p className="font-medium text-black">{product.name}</p>
                        <p className="text-sm text-gray-600">Qty: {cartItem.quantity}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {questions.map((q) => (
                        <div key={q.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="font-medium text-black">{q.question_text}</p>
                              {q.required && (
                                <span className="text-xs text-red-500 font-medium mt-1">Required</span>
                              )}
                            </div>
                            {answers[q.id] && answers[q.id].trim() !== '' && (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            )}
                          </div>
                          
                          {q.question_type === 'text' ? (
                            <textarea
                              value={answers[q.id] || ''}
                              onChange={(e) => handleAnswerChange(product.id, q.id, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              rows={3}
                              placeholder="Type your answer here..."
                            />
                          ) : q.question_type === 'multi-select' && q.options ? (
                            <div className="space-y-2">
                              {q.options.map((option, index) => {
                                const optionId = `q-${q.id}-opt-${index}`;
                                const isChecked = answers[q.id] === option.option_text;
                                return (
                                  <label key={index} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                    <CustomCheckbox
                                      id={optionId}
                                      checked={isChecked}
                                      onChange={(val) => handleAnswerChange(product.id, q.id, val)}
                                      value={option.option_text}
                                    />
                                    <span className="text-gray-700">{option.option_text}</span>
                                  </label>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => saveAnswers(product.id)}
                      className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                    >
                      <Save className="w-5 h-5 mr-2" />
                      Save Answers
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;