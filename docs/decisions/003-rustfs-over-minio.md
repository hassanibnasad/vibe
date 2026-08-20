# 3. Use RustFS (S3-Compatible) for Media & Document Asset Storage

Date: 2026-08-20  
Status: Accepted

## Context
VibeAgent manages uploaded media, brand assets, generated images, and raw PDF/document sources. We evaluated MinIO, Local Disk, and RustFS.

## Decision
We adopt **RustFS** (lightweight S3-compatible object storage) for local development and self-hosted environments, with direct compatibility with AWS S3 / Cloudflare R2 for cloud production.

## Rationale
1. **Resource Efficiency**: RustFS consumes significantly less RAM and CPU than JVM or legacy Go object storage stacks.
2. **S3 Protocol Parity**: Provides standard S3 API endpoints (`boto3` / `aioboto3` compatible) ensuring transparent migration to Cloudflare R2 or AWS S3 in production.
3. **No Lock-in**: Code interacts exclusively with S3-compatible protocols.

## Consequences
- Asset URLs stored in database are S3 object keys or presigned URLs.
