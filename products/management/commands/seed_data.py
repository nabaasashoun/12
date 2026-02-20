# products/management/commands/seed_data.py

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from faker import Faker
import random
from decimal import Decimal

from trendsync.models import (
    Category, Seller, Buyer, Product,
    Order, OrderItem, Payment, ProductLike
)

fake = Faker()

class Command(BaseCommand):
    help = "Seed database with dummy marketplace data"

    def handle(self, *args, **options):
        self.stdout.write("Seeding database...")

        self.create_categories()
        sellers = self.create_sellers(5)
        buyers = self.create_buyers(10)
        products = self.create_products(sellers, 30)
        self.create_orders(buyers, products)
        self.create_likes(buyers, products)

        self.stdout.write(self.style.SUCCESS("Seeding complete."))

    def create_categories(self):
        names = ["Toys", "Clothes", "Electronics", "Automobile"]
        for name in names:
            Category.objects.get_or_create(name=name)

    def create_sellers(self, count):
        sellers = []
        for i in range(count):
            user = User.objects.create_user(
                username=f"seller{i}",
                password="password"
            )
            seller = Seller.objects.create(
                user=user,
                name=fake.company(),
                location=random.choice(["Kampala", "Wakiso", "Mukono"]),
                sales=random.randint(10, 500),
                trust=random.uniform(60, 95),
                followers=random.randint(5, 200),
            )
            sellers.append(seller)
        return sellers

    def create_buyers(self, count):
        buyers = []
        for i in range(count):
            user = User.objects.create_user(
                username=f"buyer{i}",
                password="password"
            )
            buyer = Buyer.objects.create(
                user=user,
                name=fake.name(),
                location=random.choice(["Kampala", "Wakiso", "Mukono"]),
            )
            buyers.append(buyer)
        return buyers

    def create_products(self, sellers, count):
        categories = list(Category.objects.all())
        products = []

        for _ in range(count):
            product = Product.objects.create(
                seller=random.choice(sellers),
                category=random.choice(categories),
                name=fake.word().title(),
                unit_price=Decimal(random.randint(5, 500)),
                stock_quantity=random.randint(1, 100),
                sales_count=random.randint(0, 200),
                like_count=random.randint(0, 50),
                description=fake.sentence(),
            )
            products.append(product)
        return products

    def create_orders(self, buyers, products):
        for _ in range(40):
            buyer = random.choice(buyers)
            product = random.choice(products)
            quantity = random.randint(1, 5)

            order = Order.objects.create(
                buyer=buyer,
                total_amount=product.unit_price * quantity,
                status="paid"
            )

            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=quantity,
                unit_price=product.unit_price,
                subtotal=product.unit_price * quantity
            )

            Payment.objects.create(
                order=order,
                amount=order.total_amount,
                payment_method="card",
                payment_status="successful",
                payment_date=timezone.now()
            )

    def create_likes(self, buyers, products):
        for buyer in buyers:
            for product in random.sample(products, k=random.randint(1, 5)):
                ProductLike.objects.get_or_create(
                    buyer=buyer,
                    product=product
                )