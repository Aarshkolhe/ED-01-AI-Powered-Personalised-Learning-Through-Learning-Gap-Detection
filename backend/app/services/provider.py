"""
AI Provider Selection.
Selects the active AI provider based on configuration.
Priority: Gemini (if GEMINI_API_KEY is configured) > Grok (if XAI_API_KEY is configured) > fallback.
"""
from app.core.config import settings


def get_active_provider():
    """Returns the active AI service instance based on configured API keys."""
    from app.services.gemini_service import gemini_service
    from app.services.grok_service import grok_service

    if gemini_service.is_configured():
        return gemini_service
    if grok_service.is_configured():
        return grok_service
    # Return grok_service as fallback (it has deterministic fallback built in)
    return grok_service


def get_active_provider_name():
    """Returns the display name of the active provider."""
    from app.services.gemini_service import gemini_service
    from app.services.grok_service import grok_service

    if gemini_service.is_configured():
        return "Google Gemini"
    if grok_service.is_configured():
        return "xAI Grok"
    return "Deterministic Fallback"


def get_active_model_name():
    """Returns the model name of the active provider."""
    from app.services.gemini_service import gemini_service
    from app.services.grok_service import grok_service

    if gemini_service.is_configured():
        return settings.GEMINI_MODEL
    if grok_service.is_configured():
        return settings.XAI_MODEL
    return "deterministic-curated-engine"
