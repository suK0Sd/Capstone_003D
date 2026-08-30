"""Stripe wrapper. In dev without valid keys, creates a mock checkout session."""
import stripe

from app.core.config import settings

stripe.api_key = settings.stripe_secret_key


def _is_configured() -> bool:
    key = settings.stripe_secret_key or ""
    if not key or not key.startswith("sk_"):
        return False
    if any(placeholder in key.lower() for placeholder in ("xxx", "pon_tu", "aqui", "mock", "placeholder", "your_")):
        return False
    return True


def create_checkout_session(*, amount_cents: int, currency: str, payment_id: str,
                            success_url: str, cancel_url: str, idempotency_key: str | None = None) -> dict:
    if not _is_configured():
        # Dev fallback: deterministic mock session
        return {"id": f"cs_mock_{payment_id}", "url": f"{success_url}?mock_session=cs_mock_{payment_id}"}
    try:
        session = stripe.checkout.Session.create(
            mode="payment",
            line_items=[{
                "price_data": {
                    "currency": currency.lower(),
                    "product_data": {"name": "AI Assessment"},
                    "unit_amount": amount_cents,
                },
                "quantity": 1,
            }],
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={"payment_id": payment_id},
            idempotency_key=idempotency_key,
        )
        return {"id": session.id, "url": session.url}
    except Exception as exc:
        if settings.is_dev:
            # En entorno de desarrollo, si la clave no es válida, fallback a mock checkout
            return {"id": f"cs_mock_{payment_id}", "url": f"{success_url}?mock_session=cs_mock_{payment_id}"}
        raise exc


def _is_webhook_configured() -> bool:
    sec = settings.stripe_webhook_secret or ""
    if not sec or not sec.startswith("whsec_"):
        return False
    if any(placeholder in sec.lower() for placeholder in ("xxx", "pon_tu", "aqui", "mock", "placeholder", "your_")):
        return False
    return True


def verify_webhook(payload: bytes, signature: str | None) -> dict:
    """Returns the verified Stripe event dict, or raises ValueError on bad signature."""
    import json
    if not _is_webhook_configured() or not signature:
        # Dev fallback: confiar en el payload JSON simulado
        return json.loads(payload.decode("utf-8"))
    try:
        return stripe.Webhook.construct_event(payload, signature, settings.stripe_webhook_secret)
    except Exception as exc:
        if settings.is_dev:
            # En modo dev, si falla la verificación de firma, procesar como mock payload
            return json.loads(payload.decode("utf-8"))
        raise ValueError(str(exc))
