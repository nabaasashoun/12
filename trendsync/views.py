from rest_framework import viewsets, generics, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from .models import Product, Buyer, Order, Category, Cart, CartItem, ProductLike, ProductComment, Wishlist, WishlistItem, Seller, QuickDeal
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
#HELLO WORLD

# ---------- Helper: get_cart with duplicate merging ----------
def get_cart(request):
    """Retrieve the current cart, merging any duplicates if they exist."""
    if request.user.is_authenticated and hasattr(request.user, 'buyer_profile'):
        buyer = request.user.buyer_profile
        carts = Cart.objects.filter(buyer=buyer)
        if carts.exists():
            if carts.count() > 1:
                # Merge all extra carts into the first one
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
                            # Merge answers: keep existing (could be improved)
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


# ---------- Existing views (unchanged except where noted) ----------

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
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'description']

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
                'message': 'Product removed from liked items',
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


# ---------- add_to_cart  ----------
@api_view(['POST'])
@permission_classes([AllowAny])
def add_to_cart(request):
    """Add a product to cart"""
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
            # Merge answers (keep existing, but could be enhanced)
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
    """Update quantity and/or answers of a cart item"""
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


# ---------- Quick Deals ----------
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
        }, status=status.HTTP_200_OK)
    except Exception as e:
        print(f"Error fetching quick deals: {e}")
        return Response({'status': 'error', 'message': 'Failed to fetch quick deals'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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


# ---------- Wishlist ----------
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


# ---------- Buyer profile and order count ----------
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


# ---------- Seller-specific views ----------
class SellerProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsSeller]
    serializer_class = SellerProfileSerializer

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


# ---------- Comments ----------
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
