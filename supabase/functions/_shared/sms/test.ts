// deno test supabase/functions/_shared/sms  (no network: a mocked fetch answers like Micropay)
import assert from "node:assert/strict";
import { json, mockFetch } from "../test_helpers.ts";
import { MICROPAY_OTP_URL, MICROPAY_SMS_URL, normalizeIsraeliPhone, otpSend, otpVerify, smsBalance } from "./micropay.ts";

const TOKEN = "micropay-token-for-tests-aaaaaaaaaa";

Deno.test("micropay: phone normalisation keeps Israeli local digits only", () => {
  assert.equal(normalizeIsraeliPhone("050-123 4567"), "0501234567");
  assert.equal(normalizeIsraeliPhone("+972501234567"), "0501234567");
  assert.equal(normalizeIsraeliPhone("972501234567"), "0501234567");
  assert.equal(normalizeIsraeliPhone("035555555"), "035555555");
  assert.equal(normalizeIsraeliPhone("05012345"), null, "too short");
  assert.equal(normalizeIsraeliPhone("1234567890"), null, "not Israeli");
  assert.equal(normalizeIsraeliPhone(501234567), null);
});

Deno.test("micropay: balance = act=credit on the sending endpoint; the token travels in the JSON body only", async () => {
  const f = mockFetch((url, body) => {
    assert.equal(url, MICROPAY_SMS_URL);
    assert.deepEqual(JSON.parse(body), { token: TOKEN, act: "credit" });
    return json({ status: 1, action: "credit", message: "OK", data: { credit: 4998, remoteIP: "203.0.113.10" } });
  });
  const r = await smsBalance({ token: TOKEN, fetch: f.fetch });
  assert.deepEqual(r, { ok: true, data: { credit: 4998 } });
  assert.equal(f.calls[0].init?.method, "POST");
  assert.equal(new Headers(f.calls[0].init?.headers).get("content-type"), "application/json");
  assert.ok(!f.calls[0].url.includes(TOKEN), "never in the URL");
});

Deno.test("micropay: a bad token is a short code, never the provider's text", async () => {
  const f = mockFetch(() => json({ status: 0, action: "credit", message: "ERROR", data: { description: "token parameter, invalid or missing", remoteIP: "x" } }));
  const r = await smsBalance({ token: TOKEN, fetch: f.fetch });
  assert.deepEqual(r, { ok: false, code: "bad_token", status: 200, retryable: false });
});

Deno.test("micropay: http and network failures carry a status code and a retryable flag", async () => {
  const f = mockFetch(() => new Response("busy", { status: 503 }));
  assert.deepEqual(await smsBalance({ token: TOKEN, fetch: f.fetch }), { ok: false, code: "http_503", status: 503, retryable: true });
  const g = mockFetch(() => { throw new TypeError("boom"); });
  assert.deepEqual(await smsBalance({ token: TOKEN, fetch: g.fetch }), { ok: false, code: "network", status: 0, retryable: true });
  const h = mockFetch(() => new Response("<html>", { status: 200 }));
  assert.equal((await smsBalance({ token: TOKEN, fetch: h.fetch }) as { code: string }).code, "bad_response");
});

Deno.test("micropay otp: send maps every option to the documented parameter names; CODE_SENT carries the channel", async () => {
  const f = mockFetch((url, body) => {
    assert.equal(url, MICROPAY_OTP_URL);
    assert.deepEqual(JSON.parse(body), {
      token: TOKEN, phone: "0501234567", type: "sms", codelen: "6", minvalid: "10", maxsms: "2", maxtries: "5", clearcodes: "send",
      smsfrom: "SEELD", lang: "he", webotp: "seeld.co.il",
    });
    return json({ status: 1, message: "CODE_SENT", data: { remoteIP: "x", channel: "sms" } });
  });
  const r = await otpSend({ token: TOKEN, fetch: f.fetch }, {
    phone: "0501234567", codeLength: 6, validMinutes: 10, maxSends: 2, maxTries: 5, clearCodes: "send", sender: "SEELD", lang: "he", webOtpDomain: "seeld.co.il",
  });
  assert.deepEqual(r, { ok: true, data: { channel: "sms" } });
  const quota = mockFetch(() => json({ status: 1, message: "MAX_SENT", data: { remoteIP: "x" } }));
  assert.deepEqual(await otpSend({ token: TOKEN, fetch: quota.fetch }, { phone: "0501234567" }), { ok: false, code: "max_sent", status: 200, retryable: false });
});

Deno.test("micropay otp: verify sends only phone+code; CODE_VALID / WRONG_CODE(triesLeft) / MAX_TRIES; a non-numeric code never reaches the provider", async () => {
  const f = mockFetch((_url, body) => {
    assert.deepEqual(JSON.parse(body), { token: TOKEN, phone: "0501234567", code: "123456" });
    return json({ status: 1, message: "CODE_VALID", data: { remoteIP: "x" } });
  });
  assert.deepEqual(await otpVerify({ token: TOKEN, fetch: f.fetch }, { phone: "0501234567", code: "123456" }), { ok: true, data: {} });
  const wrong = mockFetch(() => json({ status: 1, message: "WRONG_CODE", data: { remoteIP: "x", triesLeft: 3 } }));
  assert.deepEqual(await otpVerify({ token: TOKEN, fetch: wrong.fetch }, { phone: "0501234567", code: "000000" }), { ok: false, code: "wrong_code", status: 200, retryable: false, triesLeft: 3 });
  const locked = mockFetch(() => json({ status: 1, message: "MAX_TRIES", data: { remoteIP: "x" } }));
  assert.equal((await otpVerify({ token: TOKEN, fetch: locked.fetch }, { phone: "0501234567", code: "000000" }) as { code: string }).code, "max_tries");
  const g = mockFetch(() => json({}));
  assert.equal((await otpVerify({ token: TOKEN, fetch: g.fetch }, { phone: "0501234567", code: "abc" }) as { code: string }).code, "wrong_code");
  assert.equal(g.calls.length, 0);
});
