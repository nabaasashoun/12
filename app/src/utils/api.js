const API_BASE_URL = 'http://localhost:8000/api';

class Api {
  getToken() {
    // Try both possible token keys
    return localStorage.getItem('accessToken') || localStorage.getItem('access');
  }

  getRefreshToken() {
    // Try both possible refresh token keys
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

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = options.headers || this.getHeaders(!options.public);
    
    try {
      console.log(`API Request: ${options.method || 'GET'} ${url}`);
      
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
      
      return { data, status: response.status };
    } catch (error) {
      console.error('API request error:', error);
      return { error: true, message: error.message };
    }
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
        // Store new access token in both possible locations
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
    
    // If login successful, store tokens in both locations for consistency
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

  async searchProducts(query, category = 'all') {
    const params = new URLSearchParams();
    if (query) params.append('search', query);
    if (category && category !== 'all') params.append('category', category);
    return this.request(`/products/?${params.toString()}`);
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

  async updateBuyerProfile(profileData) {
    console.log('========== API: UPDATE BUYER PROFILE ==========');
    console.log('Sending profile data:', profileData);
    
    try {
      const response = await this.request('/buyer/profile/', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });
      
      console.log('API Response:', response);
      console.log('========== API UPDATE COMPLETE ==========');
      
      return response;
    } catch (error) {
      console.error('API Error in updateBuyerProfile:', error);
      return { error: true, message: error.message };
    }
  }

  // Get seller profile
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

  // Update seller profile
  async updateSellerProfile(profileData) {
    console.log('========== SELLER PROFILE UPDATE ==========');
    console.log('Sending profile data:', profileData);
    
    try {
      const token = this.getToken();
      console.log('Token present:', !!token);
      
      // Log the exact payload being sent
      const payload = JSON.stringify(profileData);
      console.log('Payload:', payload);
      
      const response = await fetch(`${API_BASE_URL}/seller/profile/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: payload
      });
      
      console.log('Response status:', response.status);
      
      // Try to get the response body
      const responseText = await response.text();
      console.log('Response text:', responseText);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = { error: 'Invalid JSON response', raw: responseText };
      }
      
      if (!response.ok) {
        console.error('Error response data:', responseData);
        return { error: true, status: response.status, data: responseData };
      }
      
      console.log('Success response:', responseData);
      console.log('========== UPDATE COMPLETE ==========');
      
      return { error: false, data: responseData };
    } catch (error) {
      console.error('Error in updateSellerProfile:', error);
      return { error: true, message: error.message };
    }
  }

  async updateSellerTrustRating(data) {
    return this.request('/sellers/rate/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  async getOrders() {
    return this.request('/orders/');
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
}

const api = new Api();
export default api;