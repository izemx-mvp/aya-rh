import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModulePage, meta } from "@/components/app/Module";
import { DataTable } from "@/components/app/DataTable";
import { StatusBadge, Section, AiDisclaimer } from "@/components/app/kit";
import { employees, fmtMAD, SITES } from "@/data/mock";
import { audit } from "@/lib/store";
import { exportCsv } from "@/lib/pdf";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/paie")({ head: () => meta("Variables de paie", "Préparation, contrôle IA et export des variables de paie."), component: Page });
const STEPS = ["Ouverte", "En contrôle", "Validée", "Exportée"];
const rows = employees.map((e, i) => { const r = (n: number) => ((i * 9301 + n * 49297) % 233280) / 233280; const hs = Math.round(r(1) * (e.site === "Zgounder" ? 24 : 6)); const p = { poste: e.site === "Zgounder" ? 600 : 0, rend: Math.round(r(2) * 1500), rot: e.team.startsWith("Équipe") ? 900 : 0, zone: ["Zgounder", "Boumadine"].includes(e.site) ? 1200 : 0 }; const abs = r(3) < 0.05 ? 1 : 0; const av = r(4) < 0.06 ? 2000 : 0; return { id: e.id, name: e.name, site: e.site, hs, ...p, abs, av, ind: Math.round(r(5) * 400), total: hs * 95 + p.poste + p.rend + p.rot + p.zone - abs * 400 - av }; });

function Page() {
  const [step, setStep] = useState(0); const [period, setPeriod] = useState("Octobre 2026");
  const [anom, setAnom] = useState([{ id: 1, t: "Heures supplémentaires inhabituelles", d: `${rows.find((r) => r.hs > 20)?.name} : 23 h (moyenne équipe 8 h)`, s: "" }, { id: 2, t: "Absence non justifiée avec prime versée", d: `${rows.find((r) => r.abs)?.name} : prime de rendement maintenue`, s: "" }, { id: 3, t: "Avance supérieure au plafond", d: `${rows.find((r) => r.av)?.name} : 2 000 MAD (plafond 1 500)`, s: "" }]);
  const locked = step >= 2;
  return (
    <ModulePage title="Variables de paie" subtitle={`Période ${period}`}
      actions={[{ label: step < 3 ? `Passer à « ${STEPS[step + 1]} »` : "Rouvrir la période", primary: true, run: () => { if (step === 1 && anom.some((a) => !a.s)) return toast.error("Traitez toutes les anomalies avant validation"); if (step === 3) { const r = prompt("Motif de réouverture (obligatoire) :"); if (!r) return; audit("Réouverture période de paie", period, "Exportée", "Ouverte"); setStep(0); return; } if (step === 2) exportCsv(`variables_paie_${period}`, ["Matricule", "Nom", "HS", "Total variable"], rows.map((r) => [r.id, r.name, r.hs, r.total])); setStep(step + 1); toast.success(`Période : ${STEPS[step + 1]}`); } }, { label: "Exporter pour la paie (Excel)", run: () => toast.success("Fichier Excel généré (simulé)") }]}>
      <div className="flex flex-wrap items-center gap-3"><select value={period} onChange={(e) => setPeriod(e.target.value)} className="rounded-md border border-input bg-background px-2 py-1.5 text-sm">{["Octobre 2026", "Septembre 2026", "Août 2026"].map((p) => <option key={p}>{p}</option>)}</select>
        <ol className="flex flex-1 gap-1">{STEPS.map((s, i) => <li key={s} className={cn("flex-1 rounded-full py-1 text-center text-xs", i <= step ? "bg-gold/20 text-gold font-semibold" : "bg-muted text-muted-foreground")}>{s}</li>)}</ol>{locked && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Lock className="h-3 w-3" />Verrouillée</span>}</div>
      {step === 1 && <Section title="Contrôle IA — anomalies détectées">{anom.map((a) => <div key={a.id} className="mb-2 flex flex-wrap items-center gap-3 rounded-lg border border-border p-3"><Sparkles className="h-4 w-4 text-gold" /><div className="flex-1"><p className="text-sm font-medium">{a.t}</p><p className="text-xs text-muted-foreground">{a.d}</p></div>{a.s ? <StatusBadge label={a.s} /> : ["Accepter", "Corriger", "Ignorer"].map((x) => <Button key={x} size="sm" variant="outline" onClick={() => { const m = x === "Accepter" ? "ok" : prompt("Motif :"); if (m) setAnom(anom.map((y) => y.id === a.id ? { ...y, s: x === "Accepter" ? "Acceptée" : x === "Corriger" ? "Corrigée" : "Ignorée" } : y)); }}>{x}</Button>)}</div>)}<AiDisclaimer /><p className="mt-2 text-xs text-muted-foreground">Circuit : validation RH puis Direction.</p></Section>}
      <DataTable id="pay" rows={rows} defaultPageSize={25} filters={[{ key: "site", label: "Site", options: [...SITES] }]}
        rowActions={(r) => locked ? [{ label: "Période verrouillée", onClick: () => toast("Rouvrez la période pour modifier") }] : [{ label: "Modifier les heures sup.", onClick: () => { const v = prompt("Heures supplémentaires :", String(r.hs)); if (v) { audit("Modification variable de paie", r.id, String(r.hs), v); r.hs = +v; toast.success("Modification tracée"); } } }]}
        columns={[{ key: "name", header: "Collaborateur" }, { key: "site", header: "Site" }, { key: "hs", header: "Heures sup." }, { key: "poste", header: "Prime poste", render: (r) => fmtMAD(r.poste) }, { key: "rend", header: "Rendement", render: (r) => fmtMAD(r.rend) }, { key: "rot", header: "Rotation", render: (r) => fmtMAD(r.rot) }, { key: "zone", header: "Zone isolée", render: (r) => fmtMAD(r.zone) }, { key: "abs", header: "Abs. non payées" }, { key: "av", header: "Avances", render: (r) => fmtMAD(r.av) }, { key: "total", header: "Total variable", render: (r) => <b className="tnum">{fmtMAD(r.total)}</b> }]} />
    </ModulePage>
  );
}
