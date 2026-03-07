from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import SellerFollow, Notification, Seller

@receiver(post_save, sender=SellerFollow)
def create_follow_notification(sender, instance, created, **kwargs):
    if created:
        # Get the seller's user
        seller_user = instance.seller.user
        
        # Create notification for the seller
        Notification.objects.create(
            recipient=seller_user,
            sender=instance.buyer.user,
            notification_type='follow',
            title='New Follower',
            message=f'{instance.buyer.name} started following you',
            data={
                'buyer_id': instance.buyer.id,
                'buyer_name': instance.buyer.name,
                'seller_id': instance.seller.id,
                'follower_count': instance.seller.followers
            }
        )