import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";
import { BrandIcon } from "@/components/brand/BrandIcon";
import { SdIcon, SdPic, tintStyle, useSdFont } from "./primitives";
import type { ArtName, Pastel } from "./topics";
import "./sd.css";
import "./sd-pub.css";
import "./client.css";

/** Shared pieces of the client area (personal area, portals, login, loading/empty/error states). */

export const LOGO_W = Math.round((44 * 118) / 51);

/** Kit wrapper for standalone client pages, tinted by one pastel. */
export function CaFrame({ tint, children, className = "" }: { tint: Pastel; children: ReactNode; className?: string }) {
  useSdFont();
  return (
    <div className={`sd sd-ca-screen ${className}`} dir="rtl" style={tintStyle(tint)}>
      {children}
    </div>
  );
}

/** Slim top bar with the logo and a way back to the site. */
export function CaTop({ back = true }: { back?: boolean }) {
  return (
    <div className="sd-ca-top">
      <Link to="/" aria-label="שילד ביטוח ופיננסים, לדף הבית">
        <img src="/brand/logo.png" alt="שילד ביטוח ופיננסים" width={LOGO_W} height={44} decoding="async" />
      </Link>
      {back && <Link to="/" className="sd-ca-back">חזרה לאתר</Link>}
    </div>
  );
}

/** Centered illustrated card on a pastel field: the frame of status, welcome and verify screens. */
export function CaScreen({ tint, art, wide, children }: { tint: Pastel; art: ArtName; wide?: boolean; children: ReactNode }) {
  return (
    <CaFrame tint={tint}>
      <CaTop />
      <main className="sd-ca-stagearea">
        <div className={`sd-ca-card ${wide ? "sd-ca-card-wide" : ""}`}>
          <div className="sd-ca-card-head" aria-hidden="true"><SdPic name={art} sizes="300px" priority /></div>
          <div className="sd-ca-card-body">{children}</div>
        </div>
      </main>
    </CaFrame>
  );
}

/** A calm end-of-road screen: invalid or expired link, archived, submitted and so on. */
export function CaStatus({ tint, art, icon, title, text, children, role }: {
  tint: Pastel; art: ArtName; icon?: string; title: string; text: string; children?: ReactNode; role?: "alert" | "status";
}) {
  return (
    <CaScreen tint={tint} art={art}>
      {icon && <span className="sd-ca-badge" aria-hidden="true"><SdIcon name={icon} size={28} /></span>}
      <h1>{title}</h1>
      <p role={role}>{text}</p>
      {children}
      <p className="sd-ca-fine">שאלה? <a href="tel:0523097444" dir="ltr">052-309-7444</a> או <a href="mailto:info@seeld.co.il" dir="ltr">info@seeld.co.il</a></p>
      <p className="sd-ca-fine" style={{ marginTop: 6 }}>
        <Link to="/terms">תנאי שימוש</Link> · <Link to="/privacy">מדיניות פרטיות</Link>
      </p>
    </CaScreen>
  );
}

/** Whole-page loading: illustration, a thin moving bar, a spoken label. */
export function CaLoadingPage({ label, tint = "sage", art = "01-hero" }: { label: string; tint?: Pastel; art?: ArtName }) {
  useSdFont();
  return (
    <div className="sd sd-ca-loadpage" dir="rtl" style={tintStyle(tint)} role="status" aria-busy="true" aria-live="polite">
      <div className="sd-ca-loadbox">
        <SdPic name={art} sizes="220px" priority />
        <span>{label}</span>
        <div className="sd-ca-loadbar" aria-hidden="true"><i /></div>
      </div>
    </div>
  );
}

/** Block loading inside a tab: three soft pastel placeholders. */
export function CaLoading({ label, tone = "sage" }: { label: string; tone?: Pastel }) {
  return (
    <div className={`sd-ca-skel sd-ca-tone-${tone}`} role="status" aria-busy="true" aria-live="polite">
      <i aria-hidden="true" /><i aria-hidden="true" /><i aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

/** Illustrated empty state with a human sentence and an optional action. */
export function CaEmpty({ art, tone = "sage", title, text, children, compact }: {
  art?: ArtName; tone?: Pastel; title: string; text?: string; children?: ReactNode; compact?: boolean;
}) {
  return (
    <div className={`sd-ca-empty sd-ca-tone-${tone} ${compact ? "is-compact" : ""}`}>
      {art && <div className="sd-ca-empty-art" aria-hidden="true"><SdPic name={art} sizes="220px" /></div>}
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {children && <div className="sd-ca-actions">{children}</div>}
    </div>
  );
}

/** Quiet error block: says what happened and offers a way on. */
export function CaError({ title = "משהו לא נטען", text, onRetry }: { title?: string; text: string; onRetry?: () => void }) {
  return (
    <div className="sd-ca-empty is-error" role="alert">
      <span className="sd-ca-badge" aria-hidden="true" style={{ background: "#fff" }}><SdIcon name="hourglass" size={28} /></span>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <p>{text}</p>
      {onRetry && <div className="sd-ca-actions"><button type="button" className="btn-secondary" onClick={onRetry}>לנסות שוב</button></div>}
    </div>
  );
}

/** Pastel-striped panel. */
export function CaPanel({ tone, children, className = "", style }: { tone?: Pastel; children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <section className={`sd-ca-panel ${tone ? `has-stripe sd-ca-tone-${tone}` : ""} ${className}`} style={style}>{children}</section>
  );
}

export const CaGo = () => <BrandIcon name="arrow-left" size={18} />;
