import json
from channels.generic.websocket import AsyncWebsocketConsumer


class TrendsyncConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_group_name = "trendsync_updates"

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        if text_data:
            try:
                data = json.loads(text_data)
            except json.JSONDecodeError:
                data = {"text": text_data}
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "websocket_message",
                    "data": data,
                },
            )

    async def websocket_message(self, event):
        await self.send(text_data=json.dumps(event["data"]))
