/**
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
