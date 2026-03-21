import requests

def reverse_geocode(lat, lng):
    """
    Convert GPS coordinates to a human-readable address using OpenStreetMap Nominatim.
    Returns a string like "Kampala Road, Kampala, Uganda" or empty string on failure.
    """
    url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lng}&zoom=18&addressdetails=1"
    headers = {'User-Agent': 'YourMarketplaceApp/1.0 (your@email.com)'}  # Replace with your app name/email
    try:
        r = requests.get(url, headers=headers, timeout=5)
        data = r.json()
        return data.get('display_name', '')
    except Exception:
        return ''