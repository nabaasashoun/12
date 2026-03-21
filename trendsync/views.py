from rest_framework import viewsets, generics, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from .models import Product, Buyer, Order, Category, Address, Cart, CartItem, ProductLike, ProductComment, Wishlist, WishlistItem, Seller, QuickDeal
from .serializers import (
    ProductSerializer, CategorySerializer, WishlistItemSerializer, CartSerializer,
    CartItemSerializer, ProductCommentSerializer, SellerSerializer, BuyerRegisterSerializer,
    SellerRegisterSerializer, QuickDealSerializer, SellerProfileSerializer, SellerProductSerializer,
    SellerOrderSerializer, SellerQuickDealSerializer, SellerStatsSerializer )
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
logger = logging.getLogger('dusupay')
from django.shortcuts import get_object_or_404
from .permissions import IsSeller, IsBuyer, IsOwner
from rest_framework import filters
from django.shortcuts import redirect
from django.conf import settings
from .models import Payment, OrderItem, CommentHelpful
from .serializers import InitiatePaymentSerializer, RefundSerializer, CancelOrderSerializer
from django.db import transaction
from .models import SellerFollow
from django_filters.rest_framework import DjangoFilterBackend  
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .models import Notification
from .serializers import NotificationSerializer
import logging
from .dusupay_utils import DusuPayClient
from .models import DusuPayConfig

from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
dusupay_client = DusuPayClient()

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
        wishlist, _ = Wishlist.objects.get_or_create(buyer=self.request.user.buyer_profile)
        return [item.product for item in wishlist.wishlistitem_set.all()]

    @action(detail=False, methods=['post'])
    def add(self, request):
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

    try:
        if '@' in username_or_email:
            user = User.objects.get(email=username_or_email)
            username = user.username
        else:
            username = username_or_email
            user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=400)

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
        if hasattr(self.request.user, 'seller_profile'):
            if self.action in ['update', 'partial_update', 'destroy']:
                return Product.objects.filter(seller=self.request.user.seller_profile)
        return Product.objects.all()

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
            try:
                user = User.objects.get(email=username)
                username = user.username
            except User.DoesNotExist:
                return Response({'error': 'Invalid credentials'}, status=401)

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
            'email': request.user.email
        }
    })


class LikedProductsView(generics.ListAPIView):
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        buyer = self.request.user.buyer_profile
        liked_product_ids = ProductLike.objects.filter(buyer=buyer).values_list('product_id', flat=True)
        return Product.objects.filter(id__in=liked_product_ids)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def toggle_product_like(request, product_id):
    try:
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
        cart = get_cart(request)

        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={'quantity': quantity, 'answers': answers}
        )

        if not created:
            cart_item.quantity += quantity
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
        return Response({'error': 'Order not found or not pending'}, status=status.HTTP_404_NOT_FOUND)

    # Get buyer details
    buyer = request.user.buyer_profile
    customer_name = buyer.name or request.user.username
    customer_email = request.user.email

    # Prepare common parameters
    common_params = {
        'merchant_reference': str(order.id),
        'amount': float(order.total_amount),
        'currency': order.currency,
        'customer_name': customer_name,
        'customer_email': customer_email,
        'description': f"Order #{order.id} payment"
    }

    # Add method-specific parameters
    if transaction_method == 'MOBILE_MONEY':
        if not phone_number:
            return Response({'error': 'Phone number required for mobile money'}, status=400)
        formatted_phone = format_phone_number(phone_number)
        provider_code = dusupay_client.get_provider_code(formatted_phone)
        common_params.update({
            'transaction_method': 'MOBILE_MONEY',
            'provider_code': provider_code,
            'account_number': formatted_phone
        })
    elif transaction_method == 'BANK_TRANSFER':
        if not account_number or not bank_code:
            return Response({'error': 'Bank account number and bank code required'}, status=400)
        common_params.update({
            'transaction_method': 'BANK_TRANSFER',
            'bank_code': bank_code,
            'account_number': account_number
        })
    elif transaction_method == 'CARD':
        # Card payments require a redirect URL
        common_params.update({
            'transaction_method': 'CARD',
            'redirect_url': settings.DUSUPAY_CALLBACK_URL  # This URL will handle redirect after payment
        })
    else:
        return Response({'error': 'Invalid transaction method'}, status=400)

    response = dusupay_client.initiate_payment(**common_params)

    if response['success']:
        order.dusupay_internal_reference = response['internal_reference']
        order.dusupay_merchant_reference = response['merchant_reference']
        order.save()

        # For card payments, return redirect URL to frontend
        if transaction_method == 'CARD' and response.get('redirect_url'):
            return Response({
                'redirect_url': response['redirect_url'],
                'order_id': order.id
            })

        # For mobile money/bank, return pending status
        return Response({
            'status': 'pending',
            'message': 'Payment initiated successfully',
            'internal_reference': response['internal_reference'],
            'order_id': order.id
        })
    else:
        return Response({'error': response['error']}, status=status.HTTP_400_BAD_REQUEST)

def format_phone_number(phone):
    """Format phone number to international format with country code"""
    phone = str(phone).strip()
    # Remove any non-digit characters
    phone = ''.join(filter(str.isdigit, phone))
    if phone.startswith('0'):
        phone = '256' + phone[1:]
    elif len(phone) == 9:
        phone = '256' + phone
    elif not phone.startswith('256'):
        phone = '256' + phone
    return phone


@api_view(['POST'])
@permission_classes([AllowAny])
def dusupay_webhook(request):
    """Handle DusuPay webhook notifications (transaction completed/failed)"""
    logger.info(f"DusuPay webhook received: {request.data}")

    serializer = DusuPayWebhookSerializer(data=request.data)
    if not serializer.is_valid():
        logger.warning(f"Invalid webhook data: {serializer.errors}")
        return Response({"status": "error", "message": "Invalid data"}, status=200)

    event = serializer.validated_data['event']
    payload = serializer.validated_data['payload']

    # Update config to track webhook receipt
    config, _ = DusuPayConfig.objects.get_or_create(pk=1)
    config.webhook_received_at = timezone.now()
    config.save()

    merchant_reference = payload.get('merchant_reference')
    internal_reference = payload.get('internal_reference')

    # Find the order
    try:
        if merchant_reference:
            order = Order.objects.get(id=merchant_reference)
        elif internal_reference:
            order = Order.objects.get(dusupay_internal_reference=internal_reference)
        else:
            logger.warning("No reference found in webhook payload")
            return Response({"status": "ok"}, status=200)
    except Order.DoesNotExist:
        logger.error(f"Order not found for merchant_reference: {merchant_reference}")
        return Response({"status": "ok"}, status=200)

    transaction_status = payload.get('transaction_status', '').upper()

    if event == 'transaction.completed' or transaction_status == 'COMPLETED':
        # Payment successful
        order.status = 'paid'
        order.payment_method = payload.get('provider_code', payload.get('bank_code', 'card'))
        order.save()

        Payment.objects.update_or_create(
            order=order,
            defaults={
                'amount': payload.get('request_amount', order.total_amount),
                'payment_method': payload.get('provider_code', payload.get('bank_code', 'card')),
                'payment_status': 'successful',
                'transaction_reference': internal_reference,
                'gateway_response': json.dumps(payload),
                'payment_date': timezone.now()
            }
        )
        logger.info(f"Order {order.id} marked as paid via DusuPay")

    elif event == 'transaction.failed' or transaction_status == 'FAILED':
        # Payment failed
        order.status = 'cancelled'
        order.save()

        Payment.objects.update_or_create(
            order=order,
            defaults={
                'amount': payload.get('request_amount', order.total_amount),
                'payment_method': payload.get('provider_code', payload.get('bank_code', 'card')),
                'payment_status': 'failed',
                'transaction_reference': internal_reference,
                'gateway_response': json.dumps(payload),
                'payment_date': timezone.now()
            }
        )
        logger.info(f"Order {order.id} payment failed")

    return Response({"status": "ok"}, status=200)


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
        # Simple test request to check connectivity
        response = dusupay_client.check_transaction_status('test')
        return Response({"status": "healthy", "message": "DusuPay API is reachable"}, status=200)
    except Exception as e:
        logger.error(f"DusuPay health check failed: {str(e)}")
        return Response({"status": "unhealthy", "message": str(e)}, status=503)


@api_view(['POST'])
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
                return Response({
                    'error': 'Only buyers can follow sellers. No buyer profile found for this user.'
                }, status=status.HTTP_403_FORBIDDEN)
            except Exception as e:
                print(f"Error querying buyer: {e}")
                return Response({
                    'error': 'Error checking buyer profile'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Check if user has seller profile (they shouldn't)
        print(f"Has seller_profile: {hasattr(request.user, 'seller_profile')}")
        
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
                return Response({
                    'success': True,
                    'following': following,
                    'followers_count': seller.followers,
                    'message': message
                }, status=status.HTTP_200_OK)
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
























