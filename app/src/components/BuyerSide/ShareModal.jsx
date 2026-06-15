// src/components/BuyerSide/ShareModal.jsx
import { useState, useEffect } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Share2,
  Facebook,
  Twitter,
  Instagram,
  Send,
  Mail,
  MessageCircle,
  Linkedin,
  Smartphone
} from 'lucide-react';
import { 
  getProductShareLink, 
  copyToClipboard, 
  shareUsingWebShare,
  shareToPlatform 
} from '../../utils/shareUtils';

const ShareModal = ({ isOpen, onClose, product, isDarkMode = false }) => {
  const [copied, setCopied] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [showToast, setShowToast] = useState('');

  useEffect(() => {
    if (isOpen && product) {
      setShareLink(getProductShareLink(product.id));
      setCopied(false);
    }
  }, [isOpen, product]);

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(''), 2000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const handleCopyLink = async () => {
    const success = await copyToClipboard(
      shareLink,
      () => {
        setCopied(true);
        setShowToast('Link copied to clipboard! ✓');
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      },
      (error) => {
        setShowToast('Failed to copy link');
      }
    );
  };

  const handleNativeShare = async () => {
    const title = product.product || product.name || 'Check out this product';
    const text = `Check out ${title} on TendSync! Price: ${product.price || 'Check price'}`;
    
    const success = await shareUsingWebShare(title, text, shareLink);
    if (!success) {
      setShowToast('Native sharing not supported. Try copying the link instead.');
    } else {
      onClose();
    }
  };

  const handleShareToPlatform = (platform) => {
    const title = product.product || product.name || 'Check out this product';
    const text = `Check out ${title} on TendSync!`;
    shareToPlatform(platform, shareLink, title, text);
    setTimeout(() => onClose(), 500);
  };

  if (!isOpen) return null;

  const shareOptions = [
    { id: 'whatsapp', name: 'WhatsApp', icon: <MessageCircle size={24} />, color: 'bg-green-500', action: () => handleShareToPlatform('whatsapp') },
    { id: 'facebook', name: 'Facebook', icon: <Facebook size={24} />, color: 'bg-blue-600', action: () => handleShareToPlatform('facebook') },
    { id: 'twitter', name: 'Twitter', icon: <Twitter size={24} />, color: 'bg-sky-500', action: () => handleShareToPlatform('twitter') },
    { id: 'telegram', name: 'Telegram', icon: <Send size={24} />, color: 'bg-blue-500', action: () => handleShareToPlatform('telegram') },
    { id: 'instagram', name: 'Instagram', icon: <Instagram size={24} />, color: 'bg-pink-600', action: () => handleShareToPlatform('instagram') },
    { id: 'linkedin', name: 'LinkedIn', icon: <Linkedin size={24} />, color: 'bg-blue-700', action: () => handleShareToPlatform('linkedin') },
    { id: 'email', name: 'Email', icon: <Mail size={24} />, color: 'bg-gray-600', action: () => handleShareToPlatform('email') },
    { id: 'sms', name: 'SMS', icon: <Smartphone size={24} />, color: 'bg-green-600', action: () => handleShareToPlatform('sms') },
  ];

  return (
    <>
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] animate-slideDown">
          <div className={`px-4 py-2 rounded-lg shadow-lg text-sm font-medium ${
            showToast.includes('Failed') ? 'bg-red-500' : 'bg-gray-800'
          } text-white`}>
            {showToast}
          </div>
        </div>
      )}

      {/* Modal Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        {/* Modal Content */}
        <div 
          className={`w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          } shadow-xl animate-slideUp`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`flex justify-between items-center p-4 border-b ${
            isDarkMode ? 'border-gray-700' : 'border-gray-100'
          }`}>
            <div className="flex items-center space-x-2">
              <Share2 size={20} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
              <h3 className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Share Product
              </h3>
            </div>
            <button
              onClick={onClose}
              className={`p-1 rounded-full transition-colors ${
                isDarkMode 
                  ? 'hover:bg-gray-700 text-gray-400' 
                  : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <X size={20} />
            </button>
          </div>

          {/* Product Preview */}
          <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className="flex items-center space-x-3">
              {product.images && product.images[0] && (
                <img 
                  src={product.images[0]} 
                  alt={product.product}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {product.product || product.name}
                </p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {product.price}
                </p>
                <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} truncate`}>
                  by {product.sellerName}
                </p>
              </div>
            </div>
          </div>

          {/* Native Share Button (Mobile) */}
          {typeof navigator !== 'undefined' && navigator.share && (
            <div className="p-4">
              <button
                onClick={handleNativeShare}
                className={`w-full flex items-center justify-center space-x-2 py-3 rounded-xl font-medium transition-all ${
                  isDarkMode
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                <Share2 size={20} />
                <span>Share via Device</span>
              </button>
            </div>
          )}

          {/* Copy Link Section */}
          <div className={`px-4 pb-2 ${typeof navigator !== 'undefined' && navigator.share ? '' : 'pt-4'}`}>
            <p className={`text-xs font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              OR COPY LINK
            </p>
            <div className="flex items-center space-x-2">
              <div className={`flex-1 flex items-center px-3 py-2 rounded-lg border ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-gray-300' 
                  : 'bg-gray-50 border-gray-200 text-gray-600'
              }`}>
                <span className="text-xs truncate">{shareLink}</span>
              </div>
              <button
                onClick={handleCopyLink}
                className={`p-2 rounded-lg transition-all flex items-center space-x-1 ${
                  copied
                    ? 'bg-green-500 text-white'
                    : isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                <span className="text-xs font-medium hidden sm:inline">
                  {copied ? 'Copied!' : 'Copy'}
                </span>
              </button>
            </div>
          </div>

          {/* Share Platforms Grid */}
          <div className="p-4">
            <p className={`text-xs font-medium mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              SHARE TO
            </p>
            <div className="grid grid-cols-4 gap-3">
              {shareOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={option.action}
                  className={`flex flex-col items-center space-y-2 p-2 rounded-xl transition-all ${
                    isDarkMode
                      ? 'hover:bg-gray-700'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full ${option.color} flex items-center justify-center text-white shadow-md`}>
                    {option.icon}
                  </div>
                  <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {option.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Close Button */}
          <div className={`p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <button
              onClick={onClose}
              className={`w-full py-2 rounded-lg font-medium transition-colors ${
                isDarkMode
                  ? 'hover:bg-gray-700 text-gray-400'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes slideDown {
          from {
            transform: translate(-50%, -20px);
            opacity: 0;
          }
          to {
            transform: translate(-50%, 0);
            opacity: 1;
          }
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default ShareModal;