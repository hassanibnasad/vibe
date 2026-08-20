FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim

WORKDIR /app

# Environment configuration
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    PATH="/app/.venv/bin:$PATH"

# Install dependencies
COPY pyproject.toml README.md ./
RUN uv venv /app/.venv && uv pip install -e .

# Copy application and migration code
COPY alembic.ini ./
COPY alembic ./alembic
COPY app ./app

EXPOSE 8000

# Start server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
