// LikeBookmarkContext.jsx
import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api';

const LikeBookmarkContext = createContext();

export const useLikeBookmark = () => useContext(LikeBookmarkContext);

export const LikeBookmarkProvider = ({ children }) => {
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [bookmarkedPosts, setBookmarkedPosts] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const fetchInProgress = useRef(false);

  // Function to check if user is authenticated
  const isAuthenticated = useCallback(() => {
    return !!localStorage.getItem('accessToken');
  }, []);

  const fetchLikedProducts = useCallback(async () => {
    if (!isAuthenticated()) {
      setLikedPosts(new Set());
      return;
    }

    try {
      const response = await api.getLikedProducts();
      if (response.data && Array.isArray(response.data)) {
        const likedIds = new Set(response.data.map(p => p.id));
        setLikedPosts(likedIds);
        console.log('Fetched liked products:', likedIds);
      }
    } catch (error) {
      console.error('Error fetching liked products:', error);
      setLikedPosts(new Set());
    }
  }, [isAuthenticated]);

  const fetchBookmarkedProducts = useCallback(async () => {
    if (!isAuthenticated()) {
      setBookmarkedPosts(new Set());
      return;
    }

    try {
      const response = await api.getWishlist();
      let bookmarkedIds = new Set();

      if (response.data) {
        if (response.data.status === 'success' && response.data.items) {
          bookmarkedIds = new Set(response.data.items.map(item => item.product?.id || item.id));
        } else if (Array.isArray(response.data)) {
          bookmarkedIds = new Set(response.data.map(p => p.id));
        }
      }

      setBookmarkedPosts(bookmarkedIds);
      console.log('Fetched bookmarked products:', bookmarkedIds);
    } catch (error) {
      console.error('Error fetching bookmarked products:', error);
      setBookmarkedPosts(new Set());
    }
  }, [isAuthenticated]);

  const fetchAllData = useCallback(async () => {
    if (fetchInProgress.current) return;
    
    fetchInProgress.current = true;
    setLoading(true);
    
    await Promise.all([fetchLikedProducts(), fetchBookmarkedProducts()]);
    
    setLoading(false);
    setInitialFetchDone(true);
    fetchInProgress.current = false;
  }, [fetchLikedProducts, fetchBookmarkedProducts]);

  // Listen for auth state changes
  useEffect(() => {
    const handleAuthChange = () => {
      console.log('Auth state changed, refreshing like/bookmark data');
      if (isAuthenticated()) {
        fetchAllData();
      } else {
        setLikedPosts(new Set());
        setBookmarkedPosts(new Set());
        setInitialFetchDone(false);
      }
    };

    // Check on mount
    if (isAuthenticated()) {
      fetchAllData();
    } else {
      setLoading(false);
    }

    // Listen for auth changes
    window.addEventListener('authStateChanged', handleAuthChange);
    window.addEventListener('storage', (e) => {
      if (e.key === 'accessToken' || e.key === 'access') {
        handleAuthChange();
      }
    });

    return () => {
      window.removeEventListener('authStateChanged', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, [fetchAllData, isAuthenticated]);

  useEffect(() => {
    const handleLikeToggled = (event) => {
      const { productId, liked } = event.detail;
      setLikedPosts(prev => {
        const newSet = new Set(prev);
        if (liked) {
          newSet.add(productId);
        } else {
          newSet.delete(productId);
        }
        return newSet;
      });
    };

    const handleBookmarkToggled = (event) => {
      const { productId, bookmarked } = event.detail;
      setBookmarkedPosts(prev => {
        const newSet = new Set(prev);
        if (bookmarked) {
          newSet.add(productId);
        } else {
          newSet.delete(productId);
        }
        return newSet;
      });
    };

    window.addEventListener('likeToggled', handleLikeToggled);
    window.addEventListener('bookmarkToggled', handleBookmarkToggled);

    return () => {
      window.removeEventListener('likeToggled', handleLikeToggled);
      window.removeEventListener('bookmarkToggled', handleBookmarkToggled);
    };
  }, []);

  const toggleLike = async (productId) => {
    if (!isAuthenticated()) return { success: false, liked: false };

    try {
      const response = await api.toggleLike(productId);
      
      if (!response.error) {
        const newLikedState = response.data?.liked ?? !likedPosts.has(productId);
        
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          if (newLikedState) {
            newSet.add(productId);
          } else {
            newSet.delete(productId);
          }
          return newSet;
        });

        window.dispatchEvent(new CustomEvent('likeToggled', { 
          detail: { productId, liked: newLikedState } 
        }));

        return { success: true, liked: newLikedState };
      }
      
      return { success: false, liked: likedPosts.has(productId) };
    } catch (error) {
      console.error('Error toggling like:', error);
      return { success: false, liked: likedPosts.has(productId) };
    }
  };

  const toggleBookmark = async (productId) => {
    if (!isAuthenticated()) return { success: false, bookmarked: false };

    try {
      const response = await api.toggleWishlist(productId);
      
      if (!response.error) {
        const newBookmarkedState = response.data?.action === 'added' || 
                                   (response.data?.status === 'success' && response.data?.action !== 'removed');
        
        setBookmarkedPosts(prev => {
          const newSet = new Set(prev);
          if (newBookmarkedState) {
            newSet.add(productId);
          } else {
            newSet.delete(productId);
          }
          return newSet;
        });

        window.dispatchEvent(new CustomEvent('bookmarkToggled', { 
          detail: { productId, bookmarked: newBookmarkedState } 
        }));

        return { success: true, bookmarked: newBookmarkedState };
      }
      
      return { success: false, bookmarked: bookmarkedPosts.has(productId) };
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      return { success: false, bookmarked: bookmarkedPosts.has(productId) };
    }
  };

  const isLiked = (productId) => likedPosts.has(productId);
  const isBookmarked = (productId) => bookmarkedPosts.has(productId);

  const value = {
    likedPosts,
    bookmarkedPosts,
    isLiked,
    isBookmarked,
    toggleLike,
    toggleBookmark,
    loading,
    initialFetchDone,
    refreshData: fetchAllData
  };

  return (
    <LikeBookmarkContext.Provider value={value}>
      {children}
    </LikeBookmarkContext.Provider>
  );
};