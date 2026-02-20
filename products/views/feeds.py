from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from trendsync.models import Product
from trendsync.serializers import ProductSerializer
from products.services.trending import trending_products_for_buyer
from products.services.algorithm import ranked_feed_queryset

class ProductFeedViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for product feeds:
    - Trending products
    - Home/content feed ranking
    """
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]  # tighten later if needed

    def get_queryset(self):
        """
        Default queryset is empty.
        We only expose explicit feed endpoints.
        """
        return Product.objects.none()
    
    @action(detail=False, methods=['get'], url_path='trending')
    def trending(self, request):
        buyer = None
        category_id = request.query_params.get('category')

        if request.user.is_authenticated:
            buyer = getattr(request.user, 'buyer_profile', None)

        if buyer:
            qs = trending_products_for_buyer(buyer, category_id=category_id)
        else:
            # fallback: global trending (no region filter)
            qs = trending_products_for_buyer(
                buyer=type('Anon', (), {'location': None})(),
                category_id=category_id
            )

        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='home')
    def home_feed(self, request):
        qs = ranked_feed_queryset()

        # Optional: region bias if buyer exists
        if request.user.is_authenticated:
            buyer = getattr(request.user, 'buyer_profile', None)
            if buyer and buyer.location:
                qs = qs.filter(seller__location__iexact=buyer.location)

        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)