from typing import Any

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Security(security),
) -> dict[str, Any]:
    """Authentik OIDC JWT validation stub for development.
    In dev mode, if no bearer token is passed, defaults to standard admin user.
    """
    if credentials is None:
        return {"id": "00000000-0000-0000-0000-000000000001", "role": "admin", "username": "admin"}
    token = credentials.credentials
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authentication token",
        )
    return {"id": "00000000-0000-0000-0000-000000000001", "role": "admin", "username": "authenticated_user"}


def require_role(allowed_roles: list[str]):
    async def role_checker(current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
        if current_user.get("role") not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions for this operation",
            )
        return current_user
    return role_checker
