// Placeholder adapters. They call nothing. Every method answers `not_implemented` (kind permanent) and
// capabilities.ready is false, so the worker will not drain their queues.
// TODO(owner): every numeric value below is a tuning placeholder, NOT a vendor limit. Replace after the
// vendor documents and the owner's contracts are checked.
import type { AdapterResult, RateLimitProfile, SystemAdapter } from "./types.ts";
import { DEFAULT_BACKOFF_SEC, DEFAULT_MAX_ATTEMPTS, DEFAULT_VISIBILITY_TIMEOUT_SEC } from "../queue/policy.ts";

const notImplemented = async <T>(): Promise<AdapterResult<T>> => ({ ok: false, kind: "permanent", code: "not_implemented" });

/** Fast queue: leads, tasks, completed questionnaire steps. */
export const SALESFORCE_PROFILE: RateLimitProfile = {
  requestsPerSecond: null, // TODO(owner)
  minIntervalMs: 100, // TODO(owner): placeholder
  queue: {
    visibilityTimeoutSec: DEFAULT_VISIBILITY_TIMEOUT_SEC,
    batchSize: 20, // TODO(owner): placeholder
    drainIntervalSec: 10, // TODO(owner): placeholder
    maxAttempts: DEFAULT_MAX_ATTEMPTS,
    backoffSec: DEFAULT_BACKOFF_SEC, // TODO(owner)
    skipRequeueSec: 5,
    haltedRequeueSec: 300,
    lockedRetrySec: 60, // TODO(owner)
  },
};

/** Slow queue: cases and institutional data. Smaller batches, slower drain, longer lock backoff. */
export const SURENSE_PROFILE: RateLimitProfile = {
  requestsPerSecond: null, // TODO(owner)
  minIntervalMs: 1000, // TODO(owner): placeholder
  queue: {
    visibilityTimeoutSec: DEFAULT_VISIBILITY_TIMEOUT_SEC,
    batchSize: 5, // TODO(owner): placeholder
    drainIntervalSec: 30, // TODO(owner): placeholder
    maxAttempts: DEFAULT_MAX_ATTEMPTS,
    backoffSec: [60, 600, 3600], // TODO(owner)
    skipRequeueSec: 15,
    haltedRequeueSec: 600,
    lockedRetrySec: 300, // TODO(owner): record locks on concurrent customer/case updates
  },
};

function placeholder(id: "salesforce" | "surense", profile: RateLimitProfile, recordLocking: boolean, overrides: Partial<RateLimitProfile>): SystemAdapter {
  const merged: RateLimitProfile = { ...profile, ...overrides, queue: { ...profile.queue, ...(overrides.queue ?? {}) } };
  return {
    id,
    capabilities: {
      createLead: id === "salesforce",
      upsertCustomer: true,
      updateCase: true,
      getCustomer: true,
      externalIdUpsert: false, // TODO(owner): confirm with the vendor
      recordLocking,
      ready: false,
    },
    profile: merged,
    createLead: () => notImplemented(),
    upsertCustomer: () => notImplemented(),
    updateCase: () => notImplemented(),
    getCustomer: () => notImplemented(),
  };
}

export const createSalesforceAdapter = (overrides: Partial<RateLimitProfile> = {}) => placeholder("salesforce", SALESFORCE_PROFILE, false, overrides);
export const createSurenseAdapter = (overrides: Partial<RateLimitProfile> = {}) => placeholder("surense", SURENSE_PROFILE, true, overrides);
