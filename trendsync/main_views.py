from rest_framework import viewsets, generics, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from .models import Product, Report, Buyer, Order, Category, Address, Cart, CartItem, ProductLike, ProductComment, Wishlist, WishlistItem, Seller, QuickDeal
from .serializers import (
    ProductSerializer, CategorySerializer, WishlistItemSerializer, CartSerializer,
    CartItemSerializer, ReportSerializer, ProductCommentSerializer, SellerSerializer, BuyerRegisterSerializer,
    SellerRegisterSerializer, QuickDealSerializer, ReportCreateSerializer, SellerProfileSerializer, SellerProductSerializer,
    SellerOrderSerializer, SellerQuickDealSerializer, SellerStatsSerializer )
from django.db.models.functions import Coalesce
from django.db.models import Q, Count, Avg, F, Min, Max, DecimalField 
from django.db.models.functions import Coalesce
from decimal import Decimal
from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Product, Category, Seller, Buyer, ProductComment, Report
from .serializers import ProductSerializer, CategorySerializer

from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.db.models import Q
import traceback 
from django.db import models
from .utils import reverse_geocode
from django.db.models import Avg
import json
import logging
from .serializers import InitiatePaymentSerializer, DusuPayWebhookSerializer
logger = logging.getLogger("dusupay")
from django.shortcuts import get_object_or_404
from .permissions import IsSeller, IsBuyer, IsOwner
from rest_framework import filters
from django.shortcuts import redirect
from django.conf import settings
from .models import DusuPayConfig, Payment, OrderItem, CommentHelpful
from .serializers import (
    InitiatePaymentSerializer,
    RefundSerializer,
    CancelOrderSerializer,
)
from . import dusupay_utils
from django.db import transaction
from .models import SellerFollow
from django_filters.rest_framework import DjangoFilterBackend  
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .models import Notification
from .serializers import NotificationSerializer
import logging
from .dusupay_utils import DusuPayClient
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse
from .models import DusuPayConfig
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
dusupay_client = DusuPayClient()

def get_user_profile_photo(user, request=None):
    """Get profile photo URL reliably with multiple fallbacks"""
    if not user:
        return None
    
    profile_photo = None
    
    # Try Seller profile
    if hasattr(user, 'seller_profile') and user.seller_profile:
        if user.seller_profile.profile_photo:
            try:
                if request:
                    profile_photo = request.build_absolute_uri(user.seller_profile.profile_photo.url)
                else:
                    profile_photo = user.seller_profile.profile_photo.url
            except:
                pass
    
    # Try Buyer profile (if not found in seller)
    if not profile_photo and hasattr(user, 'buyer_profile') and user.buyer_profile:
        if user.buyer_profile.profile_photo:
            try:
                if request:
                    profile_photo = request.build_absolute_uri(user.buyer_profile.profile_photo.url)
                else:
                    profile_photo = user.buyer_profile.profile_photo.url
            except:
                pass
    
    # If no profile photo found, return None (frontend will use default)
    return profile_photo


def get_user_display_name(user):
    """
    Get the display name for a user.
    """
    if not user:
        return 'User'
    
    if hasattr(user, 'seller_profile') and user.seller_profile:
        return user.seller_profile.name or user.username
    elif hasattr(user, 'buyer_profile') and user.buyer_profile:
        return user.buyer_profile.name or user.username
    return user.username

def create_profile_notification(user, field_name):
    """
    Create a simple notification when a user updates their profile
    Uses SimpleNotification model just like follower notifications
    """
    from .models import SimpleNotification
    
    field_display_names = {
        'name': 'name',
        'email': 'email address',
        'password': 'password',
        'contact': 'phone number',
        'location': 'location',
        'profile': 'profile information'
    }
    
    display_name = field_display_names.get(field_name, field_name)
    
    # Create notification just like the follower notification
    SimpleNotification.objects.create(
        recipient=user,
        sender_name='System',
        message=f'You have successfully edited your {display_name}',
        type='profile_update'  
    )
    print(f"✓ Profile update notification created for {user.username}: {display_name}")

def create_seller_profile_notification(user, field_name):
    """
    Create a simple notification when a seller updates their profile
    Uses SimpleNotification model
    """
    from .models import SimpleNotification
    
    field_display_names = {
        'name': 'business name',
        'email': 'email address',
        'password': 'password',
        'contact': 'phone number',
        'location': 'location',
        'about': 'business description',
        'nin_number': 'NIN number',
        'profile': 'profile information'
    }
    
    display_name = field_display_names.get(field_name, field_name)
    
    # Create notification for the seller
    SimpleNotification.objects.create(
        recipient=user,
        sender_name='System',
        message=f'You have successfully edited your {display_name}',
        type='profile_update'
    )
    print(f"✓ Seller profile update notification created for {user.username}: {display_name}")

def get_cart(request):
    if request.user.is_authenticated and hasattr(request.user, 'buyer_profile'):
        buyer = request.user.buyer_profile
        carts = Cart.objects.filter(buyer=buyer)
        if carts.exists():
            if carts.count() > 1:
                primary_cart = carts.first()
                for extra_cart in carts[1:]:
                    for item in extra_cart.items.all():
                        cart_item, created = CartItem.objects.get_or_create(
                            cart=primary_cart,
                            product=item.product,
                            defaults={'quantity': item.quantity, 'answers': item.answers}
                        )
                        if not created:
                            cart_item.quantity += item.quantity
                            cart_item.save()
                    extra_cart.delete()
                return primary_cart
            else:
                return carts.first()
        else:
            return Cart.objects.create(buyer=buyer)
    else:
        session_key = request.session.session_key or request.session.create()
        carts = Cart.objects.filter(session_key=session_key)
        if carts.exists():
            if carts.count() > 1:
                primary_cart = carts.first()
                for extra_cart in carts[1:]:
                    for item in extra_cart.items.all():
                        cart_item, created = CartItem.objects.get_or_create(
                            cart=primary_cart,
                            product=item.product,
                            defaults={'quantity': item.quantity, 'answers': item.answers}
                        )
                        if not created:
                            cart_item.quantity += item.quantity
                            cart_item.save()
                    extra_cart.delete()
                return primary_cart
            else:
                return carts.first()
        else:
            return Cart.objects.create(session_key=session_key)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsBuyer])
def create_order_from_cart(request):
    cart = get_cart(request)
    if not cart.items.exists():
        return Response({'error': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)

    buyer = request.user.buyer_profile
    total_amount = sum(item.subtotal() for item in cart.items.all())

    # Use default address or create one
    address = buyer.addresses.filter(is_default=True).first()
    if not address:
        address = Address.objects.create(
            buyer=buyer,
            recipient_name=buyer.name or 'Buyer',
            phone=buyer.contact or '0000000000',
            street='Temporary Address',
            city='Kampala',
            state='Central',
            country='Uganda',
            iso_country_code='UG',
            postal_code='',
            is_default=True
        )
        logger.info(f"Temporary address created for buyer {buyer.id}")

    order = Order.objects.create(
        buyer=buyer,
        total_amount=total_amount,
        status='pending',
        delivery_address=address,
    )

    for cart_item in cart.items.all():
        OrderItem.objects.create(
            order=order,
            product=cart_item.product,
            quantity=cart_item.quantity,
            unit_price=cart_item.product.unit_price,
            subtotal=cart_item.subtotal()
        )

    cart.items.all().delete()

    return Response({'order_id': order.id}, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_categories(request):
    categories = Category.objects.all().order_by('name')
    data = [{'id': cat.id, 'name': cat.name} for cat in categories]
    return Response(data)


@api_view(['GET'])
@permission_classes([AllowAny])
def category_list(request):
    try:
        categories = Category.objects.all().order_by('name')
        if categories.exists():
            data = [{'id': cat.id, 'name': cat.name} for cat in categories]
            return Response(data)
        else:
            return Response([])
    except Exception as e:
        print(f"Error fetching categories: {e}")
        return Response([])


class CartView(generics.GenericAPIView):
    permission_classes = [AllowAny]

    def get(self, request):
        cart = get_cart(request)
        serializer = CartSerializer(cart)
        return Response(serializer.data)


class WishlistViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if not hasattr(self.request.user, 'buyer_profile'):
            return []
        wishlist, _ = Wishlist.objects.get_or_create(buyer=self.request.user.buyer_profile)
        return [item.product for item in wishlist.wishlistitem_set.all()]

    @action(detail=False, methods=['post'])
    def add(self, request):
        if not hasattr(request.user, 'buyer_profile'):
            return Response({"error": "Sellers cannot maintain wishlists."}, status=status.HTTP_403_FORBIDDEN)
        product_id = request.data.get('product_id')
        product = Product.objects.get(id=product_id)
        wishlist, _ = Wishlist.objects.get_or_create(buyer=request.user.buyer_profile)
        WishlistItem.objects.get_or_create(wishlist=wishlist, product=product)
        return Response({'status': 'added to wishlist'})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def merge_cart(request):
    session_key = request.session.session_key
    if not session_key:
        return Response({"detail": "No session"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        guest_cart = Cart.objects.get(session_key=session_key, buyer=None)
    except Cart.DoesNotExist:
        return Response({"detail": "No guest cart found"}, status=status.HTTP_200_OK)

    buyer = request.user.buyer_profile
    buyer_cart, _ = Cart.objects.get_or_create(buyer=buyer)

    for item in guest_cart.items.all():
        cart_item, created = CartItem.objects.get_or_create(
            cart=buyer_cart,
            product=item.product,
            defaults={'quantity': item.quantity}
        )
        if not created:
            cart_item.quantity += item.quantity
            cart_item.save()

    guest_cart.delete()
    return Response({"detail": "Cart merged successfully"}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def custom_jwt_login(request):
    username_or_email = request.data.get('username')
    password = request.data.get('password')

    if '@' in username_or_email:
        user_obj = User.objects.filter(email=username_or_email).order_by('id').first()
    else:
        user_obj = User.objects.filter(username=username_or_email).first()

    if not user_obj:
        return Response({'error': 'User not found'}, status=400)
    username = user_obj.username

    user = authenticate(username=username, password=password)

    if user:
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            }
        })
    return Response({'error': 'Invalid credentials'}, status=401)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]



class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['name', 'description']
    filterset_fields = ['category']

    def perform_create(self, serializer):
        if not hasattr(self.request.user, 'seller_profile'):
            raise permissions.PermissionDenied("Only sellers can create products")
        serializer.save(seller=self.request.user.seller_profile)

    def get_queryset(self):
        queryset = Product.objects.all()
        if hasattr(self.request.user, 'seller_profile'):
            if self.action in ['update', 'partial_update', 'destroy']:
                queryset = Product.objects.filter(seller=self.request.user.seller_profile)
        
        location = self.request.query_params.get('location')
        if location and location.lower() != 'all':
            queryset = queryset.filter(seller__location__icontains=location)
            
        return queryset

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def like(self, request, pk=None):
        product = self.get_object()
        buyer = request.user.buyer_profile
        like, created = ProductLike.objects.get_or_create(product=product, buyer=buyer)
        if created:
            product.like_count += 1
            product.save()
        return Response({'status': 'liked' if created else 'already liked'})

    @action(detail=True, methods=['get', 'post'], permission_classes=[AllowAny])
    def comments(self, request, pk=None):
        product = self.get_object()
        if request.method == 'GET':
            comments = product.comments.all().order_by('-created_at')
            serializer = ProductCommentSerializer(comments, many=True, context={'request': request})
            return Response(serializer.data)
        elif request.method == 'POST':
            if not request.user.is_authenticated:
                return Response({'error': 'Authentication required'}, status=401)
            try:
                buyer = request.user.buyer_profile
            except AttributeError:
                return Response({'error': 'Buyer profile required'}, status=403)

            serializer = ProductCommentSerializer(data=request.data, context={'request': request})
            if serializer.is_valid():
                serializer.save(product=product, buyer=buyer)
                return Response(serializer.data, status=201)
            return Response(serializer.errors, status=400)

    @action(detail=True, methods=['get'])
    def related(self, request, pk=None):
        try:
            product = self.get_object()
            category = product.category
            related_products = Product.objects.filter(category=category).exclude(id=product.id)[:6]

            if related_products.count() < 4:
                other_products = Product.objects.exclude(
                    Q(id=product.id) | Q(category=category)
                )[:6 - related_products.count()]
                related_products = list(related_products) + list(other_products)

            serializer = self.get_serializer(related_products, many=True)
            return Response(serializer.data)
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)


class BuyerRegisterView(generics.CreateAPIView):
    serializer_class = BuyerRegisterSerializer
    permission_classes = [AllowAny]


class SellerRegisterView(generics.CreateAPIView):
    serializer_class = SellerRegisterSerializer
    permission_classes = [AllowAny]


class SellerViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Seller.objects.all()
    serializer_class = SellerSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    try:
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response({'error': 'Please provide username and password'}, status=400)

        if '@' in username:
            user_obj = User.objects.filter(email=username).order_by('id').first()
            if not user_obj:
                return Response({'error': 'Invalid credentials'}, status=401)
            username = user_obj.username

        user = authenticate(username=username, password=password)

        if user is not None:
            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'is_seller': hasattr(user, 'seller_profile'),
                    'is_buyer': hasattr(user, 'buyer_profile'),
                }
            })
        return Response({'error': 'Invalid credentials'}, status=401)
    except Exception as e:
        print(f"Login error: {str(e)}")
        print(traceback.format_exc())
        return Response({'error': 'Server error. Please try again.'}, status=500)


@api_view(['GET'])
def verify_token_view(request):
    return Response({
        'user': {
            'id': request.user.id,
            'username': request.user.username,
            'email': request.user.email,
            'is_seller': hasattr(request.user, 'seller_profile'),
            'is_buyer': hasattr(request.user, 'buyer_profile'),
        }
    })


class LikedProductsView(generics.ListAPIView):
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if not hasattr(self.request.user, 'buyer_profile'):
            return Product.objects.none()
        buyer = self.request.user.buyer_profile
        liked_product_ids = ProductLike.objects.filter(buyer=buyer).values_list('product_id', flat=True)
        return Product.objects.filter(id__in=liked_product_ids)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def toggle_product_like(request, product_id):
    try:
        if not hasattr(request.user, 'buyer_profile'):
            return Response({"error": "Sellers cannot like products."}, status=403)
        buyer = request.user.buyer_profile
        product = Product.objects.get(id=product_id)

        like_exists = ProductLike.objects.filter(product=product, buyer=buyer).exists()

        if like_exists:
            ProductLike.objects.filter(product=product, buyer=buyer).delete()
            product.like_count -= 1
            product.save()
            return Response({
                'status': 'unliked',
                'liked': False,
                'like_count': product.like_count
            }, status=status.HTTP_200_OK)
        else:
            ProductLike.objects.create(product=product, buyer=buyer)
            product.like_count += 1
            product.save()
            return Response({
                'status': 'liked',
                'liked': True,
                'like_count': product.like_count
            }, status=status.HTTP_201_CREATED)

    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def check_product_like(request, product_id):
    try:
        buyer = request.user.buyer_profile
        is_liked = ProductLike.objects.filter(product_id=product_id, buyer=buyer).exists()
        return Response({'product_id': product_id, 'is_liked': is_liked})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def add_to_cart(request):
    product_id = request.data.get('product_id')
    quantity = request.data.get('quantity', 1)
    answers = request.data.get('answers', {})

    if not product_id:
        return Response({'error': 'Product ID is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        product = Product.objects.get(id=product_id)
        
        # Validate quantity against product limits
        if quantity < product.min_order:
            return Response({
                'error': f'Minimum order quantity is {product.min_order}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if quantity > product.max_order:
            return Response({
                'error': f'Maximum order quantity is {product.max_order}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if quantity > product.stock_quantity:
            return Response({
                'error': f'Only {product.stock_quantity} items available in stock'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        cart = get_cart(request)

        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={'quantity': quantity, 'answers': answers}
        )

        if not created:
            new_quantity = cart_item.quantity + quantity
            
            # Check if new total would exceed max_order
            if new_quantity > product.max_order:
                return Response({
                    'error': f'Cannot add {quantity} more. Maximum allowed per order is {product.max_order}. You already have {cart_item.quantity} in cart.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if new_quantity > product.stock_quantity:
                return Response({
                    'error': f'Cannot add {quantity} more. Only {product.stock_quantity} available in stock.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            cart_item.quantity = new_quantity
            if answers:
                cart_item.answers.update(answers)
            cart_item.save()

        return Response({
            'status': 'success',
            'cart_item_id': cart_item.id,
            'quantity': cart_item.quantity,
            'answers': cart_item.answers
        }, status=status.HTTP_200_OK)

    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
@permission_classes([AllowAny])
def remove_from_cart(request, product_id):
    try:
        cart = get_cart(request)
        cart_item = CartItem.objects.get(cart=cart, product_id=product_id)
        cart_item.delete()
        return Response({'status': 'success', 'message': 'Product removed from cart'}, status=status.HTTP_200_OK)
    except CartItem.DoesNotExist:
        return Response({'error': 'Product not in cart'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@permission_classes([AllowAny])
def update_cart_item(request, product_id):
    quantity = request.data.get('quantity')
    answers = request.data.get('answers')

    if quantity is None and answers is None:
        return Response({'error': 'Nothing to update'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        cart = get_cart(request)
        cart_item = CartItem.objects.get(cart=cart, product_id=product_id)

        if quantity is not None:
            cart_item.quantity = quantity
        if answers is not None:
            cart_item.answers = answers

        cart_item.save()
        return Response({
            'status': 'success',
            'message': 'Cart item updated',
            'quantity': cart_item.quantity,
            'answers': cart_item.answers,
            'subtotal': cart_item.subtotal()
        }, status=status.HTTP_200_OK)
    except CartItem.DoesNotExist:
        return Response({'error': 'Product not in cart'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_cart_items(request):
    cart = get_cart(request)
    serializer = CartSerializer(cart)
    return Response(serializer.data)


@api_view(['DELETE'])
@permission_classes([AllowAny])
def clear_cart(request):
    cart = get_cart(request)
    cart.items.all().delete()
    return Response({'status': 'success', 'message': 'Cart cleared successfully'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_quick_deals(request):
    try:
        quick_deals = QuickDeal.objects.filter(
            is_active=True,
            expires_at__gt=timezone.now()
        ).select_related('product').order_by('-timestamp')[:12]

        serializer = QuickDealSerializer(quick_deals, many=True, context={'request': request})
        return Response({
            'status': 'success',
            'count': quick_deals.count(),
            'deals': serializer.data
        })
    except Exception as e:
        print("!!! ERROR in get_quick_deals:")
        traceback.print_exc()
        return Response(
            {'status': 'error', 'message': 'Failed to fetch quick deals'},
            status=500
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def increment_quickdeal_views(request, deal_id):
    try:
        quick_deal = QuickDeal.objects.get(id=deal_id)
        quick_deal.increment_views()
        return Response({'status': 'success', 'message': 'View count updated', 'views': quick_deal.views}, status=status.HTTP_200_OK)
    except QuickDeal.DoesNotExist:
        return Response({'status': 'error', 'message': 'Quick deal not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'status': 'error', 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_wishlist(request):
    try:
        buyer = request.user.buyer_profile
        wishlist, _ = Wishlist.objects.get_or_create(buyer=buyer)

        wishlist_items = WishlistItem.objects.filter(
            wishlist=wishlist
        ).select_related('product').order_by('-added_at')

        serializer = WishlistItemSerializer(wishlist_items, many=True, context={'request': request})
        return Response({
            'status': 'success',
            'count': wishlist_items.count(),
            'items': serializer.data
        }, status=status.HTTP_200_OK)
    except Exception as e:
        print(f"Error in get_wishlist: {str(e)}")
        return Response({'status': 'error', 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def add_to_wishlist(request):
    try:
        buyer = request.user.buyer_profile
        product_id = request.data.get('product_id')

        if not product_id:
            return Response({'status': 'error', 'message': 'Product ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        product = Product.objects.get(id=product_id)
        wishlist, _ = Wishlist.objects.get_or_create(buyer=buyer)

        if WishlistItem.objects.filter(wishlist=wishlist, product=product).exists():
            return Response({'status': 'error', 'message': 'Product already in wishlist'}, status=status.HTTP_400_BAD_REQUEST)

        wishlist_item = WishlistItem.objects.create(wishlist=wishlist, product=product)
        return Response({
            'status': 'success',
            'message': 'Added to wishlist',
            'item': WishlistItemSerializer(wishlist_item, context={'request': request}).data
        }, status=status.HTTP_201_CREATED)

    except Product.DoesNotExist:
        return Response({'status': 'error', 'message': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'status': 'error', 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def remove_from_wishlist(request, product_id):
    try:
        buyer = request.user.buyer_profile
        wishlist = Wishlist.objects.get(buyer=buyer)
        wishlist_item = WishlistItem.objects.get(wishlist=wishlist, product_id=product_id)
        wishlist_item.delete()
        return Response({'status': 'success', 'message': 'Removed from wishlist'}, status=status.HTTP_200_OK)
    except WishlistItem.DoesNotExist:
        return Response({'status': 'error', 'message': 'Product not in wishlist'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'status': 'error', 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def toggle_wishlist(request, product_id):
    try:
        buyer = request.user.buyer_profile
        product = Product.objects.get(id=product_id)
        wishlist, _ = Wishlist.objects.get_or_create(buyer=buyer)

        wishlist_item = WishlistItem.objects.filter(wishlist=wishlist, product=product).first()

        if wishlist_item:
            wishlist_item.delete()
            action = 'removed'
        else:
            WishlistItem.objects.create(wishlist=wishlist, product=product)
            action = 'added'

        return Response({'status': 'success', 'action': action, 'message': f'Product {action} from wishlist'}, status=status.HTTP_200_OK)
    except Product.DoesNotExist:
        return Response({'status': 'error', 'message': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'status': 'error', 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_buyer_profile(request):
    try:
        buyer = request.user.buyer_profile
        return Response({
            'name': buyer.name,
            'contact': buyer.contact,
            'location': buyer.location,
            'dob': buyer.dob,
            'profile_photo': buyer.profile_photo.url if buyer.profile_photo else None
        }, status=status.HTTP_200_OK)
    except Buyer.DoesNotExist:
        return Response({'error': 'Buyer profile not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_order_count(request):
    try:
        buyer = request.user.buyer_profile
        order_count = Order.objects.filter(buyer=buyer).count()
        return Response({'count': order_count}, status=status.HTTP_200_OK)
    except Exception:
        return Response({'count': 0}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_seller_profile(request):
    try:
        seller = request.user.seller_profile
        return Response({
            'name': seller.name,
            'contact': seller.contact,
            'location': seller.location,
            'sales': seller.sales,
            'trust': seller.trust,
            'profile_photo': seller.profile_photo.url if seller.profile_photo else None
        }, status=status.HTTP_200_OK)
    except Seller.DoesNotExist:
        return Response({'error': 'Seller profile not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SellerProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsSeller]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            from .serializers import SellerProfileUpdateSerializer
            return SellerProfileUpdateSerializer
        from .serializers import SellerProfileSerializer
        return SellerProfileSerializer

    def get_object(self):
        return self.request.user.seller_profile
    
    def perform_update(self, serializer):
        # Track what fields are being updated
        old_data = self.get_object()
        updated_fields = []
        
        # Check which fields changed
        if 'name' in serializer.validated_data and serializer.validated_data['name'] != old_data.name:
            updated_fields.append('name')
        if 'location' in serializer.validated_data and serializer.validated_data['location'] != old_data.location:
            updated_fields.append('location')
        if 'contact' in serializer.validated_data and serializer.validated_data['contact'] != old_data.contact:
            updated_fields.append('contact')
        if 'about' in serializer.validated_data and serializer.validated_data['about'] != old_data.about:
            updated_fields.append('about')
        if 'nin_number' in serializer.validated_data and serializer.validated_data['nin_number'] != old_data.nin_number:
            updated_fields.append('nin_number')
        
        # Save the updated profile
        serializer.save()
        
        # Create notification based on what was updated
        if updated_fields:
            if len(updated_fields) > 1:
                create_seller_profile_notification(self.request.user, 'profile')
            else:
                create_seller_profile_notification(self.request.user, updated_fields[0])

class SellerProductListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsSeller]
    serializer_class = SellerProductSerializer

    def get_queryset(self):
        return Product.objects.filter(seller=self.request.user.seller_profile)

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user.seller_profile)


class SellerProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated, IsSeller]
    serializer_class = SellerProductSerializer

    def get_queryset(self):
        return Product.objects.filter(seller=self.request.user.seller_profile)


class SellerOrderListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated, IsSeller]
    serializer_class = SellerOrderSerializer

    def get_queryset(self):
        seller = self.request.user.seller_profile
        order_ids = OrderItem.objects.filter(product__seller=seller).values_list('order_id', flat=True).distinct()
        return Order.objects.filter(id__in=order_ids).prefetch_related('items__product').order_by('-order_date')


class SellerQuickDealListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsSeller]
    serializer_class = SellerQuickDealSerializer

    def get_queryset(self):
        seller = self.request.user.seller_profile
        return QuickDeal.objects.filter(product__seller=seller).select_related('product').order_by('-timestamp')

    def perform_create(self, serializer):
        serializer.save(
            is_active=True,
            expires_at=timezone.now() + timedelta(hours=24)
        )


class SellerQuickDealDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated, IsSeller]
    serializer_class = SellerQuickDealSerializer

    def get_queryset(self):
        seller = self.request.user.seller_profile
        return QuickDeal.objects.filter(product__seller=seller)


class SellerStatsView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated, IsSeller]
    serializer_class = SellerStatsSerializer

    def get(self, request):
        seller = request.user.seller_profile
        total_sales = seller.sales
        total_products = Product.objects.filter(seller=seller).count()
        total_orders = OrderItem.objects.filter(product__seller=seller).values('order').distinct().count()
        total_quick_deals = QuickDeal.objects.filter(product__seller=seller).count()
        trust_percentage = seller.trust
        followers = seller.followers

        data = {
            'total_sales': total_sales,
            'total_products': total_products,
            'total_orders': total_orders,
            'total_quick_deals': total_quick_deals,
            'trust_percentage': trust_percentage,
            'followers': followers,
        }
        serializer = self.get_serializer(data)
        return Response(serializer.data)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([permissions.IsAuthenticatedOrReadOnly])
def comment_detail(request, comment_id):
    try:
        comment = ProductComment.objects.get(id=comment_id)
    except ProductComment.DoesNotExist:
        return Response({'error': 'Comment not found'}, status=404)

    if request.method == 'GET':
        serializer = ProductCommentSerializer(comment, context={'request': request})
        return Response(serializer.data)

    if comment.buyer.user != request.user:
        return Response({'error': 'Permission denied'}, status=403)

    if request.method == 'PUT':
        serializer = ProductCommentSerializer(comment, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    elif request.method == 'DELETE':
        comment.delete()
        return Response({'message': 'Comment deleted'}, status=204)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_helpful(request, comment_id):
    try:
        comment = ProductComment.objects.get(id=comment_id)
    except ProductComment.DoesNotExist:
        return Response({'error': 'Comment not found'}, status=404)

    helpful, created = CommentHelpful.objects.get_or_create(comment=comment, user=request.user)
    if created:
        comment.helpful_votes += 1
        comment.save()
        return Response({'status': 'marked helpful', 'helpful_votes': comment.helpful_votes})
    else:
        return Response({'status': 'already marked helpful'}, status=400)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def initiate_payment(request):
    logger.info(f"Payment initiation by user {request.user.id}")
    serializer = InitiatePaymentSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    order_id = serializer.validated_data['order_id']
    transaction_method = serializer.validated_data.get('transaction_method', 'MOBILE_MONEY')
    phone_number = serializer.validated_data.get('phone_number')
    account_number = serializer.validated_data.get('account_number')
    bank_code = serializer.validated_data.get('bank_code')

    try:
        order = Order.objects.get(id=order_id, buyer=request.user.buyer_profile, status='pending')
    except Order.DoesNotExist:
        logger.warning(
            f"Order {order_id} not found or not pending for user {request.user.id}"
        )
        return Response(
            {"error": "Order not found or not pending"},
            status=status.HTTP_404_NOT_FOUND,
        )

    address = (
        order.delivery_address
        or request.user.buyer_profile.addresses.filter(is_default=True).first()
    )
    if not address:
        logger.warning(f"No delivery address for order {order_id}")
        return Response(
            {"error": "No delivery address"}, status=status.HTTP_400_BAD_REQUEST
        )

    billing_address = {
        "email_address": request.user.email,
        "phone_number": address.phone,
        "country_code": address.iso_country_code,
        "first_name": request.user.buyer_profile.name.split()[0]
        if request.user.buyer_profile.name
        else "",
        "last_name": " ".join(request.user.buyer_profile.name.split()[1:])
        if request.user.buyer_profile.name
        else "",
        "line_1": address.street,
        "city": address.city,
        "state": address.state,
        "postal_code": address.postal_code,
    }
    billing_address = {k: v for k, v in billing_address.items() if v is not None}

    config, _ = DusuPayConfig.objects.get_or_create(pk=1)
    if not config.ipn_id:
        logger.info("No IPN ID found, registering new IPN URL")
        try:
            ipn_id = dusupay_utils.register_ipn_url(settings.PESAPAL_IPN_URL)
            config.ipn_id = ipn_id
            config.save()
            logger.info(f"IPN registered, ipn_id={ipn_id}")
        except Exception as e:
            logger.error(f"IPN registration failed: {str(e)}", exc_info=True)
            return Response(
                {"error": f"IPN registration failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
    else:
        ipn_id = config.ipn_id
        logger.debug(f"Using existing IPN ID: {ipn_id}")

    try:
        pesapal_response = dusupay_utils.submit_order_request(
            merchant_reference=str(order.id),
            amount=order.total_amount,
            currency=order.currency,
            description=f"Order #{order.id}",
            callback_url=settings.PESAPAL_CALLBACK_URL,
            notification_id=ipn_id,
            billing_address=billing_address,
        )
    except Exception as e:
        logger.error(
            f"Pesapal submit error for order {order.id}: {str(e)}", exc_info=True
        )
        return Response(
            {"error": f"Pesapal error: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    order.pesapal_tracking_id = pesapal_response.get("order_tracking_id")
    order.save()
    logger.info(f"Order {order.id} initiated, tracking_id={order.pesapal_tracking_id}")

    return Response(
        {
            "redirect_url": pesapal_response.get("redirect_url"),
            "order_tracking_id": pesapal_response.get("order_tracking_id"),
        }
    )

@api_view(["GET", "POST"])
@permission_classes([permissions.AllowAny])
def pesapal_ipn(request):
    params = request.GET if request.method == "GET" else request.data
    order_tracking_id = params.get("OrderTrackingId")
    merchant_reference = params.get("OrderMerchantReference")
    notification_type = params.get("OrderNotificationType")

    logger.info(
        f"IPN received: tracking_id={order_tracking_id}, ref={merchant_reference}, type={notification_type}"
    )

    if not order_tracking_id or not merchant_reference:
        logger.warning("IPN missing required parameters")
        return Response({"status": 200, "message": "Missing parameters"}, status=200)

    try:
        order = Order.objects.get(id=merchant_reference)
    except Order.DoesNotExist:
        logger.error(f"Order {merchant_reference} not found for IPN")
        return Response({"status": 200, "message": "Order not found"}, status=200)

    if order.status == "paid":
        logger.info(f"Order {order.id} already marked paid, ignoring duplicate IPN")
        return Response({"status": 200}, status=200)

    try:
        status_data = dusupay_utils.get_transaction_status(order_tracking_id)
    except Exception as e:
        logger.error(
            f"IPN get_transaction_status failed for {order_tracking_id}: {str(e)}",
            exc_info=True,
        )
        return Response({"status": 200, "message": "Status fetch failed"}, status=200)

    # Get event and payload from request data
    event = params.get('event', '')
    payload = params.get('payload', {})

    # Update config to track webhook receipt
    config, _ = DusuPayConfig.objects.get_or_create(pk=1)
    config.webhook_received_at = timezone.now()
    config.save()

    merchant_ref = payload.get('merchant_reference') if isinstance(payload, dict) else None
    internal_ref = payload.get('internal_reference') if isinstance(payload, dict) else None

    # Find the order
    try:
        if merchant_ref:
            order = Order.objects.get(id=merchant_ref)
        elif internal_ref:
            order = Order.objects.get(dusupay_internal_reference=internal_ref)
        else:
            logger.warning("No reference found in webhook payload")
            return Response({"status": "ok"}, status=200)
    except Order.DoesNotExist:
        logger.error(f"Order not found for merchant_reference: {merchant_ref}")
        return Response({"status": "ok"}, status=200)

    transaction_status = payload.get('transaction_status', '').upper() if isinstance(payload, dict) else ''

    # Define variables for payment update
    amount = order.total_amount
    payment_method = payload.get('provider_code', payload.get('bank_code', 'card')) if isinstance(payload, dict) else 'card'
    confirmation_code = order.dusupay_internal_reference or order.dusupay_merchant_reference or order_tracking_id

    if event == 'transaction.completed' or transaction_status == 'COMPLETED':
        # Payment successful
        order.status = 'paid'
        order.payment_method = payment_method
        order.save()

        Payment.objects.update_or_create(
            order=order,
            defaults={
                "amount": amount,
                "payment_method": payment_method,
                "payment_status": "successful",
                "transaction_reference": confirmation_code,
                "gateway_response": status_data,
                "payment_date": timezone.now(),
            },
        )
        logger.info(
            f"Order {order.id} marked as paid with method {order.payment_method}"
        )
    elif transaction_status and transaction_status.lower() in ["failed", "invalid"]:
        order.status = "cancelled"
        order.save()
        logger.info(f"Order {order.id} cancelled due to {transaction_status}")

    return Response({"status": 200}, status=200)

@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def pesapal_callback(request):
    merchant_reference = request.GET.get("OrderMerchantReference")
    logger.info(f"Callback received for order {merchant_reference}")
    frontend_url = f"{settings.FRONTEND_BASE_URL}/order/{merchant_reference}/"
    return redirect(frontend_url)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def refund_payment(request):
    if not request.user.is_staff:
        return Response(
            {"error": "Only administrators can perform refunds."},
            status=status.HTTP_403_FORBIDDEN,
        )

    logger.info(f"Refund requested by admin {request.user.id}")
    serializer = RefundSerializer(data=request.data)
    if not serializer.is_valid():
        logger.warning(f"Invalid refund data: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    order_id = serializer.validated_data["order_id"]
    amount = serializer.validated_data["amount"]
    remarks = serializer.validated_data["remarks"]
    username = serializer.validated_data.get("username") or request.user.username

    try:
        order = Order.objects.get(id=order_id, status="paid")
    except Order.DoesNotExist:
        logger.warning(f"Order {order_id} not found or not paid for refund")
        return Response(
            {"error": "Order not found or not paid"}, status=status.HTTP_404_NOT_FOUND
        )

    try:
        payment = order.payment
    except Payment.DoesNotExist:
        logger.error(f"No payment record for order {order_id}")
        return Response(
            {"error": "Payment record not found"}, status=status.HTTP_404_NOT_FOUND
        )

    confirmation_code = payment.transaction_reference
    if not confirmation_code:
        logger.error(f"No confirmation code for order {order_id}")
        return Response(
            {"error": "No confirmation code"}, status=status.HTTP_400_BAD_REQUEST
        )

    try:
        refund_resp = dusupay_utils.refund_request(
            confirmation_code, amount, username, remarks
        )
    except Exception as e:
        logger.error(f"Refund API error for order {order_id}: {str(e)}", exc_info=True)
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    if refund_resp.get("status") == "200":
        order.status = "refunded"
        order.save()
        logger.info(f"Order {order_id} refund requested successfully")
        return Response({"message": "Refund request submitted successfully"})
    else:
        logger.error(
            f"Refund failed for order {order_id}: {refund_resp.get('message')}"
        )
        return Response(
            {"error": refund_resp.get("message", "Refund failed")},
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def cancel_pesapal_order(request):
    logger.info(f"Cancel order requested by user {request.user.id}")
    serializer = CancelOrderSerializer(data=request.data)
    if not serializer.is_valid():
        logger.warning(f"Invalid cancel data: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    order_id = serializer.validated_data["order_id"]
    try:
        order = Order.objects.get(
            id=order_id, buyer=request.user.buyer_profile, status="pending"
        )
    except Order.DoesNotExist:
        logger.warning(f"Order {order_id} not found or not pending for cancellation")
        return Response(
            {"error": "Order not found or not pending"},
            status=status.HTTP_404_NOT_FOUND,
        )

    if not order.pesapal_tracking_id:
        logger.error(f"Order {order_id} has no Pesapal tracking ID")
        return Response(
            {"error": "No Pesapal tracking ID"}, status=status.HTTP_400_BAD_REQUEST
        )

    try:
        cancel_resp = dusupay_utils.cancel_order(order.pesapal_tracking_id)
    except Exception as e:
        logger.error(f"Cancel API error for order {order_id}: {str(e)}", exc_info=True)
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    if cancel_resp.get("status") == "200":
        order.status = "cancelled"
        order.save()
        logger.info(f"Order {order_id} cancelled successfully")
        return Response({"message": "Order cancelled successfully"})
    else:
        logger.error(
            f"Cancel failed for order {order_id}: {cancel_resp.get('message')}"
        )
        return Response(
            {"error": cancel_resp.get("message", "Cancellation failed")},
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def order_status(request, order_id):
    try:
        order = Order.objects.get(id=order_id, buyer=request.user.buyer_profile)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # If payment is pending, check status with DusuPay
    if order.status == 'pending' and order.dusupay_internal_reference:
        status_response = dusupay_client.check_transaction_status(order.dusupay_internal_reference)
        if status_response['success']:
            if status_response['status'] == 'COMPLETED':
                order.status = 'paid'
                order.save()
            elif status_response['status'] == 'FAILED':
                order.status = 'cancelled'
                order.save()
    
    return Response({
        'status': order.status,
        'dusupay_internal_reference': order.dusupay_internal_reference
    })

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def dusupay_health(request):
    """
    Health check for DusuPay API
    """
    try:
        dusupay_utils.get_access_token()
        return Response(
            {"status": "healthy", "message": "Pesapal API is reachable"}, status=200
        )
    except Exception as e:
        logger.error(f"DusuPay health check failed: {str(e)}")
        return Response({"status": "unhealthy", "message": str(e)}, status=503)


@csrf_exempt
@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def dusupay_webhook(request):
    """
    Webhook handler for DusuPay IPN (Instant Payment Notification)
    """
    try:
        import json

        data = json.loads(request.body) if request.body else {}
        logger.info(f"DusuPay webhook received: {data}")

        # Process the webhook based on status
        status = data.get("status", "")
        reference = data.get("merchant_reference", "")

        if reference:
            try:
                order = Order.objects.filter(
                    dusupay_merchant_reference=reference
                ).first()
                if order:
                    if status == "completed" or status == "SUCCESS":
                        order.status = "confirmed"
                        order.save()
                        logger.info(f"Order {order.id} confirmed via webhook")
                    elif status == "failed" or status == "FAILED":
                        order.status = "payment_failed"
                        order.save()
                        logger.info(f"Order {order.id} payment failed via webhook")
                    return Response({"status": "received"}, status=200)
            except Exception as e:
                logger.error(f"Error processing webhook: {e}")

        return Response({"status": "received"}, status=200)
    except Exception as e:
        logger.error(f"DusuPay webhook error: {str(e)}")
        return Response({"status": "error", "message": str(e)}, status=400)


@csrf_exempt
@api_view(["GET", "POST"])
@permission_classes([permissions.AllowAny])
def dusupay_callback(request):
    """
    Callback handler for DusuPay redirect after payment
    """
    try:
        import json

        logger.info(f"DusuPay callback received: {request.GET}")

        status = request.GET.get("status", "")
        reference = request.GET.get("merchant_reference", "")

        if reference:
            try:
                order = Order.objects.filter(
                    dusupay_merchant_reference=reference
                ).first()
                if order:
                    if status == "completed" or status == "SUCCESS":
                        order.status = "confirmed"
                        order.save()
                    elif status == "failed" or status == "FAILED":
                        order.status = "payment_failed"
                        order.save()
            except Exception as e:
                logger.error(f"Error processing callback: {e}")

        # Return a simple HTML response that can redirect the user
        return HttpResponse(
            "<html><body><script>window.close();</script>Payment processing complete. You can close this window.</body></html>"
        )
    except Exception as e:
        logger.error(f"DusuPay callback error: {str(e)}")
        return Response({"status": "error", "message": str(e)}, status=400)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated, IsBuyer])
def create_order_from_cart(request):
    cart = get_cart(request)
    if not cart.items.exists():
        return Response({"error": "Cart is empty"}, status=status.HTTP_400_BAD_REQUEST)

    buyer = request.user.buyer_profile
    total_amount = sum(item.subtotal() for item in cart.items.all())

    address = buyer.addresses.filter(is_default=True).first()
    if not address:
        address = Address.objects.create(
            buyer=buyer,
            recipient_name=buyer.name or "Buyer",
            phone=buyer.contact or "0000000000",
            street="Temporary Address",
            city="Kampala",
            state="Central",
            country="Uganda",
            iso_country_code="UG",
            postal_code="",
            is_default=True,
        )
        logger.info(f"Temporary address created for buyer {buyer.id}")

    order = Order.objects.create(
        buyer=buyer,
        total_amount=total_amount,
        status="pending",
        delivery_address=address,
    )

    for cart_item in cart.items.all():
        OrderItem.objects.create(
            order=order,
            product=cart_item.product,
            quantity=cart_item.quantity,
            unit_price=cart_item.product.unit_price,
            subtotal=cart_item.subtotal(),
        )

    cart.items.all().delete()

    return Response({"order_id": order.id}, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def toggle_follow_seller(request, seller_id):
    try:
        # Extensive debug logging
        print("=" * 50)
        print("TOGGLE FOLLOW SELLER DEBUG")
        print(f"Request user: {request.user}")
        print(f"User ID: {request.user.id}")
        print(f"Username: {request.user.username}")
        print(f"Is authenticated: {request.user.is_authenticated}")
        print(f"Has buyer_profile attr: {hasattr(request.user, 'buyer_profile')}")
        
        # Check all attributes of the user
        print(f"All user attributes: {dir(request.user)}")
        
        # Check if buyer_profile exists and try to access it
        if hasattr(request.user, 'buyer_profile'):
            try:
                buyer_profile = request.user.buyer_profile
                print(f"Buyer profile exists: {buyer_profile}")
                print(f"Buyer name: {buyer_profile.name}")
                print(f"Buyer ID: {buyer_profile.id}")
            except Exception as e:
                print(f"Error accessing buyer_profile: {e}")
        else:
            print("No buyer_profile attribute found")
            
            # Check if there's a reverse relation from Buyer to User
            from .models import Buyer
            try:
                buyer = Buyer.objects.get(user=request.user)
                print(f"Found buyer via direct query: {buyer}")
                print("The user has a buyer profile but the reverse relation might not be set up correctly")
                # Attach it to the user for this request
                request.user.buyer_profile = buyer
            except Buyer.DoesNotExist:
                print("No buyer profile found in database for this user")
                return Response(
                    {
                        "error": "Only buyers can follow sellers. No buyer profile found for this user."
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )
            except Exception as e:
                print(f"Error querying buyer: {e}")
                return Response({
                    'error': 'Error checking buyer profile'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Check if user has seller profile (they shouldn't)
        print(f"Has seller_profile: {hasattr(request.user, 'seller_profile00000000000000000')}")
        
        # Check if user has both (shouldn't)
        if hasattr(request.user, 'buyer_profile') and hasattr(request.user, 'seller_profile'):
            print("WARNING: User has both buyer and seller profiles!")
        
        print("=" * 50)
        
        # Get the seller
        try:
            seller = Seller.objects.get(id=seller_id)
        except Seller.DoesNotExist:
            return Response({
                'error': 'Seller not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Don't allow following yourself
        if seller.user == request.user:
            return Response({
                'error': 'You cannot follow yourself'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get buyer (now should be attached)
        buyer = request.user.buyer_profile
        print(f"Buyer: {buyer.name} (ID: {buyer.id})")
        print(f"Seller: {seller.name} (ID: {seller.id})")
        
        # Check if follow relationship exists
        follow = SellerFollow.objects.filter(buyer=buyer, seller=seller).first()
        print(f"Existing follow: {follow}")
        
        with transaction.atomic():
            if follow:
                # Unfollow
                follow.delete()
                seller.followers = max(0, seller.followers - 1)
                seller.save(update_fields=['followers'])
                following = False
                message = 'Unfollowed seller'
                print("Unfollowed")

                # Return response for unfollow
                return Response(
                    {
                        "success": True,
                        "following": following,
                        "followers_count": seller.followers,
                        "message": message,
                    },
                    status=status.HTTP_200_OK,
                )
            else:
                # Follow
                SellerFollow.objects.create(buyer=buyer, seller=seller)
                seller.followers += 1
                seller.save(update_fields=['followers'])
                following = True
                message = 'Followed seller'
                print("Followed")
                
                # CREATE NOTIFICATION FOR THE SELLER
                try:
                    from .models import SimpleNotification
                    
                    # Notification for SELLER
                    SimpleNotification.objects.create(
                        recipient=seller.user,
                        sender_name=buyer.name,
                        message=f"{buyer.name} started following you",
                        type='follow'
                    )
                    print(f"✓ Notification created for seller")
                    
                    # Notification for BUYER (confirmation)
                    SimpleNotification.objects.create(
                        recipient=request.user,
                        sender_name=seller.name,
                        message=f"You are now following {seller.name}",
                        type='follow_confirmation'
                    )
                    print(f"✓ Notification created for buyer")
                    
                except Exception as e:
                    print(f"⚠️ Could not create notifications: {e}")
                    import traceback
                    traceback.print_exc()
                
                # Return response for follow
                return Response({
                    'success': True,
                    'following': following,
                    'followers_count': seller.followers,
                    'message': message
                }, status=status.HTTP_200_OK)

    except Exception as e:
        print(f"Error in toggle_follow_seller: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            'error': 'An unexpected error occurred',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_notifications(request):
    try:
        # Check if Notification model exists and table exists
        from django.db import connection
        from .models import Notification
        
        # Check if table exists
        with connection.cursor() as cursor:
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='trendsync_notification';")
            table_exists = cursor.fetchone()
        
        if not table_exists:
            # Return empty notifications if table doesn't exist
            return Response({
                'status': 'success',
                'data': [],
                'unread_count': 0,
                'message': 'Notifications table not created yet'
            })
        
        # Get notifications for the user
        notifications = Notification.objects.filter(recipient=request.user).order_by('-created_at')
        serializer = NotificationSerializer(notifications, many=True)
        
        # Count unread
        unread_count = notifications.filter(read=False).count()
        
        return Response({
            'status': 'success',
            'data': serializer.data,
            'unread_count': unread_count
        })
        
    except Exception as e:
        print(f"Error in get_notifications: {e}")
        return Response({
            'status': 'success',
            'data': [],
            'unread_count': 0
        })
    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, notification_id):
    try:
        notification = Notification.objects.get(id=notification_id, recipient=request.user)
        notification.read = True
        notification.save()
        return Response({'status': 'success'})
    except Notification.DoesNotExist:
        return Response({'status': 'error', 'message': 'Notification not found'}, status=404)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_notifications_read(request):
    Notification.objects.filter(recipient=request.user, read=False).update(read=True)
    return Response({'status': 'success'})

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_notification(request, notification_id):
    try:
        notification = Notification.objects.get(id=notification_id, recipient=request.user)
        notification.delete()
        return Response({'status': 'success'})
    except Notification.DoesNotExist:
        return Response({'status': 'error', 'message': 'Notification not found'}, status=404)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def clear_all_notifications(request):
    Notification.objects.filter(recipient=request.user).delete()
    return Response({'status': 'success'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_simple_notifications(request):
    try:
        from .models import SimpleNotification
        
        notifications = SimpleNotification.objects.filter(recipient=request.user).order_by('-created_at')
        unread_count = notifications.filter(read=False).count()
        
        data = []
        for note in notifications:
            # Set title based on type
            if note.type == 'follow':
                title = 'New Follower'
            elif note.type == 'follow_confirmation':
                title = 'Follow Confirmation'
            else:
                title = 'Notification'
            
            data.append({
                'id': note.id,
                'notification_type': note.type,
                'title': title,
                'message': note.message,
                'read': note.read,
                'created_at': note.created_at.isoformat(),
                'data': {
                    'sender_name': note.sender_name
                }
            })
        
        return Response({
            'status': 'success',
            'data': data,
            'unread_count': unread_count
        })
        
    except Exception as e:
        print(f"Error in get_simple_notifications: {e}")
        return Response({
            'status': 'success',
            'data': [],
            'unread_count': 0
        })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_simple_notification_read(request, notification_id):
    try:
        from .models import SimpleNotification
        note = SimpleNotification.objects.get(id=notification_id, recipient=request.user)
        note.read = True
        note.save()
        return Response({'status': 'success'})
    except:
        return Response({'status': 'error'}, status=404)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_simple_notification(request, notification_id):
    try:
        from .models import SimpleNotification
        SimpleNotification.objects.get(id=notification_id, recipient=request.user).delete()
        return Response({'status': 'success'})
    except:
        return Response({'status': 'error'}, status=404)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def clear_simple_notifications(request):
    from .models import SimpleNotification
    SimpleNotification.objects.filter(recipient=request.user).delete()
    return Response({'status': 'success'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_simple_notifications_read(request):
    from .models import SimpleNotification
    SimpleNotification.objects.filter(recipient=request.user, read=False).update(read=True)
    return Response({'status': 'success'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_email(request):
    """
    Change user's email address
    Requires: new_email, password for verification
    """
    new_email = request.data.get('new_email')
    password = request.data.get('password')
    
    if not new_email or not password:
        return Response({
            'error': 'New email and password are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Verify password
    user = authenticate(username=request.user.username, password=password)
    if not user:
        return Response({
            'error': 'Current password is incorrect'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    # Check if email is already taken
    if User.objects.filter(email=new_email).exclude(id=request.user.id).exists():
        return Response({
            'error': 'This email is already in use'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Update email
    request.user.email = new_email
    request.user.save()
    
    # Create notification for email update 
    create_profile_notification(request.user, 'email')
    
    return Response({
        'success': True,
        'message': 'Email updated successfully',
        'email': new_email
    }, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """
    Change user's password
    Requires: current_password, new_password
    """
    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')
    
    if not current_password or not new_password:
        return Response({
            'error': 'Current password and new password are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Verify current password
    user = authenticate(username=request.user.username, password=current_password)
    if not user:
        return Response({
            'error': 'Current password is incorrect'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    # Validate new password strength
    try:
        validate_password(new_password, user=request.user)
    except ValidationError as e:
        return Response({
            'error': e.messages[0]
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Set new password
    request.user.set_password(new_password)
    request.user.save()
    
    # Keep user logged in
    update_session_auth_hash(request, request.user)
    
    # Create notification for password update - just like followers
    create_profile_notification(request.user, 'password')
    
    return Response({
        'success': True,
        'message': 'Password updated successfully'
    }, status=status.HTTP_200_OK)

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def buyer_profile_detail(request):
    """
    Get or update the buyer profile for the authenticated user
    """
    try:
        # Get or create buyer profile
        buyer, created = Buyer.objects.get_or_create(
            user=request.user,
            defaults={
                'name': request.user.username,
                'location': '',
                'contact': ''
            }
        )
        
        if request.method == 'GET':
            return Response({
                'name': buyer.name,
                'contact': buyer.contact,
                'location': buyer.location,
                'dob': buyer.dob,
                'profile_photo': buyer.profile_photo.url if buyer.profile_photo else None
            }, status=status.HTTP_200_OK)
            
        elif request.method == 'PUT':
            print("========== BUYER PROFILE UPDATE ==========")
            print(f"Updating profile for user: {request.user.username}")
            print(f"Received data: {request.data}")
            
            # Track what fields were updated
            updated_fields = []
            
            # Update fields if provided
            if 'name' in request.data and request.data['name'] != buyer.name:
                buyer.name = request.data['name']
                updated_fields.append('name')
                print(f"Updated name to: {buyer.name}")
                
            if 'contact' in request.data and request.data['contact'] != buyer.contact:
                buyer.contact = request.data['contact']
                updated_fields.append('contact')
                print(f"Updated contact to: {buyer.contact}")
                
            if 'location' in request.data and request.data['location'] != buyer.location:
                buyer.location = request.data['location']
                updated_fields.append('location')
                print(f"Updated location to: {buyer.location}")
                
            if 'dob' in request.data and request.data['dob'] != buyer.dob:
                buyer.dob = request.data['dob']
                updated_fields.append('dob')
                print(f"Updated dob to: {buyer.dob}")
            
            buyer.save()
            print("Profile saved successfully")
            
            # Create notification for profile update - just like followers
            if updated_fields:
                if len(updated_fields) > 1:
                    create_profile_notification(request.user, 'profile')
                else:
                    create_profile_notification(request.user, updated_fields[0])
                print(f"✓ Created notification for updated fields: {updated_fields}")
            
            print("========== UPDATE COMPLETE ==========")
            
            return Response({
                'success': True,
                'message': 'Profile updated successfully',
                'data': {
                    'name': buyer.name,
                    'contact': buyer.contact,
                    'location': buyer.location,
                    'dob': buyer.dob,
                }
            }, status=status.HTTP_200_OK)
            
    except Exception as e:
        print(f"ERROR updating buyer profile: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            'error': 'Failed to update profile',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@permission_classes([IsAuthenticated, IsSeller])
def update_seller_profile(request):
    """
    Update seller profile
    """
    try:
        seller = request.user.seller_profile
        print("========== SELLER PROFILE UPDATE ==========")
        print(f"Updating seller profile for: {request.user.username}")
        print(f"Received data: {request.data}")
        
        # Track what fields are being updated
        updated_fields = []
        old_data = {
            'name': seller.name,
            'location': seller.location,
            'contact': seller.contact,
            'about': seller.about,
            'nin_number': seller.nin_number
        }
        
        # Update fields if provided
        if 'name' in request.data and request.data['name'] != seller.name:
            seller.name = request.data['name']
            updated_fields.append('name')
            
        if 'location' in request.data and request.data['location'] != seller.location:
            seller.location = request.data['location']
            updated_fields.append('location')
            
        if 'contact' in request.data and request.data['contact'] != seller.contact:
            seller.contact = request.data['contact']
            updated_fields.append('contact')
            
        if 'about' in request.data and request.data['about'] != seller.about:
            seller.about = request.data['about']
            updated_fields.append('about')
            
        if 'nin_number' in request.data and request.data['nin_number'] != seller.nin_number:
            seller.nin_number = request.data['nin_number']
            updated_fields.append('nin_number')
        
        seller.save()
        print(f"Seller profile saved. Updated fields: {updated_fields}")
        
        # Create notification for profile update
        if updated_fields:
            if len(updated_fields) > 1:
                create_seller_profile_notification(request.user, 'profile')
            else:
                create_seller_profile_notification(request.user, updated_fields[0])
            print(f"✓ Created notification for updated fields: {updated_fields}")
        
        print("========== UPDATE COMPLETE ==========")
        
        return Response({
            'success': True,
            'message': 'Profile updated successfully',
            'updated_fields': updated_fields
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"ERROR updating seller profile: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            'error': 'Failed to update profile',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])  
@permission_classes([IsAuthenticated, IsBuyer])
def rate_seller(request):
    """
    Simple rating system - stores rating as a notification
    """
    print("=" * 50)
    print("RATE SELLER VIEW HIT!")
    print(f"Request data: {request.data}")
    print("=" * 50)
    
    try:
        seller_id = request.data.get('seller_id')
        rating = request.data.get('rating')  # 1-5
        comment = request.data.get('comment', '')
        order_id = request.data.get('order_id')
        
        if not seller_id or not rating:
            return Response({
                'error': 'Seller ID and rating are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get the seller
        try:
            seller = Seller.objects.get(id=seller_id)
        except Seller.DoesNotExist:
            return Response({
                'error': 'Seller not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get the buyer
        try:
            buyer = request.user.buyer_profile
        except:
            return Response({
                'error': 'Buyer profile not found'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Create a notification for the rating (using SimpleNotification)
        from .models import SimpleNotification
        
        # Notification for the seller
        SimpleNotification.objects.create(
            recipient=seller.user,
            sender_name=buyer.name,
            message=f"{buyer.name} rated your service {rating}/5. {comment}",
            type='review'
        )
        
        # Optional: Create a confirmation notification for the buyer
        SimpleNotification.objects.create(
            recipient=request.user,
            sender_name='System',
            message=f"You rated {seller.name} {rating}/5. Thank you for your feedback!",
            type='review_confirmation'
        )
        
        # Update seller's trust rating (simple average)
        # Get all review notifications for this seller
        all_reviews = SimpleNotification.objects.filter(
            recipient=seller.user,
            type='review'
        )
        
        # Extract ratings from messages (this is a bit hacky but simple)
        ratings = []
        for review in all_reviews:
            # Look for pattern like "rated your service X/5"
            import re
            match = re.search(r'rated your service (\d+)/5', review.message)
            if match:
                ratings.append(int(match.group(1)))
        
        # Add current rating
        ratings.append(int(rating))
        
        # Calculate average
        if ratings:
            avg_rating = sum(ratings) / len(ratings)
            trust_percentage = round(avg_rating * 20)
        else:
            trust_percentage = 0
        
        # Update seller's trust field
        seller.trust = trust_percentage
        seller.save()
        
        print(f"Seller trust updated to: {trust_percentage}% based on {len(ratings)} ratings")
        
        return Response({
            'success': True,
            'message': 'Rating submitted successfully',
            'seller_trust': trust_percentage,
            'ratings_count': len(ratings)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Error in rate_seller: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            'error': 'Failed to submit rating',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_orders(request):
    """
    Get all orders for the authenticated buyer
    """
    try:
        if hasattr(request.user, 'buyer_profile'):
            buyer = request.user.buyer_profile
            orders = Order.objects.filter(buyer=buyer).order_by('-order_date')
            
            orders_data = []
            for order in orders:
                # Get the first product from order items to display
                first_item = order.items.first()
                product_name = first_item.product.name if first_item else 'Product'
                seller_name = first_item.product.seller.name if first_item and first_item.product else 'Seller'
                seller_id = first_item.product.seller.id if first_item and first_item.product else None
                
                orders_data.append({
                    'id': order.id,
                    'order_date': order.order_date,
                    'total_amount': order.total_amount,
                    'status': order.status,
                    'items_count': order.items.count(),
                    'product_name': product_name,
                    'seller_name': seller_name,
                    'seller_id': seller_id,
                    'has_rated': False,  # You can implement this later
                })
            
            return Response(orders_data, status=status.HTTP_200_OK)
        else:
            return Response([], status=status.HTTP_200_OK)
    except Exception as e:
        print(f"Error fetching orders: {e}")
        return Response([], status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_order_detail(request, order_id):
    """
    Get details of a specific order
    """
    try:
        if hasattr(request.user, 'buyer_profile'):
            buyer = request.user.buyer_profile
            order = Order.objects.get(id=order_id, buyer=buyer)
            
            items = []
            for item in order.items.all():
                items.append({
                    'id': item.id,
                    'product_id': item.product.id,
                    'product_name': item.product.name,
                    'quantity': item.quantity,
                    'unit_price': item.unit_price,
                    'subtotal': item.subtotal,
                    'product_photo': item.product.product_photo.url if item.product.product_photo else None
                })
            
            order_data = {
                'id': order.id,
                'order_date': order.order_date,
                'total_amount': order.total_amount,
                'status': order.status,
                'payment_method': order.payment_method,
                'delivery_address': {
                    'recipient_name': order.delivery_address.recipient_name if order.delivery_address else None,
                    'phone': order.delivery_address.phone if order.delivery_address else None,
                    'street': order.delivery_address.street if order.delivery_address else None,
                    'city': order.delivery_address.city if order.delivery_address else None,
                } if order.delivery_address else None,
                'items': items,
                'tracking_number': order.tracking_number,
                'delivery_status': order.delivery_status,
            }
            
            return Response(order_data, status=status.HTTP_200_OK)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print(f"Error fetching order detail: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(['GET'])
@permission_classes([AllowAny])
def dusupay_callback(request):
    """Redirect user after card payment (called by DusuPay)"""
    merchant_reference = request.GET.get('merchant_reference')
    logger.info(f"Callback received for order {merchant_reference}")
    frontend_url = f"{settings.FRONTEND_BASE_URL}/order/{merchant_reference}/"
    return redirect(frontend_url)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsSeller])
def update_seller_location(request):
    """
    Update seller's live location using GPS coordinates from mobile device.
    """
    seller = request.user.seller_profile
    lat = request.data.get('latitude')
    lng = request.data.get('longitude')
    accuracy = request.data.get('accuracy')

    if lat is None or lng is None:
        return Response({"error": "Missing coordinates"}, status=400)

    try:
        seller.location_lat = float(lat)
        seller.location_lng = float(lng)
        if accuracy is not None:
            seller.location_accuracy = float(accuracy)
        seller.location_updated_at = timezone.now()

        # Now reverse_geocode is imported from utils
        seller.location_address = reverse_geocode(lat, lng)

        seller.save()

        return Response({
            "success": True,
            "lat": seller.location_lat,
            "lng": seller.location_lng,
            "accuracy_m": seller.location_accuracy,
            "updated_at": seller.location_updated_at,
            "address": seller.location_address,
        })
    except Exception as e:
        return Response({"error": str(e)}, status=400)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_chat_inbox(request):
    """
    Get all conversations with reliable profile photos.
    """
    from django.db.models import Q
    from .models import ChatMessage
    from django.contrib.auth.models import User
    
    current_user = request.user
    print(f"🔍 Getting inbox for user: {current_user.username} (ID: {current_user.id})")
    
    sent_users = ChatMessage.objects.filter(sender=current_user).values_list('recipient_id', flat=True).distinct()
    received_users = ChatMessage.objects.filter(recipient=current_user).values_list('sender_id', flat=True).distinct()
    partner_ids = set(list(sent_users) + list(received_users))
    
    conversations = []
    
    for partner_id in partner_ids:
        try:
            partner = User.objects.get(id=partner_id)
        except User.DoesNotExist:
            continue
        
        last_message = ChatMessage.objects.filter(
            (Q(sender=current_user, recipient=partner) | 
             Q(sender=partner, recipient=current_user))
        ).order_by('-timestamp').first()
        
        if not last_message:
            continue
        
        unread_count = ChatMessage.objects.filter(
            sender=partner, recipient=current_user, is_read=False
        ).count()
        
        partner_name = get_user_display_name(partner)
        profile_photo = get_user_profile_photo(partner, request)
        
        # Only use fallback if no profile photo exists
        if not profile_photo:
            # Use default profile image - frontend will handle fallback
            profile_photo = None
        
        conversations.append({
            'partner_id': partner.id,
            'partner_name': partner_name,
            'profile_photo': profile_photo,  # Send None if no photo
            'last_message': last_message.content[:60] + ('...' if len(last_message.content) > 60 else ''),
            'timestamp': last_message.timestamp.isoformat(),
            'unread_count': unread_count
        })
    
    conversations.sort(key=lambda x: x['timestamp'], reverse=True)
    
    return Response(conversations, status=status.HTTP_200_OK)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_chat_history(request, user_id):
    """
    Get chat history between the authenticated user and another user.
    """
    from django.db.models import Q
    from .models import ChatMessage
    from .serializers import ChatMessageSerializer
    
    current_user = request.user
    
    try:
        other_user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response([], status=status.HTTP_200_OK)
    
    messages = ChatMessage.objects.filter(
        (Q(sender=current_user) & Q(recipient_id=user_id)) | 
        (Q(sender_id=user_id) & Q(recipient=current_user))
    ).order_by('timestamp')
    
    # Mark unread messages as read
    ChatMessage.objects.filter(
        sender_id=user_id, 
        recipient=current_user, 
        is_read=False
    ).update(is_read=True)
    
    # Serialize messages
    serializer = ChatMessageSerializer(messages, many=True, context={'request': request})
    
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_locations(request):
    """
    Get list of unique locations from all sellers that have products.
    Returns locations that have at least one product.
    """
    try:
        # Get distinct locations from sellers that have products
        locations = Seller.objects.filter(
            products__isnull=False,
            location__isnull=False
        ).exclude(location='').values_list('location', flat=True).distinct().order_by('location')
        
        # Convert to list and clean up
        location_list = [loc.strip() for loc in locations if loc and loc.strip()]
        
        # If no locations found, return a default list
        if not location_list:
            default_locations = [
                'Kampala', 'Entebbe', 'Jinja', 'Mbarara', 'Gulu',
                'Arua', 'Mbale', 'Masaka', 'Kasese', 'Fort Portal',
                'Lira', 'Soroti', 'Kabale', 'Mukono', 'Njeru',
                'Busia', 'Tororo', 'Moroto', 'Kotido', 'Adjumani'
            ]
            return Response({
                'status': 'success',
                'data': default_locations,
                'is_default': True,
                'count': len(default_locations)
            })
        
        return Response({
            'status': 'success',
            'data': location_list,
            'is_default': False,
            'count': len(location_list)
        })
        
    except Exception as e:
        print(f"Error fetching locations: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Return default locations as fallback
        default_locations = [
            'Kampala', 'Entebbe', 'Jinja', 'Mbarara', 'Gulu',
            'Arua', 'Mbale', 'Masaka', 'Kasese', 'Fort Portal',
            'Lira', 'Soroti', 'Kabale', 'Mukono', 'Njeru',
            'Busia', 'Tororo', 'Moroto', 'Kotido', 'Adjumani'
        ]
        return Response({
            'status': 'success',
            'data': default_locations,
            'is_default': True,
            'count': len(default_locations),
            'error': str(e)
        })
    

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_chat_read(request, user_id):
    """
    Mark all messages from a specific user as read.
    """
    from .models import ChatMessage
    
    updated = ChatMessage.objects.filter(
        sender_id=user_id,
        recipient=request.user,
        is_read=False
    ).update(is_read=True)
    
    return Response({
        'status': 'success',
        'updated_count': updated
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def test_send_message(request):
    """
    Test endpoint to send a message.
    """
    from .models import ChatMessage
    from django.contrib.auth.models import User
    
    recipient_id = request.data.get('recipient_id')
    content = request.data.get('content')
    
    if not recipient_id or not content:
        return Response({'error': 'recipient_id and content required'}, status=400)
    
    try:
        recipient = User.objects.get(id=recipient_id)
    except User.DoesNotExist:
        return Response({'error': 'Recipient not found'}, status=404)
    
    message = ChatMessage.objects.create(
        sender=request.user,
        recipient=recipient,
        content=content
    )
    
    print(f"✅ Test message sent: {request.user.username} -> {recipient.username}: {content}")
    
    return Response({
        'id': message.id,
        'sender': message.sender.id,
        'recipient': message.recipient.id,
        'content': message.content,
        'timestamp': message.timestamp.isoformat()
    }, status=201)


# Add these to your views.py

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsBuyer])
def create_report(request):
    """
    Create a report against a seller
    """
    print("=" * 50)
    print("CREATE REPORT - Request received")
    print(f"Request data: {request.data}")
    print(f"User: {request.user.username}")
    print("=" * 50)
    
    try:
        serializer = ReportCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                'error': 'Invalid data',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        
        # Get the seller
        try:
            seller = Seller.objects.get(id=data['seller_id'])
        except Seller.DoesNotExist:
            return Response({
                'error': 'Seller not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Prevent reporting yourself
        if seller.user == request.user:
            return Response({
                'error': 'You cannot report yourself'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user already reported this seller (pending or investigating)
        existing_report = Report.objects.filter(
            reporter=request.user,
            seller=seller,
            status__in=['pending', 'investigating']
        ).exists()
        
        if existing_report:
            return Response({
                'error': 'You already have an active report against this seller'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get product if provided
        product = None
        if data.get('product_id'):
            try:
                product = Product.objects.get(id=data['product_id'])
            except Product.DoesNotExist:
                pass
        
        # Create the report
        report = Report.objects.create(
            reporter=request.user,
            seller=seller,
            product=product,
            report_type=data['report_type'],
            description=data['description'],
            evidence=data.get('evidence', ''),
            status='pending'
        )
        
        print(f"✓ Report #{report.id} created successfully")
        
        # Create notification for admin (you can implement this later)
        # create_admin_notification(report)
        
        return Response({
            'success': True,
            'message': 'Report submitted successfully',
            'report_id': report.id,
            'report': ReportSerializer(report, context={'request': request}).data
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        print(f"Error creating report: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            'error': 'Failed to create report',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_reports(request):
    """
    Get reports - Admins get all, users get their own reports
    """
    try:
        # Check if user is admin (staff)
        is_admin = request.user.is_staff
        
        if is_admin:
            # Admin gets all reports
            reports = Report.objects.all()
            status_filter = request.query_params.get('status')
            if status_filter:
                reports = reports.filter(status=status_filter)
            
            # Apply ordering
            sort_by = request.query_params.get('sort', '-created_at')
            if sort_by in ['created_at', '-created_at', 'status', '-status']:
                reports = reports.order_by(sort_by)
            else:
                reports = reports.order_by('-created_at')
                
        else:
            # Regular user gets only their reports
            reports = Report.objects.filter(reporter=request.user)
        
        serializer = ReportSerializer(reports, many=True, context={'request': request})
        
        # Count by status for admins
        stats = {}
        if is_admin:
            stats = {
                'total': reports.count(),
                'pending': reports.filter(status='pending').count(),
                'investigating': reports.filter(status='investigating').count(),
                'resolved': reports.filter(status='resolved').count(),
                'dismissed': reports.filter(status='dismissed').count(),
            }
        
        return Response({
            'success': True,
            'count': reports.count(),
            'reports': serializer.data,
            'stats': stats
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Error fetching reports: {e}")
        return Response({
            'error': 'Failed to fetch reports',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_report_detail(request, report_id):
    """
    Get details of a specific report
    """
    try:
        report = Report.objects.get(id=report_id)
        
        # Check permission: admin can view all, users can only view their own
        if not request.user.is_staff and report.reporter != request.user:
            return Response({
                'error': 'You do not have permission to view this report'
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = ReportSerializer(report, context={'request': request})
        return Response({
            'success': True,
            'report': serializer.data
        }, status=status.HTTP_200_OK)
        
    except Report.DoesNotExist:
        return Response({
            'error': 'Report not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': 'Failed to fetch report',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_report_status(request, report_id):
    """
    Update report status - Admin only
    """
    if not request.user.is_staff:
        return Response({
            'error': 'Only administrators can update report status'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        report = Report.objects.get(id=report_id)
        
        status_value = request.data.get('status')
        admin_notes = request.data.get('admin_notes', '')
        
        if not status_value:
            return Response({
                'error': 'Status is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        valid_statuses = ['pending', 'investigating', 'resolved', 'dismissed']
        if status_value not in valid_statuses:
            return Response({
                'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        old_status = report.status
        report.status = status_value
        
        if admin_notes:
            report.admin_notes = admin_notes
        
        if status_value in ['resolved', 'dismissed'] and old_status not in ['resolved', 'dismissed']:
            report.resolved_at = timezone.now()
            report.handled_by = request.user
        
        if status_value in ['investigating'] and old_status != 'investigating':
            report.handled_by = request.user
        
        report.save()
        
        # Create notification for the reporter
        try:
            from .models import SimpleNotification
            
            status_messages = {
                'investigating': f'Your report against {report.seller.name} is now under investigation.',
                'resolved': f'Your report against {report.seller.name} has been resolved.',
                'dismissed': f'Your report against {report.seller.name} has been reviewed and dismissed.',
            }
            
            if status_value in status_messages:
                SimpleNotification.objects.create(
                    recipient=report.reporter,
                    sender_name='System',
                    message=status_messages[status_value],
                    type='system'
                )
                print(f"✓ Notification sent to reporter about status update")
        except Exception as e:
            print(f"Could not send notification: {e}")
        
        serializer = ReportSerializer(report, context={'request': request})
        return Response({
            'success': True,
            'message': 'Report status updated successfully',
            'report': serializer.data
        }, status=status.HTTP_200_OK)
        
    except Report.DoesNotExist:
        return Response({
            'error': 'Report not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'error': 'Failed to update report',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_my_reports(request):
    """
    Get reports created by the authenticated user
    """
    try:
        reports = Report.objects.filter(reporter=request.user).order_by('-created_at')
        serializer = ReportSerializer(reports, many=True, context={'request': request})
        
        stats = {
            'total': reports.count(),
            'pending': reports.filter(status='pending').count(),
            'investigating': reports.filter(status='investigating').count(),
            'resolved': reports.filter(status='resolved').count(),
            'dismissed': reports.filter(status='dismissed').count(),
        }
        
        return Response({
            'success': True,
            'count': reports.count(),
            'reports': serializer.data,
            'stats': stats
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': 'Failed to fetch reports',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ===== RECENT SEARCHES =====

@api_view(['GET', 'POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def recent_searches(request):
    """
    GET: Get user's recent searches
    POST: Add a search term
    DELETE: Clear all recent searches
    """
    user = request.user
    
    if request.method == 'GET':
        # Get recent searches from user profile or use localStorage fallback
        try:
            buyer = Buyer.objects.get(user=user)
            # If you add a recent_searches field to Buyer model
            if hasattr(buyer, 'recent_searches'):
                searches = buyer.recent_searches or []
                return Response({
                    'status': 'success',
                    'searches': searches[:5]  # Max 5
                })
        except Buyer.DoesNotExist:
            pass
        
        # Fallback: return empty list (frontend will use localStorage)
        return Response({
            'status': 'success',
            'searches': []
        })
    
    elif request.method == 'POST':
        term = request.data.get('term', '').strip()
        if not term:
            return Response({
                'status': 'error',
                'message': 'Search term is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            buyer = Buyer.objects.get(user=user)
            if hasattr(buyer, 'recent_searches'):
                searches = buyer.recent_searches or []
                # Remove duplicate and add to front
                searches = [term] + [s for s in searches if s.lower() != term.lower()]
                searches = searches[:5]  # Keep max 5
                buyer.recent_searches = searches
                buyer.save()
        except Buyer.DoesNotExist:
            pass
        
        return Response({
            'status': 'success',
            'message': 'Search term saved'
        })
    
    elif request.method == 'DELETE':
        try:
            buyer = Buyer.objects.get(user=user)
            if hasattr(buyer, 'recent_searches'):
                buyer.recent_searches = []
                buyer.save()
        except Buyer.DoesNotExist:
            pass
        
        return Response({
            'status': 'success',
            'message': 'Recent searches cleared'
        })


# ===== UPDATED PRODUCT SEARCH WITH ADVANCED FILTERS =====

@api_view(['GET'])
def search_products(request):
    """
    Search products with advanced filters including:
    - search: text search in name and description
    - category: category ID
    - location: seller location
    - price_range: under_500k, 500k_1m, 1m_5m, above_5m
    - min_rating: minimum rating (1-5)
    - stock_status: all, in_stock, low_stock, out_of_stock
    - sort: newest, price_low, price_high, rating, popularity, relevance
    """
    queryset = Product.objects.all().select_related('seller', 'category')
    
    # Search text
    search = request.query_params.get('search', '')
    if search:
        queryset = queryset.filter(
            Q(name__icontains=search) |
            Q(description__icontains=search)
        )
    
    # Category filter
    category = request.query_params.get('category')
    if category and category != 'all':
        queryset = queryset.filter(category_id=category)
    
    # Location filter
    location = request.query_params.get('location', '')
    if location:
        queryset = queryset.filter(
            Q(seller__location__icontains=location) |
            Q(seller__location_address__icontains=location)
        )
    
    # Price range filter
    price_range = request.query_params.get('price_range', 'all')
    if price_range != 'all':
        price_ranges = {
            'under_500k': (0, 500000),
            '500k_1m': (500000, 1000000),
            '1m_5m': (1000000, 5000000),
            'above_5m': (5000000, None)
        }
        if price_range in price_ranges:
            min_price, max_price = price_ranges[price_range]
            if max_price is None:
                queryset = queryset.filter(unit_price__gte=min_price)
            else:
                queryset = queryset.filter(unit_price__gte=min_price, unit_price__lt=max_price)
    
    # Rating filter
    min_rating = request.query_params.get('min_rating')
    if min_rating and min_rating.isdigit():
        min_rating = int(min_rating)
        if min_rating > 0:
            queryset = queryset.filter(rating_magnitude__gte=min_rating)
    
    # Stock status filter
    stock_status = request.query_params.get('stock_status', 'all')
    if stock_status != 'all':
        if stock_status == 'in_stock':
            queryset = queryset.filter(stock_quantity__gt=10)
        elif stock_status == 'low_stock':
            queryset = queryset.filter(stock_quantity__gte=1, stock_quantity__lte=10)
        elif stock_status == 'out_of_stock':
            queryset = queryset.filter(stock_quantity=0)
    
    # Sorting
    sort = request.query_params.get('sort', 'newest')
    sort_mappings = {
        'newest': '-date_of_post',
        'price_low': 'unit_price',
        'price_high': '-unit_price',
        'rating': '-rating_magnitude',
        'popularity': '-sales_count',
        'relevance': '-like_count',
    }
    if sort in sort_mappings:
        queryset = queryset.order_by(sort_mappings[sort])
    
    # Pagination
    page = int(request.query_params.get('page', 1))
    page_size = int(request.query_params.get('page_size', 20))
    start = (page - 1) * page_size
    end = start + page_size
    
    total_count = queryset.count()
    products = queryset[start:end]
    
    # Serialize with request context for image URLs
    serializer = ProductSerializer(products, many=True, context={'request': request})
    
    return Response({
        'status': 'success',
        'data': serializer.data,
        'pagination': {
            'page': page,
            'page_size': page_size,
            'total_count': total_count,
            'total_pages': (total_count + page_size - 1) // page_size
        }
    })


# ===== GET FILTER OPTIONS =====

@api_view(['GET'])
def get_filter_options(request):
    """
    Get available filter options for the frontend
    """
    # Get unique price ranges from products
    price_ranges = Product.objects.aggregate(
        min_price=Coalesce(Min('unit_price'), Decimal('0')),
        max_price=Coalesce(Max('unit_price'), Decimal('0'))
    )
    
    # Get categories with product counts
    categories = Category.objects.filter(
        products__isnull=False,
        is_active=True
    ).annotate(
        product_count=Count('products')
    ).values('id', 'name', 'product_count')
    
    # Get locations from sellers with products
    locations = Seller.objects.filter(
        products__isnull=False
    ).exclude(
        location__isnull=True
    ).exclude(
        location=''
    ).values_list('location', flat=True).distinct()[:50]
    
    # Get rating distribution
    rating_distribution = Product.objects.aggregate(
        rating_1=Count('id', filter=Q(rating_magnitude__gte=1, rating_magnitude__lt=2)),
        rating_2=Count('id', filter=Q(rating_magnitude__gte=2, rating_magnitude__lt=3)),
        rating_3=Count('id', filter=Q(rating_magnitude__gte=3, rating_magnitude__lt=4)),
        rating_4=Count('id', filter=Q(rating_magnitude__gte=4, rating_magnitude__lt=5)),
        rating_5=Count('id', filter=Q(rating_magnitude__gte=5)),
    )
    
    return Response({
        'status': 'success',
        'data': {
            'price_range': {
                'min': float(price_ranges['min_price'] or 0),
                'max': float(price_ranges['max_price'] or 0)
            },
            'categories': list(categories),
            'locations': list(locations[:20]),  # Limit to 20 locations
            'rating_distribution': rating_distribution,
            'sort_options': [
                {'value': 'newest', 'label': 'Newest First'},
                {'value': 'price_low', 'label': 'Price: Low to High'},
                {'value': 'price_high', 'label': 'Price: High to Low'},
                {'value': 'rating', 'label': 'Best Rating'},
                {'value': 'popularity', 'label': 'Most Popular'},
                {'value': 'relevance', 'label': 'Relevance'},
            ],
            'price_options': [
                {'value': 'all', 'label': 'All Prices'},
                {'value': 'under_500k', 'label': 'Under 500,000 UGX'},
                {'value': '500k_1m', 'label': '500,000 - 1,000,000 UGX'},
                {'value': '1m_5m', 'label': '1,000,000 - 5,000,000 UGX'},
                {'value': 'above_5m', 'label': 'Above 5,000,000 UGX'},
            ],
            'rating_options': [
                {'value': 0, 'label': 'Any Rating'},
                {'value': 1, 'label': '⭐ 1+ Stars'},
                {'value': 2, 'label': '⭐⭐ 2+ Stars'},
                {'value': 3, 'label': '⭐⭐⭐ 3+ Stars'},
                {'value': 4, 'label': '⭐⭐⭐⭐ 4+ Stars'},
                {'value': 5, 'label': '⭐⭐⭐⭐⭐ 5 Stars'},
            ],
            'stock_options': [
                {'value': 'all', 'label': 'All Products'},
                {'value': 'in_stock', 'label': 'In Stock'},
                {'value': 'low_stock', 'label': 'Low Stock (< 10)'},
                {'value': 'out_of_stock', 'label': 'Out of Stock'},
            ]
        }
    })