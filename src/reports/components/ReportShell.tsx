// ReportShell: composes the report for the three modes. Screen layout is mobile-first; @media print gives A4 with the header
// and footer repeated on every printed page (thead/tfoot of a layout table) and page numbers from @page margin boxes.
import type { Report, LockReason } from "../types";
import { Block } from "./LockedBlock";
import { ReportProvider } from "./context";
import { DonutsSection, SummaryDashboard } from "./charts";
import { CoverageAmounts, PersonCards, PolicyDetails, PremiumSummary } from "./insurance";
import { Cover, Footer, Found, HeaderStrip, Letter } from "./parts";
import { ProductDetail } from "./ProductDetail";
import { CapitalByType, DepositsMonthly, EmploymentTable, LoanTable, ProductsTable, Projection } from "./tables";
import "../report.css";

export function ReportShell({ report, onLockedClick }: { report: Report; onLockedClick: (blockId: string, reason: LockReason) => void }) {
  const savings = report.data.products.filter((p) => p.kind !== "insurance");
  const showSavings = report.mode !== "insurance";
  const showInsurance = report.mode !== "financial";
  return (
    <ReportProvider value={{ report, onLockedClick }}>
      <div className="rp" dir="rtl" data-mode={report.mode} data-tier={report.entitlements.tier}>
        <table className="rp-sheet" role="presentation">
          <thead><tr><td><HeaderStrip /></td></tr></thead>
          <tbody>
            <tr>
              <td>
                <div className="rp-body">
                  <Cover />
                  <div className="rp-pb"><Letter /></div>
                  <Found />

                  {showSavings && (
                    <>
                      <SummaryDashboard />
                      <DonutsSection />
                      <Block id="investment-mix"><div /></Block>
                      <CapitalByType />
                      <DepositsMonthly />
                      <Projection />
                      <LoanTable />
                      <div className="rp-pb"><ProductsTable /></div>
                      <EmploymentTable />
                      {savings.length > 0 && (
                        <section className="rp-section" aria-labelledby="rp-prod-h">
                          <h2 id="rp-prod-h" className="rp-h2">פירוט לפי מוצר</h2>
                          {savings.map((p, i) => <div key={p.id} className="rp-pb-soft"><ProductDetail product={p} showLocked={i === 0} /></div>)}
                        </section>
                      )}
                    </>
                  )}

                  {showInsurance && (
                    <section className="rp-section" aria-labelledby="rp-ins-h">
                      <h2 id="rp-ins-h" className="rp-h2 rp-pb">ביטוחים</h2>
                      <PremiumSummary />
                      <PersonCards />
                      <CoverageAmounts />
                      <PolicyDetails />
                    </section>
                  )}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <Footer />
      </div>
    </ReportProvider>
  );
}
