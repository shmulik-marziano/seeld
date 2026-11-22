// The primary engine (spec 1א): official API for the customer and the personal link, the tool's public page API for the
// approvals themselves. The wizard never reaches either; poa-intake calls this module.
// Flow of start(): POST /customers -> licensees (first active, cached) -> swiftness accounts (first active) ->
// POST /customers/proxies/invite (only `url` is used; the tool's message text is dropped and nothing is sent to the
// client) -> urlId = last path segment of /app/p/<urlId> -> proxies/load -> proxies/start.
// A duplicate customer (Surense 40204 phone/e-mail, 40205 national id) never reaches the browser: 40204 retries with
// forceCreation, 40205 resolves the existing customer by a search and flags the reference `existing`.
// Nothing here logs a value; ids and codes only.
import type { Logger } from "../../logger.ts";
import { isUuid, type SurenseApi } from "../../surense/api.ts";
import { SurenseError } from "../../surense/errors.ts";
import type { CodeValue, Customer, Licensee, SwiftnessAccount } from "../../surense/types.ts";
import { type DpClient, type PreviewFlag } from "../dp.ts";
import { PoaToolError } from "../errors.ts";
import { cellForTool, dateForTool, nationalIdForTool, signatureForTool, splitStreet } from "../formatters.ts";
import type { ConsentData, EngineRef, FinalUrls, ModuleFlags, PoaEngine, PoaIdentity, PoaKind } from "./types.ts";

const URL_ID = /^[A-Za-z0-9_-]{4,40}$/;
const SID = /^[A-Za-z0-9_-]{8,128}$/;
export const LICENSEE_TTL_MS = 60 * 60 * 1000;
/** enumerated values of the official API travel as {code}; 1 = national id (the public page sends `idType: 1`, verified 2026-11-22). */
const ID_TYPE_NATIONAL: CodeValue = { code: 1 };
const FLAGS: Record<PoaKind, PreviewFlag> = { maslaka: "sw", harbit: "hb", policies: "p" };

export interface SurenseEngineDeps {
  api: SurenseApi;
  dp: DpClient;
  /** Surense user that owns created customers (required by POST /customers) */
  managerId: string | null;
  log: Logger;
  now?: () => number;
  newSid?: () => string;
}

/** the policies answer's links (verified 2026-11-22: {nextStep: 7, swiftnessProxyUrl?, hbProxyUrl, policiesProxyUrl},
 *  pre-signed S3 URLs). Only non-empty strings are kept; the host is checked where the link is fetched. */
export function finalUrlsOf(r: Record<string, unknown>): FinalUrls {
  const out: FinalUrls = {};
  const pick = (v: unknown) => (typeof v === "string" && v.length > 0 && v.length <= 4096 ? v : undefined);
  const sw = pick(r.swiftnessProxyUrl);
  const hb = pick(r.hbProxyUrl);
  const p = pick(r.policiesProxyUrl);
  if (sw) out.swiftness = sw;
  if (hb) out.hb = hb;
  if (p) out.policies = p;
  return out;
}

/** active unless it says otherwise: status is a Hebrew/English string or {code, description}; unknown shapes count as active */
export function isActiveStatus(s: unknown): boolean {
  const text = typeof s === "string" ? s : s && typeof s === "object" ? String((s as CodeValue).description ?? "") : "";
  if (!text) return true;
  return !/לא\s*פעיל|inactive|disabled|archived|closed|blocked/i.test(text);
}

export function pickLicensee(list: Licensee[] | null | undefined): string | null {
  for (const l of list ?? []) {
    const r = l as Record<string, unknown>;
    if (isUuid(l?.id) && r.active !== false && r.archived !== true && l.accessible !== false) return l.id.toLowerCase();
  }
  return null;
}

export function pickSwiftnessAccount(list: SwiftnessAccount[] | null | undefined): string | null {
  const active = (list ?? []).filter((a) => isUuid(a?.id) && isActiveStatus(a.status));
  const chosen = active.find((a) => a.defaultAccount === true) ?? active[0];
  return chosen ? chosen.id.toLowerCase() : null;
}

/** the urlId of a personal link ".../app/p/<urlId>"; null when the shape is not that */
export function parseUrlId(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" || !u.pathname.startsWith("/app/p/")) return null;
  const last = u.pathname.split("/").filter(Boolean).pop() ?? "";
  return URL_ID.test(last) ? last : null;
}

export function createSurenseEngine(d: SurenseEngineDeps): PoaEngine {
  const now = d.now ?? Date.now;
  const newSid = d.newSid ?? (() => crypto.randomUUID());
  let licensee: { id: string; at: number } | null = null;

  async function licenseeId(): Promise<string> {
    if (licensee && now() - licensee.at < LICENSEE_TTL_MS) return licensee.id;
    const id = pickLicensee(await d.api.licensees.list());
    if (!id) throw new PoaToolError("unavailable", "no_licensee");
    licensee = { id, at: now() };
    return id;
  }

  async function resolveExisting(nationalId: string): Promise<string> {
    // TODO(owner-full-run): the search field name for the id number ("idNumber") is taken from the Customer schema
    const page = await d.api.customers.search({ filters: [{ field: "idNumber", operator: "equals", value: nationalId }], startRow: 0, endRow: 2 });
    const id = page?.results?.[0]?.id;
    if (!isUuid(id)) throw new PoaToolError("unavailable", "customer_conflict");
    return id.toLowerCase();
  }

  async function ensureCustomer(who: PoaIdentity): Promise<{ id: string; existing: boolean }> {
    if (!d.managerId) throw new PoaToolError("unavailable", "manager_id_missing");
    const req = {
      managerId: d.managerId,
      idType: ID_TYPE_NATIONAL,
      idNumber: nationalIdForTool(who.nationalId),
      firstName: who.firstName,
      lastName: who.lastName,
      phoneNumber1: cellForTool(who.phone),
      ...(who.email ? { email1: who.email } : {}),
      // address as the tool's customer record keeps it (CreateCustomerRequest: street, streetNumber, city)
      ...splitStreet(who.street),
      city: who.city,
    };
    const created = async (r: typeof req & { forceCreation?: boolean }): Promise<string> => {
      const c: Customer = await d.api.customers.create(r);
      if (!isUuid(c?.id)) throw new PoaToolError("generic", "bad_customer_response");
      return c.id.toLowerCase();
    };
    const dup = (e: unknown, code: string) => e instanceof SurenseError && !e.ambiguous && e.kind === "permanent" && e.code === code;
    try {
      return { id: await created(req), existing: false };
    } catch (e) {
      if (dup(e, "40204")) {
        // same phone or e-mail as another customer (a family member, say): a new customer is still the right record
        try {
          return { id: await created({ ...req, forceCreation: true }), existing: false };
        } catch (e2) {
          if (!dup(e2, "40205")) throw e2;
          return { id: await resolveExisting(who.nationalId), existing: true };
        }
      }
      if (dup(e, "40205")) return { id: await resolveExisting(who.nationalId), existing: true };
      throw e;
    }
  }

  return {
    name: "surense",

    async start(who, modules) {
      if (!modules.maslaka && !modules.harbit && !modules.policies) throw new PoaToolError("generic", "no_modules");
      const customer = await ensureCustomer(who);
      const licId = await licenseeId();
      let accountId: string | null = null;
      if (modules.maslaka) {
        accountId = pickSwiftnessAccount(await d.api.swiftness.accountsList());
        if (!accountId) throw new PoaToolError("unavailable", "no_swiftness_account");
      }
      const invite = await d.api.proxies.invite({
        customerId: customer.id,
        licenseeId: licId,
        cellNumber: cellForTool(who.phone),
        ...(who.email ? { email: who.email } : {}),
        // TODO(owner-full-run): whether nispahBet is accepted without a policies list is unverified
        ...(modules.maslaka ? { nispahAlef: true, swiftnessAccountId: accountId as string } : {}),
        ...(modules.harbit ? { nispahHei: true } : {}),
        ...(modules.policies ? { nispahBet: true } : {}),
      });
      // only `url` is used; `message` and the partner fields are dropped on the floor, nothing goes to the client
      const urlId = parseUrlId(invite?.url);
      if (!urlId) throw new PoaToolError("generic", "bad_invite_url");

      const wanted = newSid();
      const loaded = await d.dp.post("load", { sid: wanted, urlId, firstName: who.firstName, lastName: who.lastName }, customer.id);
      const sid = typeof loaded.sid === "string" && SID.test(loaded.sid) ? loaded.sid : wanted;
      await d.dp.post("start", {
        sid,
        firstName: who.firstName,
        lastName: who.lastName,
        idType: 1,
        idNumber: nationalIdForTool(who.nationalId),
        email: who.email,
        cellNumber: cellForTool(who.phone),
        employerName: null,
        notes: null,
        termsPrivacyApproved: true,
        marketingApproved: who.marketingApproved,
      }, customer.id);
      d.log.info("poa engine started", { engine: "surense", existing: customer.existing, modules: Object.keys(modules).filter((k) => modules[k as PoaKind]).length });
      return { customerId: customer.id, urlId, sid, existing: customer.existing, modules: { ...modules } as ModuleFlags };
    },

    async consent(ref: EngineRef, kind: PoaKind, data: ConsentData): Promise<FinalUrls> {
      const bad = () => new PoaToolError("generic", "bad_consent_data");
      if (kind === "maslaka") {
        await d.dp.post("swiftness", { sid: ref.sid }, ref.customerId); // verified 2026-11-22: {sid} only
      } else if (kind === "harbit") {
        if (!data.birthDate || !data.issueDate) throw bad();
        await d.dp.post("hb", { sid: ref.sid, birthDate: dateForTool(data.birthDate), nationalIdCardIssuingDate: dateForTool(data.issueDate) }, ref.customerId);
      } else {
        if (!data.signaturePng) throw bad();
        let signature: string;
        try {
          signature = signatureForTool(data.signaturePng);
        } catch {
          throw bad();
        }
        return finalUrlsOf(await d.dp.post("policies", { sid: ref.sid, signature }, ref.customerId));
      }
      return {};
    },

    preview(ref, kind) {
      return d.dp.preview(ref.sid, FLAGS[kind], ref.customerId);
    },
  };
}
