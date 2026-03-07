const API_BASE_URL = 'http://localhost:8000/api';

class Api {
  getToken() {
    return localStorage.getItem('accessToken');
  }

  getRefreshToken() {
    return localStorage.getItem('refreshToken');
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
        if (response.status === 401) {
          const refreshed = await this.refreshToken();
          if (refreshed) {
            return this.request(endpoint, options);
          } else {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            localStorage.removeItem('userRole');
            window.location.href = '/login';
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
      const response = await fetch(`${API_BASE_URL}/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('accessToken', data.access);
        return true;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
    }
    return false;
  }

  async login(username, password) {
    return this.request('/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      public: true,
    });
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
    localStorage.removeItem('refreshToken');
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
      } else if (productData[key] !== null && productData[key] !== undefined) {
        formData.append(key, productData[key]);
      }
    });

    return fetch(`${API_BASE_URL}/products/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getToken()}`,
      },
      body: formData,
    }).then(async response => {
      const data = await response.json();
      if (!response.ok) {
        return { error: true, status: response.status, data };
      }
      return { data, status: response.status };
    });
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

    // Add to cart
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

  // Remove from cart
  async removeFromCart(productId) {
    return this.request(`/cart/remove/${productId}/`, {
      method: 'DELETE',
    });
  }

  // Update cart item
  async updateCartItem(productId, quantity, answers = null) {
    const body = {};
    if (quantity !== undefined) body.quantity = quantity;
    if (answers !== null) body.answers = answers;
    
    return this.request(`/cart/update/${productId}/`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  // Get cart items
  async getCart() {
    return this.request('/cart/items/');
  }

  // Clear cart
  async clearCart() {
    return this.request('/cart/clear/', {
      method: 'DELETE',
    });
  }

  async getSeller(sellerId) {
    return this.request(`/sellers/${sellerId}/`);
  }

  async getCurrentSeller() {
    return this.request('/sellers/me/');
  }

  async updateSellerProfile(sellerData) {
    return this.request('/sellers/me/', {
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

  // Order methods
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

  // Payment methods
  async initiatePayment(orderId) {
    return this.request('/payments/initiate/', {
      method: 'POST',
      body: JSON.stringify({ 
        order_id: orderId 
      }),
    });
  }

  async verifyPayment(reference) {
    return this.request(`/payments/verify/${reference}/`);
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

  // Simple Notifications
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
}

const api = new Api();
export default api;