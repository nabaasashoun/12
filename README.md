# TrendSync

A Django REST API project.

## Setup

### 1. Install uv (if not already installed)

```bash
# macOS / Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows (PowerShell)
irm https://astral.sh/uv/install.ps1 | iex
```

### 2. Clone the repository

```bash
git clone https://github.com/Julienexe/trendsync.git
cd trendsync
```

### 3. Set up the project with uv

```bash
# Create virtual environment and install dependencies
uv sync

# Activate virtual environment
source .venv/bin/activate
```

### 4. Set up the database

```bash
# Create migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser
```

### 5. Run the server

```bash
python manage.py runserver
```

The API will be available at http://127.0.0.1:8000/
