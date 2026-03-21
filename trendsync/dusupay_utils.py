import requests
import logging
from django.conf import settings

logger = logging.getLogger('dusupay')

class DusuPayClient:
    def __init__(self):
        # Use getattr with defaults to avoid AttributeError
        self.public_key = getattr(settings, 'DUSUPAY_PUBLIC_KEY', None)
        self.secret_key = getattr(settings, 'DUSUPAY_SECRET_KEY', None)
        self.base_url = getattr(settings, 'DUSUPAY_API_BASE_URL', 'https://sandboxapi.dusupay.com')
        
        if not self.public_key or not self.secret_key:
            logger.warning("DusuPay API keys not configured. Payment functionality will not work.")
        
        self.headers = {
            'Content-Type': 'application/json',
            'x-api-version': '1',
            'public-key': self.public_key,
            'secret-key': self.secret_key
        }

    def initiate_payment(self, merchant_reference, amount, currency, transaction_method,
                         account_number=None, provider_code=None, bank_code=None,
                         customer_name=None, customer_email=None, description=None,
                         redirect_url=None):
        """
        Unified payment initiation for collections.
        Endpoint: /collections/initialize
        """
        # If keys are missing, return an error
        if not self.public_key or not self.secret_key:
            return {'success': False, 'error': 'Payment system not configured. Please contact support.'}
        
        url = f"{self.base_url}/collections/initialize"
        payload = {
            "merchant_reference": merchant_reference,
            "transaction_method": transaction_method,
            "currency": currency,
            "amount": amount,
            "description": description or f"Order #{merchant_reference} payment"
        }
        if customer_name:
            payload["customer_name"] = customer_name
        if customer_email:
            payload["customer_email"] = customer_email

        if transaction_method == "MOBILE_MONEY":
            if not provider_code or not account_number:
                raise ValueError("Mobile money requires provider_code and account_number")
            payload["provider_code"] = provider_code
            payload["account_number"] = account_number
        elif transaction_method == "BANK_TRANSFER":
            if not bank_code or not account_number:
                raise ValueError("Bank transfer requires bank_code and account_number")
            payload["bank_code"] = bank_code
            payload["account_number"] = account_number
        elif transaction_method == "CARD":
            if not redirect_url:
                raise ValueError("Card payment requires redirect_url")
            payload["redirect_url"] = redirect_url

        try:
            response = requests.post(url, json=payload, headers=self.headers, timeout=30)
            data = response.json()
            logger.info(f"DusuPay initiate_payment response: {data}")
            if response.status_code == 202 and data.get('status') == 'accepted':
                return {
                    'success': True,
                    'internal_reference': data['data']['internal_reference'],
                    'merchant_reference': data['data']['merchant_reference'],
                    'redirect_url': data['data'].get('redirect_url')
                }
            else:
                return {'success': False, 'error': data.get('message', 'Unknown error')}
        except Exception as e:
            logger.error(f"DusuPay initiate_payment error: {str(e)}")
            return {'success': False, 'error': str(e)}

    def check_transaction_status(self, internal_reference):
        """Check status of a transaction (optional polling)"""
        if not self.public_key or not self.secret_key:
            return {'success': False, 'error': 'Payment system not configured.'}
        
        url = f"{self.base_url}/collections/status/{internal_reference}"
        try:
            response = requests.get(url, headers=self.headers, timeout=30)
            data = response.json()
            logger.info(f"DusuPay status check: {data}")
            return {'success': True, 'status': data.get('transaction_status'), 'data': data}
        except Exception as e:
            logger.error(f"Status check error: {str(e)}")
            return {'success': False, 'error': str(e)}

    def get_provider_code(self, phone_number):
        """Determine provider code from phone number (for mobile money)"""
        phone = str(phone_number).strip()
        if phone.startswith('25678') or phone.startswith('25676') or phone.startswith('078') or phone.startswith('076'):
            return 'mtn_ug'
        else:
            return 'airtel_ug'