import pytest
from cryptography.fernet import Fernet

from app.config import settings
from app.exceptions import ValidationError
from app.services.token_cipher import TokenCipher


def test_token_cipher_encrypt_and_decrypt(monkeypatch):
    valid_key = Fernet.generate_key().decode("utf-8")
    monkeypatch.setattr(settings, "TOKEN_ENCRYPTION_KEY", valid_key)

    cipher = TokenCipher()
    token = "AQV123456789_test_token_value"
    encrypted = cipher.encrypt(token)
    assert encrypted != token
    decrypted = cipher.decrypt(encrypted)
    assert decrypted == token


def test_token_cipher_missing_key(monkeypatch):
    monkeypatch.setattr(settings, "TOKEN_ENCRYPTION_KEY", "")
    cipher = TokenCipher()
    with pytest.raises(ValidationError, match="TOKEN_ENCRYPTION_KEY must be configured"):
        cipher.encrypt("secret")


def test_token_cipher_invalid_key(monkeypatch):
    monkeypatch.setattr(settings, "TOKEN_ENCRYPTION_KEY", "invalid-key")
    cipher = TokenCipher()
    with pytest.raises(ValidationError, match="not a valid Fernet key"):
        cipher.encrypt("secret")
