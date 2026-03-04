from django.contrib import admin
from django import forms
from django.contrib.auth.models import User
from .models import (
    Category, Seller, Buyer, Product, ProductLike, ProductComment,
    Wishlist, WishlistItem, Cart, CartItem, Address, Order, OrderItem,
    Payment, Delivery, QuickDeal, ProductQuestion, QuestionOption  
)


class QuestionOptionInline(admin.TabularInline):
    model = QuestionOption
    extra = 0


class ProductQuestionInline(admin.TabularInline):
    model = ProductQuestion
    extra = 0
    show_change_link = True


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'created_at', 'created_by')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'description')
    list_editable = ('is_active',)


class SellerAdminForm(forms.ModelForm):
    email = forms.EmailField(required=True, help_text="Seller's email address")

    class Meta:
        model = Seller
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if 'user' in self.fields:
            self.fields['user'].widget = forms.HiddenInput()
            self.fields['user'].required = False
        if self.instance and self.instance.pk and self.instance.user_id:
            try:
                user = User.objects.get(id=self.instance.user_id)
                self.fields['email'].initial = user.email
            except User.DoesNotExist:
                pass

    def save(self, commit=True):
        seller = super().save(commit=False)
        email = self.cleaned_data.get('email')

        if seller.pk:
            if seller.user:
                seller.user.email = email
                seller.user.save()
        else:
            username = self.cleaned_data.get('name', '').replace(' ', '_').lower()
            if not username:
                username = email.split('@')[0]
            counter = 1
            original_username = username
            while User.objects.filter(username=username).exists():
                username = f"{original_username}_{counter}"
                counter += 1
            user = User.objects.create_user(
                username=username,
                email=email,
                password='temporary_password123'
            )
            seller.user = user

        if commit:
            seller.save()
        return seller


@admin.register(Seller)
class SellerAdmin(admin.ModelAdmin):
    form = SellerAdminForm
    list_display = ('name', 'email_display', 'trust_display', 'location', 'sales', 'followers')
    search_fields = ('name', 'user__username', 'user__email', 'location')
    list_filter = ('trust',)
    fieldsets = (
        ('User Information', {
            'fields': ('email', 'name', 'user')
        }),
        ('Contact Information', {
            'fields': ('location', 'contact', 'nin_number')
        }),
        ('Business Details', {
            'fields': ('sales', 'trust', 'followers', 'about')
        }),
        ('Verification Documents', {
            'fields': ('profile_photo', 'passport_photo', 'id_photo'),
            'classes': ('collapse',)
        }),
    )

    def email_display(self, obj):
        try:
            return obj.user.email if obj.user and obj.user.email else 'No email'
        except:
            return 'No email'
    email_display.short_description = 'Email'

    def trust_display(self, obj):
        return f"{obj.trust}%"
    trust_display.short_description = 'Trust'


class BuyerAdminForm(forms.ModelForm):
    email = forms.EmailField(required=True, help_text="Buyer's email address")

    class Meta:
        model = Buyer
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if 'user' in self.fields:
            self.fields['user'].widget = forms.HiddenInput()
            self.fields['user'].required = False
        if self.instance and self.instance.pk and self.instance.user_id:
            try:
                user = User.objects.get(id=self.instance.user_id)
                self.fields['email'].initial = user.email
            except User.DoesNotExist:
                pass

    def save(self, commit=True):
        buyer = super().save(commit=False)
        email = self.cleaned_data.get('email')

        if buyer.pk:
            if buyer.user:
                buyer.user.email = email
                buyer.user.save()
        else:
            username = self.cleaned_data.get('name', '').replace(' ', '_').lower()
            if not username:
                username = email.split('@')[0]
            counter = 1
            original_username = username
            while User.objects.filter(username=username).exists():
                username = f"{original_username}_{counter}"
                counter += 1
            user = User.objects.create_user(
                username=username,
                email=email,
                password='temporary_password123'
            )
            buyer.user = user

        if commit:
            buyer.save()
        return buyer


@admin.register(Buyer)
class BuyerAdmin(admin.ModelAdmin):
    form = BuyerAdminForm
    list_display = ('name', 'email_display', 'location', 'contact')
    search_fields = ('name', 'user__username', 'user__email', 'location')
    fieldsets = (
        ('User Information', {
            'fields': ('email', 'name', 'user')
        }),
        ('Contact Information', {
            'fields': ('location', 'contact', 'dob')
        }),
        ('Profile', {
            'fields': ('profile_photo',)
        }),
    )

    def email_display(self, obj):
        try:
            return obj.user.email if obj.user and obj.user.email else 'No email'
        except:
            return 'No email'
    email_display.short_description = 'Email'


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    inlines = [ProductQuestionInline]  
    list_display = ('name', 'seller', 'category', 'unit_price', 'stock_quantity', 'sales_count', 'like_count')
    list_filter = ('category', 'seller')
    search_fields = ('name', 'description', 'seller__name')
    list_editable = ('stock_quantity', 'unit_price')

    fieldsets = (
        ('Basic Info', {
            'fields': ('seller', 'category', 'name', 'description')
        }),
        ('Pricing & Stock', {
            'fields': ('unit_price', 'unit_name', 'stock_quantity', 'min_order', 'max_order')
        }),
        ('Media', {
            'fields': ('product_photo',)
        }),
        ('Statistics', {
            'fields': ('sales_count', 'like_count', 'rating_number', 'rating_magnitude'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ProductLike)
class ProductLikeAdmin(admin.ModelAdmin):
    list_display = ('product', 'buyer', 'liked_at')
    list_filter = ('liked_at',)
    search_fields = ('product__name', 'buyer__name')


@admin.register(ProductComment)
class ProductCommentAdmin(admin.ModelAdmin):
    list_display = ('product', 'buyer', 'short_comment', 'rating', 'helpful_votes', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('comment_text', 'product__name', 'buyer__name')
    readonly_fields = ('created_at', 'updated_at')

    def short_comment(self, obj):
        return obj.comment_text[:50] + '...' if len(obj.comment_text) > 50 else obj.comment_text
    short_comment.short_description = 'Comment'


class WishlistItemInline(admin.TabularInline):
    model = WishlistItem
    extra = 0
    readonly_fields = ('added_at',)
    raw_id_fields = ('product',)


class WishlistAdmin(admin.ModelAdmin):
    list_display = ('buyer', 'product_count', 'created_date')
    search_fields = ('buyer__name', 'buyer__user__username')
    inlines = [WishlistItemInline]
    readonly_fields = ('created_date',)

    def product_count(self, obj):
        return obj.products.count()
    product_count.short_description = 'Products'

    def created_date(self, obj):
        return obj.products.first().added_at if obj.products.exists() else '-'
    created_date.short_description = 'Created'


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    readonly_fields = ('added_at',)
    raw_id_fields = ('product',)


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('buyer', 'session_key', 'item_count', 'total_value', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('buyer__name', 'session_key')
    inlines = [CartItemInline]
    readonly_fields = ('created_at',)

    def item_count(self, obj):
        return obj.items.count()
    item_count.short_description = 'Items'

    def total_value(self, obj):
        return sum(item.subtotal() for item in obj.items.all())
    total_value.short_description = 'Total Value'


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ('recipient_name', 'buyer', 'city', 'state', 'country', 'is_default')
    list_filter = ('city', 'state', 'country', 'is_default')
    search_fields = ('recipient_name', 'phone', 'street', 'city')


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('unit_price', 'subtotal')
    raw_id_fields = ('product',)


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'buyer', 'order_date', 'total_amount', 'status', 'payment_method')
    list_filter = ('status', 'order_date', 'payment_method')
    search_fields = ('buyer__name', 'tracking_number')
    readonly_fields = ('order_date', 'total_amount')
    inlines = [OrderItemInline]

    fieldsets = (
        ('Order Information', {
            'fields': ('buyer', 'total_amount', 'status')
        }),
        ('Payment', {
            'fields': ('payment_method',)
        }),
        ('Delivery', {
            'fields': ('delivery_address', 'delivery_status', 'tracking_number',
                      'delivery_partner', 'delivery_date')
        }),
    )


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('order', 'amount', 'payment_method', 'payment_status', 'payment_date')
    list_filter = ('payment_status', 'payment_method', 'payment_date')
    search_fields = ('order__id', 'transaction_reference')
    readonly_fields = ('payment_date',)


@admin.register(Delivery)
class DeliveryAdmin(admin.ModelAdmin):
    list_display = ('order', 'tracking_number', 'delivery_partner', 'delivery_status', 'estimated_delivery_date')
    list_filter = ('delivery_status', 'delivery_partner')
    search_fields = ('tracking_number', 'order__id')

    fieldsets = (
        ('Basic Info', {
            'fields': ('order', 'tracking_number', 'delivery_partner')
        }),
        ('Dates', {
            'fields': ('shipped_date', 'estimated_delivery_date', 'actual_delivery_date')
        }),
        ('Status', {
            'fields': ('delivery_status',)
        }),
    )


@admin.register(QuickDeal)
class QuickDealAdmin(admin.ModelAdmin):
    list_display = ('caption', 'product', 'views', 'timestamp', 'is_active', 'priority', 'time_remaining_display')
    list_filter = ('is_active', 'timestamp')
    search_fields = ('caption', 'product__name')
    list_editable = ('is_active', 'priority')
    readonly_fields = ('views', 'timestamp', 'time_remaining_display')

    def time_remaining_display(self, obj):
        return obj.time_remaining
    time_remaining_display.short_description = 'Time Remaining'

    fieldsets = (
        ('Deal Information', {
            'fields': ('product', 'caption', 'priority')
        }),
        ('Media', {
            'fields': ('picture',)
        }),
        ('Timing', {
            'fields': ('timestamp', 'expires_at')
        }),
        ('Status', {
            'fields': ('is_active', 'views', 'time_remaining_display')
        }),
    )


admin.site.register(Wishlist, WishlistAdmin)