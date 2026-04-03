import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from .models import ChatMessage


class TrendsyncConsumer(AsyncWebsocketConsumer):
    HEARTBEAT_INTERVAL = 25  # seconds

    async def connect(self):
        self.user = self.scope.get("user")
        self.room_group_name = "trendsync_updates"
        self._heartbeat_task = None

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        if self.user and self.user.is_authenticated:
            self.user_group_name = f"user_{self.user.id}"
            await self.channel_layer.group_add(self.user_group_name, self.channel_name)

        await self.accept()
        self._heartbeat_task = asyncio.ensure_future(self._heartbeat_loop())

    async def disconnect(self, code):
        if self._heartbeat_task:
            self._heartbeat_task.cancel()

        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

        if self.user and self.user.is_authenticated:
            await self.channel_layer.group_discard(self.user_group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        if not text_data:
            return

        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            data = {"text": text_data}

        message_type = data.get("type", "broadcast")

        if message_type == "ping":
            await self.send(text_data=json.dumps({"type": "pong"}))
            return

        if message_type == "chat_message" and self.user and self.user.is_authenticated:
            await self._handle_chat_message(data)
        else:
            await self.channel_layer.group_send(
                self.room_group_name,
                {"type": "websocket_message", "data": data},
            )

    async def websocket_message(self, event):
        await self.send(text_data=json.dumps(event["data"]))

    # ── Private helpers ──────────────────────────────────────────────────────

    async def _handle_chat_message(self, data):
        recipient_id = data.get("recipient_id")
        content = data.get("content")

        if not recipient_id or not content:
            return

        saved_msg = await self.save_message(self.user.id, recipient_id, content)
        if not saved_msg:
            return

        msg_data = {
            "type": "chat_message",
            "id": saved_msg.id,
            "sender_id": self.user.id,
            "recipient_id": recipient_id,
            "content": content,
            "timestamp": saved_msg.timestamp.isoformat(),
        }

        await self.channel_layer.group_send(
            f"user_{recipient_id}",
            {"type": "websocket_message", "data": msg_data},
        )
        await self.send(text_data=json.dumps(msg_data))

    async def _heartbeat_loop(self):
        """Sends a ping to the client every HEARTBEAT_INTERVAL seconds
        to prevent proxy/load-balancer idle timeouts."""
        try:
            while True:
                await asyncio.sleep(self.HEARTBEAT_INTERVAL)
                await self.send(text_data=json.dumps({"type": "ping"}))
        except asyncio.CancelledError:
            pass

    @database_sync_to_async
    def save_message(self, sender_id, recipient_id, content):
        try:
            recipient = User.objects.get(id=recipient_id)
            return ChatMessage.objects.create(
                sender_id=sender_id,
                recipient=recipient,
                content=content,
            )
        except User.DoesNotExist:
            return None