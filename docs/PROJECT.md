# 📋 PROJECT.md — VibeAgent

## Project Vision

**VibeAgent** is an AI-powered, fully open-source social media marketing automation platform that replaces fragmented marketing tools with a unified, intelligent agent system. It generates content, publishes across platforms, engages leads in real-time, and qualifies them — all without human intervention (with optional human-in-the-loop).

### Mission Statement

> Democratize AI-driven social media marketing by providing an open-source alternative to expensive SaaS tools like HubSpot, Hootsuite, and Sprout Social — powered entirely by self-hosted AI.

---

## Goals

### Primary Goals

1. **Automate Content Creation** — Generate high-quality, platform-tailored marketing content using self-hosted LLMs with brand-aware RAG
2. **Multi-Platform Publishing** — Publish, schedule, and manage content across LinkedIn, Facebook, Instagram, WhatsApp, and X/Twitter from a single interface
3. **Real-Time Lead Engagement** — Monitor and respond to all incoming interactions (comments, DMs, mentions) with intelligent, context-aware replies
4. **Lead Qualification** — Automatically score and qualify leads using BANT framework + conversational intelligence
5. **Production-Grade** — Build a system that is reliable, secure, observable, and deployable at scale
6. **100% Open Source** — No proprietary dependencies, no vendor lock-in, self-hostable

### Secondary Goals

1. A/B testing for content variants
2. Competitor monitoring and insights
3. Multi-language content and reply support
4. Lead nurture drip sequences
5. CRM integration (Twenty CRM / ERPNext)
6. WhatsApp broadcast campaigns

---

## Target Users

### Primary Users

| User Persona | Description | Key Needs |
|---|---|---|
| **Solo Founders / Indie Hackers** | Building in public, need consistent social presence | Auto-generate content, schedule posts, reply to engagement |
| **Small Marketing Teams (2-10)** | Managing multiple platforms manually | Content calendar, collaboration, analytics, lead tracking |
| **Digital Marketing Agencies** | Managing multiple client accounts | Multi-tenant, white-label, client reporting, bulk operations |

### Secondary Users

| User Persona | Description | Key Needs |
|---|---|---|
| **Sales Teams** | Receiving qualified leads from marketing | Lead pipeline view, CRM integration, lead scores |
| **Content Creators** | Need AI assistance for content ideation | Content generation, hashtag suggestions, trend analysis |

---

## Scope

### In Scope (v1.0)

- [x] Content generation with LLM (text, captions, hashtags, CTAs)
- [x] Image generation for marketing visuals
- [x] Publishing to LinkedIn, Facebook, Instagram, WhatsApp, X/Twitter
- [x] Content scheduling with calendar view
- [x] Webhook-based monitoring of incoming interactions
- [x] AI-powered reply generation with conversation memory
- [x] Human-in-the-loop review queue
- [x] Lead scoring with BANT framework
- [x] Lead pipeline management (Cold → Warm → Hot → MQL → SQL)
- [x] Admin dashboard with analytics
- [x] User authentication and RBAC
- [x] API for programmatic access
- [x] Docker Compose deployment
- [x] Monitoring and alerting

### Out of Scope (v1.0)

- [ ] Multi-tenant / SaaS mode
- [ ] White-labeling
- [ ] Native mobile app
- [ ] Video content generation
- [ ] Email marketing integration
- [ ] Paid ad campaign management
- [ ] Real-time collaborative editing
- [ ] Kubernetes deployment (planned for v2.0)

---

## Success Metrics

| Metric | Target |
|---|---|
| Content generation time | < 30 seconds per post |
| Publishing success rate | > 99% |
| Reply latency (webhook → response) | < 60 seconds |
| Lead scoring accuracy | > 80% correlation with manual scoring |
| System uptime | > 99.5% |
| Dashboard page load time | < 2 seconds |

---

## Project Timeline

| Phase | Duration | Deliverables |
|---|---|---|
| Phase 1: Foundation | Weeks 1-3 | Infrastructure, Content Generator, RAG pipeline |
| Phase 2: Publishing | Weeks 4-5 | Publisher Agent, content calendar, basic dashboard |
| Phase 3: Engagement | Weeks 6-8 | Monitor Agent, Reply Agent, review queue |
| Phase 4: Intelligence | Weeks 9-10 | Lead Qualifier, scoring, CRM integration |
| Phase 5: Hardening | Weeks 11-12 | Security, monitoring, load testing, docs |

---

## Stakeholders

| Role | Responsibility |
|---|---|
| **Project Lead** | Architecture decisions, roadmap, code review |
| **Backend Developer** | FastAPI, agents, platform integrations |
| **Frontend Developer** | Next.js dashboard, UI/UX |
| **DevOps** | Docker, CI/CD, monitoring, deployment |
| **AI/ML Engineer** | LLM fine-tuning, RAG optimization, scoring models |
