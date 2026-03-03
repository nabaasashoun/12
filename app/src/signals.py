from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
from django.core.cache import cache
from .models import Product, ProductLike, ProductComment

@receiver(post_save, sender=Product)
def clear_product_cache(sender, instance, **kwargs):
    """Clear cache when product is created or updated"""
    cache_keys_to_delete = [
        'all_products',
        f'product_{instance.id}',
        f'category_{instance.category_id}_products' if instance.category_id else None,
        f'seller_{instance.seller_id}_products'
    ]
    
    for key in cache_keys_to_delete:
        if key:
            cache.delete(key)

@receiver(pre_delete, sender=Product)
def handle_product_deletion(sender, instance, **kwargs):
    """Handle cleanup when product is deleted"""
    # You can add cleanup logic here
    pass

@receiver(post_save, sender=ProductLike)
def update_product_like_count(sender, instance, created, **kwargs):
    """Update product like count when a like is created or deleted"""
    if created:
        instance.product.like_count += 1
    else:
        instance.product.like_count -= 1
    instance.product.save()