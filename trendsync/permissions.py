from rest_framework import permissions

class IsBuyer(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and hasattr(request.user, 'buyer_profile')

class IsSeller(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and hasattr(request.user, 'seller_profile')

class IsOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        if hasattr(obj, 'seller') and obj.seller == request.user.seller_profile:
            return True
        if hasattr(obj, 'buyer') and obj.buyer == request.user.buyer_profile:
            return True
        if hasattr(obj, 'user') and obj.user == request.user:
            return True
        return False