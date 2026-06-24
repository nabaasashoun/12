# views/__init__.py

from .auth_views import (
    google_login,
    google_callback,
    login_view,
    verify_token_view,
    BuyerRegisterView,
    SellerRegisterView,
)

# Import other view functions from your main views.py
from ..views import (
    # Product views
    ProductViewSet,
    LikedProductsView,
    toggle_product_like,
    check_product_like,
    get_quick_deals,
    increment_quickdeal_views,
    comment_detail,
    mark_helpful,
    
    # Cart views
    get_cart_items,
    add_to_cart,
    remove_from_cart,
    update_cart_item,
    clear_cart,
    merge_cart,
    create_order_from_cart,
    CartView,
    
    # Wishlist views
    get_wishlist,
    add_to_wishlist,
    remove_from_wishlist,
    toggle_wishlist,
    WishlistViewSet,
    
    # Seller views
    SellerViewSet,
    SellerProfileView,
    SellerProductListCreateView,
    SellerProductDetailView,
    SellerOrderListView,
    SellerQuickDealListCreateView,
    SellerQuickDealDetailView,
    SellerStatsView,
    update_seller_location,
    
    # Order views
    get_orders,
    get_order_detail,
    get_order_count,
    
    # Notification views
    get_simple_notifications,
    mark_simple_notification_read,
    delete_simple_notification,
    clear_simple_notifications,
    mark_all_simple_notifications_read,
    
    # Chat views
    get_chat_inbox,
    get_chat_history,
    mark_chat_read,
    test_send_message,
    
    # Report views
    create_report,
    get_reports,
    get_report_detail,
    update_report_status,
    get_my_reports,
    
    # Other views
    get_locations,
    rate_seller,
    get_categories,
    category_list,
    buyer_profile_detail,
    change_email,
    change_password,
    toggle_follow_seller,
    CategoryViewSet,
)