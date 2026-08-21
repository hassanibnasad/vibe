# Deployment & Security FAQ

## 1. How is customer and conversation data protected?
All data is stored in your private PostgreSQL instance with AES-256 encryption at rest and TLS 1.3 in transit. VibeAgent does not send customer conversation data to external third parties when using local LLMs (Ollama/vLLM).

## 2. What infrastructure is required for self-hosting?
- **Minimum**: 16 GB RAM, 4 vCPUs, Docker Compose v2. (Runs 8B models on CPU/GPU).
- **Recommended**: NVIDIA GPU with 24GB+ VRAM (RTX 4090, A10G, or A100) for fast inference with Llama 3.1 70B.

## 3. Does VibeAgent support Single Sign-On (SSO) and RBAC?
Yes. VibeAgent integrates with Authentik out of the box to support OIDC, SAML, and granular Role-Based Access Control (Admin, Marketing Manager, Operator, Viewer).
