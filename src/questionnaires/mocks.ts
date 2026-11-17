// Process-wide mock adapters (in memory). Hub, send sheet and the client shell share them in dev so the whole link flow can be tried
// in one browser tab without a server. Replace with real adapters when the server pieces exist (docs/product/QUESTIONNAIRE-LINK-FLOW.md).
import { MockClientSessionAdapter, MockRequestsAdapter } from "./adapters";
import type { SubmitAdapter, SubmitPayload, SubmitResult } from "./adapters";

export const requestsAdapter = new MockRequestsAdapter();
export const clientSessionAdapter = new MockClientSessionAdapter(requestsAdapter);

export function clientSubmitAdapter(token: string): SubmitAdapter {
  return {
    enabled: true,
    label: "מדומה (בזיכרון)",
    saveStep: (p: SubmitPayload): Promise<SubmitResult> => clientSessionAdapter.saveStep(token, p),
    submit: (p: SubmitPayload): Promise<SubmitResult> => clientSessionAdapter.saveStep(token, p),
  };
}
