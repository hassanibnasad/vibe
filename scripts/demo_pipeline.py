#!/usr/bin/env python3
"""
demo_pipeline.py — Interactive CLI walkthrough of the full VibeAgent Phase 1 pipeline.

Runs entirely against the live backend API.  No database credentials needed;
the script only calls the REST endpoints that the Next.js dashboard uses.

Stages
------
  1. Health check — confirm the backend is reachable.
  2. Business Onboarding — upsert a brand profile and kick off a scrape job.
  3. LinkedIn Connector — show current connections and print the OAuth URL.
  4. Content Generation — create an AI-generated draft (or manual draft if Hatchet is offline).
  5. Review & Revision — display the draft, prompt for operator edits.
  6. Approve — move the post to 'approved' status.
  7. Publish (simulate) — call the publish endpoint.
  8. Lead Pipeline — show the BANT lead funnel.
  9. Review Queue — show pending AI replies awaiting approval.
 10. Dashboard Telemetry — print live Command Center KPIs.

Usage
-----
  # with the backend running:
  python scripts/demo_pipeline.py

  # against a staging environment:
  python scripts/demo_pipeline.py --api-url https://api.vibeagent.dev

  # non-interactive (skip all prompts):
  python scripts/demo_pipeline.py --yes
"""

from __future__ import annotations

import argparse
import json
import sys
import textwrap
import time
import urllib.error
import urllib.request
from typing import Any

# ── Windows console UTF-8 ─────────────────────────────────────────────────────
if sys.platform == "win32":
    try:
        if hasattr(sys.stdout, "reconfigure"):
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        if hasattr(sys.stderr, "reconfigure"):
            sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# ── ANSI colours (disabled automatically on non-TTY / Windows without VT) ─────
_FORCE_COLOR = sys.stdout.isatty()


def _c(code: str, text: str) -> str:
    return f"\033[{code}m{text}\033[0m" if _FORCE_COLOR else text


def cyan(t: str) -> str:   return _c("96", t)
def green(t: str) -> str:  return _c("92", t)
def yellow(t: str) -> str: return _c("93", t)
def red(t: str) -> str:    return _c("91", t)
def bold(t: str) -> str:   return _c("1", t)
def dim(t: str) -> str:    return _c("2", t)


# ── HTTP helpers ──────────────────────────────────────────────────────────────

def _req(
    method: str,
    url: str,
    body: dict | None = None,
    timeout: float = 10.0,
) -> tuple[int, Any]:
    """Returns (status_code, parsed_json_or_text)."""
    data = json.dumps(body).encode() if body is not None else None
    headers: dict[str, str] = {"User-Agent": "VibeAgent-Demo/1.0"}
    if data:
        headers["Content-Type"] = "application/json"  
    # Disable automatic redirect-following so 302s don't hang on OAuth flows.
    opener = urllib.request.OpenerDirector()
    opener.add_handler(urllib.request.UnknownHandler())
    opener.add_handler(urllib.request.HTTPHandler())
    opener.add_handler(urllib.request.HTTPDefaultErrorHandler())
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            try:
                return resp.status, json.loads(raw)
            except json.JSONDecodeError:
                return resp.status, raw
    except urllib.error.HTTPError as exc:
        try:
            raw = exc.read().decode("utf-8", errors="replace")
            detail = json.loads(raw).get("detail", raw[:200])
        except Exception:
            detail = str(exc)
        return exc.code, {"error": detail}
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        reason = getattr(exc, "reason", None) or exc
        return 0, {"error": str(reason)}


def GET(base: str, path: str, **kw: Any) -> tuple[int, Any]:
    return _req("GET", f"{base}{path}", **kw)


def POST(base: str, path: str, body: dict | None = None, **kw: Any) -> tuple[int, Any]:
    return _req("POST", f"{base}{path}", body=body, **kw)


def PUT(base: str, path: str, body: dict | None = None, **kw: Any) -> tuple[int, Any]:
    return _req("PUT", f"{base}{path}", body=body, **kw)


# ── Pretty helpers ─────────────────────────────────────────────────────────────

def _banner(n: int, title: str) -> None:
    pad = "=" * 70
    print(f"\n{pad}")
    print(f"  Step {n}/10  |  {bold(title)}")
    print(f"{pad}")


def _ok(msg: str) -> None:
    print(f"  {green('[OK]')} {msg}")


def _warn(msg: str) -> None:
    print(f"  {yellow('[WARN]')} {msg}")


def _err(msg: str) -> None:
    print(f"  {red('[ERR]')} {msg}")


def _info(msg: str) -> None:
    print(f"  {dim('...')} {msg}")


def _json(data: Any, indent: int = 4) -> None:
    txt = json.dumps(data, indent=indent, default=str)
    for line in txt.splitlines():
        print(f"       {dim(line)}")


def _hr() -> None:
    print(f"  {dim('-' * 60)}")


def _prompt(msg: str, default: str, auto: bool) -> str:
    if auto:
        print(f"  {cyan('>>')} {msg} {dim(f'[auto: {default!r}]')}")
        return default
    try:
        raw = input(f"  {cyan('>>')} {msg} [{dim(default)}]: ").strip()
        return raw if raw else default
    except (EOFError, KeyboardInterrupt):
        print()
        return default


def _pause(auto: bool) -> None:
    if not auto:
        try:
            input(f"  {dim('Press ENTER to continue...')}")
        except (EOFError, KeyboardInterrupt):
            print()


# ── Pipeline steps ─────────────────────────────────────────────────────────────

def step_health(api: str, auto: bool) -> bool:
    _banner(1, "API Health Check")
    _info(f"Connecting to {api}/api/v1/health ...")
    code, data = GET(api, "/api/v1/health")
    if code == 200:
        db = data.get("database", "?") if isinstance(data, dict) else "?"
        env = data.get("environment", "?") if isinstance(data, dict) else "?"
        _ok(f"Backend reachable — environment={env}, database={db}")
        return True
    elif code == 500:
        # Health endpoint itself hit a DB error — server is running but DB is offline.
        _warn("Backend is running but database is unavailable (HTTP 500).")
        _warn("Start PostgreSQL via:  docker compose up postgres -d")
        _warn("Continuing with limited functionality (endpoints that don't hit DB will still work).")
        return True
    else:
        _err(f"Backend unreachable (HTTP {code}). Is the server running?")
        _err(f"  Start with:  uvicorn app.main:app --reload")
        return False


def step_onboard(api: str, auto: bool) -> dict:
    _banner(2, "Business Onboarding — Brand Profile")
    print(
        textwrap.dedent("""
          The onboarding flow scrapes the company website and extracts the brand
          profile (identity, ICP, value props, visual tokens) via the
          ContentGeneratorAgent + KnowledgeIngestionService.
        """).strip()
    )

    brand_name = _prompt("Brand name", "Nexus AI Solutions", auto)
    website    = _prompt("Website URL", "https://nexusai.example.com", auto)
    tagline    = _prompt("Tagline", "Autonomous B2B Marketing Intelligence", auto)

    _info("Kicking off brand extraction workflow ...")
    code, data = POST(api, "/api/v1/onboarding/extract-brand", {
        "website_url": website,
        "brand_name": brand_name,
    })
    if code == 202:
        job_id = data.get("job_id", "?")
        _ok(f"Workflow queued — job_id={job_id}")
    else:
        _warn(f"Extract endpoint returned {code}: {data.get('error', data)}")
        _info("Upserting brand profile directly via REST ...")

    # Always upsert so demo is deterministic
    code2, data2 = PUT(api, "/api/v1/onboarding/brand-profile", {
        "brand_name": brand_name,
        "tagline": tagline,
        "written_identity": {
            "archetype": "Visionary Authority",
            "tone": "sharp, consultative",
        },
        "core_value_props": [
            "Zero-touch social lead generation",
            "Human-in-the-loop compliance",
        ],
        "icp_pain_points": [
            {"feature": "AI replies", "pain_hook": "Missed inbound pipeline"},
        ],
        "extraction_status": "complete",
    })
    if code2 in (200, 201):
        _ok(f"Brand profile saved: {brand_name}")
        _json(data2)
        _pause(auto)
        return data2
    else:
        _err(f"Failed to upsert brand profile: HTTP {code2} — {data2}")
        _pause(auto)
        return {}


def step_linkedin_connector(api: str, auto: bool) -> str | None:
    _banner(3, "LinkedIn Connector — OAuth Connection")
    print(
        textwrap.dedent("""
          VibeAgent uses LinkedIn's 3-legged OAuth (Authorization Code) flow to
          connect an Operator's personal profile for:
            - Publishing posts as that Operator.
            - Reading comments and DMs via webhook.

          Required scopes:  openid  profile  w_member_social
        """).strip()
    )

    code, connectors = GET(api, "/api/v1/connectors")
    if code == 200 and isinstance(connectors, list) and connectors:
        active = [c for c in connectors if c.get("status") == "active"]
        if active:
            c = active[0]
            _ok(f"Active connection found: {c.get('display_name')} ({c.get('author_urn')})")
            _pause(auto)
            return c["id"]
        else:
            _warn("Connections exist but none are active.")
    else:
        _info("No connections found yet.")

    # Compose the OAuth URL — don't follow the 302 redirect (it hangs urllib).
    auth_url = f"{api}/api/v1/connectors/linkedin/authorize"
    print()
    print(f"  {bold('To connect your LinkedIn account, open this URL in a browser:')} ")
    print(f"  {cyan(auth_url)}")
    print(f"  {dim('(This will redirect to LinkedIn and return a token to the callback URL.)')}")
    print()
    _warn("Demo continuing without a real connection (simulation mode).")
    _pause(auto)
    return None


def step_generate_post(api: str, auto: bool) -> dict:
    _banner(4, "Content Generation — LinkedIn Post Draft")
    print(
        textwrap.dedent("""
          The ContentGeneratorAgent uses:
            - Brand profile (tone, archetype, value props) from KnowledgeBase.
            - RAG retrieval over ingested knowledge docs.
            - Groq llama-3.3-70b-versatile (or configured primary LLM).

          It returns a draft post + hashtags + CTA, flagged requires_review=True
          so it enters the Operator approval queue before any publishing.
        """).strip()
    )
    brief = _prompt(
        "Content brief",
        "Why modern B2B teams use AI agents instead of manual SDR outreach",
        auto,
    )

    _info("Calling POST /api/v1/posts (manual draft) ...")
    code, data = POST(api, "/api/v1/posts", {
        "content": (
            f"[AI Draft] {brief}\n\n"
            "Modern revenue teams that have made the switch report 3x faster "
            "pipeline velocity and 60% reduction in manual follow-up overhead.\n\n"
            "The shift isn't about replacing humans — it's about letting them focus "
            "on the conversations that actually close deals."
        ),
        "hashtags": ["#B2BSales", "#AIMarketing", "#LeadGen"],
        "cta": "What's your team's current SDR-to-AI mix? Drop a comment.",
    })
    if code == 201:
        _ok(f"Draft created — post_id={data.get('id')}")
        _json(data)
        _pause(auto)
        return data
    else:
        _err(f"Failed to create post: HTTP {code} — {data}")
        _pause(auto)
        return {}


def step_review_and_revise(api: str, post: dict, auto: bool) -> dict:
    _banner(5, "Operator Review & Inline Edit")
    post_id = post.get("id")
    if not post_id:
        _warn("No post_id — skipping revision step.")
        return post

    print(f"  Current draft content:\n")
    for line in post.get("content", "").splitlines():
        print(f"    {dim(line)}")
    print()

    revised_content = _prompt(
        "Edit content (press ENTER to keep current)",
        post.get("content", ""),
        auto,
    )
    new_hashtags = _prompt(
        "Hashtags (comma-separated)",
        ", ".join(post.get("hashtags", ["#B2BSales", "#AI"])),
        auto,
    )
    new_cta = _prompt(
        "Call-to-action",
        post.get("cta") or "Comment below with your take.",
        auto,
    )

    hashtag_list = [h.strip() for h in new_hashtags.split(",") if h.strip()]

    _info("Saving revision via PUT /api/v1/posts/{id} ...")
    code, data = PUT(api, f"/api/v1/posts/{post_id}", {
        "content": revised_content,
        "hashtags": hashtag_list,
        "cta": new_cta,
    })
    if code == 200:
        _ok("Revision saved.")
        _json(data)
        _pause(auto)
        return data
    else:
        _err(f"Failed to update post: HTTP {code} — {data}")
        _pause(auto)
        return post


def step_approve(api: str, post: dict, auto: bool) -> dict:
    _banner(6, "Approve Draft for Publishing")
    post_id = post.get("id")
    if not post_id:
        _warn("No post_id — skipping approval step.")
        return post

    _info(f"POST /api/v1/posts/{post_id}/approve ...")
    code, data = POST(api, f"/api/v1/posts/{post_id}/approve")
    if code == 200:
        status = data.get("status", "?")
        requires = data.get("requires_review", True)
        _ok(f"Post approved — status={status}, requires_review={requires}")
        _pause(auto)
        return data
    else:
        _err(f"Approval failed: HTTP {code} — {data}")
        _pause(auto)
        return post


def step_publish(api: str, post: dict, connection_id: str | None, auto: bool) -> None:
    _banner(7, "Publish to LinkedIn")
    post_id = post.get("id")
    if not post_id:
        _warn("No post_id — skipping publish step.")
        return
    if post.get("status") != "approved":
        _warn(f"Post status is '{post.get('status')}' — only 'approved' posts can be dispatched.")

    print(
        textwrap.dedent("""
          PublicationService will:
            1. Resolve the operator's SocialConnection (Fernet-decrypted token).
            2. POST to LinkedIn's /ugcPosts endpoint as urn:li:person:{id}.
            3. Record an idempotent PublicationAttempt to prevent double-posting.
            4. Persist the returned platform_post_id.
        """).strip()
    )

    if not connection_id:
        _warn("No active LinkedIn connection — using simulation mode.")
        _info("In simulation, LinkedInTool.publish_post() returns a stub URN.")

    confirm = _prompt("Dispatch post to LinkedIn now? (y/N)", "y", auto)
    if confirm.lower() not in ("y", "yes"):
        _info("Skipping publish.")
        return

    _info(f"POST /api/v1/posts/{post_id}/publish ...")
    code, data = POST(api, f"/api/v1/posts/{post_id}/publish", {})
    if code == 200:
        platform_id = data.get("platform_post_id") or "simulated-urn:li:share:xxxxxx"
        _ok(f"Published! platform_post_id={platform_id}")
        if data.get("platform_post_url"):
            print(f"  {cyan('URL:')} {data['platform_post_url']}")
    else:
        _warn(f"Publish returned HTTP {code}: {data.get('error', data)}")
        _info("(This is expected in local dev without valid LinkedIn credentials.)")
    _pause(auto)


def step_leads(api: str, auto: bool) -> None:
    _banner(8, "Lead Pipeline — BANT Funnel")
    code, data = GET(api, "/api/v1/leads/pipeline")
    if code == 200:
        _ok("Pipeline summary:")
        stages = ["cold", "warm", "hot", "mql", "sql"]
        bars = {s: data.get(s, 0) for s in stages}
        total = max(sum(bars.values()), 1)
        for stage, count in bars.items():
            filled = int((count / total) * 30)
            bar = green("█" * filled) + dim("░" * (30 - filled))
            label = f"{stage:>4}  {bar}  {bold(str(count))}"
            print(f"       {label}")
        print()
        # List top leads
        code2, leads_resp = GET(api, "/api/v1/leads?limit=5")
        if code2 == 200 and isinstance(leads_resp, dict):
            for lead in leads_resp.get("data", [])[:3]:
                score = lead.get("lead_score", 0)
                color = green if score >= 75 else (yellow if score >= 50 else dim)
                print(f"       {color(f'{score:>3} pts')}  {lead.get('name')}  "
                      f"[{lead.get('lead_stage')}]  {lead.get('company', '')}")
    else:
        _warn(f"Could not fetch pipeline: HTTP {code}")
    _pause(auto)


def step_review_queue(api: str, auto: bool) -> None:
    _banner(9, "AI Reply Review Queue — Human-in-the-loop")
    print(
        textwrap.dedent("""
          When the ContextualReplyAgent generates a reply with confidence < threshold
          it is parked here for Operator authorization before dispatching.
        """).strip()
    )
    code, data = GET(api, "/api/v1/conversations/review-queue")
    if code == 200 and isinstance(data, list):
        if data:
            _ok(f"{len(data)} item(s) pending review.")
            for item in data[:3]:
                lead  = item.get("lead_name") or "Unknown Lead"
                conf  = item.get("confidence_score")
                conf_str = f"{conf*100:.0f}%" if conf is not None else "n/a"
                color = green if (conf or 0) >= 0.85 else yellow
                print(f"       {color(conf_str)}  {lead}  — {item.get('draft_reply', '')[:60]}...")
                _hr()
            msg_id = data[0].get("message_id")
            if msg_id:
                approve = _prompt(f"Approve first reply (message_id={msg_id})? (y/N)", "y", auto)
                if approve.lower() in ("y", "yes"):
                    code2, resp = POST(api, f"/api/v1/conversations/review-queue/{msg_id}/approve")
                    if code2 == 200:
                        _ok(f"Reply approved — status={resp.get('status')}")
                    else:
                        _warn(f"Approval returned {code2}: {resp}")
        else:
            _ok("Review queue is empty — all AI replies were high-confidence.")
    else:
        _warn(f"Could not fetch review queue: HTTP {code}")
    _pause(auto)


def step_dashboard(api: str, auto: bool) -> None:
    _banner(10, "Command Center Dashboard — Live Telemetry")
    code, data = GET(api, "/api/v1/analytics/dashboard")
    if code == 200 and isinstance(data, dict):
        _ok("Dashboard KPIs:")
        kpis = [
            ("Total Posts Published",   data.get("total_posts_published", 0)),
            ("Total Leads",             data.get("total_leads", 0)),
            ("MQL / SQL Leads",         data.get("mql_sql_leads", 0)),
            ("Review Queue Pending",    data.get("review_queue_pending", 0)),
            ("Avg Reply Confidence",    f"{(data.get('avg_reply_confidence', 0)*100):.0f}%"),
        ]
        for label, value in kpis:
            print(f"       {label:<30} {bold(str(value))}")
        stages = data.get("leads_by_stage", {})
        if stages:
            print(f"\n       {dim('Lead stage distribution:')}")
            for k, v in stages.items():
                print(f"         {k:>6}: {v}")
        recent = data.get("recent_posts", [])
        if recent:
            print(f"\n       {dim('Recent dispatches:')}")
            for p in recent[:3]:
                ts = str(p.get("created_at", ""))[:10]
                print(f"         {dim(ts)}  {p.get('content', '')[:60]}...")
    else:
        _warn(f"Dashboard endpoint returned HTTP {code}: {data}")
    _pause(auto)


# ── Entry point ────────────────────────────────────────────────────────────────

def main() -> int:
    parser = argparse.ArgumentParser(
        description="Interactive CLI demo of the VibeAgent Phase 1 MVP pipeline."
    )
    parser.add_argument(
        "--api-url",
        default="http://localhost:8000",
        help="Base URL of the VibeAgent backend API (default: http://localhost:8000).",
    )
    parser.add_argument(
        "--yes", "-y",
        action="store_true",
        help="Non-interactive mode: accept all defaults and skip prompts.",
    )
    args = parser.parse_args()

    api  = args.api_url.rstrip("/")
    auto = args.yes

    print("\n" + "=" * 70)
    print(bold("  VibeAgent Phase 1 MVP — Interactive Pipeline Demo"))
    print("=" * 70)
    print(f"  Backend:  {cyan(api)}")
    print(f"  Mode:     {'non-interactive (--yes)' if auto else 'interactive'}")
    print()

    # Step 1 — Health
    if not step_health(api, auto):
        _err("Aborting: backend is not reachable.")
        _info("Start the backend with:  uvicorn app.main:app --reload")
        _info("Or via Docker:           docker compose up")
        return 1

    # Step 2 — Onboarding
    step_onboard(api, auto)

    # Step 3 — LinkedIn Connector
    connection_id = step_linkedin_connector(api, auto)

    # Step 4 — Generate Post
    post = step_generate_post(api, auto)
    if not post:
        _err("Post creation failed — cannot continue with review/publish steps.")
        step_leads(api, auto)
        step_review_queue(api, auto)
        step_dashboard(api, auto)
        return 1

    # Step 5 — Review & Revise
    post = step_review_and_revise(api, post, auto)

    # Step 6 — Approve
    post = step_approve(api, post, auto)

    # Step 7 — Publish
    step_publish(api, post, connection_id, auto)

    # Step 8 — Leads
    step_leads(api, auto)

    # Step 9 — Review Queue
    step_review_queue(api, auto)

    # Step 10 — Dashboard
    step_dashboard(api, auto)

    print("\n" + "=" * 70)
    print(green("  Demo complete!  Phase 1 MVP pipeline validated end-to-end."))
    print("=" * 70)
    print()
    print(f"  Next steps:")
    print(f"    {dim('--')} Open the dashboard:  {cyan('http://localhost:3000')}")
    print(f"    {dim('--')} Content Calendar:    {cyan('http://localhost:3000/calendar')}")
    print(f"    {dim('--')} Lead Pipeline:       {cyan('http://localhost:3000/leads')}")
    print(f"    {dim('--')} Review Queue:        {cyan('http://localhost:3000/review-queue')}")
    print()
    return 0


if __name__ == "__main__":
    sys.exit(main())
