from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import SellerFollow, Notification, Seller, SimpleNotification, ChatMessage
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

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

@receiver(post_save, sender=Notification)
def send_notification_websocket(sender, instance, created, **kwargs):
    if created:
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"user_{instance.recipient.id}",
            {
                "type": "websocket_message",
                "data": {
                    "type": "notification",
                    "notification_id": instance.id,
                    "notification_type": instance.notification_type,
                    "title": instance.title,
                }
            }
        )

@receiver(post_save, sender=SimpleNotification)
def send_simple_notification_websocket(sender, instance, created, **kwargs):
    if created:
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"user_{instance.recipient.id}",
            {
                "type": "websocket_message",
                "data": {
                    "type": "notification",
                    "notification_id": instance.id,
                    "notification_type": instance.type,
                    "title": instance.sender_name,
                }
            }
        )

@receiver(post_save, sender=ChatMessage)
def create_chat_notification(sender, instance, created, **kwargs):
    """
    Create a notification when a new chat message is sent.
    """
    if created:
        sender_name = instance.sender.username
        if hasattr(instance.sender, 'seller_profile'):
            sender_name = instance.sender.seller_profile.name
        elif hasattr(instance.sender, 'buyer_profile'):
            sender_name = instance.sender.buyer_profile.name
        
        # Create notification for recipient
        SimpleNotification.objects.create(
            recipient=instance.recipient,
            sender_name=sender_name,
            message=f"New message from {sender_name}: {instance.content[:50]}...",
            type='chat_message'
        )