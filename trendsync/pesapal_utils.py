import requests
import logging
from django.core.cache import cache
from django.conf import settings

logger = logging.getLogger('pesapal')

PESAPAL_BASE_URL = (
    "https://cybqa.pesapal.com/pesapalv3/api" if settings.PESAPAL_SANDBOX
    else "https://pay.pesapal.com/v3/api"
)

def get_access_token():
    token = cache.get('pesapal_access_token')
    if token:
        logger.debug("Using cached access token")
        return token

    url = f"{PESAPAL_BASE_URL}/Auth/RequestToken"
    payload = {
        "consumer_key": settings.PESAPAL_CONSUMER_KEY,
        "consumer_secret": settings.PESAPAL_CONSUMER_SECRET
    }
    headers = {"Accept": "application/json", "Content-Type": "application/json"}

    logger.info("Requesting new access token from Pesapal")
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()
        token = data['token']
        cache.set('pesapal_access_token', token, 270)
        logger.info("Access token obtained successfully")
        return token
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to obtain access token: {str(e)}", exc_info=True)
        raise
    except (KeyError, ValueError) as e:
        logger.error(f"Invalid response from token endpoint: {str(e)}", exc_info=True)
        raise

def register_ipn_url(ipn_url, notification_type='GET'):
    token = get_access_token()
    url = f"{PESAPAL_BASE_URL}/URLSetup/RegisterIPN"
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    payload = {
        "url": ipn_url,
        "ipn_notification_type": notification_type
    }

    logger.info(f"Registering IPN URL: {ipn_url}")
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()
        ipn_id = data['ipn_id']
        logger.info(f"IPN registered successfully, ipn_id: {ipn_id}")
        return ipn_id
    except requests.exceptions.RequestException as e:
        logger.error(f"IPN registration failed: {str(e)}", exc_info=True)
        raise
    except (KeyError, ValueError) as e:
        logger.error(f"Invalid response from RegisterIPN: {str(e)}", exc_info=True)
        raise

def submit_order_request(merchant_reference, amount, currency, description,
                         callback_url, notification_id, billing_address):
    token = get_access_token()
    url = f"{PESAPAL_BASE_URL}/Transactions/SubmitOrderRequest"
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    payload = {
        "id": merchant_reference,
        "currency": currency,
        "amount": float(amount),
        "description": description,
        "callback_url": callback_url,
        "notification_id": notification_id,
        "billing_address": billing_address
    }

    logger.info(f"Submitting order: ref={merchant_reference}, amount={amount} {currency}")
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=15)
        response.raise_for_status()
        data = response.json()
        logger.info(f"Full response from Pesapal: {data}")

        if data.get('status') != '200':
            error_msg = data.get('message', 'Unknown error')
            raise Exception(f"Pesapal error: {error_msg}")

        if not data.get('redirect_url') or not data.get('order_tracking_id'):
            raise Exception("Pesapal response missing redirect_url or order_tracking_id")

        logger.info(f"Order submitted successfully, tracking_id={data.get('order_tracking_id')}")
        return data
    except requests.exceptions.RequestException as e:
        logger.error(f"SubmitOrderRequest failed: {str(e)}")
        if e.response is not None:
            logger.error(f"Response status: {e.response.status_code}")
            logger.error(f"Response body: {e.response.text}")
        raise
    except (KeyError, ValueError) as e:
        logger.error(f"Invalid response from SubmitOrderRequest: {str(e)}", exc_info=True)
        raise

def get_transaction_status(order_tracking_id):
    token = get_access_token()
    url = f"{PESAPAL_BASE_URL}/Transactions/GetTransactionStatus"
    params = {"orderTrackingId": order_tracking_id}
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }

    logger.info(f"Fetching transaction status for tracking_id={order_tracking_id}")
    try:
        response = requests.get(url, params=params, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()
        logger.info(f"Transaction status retrieved: {data.get('payment_status_description')}")
        return data
    except requests.exceptions.RequestException as e:
        logger.error(f"GetTransactionStatus failed: {str(e)}", exc_info=True)
        raise
    except (KeyError, ValueError) as e:
        logger.error(f"Invalid response from GetTransactionStatus: {str(e)}", exc_info=True)
        raise

def refund_request(confirmation_code, amount, username, remarks):
    token = get_access_token()
    url = f"{PESAPAL_BASE_URL}/Transactions/RefundRequest"
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    payload = {
        "confirmation_code": confirmation_code,
        "amount": float(amount),
        "username": username,
        "remarks": remarks
    }

    logger.info(f"Initiating refund: confirmation_code={confirmation_code}, amount={amount}")
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()
        logger.info(f"Refund request submitted: status={data.get('status')}")
        return data
    except requests.exceptions.RequestException as e:
        logger.error(f"RefundRequest failed: {str(e)}", exc_info=True)
        raise
    except (KeyError, ValueError) as e:
        logger.error(f"Invalid response from RefundRequest: {str(e)}", exc_info=True)
        raise

def cancel_order(order_tracking_id):
    token = get_access_token()
    url = f"{PESAPAL_BASE_URL}/Transactions/CancelOrder"
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    payload = {"order_tracking_id": order_tracking_id}

    logger.info(f"Cancelling order with tracking_id={order_tracking_id}")
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()
        logger.info(f"Cancel order response: status={data.get('status')}")
        return data
    except requests.exceptions.RequestException as e:
        logger.error(f"CancelOrder failed: {str(e)}", exc_info=True)
        raise
    except (KeyError, ValueError) as e:
        logger.error(f"Invalid response from CancelOrder: {str(e)}", exc_info=True)
        raise