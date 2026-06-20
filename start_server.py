# start_server.py
import os
import sys
import subprocess
import time

def start_server():
    print("Starting Django server with optimized settings...")
    
    # Run migrations if needed
    subprocess.run([sys.executable, "manage.py", "migrate"], check=False)
    
    # Start with uvicorn for better performance
    cmd = [
        sys.executable, "-m", "uvicorn",
        "config.asgi:application",
        "--host", "127.0.0.1",
        "--port", "8000",
        "--reload",
        "--workers", "1",
        "--loop", "asyncio",
        "--log-level", "info"
    ]
    
    try:
        subprocess.run(cmd)
    except KeyboardInterrupt:
        print("\nServer stopped.")

if __name__ == "__main__":
    start_server()