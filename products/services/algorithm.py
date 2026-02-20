from django.db.models import Count, Avg, F, FloatField, ExpressionWrapper
from django.db.models.functions import Coalesce
from trendsync.models import Product, Buyer
from decimal import Decimal

def base_feed_queryset():
    return (
        Product.objects
        .select_related('seller', 'category')
        .annotate(
            recent_likes=Count('likes', distinct=True),
            recent_comments=Count('comments', distinct=True),
            avg_rating=Coalesce(Avg('comments__rating'), 0.0),
        )
    )

price_score = ExpressionWrapper(
    1 / (F('unit_price') + Decimal('1.0')),
    output_field=FloatField()
)

seller_score = ExpressionWrapper(
    (F('seller__sales') * 0.6) +
    (F('seller__trust') * 0.3) +
    (F('seller__followers') * 0.1),
    output_field=FloatField()
)

def ranked_feed_queryset():
    qs = base_feed_queryset()

    qs = qs.annotate(
        price_score=price_score,
        seller_score=seller_score,
        interaction_score=ExpressionWrapper(
            F('recent_likes') + (F('recent_comments') * 2),
            output_field=FloatField()
        ),
        popularity_score=ExpressionWrapper(
            F('sales_count') * 0.5,
            output_field=FloatField()
        ),
    )

    qs = qs.annotate(
        final_score=ExpressionWrapper(
            (F('price_score') * 0.25) +
            (F('seller_score') * 0.25) +
            (F('interaction_score') * 0.3) +
            (F('popularity_score') * 0.2),
            output_field=FloatField()
        )
    )

    return qs.order_by('-final_score', '-date_of_post')