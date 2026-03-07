from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta

class Category(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class Seller(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='seller_profile')
    name = models.CharField(max_length=200)
    location = models.CharField(max_length=200, blank=True)
    contact = models.CharField(max_length=100, blank=True)
    nin_number = models.CharField(max_length=50, blank=True)
    sales = models.PositiveIntegerField(default=0)
    trust = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=0.00,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    followers = models.PositiveIntegerField(default=0)
    about = models.TextField(blank=True)
    profile_photo = models.ImageField(upload_to='sellers/', blank=True, null=True)
    passport_photo = models.ImageField(upload_to='sellers/id/', blank=True, null=True)
    id_photo = models.ImageField(upload_to='sellers/id/', blank=True, null=True)

    def __str__(self):
        return self.name


class Buyer(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='buyer_profile')
    name = models.CharField(max_length=200)
    location = models.CharField(max_length=200, blank=True)
    contact = models.CharField(max_length=100, blank=True)
    dob = models.DateField(null=True, blank=True)
    profile_photo = models.ImageField(upload_to='buyers/', blank=True, null=True)

    def __str__(self):
        return self.name


class Product(models.Model):
    seller = models.ForeignKey(Seller, on_delete=models.CASCADE, related_name='products')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products')
    name = models.CharField(max_length=200)
    stock_quantity = models.PositiveIntegerField(default=0)
    date_of_post = models.DateTimeField(auto_now_add=True)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    unit_name = models.CharField(max_length=50, blank=True)
    product_photo = models.ImageField(upload_to='products/', blank=True, null=True)
    description = models.TextField(blank=True)
    min_order = models.PositiveIntegerField(default=1)
    max_order = models.PositiveIntegerField(default=1000)
    rating_number = models.PositiveIntegerField(default=0)
    rating_magnitude = models.DecimalField(max_digits=4, decimal_places=2, default=0.00)
    sales_count = models.PositiveIntegerField(default=0)
    like_count = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.name


class ProductLike(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='likes')
    buyer = models.ForeignKey(Buyer, on_delete=models.CASCADE, related_name='liked_products')
    liked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('product', 'buyer')


class ProductComment(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='comments')
    buyer = models.ForeignKey(Buyer, on_delete=models.CASCADE, related_name='comments')
    comment_text = models.TextField()
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        default=5
    )
    helpful_votes = models.PositiveIntegerField(default=0)
    reply = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Comment by {self.buyer} on {self.product}"

class CommentHelpful(models.Model):
    comment = models.ForeignKey(ProductComment, on_delete=models.CASCADE, related_name='helpful_users')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('comment', 'user')

class Wishlist(models.Model):
    buyer = models.OneToOneField(Buyer, on_delete=models.CASCADE, related_name='wishlist')
    products = models.ManyToManyField(Product, through='WishlistItem', related_name='wishlisted_by')


class WishlistItem(models.Model):
    wishlist = models.ForeignKey(Wishlist, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('wishlist', 'product')



class Cart(models.Model):
    buyer = models.OneToOneField(Buyer, on_delete=models.CASCADE, related_name='cart', null=True, blank=True, unique=True)
    session_key = models.CharField(max_length=40, null=True, blank=True, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    added_at = models.DateTimeField(auto_now_add=True)
    answers = models.JSONField(default=dict, blank=True)
    class Meta:
        unique_together = ('cart', 'product')

    def subtotal(self):
        return self.quantity * self.product.unit_price


class Address(models.Model):
    buyer = models.ForeignKey(Buyer, on_delete=models.CASCADE, related_name='addresses')
    recipient_name = models.CharField(max_length=200)
    phone = models.CharField(max_length=50)
    street = models.CharField(max_length=300)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    iso_country_code = models.CharField(max_length=2, blank=True, help_text="ISO 3166-1 alpha-2 code")
    postal_code = models.CharField(max_length=50)
    is_default = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.recipient_name} - {self.city}, {self.country}"


class Order(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
    )
    PAYMENT_METHOD_CHOICES = (
        ('card', 'Card'),
        ('bank_transfer', 'Bank Transfer'),
        ('wallet', 'Wallet'),
    )
    buyer = models.ForeignKey(Buyer, on_delete=models.PROTECT, related_name='orders')
    order_date = models.DateTimeField(auto_now_add=True)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, blank=True)
    delivery_address = models.ForeignKey(Address, on_delete=models.PROTECT, null=True)
    delivery_status = models.CharField(max_length=20, default='pending')
    delivery_date = models.DateTimeField(null=True, blank=True)
    tracking_number = models.CharField(max_length=100, blank=True, null=True)
    delivery_partner = models.CharField(max_length=100, blank=True, null=True)
    currency = models.CharField(max_length=3, default='UGX')   
    pesapal_tracking_id = models.CharField(max_length=100, blank=True, null=True, help_text="Pesapal order tracking ID")


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)


class Payment(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('successful', 'Successful'),
        ('failed', 'Failed'),
    )
    order = models.OneToOneField(Order, on_delete=models.PROTECT, related_name='payment')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=50)
    payment_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    transaction_reference = models.CharField(max_length=200, blank=True)
    payment_date = models.DateTimeField(null=True, blank=True)
    gateway_response = models.TextField(blank=True)


class Delivery(models.Model):
    STATUS_CHOICES = (
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('out_for_delivery', 'Out for Delivery'),
        ('delivered', 'Delivered'),
        ('failed', 'Failed'),
    )
    order = models.OneToOneField(Order, on_delete=models.PROTECT, related_name='delivery')
    tracking_number = models.CharField(max_length=100, blank=True)
    delivery_partner = models.CharField(max_length=100, blank=True)
    shipped_date = models.DateTimeField(null=True, blank=True)
    estimated_delivery_date = models.DateField(null=True, blank=True)
    actual_delivery_date = models.DateTimeField(null=True, blank=True)
    delivery_status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='processing')


def default_expires_at():
    return timezone.now() + timedelta(hours=24)



class ProductQuestion(models.Model):
    QUESTION_TYPES = (
        ('text', 'Text'),
        ('multi-select', 'Multi Select'),
    )
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES, default='text')
    required = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.question_text

class QuestionOption(models.Model):
    question = models.ForeignKey(ProductQuestion, on_delete=models.CASCADE, related_name='options')
    option_text = models.CharField(max_length=255)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.option_text



class QuickDeal(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='quickdeal_references')
    caption = models.CharField(max_length=200)
    views = models.PositiveIntegerField(default=0)
    picture = models.ImageField(upload_to='quickdeals/', blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(default=default_expires_at)
    is_active = models.BooleanField(default=True)
    priority = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['-priority', '-timestamp']
    
    def __str__(self):
        return f"{self.caption}"
    
    def increment_views(self):
        self.views += 1
        self.save()
    
    def is_expired(self):
        return timezone.now() > self.expires_at
    
    @property
    def time_remaining(self):
        now = timezone.now()
        if now > self.expires_at:
            return "Expired"
        
        remaining = self.expires_at - now
        if remaining.days > 0:
            return f"{remaining.days}d {remaining.seconds // 3600}h"
        elif remaining.seconds >= 3600:
            hours = remaining.seconds // 3600
            minutes = (remaining.seconds % 3600) // 60
            return f"{hours}h {minutes}m"
        else:
            minutes = remaining.seconds // 60
            return f"{minutes}m"
    
    def deactivate_if_expired(self):
        if self.is_expired() and self.is_active:
            self.is_active = False
            self.save()
            return True
        return False



class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='products/')
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']


class PesapalConfig(models.Model):
    ipn_id = models.CharField(max_length=100, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Pesapal Configuration"
        verbose_name_plural = "Pesapal Configuration"


class SellerFollow(models.Model):
    buyer = models.ForeignKey(Buyer, on_delete=models.CASCADE, related_name='following')
    seller = models.ForeignKey(Seller, on_delete=models.CASCADE, related_name='followers_relations')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('buyer', 'seller')

class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ('follow', 'New Follower'),
        ('order', 'Order Update'),
        ('review', 'Product Review'),
        ('promotion', 'Promotion'),
        ('system', 'System Notification'),
    )
    
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='sent_notifications')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    data = models.JSONField(default=dict, blank=True)  
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.notification_type} for {self.recipient.username}"

class SimpleNotification(models.Model):
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='simple_notifications')
    sender_name = models.CharField(max_length=200)  
    message = models.TextField()
    type = models.CharField(max_length=50, default='follow')
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Notification for {self.recipient.username}: {self.message}"