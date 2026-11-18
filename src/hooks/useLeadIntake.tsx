import { useCallback, useId, useRef, useState, type ReactNode } from "react";
import { TURNSTILE_SITE_KEY } from "@/integrations/supabase/config";
import { TurnstileWidget, type TurnstileHandle } from "@/components/forms/TurnstileWidget";
import {
  buildLeadPayload, newIdempotencyKey, postLead,
  type LeadInput, type LeadResult,
} from "@/lib/leadIntake";

// Form-side state for one v2 lead form:
// - Idempotency-Key per submission attempt: kept while the canonical payload is unchanged (a retry after a
//   timeout or a 5xx replays instead of creating a second lead), replaced when the visitor edits the form,
//   after a success and after a 409.
// - A second submit while one is in flight returns the same promise (a double click = one request).
// - Honeypot: a hidden field; whatever a bot types there goes out as `hp` and the server drops the lead.
// - Turnstile: rendered lazily only when VITE_TURNSTILE_SITE_KEY is set; every attempt waits briefly for a
//   token and resets the widget afterwards (tokens are single-use).

const TOKEN_WAIT_MS = 8000;

export function useLeadIntake() {
  const [submitting, setSubmitting] = useState(false);
  const attempt = useRef<{ key: string; body: string } | null>(null);
  const inFlight = useRef<Promise<LeadResult> | null>(null);
  const hp = useRef("");
  const token = useRef<string | null>(null);
  const tokenWaiters = useRef<Array<(t: string | null) => void>>([]);
  const widget = useRef<TurnstileHandle>(null);
  const [widgetFailed, setWidgetFailed] = useState(false);
  const hpId = `sd-hp-${useId().replace(/:/g, "")}`;

  const onToken = useCallback((t: string | null) => {
    token.current = t;
    if (t) tokenWaiters.current.splice(0).forEach((w) => w(t));
  }, []);

  const waitForToken = useCallback((): Promise<string | null> => {
    if (!TURNSTILE_SITE_KEY || widgetFailed) return Promise.resolve(null);
    if (token.current) return Promise.resolve(token.current);
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        tokenWaiters.current = tokenWaiters.current.filter((w) => w !== done);
        resolve(null);
      }, TOKEN_WAIT_MS);
      const done = (t: string | null) => { clearTimeout(timer); resolve(t); };
      tokenWaiters.current.push(done);
    });
  }, [widgetFailed]);

  const submit = useCallback((input: Omit<LeadInput, "hp">): Promise<LeadResult> => {
    if (inFlight.current) return inFlight.current;
    const run = async (): Promise<LeadResult> => {
      setSubmitting(true);
      try {
        const body = buildLeadPayload({ ...input, hp: hp.current });
        const json = JSON.stringify(body);
        if (!attempt.current || attempt.current.body !== json) attempt.current = { key: newIdempotencyKey(), body: json };
        const turnstileToken = await waitForToken();
        const result = await postLead(body, { idempotencyKey: attempt.current.key, turnstileToken });
        if (result.ok || result.code === "conflict") attempt.current = null;
        return result;
      } finally {
        widget.current?.reset();
        token.current = null;
        setSubmitting(false);
        inFlight.current = null;
      }
    };
    inFlight.current = run();
    return inFlight.current;
  }, [waitForToken]);

  const guard: ReactNode = (
    <>
      <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", top: "auto", width: 1, height: 1, overflow: "hidden" }}>
        <label htmlFor={hpId}>Website</label>
        <input
          id={hpId}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
          onChange={(e) => { hp.current = e.target.value; }}
        />
      </div>
      {TURNSTILE_SITE_KEY && !widgetFailed ? (
        <TurnstileWidget ref={widget} siteKey={TURNSTILE_SITE_KEY} onToken={onToken} onError={() => setWidgetFailed(true)} />
      ) : null}
    </>
  );

  return { submit, submitting, guard };
}
