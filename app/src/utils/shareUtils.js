// src/utils/shareUtils.js

// Get the base URL of your application
export const getBaseUrl = () => {
  return window.location.origin;
};

// Generate shareable link for a product
export const getProductShareLink = (productId) => {
  return `${getBaseUrl()}/product/${productId}`;
};

// Generate shareable link with product image
export const getProductShareLinkWithImage = (productId, imageUrl) => {
  const baseUrl = getBaseUrl();
  const productUrl = `${baseUrl}/product/${productId}`;
  
  if (imageUrl) {
    const encodedImage = encodeURIComponent(imageUrl);
    return `${productUrl}?image=${encodedImage}`;
  }
  return productUrl;
};

// Get the best image from product data
export const getProductImage = (product) => {
  if (!product) return '/placeholder-product.jpg';
  
  // Check for images array
  if (product.images && product.images.length > 0) {
    return product.images[0];
  }
  
  // Check for product_photo
  if (product.product_photo) {
    return product.product_photo;
  }
  
  // Check for mainImage
  if (product.mainImage) {
    return product.mainImage;
  }
  
  // Default placeholder
  return '/placeholder-product.jpg';
};

// Get product details for sharing with image
export const getProductShareDetails = (product) => {
  const title = product.product || product.name || 'Check out this product';
  const description = product.content || product.description || 'Check out this amazing product on TrendSync!';
  const price = product.price || product.unit_price_formatted || '';
  const image = getProductImage(product);
  const seller = product.sellerName || product.seller?.name || 'Seller';
  const url = getProductShareLinkWithImage(product.id, image);
  
  const shareText = `${title}${price ? ` - ${price}` : ''}\n${description}\n\nShared by ${seller}`;
  
  return {
    title,
    description,
    price,
    image,
    seller,
    url,
    text: shareText
  };
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
      textarea.style.left = '-9999px';
      textarea.style.top = '-9999px';
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

// Share using Web Share API (mobile native share) - includes image if possible
export const shareUsingWebShare = async (product) => {
  if (!navigator.share) {
    console.warn('Web Share API not available');
    return false;
  }
  
  const details = getProductShareDetails(product);
  
  try {
    // Try to share with image URL
    await navigator.share({
      title: details.title,
      text: details.text,
      url: details.url,
    });
    return true;
  } catch (error) {
    console.error('Web Share API error:', error);
    return false;
  }
};

// Share to specific platform with image support
export const shareToPlatform = (platform, product) => {
  const details = getProductShareDetails(product);
  const { title, text, url, image } = details;
  
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedText = encodeURIComponent(text);
  const encodedImage = encodeURIComponent(image);
  
  const shareUrls = {
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    instagram: `https://www.instagram.com/create/story?url=${encodedUrl}`,
    messenger: `fb-messenger://share?link=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}%0A%0AImage: ${encodedImage}`,
    sms: `sms:?body=${encodedText}%20${encodedUrl}`,
    pinterest: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodedImage}&description=${encodedTitle}`,
    reddit: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
    tumblr: `https://www.tumblr.com/widgets/share/tool?posttype=link&url=${encodedUrl}&title=${encodedTitle}&caption=${encodedText}`,
    nextdoor: `https://nextdoor.com/share?link=${encodedUrl}`,
  };
  
  if (shareUrls[platform]) {
    window.open(shareUrls[platform], '_blank', 'noopener,noreferrer,width=600,height=500');
    return true;
  }
  return false;
};

// Get all available share platforms with icons
export const getSharePlatforms = () => {
  return [
    { id: 'whatsapp', name: 'WhatsApp', icon: '💬', color: '#25D366' },
    { id: 'facebook', name: 'Facebook', icon: '📘', color: '#1877F2' },
    { id: 'twitter', name: 'Twitter', icon: '🐦', color: '#000000' },
    { id: 'telegram', name: 'Telegram', icon: '📱', color: '#0088cc' },
    { id: 'email', name: 'Email', icon: '📧', color: '#EA4335' },
    { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: '#0A66C2' },
    { id: 'pinterest', name: 'Pinterest', icon: '📌', color: '#E60023' },
    { id: 'reddit', name: 'Reddit', icon: '🤖', color: '#FF4500' },
    { id: 'sms', name: 'SMS', icon: '📱', color: '#34B7F1' },
    { id: 'messenger', name: 'Messenger', icon: '💬', color: '#00B2FF' },
  ];
};

// Generate Open Graph meta tags for product sharing
export const generateOpenGraphTags = (product) => {
  const details = getProductShareDetails(product);
  
  return {
    'og:title': details.title,
    'og:description': details.description,
    'og:image': details.image,
    'og:url': details.url,
    'og:type': 'product',
    'og:price:amount': details.price,
    'og:price:currency': 'UGX',
    'product:brand': details.seller,
    'twitter:card': 'summary_large_image',
    'twitter:title': details.title,
    'twitter:description': details.description,
    'twitter:image': details.image,
  };
};

// Get share text with emojis
export const getShareTextWithEmojis = (product) => {
  const details = getProductShareDetails(product);
  const emojis = {
    'tech': '💻',
    'fashion': '👗',
    'food': '🍕',
    'home': '🏠',
    'fitness': '💪',
    'beauty': '💄',
    'toys': '🧸',
    'books': '📚',
    'music': '🎵',
    'sports': '⚽',
  };
  
  // Try to match category
  const category = product.category || '';
  const emoji = emojis[category.toLowerCase()] || '✨';
  
  return `${emoji} ${details.text}`;
};

// Create a shareable image preview HTML
export const generateSharePreviewHTML = (product) => {
  const details = getProductShareDetails(product);
  
  return `
    <div style="max-width: 400px; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <img src="${details.image}" alt="${details.title}" style="width: 100%; height: 200px; object-fit: cover;" />
      <div style="padding: 16px;">
        <h3 style="margin: 0 0 8px; font-size: 18px; font-weight: 600;">${details.title}</h3>
        ${details.price ? `<p style="margin: 0 0 8px; font-size: 16px; color: #22c55e; font-weight: 600;">${details.price}</p>` : ''}
        <p style="margin: 0 0 8px; font-size: 14px; color: #666;">${details.description}</p>
        <p style="margin: 0; font-size: 12px; color: #999;">By ${details.seller}</p>
        <p style="margin: 8px 0 0; font-size: 12px; color: #3b82f6;">${details.url}</p>
      </div>
    </div>
  `;
};

// Export all utilities as default
export default {
  getBaseUrl,
  getProductShareLink,
  getProductShareLinkWithImage,
  getProductImage,
  getProductShareDetails,
  copyToClipboard,
  shareUsingWebShare,
  shareToPlatform,
  getSharePlatforms,
  generateOpenGraphTags,
  getShareTextWithEmojis,
  generateSharePreviewHTML
};