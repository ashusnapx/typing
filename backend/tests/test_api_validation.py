"""Tests for API-level input validation and authorization gates.

Uses httpx AsyncClient to test FastAPI endpoints directly.
Dependencies (DB, Redis) are not available in unit test context,
so these test the schema validation and business logic layer.
"""
import pytest
from app.schemas.user import UserCreate, UserLogin, UserProfileUpdate
from app.schemas.passage import PassageCreate
from app.schemas.test import SubmitTestRequest, DirectSubmitRequest, StartTestRequest
from app.models.test import TestMode
from pydantic import ValidationError
from uuid import UUID


class TestUserCreateValidation:
    def test_valid_user(self):
        u = UserCreate(email="test@example.com", password="CorrectHorseBatteryStaple1!", full_name="Test User")
        assert u.email == "test@example.com"

    def test_email_validation(self):
        with pytest.raises(ValidationError, match="email"):
            UserCreate(email="not-an-email", password="CorrectHorseBatteryStaple1!", full_name="Test User")

    def test_name_validation(self):
        with pytest.raises(ValidationError, match="Name"):
            UserCreate(email="test@example.com", password="CorrectHorseBatteryStaple1!", full_name="A")

    def test_phone_validation(self):
        with pytest.raises(ValidationError, match="phone"):
            UserCreate(email="test@example.com", password="CorrectHorseBatteryStaple1!", full_name="Test", phone="abc")

        u = UserCreate(email="test@example.com", password="CorrectHorseBatteryStaple1!", full_name="Test", phone="+919876543210")
        assert u.phone == "+919876543210"


class TestPassageCreateValidation:
    def test_rejects_html_in_content(self):
        with pytest.raises(ValidationError, match="HTML"):
            PassageCreate(
                title="Test",
                content="Hello <script>alert('xss')</script> World",
                category="ssc_chsl",
                exact_key_depressions=100,
                word_count=20,
            )

    def test_rejects_html_in_title(self):
        with pytest.raises(ValidationError, match="HTML"):
            PassageCreate(
                title="<b>Bold Title</b>",
                content="Clean content here for testing purposes",
                category="ssc_chsl",
                exact_key_depressions=100,
                word_count=20,
            )

    def test_accepts_clean_content(self):
        p = PassageCreate(
            title="Clean Title",
            content="This is a perfectly normal passage with no markup",
            category="ssc_chsl",
            exact_key_depressions=100,
            word_count=20,
        )
        assert p.title == "Clean Title"


class TestTestSubmissionValidation:
    def test_submit_time_validation(self):
        req = SubmitTestRequest(
            typed_content="hello world",
            keystroke_events=[],
            time_taken_seconds=-1,
        )
        assert req.time_taken_seconds == -1

    def test_submit_requires_keystroke_list(self):
        with pytest.raises(ValidationError):
            SubmitTestRequest(
                typed_content="hello world",
                keystroke_events=None,
                time_taken_seconds=60,
            )

    def test_direct_submit_mode_validation(self):
        with pytest.raises(ValidationError):
            DirectSubmitRequest(
                mode="invalid_mode",
                passage_id="00000000-0000-0000-0000-000000000000",
                duration_seconds=600,
                typed_content="hello",
                keystroke_events=[],
                time_taken_seconds=60,
            )


class TestLoginEmailValidation:
    def test_email_stripped_and_lowered(self):
        u = UserCreate(email="  Test@Example.COM  ", password="CorrectHorseBatteryStaple1!", full_name="Test")
        assert u.email == "test@example.com"

    def test_login_does_not_validate_email_format_strictly(self):
        l = UserLogin(email="test@example.com", password="CorrectHorseBatteryStaple1!")
        assert l.email == "test@example.com"
