import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BOI_CSV_URL = "https://www.boi.org.il/boi_files/Pikuah/snifim_he.csv";

interface BranchData {
  bankCode: string;
  bankName: string;
  branchCode: string;
  branchName: string;
  city: string;
  address: string;
}

// BOI CSV has unquoted fields containing " (e.g. בע"מ), so we can't use standard CSV parsing.
// Instead, split by comma and rejoin columns that were split inside Hebrew text.
// The header has 23 columns. We know column indices, so we use a simple split.
// The key insight: bank code (col 0) is always a number, branch code (col 2) is always a number.
// We split by comma and use a fixed-column approach based on the known 23-column format.
function parseCSVLineSimple(line: string): string[] {
  // Remove BOM if present
  const clean = line.replace(/^\uFEFF/, "");
  return clean.split(",");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Fetching BOI bank branches CSV...");
    const response = await fetch(BOI_CSV_URL);
    if (!response.ok) {
      throw new Error(`BOI CSV fetch failed: ${response.status}`);
    }

    const text = await response.text();
    const lines = text.split("\n").filter(l => l.trim());

    // CSV columns: bank code, bank name, branch code, sub branch code, branch name, address, city, zipcode, ...
    // Filter only "רגיל" (regular) branch types, skip "יחידת ביצוע" (operational units)
    const branches: BranchData[] = [];
    const bankSet: Record<string, string> = {};

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLineSimple(lines[i]);
      if (cols.length < 13) continue;

      const bankCode = cols[0]?.replace(/\D/g, "");
      const bankName = cols[1]?.replace(/בע"מ|בע''מ/g, "").trim() || "";
      const branchCode = cols[2]?.replace(/\D/g, "");
      const branchName = cols[4]?.trim() || "";
      const city = cols[6]?.trim() || "";
      const branchType = cols[12]?.trim() || "";

      if (!bankCode || !branchCode) continue;
      // Skip operational/internal units, keep only regular branches
      if (branchType === "יחידת ביצוע") continue;

      // Use first occurrence of bank name (cleanest)
      if (!bankSet[bankCode]) bankSet[bankCode] = bankName;

      const display = city ? `${branchName} — ${city}` : branchName;
      branches.push({ bankCode, bankName, branchCode, branchName: display, city, address: "" });
    }

    // Structure: { banks: { code: name }, branches: { bankCode: { branchCode: displayName } } }
    const structured: Record<string, Record<string, string>> = {};
    for (const b of branches) {
      if (!structured[b.bankCode]) structured[b.bankCode] = {};
      structured[b.bankCode][b.branchCode] = b.branchName;
    }

    const result = {
      banks: bankSet,
      branches: structured,
      updatedAt: new Date().toISOString(),
      totalBranches: branches.length,
    };

    console.log(`Parsed ${branches.length} branches from ${Object.keys(bankSet).length} banks`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("fetch-bank-branches error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
