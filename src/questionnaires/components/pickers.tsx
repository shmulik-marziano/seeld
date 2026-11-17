// Reference-data pickers: city, street, bank, branch, health fund. All "must pick from the list" except the street (manual fallback, flagged).
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  branchesOfBank, findCityByName, HEALTH_FUNDS, isTypoMatch, loadBanks, loadBranches, loadCities, loadStreets, normalizeHe, officialStreetName, searchBanks, searchCities,
  searchStreets, shortBankName,
} from "../refdata";
import { bankCodeFromPick } from "../validators";
import type { Bank, BranchRow, City, StreetRow } from "../refdata";

interface Opt { id: string; label: string; sub?: string; hint?: string }
interface ComboProps {
  id: string;
  value: string;
  onType: (text: string) => void;
  onPick: (opt: Opt) => void;
  options: Opt[];
  placeholder?: string;
  describedBy?: string;
  invalid?: boolean;
  loading?: boolean;
  emptyText?: string;
  inputMode?: "text" | "numeric";
  dir?: "rtl" | "ltr";
  onBlur?: () => void;
}
/** Minimal accessible combobox (aria 1.2 pattern): arrows move, Enter picks, Escape closes, tap picks. Paste always works. */
export function Combo({ id, value, onType, onPick, options, placeholder, describedBy, invalid, loading, emptyText, inputMode, dir, onBlur }: ComboProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(() => setActive(0), [options.length, value]);
  const pick = (o: Opt) => { onPick(o); setOpen(false); };
  return (
    <div className="sd-q-combo" ref={wrap}
      onBlur={(e) => { if (!wrap.current?.contains(e.relatedTarget as Node)) { setOpen(false); onBlur?.(); } }}>
      <input
        id={id} className="sd-q-input" role="combobox" aria-expanded={open} aria-controls={listId} aria-autocomplete="list" autoComplete="off"
        aria-activedescendant={open && options[active] ? `${listId}-${active}` : undefined} aria-describedby={describedBy} aria-invalid={invalid || undefined}
        inputMode={inputMode} dir={dir} value={value} placeholder={placeholder}
        onChange={(e) => { onType(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, options.length - 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
          else if (e.key === "Enter" && open && options[active]) { e.preventDefault(); e.stopPropagation(); pick(options[active]); }
          else if (e.key === "Escape" && open) { e.stopPropagation(); setOpen(false); }
        }}
      />
      {open && (
        <ul className="sd-q-listbox" id={listId} role="listbox">
          {loading && <li className="sd-q-listbox-note" role="presentation">טוען רשימה…</li>}
          {!loading && options.length === 0 && <li className="sd-q-listbox-note" role="presentation">{emptyText ?? "לא נמצאו תוצאות"}</li>}
          {options.map((o, i) => (
            <li key={o.id} id={`${listId}-${i}`} role="option" aria-selected={i === active} className={i === active ? "is-active" : ""}
              onMouseDown={(e) => e.preventDefault()} onClick={() => pick(o)}>
              <span>{o.label}</span>
              {(o.sub || o.hint) && <small>{o.hint ? o.hint : o.sub}</small>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function useRef_<T>(loader: () => Promise<T>, initial: T) {
  const [data, setData] = useState<T>(initial);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  useEffect(() => {
    let alive = true;
    loader().then((d) => { if (alive) { setData(d); setState("ready"); } }).catch(() => alive && setState("error"));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { data, state };
}

interface PickerProps { id: string; value: string; onChange: (v: string) => void; onBlur?: () => void; describedBy?: string; invalid?: boolean }

export function CityPicker({ id, value, onChange, onBlur, describedBy, invalid }: PickerProps) {
  const { data: cities, state } = useRef_<City[]>(loadCities, []);
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  const results = useMemo(() => searchCities(cities, text, 8), [cities, text]);
  const exact = findCityByName(cities, text);
  const typo = !exact && results[0] && isTypoMatch(results[0]) ? results[0].item : null;
  return (
    <div>
      <Combo id={id} value={text} describedBy={describedBy} invalid={invalid} loading={state === "loading"} placeholder="מתחילים להקליד את שם היישוב"
        options={results.map((r) => ({ id: String(r.item.code), label: r.item.name, sub: r.item.region }))}
        emptyText={state === "error" ? "הרשימה לא נטענה, אפשר לנסות שוב בעוד רגע" : "לא מצאנו יישוב בשם הזה, כדאי לבדוק את האיות"}
        onType={(t) => { setText(t); if (value) onChange(""); }}
        onPick={(o) => { setText(o.label); onChange(o.label); }}
        onBlur={() => { if (exact && exact.name !== value) onChange(exact.name); onBlur?.(); }} />
      {typo && <p className="sd-q-assist">התכוונת ל<button type="button" className="sd-q-linkbtn" onClick={() => { setText(typo.name); onChange(typo.name); }}>{typo.name}</button>?</p>}
      {value && <p className="sd-q-assist is-ok">נבחר: {value}</p>}
      {!value && text && !typo && results.length === 0 && state === "ready" && <p className="sd-q-assist">צריך לבחור יישוב מהרשימה כדי שנוכל להמשיך</p>}
    </div>
  );
}

export function StreetPicker({ id, value, onChange, onBlur, describedBy, invalid, cityName }: PickerProps & { cityName: string }) {
  const { data: cities } = useRef_<City[]>(loadCities, []);
  const city = useMemo(() => findCityByName(cities, cityName), [cities, cityName]);
  const [streets, setStreets] = useState<StreetRow[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "none">("idle");
  useEffect(() => {
    if (!city) { setStreets([]); setState("idle"); return; }
    let alive = true;
    setState("loading");
    loadStreets(city.code).then((s) => alive && (setStreets(s), setState("ready"))).catch(() => alive && (setStreets([]), setState("none")));
    return () => { alive = false; };
  }, [city]);
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  const results = useMemo(() => searchStreets(streets, text, 8), [streets, text]);
  const official = useMemo(() => streets.find((s) => normalizeHe(s[1]) === normalizeHe(text)), [streets, text]);
  const aliasHit = results[0] && results[0].matched !== results[0].item[1] && results[0].exact ? results[0].item : null;
  const unverified = !!text && state !== "loading" && !official && !aliasHit;
  if (!cityName) return <p className="sd-q-assist">קודם בוחרים יישוב, ואז הרחוב.</p>;
  return (
    <div>
      <Combo id={id} value={text} describedBy={describedBy} invalid={invalid} loading={state === "loading"} placeholder="שם הרחוב"
        options={results.map((r) => ({ id: String(r.item[0]), label: officialStreetName(r.item), hint: r.matched !== r.item[1] ? `נקרא גם: ${r.matched}` : undefined }))}
        emptyText={state === "none" || (state === "ready" && streets.length === 0) ? "ליישוב הזה אין רשימת רחובות. אפשר להקליד ידנית" : "לא מצאנו רחוב כזה. אפשר להמשיך ולהקליד ידנית"}
        onType={(t) => { setText(t); onChange(t); }}
        onPick={(o) => { setText(o.label); onChange(o.label); }}
        onBlur={() => { const hit = official ?? aliasHit; if (hit && hit[1] !== value) { setText(hit[1]); onChange(hit[1]); } onBlur?.(); }} />
      {aliasHit && <p className="sd-q-assist">זה השם הישן של <b>{aliasHit[1]}</b>, נשתמש בשם הרשמי.</p>}
      {unverified && <p className="sd-q-assist"><span className="sd-q-chip is-warn">לא אומת</span> הרחוב לא ברשימה הרשמית. אפשר להמשיך, והצוות יבדוק.</p>}
      {official && <p className="sd-q-assist is-ok">הרחוב נמצא ברשימה הרשמית</p>}
    </div>
  );
}

export function BankPicker({ id, value, onChange, onBlur, describedBy, invalid }: PickerProps) {
  const { data: banks, state } = useRef_<Bank[]>(loadBanks, []);
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  const code = bankCodeFromPick(value);
  const results = useMemo(() => searchBanks(banks, value && text === value ? "" : text), [banks, text, value]);
  const pick = (b: Bank) => { const label = `${shortBankName(b.name)} (${b.code})`; setText(label); onChange(label); };
  return (
    <div>
      <Combo id={id} value={text} describedBy={describedBy} invalid={invalid} loading={state === "loading"} placeholder="שם הבנק, למשל הפועלים"
        options={results.map((r) => ({ id: String(r.item.code), label: shortBankName(r.item.name), sub: String(r.item.code) }))}
        emptyText="הבנק לא ברשימה. כדאי לבדוק את האיות"
        onType={(t) => { setText(t); if (value) onChange(""); }}
        onPick={(o) => { const b = banks.find((x) => String(x.code) === o.id); if (b) pick(b); }}
        onBlur={() => {
          if (!value && text.trim()) {
            const digits = text.replace(/\D/g, "");
            const hit = digits && !/[א-ת]/.test(text) ? banks.find((b) => String(b.code) === String(Number(digits))) : searchBanks(banks, text).find((r) => r.exact)?.item;
            if (hit) pick(hit);
          }
          onBlur?.();
        }} />
      {code && <p className="sd-q-assist is-ok">נבחר: {value.replace(/\s*\(\d+\)\s*$/, "")} <small dir="ltr">קוד בנק {code}</small></p>}
      {!value && text && results.length === 0 && state === "ready" && <p className="sd-q-assist">צריך לבחור בנק מהרשימה כדי שנוכל להמשיך</p>}
    </div>
  );
}

/** Branch NUMBER (3 digits). When it matches a branch of the chosen bank, name and city appear with a green confirmation; otherwise a soft warning. */
export function BranchNumberField({ id, value, onChange, onBlur, describedBy, invalid, bankCode }: PickerProps & { bankCode: string }) {
  const { data: all, state } = useRef_<BranchRow[]>(loadBranches, []);
  const rows = useMemo(() => (bankCode ? branchesOfBank(all, Number(bankCode)) : []), [all, bankCode]);
  const digits = value.replace(/\D/g, "");
  const known = digits ? rows.find((r) => String(r[1]) === String(Number(digits))) : undefined;
  const notFound = !!digits && digits.length >= 3 && !known && state === "ready" && rows.length > 0;
  return (
    <div>
      <input id={id} className="sd-q-input" type="text" inputMode="numeric" dir="ltr" style={{ textAlign: "right" }} autoComplete="off" placeholder="3 ספרות" aria-describedby={describedBy} aria-invalid={invalid || undefined}
        value={value} onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 3))} onBlur={onBlur} />
      {!bankCode && <p className="sd-q-assist">קודם בוחרים בנק, ואז הסניף.</p>}
      {known && <p className="sd-q-assist is-ok" role="status">✓ סניף {known[1]}: {known[2]}{known[3] && known[3] !== known[2] ? `, ${known[3]}` : ""}</p>}
      {notFound && <p className="sd-q-warn" role="status">לא מצאנו סניף כזה בבנק, כדאי לבדוק. סניפים נסגרים ומתמזגים, ואם המספר נכון אפשר להמשיך.</p>}
    </div>
  );
}

export function HealthFundPicker({ id, value, onChange, extra }: { id: string; value: string; onChange: (v: string) => void; extra: string[] }) {
  return (
    <div role="radiogroup" aria-labelledby={`${id}-label`} className="sd-q-choices sd-q-choices-2">
      {[...HEALTH_FUNDS, ...extra].map((f) => (
        <button key={f} type="button" role="radio" aria-checked={value === f} className={`sd-q-choice ${value === f ? "is-on" : ""}`} onClick={() => onChange(f)}>{f}</button>
      ))}
    </div>
  );
}
