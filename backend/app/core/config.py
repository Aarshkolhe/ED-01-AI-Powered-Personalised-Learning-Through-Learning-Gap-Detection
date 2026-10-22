import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Thinkflow"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    BACKEND_URL: str = os.getenv("BACKEND_URL", "http://localhost:8000")
    
    # Storage / DB
    DATABASE_MODE: str = os.getenv("DATABASE_MODE", "local")  # "local" | "supabase"
    SUPABASE_URL: Optional[str] = os.getenv("SUPABASE_URL", None)
    SUPABASE_ANON_KEY: Optional[str] = os.getenv("SUPABASE_ANON_KEY", None)
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = os.getenv("SUPABASE_SERVICE_ROLE_KEY", None)
    
    # xAI Grok API Configuration (Primary Generative AI Provider)
    XAI_API_KEY: Optional[str] = os.getenv("XAI_API_KEY", None)
    XAI_MODEL: str = os.getenv("XAI_MODEL", "grok-2-latest")
    XAI_BASE_URL: str = os.getenv("XAI_BASE_URL", "https://api.x.ai/v1")
    XAI_TIMEOUT_SECONDS: float = float(os.getenv("XAI_TIMEOUT_SECONDS", "15.0"))
    XAI_MAX_TOKENS: int = int(os.getenv("XAI_MAX_TOKENS", "1500"))
    XAI_MAX_RETRIES: int = int(os.getenv("XAI_MAX_RETRIES", "2"))

    # Legacy / Alternate Gemini AI (Secondary fallback)
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", None)
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    
    # Demo & Safety
    DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() in ("true", "1", "yes")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production-32bytesmin")
    
    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
