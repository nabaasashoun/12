const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

console.log('API_URL:', API_URL);

export const api = {
  async request(endpoint, options = {}) {
    const baseUrl = API_URL.replace(/\/$/, '');
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${baseUrl}${normalizedEndpoint}`;
    
    const token = localStorage.getItem('accessToken');
    
    const headers = {
      'Accept': 'application/json',
      ...options.headers,
    };

    if (options.body instanceof FormData) {
      delete headers['Content-Type'];
    } else if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    console.log('API Request:', url, options.method || 'GET');
    
    const timeoutDuration = 30000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);
    
    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      console.log('API Response:', response.status, url);
      
      if (response.status === 401) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          const newToken = localStorage.getItem('accessToken');
          if (newToken) {
            headers['Authorization'] = `Bearer ${newToken}`;
            const retryResponse = await fetch(url, {
              ...options,
              headers,
            });
            return this.handleResponse(retryResponse);
          }
        }
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        window.dispatchEvent(new CustomEvent('authStateChanged'));
        return { error: 'Authentication failed. Please login again.', status: 401 };
      }
      
      return this.handleResponse(response);
    } catch (error) {
      console.error('API request failed:', error);
      
      if (error.name === 'AbortError') {
        return { error: 'Request timeout. Please check your connection.', status: 408 };
      }
      
      if (error.message.includes('Failed to fetch')) {
        return { 
          error: `Cannot connect to server at ${url}. Please ensure backend is running on localhost:8000`, 
          status: 0 
        };
      }
      
      return { error: 'Network error. Please check your connection.', status: 0 };
    }
  },
  
  async handleResponse(response) {
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      try {
        const data = await response.json();
        
        if (!response.ok) {
          return { 
            error: data.error || data.detail || data.message || 'Request failed', 
            status: response.status, 
            data 
          };
        }
        
        return { data, status: response.status };
      } catch (jsonError) {
        console.error('JSON parsing error:', jsonError);
        return { error: 'Invalid JSON response', status: response.status };
      }
    } else {
      if (!response.ok) {
        return { error: 'Request failed', status: response.status };
      }
      return { data: await response.text(), status: response.status };
    }
  },
  
  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;
    
    try {
      const response = await fetch(`${API_URL}/auth/jwt/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('accessToken', data.access);
        console.log('Token refreshed successfully');
        return true;
      } else {
        console.error('Token refresh failed with status:', response.status);
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
    
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    window.dispatchEvent(new CustomEvent('authStateChanged'));
    return false;
  },
    
  async updateSellerProduct(productId, formData) {
    return this.request(`/products/${productId}/`, {
      method: 'PUT',
      headers: {},
      body: formData,
    });
  },
  
  async getSellerProducts() {
    return this.request('/seller/products/');
  },
  
  async login(username, password) {
    const result = await this.request('/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    if (result.data && result.data.access) {
      localStorage.setItem('accessToken', result.data.access);
      localStorage.setItem('refreshToken', result.data.refresh);
      
      if (result.data.user) {
        localStorage.setItem('user', JSON.stringify(result.data.user));
        localStorage.setItem('userRole', result.data.user.is_seller ? 'seller' : 'buyer');
      } else {
        localStorage.setItem('user', JSON.stringify({ username }));
      }
      
      window.dispatchEvent(new CustomEvent('authStateChanged'));
    }
    
    return result;
  },
  
  async verifyToken() {
    return this.request('/verify-token/');
  },
  
  async registerBuyer(userData) {
    return this.request('/register/buyer/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
  
  async registerSeller(userData) {
    return this.request('/register/seller/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
  
  async getSellerProfile() {
    return this.request('/seller/profile/');
  },
  
  async getProducts() {
    return this.request('/products/');
  },
  
  async getProduct(id) {
    return this.request(`/products/${id}/`);
  },
  
  async getCart() {
    return this.request('/cart/items/');
  },
  
  async addToCart(productId, quantity = 1) {
    return this.request('/cart/add/', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity }),
    });
  },
  
  async removeFromCart(productId) {
    return this.request(`/cart/remove/${productId}/`, {
      method: 'DELETE',
    });
  },
  
  async updateCartItem(productId, quantity, answers = null) {
    const body = {};
    if (quantity !== undefined && quantity !== null) body.quantity = quantity;
    if (answers !== null) body.answers = answers;
    
    return this.request(`/cart/update/${productId}/`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },
  
  async clearCart() {
    return this.request('/cart/clear/', {
      method: 'DELETE',
    });
  },
  
  async toggleLike(productId) {
    return this.request(`/products/${productId}/toggle-like/`, {
      method: 'POST',
    });
  },
  
  async getLikedProducts() {
    return this.request('/liked-products/');
  },
  
  async checkLike(productId) {
    return this.request(`/products/${productId}/check-like/`);
  },
  
  async getCategories() {
    return this.request('/categories/');
  },

  async searchProducts(query, categoryId = 'all') {
    const params = new URLSearchParams();
    if (query) params.append('search', query);
    if (categoryId && categoryId !== 'all') params.append('category', categoryId);
    return this.request(`/products/?${params.toString()}`);
  },
  
  async getSellers() {
    return this.request('/sellers/');
  },
  
  async getSeller(id) {
    return this.request(`/sellers/${id}/`);
  },
  
  async getQuickDeals() {
    return this.request('/quick-deals/');
  },
  
  async getSellerQuickDeals() {
    return this.request('/seller/quick-deals/');
  },
  
  async createQuickDeal(dealData) {
    const formData = new FormData();
    
    Object.keys(dealData).forEach(key => {
      if (dealData[key] !== undefined && dealData[key] !== null) {
        formData.append(key, dealData[key]);
      }
    });
    
    return this.request('/seller/quick-deals/', {
      method: 'POST',
      headers: {},
      body: formData,
    });
  },
  
  async getWishlist() {
    return this.request('/wishlist/');
  },

  async addToWishlist(productId) {
    return this.request('/wishlist/add/', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId }),
    });
  },

  async removeFromWishlist(productId) {
    return this.request(`/wishlist/remove/${productId}/`, {
      method: 'DELETE',
    });
  },

  async toggleWishlist(productId) {
    return this.request(`/wishlist/toggle/${productId}/`, {
      method: 'POST',
    });
  },

  async getProductComments(productId) {
    return this.request(`/products/${productId}/comments/`);
  },

  async addComment(productId, commentData) {
    return this.request(`/products/${productId}/comments/`, {
      method: 'POST',
      body: JSON.stringify(commentData),
    });
  },

  async updateComment(commentId, commentData) {
    return this.request(`/comments/${commentId}/`, {
      method: 'PUT',
      body: JSON.stringify(commentData),
    });
  },

  async deleteComment(commentId) {
    return this.request(`/comments/${commentId}/`, {
      method: 'DELETE',
    });
  },

  async markHelpful(commentId) {
    return this.request(`/comments/${commentId}/helpful/`, {
      method: 'POST',
    });
  },
    
  async getOrderCount() {
    return this.request('/orders/count/');
  },
  
  async getBuyerProfile() {
    return this.request('/buyer/profile/');
  },
  
  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    window.dispatchEvent(new CustomEvent('authStateChanged'));
    window.dispatchEvent(new CustomEvent('cartUpdated'));
  },

  async createOrderFromCart() {
    return this.request('/orders/create-from-cart/', {
      method: 'POST',
    });
  },

  async initiatePayment(orderId) {
    return this.request('/payments/initiate/', {
      method: 'POST',
      body: JSON.stringify({ order_id: orderId }),
    });
  },
  
  async incrementQuickDealViews(dealId) {
    return this.request(`/quick-deals/${dealId}/view/`, { method: 'POST' });
  },

  toggleFollowSeller(sellerId) {
    return this.request(`/sellers/${sellerId}/follow/`, {
      method: 'POST',
    });
  }

};