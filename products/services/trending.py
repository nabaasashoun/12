from django.utils import timezone
from datetime import timedelta
from django.db.models import Sum, Count
from django.db.models.functions import Coalesce
from trendsync.models import Product, Buyer

TRENDING_DAYS = 30

def trending_since():
    return timezone.now() - timedelta(days=TRENDING_DAYS)



def trending_products_queryset():
    since = trending_since()

    return (
        Product.objects
        .filter(
            orderitem__order__status='paid',
            orderitem__order__order_date__gte=since
        )
        .annotate(
            units_sold=Coalesce(Sum('orderitem__quantity'), 0),
            purchase_count=Count('orderitem__order', distinct=True)
        )
        .order_by('-units_sold', '-purchase_count')
    )

def trending_products_for_buyer(buyer: Buyer, category_id=None):
    qs = trending_products_queryset()

    if buyer.location:
        qs = qs.filter(seller__location__iexact=buyer.location)

    if category_id:
        qs = qs.filter(category_id=category_id)

    return qs