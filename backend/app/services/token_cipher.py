"""Token encryption at rest for external social connections."""

from app.config import settings
from app.exceptions import ValidationError


class TokenCipher:
    """Loads Fernet lazily so non-connector test paths have no crypto side effect."""

    def _fernet(self):
        if not settings.TOKEN_ENCRYPTION_KEY:
            raise ValidationError("TOKEN_ENCRYPTION_KEY must be configured before connecting LinkedIn.")
        try:
            from cryptography.fernet import Fernet
        except ImportError as exc:
            raise ValidationError("The cryptography package is required for social connections.") from exc
        try:
            return Fernet(settings.TOKEN_ENCRYPTION_KEY.encode("utf-8"))
        except (TypeError, ValueError) as exc:
            raise ValidationError("TOKEN_ENCRYPTION_KEY is not a valid Fernet key.") from exc

    def encrypt(self, plaintext: str) -> str:
        return self._fernet().encrypt(plaintext.encode("utf-8")).decode("utf-8")

    def decrypt(self, ciphertext: str) -> str:
        try:
            return self._fernet().decrypt(ciphertext.encode("utf-8")).decode("utf-8")
        except Exception as exc:
            raise ValidationError("Unable to decrypt the selected social connection.") from exc

