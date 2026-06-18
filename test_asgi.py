# test_asgi.py
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

try:
    from config.asgi import application
    print("✅ ASGI application loaded successfully!")
    print(f"Application type: {type(application)}")
    print(f"Application: {application}")
except Exception as e:
    print(f"❌ Error loading ASGI application: {e}")