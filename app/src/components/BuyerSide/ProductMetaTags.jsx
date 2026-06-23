// src/components/BuyerSide/ProductMetaTags.jsx
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const ProductMetaTags = ({ product, productImage, productDescription }) => {
  const location = useLocation();
  const baseUrl = window.location.origin;
  
  // Parse URL parameters for shared links
  const params = new URLSearchParams(location.search);
  const shareImage = params.get('share_image');
  const shareTitle = params.get('share_title');
  const sharePrice = params.get('share_price');
  const shareSeller = params.get('share_seller');
  
  // Use shared parameters if present, otherwise use product data
  const title = shareTitle || product?.name || product?.product || 'Product';
  const description = productDescription || product?.description || 'Check out this amazing product on TrendSync';
  const price = sharePrice || product?.unit_price || product?.price || 0;
  const seller = shareSeller || product?.sellerName || product?.seller_name || 'Seller';
  
  // Get the image URL - prioritize shared image, then product image
  let imageUrl = shareImage || productImage || product?.product_photo || '/placeholder-product.jpg';
  
  // Ensure absolute URL
  const absoluteImageUrl = imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl}`;
  
  // Product URL
  const productUrl = `${baseUrl}/product/${product?.id || ''}`;

  return (
    <Helmet>
      {/* Basic Meta */}
      <title>{title} - TrendSync</title>
      <meta name="description" content={description} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="product" />
      <meta property="og:url" content={productUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={absoluteImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="TrendSync" />
      <meta property="product:price:amount" content={String(price)} />
      <meta property="product:price:currency" content="UGX" />
      <meta property="product:availability" content="in stock" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={productUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absoluteImageUrl} />
      <meta name="twitter:site" content="@TrendSync" />
      
      {/* Additional Open Graph for better sharing */}
      <meta property="og:image:alt" content={title} />
      
      {/* WhatsApp/Telegram specific */}
      <meta property="og:image:secure_url" content={absoluteImageUrl} />
      
      {/* Pinterest */}
      <meta name="pinterest:image" content={absoluteImageUrl} />
      
      {/* Schema.org markup for Google */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org/",
          "@type": "Product",
          "name": title,
          "description": description,
          "image": absoluteImageUrl,
          "offers": {
            "@type": "Offer",
            "priceCurrency": "UGX",
            "price": price,
            "availability": "https://schema.org/InStock",
            "seller": {
              "@type": "Organization",
              "name": seller
            }
          }
        })}
      </script>
    </Helmet>
  );
};

export default ProductMetaTags;