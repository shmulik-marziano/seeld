// deno test supabase/functions/_shared/logger_test.ts  (pure; synthetic values only, secrets are built at run time)
import assert from "node:assert/strict";
import { createLogger, redact, redactString } from "./logger.ts";

// built from parts so no secret-shaped literal sits in the source (CI greps supabase/functions for them)
const SB = ["sb", "secret", "zzfakefakefake0000"].join("_");
const WH = "whsec_" + "ZmFrZS1mYWtlLWZha2UtZmFrZQ==";
const CID = "cid_" + "zzfake0000";

Deno.test("logger: existing value patterns are unchanged", () => {
  assert.equal(redactString("id 000000018 ok"), "id [redacted-id] ok");
  assert.equal(redactString("+972500000000"), "[redacted-phone]");
  assert.equal(redactString("zz@example.test"), "[redacted-email]");
  assert.equal(redactString("Bearer abcdefghijklmnop"), "Bearer [redacted]");
  assert.equal(redactString("plain text, 12 rows"), "plain text, 12 rows");
});

Deno.test("logger: Surense field names are redacted by key, any case, nested", () => {
  const out = redact({
    cellNumber: "x", CELLNUMBER: "x", idNumber: "x", email1: "x", email2: "x", partnerCellNumber: "x",
    partnerEmail: "x", partnerIdNumber: "x", client_secret: "x", svix_signature: "x", "svix-signature": "x", url: "x",
    href: "x", firstName: "x", lastName: "x", fullName: "x", birthDate: "x",
    nested: { customer: { cellnumber: "x", FirstName: "x", status: "active" } },
    ok: 3, svixId: "msg_test0001", type: "customer.updated",
  }) as Record<string, unknown>;
  for (const [k, v] of Object.entries(out)) {
    if (k === "nested" || k === "ok" || k === "svixId" || k === "type") continue;
    assert.equal(v, "[redacted]", k);
  }
  assert.deepEqual(out.nested, { customer: { cellnumber: "[redacted]", FirstName: "[redacted]", status: "active" } });
  assert.equal(out.ok, 3);
  assert.equal(out.svixId, "msg_test0001");
  assert.equal(out.type, "customer.updated");
});

Deno.test("logger: whsec_ / sb_secret_ / cid_ values are redacted whole, also when embedded", () => {
  assert.equal(redactString(WH), "[redacted-secret]");
  assert.equal(redactString(SB), "[redacted-secret]");
  assert.equal(redactString(CID), "[redacted-secret]");
  assert.equal(redactString(`${CID} and the rest of the line`), "[redacted-secret]");
  assert.equal(redactString(`key=${SB} end`), "key=[redacted-secret] end");
  assert.equal(redactString(`got ${WH}`), "got [redacted-secret]");
  assert.deepEqual(redact({ slot: "SURENSE_WEBHOOK_SECRET_NEXT", list: [CID, "fine"] }), {
    slot: "SURENSE_WEBHOOK_SECRET_NEXT",
    list: ["[redacted-secret]", "fine"],
  });
});

Deno.test("logger: a line never carries a secret or a Surense personal field", () => {
  const lines: string[] = [];
  const log = createLogger({ fn: "t" }, { write: (l) => lines.push(l), now: () => new Date(0) });
  log.warn(`token for ${CID}`, { client_secret: "zz-fake", cellNumber: "+972500000000", url: "https://x.example/f?sig=zz", key: SB });
  assert.equal(lines.length, 1);
  const line = lines[0];
  for (const bad of [CID, SB, "zz-fake", "+972500000000", "sig=zz"]) assert.ok(!line.includes(bad), bad);
  const j = JSON.parse(line);
  assert.equal(j.msg, "token for [redacted-secret]");
  assert.equal(j.key, "[redacted-secret]");
  assert.equal(j.level, "warn");
});
