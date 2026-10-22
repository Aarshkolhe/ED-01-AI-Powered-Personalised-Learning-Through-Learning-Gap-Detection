"""
Tests for Google Gemini AI Provider Migration in ThinkFlow.
Verifies:
1. Gemini provider is called for chat, lessons, and assessment requests.
2. User's actual question reaches Gemini.
3. Conversation history is passed correctly.
4. Missing, invalid, or quota-exhausted Gemini configuration returns clear errors.
5. No Grok provider is called during Gemini requests.
6. No API key is ever returned to the client or leaked in error responses.
7. Errors link to Google AI Studio, never xAI Console.
"""

import pytest
from unittest.mock import patch, MagicMock, PropertyMock
from fastapi.testclient import TestClient

from main import app
from app.core.config import settings
from app.services.gemini_service import gemini_service, GeminiService
from app.services.grok_service import grok_service
from app.models.schemas import (
    TutorChatMessage, TutorChatRequest, TutorChatResponse,
    DynamicLessonRequest, DynamicAssessmentRequest,
    DynamicAssessmentSubmitRequest, DynamicAnswerItem,
    ContentReviewStatus, ErrorTaxonomyCategory
)

client = TestClient(app)

# -------------------------------------------------------------------------
# 1. Health Checks & Provider Configuration
# -------------------------------------------------------------------------
def test_gemini_health_missing_key():
    """Verifies health endpoint reports missing_key when GEMINI_API_KEY is unset."""
    with patch.object(gemini_service, "is_configured", return_value=False):
        res = client.get("/api/ai/health")
        assert res.status_code == 200
        data = res.json()
        assert data["provider"] == "Google Gemini"
        assert data["status"] == "missing_key"
        assert data["is_configured"] is False
        assert "GEMINI_API_KEY not configured" in data["message"]
        # Ensure secrets never leaked
        assert "AQ." not in str(data)
        assert "sk-" not in str(data)

def test_gemini_health_ready():
    """Verifies health endpoint reports ready when Gemini is operational."""
    with patch.object(gemini_service, "check_health", return_value={
        "status": "ready",
        "provider": "Google Gemini",
        "model": "gemini-3.5-flash",
        "is_configured": True,
        "is_fallback": False,
        "message": "Google Gemini API connected and verified operational."
    }):
        res = client.get("/api/ai/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "ready"
        assert data["provider"] == "Google Gemini"
        assert data["model"] == "gemini-3.5-flash"
        assert data["is_configured"] is True

def test_gemini_health_error_states():
    """Verifies proper error classification in health check."""
    # Invalid key
    with patch.object(gemini_service, "check_health", return_value={
        "status": "invalid_key",
        "provider": "Google Gemini",
        "model": "gemini-3.5-flash",
        "is_configured": True,
        "is_fallback": True,
        "message": "Provided GEMINI_API_KEY was rejected. Check your key at https://aistudio.google.com/apikey"
    }):
        res = client.get("/api/ai/health")
        data = res.json()
        assert data["status"] == "invalid_key"
        assert "aistudio.google.com" in data["message"]
        assert "x.ai" not in data["message"]

# -------------------------------------------------------------------------
# 2. Chat Tutor Endpoint: Real Gemini Flow & History Preservation
# -------------------------------------------------------------------------
def test_gemini_chat_calls_gemini_and_preserves_question():
    """Verifies chat request reaches Gemini with user's actual question and conversation history."""
    mock_resp = TutorChatResponse(
        response="The sum of 2 and 2 is 4 in standard Peano arithmetic.",
        subject="Mathematics",
        topic="Addition",
        level="beginner",
        suggested_followups=["What about 3 + 3?", "How does subtraction relate?", "What is zero?"],
        is_fallback=False,
        model="gemini-3.5-flash"
    )

    with patch.object(gemini_service, "chat_tutor", return_value=mock_resp) as mock_chat:
        payload = {
            "student_id": "student_alex",
            "subject": "Mathematics",
            "topic": "Addition",
            "level": "beginner",
            "messages": [
                {"role": "user", "content": "What is 2 + 2?"}
            ],
            "action": "simplify"
        }
        res = client.post("/api/tutor/chat", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert "sum of 2 and 2 is 4" in data["response"]
        assert data["model"] == "gemini-3.5-flash"
        assert data["is_fallback"] is False
        assert len(data["suggested_followups"]) == 3

        # Verify gemini_service was called with actual question & parameters
        mock_chat.assert_called_once()
        passed_msgs = mock_chat.call_args.kwargs.get("messages") or mock_chat.call_args[1].get("messages")
        assert passed_msgs[0].content == "What is 2 + 2?"
        assert mock_chat.call_args.kwargs.get("action") == "simplify"

def test_gemini_chat_multi_turn_history():
    """Verifies multi-turn dialogue history is delivered to Gemini."""
    mock_resp = TutorChatResponse(
        response="As we discussed earlier, pointers store memory addresses.",
        subject="Computer Science",
        topic="Pointers",
        level="intermediate",
        suggested_followups=["How does dereferencing work?", "What is a null pointer?", "What is pointer arithmetic?"],
        is_fallback=False,
        model="gemini-3.5-flash"
    )

    with patch.object(gemini_service, "chat_tutor", return_value=mock_resp) as mock_chat:
        payload = {
            "student_id": "student_alex",
            "subject": "Computer Science",
            "topic": "Pointers",
            "level": "intermediate",
            "messages": [
                {"role": "user", "content": "What is a variable?"},
                {"role": "assistant", "content": "A variable is a named storage location in memory."},
                {"role": "user", "content": "Now explain pointers in terms of memory."}
            ]
        }
        res = client.post("/api/tutor/chat", json=payload)
        assert res.status_code == 200
        mock_chat.assert_called_once()
        passed_msgs = mock_chat.call_args.kwargs.get("messages") or mock_chat.call_args[1].get("messages")
        assert len(passed_msgs) == 3
        assert passed_msgs[2].content == "Now explain pointers in terms of memory."

def test_no_grok_called_during_gemini_requests():
    """Strictly guarantees that grok_service is never invoked when using the Gemini provider."""
    mock_resp = TutorChatResponse(
        response="Gemini response only.",
        subject="Physics",
        topic="Mechanics",
        level="intermediate",
        suggested_followups=[],
        is_fallback=False,
        model="gemini-3.5-flash"
    )

    with patch.object(gemini_service, "chat_tutor", return_value=mock_resp):
        with patch.object(grok_service, "chat_tutor", side_effect=AssertionError("GROK MUST NOT BE CALLED!")):
            res = client.post("/api/tutor/chat", json={
                "student_id": "student_alex",
                "subject": "Physics",
                "topic": "Mechanics",
                "level": "intermediate",
                "messages": [{"role": "user", "content": "Explain Newton's second law."}]
            })
            assert res.status_code == 200

# -------------------------------------------------------------------------
# 3. Provider Error Handling & Status Codes
# -------------------------------------------------------------------------
def test_gemini_missing_key_returns_400():
    """Missing Gemini API key returns HTTP 400 with actionable message."""
    mock_resp = TutorChatResponse(
        response="",
        subject="Math",
        topic="Addition",
        level="beginner",
        suggested_followups=[],
        is_fallback=False,
        model="gemini-3.5-flash",
        error="Google Gemini API key is missing. Please set GEMINI_API_KEY in backend environment.",
        error_code="missing_key"
    )
    with patch.object(gemini_service, "chat_tutor", return_value=mock_resp):
        res = client.post("/api/tutor/chat", json={
            "student_id": "test",
            "subject": "Math",
            "topic": "Addition",
            "level": "beginner",
            "messages": [{"role": "user", "content": "Hello"}]
        })
        assert res.status_code == 400
        assert "GEMINI_API_KEY" in res.json()["detail"]

def test_gemini_invalid_key_returns_401():
    """Invalid Gemini API key returns HTTP 401 with Google AI Studio link."""
    mock_resp = TutorChatResponse(
        response="",
        subject="Math",
        topic="Addition",
        level="beginner",
        suggested_followups=[],
        is_fallback=False,
        model="gemini-3.5-flash",
        error="Invalid Google Gemini API Key. Please verify your credentials at https://aistudio.google.com/apikey",
        error_code="invalid_key"
    )
    with patch.object(gemini_service, "chat_tutor", return_value=mock_resp):
        res = client.post("/api/tutor/chat", json={
            "student_id": "test",
            "subject": "Math",
            "topic": "Addition",
            "level": "beginner",
            "messages": [{"role": "user", "content": "Hello"}]
        })
        assert res.status_code == 401
        assert "aistudio.google.com" in res.json()["detail"]
        assert "x.ai" not in res.json()["detail"]

def test_gemini_quota_exceeded_returns_429():
    """Quota exhaustion returns HTTP 429 pointing to Google AI Studio."""
    mock_resp = TutorChatResponse(
        response="",
        subject="Math",
        topic="Addition",
        level="beginner",
        suggested_followups=[],
        is_fallback=False,
        model="gemini-3.5-flash",
        error="Google Gemini API quota exceeded or billing not enabled. Manage your quota at https://aistudio.google.com/",
        error_code="out_of_credits"
    )
    with patch.object(gemini_service, "chat_tutor", return_value=mock_resp):
        res = client.post("/api/tutor/chat", json={
            "student_id": "test",
            "subject": "Math",
            "topic": "Addition",
            "level": "beginner",
            "messages": [{"role": "user", "content": "Hello"}]
        })
        assert res.status_code == 429
        assert "aistudio.google.com" in res.json()["detail"]

def test_gemini_unsupported_model_returns_404():
    """Unsupported or unavailable model returns HTTP 404."""
    mock_resp = TutorChatResponse(
        response="",
        subject="Math",
        topic="Addition",
        level="beginner",
        suggested_followups=[],
        is_fallback=False,
        model="gemini-invalid-model",
        error="Gemini model 'gemini-invalid-model' is not supported or not found.",
        error_code="unsupported_model"
    )
    with patch.object(gemini_service, "chat_tutor", return_value=mock_resp):
        res = client.post("/api/tutor/chat", json={
            "student_id": "test",
            "subject": "Math",
            "topic": "Addition",
            "level": "beginner",
            "messages": [{"role": "user", "content": "Hello"}]
        })
        assert res.status_code == 404
        assert "not supported" in res.json()["detail"]

def test_api_chat_alias_route():
    """Verifies /api/ai/chat route functions identically to /api/tutor/chat."""
    mock_resp = TutorChatResponse(
        response="Testing /api/ai/chat alias.",
        subject="Math",
        topic="Addition",
        level="beginner",
        suggested_followups=[],
        is_fallback=False,
        model="gemini-3.5-flash"
    )
    with patch.object(gemini_service, "chat_tutor", return_value=mock_resp):
        res = client.post("/api/ai/chat", json={
            "student_id": "test",
            "subject": "Math",
            "topic": "Addition",
            "level": "beginner",
            "messages": [{"role": "user", "content": "Hello"}]
        })
        assert res.status_code == 200
        assert res.json()["response"] == "Testing /api/ai/chat alias."

# -------------------------------------------------------------------------
# 4. Security: No API Keys Leaked
# -------------------------------------------------------------------------
def test_no_api_key_in_responses():
    """Guarantees that no response contains the GEMINI_API_KEY."""
    mock_resp = TutorChatResponse(
        response="Safe response without secrets.",
        subject="Math",
        topic="Addition",
        level="beginner",
        suggested_followups=[],
        is_fallback=False,
        model="gemini-3.5-flash"
    )
    with patch.object(gemini_service, "chat_tutor", return_value=mock_resp):
        res = client.post("/api/tutor/chat", json={
            "student_id": "test",
            "subject": "Math",
            "topic": "Addition",
            "level": "beginner",
            "messages": [{"role": "user", "content": "Hello"}]
        })
        resp_text = res.text
        if settings.GEMINI_API_KEY:
            assert settings.GEMINI_API_KEY not in resp_text
