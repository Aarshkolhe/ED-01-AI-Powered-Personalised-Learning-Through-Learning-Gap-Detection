"""
AI Provider Selection.
Selects Google Gemini as the primary generative AI provider for ThinkFlow.
"""
from app.core.config import settings


def get_active_provider():
    """Returns the active Google Gemini AI service instance."""
    from app.services.gemini_service import gemini_service
    return gemini_service


def get_active_provider_name():
    """Returns the display name of the active provider."""
    return "Google Gemini"


def get_active_model_name():
    """Returns the model name of the active provider."""
    from app.services.gemini_service import gemini_service
    return gemini_service.model
