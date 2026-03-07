import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from './api';

const LikeBookmarkContext = createContext();

export const useLikeBookmark = () => useContext(LikeBookmarkContext);

export const LikeBookmarkProvider = ({ children }) => {
  const [likedPosts, setLikedPosts] = useState({});
  const [favoritedPosts, setFavoritedPosts] = useState({});
  const [loading, setLoading] = useState(true);
  const [initialFetchDone, setInitialFetchDone] = useState(false);

  // Fetch initial like and bookmark data
  const fetchLikeBookmarkData = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLikedPosts({});
      setFavoritedPosts({});
      setLoading(false);
      setInitialFetchDone(true);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch liked products
      const likedResult = await api.getLikedProducts();
      const newLikedPosts = {};
      if (likedResult.data && Array.isArray(likedResult.data)) {
        likedResult.data.forEach(product => {
          newLikedPosts[product.id] = true;
        });
      }

      // Fetch wishlist/bookmarked products
      const wishlistResult = await api.getWishlist();
      const newFavoritedPosts = {};
      
      if (wishlistResult.data) {
        if (wishlistResult.data.status === 'success' && wishlistResult.data.items) {
          wishlistResult.data.items.forEach(item => {
            const productId = item.product?.id || item.id;
            if (productId) newFavoritedPosts[productId] = true;
          });
        } else if (Array.isArray(wishlistResult.data)) {
          wishlistResult.data.forEach(product => {
            newFavoritedPosts[product.id] = true;
          });
        }
      }

      setLikedPosts(newLikedPosts);
      setFavoritedPosts(newFavoritedPosts);
    } catch (error) {
      console.error('Error fetching like/bookmark data:', error);
    } finally {
      setLoading(false);
      setInitialFetchDone(true);
    }
  }, []);

  // Toggle like
  const toggleLike = async (productId) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return { error: 'Not authenticated', success: false };

    // Get current state BEFORE toggling
    const currentState = likedPosts[productId] || false;
    const newState = !currentState;
    
    // Optimistic update - immediately update UI
    setLikedPosts(prev => ({
      ...prev,
      [productId]: newState
    }));

    try {
      const result = await api.toggleLike(productId);
      
      if (result.data && !result.error) {
        // Check if the response has the 'liked' field
        const serverLiked = result.data.liked !== undefined ? result.data.liked : newState;
        const newLikeCount = result.data.like_count || 0;
        
        // ALWAYS update with the server response to ensure consistency
        setLikedPosts(prev => ({
          ...prev,
          [productId]: serverLiked
        }));
        
        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('likeToggled', {
          detail: { 
            productId, 
            liked: serverLiked, 
            likeCount: newLikeCount 
          }
        }));
        
        return { 
          success: true, 
          liked: serverLiked, 
          likeCount: newLikeCount 
        };
      } else {
        // Revert on error
        setLikedPosts(prev => ({
          ...prev,
          [productId]: currentState
        }));
        return { success: false, error: 'Failed to toggle like' };
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert on error
      setLikedPosts(prev => ({
        ...prev,
        [productId]: currentState
      }));
      return { success: false, error: error.message };
    }
  };

  // Toggle bookmark
  const toggleBookmark = async (productId) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return { error: 'Not authenticated', success: false };

    // Get current state BEFORE toggling
    const currentState = favoritedPosts[productId] || false;
    const newState = !currentState;
    
    // Optimistic update - immediately update UI
    setFavoritedPosts(prev => ({
      ...prev,
      [productId]: newState
    }));

    try {
      const result = await api.toggleWishlist(productId);
      
      if (result.data && !result.error) {
        const isNowBookmarked = result.data.action === 'added';
        
        // ALWAYS update with the server response
        setFavoritedPosts(prev => ({
          ...prev,
          [productId]: isNowBookmarked
        }));
        
        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('bookmarkToggled', {
          detail: { 
            productId, 
            bookmarked: isNowBookmarked 
          }
        }));
        
        return { 
          success: true, 
          bookmarked: isNowBookmarked 
        };
      } else {
        // Revert on error
        setFavoritedPosts(prev => ({
          ...prev,
          [productId]: currentState
        }));
        return { success: false, error: 'Failed to toggle bookmark' };
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      // Revert on error
      setFavoritedPosts(prev => ({
        ...prev,
        [productId]: currentState
      }));
      return { success: false, error: error.message };
    }
  };

  // Check if a product is liked
  const isLiked = (productId) => {
    return !!likedPosts[productId];
  };

  // Check if a product is bookmarked
  const isBookmarked = (productId) => {
    return !!favoritedPosts[productId];
  };

  // Refresh data
  const refreshData = () => {
    fetchLikeBookmarkData();
  };

  useEffect(() => {
    fetchLikeBookmarkData();
    
    // Listen for auth changes to refresh data
    const handleAuthChange = () => {
      fetchLikeBookmarkData();
    };
    
    window.addEventListener('authStateChanged', handleAuthChange);
    window.addEventListener('storage', (e) => {
      if (e.key === 'accessToken' || e.key === 'user') {
        fetchLikeBookmarkData();
      }
    });
    
    return () => {
      window.removeEventListener('authStateChanged', handleAuthChange);
    };
  }, [fetchLikeBookmarkData]);

  return (
    <LikeBookmarkContext.Provider value={{
      likedPosts,
      favoritedPosts,
      loading,
      initialFetchDone,
      toggleLike,
      toggleBookmark,
      isLiked,
      isBookmarked,
      refreshData
    }}>
      {children}
    </LikeBookmarkContext.Provider>
  );
};