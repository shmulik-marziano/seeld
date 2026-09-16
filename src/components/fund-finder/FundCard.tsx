import { useState } from 'react';
import type { Fund } from '@/types/fund';
import { companyLabels, specializationLabels } from '@/types/fund';
import { BrandIcon } from '@/components/brand/BrandIcon';
import { BODY, GREEN, LINE, MUTED, RUST_TEXT, TINT_SAGE } from '@/lib/brand';

// One picked fund in the comparison (SEELD brand system 2026-09): white card,
// figures in LTR tabular spans, a value the dataset never published is named
// ("לא פורסם" / "אין נתון"), never shown as 0.

interface FundCardProps {
  fund: Fund;
  rank?: number;
  onRemove?: (id: string) => void;
  showMonthly?: boolean;
  showDeepDrill?: boolean;
}

const NONE = 'אין נתון';
const missing = (v: number | null | undefined) => v === null || v === undefined || Number.isNaN(v);
const pct = (v: number | null | undefined) => (missing(v) ? NONE : `${(v as number).toFixed(2)}%`);
const fixed = (v: number | null | undefined) => (missing(v) ? NONE : (v as number).toFixed(2));

// A fee the dataset never published is not a zero fee. Say so.
const fee = (v: number | null | undefined) => (missing(v) ? 'לא פורסם' : `${v}%`);

// Assets arrive in millions ILS; past a billion the millions read as noise.
const formatAssets = (millions: number) =>
  millions >= 1000
    ? `${(millions / 1000).toLocaleString('he-IL', { maximumFractionDigits: 1 })} מיליארד ₪`
    : `${millions.toLocaleString('he-IL')} מיליון ₪`;

const ReturnStat = ({ value, label }: { value: number | null; label: string }) => (
  <div className="rounded-[10px] px-3 py-2.5" style={{ backgroundColor: TINT_SAGE }}>
    <p className="text-[14px] mb-0.5" style={{ color: MUTED }}>{label}</p>
    {missing(value) ? (
      <p className="text-[15px]" style={{ color: MUTED }}>{NONE}</p>
    ) : (
      <p
        dir="ltr"
        className="text-[17px] font-bold tabular-nums text-right"
        style={{ color: (value as number) < 0 ? RUST_TEXT : GREEN }}
      >
        {(value as number) > 0 ? '+' : ''}
        {(value as number).toFixed(2)}%
      </p>
    )}
  </div>
);

const Row = ({ label, value, ltr = true }: { label: string; value: string; ltr?: boolean }) => (
  <div className="flex items-baseline justify-between gap-4 py-1.5 text-[15px]">
    <dt style={{ color: MUTED }}>{label}</dt>
    <dd className="font-bold tabular-nums whitespace-nowrap" dir={ltr ? 'ltr' : undefined} style={{ color: GREEN }}>
      {value}
    </dd>
  </div>
);

const Disclosure = ({
  id, label, open, onToggle, children,
}: { id: string; label: string; open: boolean; onToggle: () => void; children: React.ReactNode }) => (
  <div className="border-t" style={{ borderColor: LINE }}>
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls={id}
      className="flex w-full items-center justify-between gap-3 py-3 text-[15px] font-bold min-h-[44px]"
      style={{ color: GREEN }}
    >
      {label}
      <BrandIcon
        name="chevron-down"
        size={18}
        className="shrink-0 transition-transform duration-150"
        style={{ transform: open ? 'rotate(180deg)' : undefined }}
      />
    </button>
    {open && <div id={id} className="pb-3">{children}</div>}
  </div>
);

export default function FundCard({ fund, onRemove, showMonthly = false, showDeepDrill = false }: FundCardProps) {
  const [localShowMonthly, setLocalShowMonthly] = useState(showMonthly);
  const [localShowDeep, setLocalShowDeep] = useState(showDeepDrill);
  const dd = fund.deepDrill;

  return (
    <article className="dna-concept min-w-0 !p-5" aria-label={fund.name}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[16px] leading-snug" style={{ color: GREEN }}>{fund.name}</h3>
          <p className="mt-1 text-[14px] leading-[1.6]" style={{ color: MUTED }}>
            {companyLabels[fund.company]} · {specializationLabels[fund.specialization]} · קופה{' '}
            <span dir="ltr" className="tabular-nums whitespace-nowrap">{fund.fundNumber}</span>
          </p>
        </div>
        {onRemove && (
          <button
            type="button"
            onClick={() => onRemove(fund.id)}
            className="shrink-0 grid h-10 w-10 place-items-center rounded-[10px] transition-colors hover:bg-[#E8EDE5]"
            style={{ color: MUTED }}
          >
            <BrandIcon name="close" size={18} label="הסרה מההשוואה" />
          </button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <ReturnStat value={fund.returns.month} label="חודש אחרון" />
        <ReturnStat value={fund.returns.year1} label="מתחילת השנה" />
        <ReturnStat value={fund.returns.year3} label="ממוצע 3 שנים" />
        <ReturnStat value={fund.returns.year5} label="ממוצע 5 שנים" />
      </div>

      <dl className="mt-4 mb-2">
        <Row label="חשיפה למניות" value={missing(fund.stockExposure) ? NONE : `${fund.stockExposure}%`} />
        <Row label="דמי ניהול מהפקדה" value={fee(fund.fees.depositFeePercent)} />
        <Row label="דמי ניהול מצבירה" value={fee(fund.fees.savingsFeePercent)} />
        <Row
          label="נכסים בניהול"
          value={fund.totalAssets > 0 ? formatAssets(fund.totalAssets) : NONE}
          ltr={false}
        />
      </dl>

      <Disclosure
        id={`monthly-${fund.id}`}
        label="תשואות חודשיות"
        open={localShowMonthly}
        onToggle={() => setLocalShowMonthly((v) => !v)}
      >
        {fund.monthlyReturns.length === 0 ? (
          <p className="text-[14px]" style={{ color: MUTED }}>לא פורסמו תשואות חודשיות לקופה זו.</p>
        ) : (
          <ul className="space-y-1 text-[15px]">
            {fund.monthlyReturns.map((mr) => (
              <li key={mr.month} className="flex items-baseline justify-between gap-4">
                <span dir="ltr" className="tabular-nums" style={{ color: BODY }}>{mr.month}</span>
                <span
                  dir="ltr"
                  className="font-bold tabular-nums"
                  style={{ color: mr.value < 0 ? RUST_TEXT : GREEN }}
                >
                  {mr.value > 0 ? '+' : ''}
                  {mr.value.toFixed(2)}%
                </span>
              </li>
            ))}
          </ul>
        )}
      </Disclosure>

      <Disclosure
        id={`deep-${fund.id}`}
        label="חקירה לעומק"
        open={localShowDeep}
        onToggle={() => setLocalShowDeep((v) => !v)}
      >
        <dl>
          <Row label="הוצאות ישירות" value={pct(dd.directExpenses)} />
          <Row label="עלות שנתית צפויה" value={pct(dd.expectedAnnualCost)} />
          <Row label={'חשיפה לחו"ל'} value={pct(dd.foreignExposure)} />
          <Row label={'חשיפה למט"ח'} value={pct(dd.currencyExposure)} />
        </dl>
        <dl className="mt-2 border-t pt-2" style={{ borderColor: LINE }}>
          <Row label={'אג"ח מיועדות'} value={pct(dd.designatedBonds)} />
          <Row label={'אג"ח ממשלתי סחיר'} value={pct(dd.govBondsTradable)} />
          <Row label={'אג"ח קונצרני סחיר'} value={pct(dd.corpBondsTradable)} />
          <Row label={'אג"ח קונצרני לא סחיר'} value={pct(dd.corpBondsNonTradable)} />
          <Row label="מניות ואופציות" value={pct(dd.stocksAndOptions)} />
          <Row label="פיקדונות" value={pct(dd.deposits)} />
          <Row label="קרנות נאמנות" value={pct(dd.mutualFunds)} />
          <Row label={'מזומנים ושו"מ'} value={pct(dd.cashEquivalents)} />
          <Row label="נכסים אחרים" value={pct(dd.otherAssets)} />
        </dl>
        <dl className="mt-2 border-t pt-2" style={{ borderColor: LINE }}>
          <Row label="סטיית תקן 36 חודשים" value={fixed(dd.stdDev36)} />
          <Row label="סטיית תקן 60 חודשים" value={fixed(dd.stdDev60)} />
          <Row label="מדד שארפ" value={fixed(dd.sharpeRatio)} />
          {dd.actuarialSurplus !== null && (
            <Row label="עודף או גירעון אקטוארי" value={pct(dd.actuarialSurplus)} />
          )}
        </dl>
      </Disclosure>
    </article>
  );
}
