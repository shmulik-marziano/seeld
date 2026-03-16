import React from 'react';
import { SlideLayout, type SlideData } from './SlideEngine';
import type { Customer, Product, Recommendation } from '@/types';
import { SeeIDLogo } from '@/components/brand/SeeIDLogo';
import { useSlideTheme, type SlideTheme, DEFAULT_THEME } from './SlideTheme';

// ─── Gray constants (not themed) ───────────────────────────────────
const GRAY_50 = '#f9fafb';
const GRAY_100 = '#f3f4f6';
const GRAY_200 = '#e5e7eb';
const GRAY_500 = '#6b7280';
const GRAY_700 = '#374151';
const GRAY_900 = '#111827';
const RED_500 = '#ef4444';
const YELLOW_500 = '#f59e0b';
const GREEN_500 = '#22c55e';

// ─── Themed shared components ──────────────────────────────────────
function SlideHeader({ title, subtitle, pageNum }: { title: string; subtitle?: string; pageNum?: number }) {
  const t = useSlideTheme();
  return (
    <div className="flex items-center justify-between mb-10 pb-6" style={{ borderBottom: `3px solid ${t.primaryColor}` }}>
      <div className="flex items-center gap-6">
        {t.showLogo && (
          <div className="p-2 rounded-2xl" style={{ background: t.primaryColorLight }}>
            {t.logoUrl ? (
              <img src={t.logoUrl} alt="logo" className="w-12 h-12 object-contain rounded-xl" />
            ) : (
              <SeeIDLogo size={48} />
            )}
          </div>
        )}
        <div>
          <h1 className="text-[52px] font-extrabold leading-tight" style={{ color: GRAY_900 }}>{title}</h1>
          {subtitle && <p className="text-[24px] mt-1" style={{ color: GRAY_500 }}>{subtitle}</p>}
        </div>
      </div>
      {pageNum != null && (
        <span className="text-[20px] font-bold px-5 py-2 rounded-full" style={{ background: GRAY_100, color: GRAY_500 }}>
          {pageNum}
        </span>
      )}
    </div>
  );
}

function SlideFooter({ agencyName, date }: { agencyName?: string; date?: string }) {
  const t = useSlideTheme();
  const displayName = t.footerText || agencyName || t.agencyName || 'SEELD';
  return (
    <div className="mt-auto pt-6 flex items-center justify-between text-[18px]" style={{ borderTop: `1px solid ${GRAY_200}`, color: GRAY_500 }}>
      <span>{displayName}</span>
      <span>{date || new Date().toLocaleDateString('he-IL')}</span>
    </div>
  );
}

function RiskBadge({ level }: { level?: string }) {
  if (!level) return null;
  const color = level === 'גבוה' ? RED_500 : level === 'בינוני' ? YELLOW_500 : GREEN_500;
  return (
    <span className="inline-flex items-center gap-1 text-[20px] font-bold px-4 py-1 rounded-full" style={{ background: `${color}15`, color }}>
      <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
      {level}
    </span>
  );
}

// ─── Title Slide ───────────────────────────────────────────────────
export function buildTitleSlide(opts: {
  title: string;
  subtitle?: string;
  customerName?: string;
  date?: string;
  agencyName?: string;
}): SlideData {
  return {
    id: 'title',
    render: () => <TitleSlideContent {...opts} />,
  };
}

function TitleSlideContent(opts: { title: string; subtitle?: string; customerName?: string; date?: string; agencyName?: string }) {
  const t = useSlideTheme();
  const displayTitle = t.titleOverride || opts.title;
  const displaySubtitle = t.subtitleOverride || opts.subtitle;
  return (
    <SlideLayout className="justify-center items-center text-center" background="bg-white">
      {t.showLogo && (
        <div className="p-3 rounded-3xl mb-8" style={{ background: t.primaryColorLight }}>
          {t.logoUrl ? (
            <img src={t.logoUrl} alt="logo" className="w-20 h-20 object-contain rounded-2xl" />
          ) : (
            <SeeIDLogo size={80} />
          )}
        </div>
      )}
      <h1 className="text-[72px] font-extrabold leading-tight" style={{ color: GRAY_900 }}>{displayTitle}</h1>
      {displaySubtitle && <p className="text-[32px] mt-4" style={{ color: GRAY_500 }}>{displaySubtitle}</p>}
      {opts.customerName && (
        <p className="text-[36px] font-semibold mt-8" style={{ color: t.primaryColor }}>{opts.customerName}</p>
      )}
      <div className="mt-12 flex items-center gap-6 text-[22px]" style={{ color: GRAY_500 }}>
        {(t.agencyName || opts.agencyName) && <span>{t.agencyName || opts.agencyName}</span>}
        {(t.agencyName || opts.agencyName) && <span>·</span>}
        <span>{opts.date || new Date().toLocaleDateString('he-IL')}</span>
      </div>
    </SlideLayout>
  );
}

// ─── Products Overview Slide ───────────────────────────────────────
export function buildProductsSlide(products: Product[], customer: Customer, pageNum: number): SlideData {
  return {
    id: `products-${pageNum}`,
    render: () => <ProductsSlideContent products={products} customer={customer} pageNum={pageNum} />,
  };
}

function ProductsSlideContent({ products, customer, pageNum }: { products: Product[]; customer: Customer; pageNum: number }) {
  const t = useSlideTheme();
  return (
    <SlideLayout background="bg-white">
      <SlideHeader title="סקירת מוצרים קיימים" subtitle={customer.fullName} pageNum={pageNum} />
      <div className="grid grid-cols-2 gap-6 flex-1">
        {products.slice(0, 6).map(p => {
          const trackDisplay = p.investmentTrack === 'אחר' ? p.investmentTrackCustom : (p.investmentTrack || p.track);
          const amount = p.category === 'ביטוח' ? p.monthlyPremium : p.monthlyDeposit;
          const amountLabel = p.category === 'ביטוח' ? 'פרמיה חודשית' : 'הפקדה חודשית';
          return (
            <div key={p.id} className="rounded-2xl p-6" style={{ background: GRAY_50, border: `1px solid ${GRAY_200}` }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[24px] font-bold" style={{ color: GRAY_900 }}>{p.company || '—'}</span>
                <span className="text-[18px] px-3 py-1 rounded-full font-medium"
                  style={{ background: p.category === 'ביטוח' ? '#dbeafe' : t.primaryColorLight, color: p.category === 'ביטוח' ? '#1d4ed8' : t.primaryColor }}>
                  {p.productType || p.category}
                </span>
              </div>
              <div className="space-y-2 text-[20px]" style={{ color: GRAY_700 }}>
                {p.policyNumber && <p>פוליסה: <b>{p.policyNumber}</b></p>}
                {amount != null && <p>{amountLabel}: <b style={{ color: t.primaryColor }}>₪{amount.toLocaleString()}</b></p>}
                {p.accumulation != null && p.accumulation > 0 && <p>צבירה: <b>₪{p.accumulation.toLocaleString()}</b></p>}
                {trackDisplay && <p>מסלול: <b>{trackDisplay}</b></p>}
                {p.preferredRiskLevel && <div className="flex items-center gap-2">סיכון: <RiskBadge level={p.preferredRiskLevel} /></div>}
              </div>
            </div>
          );
        })}
      </div>
      <SlideFooter />
    </SlideLayout>
  );
}

// ─── Single Recommendation Slide ───────────────────────────────────
export function buildRecommendationSlide(
  rec: Recommendation & { product?: Product; customer?: Customer; costBefore?: number; costAfter?: number },
  pageNum: number,
): SlideData {
  return {
    id: `rec-${rec.id}`,
    render: () => <RecSlideContent rec={rec} pageNum={pageNum} />,
  };
}

function RecSlideContent({ rec, pageNum }: { rec: Recommendation & { product?: Product; customer?: Customer; costBefore?: number; costAfter?: number }; pageNum: number }) {
  const t = useSlideTheme();
  const product = rec.product;
  return (
    <SlideLayout background="bg-white">
      <SlideHeader title={rec.title} subtitle={rec.customer?.fullName} pageNum={pageNum} />

      <div className="grid grid-cols-2 gap-10 flex-1">
        <div className="space-y-6">
          <div className="rounded-2xl p-6" style={{ background: GRAY_50, border: `1px solid ${GRAY_200}` }}>
            <h3 className="text-[22px] font-bold mb-3" style={{ color: t.primaryColor }}>המלצת סוכן</h3>
            <p className="text-[20px] leading-relaxed" style={{ color: GRAY_700 }}>{rec.rationale || '—'}</p>
          </div>
          {rec.currentState && (
            <div className="rounded-2xl p-6" style={{ background: GRAY_50, border: `1px solid ${GRAY_200}` }}>
              <h3 className="text-[22px] font-bold mb-3" style={{ color: t.accentColor }}>מצב קיים</h3>
              <p className="text-[20px] leading-relaxed" style={{ color: GRAY_700 }}>{rec.currentState}</p>
            </div>
          )}
          {rec.improvement && (
            <div className="rounded-2xl p-6" style={{ background: t.primaryColorLight, border: `1px solid ${t.primaryColor}30` }}>
              <h3 className="text-[22px] font-bold mb-3" style={{ color: t.primaryColor }}>שיפור מוצע</h3>
              <p className="text-[20px] leading-relaxed" style={{ color: GRAY_700 }}>{rec.improvement}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl p-6" style={{ background: GRAY_50, border: `1px solid ${GRAY_200}` }}>
            <h3 className="text-[22px] font-bold mb-4" style={{ color: GRAY_900 }}>פרטי ההמלצה</h3>
            <div className="space-y-3 text-[20px]" style={{ color: GRAY_700 }}>
              <div className="flex justify-between"><span>סוג פעולה:</span><b>{rec.actionType}</b></div>
              {rec.recommendedInvestmentTrack && (
                <div className="flex justify-between"><span>מסלול מומלץ:</span><b>{rec.recommendedInvestmentTrack === 'אחר' ? rec.recommendedInvestmentTrackCustom : rec.recommendedInvestmentTrack}</b></div>
              )}
              {rec.recommendedRiskLevel && (
                <div className="flex justify-between items-center"><span>סיכון מועדף:</span><RiskBadge level={rec.recommendedRiskLevel} /></div>
              )}
              {rec.costBefore != null && (
                <div className="flex justify-between"><span>עלות לפני:</span><b>₪{rec.costBefore}</b></div>
              )}
              {rec.costAfter != null && (
                <div className="flex justify-between"><span>עלות אחרי:</span><b style={{ color: t.primaryColor }}>₪{rec.costAfter}</b></div>
              )}
            </div>
          </div>

          {product && (
            <div className="rounded-2xl p-6" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <h3 className="text-[22px] font-bold mb-3" style={{ color: '#1d4ed8' }}>מוצר מקושר</h3>
              <div className="space-y-2 text-[20px]" style={{ color: GRAY_700 }}>
                <p><b>{product.company}</b> · {product.productType || product.category}</p>
                {product.policyNumber && <p>פוליסה: {product.policyNumber}</p>}
              </div>
            </div>
          )}

          {rec.basedOn && (
            <div className="rounded-xl p-4 text-[18px]" style={{ background: GRAY_100, color: GRAY_500 }}>
              <b>מבוסס על:</b> {rec.basedOn}
            </div>
          )}
        </div>
      </div>

      <SlideFooter />
    </SlideLayout>
  );
}

// ─── Execution Summary Slide ───────────────────────────────────────
interface ExecItem {
  id: string;
  title: string;
  status: string;
  executedAsRecommended: boolean;
  actualText?: string;
  notes?: string;
}

export function buildExecSummarySlide(items: ExecItem[], customer: Customer, pageNum: number): SlideData {
  return {
    id: `exec-${pageNum}`,
    render: () => <ExecSlideContent items={items} customer={customer} pageNum={pageNum} />,
  };
}

function ExecSlideContent({ items, customer, pageNum }: { items: ExecItem[]; customer: Customer; pageNum: number }) {
  const statusColor = (s: string) => {
    if (s === 'executed') return GREEN_500;
    if (s === 'partial') return YELLOW_500;
    return GRAY_500;
  };
  const statusLabel = (s: string) => {
    if (s === 'executed') return 'בוצע';
    if (s === 'partial') return 'חלקי';
    return 'פתוח';
  };

  return (
    <SlideLayout background="bg-white">
      <SlideHeader title="סיכום ביצועים" subtitle={customer.fullName} pageNum={pageNum} />
      <div className="flex-1 space-y-4">
        {items.slice(0, 8).map(item => (
          <div key={item.id} className="flex items-center gap-6 rounded-xl p-5" style={{ background: GRAY_50, border: `1px solid ${GRAY_200}` }}>
            <div className="w-3 h-3 rounded-full shrink-0" style={{ background: statusColor(item.status) }} />
            <div className="flex-1">
              <span className="text-[22px] font-semibold" style={{ color: GRAY_900 }}>{item.title}</span>
              {item.actualText && <p className="text-[18px] mt-1" style={{ color: GRAY_500 }}>{item.actualText}</p>}
            </div>
            <span className="text-[18px] font-bold px-4 py-1.5 rounded-full" style={{ background: `${statusColor(item.status)}15`, color: statusColor(item.status) }}>
              {statusLabel(item.status)}
            </span>
          </div>
        ))}
      </div>
      <SlideFooter />
    </SlideLayout>
  );
}

// ─── Summary Stats Slide ───────────────────────────────────────────
export function buildSummaryStatsSlide(opts: {
  totalProducts: number;
  totalRecommendations: number;
  executed: number;
  pending: number;
  customerName: string;
}): SlideData {
  return {
    id: 'summary-stats',
    render: () => <StatsSlideContent {...opts} />,
  };
}

function StatsSlideContent(opts: { totalProducts: number; totalRecommendations: number; executed: number; pending: number; customerName: string }) {
  const t = useSlideTheme();
  return (
    <SlideLayout className="justify-center" background="bg-white">
      <SlideHeader title="סיכום כללי" subtitle={opts.customerName} />
      <div className="grid grid-cols-4 gap-8 mt-8">
        {[
          { label: 'מוצרים קיימים', value: opts.totalProducts, color: '#3b82f6' },
          { label: 'המלצות', value: opts.totalRecommendations, color: t.accentColor },
          { label: 'בוצעו', value: opts.executed, color: GREEN_500 },
          { label: 'ממתינים', value: opts.pending, color: YELLOW_500 },
        ].map(stat => (
          <div key={stat.label} className="text-center rounded-3xl p-10" style={{ background: `${stat.color}08`, border: `2px solid ${stat.color}25` }}>
            <p className="text-[80px] font-extrabold leading-none" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-[24px] mt-4 font-medium" style={{ color: GRAY_700 }}>{stat.label}</p>
          </div>
        ))}
      </div>
      <SlideFooter />
    </SlideLayout>
  );
}

// ─── Thank You Slide ───────────────────────────────────────────────
export function buildThankYouSlide(agencyName?: string): SlideData {
  return {
    id: 'thank-you',
    render: () => <ThankYouSlideContent agencyName={agencyName} />,
  };
}

function ThankYouSlideContent({ agencyName }: { agencyName?: string }) {
  const t = useSlideTheme();
  return (
    <SlideLayout className="justify-center items-center text-center" background="bg-white">
      {t.showLogo && (
        <div className="p-3 rounded-3xl mb-8" style={{ background: t.primaryColorLight }}>
          {t.logoUrl ? (
            <img src={t.logoUrl} alt="logo" className="w-20 h-20 object-contain rounded-2xl" />
          ) : (
            <SeeIDLogo size={80} />
          )}
        </div>
      )}
      <h1 className="text-[72px] font-extrabold" style={{ color: GRAY_900 }}>תודה רבה!</h1>
      <p className="text-[32px] mt-6" style={{ color: GRAY_500 }}>
        {t.agencyName || agencyName || 'SEELD'} · ביטוח, חיסכון ופנסיה
      </p>
      <p className="text-[24px] mt-4" style={{ color: GRAY_500 }}>{new Date().toLocaleDateString('he-IL')}</p>
    </SlideLayout>
  );
}

// ─── Builder: Full recommendation presentation ─────────────────────
export function buildRecommendationPresentation(opts: {
  customer: Customer;
  products: Product[];
  recommendations: (Recommendation & { product?: Product; costBefore?: number; costAfter?: number }) | (Recommendation & { product?: Product; costBefore?: number; costAfter?: number })[];
  agencyName?: string;
}): SlideData[] {
  const recs = Array.isArray(opts.recommendations) ? opts.recommendations : [opts.recommendations];
  const slides: SlideData[] = [];
  let page = 1;

  slides.push(buildTitleSlide({
    title: 'סיכום המלצות',
    subtitle: 'סקירה מקצועית והמלצות מותאמות',
    customerName: opts.customer.fullName,
    agencyName: opts.agencyName,
  }));

  slides.push(buildSummaryStatsSlide({
    totalProducts: opts.products.length,
    totalRecommendations: recs.length,
    executed: recs.filter(r => r.decisionStatus === 'בוצע' || r.executionStatus === 'הושלם').length,
    pending: recs.filter(r => !['בוצע', 'לא מעוניין'].includes(r.decisionStatus)).length,
    customerName: opts.customer.fullName,
  }));
  page++;

  for (let i = 0; i < opts.products.length; i += 6) {
    slides.push(buildProductsSlide(opts.products.slice(i, i + 6), opts.customer, page++));
  }

  recs.forEach(rec => {
    slides.push(buildRecommendationSlide(
      { ...rec, customer: opts.customer, product: rec.product || opts.products.find(p => p.id === rec.linkedProductId) },
      page++,
    ));
  });

  slides.push(buildThankYouSlide(opts.agencyName));
  return slides;
}

// ─── Builder: Execution summary presentation ───────────────────────
export function buildExecutionPresentation(opts: {
  customer: Customer;
  items: ExecItem[];
  agencyName?: string;
}): SlideData[] {
  const slides: SlideData[] = [];
  let page = 1;

  slides.push(buildTitleSlide({
    title: 'סיכום ביצועים',
    subtitle: 'מעקב אחר יישום ההמלצות',
    customerName: opts.customer.fullName,
    agencyName: opts.agencyName,
  }));

  for (let i = 0; i < opts.items.length; i += 8) {
    slides.push(buildExecSummarySlide(opts.items.slice(i, i + 8), opts.customer, page++));
  }

  slides.push(buildThankYouSlide(opts.agencyName));
  return slides;
}

// ─── Builder: Bank-wide recommendations presentation ───────────────
export function buildBankPresentation(opts: {
  recommendations: (Recommendation & { product?: Product; customer?: Customer; costBefore?: number; costAfter?: number })[];
  customers: Customer[];
  products: Product[];
  agencyName?: string;
}): SlideData[] {
  const slides: SlideData[] = [];
  let page = 1;

  slides.push(buildTitleSlide({
    title: 'סקירת המלצות כללית',
    subtitle: `${opts.recommendations.length} המלצות · ${new Set(opts.recommendations.map(r => r.customerId)).size} לקוחות`,
    agencyName: opts.agencyName,
  }));

  const executed = opts.recommendations.filter(r => r.decisionStatus === 'בוצע').length;
  const pending = opts.recommendations.filter(r => !['בוצע', 'לא מעוניין'].includes(r.decisionStatus)).length;
  slides.push(buildSummaryStatsSlide({
    totalProducts: opts.products.length,
    totalRecommendations: opts.recommendations.length,
    executed,
    pending,
    customerName: 'כל הלקוחות',
  }));
  page++;

  const byCustomer = new Map<string, typeof opts.recommendations>();
  opts.recommendations.forEach(r => {
    const list = byCustomer.get(r.customerId) || [];
    list.push(r);
    byCustomer.set(r.customerId, list);
  });

  byCustomer.forEach((recs, custId) => {
    const customer = opts.customers.find(c => c.id === custId);
    if (!customer) return;
    recs.forEach(rec => {
      slides.push(buildRecommendationSlide(
        { ...rec, customer, product: rec.product || opts.products.find(p => p.id === rec.linkedProductId) },
        page++,
      ));
    });
  });

  slides.push(buildThankYouSlide(opts.agencyName));
  return slides;
}
