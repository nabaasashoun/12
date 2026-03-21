import json
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.models import User
from .models import CommentHelpful  
from .models import (
    Category, Seller, Buyer, Product, ProductLike, ProductComment,
    Wishlist, Cart, CartItem, Address, Order, OrderItem, QuickDeal, WishlistItem,
    ProductQuestion, QuestionOption, ProductImage, SellerFollow
)

from .models import Notification
User = get_user_model()


class BuyerRegisterSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)
    name = serializers.CharField(required=False, allow_blank=True)
    location = serializers.CharField(required=False, allow_blank=True)
    contact = serializers.CharField(required=False, allow_blank=True)
    dob = serializers.DateField(required=False, allow_null=True)
    profile_photo = serializers.ImageField(required=False)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def to_internal_value(self, data):
        if data.get('dob') == '':
            data = data.copy()
            data['dob'] = None
        return super().to_internal_value(data)

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        Buyer.objects.create(
            user=user,
            name=validated_data.get('name', validated_data['username']),
            location=validated_data.get('location', ''),
            contact=validated_data.get('contact', ''),
            dob=validated_data.get('dob'),
            profile_photo=validated_data.get('profile_photo')
        )
        return user

class SellerRegisterSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)
    name = serializers.CharField(required=False)
    location = serializers.CharField(required=False)       
    contact = serializers.CharField(required=False)
    nin_number = serializers.CharField(required=False)
    about = serializers.CharField(required=False)
    profile_photo = serializers.ImageField(required=False)
    passport_photo = serializers.ImageField(required=False)
    id_photo = serializers.ImageField(required=False)

    # New fields
    location_type = serializers.ChoiceField(choices=Seller.LOCATION_TYPE_CHOICES, required=False, allow_blank=True)
    location_lat = serializers.FloatField(required=False, allow_null=True)
    location_lng = serializers.FloatField(required=False, allow_null=True)
    location_address = serializers.CharField(required=False, allow_blank=True)

    payment_method = serializers.ChoiceField(choices=Seller.PAYMENT_METHOD_CHOICES, required=False, allow_blank=True)
    bank_name = serializers.CharField(required=False, allow_blank=True)
    bank_account = serializers.CharField(required=False, allow_blank=True)
    card_last_four = serializers.CharField(max_length=4, required=False, allow_blank=True)
    mobile_provider = serializers.CharField(required=False, allow_blank=True)
    mobile_number = serializers.CharField(required=False, allow_blank=True)

    def create(self, validated_data):
        # Extract new fields (default to None/blank if missing)
        location_type = validated_data.pop('location_type', '')
        location_lat = validated_data.pop('location_lat', None)
        location_lng = validated_data.pop('location_lng', None)
        location_address = validated_data.pop('location_address', '')
        payment_method = validated_data.pop('payment_method', '')
        bank_name = validated_data.pop('bank_name', '')
        bank_account = validated_data.pop('bank_account', '')
        card_last_four = validated_data.pop('card_last_four', '')
        mobile_provider = validated_data.pop('mobile_provider', '')
        mobile_number = validated_data.pop('mobile_number', '')

        # Create the user
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
       
        seller = Seller.objects.create(
            user=user,
            name=validated_data.get('name', validated_data['username']),
            location=validated_data.get('location', ''),
            contact=validated_data.get('contact', ''),
            nin_number=validated_data.get('nin_number', ''),
            about=validated_data.get('about', ''),
            profile_photo=validated_data.get('profile_photo'),
            passport_photo=validated_data.get('passport_photo'),
            id_photo=validated_data.get('id_photo'),
            # New fields
            location_type=location_type,
            location_lat=location_lat,
            location_lng=location_lng,
            location_address=location_address,
            payment_method=payment_method,
            bank_name=bank_name,
            bank_account=bank_account,
            card_last_four=card_last_four,
            mobile_provider=mobile_provider,
            mobile_number=mobile_number,
        )
        return user


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class QuestionOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionOption
        fields = ['id', 'option_text']


class ProductQuestionSerializer(serializers.ModelSerializer):
    options = QuestionOptionSerializer(many=True, read_only=True)

    class Meta:
        model = ProductQuestion
        fields = ['id', 'question_text', 'question_type', 'required', 'order', 'options']


class ProductSerializer(serializers.ModelSerializer):
    product_photo = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    questions_input = serializers.JSONField(required=False, write_only=True)
    images = serializers.SerializerMethodField()
    seller_name = serializers.CharField(source='seller.name', read_only=True)
    questions = ProductQuestionSerializer(source='questions.all', many=True, read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'seller', 'seller_name', 'category', 'name', 'stock_quantity', 'date_of_post',
            'unit_price', 'unit_name', 'product_photo', 'description', 'min_order',
            'max_order', 'rating_number', 'rating_magnitude', 'sales_count', 'like_count',
            'is_liked', 'questions_input', 'images', 'questions'
        ]
        read_only_fields = ('seller', 'sales_count', 'like_count', 'rating_number', 'rating_magnitude')

    def get_product_photo(self, obj):
        request = self.context.get('request')
        if obj.product_photo:
            url = obj.product_photo.url
        else:
            first_image = obj.images.first()
            if first_image:
                url = first_image.image.url
            else:
                return None
        if request:
            return request.build_absolute_uri(url)
        return url

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                buyer = request.user.buyer_profile
                return ProductLike.objects.filter(product=obj, buyer=buyer).exists()
            except:
                return False
        return False

    def get_images(self, obj):
        request = self.context.get('request')
        images_qs = obj.images.all().order_by('order')
        return [
            request.build_absolute_uri(img.image.url) if request else img.image.url
            for img in images_qs
        ]

    def validate_questions_input(self, value):
        if isinstance(value, str):
            try:
                value = json.loads(value)
            except json.JSONDecodeError:
                raise serializers.ValidationError("Invalid JSON format for questions.")
        if not isinstance(value, list):
            raise serializers.ValidationError("Questions must be a list.")
        for idx, item in enumerate(value):
            if not isinstance(item, dict):
                raise serializers.ValidationError(f"Item {idx} is not an object.")
            if 'question' not in item:
                raise serializers.ValidationError(f"Item {idx} missing 'question' field.")
            item.pop('id', None)
            if item.get('type') not in ['text', 'multi-select']:
                item['type'] = 'text'
            if item['type'] == 'multi-select':
                if 'options' not in item or not isinstance(item['options'], list):
                    raise serializers.ValidationError(f"Item {idx} (multi-select) must have an 'options' list.")
        return value

    def create(self, validated_data):
        request = self.context.get('request')
        questions_data = validated_data.pop('questions_input', None)

        product = super().create(validated_data)

        uploaded_images = request.FILES.getlist('images') if request else []
        if uploaded_images:
            for idx, img_file in enumerate(uploaded_images):
                ProductImage.objects.create(product=product, image=img_file, order=idx)
            if not product.product_photo:
                first = product.images.first()
                if first:
                    product.product_photo = first.image
                    product.save(update_fields=['product_photo'])
        else:
            single_photo = request.FILES.get('product_photo') if request else None
            if single_photo:
                ProductImage.objects.create(product=product, image=single_photo, order=0)
                product.product_photo = single_photo
                product.save(update_fields=['product_photo'])

        if questions_data:
            for order, q_data in enumerate(questions_data):
                options = q_data.pop('options', [])
                question = ProductQuestion.objects.create(
                    product=product,
                    question_text=q_data['question'],
                    question_type=q_data.get('type', 'text'),
                    required=q_data.get('required', False),
                    order=order
                )
                for opt_order, opt_text in enumerate(options):
                    QuestionOption.objects.create(
                        question=question,
                        option_text=opt_text,
                        order=opt_order
                    )
        return product

    def update(self, instance, validated_data):
        request = self.context.get('request')
        instance = super().update(instance, validated_data)

        uploaded_images = request.FILES.getlist('images') if request else []
        if uploaded_images:
            instance.images.all().delete()
            for idx, img_file in enumerate(uploaded_images):
                ProductImage.objects.create(product=instance, image=img_file, order=idx)
            first = instance.images.first()
            if first:
                instance.product_photo = first.image
                instance.save(update_fields=['product_photo'])

        return instance


class ProductCommentSerializer(serializers.ModelSerializer):
    comment = serializers.CharField(source='comment_text')
    user_name = serializers.CharField(source='buyer.name', read_only=True)
    user_photo = serializers.ImageField(source='buyer.profile_photo', read_only=True)
    is_own_comment = serializers.SerializerMethodField()
    user_voted_helpful = serializers.SerializerMethodField()
    verified_purchase = serializers.SerializerMethodField()
    time_ago = serializers.SerializerMethodField()

    class Meta:
        model = ProductComment
        fields = [
            'id', 'product', 'buyer', 'comment', 'rating', 'helpful_votes',
            'reply', 'created_at', 'updated_at', 'user_name', 'user_photo',
            'is_own_comment', 'user_voted_helpful', 'verified_purchase', 'time_ago'
        ]
        read_only_fields = ['product', 'buyer', 'helpful_votes', 'created_at', 'updated_at']

    def get_is_own_comment(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.buyer.user == request.user
        return False

    def get_user_voted_helpful(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return CommentHelpful.objects.filter(comment=obj, user=request.user).exists()
        return False

    def get_verified_purchase(self, obj):
        return OrderItem.objects.filter(
            order__buyer=obj.buyer,
            product=obj.product,
            order__status='delivered'
        ).exists()

    def get_time_ago(self, obj):
        from django.utils import timezone
        now = timezone.now()
        diff = now - obj.created_at
        if diff.days == 0:
            if diff.seconds < 60:
                return 'Just now'
            elif diff.seconds < 3600:
                return f'{diff.seconds // 60}m ago'
            else:
                return f'{diff.seconds // 3600}h ago'
        elif diff.days < 7:
            return f'{diff.days}d ago'
        else:
            return obj.created_at.strftime('%b %d, %Y')


class SellerSerializer(serializers.ModelSerializer):
    products = ProductSerializer(many=True, read_only=True)
    is_following = serializers.SerializerMethodField()

    class Meta:
        model = Seller
        fields = '__all__'

    def get_is_following(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and hasattr(request.user, 'buyer_profile'):
            return SellerFollow.objects.filter(
                buyer=request.user.buyer_profile,
                seller=obj
            ).exists()
        return False


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source='product', write_only=True
    )
    subtotal = serializers.SerializerMethodField()
    answers = serializers.JSONField(read_only=True)

    class Meta:
        model = CartItem
        fields = ('id', 'product', 'product_id', 'quantity', 'answers', 'subtotal', 'added_at')

    def get_subtotal(self, obj):
        return obj.subtotal()


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ('id', 'items', 'total', 'created_at')

    def get_total(self, obj):
        return sum(item.subtotal() for item in obj.items.all())


class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email", "first_name", "last_name")
        read_only_fields = ("id", "email")


class CustomUserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ("id", "username", "email", "password")

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email"),
            password=validated_data["password"],
        )
        return user


class WishlistItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        source='product',
        write_only=True
    )
    added_at_formatted = serializers.SerializerMethodField()

    class Meta:
        model = WishlistItem
        fields = ['id', 'product', 'product_id', 'added_at', 'added_at_formatted']
        read_only_fields = ['added_at']

    def get_added_at_formatted(self, obj):
        return obj.added_at.strftime('%b %d, %Y')


class WishlistSerializer(serializers.ModelSerializer):
    products = ProductSerializer(many=True, read_only=True)

    class Meta:
        model = Wishlist
        fields = ['id', 'products']


class QuickDealSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        source='product',
        write_only=True
    )
    time_ago = serializers.SerializerMethodField()
    seller_info = serializers.SerializerMethodField()
    time_remaining = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='product.category.name', read_only=True, default='Category')

    class Meta:
        model = QuickDeal
        fields = [
            'id', 'product', 'product_id', 'caption',
            'views', 'picture', 'timestamp', 'time_ago',
            'is_active', 'seller_info', 'expires_at',
            'time_remaining', 'is_expired', 'category_name'
        ]
        read_only_fields = ['views', 'timestamp', 'seller_info', 'expires_at', 'time_remaining', 'is_expired']

    def get_time_ago(self, obj):
        from django.utils import timezone
        now = timezone.now()
        diff = now - obj.timestamp
        if diff.days == 0:
            if diff.seconds < 60:
                return 'Just now'
            elif diff.seconds < 3600:
                return f'{diff.seconds // 60}m ago'
            else:
                return f'{diff.seconds // 3600}h ago'
        elif diff.days < 7:
            return f'{diff.days}d ago'
        else:
            return obj.timestamp.strftime('%b %d')

    def get_seller_info(self, obj):
        return {
            'id': obj.product.seller.id,
            'name': obj.product.seller.name,
            'profile_photo': obj.product.seller.profile_photo.url if obj.product.seller.profile_photo else None
        }

    def get_time_remaining(self, obj):
        return obj.time_remaining

    def get_is_expired(self, obj):
        return obj.is_expired()

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        request = self.context.get('request')

        if instance.picture:
            if request:
                rep['picture'] = request.build_absolute_uri(instance.picture.url)
            else:
                rep['picture'] = instance.picture.url
            return rep

        if instance.product.product_photo:
            if request:
                rep['picture'] = request.build_absolute_uri(instance.product.product_photo.url)
            else:
                rep['picture'] = instance.product.product_photo.url
            return rep

        first_image = instance.product.images.first()
        if first_image:
            if request:
                rep['picture'] = request.build_absolute_uri(first_image.image.url)
            else:
                rep['picture'] = first_image.image.url
            return rep

        rep['picture'] = '/add/assets/glasses.jpg'
        return rep
    

class SellerProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Seller
        fields = '__all__'   
        read_only_fields = ('sales', 'trust', 'followers')


class SellerProductSerializer(ProductSerializer):
    class Meta(ProductSerializer.Meta):
        fields = '__all__'
        read_only_fields = ProductSerializer.Meta.read_only_fields


class SellerOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_photo = serializers.ImageField(source='product.product_photo', read_only=True)

    class Meta:
        model = OrderItem
        fields = ('id', 'product', 'product_name', 'product_photo', 'quantity', 'unit_price', 'subtotal')


class SellerOrderSerializer(serializers.ModelSerializer):
    items = SellerOrderItemSerializer(many=True, read_only=True)
    buyer_name = serializers.CharField(source='buyer.name', read_only=True)
    buyer_contact = serializers.CharField(source='buyer.contact', read_only=True)

    class Meta:
        model = Order
        fields = (
            'id', 'buyer', 'buyer_name', 'buyer_contact', 'order_date',
            'total_amount', 'status', 'payment_method', 'delivery_address',
            'delivery_status', 'tracking_number', 'delivery_partner', 'items'
        )


class SellerQuickDealSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        write_only=True,
        source='product'
    )
    time_remaining = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()

    class Meta:
        model = QuickDeal
        fields = (
            'id', 'product', 'product_id', 'caption', 'views', 'picture',
            'timestamp', 'expires_at', 'is_active',
            'time_remaining', 'is_expired'
        )
        read_only_fields = ('views', 'timestamp', 'expires_at', 'is_active')

    def get_time_remaining(self, obj):
        return obj.time_remaining

    def get_is_expired(self, obj):
        return obj.is_expired()


class SellerStatsSerializer(serializers.Serializer):
    total_sales = serializers.IntegerField()
    total_products = serializers.IntegerField()
    total_orders = serializers.IntegerField()
    total_quick_deals = serializers.IntegerField()
    trust_percentage = serializers.DecimalField(max_digits=5, decimal_places=2)
    followers = serializers.IntegerField()



class InitiatePaymentSerializer(serializers.Serializer):
    order_id = serializers.IntegerField()
    transaction_method = serializers.CharField(required=False, default='MOBILE_MONEY')
    phone_number = serializers.CharField(required=False, allow_blank=True)
    account_number = serializers.CharField(required=False, allow_blank=True)
    bank_code = serializers.CharField(required=False, allow_blank=True)

class RefundSerializer(serializers.Serializer):
    order_id = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    remarks = serializers.CharField()
    username = serializers.CharField(required=False, allow_blank=True)

class CancelOrderSerializer(serializers.Serializer):
    order_id = serializers.IntegerField()


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'notification_type', 'title', 'message', 'data', 'read', 'created_at']

class SellerProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Seller
        fields = [
            'name', 'location', 'contact', 'about', 'nin_number',
            'location_type', 'location_lat', 'location_lng', 'location_address',
            'payment_method', 'bank_name', 'bank_account', 'card_last_four',
            'mobile_provider', 'mobile_number'
        ]
        read_only_fields = ['location_updated_at']


class DusuPayWebhookSerializer(serializers.Serializer):
    event = serializers.CharField()
    payload = serializers.DictField()