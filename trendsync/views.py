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
from django.shortcuts import get_object_or_404
from .permissions import IsSeller, IsBuyer, IsOwner
from rest_framework import filters
from django.shortcuts import redirect
from django.conf import settings
from .models import PesapalConfig, Payment, OrderItem, CommentHelpful
from .serializers import InitiatePaymentSerializer, RefundSerializer, CancelOrderSerializer
from . import pesapal_utils  
from django.db import transaction
from .models import SellerFollow
from django_filters.rest_framework import DjangoFilterBackend  
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .models import Notification
from .serializers import NotificationSerializer
import logging
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
logger = logging.getLogger('pesapal')


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
        ).select_related('product').order_by('-priority', '-timestamp')[:12]

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
@permission_classes([permissions.IsAuthenticated])
def initiate_payment(request):
    logger.info(f"Payment initiation by user {request.user.id}")
    serializer = InitiatePaymentSerializer(data=request.data)
    if not serializer.is_valid():
        logger.warning(f"Invalid initiate_payment data: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    order_id = serializer.validated_data['order_id']
    try:
        order = Order.objects.get(id=order_id, buyer=request.user.buyer_profile, status='pending')
    except Order.DoesNotExist:
        logger.warning(f"Order {order_id} not found or not pending for user {request.user.id}")
        return Response({'error': 'Order not found or not pending'}, status=status.HTTP_404_NOT_FOUND)

    address = order.delivery_address or request.user.buyer_profile.addresses.filter(is_default=True).first()
    if not address:
        logger.warning(f"No delivery address for order {order_id}")
        return Response({'error': 'No delivery address'}, status=status.HTTP_400_BAD_REQUEST)

    billing_address = {
        "email_address": request.user.email,
        "phone_number": address.phone,
        "country_code": address.iso_country_code,
        "first_name": request.user.buyer_profile.name.split()[0] if request.user.buyer_profile.name else "",
        "last_name": " ".join(request.user.buyer_profile.name.split()[1:]) if request.user.buyer_profile.name else "",
        "line_1": address.street,
        "city": address.city,
        "state": address.state,
        "postal_code": address.postal_code,
    }
    billing_address = {k: v for k, v in billing_address.items() if v is not None}

    config, _ = PesapalConfig.objects.get_or_create(pk=1)
    if not config.ipn_id:
        logger.info("No IPN ID found, registering new IPN URL")
        try:
            ipn_id = pesapal_utils.register_ipn_url(settings.PESAPAL_IPN_URL)
            config.ipn_id = ipn_id
            config.save()
            logger.info(f"IPN registered, ipn_id={ipn_id}")
        except Exception as e:
            logger.error(f"IPN registration failed: {str(e)}", exc_info=True)
            return Response({'error': f'IPN registration failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    else:
        ipn_id = config.ipn_id
        logger.debug(f"Using existing IPN ID: {ipn_id}")

    try:
        pesapal_response = pesapal_utils.submit_order_request(
            merchant_reference=str(order.id),
            amount=order.total_amount,
            currency=order.currency,
            description=f"Order #{order.id}",
            callback_url=settings.PESAPAL_CALLBACK_URL,
            notification_id=ipn_id,
            billing_address=billing_address
        )
    except Exception as e:
        logger.error(f"Pesapal submit error for order {order.id}: {str(e)}", exc_info=True)
        return Response({'error': f'Pesapal error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    order.pesapal_tracking_id = pesapal_response.get('order_tracking_id')
    order.save()
    logger.info(f"Order {order.id} initiated, tracking_id={order.pesapal_tracking_id}")

    return Response({
        'redirect_url': pesapal_response.get('redirect_url'),
        'order_tracking_id': pesapal_response.get('order_tracking_id')
    })


@api_view(['GET', 'POST'])
@permission_classes([permissions.AllowAny])
def pesapal_ipn(request):
    params = request.GET if request.method == 'GET' else request.data
    order_tracking_id = params.get('OrderTrackingId')
    merchant_reference = params.get('OrderMerchantReference')
    notification_type = params.get('OrderNotificationType')

    logger.info(f"IPN received: tracking_id={order_tracking_id}, ref={merchant_reference}, type={notification_type}")

    if not order_tracking_id or not merchant_reference:
        logger.warning("IPN missing required parameters")
        return Response({"status": 200, "message": "Missing parameters"}, status=200)

    try:
        order = Order.objects.get(id=merchant_reference)
    except Order.DoesNotExist:
        logger.error(f"Order {merchant_reference} not found for IPN")
        return Response({"status": 200, "message": "Order not found"}, status=200)

    if order.status == 'paid':
        logger.info(f"Order {order.id} already marked paid, ignoring duplicate IPN")
        return Response({"status": 200}, status=200)

    try:
        status_data = pesapal_utils.get_transaction_status(order_tracking_id)
    except Exception as e:
        logger.error(f"IPN get_transaction_status failed for {order_tracking_id}: {str(e)}", exc_info=True)
        return Response({"status": 200, "message": "Status fetch failed"}, status=200)

    payment_status = status_data.get('payment_status_description')
    status_code = status_data.get('status_code')
    confirmation_code = status_data.get('confirmation_code')
    amount = status_data.get('amount')
    payment_method = status_data.get('payment_method')
    currency = status_data.get('currency', order.currency)

    logger.info(f"Transaction status for order {order.id}: {payment_status}")

    if payment_status and payment_status.lower() == 'completed':
        pm_lower = (payment_method or '').lower()
        if 'visa' in pm_lower or 'mastercard' in pm_lower or 'card' in pm_lower:
            order.payment_method = 'card'
        elif 'bank' in pm_lower:
            order.payment_method = 'bank_transfer'
        else:
            order.payment_method = 'wallet'

        order.status = 'paid'
        order.save()

        Payment.objects.update_or_create(
            order=order,
            defaults={
                'amount': amount,
                'payment_method': payment_method,
                'payment_status': 'successful',
                'transaction_reference': confirmation_code,
                'gateway_response': status_data,
                'payment_date': timezone.now()
            }
        )
        logger.info(f"Order {order.id} marked as paid with method {order.payment_method}")
    elif payment_status and payment_status.lower() in ['failed', 'invalid']:
        order.status = 'cancelled'
        order.save()
        logger.info(f"Order {order.id} cancelled due to {payment_status}")

        return Response({"status": 200}, status=200)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def pesapal_callback(request):
    merchant_reference = request.GET.get('OrderMerchantReference')
    logger.info(f"Callback received for order {merchant_reference}")
    frontend_url = f"{settings.FRONTEND_BASE_URL}/order/{merchant_reference}/"
    return redirect(frontend_url)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def refund_payment(request):
    if not request.user.is_staff:
        return Response({'error': 'Only administrators can perform refunds.'}, status=status.HTTP_403_FORBIDDEN)

    logger.info(f"Refund requested by admin {request.user.id}")
    serializer = RefundSerializer(data=request.data)
    if not serializer.is_valid():
        logger.warning(f"Invalid refund data: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    order_id = serializer.validated_data['order_id']
    amount = serializer.validated_data['amount']
    remarks = serializer.validated_data['remarks']
    username = serializer.validated_data.get('username') or request.user.username

    try:
        order = Order.objects.get(id=order_id, status='paid')
    except Order.DoesNotExist:
        logger.warning(f"Order {order_id} not found or not paid for refund")
        return Response({'error': 'Order not found or not paid'}, status=status.HTTP_404_NOT_FOUND)

    try:
        payment = order.payment
    except Payment.DoesNotExist:
        logger.error(f"No payment record for order {order_id}")
        return Response({'error': 'Payment record not found'}, status=status.HTTP_404_NOT_FOUND)

    confirmation_code = payment.transaction_reference
    if not confirmation_code:
        logger.error(f"No confirmation code for order {order_id}")
        return Response({'error': 'No confirmation code'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        refund_resp = pesapal_utils.refund_request(confirmation_code, amount, username, remarks)
    except Exception as e:
        logger.error(f"Refund API error for order {order_id}: {str(e)}", exc_info=True)
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    if refund_resp.get('status') == '200':
        order.status = 'refunded'
        order.save()
        logger.info(f"Order {order_id} refund requested successfully")
        return Response({'message': 'Refund request submitted successfully'})
    else:
        logger.error(f"Refund failed for order {order_id}: {refund_resp.get('message')}")
        return Response({'error': refund_resp.get('message', 'Refund failed')}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def cancel_pesapal_order(request):
    logger.info(f"Cancel order requested by user {request.user.id}")
    serializer = CancelOrderSerializer(data=request.data)
    if not serializer.is_valid():
        logger.warning(f"Invalid cancel data: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    order_id = serializer.validated_data['order_id']
    try:
        order = Order.objects.get(id=order_id, buyer=request.user.buyer_profile, status='pending')
    except Order.DoesNotExist:
        logger.warning(f"Order {order_id} not found or not pending for cancellation")
        return Response({'error': 'Order not found or not pending'}, status=status.HTTP_404_NOT_FOUND)

    if not order.pesapal_tracking_id:
        logger.error(f"Order {order_id} has no Pesapal tracking ID")
        return Response({'error': 'No Pesapal tracking ID'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        cancel_resp = pesapal_utils.cancel_order(order.pesapal_tracking_id)
    except Exception as e:
        logger.error(f"Cancel API error for order {order_id}: {str(e)}", exc_info=True)
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    if cancel_resp.get('status') == '200':
        order.status = 'cancelled'
        order.save()
        logger.info(f"Order {order_id} cancelled successfully")
        return Response({'message': 'Order cancelled successfully'})
    else:
        logger.error(f"Cancel failed for order {order_id}: {cancel_resp.get('message')}")
        return Response({'error': cancel_resp.get('message', 'Cancellation failed')}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def order_status(request, order_id):
    try:
        order = Order.objects.get(id=order_id, buyer=request.user.buyer_profile)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

    return Response({
        'status': order.status,
        'pesapal_tracking_id': order.pesapal_tracking_id
    })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def pesapal_health(request):
    try:
        pesapal_utils.get_access_token()
        return Response({"status": "healthy", "message": "Pesapal API is reachable"}, status=200)
    except Exception as e:
        logger.error(f"Pesapal health check failed: {str(e)}", exc_info=True)
        return Response({"status": "unhealthy", "message": str(e)}, status=503)
 

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsBuyer])
def create_order_from_cart(request):
    cart = get_cart(request)
    if not cart.items.exists():
        return Response({'error': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)

    buyer = request.user.buyer_profile
    total_amount = sum(item.subtotal() for item in cart.items.all())

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
            except Buyer.DoesNotExist:
                print("No buyer profile found in database for this user")
            except Exception as e:
                print(f"Error querying buyer: {e}")
        
        # Check if user has seller profile (they shouldn't)
        print(f"Has seller_profile: {hasattr(request.user, 'seller_profile')}")
        
        # Check if user has both (shouldn't)
        if hasattr(request.user, 'buyer_profile') and hasattr(request.user, 'seller_profile'):
            print("WARNING: User has both buyer and seller profiles!")
        
        print("=" * 50)
        
        # Check if user has buyer profile
        if not hasattr(request.user, 'buyer_profile'):
            # Try to find the buyer profile directly as a fallback
            from .models import Buyer
            try:
                buyer = Buyer.objects.get(user=request.user)
                print(f"Found buyer via direct query, attaching to user")
                # Attach it to the user for this request
                request.user.buyer_profile = buyer
            except Buyer.DoesNotExist:
                return Response({
                    'error': 'Only buyers can follow sellers. No buyer profile found for this user.'
                }, status=status.HTTP_403_FORBIDDEN)
        
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
                    
                    # Notification for BUYER (confirmation)
                    SimpleNotification.objects.create(
                        recipient=request.user,  # The buyer
                        sender_name=seller.name,
                        message=f"You are now following {seller.name}",
                        type='follow_confirmation'
                    )
                    
                    print(f"✓ Notifications created for seller and buyer")
                except Exception as e:
                    print(f"⚠️ Could not create notifications: {e}")
        
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
            
            # Update fields if provided
            if 'name' in request.data:
                buyer.name = request.data['name']
                print(f"Updated name to: {buyer.name}")
            if 'contact' in request.data:
                buyer.contact = request.data['contact']
                print(f"Updated contact to: {buyer.contact}")
            if 'location' in request.data:
                buyer.location = request.data['location']
                print(f"Updated location to: {buyer.location}")
            if 'dob' in request.data:
                buyer.dob = request.data['dob']
                print(f"Updated dob to: {buyer.dob}")
                
            buyer.save()
            print("Profile saved successfully")
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