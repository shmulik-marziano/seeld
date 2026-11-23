// Login (spec ס1-ס2): national id + mobile -> one-time code to that mobile -> session. The answer to the first step is
// the same whether or not the details matched (anti-enumeration); the code field uses autocomplete="one-time-code" so
// the phone offers the code from the SMS (WebOTP line sent by the server). Details stay in component state.
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { TurnstileWidget } from "@/components/forms/TurnstileWidget";
import { useTurnstileToken } from "@/pages/report-order/useTurnstileToken";
import { israeliIdCheckDigitOk } from "@/questionnaires/validators";
import { MY_COPY as C } from "@/lib/client-area/copy";
import { MY_LIMITS } from "@/lib/client-area/config";
import { type ClientApi, errorKindOf, type LoginVerifyRes, ClientApiError } from "@/lib/client-area/api";
import { Field, FieldError, MyCard, SubmitBar, focusFirst } from "../parts";

const digits = (s: string) => s.replace(/\D/g, "");
export const validateId = (v: string): string | undefined => (israeliIdCheckDigitOk(digits(v).padStart(9, "0")) && digits(v).length >= 5 ? undefined : C.login.idErr);
export const validatePhone = (v: string): string | undefined => (/^05\d{8}$/.test(digits(v)) ? undefined : C.login.phoneErr);
export const validateCode = (v: string): string | undefined => (new RegExp(`^\\d{${MY_LIMITS.codeLength}}$`).test(digits(v)) ? undefined : C.login.codeErr);

export function Login({ api, onSignedIn, onError }: { api: ClientApi; onSignedIn: (r: LoginVerifyRes) => void; onError: (e: unknown) => void }) {
  const [step, setStep] = useState<"details" | "code">("details");
  const [id, setId] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [errs, setErrs] = useState<{ id?: string; phone?: string; code?: string }>({});
  const [busy, setBusy] = useState(false);
  const [challenge, setChallenge] = useState<{ id: string; tail: string } | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const turnstile = useTurnstileToken();

  useEffect(() => { heading.current?.focus(); }, [step]);
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [resendIn]);

  const start = async () => {
    setBusy(true);
    try {
      const turnstile_token = await turnstile.waitForToken();
      try {
        const r = await api.loginStart({ national_id: digits(id).padStart(9, "0"), phone: digits(phone), turnstile_token });
        setChallenge({ id: r.challenge_id, tail: r.phone_tail });
        setCode("");
        setErrs({});
        setResendIn(MY_LIMITS.resendAfterSec);
        setStep("code");
      } finally {
        turnstile.reset();
      }
    } catch (e) {
      onError(e);
    } finally {
      setBusy(false);
    }
  };

  const submitDetails = (e: FormEvent) => {
    e.preventDefault();
    const next = { id: validateId(id), phone: validatePhone(phone) };
    setErrs(next);
    if (next.id || next.phone) { focusFirst(["id", "phone"], next); return; }
    void start();
  };

  const submitCode = async (e: FormEvent) => {
    e.preventDefault();
    const err = validateCode(code);
    setErrs({ code: err });
    if (err || !challenge) { focusFirst(["code"], { code: err }); return; }
    setBusy(true);
    try {
      onSignedIn(await api.loginVerify({ challenge_id: challenge.id, code: digits(code) }));
    } catch (e) {
      const kind = errorKindOf(e);
      if (kind === "wrong_code") {
        const left = e instanceof ClientApiError ? e.triesLeft : undefined;
        setErrs({ code: typeof left === "number" ? C.login.wrongCodeLeft(left) : C.login.wrongCode });
        focusFirst(["code"], { code: "x" });
      } else if (kind === "max_tries") {
        setErrs({ code: C.login.maxTries });
      } else if (kind === "expired") {
        setErrs({ code: C.login.expired });
      } else {
        onError(e);
      }
    } finally {
      setBusy(false);
    }
  };

  if (step === "code" && challenge) {
    return (
      <form onSubmit={submitCode} noValidate>
        <MyCard id="my-code" title={C.login.sentTitle} headingRef={heading}>
          <p className="sd-q-hint">{C.login.sentLead(challenge.tail)}</p>
          <Field id="code" label={C.login.codeLabel} value={code} onChange={(v) => { setCode(v); if (errs.code) setErrs({}); }}
            err={errs.code} inputMode="numeric" autoComplete="one-time-code" maxLength={MY_LIMITS.codeLength} autoFocus />
          <div className="sd-my-links">
            {resendIn > 0
              ? <p className="sd-q-fine" aria-live="polite">{C.login.resendWait(resendIn)}</p>
              : <button type="button" className="sd-q-linkbtn" disabled={busy} onClick={() => void start()}>{C.login.resend}</button>}
            <button type="button" className="sd-q-linkbtn" disabled={busy} onClick={() => { setStep("details"); setErrs({}); }}>{C.login.editDetails}</button>
          </div>
          <SubmitBar cta={C.login.verifyCta} busy={busy} />
        </MyCard>
      </form>
    );
  }

  return (
    <form onSubmit={submitDetails} noValidate>
      <MyCard id="my-login" title={C.login.title} headingRef={heading}>
        <p className="sd-q-hint">{C.login.lead}</p>
        <Field id="id" label={C.login.idLabel} value={id} onChange={(v) => { setId(v); if (errs.id) setErrs((x) => ({ ...x, id: undefined })); }}
          err={errs.id} inputMode="numeric" autoComplete="off" maxLength={9} />
        <Field id="phone" label={C.login.phoneLabel} value={phone} onChange={(v) => { setPhone(v); if (errs.phone) setErrs((x) => ({ ...x, phone: undefined })); }}
          err={errs.phone} inputMode="tel" autoComplete="tel-national" maxLength={12} />
        {turnstile.widget && <TurnstileWidget ref={turnstile.widget.handle} siteKey={turnstile.widget.siteKey} onToken={turnstile.widget.onToken} onError={turnstile.widget.onError} />}
        <p className="sd-q-fine">{C.login.privacy}</p>
        <p className="sd-q-fine sd-my-join">{C.login.joinLine} <Link to="/report/start/order?from=join">{C.login.joinLink}</Link></p>
        <FieldError id="form" />
        <SubmitBar cta={C.login.cta} busy={busy} />
      </MyCard>
    </form>
  );
}
