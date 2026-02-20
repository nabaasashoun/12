from django.urls import path, include
from rest_framework.routers import DefaultRouter
from products.views.feeds import ProductFeedViewSet
from . import views

router = DefaultRouter()
router.register(r'products', views.ProductViewSet)
router.register(r'wishlist', views.WishlistViewSet, basename='wishlist')
router.register(r'sellers', views.SellerViewSet)
router.register(r'categories', views.CategoryViewSet, basename='category')
router.register(r'products/feed', ProductFeedViewSet, basename='product-feed')

urlpatterns = [
    path('', include(router.urls)),
    path('cart/', views.CartView.as_view()),
    path('cart/merge/', views.merge_cart),
    path('categories/', views.category_list, name='category_list'),
    path('login/', views.login_view, name='login'),
    path('verify-token/', views.verify_token_view, name='verify_token'),
    path('register/buyer/', views.BuyerRegisterView.as_view()),
    path('register/seller/', views.SellerRegisterView.as_view()),

    # Like URLs
    path('liked-products/', views.LikedProductsView.as_view(), name='liked-products'),
    path('products/<int:product_id>/toggle-like/', views.toggle_product_like, name='toggle-product-like'),
    path('products/<int:product_id>/check-like/', views.check_product_like, name='check-product-like'),

    # Cart URLs
    path('cart/items/', views.get_cart_items, name='get-cart-items'),
    path('cart/add/', views.add_to_cart, name='add-to-cart'),
    path('cart/remove/<int:product_id>/', views.remove_from_cart, name='remove-from-cart'),
    path('cart/update/<int:product_id>/', views.update_cart_item, name='update-cart-item'),
    path('cart/clear/', views.clear_cart, name='clear-cart'),

    # Public quick deals
    path('quick-deals/', views.get_quick_deals, name='quick-deals'),
    path('quick-deals/<int:deal_id>/view/', views.increment_quickdeal_views, name='increment-quickdeal-views'),

    # Seller endpoints
    path('seller/profile/', views.SellerProfileView.as_view(), name='seller-profile'),
    path('seller/products/', views.SellerProductListCreateView.as_view(), name='seller-products'),
    path('seller/products/<int:pk>/', views.SellerProductDetailView.as_view(), name='seller-product-detail'),
    path('seller/orders/', views.SellerOrderListView.as_view(), name='seller-orders'),
    path('seller/quick-deals/', views.SellerQuickDealListCreateView.as_view(), name='seller-quick-deals'),
    path('seller/quick-deals/<int:pk>/', views.SellerQuickDealDetailView.as_view(), name='seller-quickdeal-detail'),
    path('seller/stats/', views.SellerStatsView.as_view(), name='seller-stats'),

    # Wishlist (buyer)
    path('wishlist/', views.get_wishlist, name='get-wishlist'),
    path('wishlist/add/', views.add_to_wishlist, name='add-to-wishlist'),
    path('wishlist/remove/<int:product_id>/', views.remove_from_wishlist, name='remove-from-wishlist'),
    path('wishlist/toggle/<int:product_id>/', views.toggle_wishlist, name='toggle-wishlist'),

    # Buyer profile & order count
    path('buyer/profile/', views.get_buyer_profile, name='get-buyer-profile'),
    path('orders/count/', views.get_order_count, name='order-count'),
    
    # comments
    path('comments/<int:comment_id>/', views.comment_detail, name='comment-detail'),
    path('comments/<int:comment_id>/helpful/', views.mark_helpful, name='comment-helpful'),

]

urlpatterns += router.urls