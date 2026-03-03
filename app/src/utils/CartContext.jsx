import { createContext, useContext, useState, useEffect } from 'react';
import { api } from './api';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);

  const isUserSeller = () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return false;
    
    try {
      const user = JSON.parse(userStr);
      return user?.is_seller === true || user?.role === 'seller';
    } catch (error) {
      console.error("Error parsing user data:", error);
      return false;
    }
  };

  const fetchCartData = async () => {
    if (isUserSeller()) {
      console.log("[CartContext] User is a seller, skipping cart fetch");
      setCartItems([]);
      setCartCount(0);
      return;
    }

    const token = localStorage.getItem('accessToken');
    console.log("[CartContext] Fetching cart — token exists?", !!token);

    if (!token) {
      console.log("[CartContext] No token → setting count to 0");
      setCartItems([]);
      setCartCount(0);
      return;
    }

    try {
      const result = await api.getCart();
      
      console.log("[CartContext] Full API response:", result);
      
      if (result.error) {
        console.log("[CartContext] API error:", result.error);
        setCartItems([]);
        setCartCount(0);
        return;
      }

      if (result.data) {
        let itemsArray = [];
        
        if (result.data.items && Array.isArray(result.data.items)) {
          console.log("[CartContext] Using items array structure");
          itemsArray = result.data.items;
        } else if (Array.isArray(result.data)) {
          console.log("[CartContext] Using direct array structure");
          itemsArray = result.data;
        } else if (result.data.cart_items && Array.isArray(result.data.cart_items)) {
          console.log("[CartContext] Using cart_items array structure");
          itemsArray = result.data.cart_items;
        } else {
          console.log("[CartContext] Unknown response structure:", result.data);
        }
        
        setCartItems(itemsArray);
        
        const uniqueProductIds = new Set();
        itemsArray.forEach(item => {
          if (item.product && item.product.id) {
            uniqueProductIds.add(item.product.id);
          }
        });
        
        const uniqueCount = uniqueProductIds.size;
        console.log("[CartContext] Unique product count:", uniqueCount);
        setCartCount(uniqueCount);
      } else {
        console.log("[CartContext] Cart fetch failed:", result.error);
        setCartItems([]);
        setCartCount(0);
      }
    } catch (err) {
      console.error("[CartContext] Cart fetch error:", err);
      setCartItems([]);
      setCartCount(0);
    }
  };

  useEffect(() => {
    fetchCartData();

    const handleCartUpdate = () => {
      console.log("[CartContext] Received cartUpdated event");
      fetchCartData();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    
    const handleAuthChange = () => {
      console.log("[CartContext] Auth state changed, refreshing cart");
      fetchCartData();
    };

    window.addEventListener('authStateChanged', handleAuthChange);
    
    const handleStorageChange = (e) => {
      if (e.key === 'accessToken' || e.key === 'user') {
        console.log("[CartContext] Storage changed, refreshing cart");
        fetchCartData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('authStateChanged', handleAuthChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const refreshCartCount = () => {
    console.log("[CartContext] refreshCartCount called");
    fetchCartData();
  };

  const addToCart = async (productId, quantity = 1) => {
    try {
      const result = await api.addToCart(productId, quantity);
      if (!result.error) {
        fetchCartData();
        return true;
      }
      return false;
    } catch (error) {
      console.error("[CartContext] Error adding to cart:", error);
      return false;
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const result = await api.removeFromCart(productId);
      if (!result.error) {
        fetchCartData();
        return true;
      }
      return false;
    } catch (error) {
      console.error("[CartContext] Error removing from cart:", error);
      return false;
    }
  };

  return (
    <CartContext.Provider value={{ 
      cartCount, 
      cartItems,
      refreshCartCount,
      addToCart,
      removeFromCart,
      fetchCartData
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);