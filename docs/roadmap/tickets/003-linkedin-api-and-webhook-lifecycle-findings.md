# LinkedIn connector API findings

**Research date:** 2026-09-22  
**Scope:** Official LinkedIn documentation only. This resolves the API-access portion of [ticket 003](./003-linkedin-api-and-webhook-lifecycle.md), not the application's implementation status.

## Decision for the first end-to-end flow

The requested first connector should publish from the **connected user's personal
LinkedIn profile**, not from a LinkedIn Page. Enable the self-service **Share on
LinkedIn** product, use member-authorized OAuth, and request only
`w_member_social` plus the identity scopes needed to bind the connection. This
does not require Community Management approval. LinkedIn lists
`w_member_social` as an open, self-service permission and defines it as the
permission to post on behalf of the authenticated member. [Getting access to
LinkedIn APIs](https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access)
and [Share on LinkedIn](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin)
support this conclusion.

Website scraping, business-preference capture, RAG ingestion, draft generation,
and user review are application responsibilities; they are not LinkedIn API
features. Do not scrape LinkedIn as a substitute for this user-authorized
connection.

## Required personal-profile connection flow

1. Create a LinkedIn developer application, protect the client secret, and
   register the exact HTTPS callback URL.
2. Enable **Share on LinkedIn** and **Sign in with LinkedIn using OpenID
   Connect** in the Developer Portal. Request the least scopes:
   `openid profile w_member_social` (`email` only if the product genuinely needs
   it).
3. Start the Authorization Code (3-legged OAuth) flow at
   `https://www.linkedin.com/oauth/v2/authorization`, sending the client ID,
   exact redirect URI, space-delimited scopes, a cryptographically random
   `state`, and `response_type=code`. Validate `state`, then exchange the code
   at `https://www.linkedin.com/oauth/v2/accessToken` using the same redirect
   URI. The authenticated member explicitly consents to the requested scopes.
   [Authorization Code Flow](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow)
4. Validate the OIDC ID token with LinkedIn's discovery/JWKS metadata and bind
   the connection to its pairwise `sub`. The `profile` scope provides the
   member's basic identity; use the returned member ID to store the author as
   `urn:li:person:{id}`. LinkedIn IDs are application-specific and must not be
   reused across developer applications. [OIDC sign-in](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2)
   and [Profile API](https://learn.microsoft.com/en-us/linkedin/shared/integrations/people/profile-api)
5. On explicit user approval in VibeAgent, publish with that connection's token
   and **Person URN**, never an application-global token or an organization
   author.

LinkedIn access tokens currently last 60 days. Programmatic refresh tokens are
available to approved Marketing Developer Platform partners, have a one-year
TTL by default, and still require reauthorization when expired or revoked. A
self-service personal-post MVP must therefore handle a reconnect outcome unless
a refresh token is actually issued to its approved application. [OAuth refresh
tokens](https://learn.microsoft.com/en-us/linkedin/shared/authentication/programmatic-refresh-tokens)

## Publishing endpoint and media

For the initial self-service member workflow, use the endpoint documented by
LinkedIn's Share product: `POST https://api.linkedin.com/v2/ugcPosts`, with
`X-Restli-Protocol-Version: 2.0.0`, `author` equal to the connected member's
Person URN, `lifecycleState: "PUBLISHED"`, and a visibility choice. A successful
creation returns `201` and the post ID in `X-RestLi-Id`. The public Share guide
also specifies a 3,000-character UGC-post limit and an upload-before-post flow
for image/video assets. [Share on LinkedIn](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin)

LinkedIn's newer versioned `POST /rest/posts` API states that it replaces the
legacy UGC Posts API, accepts Person or Organization authors, and requires both
`Linkedin-Version: YYYYMM` and the Restli header. Its documentation also lists
`w_member_social` for member posting. Keep the connector behind a publishing
adapter so a future migration can select that API after verifying the app's
product access; do not make a new MVP depend on `r_member_social`, which is
restricted to approved users. [Posts API](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api)
and [Content API migration guide](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/contentapi-migration-guide)
support this migration plan.

## What changes for LinkedIn Page / organization publishing

This is a separate, later path. It requires `w_organization_social` and the
connected member must be an `ADMINISTRATOR`, `DIRECT_SPONSORED_CONTENT_POSTER`,
or `CONTENT_ADMIN` for the target Page. Check the member's organization
authorization before allowing the Page to be selected. [Posts API](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api)
and [Organization authorizations](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/organizations/organization-authorizations/getting-started)
define these constraints.

Page posting and engagement monitoring are part of the vetted **Community
Management API**. Development access is rate-limited (500 app calls/day and 100
per member/day; no `BATCH_GET`; Social Action webhooks disabled). Production
requires Standard-tier approval within 12 months. Review requires a verified
business email, organization, website/domain, and associated Page for
Development; Standard also requires a privacy policy, functional implementation
(and possibly test credentials), and a short screencast demonstrating the OAuth
flow and declared use cases. [Community Management overview](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/community-management-overview),
[migration and access-tier restrictions](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/community-management-api-migration-guide),
and [app review requirements](https://learn.microsoft.com/en-us/linkedin/marketing/community-management-app-review)
are authoritative.

## Webhooks and inbound engagement

Webhooks are **not needed** to complete the requested onboarding -> generate ->
review -> personal-profile publish MVP. Add them only when the product needs to
monitor a LinkedIn Page's public comments, likes, or shares. That path requires
a registered and validated webhook, `rw_organization_admin`, an
organization-admin subscriber, and an event subscription per application,
member, and organization. Public visibility is required for LIKE, COMMENT, and
SHARE notifications. Subscriptions end when the authorization grant expires,
the member revokes consent, or the member loses Page administration rights.
[Organization Social Action Notifications](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/organizations/organization-social-action-notifications)
documents the endpoint and lifecycle.

If introduced, the receiver must return a 2xx response promptly, deduplicate on
LinkedIn's notification identifier, fetch details from the referenced URNs as
needed, and reconcile missed events. These are Page notifications—not a generic
personal-profile webhook—and cannot be tested through Development-tier push
delivery.

## Implementation implications

- Build the first connector around a **per-user OAuth connection**: encrypted
  token material, expiry/reconnect state, immutable LinkedIn external ID, and
  Person URN.
- Make `Publish` an auditable, explicit action after review; do not publish
  automatically when a draft is generated.
- Start with text-only posts. Add the documented asset-registration/upload
  sequence only when product requirements call for media.
- Treat organization/Page publishing, read scopes, analytics, inbound comments,
  and webhooks as separately gated capabilities. They must not block the first
  personal-profile post.
- Version `/rest` calls deliberately and monitor LinkedIn version-sunset notices;
  never hard-code a stale Marketing API version.
