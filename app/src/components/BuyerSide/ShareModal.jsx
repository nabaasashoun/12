// ShareModal.jsx - Fully updated with product image in share links
import React, { useState, useEffect } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Facebook, 
  Twitter, 
  MessageCircle,
  Link2, 
  Check,
  Send,
  Instagram
} from 'lucide-react';
import { getProductShareLink, copyToClipboard } from '../../utils/shareUtils';

// Custom WhatsApp SVG icon
const WhatsAppIcon = ({ className }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const ShareModal = ({ isOpen, onClose, product, isDarkMode }) => {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [productImage, setProductImage] = useState('');

  useEffect(() => {
    if (product?.id) {
      // Get the product share link with image
      const url = getProductShareLink(product.id);
      setShareUrl(url);
      
      // Get the full URL of the product image
      const image = product.images && product.images.length > 0 
        ? product.images[0] 
        : product.product_photo || '/placeholder-product.jpg';
      
      // Ensure the image URL is absolute for social platforms
      const baseUrl = window.location.origin;
      const absoluteImageUrl = image.startsWith('http') ? image : `${baseUrl}${image}`;
      setProductImage(absoluteImageUrl);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  // Get the full product URL with all necessary parameters for social sharing
  const getFullProductUrl = () => {
    const baseUrl = window.location.origin;
    const productPath = `/product/${product.id}`;
    
    // Build URL with query parameters for social platforms
    const params = new URLSearchParams();
    if (productImage) {
      params.append('image', productImage);
    }
    if (product.product) {
      params.append('title', product.product);
    }
    if (product.price) {
      params.append('price', product.price);
    }
    
    const queryString = params.toString();
    return `${baseUrl}${productPath}${queryString ? '?' + queryString : ''}`;
  };

  // Generate the full share URL with image for social media
  const getShareableUrl = (platform = '') => {
    const baseUrl = window.location.origin;
    const productPath = `/product/${product.id}`;
    
    // For Facebook, Twitter, LinkedIn - use Open Graph meta tags
    // The actual image will be picked up from the page's meta tags
    // We pass the image as a URL parameter that the page can use
    const params = new URLSearchParams();
    
    // Add image as a parameter for the page to use in meta tags
    if (productImage) {
      params.append('share_image', productImage);
    }
    if (product.product) {
      params.append('share_title', product.product);
    }
    if (product.price) {
      params.append('share_price', product.price);
    }
    if (product.sellerName) {
      params.append('share_seller', product.sellerName);
    }
    
    const queryString = params.toString();
    return `${baseUrl}${productPath}${queryString ? '?' + queryString : ''}`;
  };

  // Get a clean image URL for sharing
  const getShareImageUrl = () => {
    // Return the absolute URL of the product image
    if (productImage) {
      return productImage;
    }
    // Fallback to a default image
    return `${window.location.origin}/placeholder-product.jpg`;
  };

  // Get the full share URL with image for direct sharing
  const getFullShareUrl = () => {
    return getShareableUrl();
  };

  const handleCopyLink = async () => {
    const linkToCopy = getFullShareUrl();
    await copyToClipboard(
      linkToCopy,
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => {
        // Fallback
        navigator.clipboard?.writeText(linkToCopy).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }
    );
  };

  const shareToPlatform = (platform) => {
    const url = encodeURIComponent(getFullShareUrl());
    const title = encodeURIComponent(product.product || 'Product');
    const price = product.price || '';
    const text = encodeURIComponent(`Check out this amazing product: ${product.product}${price ? ' - ' + price : ''}`);
    const imageUrl = encodeURIComponent(getShareImageUrl());
    
    let shareLink = '';
    switch (platform) {
      case 'facebook':
        // Facebook uses Open Graph meta tags, just share the URL
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`;
        break;
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
        break;
      case 'whatsapp':
        // WhatsApp will show the image preview when the link is shared
        // We include the image URL in the text for platforms that don't auto-preview
        shareLink = `https://api.whatsapp.com/send?text=${text}%0A${url}%0A%0A🖼️ Image: ${imageUrl}`;
        break;
      case 'email':
        shareLink = `mailto:?subject=${title}&body=${text}%0A%0A${url}%0A%0A🖼️ Product Image: ${imageUrl}`;
        break;
      case 'telegram':
        // Telegram will show the image preview when the link is shared
        shareLink = `https://t.me/share/url?url=${url}&text=${text}`;
        break;
      case 'instagram':
        // Instagram doesn't support direct sharing, copy link instead
        handleCopyLink();
        return;
      default:
        return;
    }
    
    // Open the share link in a new window
    if (shareLink) {
      window.open(shareLink, '_blank', 'width=600,height=500');
    }
  };

  // Get display image
  const displayImage = product.images && product.images.length > 0 
    ? product.images[0] 
    : product.product_photo || '/placeholder-product.jpg';

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className={`rounded-2xl max-w-md w-full overflow-hidden shadow-2xl ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                Share Product
              </h3>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Share this product with your friends
              </p>
            </div>
            <button
              onClick={onClose}
              className={`p-1 rounded-full transition-colors ${
                isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <X className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </button>
          </div>
        </div>

        {/* Product Preview with Image - Enhanced */}
        <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-4">
            {/* Product Image with better display */}
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0 shadow-sm">
              <img 
                src={displayImage} 
                alt={product.product}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = '/placeholder-product.jpg';
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-medium text-sm truncate ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                {product.product}
              </p>
              <p className={`text-sm font-semibold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                {product.price}
              </p>
              <p className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                by {product.sellerName || 'Seller'}
              </p>
              {/* Preview of what will be shared */}
              <div className={`mt-1 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} flex items-center gap-1`}>
                <span>🔗</span>
                <span className="truncate">{getFullShareUrl()}</span>
              </div>
              {/* Show image that will be shared */}
            </div>
          </div>
        </div>

        {/* Share Options */}
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => shareToPlatform('facebook')}
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-[#1877F2]/10 hover:bg-[#1877F2]/20 transition-all transform hover:scale-105 hover:-translate-y-0.5 active:scale-95"
            >
              <Facebook className="w-6 h-6 text-[#1877F2]" />
              <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Facebook</span>
            </button>
            <button
              onClick={() => shareToPlatform('twitter')}
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-black/10 hover:bg-black/20 transition-all transform hover:scale-105 hover:-translate-y-0.5 active:scale-95"
            >
              <Twitter className="w-6 h-6 text-black dark:text-white" />
              <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Twitter</span>
            </button>
            <button
              onClick={() => shareToPlatform('whatsapp')}
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 transition-all transform hover:scale-105 hover:-translate-y-0.5 active:scale-95"
            >
              <WhatsAppIcon className="w-6 h-6 text-[#25D366]" />
              <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>WhatsApp</span>
            </button>
            <button
              onClick={() => shareToPlatform('telegram')}
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-[#0088cc]/10 hover:bg-[#0088cc]/20 transition-all transform hover:scale-105 hover:-translate-y-0.5 active:scale-95"
            >
              <Send className="w-6 h-6 text-[#0088cc]" />
              <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Telegram</span>
            </button>
          </div>

          {/* Copy Link Section */}
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={getFullShareUrl()}
                readOnly
                className={`w-full px-3 py-2 rounded-lg text-sm ${
                  isDarkMode 
                    ? 'bg-gray-700 text-gray-200 border-gray-600' 
                    : 'bg-gray-50 text-gray-800 border-gray-200'
                } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>
            <button
              onClick={handleCopyLink}
              className={`p-2 rounded-lg transition-all transform hover:scale-105 active:scale-95 ${
                copied
                  ? 'bg-green-500 text-white'
                  : isDarkMode
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {copied ? (
                <Check className="w-5 h-5" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </button>
          </div>

          {copied && (
            <p className="text-sm text-green-500 animate-slideDown text-center">
              ✓ Link copied to clipboard!
            </p>
          )}
        </div>

        {/* Footer */}
        <div className={`p-3 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <button
            onClick={onClose}
            className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
              isDarkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;