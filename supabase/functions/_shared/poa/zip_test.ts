// deno test supabase/functions/_shared/poa/zip_test.ts  (fake fetch; the real API is never called)
import assert from "node:assert/strict";
import { createZipLookup, ZIP_HOST } from "./zip.ts";
import type { FetchFn } from "../db.ts";

const silent = { info() {}, warn() {}, error() {}, debug() {}, child() { return silent; } } as unknown as import("../logger.ts").Logger;
const env = (Result: unknown) => new Response(JSON.stringify({ ReturnCode: 0, ErrorMessage: null, Result }), { status: 200, headers: { "content-type": "application/json" } });

function fake(script: (u: URL) => Response) {
  const calls: URL[] = [];
  const f: FetchFn = (input, init) => {
    const u = new URL(String(input));
    calls.push(u);
    assert.equal(u.hostname, ZIP_HOST);
    assert.equal((init?.headers as Record<string, string>)["Ocp-Apim-Subscription-Key"].length > 10, true);
    return Promise.resolve(script(u));
  };
  return { f, calls };
}

const CITIES = [{ id: "1212", n: "תל אביב - יפו", syn: "תל אביב יפו", divided: true, zip: "0000000" }, { id: "68", n: "תל עדשים", syn: "תל עדשים", divided: false, zip: "1931500" }];
const STREETS = [{ id: "104270", n: "הרצל", syn: "הרצל", cityID: "1212" }, { id: "5", n: "רוזנבלום הרצל", syn: "הרצל רוזנבלום", cityID: "1212" }];

Deno.test("zip: city -> street -> zip, exact name wins, result cached", async () => {
  const { f, calls } = fake((u) => {
    if (u.pathname.endsWith("getcities-lang")) return env(CITIES);
    if (u.pathname.endsWith("GetStreets-lang")) { assert.equal(u.searchParams.get("CityID"), "1212"); return env(STREETS); }
    assert.equal(u.searchParams.get("StreetID"), "104270"); assert.equal(u.searchParams.get("House"), "12"); assert.equal(u.searchParams.get("ByMaanimID"), "true");
    return env({ zip: "6473912", msgtype: "address" });
  });
  const z = createZipLookup({ log: silent, fetch: f });
  assert.equal(await z.lookup({ city: "תל אביב יפו", street: "הרצל", house: "12" }), "6473912");
  assert.equal(calls.length, 3);
  assert.equal(await z.lookup({ city: "תל אביב יפו", street: "הרצל", house: "12" }), "6473912");
  assert.equal(calls.length, 3, "second lookup served from the cache");
});

Deno.test("zip: a locality with one zip answers without a street; misses and failures answer null", async () => {
  const { f } = fake((u) => (u.pathname.endsWith("getcities-lang") ? env(CITIES) : env({ zip: "", msgtype: "unitedtown" })));
  const z = createZipLookup({ log: silent, fetch: f });
  assert.equal(await z.lookup({ city: "תל עדשים", street: "ראשי", house: "3" }), "1931500");
  assert.equal(await z.lookup({ city: "עיר שלא קיימת", street: "x", house: "1" }), null);
  assert.equal(await z.lookup({ city: "", street: "x", house: "1" }), null);
  const bad = createZipLookup({ log: silent, fetch: () => Promise.resolve(new Response("denied", { status: 401 })) });
  assert.equal(await bad.lookup({ city: "תל אביב", street: "הרצל", house: "12" }), null);
  const thrown = createZipLookup({ log: silent, fetch: () => Promise.reject(new Error("net")) });
  assert.equal(await thrown.lookup({ city: "תל אביב", street: "הרצל", house: "12" }), null);
});
