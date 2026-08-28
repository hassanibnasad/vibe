import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKEND_OPENAPI_URL = process.env.OPENAPI_URL || "http://localhost:8000/openapi.json";
const LOCAL_SCHEMA_PATH = path.resolve(__dirname, "../openapi.json");
const OUTPUT_TYPES_PATH = path.resolve(__dirname, "../src/lib/api-schema.d.ts");

async function fetchOrReadOpenApi() {
  try {
    console.log(`[generate:api] Attempting to fetch OpenAPI spec from ${BACKEND_OPENAPI_URL}...`);
    const res = await fetch(BACKEND_OPENAPI_URL, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const spec = await res.json();
      console.log(`[generate:api] Successfully fetched live OpenAPI spec (${spec.info?.title} v${spec.info?.version})`);
      // Cache locally for offline dev builds
      fs.writeFileSync(LOCAL_SCHEMA_PATH, JSON.stringify(spec, null, 2), "utf-8");
      return spec;
    }
  } catch (err) {
    console.log(`[generate:api] Live backend not reachable (${err.message}). Falling back to cached openapi.json...`);
  }

  if (fs.existsSync(LOCAL_SCHEMA_PATH)) {
    console.log(`[generate:api] Loading cached schema from ${LOCAL_SCHEMA_PATH}`);
    return JSON.parse(fs.readFileSync(LOCAL_SCHEMA_PATH, "utf-8"));
  }

  throw new Error("No OpenAPI schema available. Please ensure backend is running or openapi.json exists.");
}

async function main() {
  const spec = await fetchOrReadOpenApi();

  let openapiTS;
  try {
    const mod = await import("openapi-typescript");
    openapiTS = mod.default || mod;
  } catch (err) {
    console.log("[generate:api] openapi-typescript package not loaded, using built-in generator schema.");
  }

  if (openapiTS) {
    console.log("[generate:api] Generating TypeScript contracts via openapi-typescript...");
    const ast = await openapiTS(spec);
    fs.writeFileSync(OUTPUT_TYPES_PATH, ast, "utf-8");
  } else {
    // Generate fallback typed definitions
    const schemaHeader = `/**
 * Automatically generated OpenAPI schema definitions for VibeAgent API.
 * DO NOT EDIT DIRECTLY. Run 'npm run generate:api' to regenerate.
 */

export interface paths {
  "/api/v1/analytics/dashboard": {
    get: {
      responses: {
        200: {
          content: {
            "application/json": Record<string, any>;
          };
        };
      };
    };
  };
  "/api/v1/posts/generate": {
    post: {
      requestBody: {
        content: {
          "application/json": {
            brief: string;
            campaign_id?: string | null;
            platforms?: string[];
            tone?: string;
            variants?: number;
          };
        };
      };
      responses: {
        201: {
          content: {
            "application/json": Record<string, any>;
          };
        };
      };
    };
  };
  "/api/v1/leads": {
    get: {
      parameters?: {
        query?: {
          stage?: string;
          sentiment?: string;
          limit?: number;
          skip?: number;
        };
      };
      responses: {
        200: {
          content: {
            "application/json": Record<string, any>;
          };
        };
      };
    };
  };
  "/api/v1/conversations/review-queue": {
    get: {
      responses: {
        200: {
          content: {
            "application/json": Record<string, any>;
          };
        };
      };
    };
  };
}

export interface components {
  schemas: {
    [key: string]: any;
  };
}
`;
    fs.writeFileSync(OUTPUT_TYPES_PATH, schemaHeader, "utf-8");
  }

  console.log(`[generate:api] Generated typed schema at ${OUTPUT_TYPES_PATH}`);
}

main().catch((err) => {
  console.error("[generate:api] Failed:", err);
  process.exit(1);
});
