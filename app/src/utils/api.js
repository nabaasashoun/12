// api.js - Fully updated with request deduplication and caching
const API_BASE_URL = 'http://localhost:8000/api';

class Api {
  constructor() {
    // Request deduplication cache
    this.pendingRequests = new Map();
    this.cache = new Map();
    this.cacheTTL = 60000; // 1 minute cache
    this.locationsCache = null;
    this.locationsCacheTime = null;
    this.locationsCacheTTL = 300000; // 5 minutes for locations
  }

  getToken() {
    return localStorage.getItem('accessToken') || localStorage.getItem('access');
  }

  getRefreshToken() {
    return localStorage.getItem('refreshToken') || localStorage.getItem('refresh');
  }

  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (includeAuth) {
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    return headers;
  }

  // Deduplicated request with caching
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const method = options.method || 'GET';
    
    // Only cache GET requests
    const isGet = method === 'GET';
    const cacheKey = `${method}:${url}:${JSON.stringify(options.body || {})}`;
    
    // Check if this exact request is already in progress
    if (this.pendingRequests.has(cacheKey)) {
      console.log(`🔄 Deduplicating request: ${method} ${url}`);
      return this.pendingRequests.get(cacheKey);
    }
    
    // Check cache for GET requests
    if (isGet && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTTL) {
        console.log(`📦 Cache hit: ${url}`);
        return cached.data;
      } else {
        this.cache.delete(cacheKey);
      }
    }
    
    const headers = options.headers || this.getHeaders(!options.public);
    
    const requestPromise = (async () => {
      try {
        console.log(`📡 API Request: ${method} ${url}`);
        
        const response = await fetch(url, {
          ...options,
          headers: {
            ...headers,
            ...options.headers,
          },
        });
        
        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text();
        }
        
        if (!response.ok) {
          console.log(`API Error ${response.status}:`, data);
          
          if (response.status === 401) {
            console.log('401 Unauthorized, attempting token refresh...');
            const refreshed = await this.refreshToken();
            if (refreshed) {
              console.log('Token refreshed, retrying request...');
              return this.request(endpoint, options);
            } else {
              console.log('Token refresh failed, clearing auth data...');
              localStorage.removeItem('accessToken');
              localStorage.removeItem('access');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('refresh');
              localStorage.removeItem('user');
              localStorage.removeItem('userRole');
              window.dispatchEvent(new Event('authStateChanged'));
            }
          }
          return { error: true, status: response.status, data };
        }
        
        const result = { data, status: response.status };
        
        // Cache GET requests
        if (isGet) {
          this.cache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
          });
        }
        
        return result;
      } catch (error) {
        console.error('API request error:', error);
        return { error: true, message: error.message };
      } finally {
        // Remove from pending requests
        this.pendingRequests.delete(cacheKey);
      }
    })();
    
    this.pendingRequests.set(cacheKey, requestPromise);
    return requestPromise;
  }

  // Clear cache for specific endpoints or all
  clearCache(endpoint = null) {
    if (endpoint) {
      const keysToDelete = [];
      for (const key of this.cache.keys()) {
        if (key.includes(endpoint)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach(key => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
    // Also clear locations cache
    if (!endpoint || endpoint.includes('locations')) {
      this.locationsCache = null;
      this.locationsCacheTime = null;
    }
  }

  // Specialized locations fetch with longer cache
  async getLocations() {
    // Check memory cache first
    if (this.locationsCache && this.locationsCacheTime) {
      if (Date.now() - this.locationsCacheTime < this.locationsCacheTTL) {
        console.log('📦 Locations cache hit (memory)');
        return this.locationsCache;
      }
    }

    try {
      const response = await this.request('/locations/');
      if (!response.error && response.data) {
        let locationData = [];
        if (Array.isArray(response.data)) {
          locationData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          locationData = response.data.data;
        }
        if (locationData.length > 0) {
          // Cache in memory
          this.locationsCache = locationData;
          this.locationsCacheTime = Date.now();
          return locationData;
        }
      }
      // If API fails, return defaults
      return this.getDefaultLocations();
    } catch (error) {
      console.error('Error fetching locations:', error);
      return this.getDefaultLocations();
    }
  }

  getDefaultLocations() {
    return [
      'Kampala', 'Entebbe', 'Jinja', 'Mbarara', 'Gulu',
      'Arua', 'Mbale', 'Masaka', 'Kasese', 'Fort Portal',
      'Lira', 'Soroti', 'Kabale', 'Mukono', 'Njeru',
      'Busia', 'Tororo', 'Moroto', 'Kotido', 'Adjumani'
    ];
  }

  async refreshToken() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      console.log('Attempting token refresh...');
      const response = await fetch(`${API_BASE_URL}/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Token refresh successful');
        localStorage.setItem('accessToken', data.access);
        localStorage.setItem('access', data.access);
        if (data.refresh) {
          localStorage.setItem('refreshToken', data.refresh);
          localStorage.setItem('refresh', data.refresh);
        }
        return true;
      } else {
        console.log('Token refresh failed with status:', response.status);
      }
    } catch (error) {
      console.error('Token refresh error:', error);
    }
    return false;
  }

  async login(username, password) {
    const response = await this.request('/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      public: true,
    });
    
    if (!response.error && response.data) {
      if (response.data.access) {
        localStorage.setItem('accessToken', response.data.access);
        localStorage.setItem('access', response.data.access);
      }
      if (response.data.refresh) {
        localStorage.setItem('refreshToken', response.data.refresh);
        localStorage.setItem('refresh', response.data.refresh);
      }
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('userRole', response.data.user.is_seller ? 'seller' : 'buyer');
      }
    }
    
    return response;
  }

  async register(userData, isSeller = false) {
    const endpoint = isSeller ? '/register/seller/' : '/register/buyer/';
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(userData),
      public: true,
    });
  }

  async logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('access');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('refresh');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    this.clearCache();
    return { success: true };
  }

  async verifyToken() {
    return this.request('/verify-token/');
  }

  async getProducts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/products/${queryString ? '?' + queryString : ''}`);
  }

  async getProduct(productId) {
    return this.request(`/products/${productId}/`);
  }

  async getSellerProducts(sellerId) {
    return this.request(`/sellers/${sellerId}/products/`);
  }

  async createProduct(productData) {
    const formData = new FormData();
    Object.keys(productData).forEach(key => {
      if (key === 'images' && Array.isArray(productData[key])) {
        productData[key].forEach(image => {
          formData.append('images', image);
        });
      } else if (key === 'questions_input' && typeof productData[key] === 'object') {
        formData.append(key, JSON.stringify(productData[key]));
      } else if (productData[key] !== null && productData[key] !== undefined) {
        formData.append(key, productData[key]);
      }
    });

    const token = this.getToken();
    
    try {
      const response = await fetch(`${API_BASE_URL}/products/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      const data = await response.json();
      if (!response.ok) {
        return { error: true, status: response.status, data };
      }
      return { data, status: response.status };
    } catch (error) {
      console.error('Create product error:', error);
      return { error: true, message: error.message };
    }
  }

  async updateProduct(productId, productData) {
    return this.request(`/products/${productId}/`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }

  async deleteProduct(productId) {
    return this.request(`/products/${productId}/`, {
      method: 'DELETE',
    });
  }

  async getCategories() {
    return this.request('/categories/');
  }

  async getLikedProducts() {
    return this.request('/liked-products/');
  }

  async toggleLike(productId) {
    return this.request(`/products/${productId}/like/`, {
      method: 'POST',
    });
  }

  async checkProductLike(productId) {
    return this.request(`/products/${productId}/check-like/`);
  }

  async getProductComments(productId) {
    return this.request(`/products/${productId}/comments/`);
  }

  async addComment(productId, commentData) {
    return this.request(`/products/${productId}/comments/`, {
      method: 'POST',
      body: JSON.stringify(commentData),
    });
  }

  async updateComment(commentId, commentData) {
    return this.request(`/comments/${commentId}/`, {
      method: 'PUT',
      body: JSON.stringify(commentData),
    });
  }

  async deleteComment(commentId) {
    return this.request(`/comments/${commentId}/`, {
      method: 'DELETE',
    });
  }

  async markCommentHelpful(commentId) {
    return this.request(`/comments/${commentId}/helpful/`, {
      method: 'POST',
    });
  }

  async getWishlist() {
    return this.request('/wishlist/');
  }

  async toggleWishlist(productId) {
    return this.request(`/wishlist/toggle/${productId}/`, {
      method: 'POST',
    });
  }
  
  async addToWishlist(productId) {
    return this.request('/wishlist/add/', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId }),
    });
  }

  async removeFromWishlist(productId) {
    return this.request(`/wishlist/remove/${productId}/`, {
      method: 'DELETE',
    });
  }

  async addToCart(productId, quantity = 1, answers = {}) {
    return this.request('/cart/add/', {
      method: 'POST',
      body: JSON.stringify({ 
        product_id: productId, 
        quantity: quantity,
        answers: answers 
      }),
    });
  }

  async removeFromCart(productId) {
    return this.request(`/cart/remove/${productId}/`, {
      method: 'DELETE',
    });
  }

  async updateCartItem(productId, quantity, answers = null) {
    const body = {};
    if (quantity !== undefined) body.quantity = quantity;
    if (answers !== null) body.answers = answers;
    
    return this.request(`/cart/update/${productId}/`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async getCart() {
    return this.request('/cart/items/');
  }

  async clearCart() {
    return this.request('/cart/clear/', {
      method: 'DELETE',
    });
  }

  async mergeCart() {
    return this.request('/cart/merge/', {
      method: 'POST',
    });
  }

  async getSeller(sellerId) {
    return this.request(`/sellers/${sellerId}/`);
  }

  async getCurrentSeller() {
    return this.request('/seller/profile/');
  }

  async updateSellerProfile(sellerData) {
    return this.request('/seller/profile/', {
      method: 'PUT',
      body: JSON.stringify(sellerData),
    });
  }

  async toggleFollowSeller(sellerId) {
    return this.request(`/sellers/${sellerId}/follow/`, {
      method: 'POST',
    });
  }

  async getFollowing() {
    return this.request('/sellers/following/');
  }

  async getCurrentBuyer() {
    return this.request('/buyers/me/');
  }

  async updateBuyerProfile(buyerData) {
    return this.request('/buyers/me/', {
      method: 'PUT',
      body: JSON.stringify(buyerData),
    });
  }

  async getAddresses() {
    return this.request('/addresses/');
  }

  async addAddress(addressData) {
    return this.request('/addresses/', {
      method: 'POST',
      body: JSON.stringify(addressData),
    });
  }

  async updateAddress(addressId, addressData) {
    return this.request(`/addresses/${addressId}/`, {
      method: 'PUT',
      body: JSON.stringify(addressData),
    });
  }

  async deleteAddress(addressId) {
    return this.request(`/addresses/${addressId}/`, {
      method: 'DELETE',
    });
  }

  async setDefaultAddress(addressId) {
    return this.request(`/addresses/${addressId}/set-default/`, {
      method: 'POST',
    });
  }

  async getOrders() {
    return this.request('/orders/');
  }

  async getOrder(orderId) {
    return this.request(`/orders/${orderId}/`);
  }

  async createOrder(orderData) {
    return this.request('/orders/', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async cancelOrder(orderId) {
    return this.request(`/orders/${orderId}/cancel/`, {
      method: 'POST',
    });
  }

  async createOrderFromCart() {
    return this.request('/orders/create-from-cart/', {
      method: 'POST',
    });
  }

  async initiatePayment(orderId) {
    return this.request('/payments/initiate/', {
      method: 'POST',
      body: JSON.stringify({ order_id: orderId }),
    });
  }

  async verifyPayment(reference) {
    return this.request(`/payments/verify/${reference}/`);
  }

  async getOrderStatus(orderId) {
    return this.request(`/payments/status/${orderId}/`);
  }

  async getNotifications() {
    return this.request('/notifications/');
  }

  async markNotificationRead(notificationId) {
    return this.request(`/notifications/${notificationId}/read/`, {
      method: 'POST',
    });
  }

  async markAllNotificationsRead() {
    return this.request('/notifications/read-all/', {
      method: 'POST',
    });
  }

  async deleteNotification(notificationId) {
    return this.request(`/notifications/${notificationId}/delete/`, {
      method: 'DELETE',
    });
  }

  async clearAllNotifications() {
    return this.request('/notifications/clear-all/', {
      method: 'DELETE',
    });
  }

  async getQuickDeals() {
    return this.request('/quick-deals/');
  }

  async incrementQuickDealViews(dealId) {
    return this.request(`/quick-deals/${dealId}/view/`, {
      method: 'POST',
    });
  }

  async search(query, filters = {}) {
    const params = new URLSearchParams({ q: query, ...filters });
    return this.request(`/search/?${params.toString()}`);
  }

  async getTrendingProducts() {
    return this.request('/trending/');
  }

  async getSellerAnalytics() {
    return this.request('/sellers/analytics/');
  }

  async getProductQuestions(productId) {
    return this.request(`/products/${productId}/questions/`);
  }

  async submitQuestionAnswers(productId, answers) {
    return this.request(`/products/${productId}/questions/submit/`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  }

  async getSimpleNotifications() {
    return this.request('/simple-notifications/');
  }

  async markSimpleNotificationRead(notificationId) {
    return this.request(`/simple-notifications/${notificationId}/read/`, {
      method: 'POST',
    });
  }

  async markAllSimpleNotificationsRead() {
    return this.request('/simple-notifications/read-all/', {
      method: 'POST',
    });
  }

  async deleteSimpleNotification(notificationId) {
    return this.request(`/simple-notifications/${notificationId}/delete/`, {
      method: 'DELETE',
    });
  }

  async clearAllSimpleNotifications() {
    return this.request('/simple-notifications/clear-all/', {
      method: 'DELETE',
    });
  }

  async getBuyerProfile() {
    return this.request('/buyer/profile/');
  }

  async getOrderCount() {
    return this.request('/orders/count/');
  }

  async searchProducts(query, category = 'all', location = '') {
    if (typeof query === 'object') {
      const params = query;
      query = params.search || '';
      category = params.category || '';
      location = params.location || '';
    }
    
    const queryParams = new URLSearchParams();
    if (query && query.trim()) {
      queryParams.append('search', query.trim());
    }
    if (category && category !== 'all' && category !== '') {
      queryParams.append('category', category);
    }
    if (location && location.trim()) {
      queryParams.append('location', location.trim());
    }
    
    const url = `/products/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return this.request(url);
  }

  async changeEmail(newEmail, password) {
    return this.request('/change-email/', {
      method: 'POST',
      body: JSON.stringify({ new_email: newEmail, password }),
    });
  }

  async changePassword(currentPassword, newPassword) {
    return this.request('/change-password/', {
      method: 'POST',
      body: JSON.stringify({ 
        current_password: currentPassword, 
        new_password: newPassword 
      }),
    });
  }

  async getSellerProfile() {
    try {
      const token = this.getToken();
      const response = await fetch(`${API_BASE_URL}/seller/profile/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { error: true, status: response.status, data: errorData };
      }
      
      const data = await response.json();
      return { error: false, data };
    } catch (error) {
      console.error('Error in getSellerProfile:', error);
      return { error: true, message: error.message };
    }
  }

  async updateSellerTrustRating(data) {
    return this.request('/sellers/rate/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getOrderDetail(orderId) {
    return this.request(`/orders/${orderId}/`);
  }

  async rateSeller(ratingData) {
    console.log('========== API: RATE SELLER ==========');
    console.log('Sending rating data:', ratingData);
    
    try {
      const response = await this.request('/sellers/rate/', {
        method: 'POST',
        body: JSON.stringify(ratingData),
      });
      
      console.log('Rate seller response:', response);
      console.log('========== API RATE COMPLETE ==========');
      
      return response;
    } catch (error) {
      console.error('Error in rateSeller:', error);
      return { error: true, message: error.message };
    }
  }

  async getSellerQuickDeals() {
    return this.request('/seller/quick-deals/');
  }

  async createQuickDeal(dealData) {
    const token = this.getToken();
    
    if (dealData.picture instanceof File) {
      const formData = new FormData();
      formData.append('product_id', dealData.product_id);
      formData.append('caption', dealData.caption || '');
      formData.append('priority', dealData.priority || 0);
      if (dealData.picture) {
        formData.append('picture', dealData.picture);
      }
      
      try {
        const response = await fetch(`${API_BASE_URL}/seller/quick-deals/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });
        
        const data = await response.json();
        if (!response.ok) {
          return { error: true, status: response.status, data };
        }
        return { data, status: response.status };
      } catch (error) {
        console.error('Create quick deal error:', error);
        return { error: true, message: error.message };
      }
    } else {
      return this.request('/seller/quick-deals/', {
        method: 'POST',
        body: JSON.stringify(dealData),
      });
    }
  }

  async deleteQuickDeal(dealId) {
    return this.request(`/seller/quick-deals/${dealId}/`, {
      method: 'DELETE',
    });
  }

  async updateQuickDeal(dealId, dealData) {
    const token = this.getToken();
    
    if (dealData.picture instanceof File) {
      const formData = new FormData();
      if (dealData.product_id) formData.append('product_id', dealData.product_id);
      if (dealData.caption !== undefined) formData.append('caption', dealData.caption);
      if (dealData.priority !== undefined) formData.append('priority', dealData.priority);
      if (dealData.picture) formData.append('picture', dealData.picture);
      
      try {
        const response = await fetch(`${API_BASE_URL}/seller/quick-deals/${dealId}/`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });
        
        const data = await response.json();
        if (!response.ok) {
          return { error: true, status: response.status, data };
        }
        return { data, status: response.status };
      } catch (error) {
        console.error('Update quick deal error:', error);
        return { error: true, message: error.message };
      }
    } else {
      return this.request(`/seller/quick-deals/${dealId}/`, {
        method: 'PUT',
        body: JSON.stringify(dealData),
      });
    }
  }

  async initiatePayment(orderId, phoneNumber) {
    const token = this.getToken();
    return this.request('/payments/initiate/', {
      method: 'POST',
      body: JSON.stringify({ order_id: orderId, phone_number: phoneNumber }),
    });
  }

  async checkOrderStatus(orderId) {
    return this.request(`/payments/status/${orderId}/`);
  }

  async getChatInbox() {
    return this.request('/chat/inbox/');
  }

  async getChatHistory(userId) {
    console.log(`Fetching chat history for user ID: ${userId}`);
    try {
      const response = await this.request(`/chat/${userId}/`);
      console.log('Chat history response:', response);
      
      if (response.error) {
        return { error: true, data: [] };
      }
      
      if (Array.isArray(response.data)) {
        return { data: response.data, error: false };
      }
      
      if (response.data && Array.isArray(response.data.data)) {
        return { data: response.data.data, error: false };
      }
      
      if (response.data && Array.isArray(response.data.messages)) {
        return { data: response.data.messages, error: false };
      }
      
      return { data: [], error: false };
    } catch (error) {
      console.error('Error fetching chat history:', error);
      return { error: true, data: [], message: error.message };
    }
  }

  async getSellerUserID(sellerProfileId) {
    return this.request(`/sellers/${sellerProfileId}/`);
  }

  async sendChatMessage(recipientId, content) {
    return this.request('/chat/send/', {
      method: 'POST',
      body: JSON.stringify({ recipient_id: recipientId, content }),
    });
  }

  async markMessagesAsRead(senderId) {
    return this.request('/chat/mark-read/', {
      method: 'POST',
      body: JSON.stringify({ sender_id: senderId }),
    });
  }

  getWebSocketURL() {
    const token = this.getToken();
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname || 'localhost';
    const port = '8000';
    return `${protocol}//${host}:${port}/ws/?token=${token}`;
  }

  setupWebSocket(onMessage, onOpen, onClose, onError) {
    const wsUrl = this.getWebSocketURL();
    console.log('Connecting to WebSocket:', wsUrl);
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      if (onOpen) onOpen();
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);
        if (onMessage) onMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
      if (onClose) onClose();
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (onError) onError(error);
    };
    
    return ws;
  }

  async getSellerUserInfo(sellerId) {
    console.log(`Getting user info for seller profile ID: ${sellerId}`);
    const response = await this.request(`/sellers/${sellerId}/`);
    
    if (!response.error && response.data) {
      const seller = response.data;
      const userId = seller.user?.id || seller.user_id;
      console.log(`Seller ${sellerId} maps to user ID: ${userId}`);
      return { userId, seller };
    }
    
    return { userId: null, seller: null };
  }
}

const api = new Api();
export default api;