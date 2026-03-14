import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from './api';

const SellerLikeBookmarkContext = createContext();

export function SellerLikeBookmarkProvider({ children }) {
  const [likedProducts, setLikedProducts] = useState(new Set());
  const [bookmarkedProducts, setBookmarkedProducts] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLikes: 0,
    totalBookmarks: 0,
    recentLikes: [],
    recentBookmarks: []
  });
  
  // Use a ref to track if component is mounted
  const isMounted = useRef(true);
  // Use a ref to prevent multiple simultaneous fetches
  const isFetching = useRef(false);

  // Check if user is a seller
  const isSeller = useCallback(() => {
    const userStr = localStorage.getItem('user');
    const userRole = localStorage.getItem('userRole');
    
    if (!userStr && !userRole) return false;
    
    try {
      // Check role from userRole first
      if (userRole === 'seller') return true;
      
      // Fallback to checking user object
      if (userStr) {
        const user = JSON.parse(userStr);
        return user?.is_seller === true;
      }
      
      return false;
    } catch {
      return false;
    }
  }, []);

  // Fetch seller's product stats
  const fetchSellerStats = useCallback(async () => {
    // Don't fetch if not a seller or already fetching
    if (!isSeller() || isFetching.current) return;
    
    try {
      isFetching.current = true;
      setLoading(true);
      
      const response = await api.getSellerProductStats();
      
      // Only update state if component is still mounted
      if (isMounted.current && response.data) {
        const liked = new Set(response.data.liked_products || []);
        const bookmarked = new Set(response.data.bookmarked_products || []);
        
        setLikedProducts(liked);
        setBookmarkedProducts(bookmarked);
        setStats({
          totalLikes: response.data.total_likes || 0,
          totalBookmarks: response.data.total_bookmarks || 0,
          recentLikes: response.data.recent_likes || [],
          recentBookmarks: response.data.recent_bookmarks || []
        });
      }
    } catch (error) {
      console.error('Error fetching seller stats:', error);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
      isFetching.current = false;
    }
  }, [isSeller]); // Only depend on isSeller

  // Check if a product is liked by any buyer
  const isProductLiked = useCallback((productId) => {
    return likedProducts.has(Number(productId));
  }, [likedProducts]);

  // Check if a product is bookmarked by any buyer
  const isProductBookmarked = useCallback((productId) => {
    return bookmarkedProducts.has(Number(productId));
  }, [bookmarkedProducts]);

  // Get like count for a product
  const getProductLikeCount = useCallback((productId) => {
    // This would come from the product data itself, not the context
    return 0;
  }, []);

  // Refresh stats
  const refreshStats = useCallback(async () => {
    await fetchSellerStats();
  }, [fetchSellerStats]);

  // Initial fetch
  useEffect(() => {
    isMounted.current = true;
    
    if (isSeller()) {
      fetchSellerStats();
    } else {
      setLoading(false);
    }
    
    return () => {
      isMounted.current = false;
    };
  }, [isSeller, fetchSellerStats]); // Add proper dependencies

  // Listen for product updates
  useEffect(() => {
    const handleProductUpdate = () => {
      console.log('Product updated, refreshing stats');
      refreshStats();
    };

    const handleLikeUpdate = () => {
      console.log('Like updated, refreshing stats');
      refreshStats();
    };

    const handleStorageChange = (e) => {
      if (e.key === 'productStatsUpdated' || e.key === 'user' || e.key === 'userRole') {
        refreshStats();
      }
    };

    window.addEventListener('productUpdated', handleProductUpdate);
    window.addEventListener('likeUpdated', handleLikeUpdate);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('productUpdated', handleProductUpdate);
      window.removeEventListener('likeUpdated', handleLikeUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [refreshStats]); // Add refreshStats as dependency

  const value = {
    // State
    likedProducts,
    bookmarkedProducts,
    loading,
    stats,
    
    // Getters
    isProductLiked,
    isProductBookmarked,
    getProductLikeCount,
    
    // Actions
    refreshStats,
    
    // Stats
    totalLikes: stats.totalLikes,
    totalBookmarks: stats.totalBookmarks,
    recentLikes: stats.recentLikes,
    recentBookmarks: stats.recentBookmarks
  };

  return (
    <SellerLikeBookmarkContext.Provider value={value}>
      {children}
    </SellerLikeBookmarkContext.Provider>
  );
}

export const useSellerLikeBookmark = () => {
  const context = useContext(SellerLikeBookmarkContext);
  if (!context) {
    throw new Error('useSellerLikeBookmark must be used within a SellerLikeBookmarkProvider');
  }
  return context;
};