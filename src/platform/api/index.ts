import { z } from "zod";
import { ApiClient, type ApiClientOptions } from "./client";

export * from "./errors";
export * from "./retry";
export * from "./client";

/** Response of GET /api/v1/health (see docs/platform/openapi.yaml). */
export const healthSchema = z.object({ status: z.literal("ok"), time: z.string() });
/** Response of GET /api/v1/version. */
export const versionSchema = z.object({ name: z.string(), apiVersion: z.string(), commit: z.string().nullable() });

export function createApiClient(opts: ApiClientOptions): ApiClient {
  return new ApiClient(opts);
}

export const endpoints = {
  health: (c: ApiClient) => c.get("/health", { schema: healthSchema, anonymous: true }),
  version: (c: ApiClient) => c.get("/version", { schema: versionSchema, anonymous: true }),
};
