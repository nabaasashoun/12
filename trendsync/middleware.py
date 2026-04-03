from urllib.parse import parse_qs
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser, User
from rest_framework_simplejwt.tokens import AccessToken

@database_sync_to_async
def get_user(user_id):
    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        return AnonymousUser()

class TokenAuthMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        query_string = scope.get('query_string', b'').decode()
        query_params = parse_qs(query_string)
        token = query_params.get('token')
        
        if token:
            try:
                access_token = AccessToken(token[0])
                user = await get_user(access_token['user_id'])
                scope['user'] = user
            except Exception:
                scope['user'] = AnonymousUser()
        else:
            scope['user'] = AnonymousUser()

        return await self.app(scope, receive, send)
