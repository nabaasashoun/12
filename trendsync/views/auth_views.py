# views/auth_views.py - WITHOUT allauth

import json
import requests
import traceback
from urllib.parse import urlencode

from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.shortcuts import redirect
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken

from trendsync.models import Buyer
from trendsync.serializers import BuyerRegisterSerializer, SellerRegisterSerializer


@api_view(['GET'])
@permission_classes([AllowAny])
def google_login(request):
    """
    Redirect to Google OAuth
    """
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    backend_url = getattr(settings, 'BACKEND_URL', 'http://localhost:8000')
    
    # Get client ID from settings (using direct settings, not allauth)
    client_id = getattr(settings, 'GOOGLE_CLIENT_ID', None)
    
    if not client_id:
        return Response({
            'error': 'Google OAuth not configured. Please set GOOGLE_CLIENT_ID in settings.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    google_auth_url = 'https://accounts.google.com/o/oauth2/v2/auth'
    
    params = {
        'client_id': client_id,
        'redirect_uri': f"{backend_url}/api/auth/google/callback/",
        'response_type': 'code',
        'scope': 'email profile',
        'access_type': 'online',
        'state': frontend_url,
    }
    
    auth_url = f"{google_auth_url}?{urlencode(params)}"
    return redirect(auth_url)


@api_view(['GET'])
@permission_classes([AllowAny])
def google_callback(request):
    """
    Handle Google OAuth callback
    """
    code = request.GET.get('code')
    state = request.GET.get('state', getattr(settings, 'FRONTEND_URL', 'http://localhost:5173'))
    
    if not code:
        return redirect(f"{state}?error=No authorization code provided")
    
    try:
        # Exchange code for access token
        token_url = 'https://oauth2.googleapis.com/token'
        token_data = {
            'code': code,
            'client_id': getattr(settings, 'GOOGLE_CLIENT_ID', ''),
            'client_secret': getattr(settings, 'GOOGLE_CLIENT_SECRET', ''),
            'redirect_uri': f"{getattr(settings, 'BACKEND_URL', 'http://localhost:8000')}/api/auth/google/callback/",
            'grant_type': 'authorization_code',
        }
        
        token_response = requests.post(token_url, data=token_data)
        token_json = token_response.json()
        
        if 'error' in token_json:
            return redirect(f"{state}?error={token_json.get('error_description', 'Authentication failed')}")
        
        access_token = token_json.get('access_token')
        
        # Get user info from Google
        userinfo_url = 'https://www.googleapis.com/oauth2/v2/userinfo'
        headers = {'Authorization': f'Bearer {access_token}'}
        userinfo_response = requests.get(userinfo_url, headers=headers)
        userinfo = userinfo_response.json()
        
        email = userinfo.get('email')
        google_id = userinfo.get('id')
        first_name = userinfo.get('given_name', '')
        last_name = userinfo.get('family_name', '')
        
        if not email:
            return redirect(f"{state}?error=No email provided by Google")
        
        # Get or create user
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Create new user
            username = email.split('@')[0]
            if User.objects.filter(username=username).exists():
                username = f"{username}_{google_id[:8]}"
            
            user = User.objects.create_user(
                username=username,
                email=email,
                first_name=first_name,
                last_name=last_name,
                is_active=True
            )
            user.set_unusable_password()
            user.save()
            
            # Create buyer profile for new user
            Buyer.objects.create(
                user=user,
                name=first_name or username,
                location='',
                contact=''
            )
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        user_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'is_buyer': hasattr(user, 'buyer_profile'),
            'is_seller': hasattr(user, 'seller_profile'),
        }
        
        redirect_url = f"{state}?token={refresh.access_token}&user={json.dumps(user_data)}"
        return redirect(redirect_url)
        
    except Exception as e:
        print(f"Google callback error: {str(e)}")
        traceback.print_exc()
        return redirect(f"{state}?error=Authentication failed")


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Traditional email/password login
    """
    try:
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response({'error': 'Please provide username and password'}, status=400)

        if '@' in username:
            try:
                user = User.objects.get(email=username)
                username = user.username
            except User.DoesNotExist:
                return Response({'error': 'Invalid credentials'}, status=401)

        user = authenticate(username=username, password=password)

        if user is not None:
            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'is_seller': hasattr(user, 'seller_profile'),
                    'is_buyer': hasattr(user, 'buyer_profile'),
                }
            })
        return Response({'error': 'Invalid credentials'}, status=401)
        
    except Exception as e:
        print(f"Login error: {str(e)}")
        traceback.print_exc()
        return Response({'error': 'Server error. Please try again.'}, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def verify_token_view(request):
    """
    Verify JWT token
    """
    if not request.user.is_authenticated:
        return Response({'error': 'Invalid token'}, status=401)
    
    return Response({
        'user': {
            'id': request.user.id,
            'username': request.user.username,
            'email': request.user.email,
            'is_seller': hasattr(request.user, 'seller_profile'),
            'is_buyer': hasattr(request.user, 'buyer_profile'),
        }
    })


class BuyerRegisterView(generics.CreateAPIView):
    """
    Register a new buyer
    """
    serializer_class = BuyerRegisterSerializer
    permission_classes = [AllowAny]


class SellerRegisterView(generics.CreateAPIView):
    """
    Register a new seller
    """
    serializer_class = SellerRegisterSerializer
    permission_classes = [AllowAny]