import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as XLSX from "https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs";

/**
 * Edge Function: sync-tracks
 * Downloads the gemelnet Excel file and upserts investment tracks to Supabase.
 *
 * Can be triggered via:
 * 1. CRON (weekly)
 * 2. Manual call from admin panel
 * 3. POST with { source: "gemelnet" | "pensianet" | "bituachnet" }
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMELNET_URL = "https://gemelnet.mof.gov.il/GmulotNetReports/tsuotKupotRavHodshiRDL.xls";

const COMPANY_MAP: Record<string, string> = {
  "אלטשולר שחם": "altshuler",
  "כלל": "clal",
  "הפניקס": "fenix",
  "הראל": "harel",
  "מיטב": "meitav",
  "מנורה מבטחים": "menora",
  "מנורה": "menora",
  "מגדל": "migdal",
  "מור": "mor",
  "אנליסט": "analyst",
  "אינפיניטי": "infinity",
  "ילין לפידות": "yelin",
  "איילון": "ayalon",
  "הכשרה": "hachshara",
};

function detectCompany(name: string): string | null {
  for (const [heb, eng] of Object.entries(COMPANY_MAP)) {
    if (name.includes(heb)) return eng;
  }
  return null;
}

function detectSpecialization(name: string): string {
  if (name.includes("מניות סחיר") || name.includes("מניות מחקה")) return "stocks_tradable";
  if (name.includes("משולב סחיר")) return "combined_tradable";
  if (name.includes("אג\"ח סחיר")) return "bonds_tradable";
  if (name.includes("s&p") || name.includes("S&P") || name.includes("מדד") || name.includes("עוקב")) return "index_tracking";
  if (name.includes("מניות")) return "stocks";
  if (name.includes("אשראי ואג")) return "credit_bonds";
  if (name.includes("אג\"ח") || name.includes("אגח")) return "bonds";
  if (name.includes("כספי") || name.includes("שקלי")) return "money_market";
  if (name.includes("הלכ") || name.includes("שריע")) return "halacha";
  if (name.includes("כללי") || name.includes("כללית")) return "general";
  return "general";
}

function detectProductType(name: string): string {
  if (name.includes("השתלמות")) return "hishtalmut";
  if (name.includes("גמל להשקעה") || name.includes("חיסכון פלוס")) return "gemel_invest";
  if (name.includes("פנסי")) return "pensia";
  if (name.includes("פוליס") || name.includes("ביטוח")) return "polisa";
  if (name.includes("ילד")) return "child_savings";
  return "gemel";
}

function getStockExposure(spec: string): number {
  switch (spec) {
    case "stocks": return 85;
    case "stocks_tradable": return 95;
    case "bonds": case "bonds_tradable": return 10;
    case "money_market": return 0;
    case "index_tracking": return 90;
    case "credit_bonds": return 20;
    default: return 50;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Download Excel from gemelnet
    console.log("Downloading Excel from gemelnet...");
    const response = await fetch(GEMELNET_URL);
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    const workbook = XLSX.read(data, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

    console.log(`Parsed ${rows.length} rows`);

    // Parse funds (start after header rows)
    const tracks: any[] = [];
    for (let r = 16; r < rows.length; r++) {
      const row = rows[r];
      if (!row || !row[18]) continue;
      const name = String(row[18]).trim();
      if (!name || name.startsWith("סה") || name.length < 5) continue;

      const company = detectCompany(name);
      if (!company) continue;

      const spec = detectSpecialization(name);
      const se = getStockExposure(spec);

      tracks.push({
        fund_number: String(row[20] || "").trim(),
        name,
        company,
        product_type: detectProductType(name),
        specialization: spec,
        stock_exposure: se,
        return_year1: parseFloat(row[14]) || 0,
        return_year3: parseFloat(row[12]) || 0,
        return_year5: parseFloat(row[10]) || 0,
        return_month: +((parseFloat(row[14]) || 0) / 12).toFixed(2),
        fee_assets: parseFloat(row[6]) || 0,
        fee_deposits: parseFloat(row[7]) || 0,
        sharpe_ratio: parseFloat(row[9]) || null,
        total_assets: parseFloat(row[4]) || 0,
        liquidity: parseFloat(row[1]) || null,
        report_period: String(row[15] || "").trim(),
        foreign_exposure: se > 60 ? 35 : 20,
        currency_exposure: se > 60 ? 20 : 10,
        stocks_pct: se,
        gov_bonds_pct: Math.max(0, 100 - se - 20),
        corp_bonds_pct: 15,
        cash_pct: 5,
        other_pct: 0,
        is_active: true,
        last_sync: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    console.log(`Parsed ${tracks.length} tracks from ${new Set(tracks.map(t => t.company)).size} companies`);

    // Upsert in batches
    let inserted = 0;
    for (let i = 0; i < tracks.length; i += 50) {
      const batch = tracks.slice(i, i + 50);
      const { error } = await supabase
        .from("investment_tracks")
        .upsert(batch, { onConflict: "fund_number" });

      if (error) {
        console.error(`Batch ${Math.floor(i / 50) + 1} error:`, error.message);
      } else {
        inserted += batch.length;
      }
    }

    const result = {
      success: true,
      tracks_synced: inserted,
      total_parsed: tracks.length,
      companies: [...new Set(tracks.map(t => t.company))],
      timestamp: new Date().toISOString(),
    };

    console.log("Sync complete:", JSON.stringify(result));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Sync error:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
