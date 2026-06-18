# trendsync/consumers.py
import json
import re
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
# Remove these top-level imports:
# from django.contrib.auth.models import User
# from django.core.exceptions import ObjectDoesNotExist
# from rest_framework_simplejwt.tokens import AccessToken
# from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
import logging

# Set up logging
logger = logging.getLogger(__name__)

# Contact information patterns for blocking
CONTACT_PATTERNS = [
    # Email
    re.compile(r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}'),
    # Phone (international and local formats)
    re.compile(r'(\+?\d[\d\s\-().]{6,18}\d)'),
    re.compile(r'(0[7-9][0-9]{8})'),  # Ugandan phone numbers
    # URLs
    re.compile(r'(https?://|www\.)\S+', re.IGNORECASE),
    re.compile(r'\S+\.(com|net|org|io|co|app|me|ly|gg|ug)\b', re.IGNORECASE),
    # Social handles
    re.compile(r'@[a-zA-Z0-9_]{3,}'),
    # Telegram / WhatsApp
    re.compile(r't\.me/\S+', re.IGNORECASE),
    re.compile(r'wa\.me/\S+', re.IGNORECASE),
]

REJECTION_MESSAGE = "Your message was not sent — sharing contact details is not allowed."


def contains_contact_info(text: str) -> bool:
    """Check if text contains any contact information patterns"""
    return any(pattern.search(text) for pattern in CONTACT_PATTERNS)


class TrendsyncConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for handling real-time chat and notifications
    """
    
    HEARTBEAT_INTERVAL = 25  # seconds between heartbeats
    MAX_MESSAGE_LENGTH = 5000  # maximum characters per message
    
    async def connect(self):
        """
        Handle WebSocket connection with JWT authentication from query string
        """
        logger.info("🔌 WebSocket connection attempt")
        
        # Get the token from the query string
        query_string = self.scope.get('query_string', b'').decode()
        token = None
        
        # Parse query string to get token
        if query_string:
            params = dict(param.split('=') for param in query_string.split('&') if '=' in param)
            token = params.get('token')
        
        if not token:
            logger.warning("❌ WebSocket connection rejected: No token provided")
            await self.close(code=4001)
            return
        
        # Authenticate user using JWT token
        user = await self.get_user_from_token(token)
        
        if not user:
            logger.warning(f"❌ WebSocket connection rejected: Invalid token")
            await self.close(code=4001)
            return
        
        # Set the user in scope
        self.scope['user'] = user
        self.user = user
        
        logger.info(f"✅ User authenticated: {self.user.username} (ID: {self.user.id})")
        
        # Set up room names
        self.room_group_name = "trendsync_updates"
        self.user_group_name = f"user_{self.user.id}"
        
        try:
            # Add to global group for broadcasts
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            logger.info(f"Added to global group: {self.room_group_name}")
            
            # Add to user-specific group for private messages
            await self.channel_layer.group_add(
                self.user_group_name,
                self.channel_name
            )
            logger.info(f"Added to user group: {self.user_group_name}")
            
            # Accept the connection
            await self.accept()
            logger.info(f"✅ WebSocket accepted for user: {self.user.username}")
            
            # Send connection confirmation
            await self.send(text_data=json.dumps({
                "type": "connection_established",
                "user_id": self.user.id,
                "username": self.user.username,
                "message": "Connected successfully"
            }))
            
            # Start heartbeat loop
            self._heartbeat_task = asyncio.ensure_future(self._heartbeat_loop())
            
            # Send unread message count
            unread_count = await self.get_unread_count()
            await self.send(text_data=json.dumps({
                "type": "unread_count",
                "count": unread_count
            }))
            
        except Exception as e:
            logger.error(f"Error during WebSocket connection: {str(e)}")
            await self.close(code=4000)
    
    async def disconnect(self, code):
        """
        Handle WebSocket disconnection
        """
        logger.info(f"🔌 WebSocket disconnected: Code {code}")
        
        # Cancel heartbeat task
        if hasattr(self, '_heartbeat_task') and self._heartbeat_task:
            self._heartbeat_task.cancel()
            try:
                await self._heartbeat_task
            except asyncio.CancelledError:
                pass
        
        # Remove from groups
        try:
            if hasattr(self, 'room_group_name'):
                await self.channel_layer.group_discard(
                    self.room_group_name,
                    self.channel_name
                )
                logger.info(f"Removed from global group: {self.room_group_name}")
            
            if hasattr(self, 'user_group_name'):
                await self.channel_layer.group_discard(
                    self.user_group_name,
                    self.channel_name
                )
                logger.info(f"Removed from user group: {self.user_group_name}")
        except Exception as e:
            logger.error(f"Error removing from groups: {str(e)}")
    
    async def receive(self, text_data=None, bytes_data=None):
        """
        Handle incoming WebSocket messages
        """
        if not text_data:
            return
        
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON received: {str(e)}")
            await self.send(text_data=json.dumps({
                "type": "error",
                "code": "invalid_json",
                "message": "Invalid JSON format"
            }))
            return
        
        # Get message type
        message_type = data.get("type", "broadcast")
        logger.info(f"📨 Received message type: {message_type} from user {self.user.id}")
        
        # Handle different message types
        if message_type == "ping":
            await self.send(text_data=json.dumps({"type": "pong"}))
            logger.debug("💓 Ping received, sent pong")
            return
        
        elif message_type == "chat_message":
            await self._handle_chat_message(data)
        
        elif message_type == "typing":
            await self._handle_typing_indicator(data)
        
        elif message_type == "read_receipt":
            await self._handle_read_receipt(data)
        
        else:
            # Broadcast to all users in the group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "websocket_message",
                    "data": data,
                    "sender_id": self.user.id,
                }
            )
    
    async def _handle_chat_message(self, data):
        """
        Handle incoming chat messages
        """
        # Import inside method to avoid Django setup issues
        from django.contrib.auth.models import User
        from .models import ChatMessage
        
        recipient_id = data.get("recipient_id")
        content = data.get("content", "").strip()
        
        # Validate input
        if not recipient_id:
            await self.send(text_data=json.dumps({
                "type": "error",
                "code": "missing_recipient",
                "message": "Recipient ID is required"
            }))
            return
        
        if not content:
            await self.send(text_data=json.dumps({
                "type": "error",
                "code": "empty_message",
                "message": "Message content is required"
            }))
            return
        
        # Check message length
        if len(content) > self.MAX_MESSAGE_LENGTH:
            await self.send(text_data=json.dumps({
                "type": "error",
                "code": "message_too_long",
                "message": f"Message exceeds maximum length of {self.MAX_MESSAGE_LENGTH} characters"
            }))
            return
        
        # Check for contact information
        if contains_contact_info(content):
            logger.warning(f"Blocked message with contact info from user {self.user.id} to {recipient_id}")
            await self.send(text_data=json.dumps({
                "type": "error",
                "code": "contact_info_blocked",
                "message": REJECTION_MESSAGE,
            }))
            return
        
        # Save message to database
        try:
            recipient = await database_sync_to_async(User.objects.get)(id=recipient_id)
            message = await database_sync_to_async(ChatMessage.objects.create)(
                sender_id=self.user.id,
                recipient=recipient,
                content=content,
                is_read=False,
            )
            logger.info(f"💾 Message saved: ID {message.id}")
        except User.DoesNotExist:
            logger.error(f"Recipient user not found: {recipient_id}")
            await self.send(text_data=json.dumps({
                "type": "error",
                "code": "recipient_not_found",
                "message": "Recipient not found"
            }))
            return
        except Exception as e:
            logger.error(f"Error saving message: {str(e)}")
            await self.send(text_data=json.dumps({
                "type": "error",
                "code": "save_failed",
                "message": "Failed to save message"
            }))
            return
        
        # Prepare message data
        msg_data = {
            "type": "chat_message",
            "id": message.id,
            "sender_id": self.user.id,
            "sender_name": self.user.username,
            "recipient_id": recipient_id,
            "content": content,
            "timestamp": message.timestamp.isoformat(),
            "is_read": message.is_read,
        }
        
        # Send to recipient's group
        recipient_group = f"user_{recipient_id}"
        try:
            await self.channel_layer.group_send(
                recipient_group,
                {
                    "type": "websocket_message",
                    "data": msg_data,
                }
            )
            logger.info(f"📤 Message sent to user {recipient_id}")
        except Exception as e:
            logger.error(f"Failed to send message to recipient {recipient_id}: {str(e)}")
            await self.send(text_data=json.dumps({
                "type": "error",
                "code": "delivery_failed",
                "message": "Failed to deliver message to recipient"
            }))
            return
        
        # Send confirmation to sender
        await self.send(text_data=json.dumps({
            "type": "message_sent",
            "data": msg_data,
            "status": "delivered"
        }))
    
    async def _handle_typing_indicator(self, data):
        """
        Handle typing indicator
        """
        recipient_id = data.get("recipient_id")
        is_typing = data.get("is_typing", True)
        
        if not recipient_id:
            return
        
        # Send typing indicator to recipient
        recipient_group = f"user_{recipient_id}"
        await self.channel_layer.group_send(
            recipient_group,
            {
                "type": "websocket_message",
                "data": {
                    "type": "typing",
                    "sender_id": self.user.id,
                    "sender_name": self.user.username,
                    "is_typing": is_typing,
                }
            }
        )
    
    async def _handle_read_receipt(self, data):
        """
        Handle read receipt
        """
        # Import inside method to avoid Django setup issues
        from .models import ChatMessage
        
        sender_id = data.get("sender_id")
        message_ids = data.get("message_ids", [])
        
        if not sender_id:
            return
        
        # Mark messages as read
        try:
            if message_ids and len(message_ids) > 0:
                await database_sync_to_async(
                    ChatMessage.objects.filter(
                        id__in=message_ids,
                        recipient_id=self.user.id
                    ).update
                )(is_read=True)
            else:
                # Mark all messages from sender as read
                await database_sync_to_async(
                    ChatMessage.objects.filter(
                        sender_id=sender_id,
                        recipient_id=self.user.id,
                        is_read=False
                    ).update
                )(is_read=True)
        except Exception as e:
            logger.error(f"Error marking messages as read: {str(e)}")
            return
        
        # Send confirmation
        await self.send(text_data=json.dumps({
            "type": "read_receipt_confirmed",
            "sender_id": sender_id,
            "message_ids": message_ids,
            "reader_id": self.user.id,
        }))
    
    async def websocket_message(self, event):
        """
        Handle messages from channel layer
        """
        data = event["data"]
        sender_id = event.get("sender_id")
        
        # Don't send message back to sender
        if sender_id == self.user.id:
            return
        
        await self.send(text_data=json.dumps(data))
    
    async def _heartbeat_loop(self):
        """
        Send periodic heartbeats to keep connection alive
        """
        try:
            while True:
                await asyncio.sleep(self.HEARTBEAT_INTERVAL)
                try:
                    await self.send(text_data=json.dumps({"type": "ping"}))
                    logger.debug("💓 Heartbeat ping sent")
                except Exception as e:
                    logger.error(f"Error sending heartbeat: {str(e)}")
                    break
        except asyncio.CancelledError:
            logger.info("Heartbeat task cancelled")
            raise
        except Exception as e:
            logger.error(f"Unexpected error in heartbeat loop: {str(e)}")
    
    @database_sync_to_async
    def get_user_from_token(self, token):
        """
        Get user from JWT token
        """
        # Import inside method to avoid Django setup issues
        from django.contrib.auth.models import User
        from rest_framework_simplejwt.tokens import AccessToken
        from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
        
        try:
            # Decode the token
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            
            # Get the user
            user = User.objects.get(id=user_id)
            return user
        except (InvalidToken, TokenError, User.DoesNotExist, KeyError) as e:
            logger.error(f"Token authentication error: {str(e)}")
            return None
    
    @database_sync_to_async
    def get_unread_count(self):
        """
        Get count of unread messages for the current user
        """
        # Import inside method to avoid Django setup issues
        from .models import ChatMessage
        
        return ChatMessage.objects.filter(
            recipient=self.user,
            is_read=False
        ).count()