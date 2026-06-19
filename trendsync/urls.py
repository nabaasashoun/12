# urls.py - Fixed version

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'products', views.ProductViewSet)
router.register(r'wishlist', views.WishlistViewSet, basename='wishlist')
router.register(r'sellers', views.SellerViewSet)
router.register(r'categories', views.CategoryViewSet, basename='category')

urlpatterns = [
    # ===== MOVED LOCATIONS HERE - BEFORE the router include =====
    path('locations/', views.get_locations, name='get-locations'),
    
    # ===== Everything else after =====
    path('sellers/rate/', views.rate_seller, name='rate-seller'),
    path('', include(router.urls)),  # Router is now AFTER locations

    path('cart/', views.CartView.as_view()),
    path('cart/merge/', views.merge_cart),
    path('categories/', views.category_list, name='category_list'),
    path('login/', views.login_view, name='login'),
    path('verify-token/', views.verify_token_view, name='verify_token'),
    path('register/buyer/', views.BuyerRegisterView.as_view()),
    path('register/seller/', views.SellerRegisterView.as_view()),

    path('liked-products/', views.LikedProductsView.as_view(), name='liked-products'),
    path('products/<int:product_id>/toggle-like/', views.toggle_product_like, name='toggle-product-like'),
    path('products/<int:product_id>/check-like/', views.check_product_like, name='check-product-like'),

    path('cart/items/', views.get_cart_items, name='get-cart-items'),
    path('cart/add/', views.add_to_cart, name='add-to-cart'),
    path('cart/remove/<int:product_id>/', views.remove_from_cart, name='remove-from-cart'),
    path('cart/update/<int:product_id>/', views.update_cart_item, name='update-cart-item'),
    path('cart/clear/', views.clear_cart, name='clear-cart'),

    path('quick-deals/', views.get_quick_deals, name='quick-deals'),
    path('quick-deals/<int:deal_id>/view/', views.increment_quickdeal_views, name='increment-quickdeal-views'),

    path('seller/profile/', views.SellerProfileView.as_view(), name='seller-profile'),
    path('seller/products/', views.SellerProductListCreateView.as_view(), name='seller-products'),
    path('seller/products/<int:pk>/', views.SellerProductDetailView.as_view(), name='seller-product-detail'),
    path('seller/orders/', views.SellerOrderListView.as_view(), name='seller-orders'),
    path('seller/quick-deals/', views.SellerQuickDealListCreateView.as_view(), name='seller-quick-deals'),
    path('seller/quick-deals/<int:pk>/', views.SellerQuickDealDetailView.as_view(), name='seller-quickdeal-detail'),
    path('seller/stats/', views.SellerStatsView.as_view(), name='seller-stats'),

    path('wishlist/', views.get_wishlist, name='get-wishlist'),
    path('wishlist/add/', views.add_to_wishlist, name='add-to-wishlist'),
    path('wishlist/remove/<int:product_id>/', views.remove_from_wishlist, name='remove-from-wishlist'),
    path('wishlist/toggle/<int:product_id>/', views.toggle_wishlist, name='toggle-wishlist'),

    path('orders/count/', views.get_order_count, name='order-count'),
    path('orders/create-from-cart/', views.create_order_from_cart, name='create-order-from-cart'),
    
    path('comments/<int:comment_id>/', views.comment_detail, name='comment-detail'),
    path('comments/<int:comment_id>/helpful/', views.mark_helpful, name='comment-helpful'),

    path('sellers/<int:seller_id>/follow/', views.toggle_follow_seller, name='toggle-follow-seller'),    
    
    path('simple-notifications/', views.get_simple_notifications, name='simple-notifications'),
    path('simple-notifications/<int:notification_id>/read/', views.mark_simple_notification_read, name='simple-notification-read'),
    path('simple-notifications/read-all/', views.mark_all_simple_notifications_read, name='simple-notifications-read-all'),
    path('simple-notifications/<int:notification_id>/delete/', views.delete_simple_notification, name='simple-notification-delete'),
    path('simple-notifications/clear-all/', views.clear_simple_notifications, name='simple-notifications-clear'),

    path('buyer/profile/', views.buyer_profile_detail, name='buyer-profile-detail'),
    path('change-email/', views.change_email, name='change-email'),
    path('change-password/', views.change_password, name='change-password'),
    path('orders/', views.get_orders, name='get-orders'),
    path('orders/<int:order_id>/', views.get_order_detail, name='order-detail'),
    path('payments/callback/', views.dusupay_callback, name='dusupay-callback'),
    path('seller/location/update/', views.update_seller_location, name='update-seller-location'),
    
    # Chat APIs
    path('chat/inbox/', views.get_chat_inbox, name='chat-inbox'),
    path('chat/<int:user_id>/', views.get_chat_history, name='chat-history'),
]