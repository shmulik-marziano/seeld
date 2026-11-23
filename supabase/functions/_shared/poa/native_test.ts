// deno test supabase/functions/_shared/poa/  (the native engine and the reference it keeps; synthetic values only)
import assert from "node:assert/strict";
import { mockRpc, silentLog } from "../test_helpers.ts";
import { rubikFonts } from "../pdfkit/fonts.ts";
import { createNativeEngine, NATIVE_URL_ID } from "./engine/native.ts";
import type { PoaIdentity, PoaLicensee } from "./engine/types.ts";
import { PoaToolError } from "./errors.ts";
import { createPoaRpc, flattenRef, unflattenRef } from "./rpc.ts";
import { PNG_URL, SYNTH_ID } from "./fixtures.ts";

const WHO: PoaIdentity = { firstName: "דנה", lastName: "בדיקה", nationalId: SYNTH_ID, phone: "+972501234567", email: null, street: "הרצל 12", city: "תל אביב", zip: "6473912", marketingApproved: true };
const LIC: PoaLicensee = { name: "ישראל ישראלי", license: "L-00000000", phone: "050-000-0000", email: "agent@example.com" };
const ALL = { maslaka: true, harbit: true, policies: true };
const NOW = Date.UTC(2026, 10, 21, 12, 0, 0);
const text = (b: Uint8Array) => new TextDecoder("latin1").decode(b);
const utf16 = (s: string) => [...s].map((c) => c.codePointAt(0)!.toString(16).padStart(4, "0")).join("").toUpperCase();

const engine = (licensee: PoaLicensee | null = LIC) => createNativeEngine({ licensee, fonts: rubikFonts, log: silentLog(), now: () => NOW, newSid: () => "sid-1" });

Deno.test("native start: no network, the reference is a snapshot of the identity and the licensee; refused without a licensee", async () => {
  const out = await engine().start(WHO, ALL);
  assert.deepEqual(out, { customerId: null, urlId: NATIVE_URL_ID, sid: "sid-1", existing: false, identity: WHO, licensee: LIC, modules: ALL });
  await assert.rejects(() => engine(null).start(WHO, ALL), (e: unknown) => e instanceof PoaToolError && e.code === "licensee_not_configured");
  await assert.rejects(() => engine().start(WHO, { maslaka: false, harbit: false, policies: false }), (e: unknown) => e instanceof PoaToolError && e.code === "no_modules");
});

/** the page content streams are deflated: inflate every FlateDecode stream and return the readable text of the file */
async function inflated(pdf: Uint8Array): Promise<string> {
  const raw = text(pdf);
  const re = /\/Filter \/FlateDecode \/Length (\d+) >>\nstream\n/g;
  let out = raw;
  for (const m of raw.matchAll(re)) {
    const start = m.index! + m[0].length;
    const ds = new DecompressionStream("deflate");
    const w = ds.writable.getWriter();
    void w.write(pdf.subarray(start, start + Number(m[1])));
    void w.close();
    out += "\n" + text(new Uint8Array(await new Response(ds.readable).arrayBuffer()));
  }
  return out;
}

Deno.test("native preview: a PDF with the preview mark; final: the evidence block, the one signature on every document, no mark", async () => {
  const e = engine();
  const ref = await e.start(WHO, ALL);
  const preview = await e.preview(ref, "harbit");
  assert.equal(text(preview.subarray(0, 5)), "%PDF-");
  assert.ok((await inflated(preview)).includes("0.45 0.45 0.45 rg"), "the preview carries the grey mark");
  const final = await e.final!(ref, "harbit", { atMs: NOW, ip: "203.0.113.9" });
  const finalText = await inflated(final);
  assert.ok(!finalText.includes("0.45 0.45 0.45 rg"), "no mark on a final document");
  assert.ok(finalText.includes(utf16("203.0.113.9")), "the evidence carries the address (ActualText)");
  assert.ok(finalText.includes(utf16("21/11/2026")), "the evidence carries the Israel date (NOW is 12:00 UTC = 14:00 Israel, 21/11)");
  assert.ok(!text(final).includes("/Subtype /Image"), "an approval without a signature (older page) renders without the image");
  for (const kind of ["maslaka", "harbit", "policies"] as const) {
    const signed = await e.final!(ref, kind, { atMs: NOW, ip: "203.0.113.9", signaturePng: PNG_URL });
    assert.ok(text(signed).includes("/Subtype /Image"), `the signature is drawn on ${kind}`);
  }
  await assert.rejects(() => e.final!(ref, "policies", { atMs: NOW, ip: "203.0.113.9" }), (x: unknown) => x instanceof PoaToolError && x.code === "bad_consent_data");
  for (const kind of ["maslaka", "harbit", "policies"] as const) {
    await assert.rejects(() => e.final!(ref, kind, { atMs: NOW, ip: "203.0.113.9", signaturePng: "data:image/png;base64,iVBORw0KGgoAAAA" }), (x: unknown) => x instanceof PoaToolError && x.kind === "generic");
  }
  // a reference without the snapshot (an older session) cannot render
  await assert.rejects(() => e.preview({ customerId: null, urlId: NATIVE_URL_ID, sid: "x", existing: false }, "maslaka"), (x: unknown) => x instanceof PoaToolError && x.code === "native_ref_incomplete");
});

Deno.test("native consent: validates like the tool (harbit dates, policies signature; the same signature accepted on all three) and sends nothing", async () => {
  const e = engine();
  const ref = await e.start(WHO, ALL);
  assert.deepEqual(await e.consent(ref, "maslaka", {}), {});
  assert.deepEqual(await e.consent(ref, "maslaka", { signaturePng: PNG_URL }), {});
  assert.deepEqual(await e.consent(ref, "harbit", { birthDate: "1990-05-17", issueDate: "2015-01-01" }), {});
  assert.deepEqual(await e.consent(ref, "harbit", { birthDate: "1990-05-17", issueDate: "2015-01-01", signaturePng: PNG_URL }), {});
  assert.deepEqual(await e.consent(ref, "policies", { signaturePng: PNG_URL }), {});
  for (const [kind, data] of [["harbit", {}], ["harbit", { birthDate: "1990-05-17", issueDate: "1980-01-01" }], ["policies", {}], ["policies", { signaturePng: "data:text/html;base64,AAAA" }], ["maslaka", { signaturePng: "data:text/html;base64,AAAA" }], ["harbit", { birthDate: "1990-05-17", issueDate: "2015-01-01", signaturePng: "data:text/html;base64,AAAA" }]] as const) {
    await assert.rejects(() => e.consent(ref, kind, data), (x: unknown) => x instanceof PoaToolError && x.code === "bad_consent_data");
  }
});

Deno.test("reference: the snapshot travels as flat i_* / l_* scalars and comes back whole; the customer id is optional", async () => {
  const flat = flattenRef({ identity: WHO, licensee: LIC });
  for (const v of Object.values(flat)) assert.ok(typeof v === "string" || typeof v === "boolean");
  assert.ok(!("i_email" in flat), "a null email is left out");
  assert.deepEqual(unflattenRef(flat), { identity: WHO, licensee: LIC });
  assert.deepEqual(unflattenRef({ i_first_name: "x" }), {}, "a partial snapshot is no snapshot");
  const rpc = mockRpc((fn) => (fn === "poa_session_get"
    ? { session_id: "c0000000-0000-4000-8000-0000000000aa", status: "open", expires_at: "2026-11-21T13:00:00Z", engine: "native", surense_customer_id: null,
        modules: { maslaka: { enabled: true, required: true, performed: false }, harbit: { enabled: true, required: true, performed: false }, policies: { enabled: true, required: true, performed: false } },
        engine_ref: { sid: "sid-1", url_id: NATIVE_URL_ID, existing: false, ...flat }, preview_sha: {}, completed_at: null }
    : { ok: true }));
  const poa = createPoaRpc(rpc);
  await poa.engineRefSet("c0000000-0000-4000-8000-0000000000aa", { customerId: null, urlId: NATIVE_URL_ID, sid: "sid-1", existing: false, identity: WHO, licensee: LIC });
  const set = rpc.calls[0].args.p_ref as Record<string, unknown>;
  assert.ok(!("customer_id" in set), "no customer id key for the native engine");
  assert.equal(set.i_national_id, SYNTH_ID);
  assert.equal(set.l_license, "L-00000000");
  const s = await poa.sessionGet("ab".repeat(32));
  assert.deepEqual(s.engineRef, { customerId: null, sid: "sid-1", urlId: NATIVE_URL_ID, existing: false, identity: WHO, licensee: LIC });
  assert.equal(s.engine, "native");
});
