// src/utils/shareUtils.js

// Get the base URL of your application
export const getBaseUrl = () => {
  return window.location.origin;
};

// Generate shareable link for a product
export const getProductShareLink = (productId) => {
  return `${getBaseUrl()}/product/${productId}`;
};

// Copy link to clipboard
export const copyToClipboard = async (text, onSuccess, onError) => {
  try {
    // Modern approach
    await navigator.clipboard.writeText(text);
    if (onSuccess) onSuccess();
    return true;
  } catch (err) {
    // Fallback approach for older browsers
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      
      if (successful) {
        if (onSuccess) onSuccess();
        return true;
      } else {
        throw new Error('Copy failed');
      }
    } catch (fallbackErr) {
      if (onError) onError(fallbackErr);
      return false;
    }
  }
};

// Share using Web Share API (mobile native share)
export const shareUsingWebShare = async (title, text, url) => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: title,
        text: text,
        url: url,
      });
      return true;
    } catch (error) {
      console.error('Web Share API error:', error);
      return false;
    }
  }
  return false;
};

// Share to specific platform
export const shareToPlatform = (platform, url, title, text) => {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedText = encodeURIComponent(text);
  
  const shareUrls = {
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    instagram: `instagram://library?AssetKey=${encodedUrl}`,
    messenger: `fb-messenger://share?link=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}`,
    sms: `sms:?body=${encodedText}%20${encodedUrl}`,
  };
  
  if (shareUrls[platform]) {
    window.open(shareUrls[platform], '_blank', 'noopener,noreferrer,width=600,height=500');
    return true;
  }
  return false;
};

// Get product details for sharing
export const getProductShareDetails = (product) => {
  const title = product.product || product.name || 'Check out this product';
  const text = `Check out ${title} on TendSync! Price: ${product.price || product.unit_price_formatted || 'Check price'}`;
  const url = getProductShareLink(product.id);
  return { title, text, url };
};