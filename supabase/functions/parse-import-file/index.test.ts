import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

Deno.test("parse-import-file: returns error when no file data", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/parse-import-file`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ fileName: "test.xlsx" }),
  });
  const body = await response.json();
  assertEquals(response.status, 400);
  assertExists(body.error);
});

Deno.test("parse-import-file: handles invalid base64 gracefully", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/parse-import-file`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ fileName: "test.xlsx", fileBase64: "not-valid-base64!!!" }),
  });
  const body = await response.json();
  // Should return 500 with parse error
  assertEquals(response.status, 500);
  assertExists(body.error);
});

Deno.test("parse-import-file: CORS preflight works", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/parse-import-file`, {
    method: "OPTIONS",
    headers: {
      "apikey": SUPABASE_ANON_KEY,
    },
  });
  await response.text();
  assertEquals(response.status, 200);
  assertEquals(response.headers.get("Access-Control-Allow-Origin"), "*");
});
