// Platform layer barrel. IMPORTANT: public pages must never import from src/platform.
// Enforced by src/test/platform-isolation.test.ts.
export * as config from "./config";
export * as api from "./api";
export * as auth from "./auth";
export * as documents from "./documents";
export * as events from "./events";
export * as flags from "./flags";
export * as systems from "./systems";
export * as queue from "./queue";
export * as sources from "./sources";
export * as identity from "./identity";
export * as assignment from "./assignment";
