# 📐 REQUIREMENTS.md — VibeAgent

## Functional Requirements

### FR-1: Content Generation

| ID | Requirement | Priority |
|---|---|---|
| FR-1.1 | System SHALL generate marketing post text optimized per platform (LinkedIn=professional, Instagram=visual, WhatsApp=conversational) | P0 |
| FR-1.2 | System SHALL generate relevant hashtags based on content and trending topics | P0 |
| FR-1.3 | System SHALL generate call-to-action (CTA) text for each post | P0 |
| FR-1.4 | System SHALL generate marketing images using Stable Diffusion XL | P1 |
| FR-1.5 | System SHALL use RAG to reference brand guidelines, product docs, and past successful posts | P0 |
| FR-1.6 | System SHALL generate A/B content variants for testing | P2 |
| FR-1.7 | System SHALL support user-provided campaign briefs as input | P0 |
| FR-1.8 | System SHALL allow manual editing of generated content before publishing | P0 |

### FR-2: Content Publishing

| ID | Requirement | Priority |
|---|---|---|
| FR-2.1 | System SHALL publish content to LinkedIn via Marketing API | P0 |
| FR-2.2 | System SHALL publish content to Facebook via Meta Graph API | P0 |
| FR-2.3 | System SHALL publish content to Instagram via Instagram Graph API | P0 |
| FR-2.4 | System SHALL send messages via WhatsApp Business Cloud API | P1 |
| FR-2.5 | System SHALL publish content to X/Twitter via API v2 | P1 |
| FR-2.6 | System SHALL support scheduled publishing with date/time selection | P0 |
| FR-2.7 | System SHALL handle platform-specific formatting (char limits, image sizes, carousel) | P0 |
| FR-2.8 | System SHALL retry failed publishes with exponential backoff | P0 |
| FR-2.9 | System SHALL store published post metadata (post ID, URL, timestamp) | P0 |
| FR-2.10 | System SHALL provide a content calendar with drag-and-drop scheduling | P1 |

### FR-3: Interaction Monitoring

| ID | Requirement | Priority |
|---|---|---|
| FR-3.1 | System SHALL receive real-time webhooks from Meta platforms (FB, IG, WA) | P0 |
| FR-3.2 | System SHALL receive webhooks from LinkedIn | P0 |
| FR-3.3 | System SHALL poll platforms without webhook support as fallback | P1 |
| FR-3.4 | System SHALL normalize events across platforms into a unified format | P0 |
| FR-3.5 | System SHALL classify incoming interactions (question, complaint, interest, spam) | P0 |
| FR-3.6 | System SHALL deduplicate events to prevent double-processing | P0 |

### FR-4: Reply Generation & Engagement

| ID | Requirement | Priority |
|---|---|---|
| FR-4.1 | System SHALL generate contextual replies using conversation history | P0 |
| FR-4.2 | System SHALL maintain per-lead conversation memory across platforms | P0 |
| FR-4.3 | System SHALL use RAG to answer product/service questions accurately | P0 |
| FR-4.4 | System SHALL adapt reply tone per platform | P0 |
| FR-4.5 | System SHALL perform sentiment analysis on incoming messages | P1 |
| FR-4.6 | System SHALL flag negative sentiment or complex queries for human review | P0 |
| FR-4.7 | System SHALL support human-in-the-loop approval before sending replies | P0 |
| FR-4.8 | System SHALL provide a review queue in the dashboard for pending replies | P0 |
| FR-4.9 | System SHALL escalate conversations to human agents when confidence is low | P1 |

### FR-5: Lead Qualification

| ID | Requirement | Priority |
|---|---|---|
| FR-5.1 | System SHALL score leads on a 0-100 scale | P0 |
| FR-5.2 | System SHALL use BANT framework (Budget, Authority, Need, Timeline) for scoring | P0 |
| FR-5.3 | System SHALL extract intent signals from conversations using LLM | P0 |
| FR-5.4 | System SHALL track engagement metrics (reply count, frequency, sentiment trend) | P0 |
| FR-5.5 | System SHALL assign lead stages: Cold → Warm → Hot → MQL → SQL | P0 |
| FR-5.6 | System SHALL auto-tag leads with interests, pain points, and urgency | P1 |
| FR-5.7 | System SHALL push qualified leads (MQL/SQL) to CRM | P1 |
| FR-5.8 | System SHALL provide a lead pipeline view in the dashboard | P0 |

### FR-6: Dashboard & Analytics

| ID | Requirement | Priority |
|---|---|---|
| FR-6.1 | System SHALL provide a web dashboard for managing all features | P0 |
| FR-6.2 | System SHALL display content performance analytics (engagement, reach, clicks) | P1 |
| FR-6.3 | System SHALL display lead funnel metrics (leads per stage, conversion rates) | P1 |
| FR-6.4 | System SHALL provide AI-generated insights on content performance | P2 |
| FR-6.5 | System SHALL support user roles: Admin, Manager, Viewer | P0 |
| FR-6.6 | System SHALL display real-time conversation threads per lead | P0 |

---

## Non-Functional Requirements

### NFR-1: Performance

| ID | Requirement | Target |
|---|---|---|
| NFR-1.1 | Content generation latency | < 30 seconds (70B model), < 5 seconds (8B model) |
| NFR-1.2 | Reply generation latency | < 10 seconds |
| NFR-1.3 | Webhook processing latency | < 2 seconds (ingest to queue) |
| NFR-1.4 | End-to-end reply latency (webhook → platform reply) | < 60 seconds |
| NFR-1.5 | Dashboard page load time | < 2 seconds |
| NFR-1.6 | API response time (non-LLM endpoints) | < 200ms (p95) |
| NFR-1.7 | Concurrent platform API calls | Handle 5 platforms simultaneously |

### NFR-2: Reliability

| ID | Requirement | Target |
|---|---|---|
| NFR-2.1 | System uptime | > 99.5% |
| NFR-2.2 | Message delivery rate | > 99% (with retries) |
| NFR-2.3 | Data durability | Zero data loss for leads and conversations |
| NFR-2.4 | Graceful degradation | Queue messages if LLM is down; process when recovered |
| NFR-2.5 | Dead letter queue | Failed messages retained for manual retry |

### NFR-3: Security

| ID | Requirement | Target |
|---|---|---|
| NFR-3.1 | Authentication | OAuth 2.0 / OIDC via Authentik |
| NFR-3.2 | API key storage | Encrypted at rest (Docker Secrets or Vault) |
| NFR-3.3 | Platform token rotation | Automatic refresh before expiry |
| NFR-3.4 | Input sanitization | All webhook payloads validated and sanitized |
| NFR-3.5 | RBAC | Role-based access control on all endpoints |
| NFR-3.6 | Audit logging | All outbound messages logged with timestamp and user |
| NFR-3.7 | Rate limiting | Per-platform API rate limit enforcement |

### NFR-4: Scalability

| ID | Requirement | Target |
|---|---|---|
| NFR-4.1 | Leads | Support 100,000+ leads |
| NFR-4.2 | Conversations | Support 1M+ messages |
| NFR-4.3 | Posts | Support 10,000+ published posts |
| NFR-4.4 | Concurrent users | 50+ dashboard users |
| NFR-4.5 | Horizontal scaling | Stateless backend services for horizontal scaling |

### NFR-5: Observability

| ID | Requirement | Target |
|---|---|---|
| NFR-5.1 | Metrics | Prometheus metrics for all services |
| NFR-5.2 | Dashboards | Grafana dashboards for publishing pipeline, engagement, lead funnel |
| NFR-5.3 | Logging | Centralized structured logging (JSON format) |
| NFR-5.4 | Alerting | Alerts for failed publishes, high error rates, queue backlog |
| NFR-5.5 | Health checks | /health endpoint on all services |

### NFR-6: Compliance

| ID | Requirement | Target |
|---|---|---|
| NFR-6.1 | GDPR | Data deletion, consent management, export |
| NFR-6.2 | Platform ToS | Respect all platform API rate limits and content policies |
| NFR-6.3 | AI Disclosure | Mark AI-generated replies where required by platform/law |
| NFR-6.4 | Opt-out | Mechanism for leads to opt out of automated messaging |

---

## Priority Legend

| Priority | Meaning |
|---|---|
| **P0** | Must-have for MVP. System cannot launch without this. |
| **P1** | Important. Should be in v1.0 but not blocking MVP launch. |
| **P2** | Nice-to-have. Planned for post-v1.0. |
