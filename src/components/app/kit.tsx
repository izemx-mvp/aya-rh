import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { motion, animate, useInView } from "framer-motion";
import { ChevronRight, Sparkles, TrendingDown, TrendingUp, Pickaxe, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { settings, setSetting, useStore } from "@/lib/store";
import { initials } from "@/data/mock";

export const EASE = [0.22, 1, 0.36, 1] as const;

const TONE: Record<string, string> = {
  success: "text-success bg-success/12 border-success/25", warning: "text-warning bg-warning/12 border-warning/25",
  danger: "text-danger bg-danger/12 border-danger/25", info: "text-info bg-info/12 border-info/25",
  neutral: "text-neutral bg-neutral/12 border-neutral/25", gold: "text-gold bg-gold/12 border-gold/30",
};
const DOT: Record<string, string> = { success: "bg-success", warning: "bg-warning", danger: "bg-danger", info: "bg-info", neutral: "bg-neutral", gold: "bg-gold" };

export function toneOf(label: string): string {
  const l = label.toLowerCase();
  if (/(refus|expir|retard|inapte|manquant|erreur|no-show|non retenu|annul|licenci|haute|hors délai)/.test(l)) return "danger";
  if (/(attente|valider|validation|à réviser|bientôt|≤ 30|≤ 60|réserve|en cours|à revoir|planifi|brouillon|préavis|moyenne|restriction|à planifier)/.test(l)) return "warning";
  if (/(recrut|révisée|valide|actif|en ligne|approuv|réalisé|terminé|apte|à jour|reçu|fortement|ok|publiée|envoyée|résolue|confirm|clôtur|prêt)/.test(l)) return "success";
  if (/(nouvelle|présélection|entretien|offre|intégration|info|recommandé|congé|≤ 90)/.test(l)) return "info";
  if (/(vivier)/.test(l)) return "gold";
  return "neutral";
}

export function StatusBadge({ label, tone, className }: { label: string; tone?: string; className?: string }) {
  const t = tone ?? toneOf(label);
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium", TONE[t], className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", DOT[t])} aria-hidden />
      {label}
    </span>
  );
}

export function Avatar({ name, size = 32, className }: { name: string; size?: number; className?: string }) {
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 4;
  const bg = ["bg-gold/20 text-gold", "bg-slate/25 text-slate", "bg-silver/20 text-silver", "bg-info/20 text-info"][hue];
  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold ring-1 ring-border", bg, className)} style={{ width: size, height: size, fontSize: size * 0.36 }} aria-hidden>
      {initials(name)}
    </span>
  );
}

export function ScoreRing({ value, size = 36, stroke = 4, animateIn = true, label }: { value: number; size?: number; stroke?: number; animateIn?: boolean; label?: string }) {
  const r = (size - stroke) / 2; const c = 2 * Math.PI * r;
  const color = value >= 80 ? "var(--success)" : value >= 68 ? "var(--gold)" : value >= 52 ? "var(--warning)" : "var(--danger)";
  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size }} role="img" aria-label={label ?? `Score ${value} sur 100`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: animateIn ? c : c * (1 - value / 100) }} animate={{ strokeDashoffset: c * (1 - value / 100) }} transition={{ duration: 1.1, ease: EASE }} />
      </svg>
      <span className="absolute tnum font-semibold" style={{ fontSize: size * 0.32 }}>{value}</span>
    </span>
  );
}

export function CountUp({ value, decimals = 0, suffix = "" }: { value: number; decimals?: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView || !ref.current) return;
    const ctl = animate(0, value, { duration: 1.2, ease: EASE, onUpdate: (v) => { if (ref.current) ref.current.textContent = v.toLocaleString("fr-FR", { maximumFractionDigits: decimals, minimumFractionDigits: decimals }) + suffix; } });
    return () => ctl.stop();
  }, [inView, value, decimals, suffix]);
  return <span ref={ref} className="tnum">0{suffix}</span>;
}

export function Glass({ children, className, tilt, onClick, ...rest }: { children: ReactNode; className?: string; tilt?: boolean; onClick?: () => void } & React.HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect(); const x = e.clientX - r.left; const y = e.clientY - r.top;
    el.style.setProperty("--mx", `${x}px`); el.style.setProperty("--my", `${y}px`);
    if (tilt && !settings.reducedMotion) el.style.transform = `perspective(900px) rotateX(${((y / r.height) - 0.5) * -5}deg) rotateY(${((x / r.width) - 0.5) * 5}deg)`;
  };
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={() => { if (ref.current) ref.current.style.transform = ""; }} onClick={onClick}
      className={cn("glass spotlight glow-hover rounded-2xl", onClick && "cursor-pointer", className)} {...rest}>
      <div className="relative z-[1] h-full">{children}</div>
    </div>
  );
}

export function KpiCard({ label, value, suffix, decimals, trend, to, search, sub, ring }: { label: string; value: number; suffix?: string; decimals?: number; trend?: number; to?: string; search?: Record<string, string>; sub?: string; ring?: number }) {
  const body = (
    <Glass tilt className="h-full p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        {ring !== undefined && <ScoreRing value={ring} size={38} label={`${ring} %`} />}
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight"><CountUp value={value} suffix={suffix} decimals={decimals} /></p>
      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        {trend !== undefined && (
          <span className={cn("inline-flex items-center gap-0.5 font-medium", trend >= 0 ? "text-success" : "text-danger")}>
            {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}{Math.abs(trend)} %
          </span>
        )}
        {sub}
      </div>
    </Glass>
  );
  return to ? <Link to={to as any} search={search as any} className="block rounded-2xl" aria-label={label}>{body}</Link> : body;
}

export function PageHeader({ title, subtitle, crumbs, actions }: { title: string; subtitle?: string; crumbs?: { label: string; to?: string }[]; actions?: ReactNode }) {
  useStore();
  return (
    <div className="mb-6">
      <nav aria-label="Fil d'Ariane" className="mb-2 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        <Link to="/dashboard" className="hover:text-foreground">Accueil</Link>
        {(crumbs ?? [{ label: title }]).map((c, i) => (
          <span key={i} className="flex items-center gap-1"><ChevronRight className="h-3 w-3" />{c.to ? <Link to={c.to as any} className="hover:text-foreground">{c.label}</Link> : <span className="text-foreground">{c.label}</span>}</span>
        ))}
      </nav>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          {settings.site !== "Tous" && (
            <button onClick={() => setSetting("site", "Tous")} className="mt-2 inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 text-xs text-gold">
              Site : {settings.site} <X className="h-3 w-3" />
            </button>
          )}
        </motion.div>
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      </div>
    </div>
  );
}

export function AiBadge({ className }: { className?: string }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full bg-gold-gradient px-2 py-0.5 text-[10px] font-bold text-primary-foreground animate-pulse-ring", className)}><Sparkles className="h-3 w-3" />IA</span>;
}
export function AiDisclaimer() {
  return <p className="flex items-start gap-2 rounded-lg border border-gold/25 bg-gold/5 px-3 py-2 text-xs text-muted-foreground"><Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />L'analyse IA est une aide à la décision. La décision finale appartient aux RH.</p>;
}

export function Typing({ text, speed = 12, className }: { text: string; speed?: number; className?: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    if (settings.reducedMotion) { setN(text.length); return; }
    const id = setInterval(() => setN((v) => { if (v >= text.length) { clearInterval(id); return v; } return v + 3; }), speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return <span className={cn("whitespace-pre-wrap", className)}>{text.slice(0, n)}{n < text.length && <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-gold align-middle" />}</span>;
}

export function EmptyState({ title = "Aucun résultat", message = "Aucune donnée ne correspond à vos critères.", action }: { title?: string; message?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
      <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <svg viewBox="0 0 80 80" className="absolute inset-0" aria-hidden><path d="M8 58 L28 34 L40 46 L54 26 L72 58 Z" fill="none" stroke="var(--silver)" strokeOpacity=".4" /><path d="M20 66 Q40 56 60 66" stroke="var(--gold)" strokeOpacity=".6" fill="none" /></svg>
        <Pickaxe className="h-7 w-7 text-gold" />
      </div>
      <p className="font-semibold">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      {action}
    </div>
  );
}

export function Section({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <Glass className={cn("p-5", className)}>
      <div className="mb-4 flex items-center justify-between gap-2"><h2 className="font-semibold">{title}</h2>{action}</div>
      {children}
    </Glass>
  );
}

export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  return <motion.div className={className} initial="h" animate="s" variants={{ s: { transition: { staggerChildren: 0.05 } } }}>{children}</motion.div>;
}
export const staggerItem = { h: { opacity: 0, y: 12 }, s: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } } };

export function confetti() {
  if (typeof document === "undefined" || settings.reducedMotion) return;
  const c = document.createElement("canvas"); c.width = innerWidth; c.height = innerHeight;
  Object.assign(c.style, { position: "fixed", inset: "0", pointerEvents: "none", zIndex: "9999" });
  document.body.appendChild(c); const ctx = c.getContext("2d")!;
  const cs = getComputedStyle(document.documentElement);
  const cols = [cs.getPropertyValue("--gold"), cs.getPropertyValue("--silver"), cs.getPropertyValue("--slate")];
  const ps = Array.from({ length: 160 }, () => ({ x: innerWidth / 2, y: innerHeight * 0.4, vx: (Math.random() - 0.5) * 16, vy: -Math.random() * 14 - 4, r: Math.random() * 6 + 3, c: cols[Math.floor(Math.random() * 3)], a: Math.random() * 6 }));
  let t = 0;
  const step = () => {
    ctx.clearRect(0, 0, c.width, c.height);
    ps.forEach((p) => { p.vy += 0.35; p.x += p.vx; p.y += p.vy; p.a += 0.2; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); ctx.restore(); });
    if (++t < 140) requestAnimationFrame(step); else c.remove();
  };
  step();
}

export function Bar({ value, max = 100, tone = "gold" }: { value: number; max?: number; tone?: string }) {
  const bg = { gold: "bg-gold", success: "bg-success", warning: "bg-warning", danger: "bg-danger", slate: "bg-slate", info: "bg-info" }[tone] ?? "bg-gold";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={value} aria-valuemax={max}>
      <motion.div className={cn("h-full rounded-full", bg)} initial={{ width: 0 }} animate={{ width: `${Math.min(100, (value / max) * 100)}%` }} transition={{ duration: 0.9, ease: EASE }} />
    </div>
  );
}
