import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bar as RBar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { ModulePage, meta } from "@/components/app/Module";
import { DataTable } from "@/components/app/DataTable";
import { StatusBadge, Section, Avatar, AiDisclaimer } from "@/components/app/kit";
import { departures, employees, fmtDate, KPI, SITES } from "@/data/mock";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/turnover")({ head: () => meta("Turnover & rétention", "Analyse des départs, rétention et signaux à examiner."), component: Page });
const tip = { contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 } };

function Page() {
  const [rev, setRev] = useState<string[]>([]);
  const motifs = ["Démission", "Fin de contrat", "Rupture conventionnelle", "Licenciement", "Retraite"].map((m) => ({ m, n: departures.filter((d) => d.type === m).length }));
  const sites = SITES.map((s) => ({ m: s, n: departures.filter((d) => d.site === s).length }));
  const signals = employees.filter((e) => e.status === "Actif").slice(60, 68).map((e, i) => ({ e, f: [["Ancienneté < 2 ans", "Site isolé", "Aucune formation depuis 18 mois"], ["Évaluation en baisse", "Demande de mobilité refusée"], ["Absences en hausse", "Rotation de nuit prolongée"]][i % 3], a: ["Entretien de carrière", "Proposition de formation", "Revue de la rotation"][i % 3] }));
  return (
    <ModulePage title="Turnover & rétention" subtitle="12 derniers mois"
      kpis={[{ label: "Turnover", value: 7.4, decimals: 1, suffix: " %" }, { label: "Départs", value: KPI.departures }, { label: "Rétention 90 j", value: KPI.retention90, suffix: " %", ring: 88 }, { label: "Démissions", value: motifs[0].n }]}
      tabs={[
        { label: "Analyse", content: <div className="grid gap-4 lg:grid-cols-2">
          {[["Départs par motif", motifs], ["Départs par site", sites]].map(([t, d]) => <Section key={t as string} title={t as string}><div className="h-56" role="img" aria-label={t as string}><ResponsiveContainer><BarChart data={d as any[]}><XAxis dataKey="m" stroke="var(--muted-foreground)" fontSize={10} /><YAxis stroke="var(--muted-foreground)" fontSize={10} allowDecimals={false} /><Tooltip {...tip} /><RBar dataKey="n" name="Départs" fill="var(--slate)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></Section>)}
          <Section title="Entonnoir de rétention des recrues">{[["Recrutés", 100], ["Présents à 30 j", 96], ["Présents à 90 j", 88], ["Présents à 12 mois", 81]].map(([k, v]) => <div key={k as string} className="mb-2 flex items-center gap-3"><span className="w-32 text-xs">{k}</span><div className="h-6 rounded bg-gold-gradient" style={{ width: `${v}%` }} /><b className="tnum">{v} %</b></div>)}</Section>
          <Section title="Cohortes (rétention à 12 mois)"><table className="w-full text-sm"><thead><tr className="text-xs text-muted-foreground"><th className="text-left">Cohorte</th><th>3 m</th><th>6 m</th><th>12 m</th></tr></thead><tbody>{[["T1 2025", 95, 90, 82], ["T2 2025", 93, 88, 80], ["T3 2025", 96, 91, "—"], ["T4 2025", 94, "—", "—"]].map((r) => <tr key={r[0] as string} className="border-t border-border text-center"><td className="py-1 text-left">{r[0]}</td>{r.slice(1).map((v, i) => <td key={i} className="tnum">{v}{typeof v === "number" ? " %" : ""}</td>)}</tr>)}</tbody></table></Section>
        </div> },
        { label: "Signaux de départ", content: <Section title="Signaux de départ à examiner"><p className="mb-3 text-xs text-muted-foreground">Aide à la décision uniquement : aucune décision automatique n'est prise.</p>{signals.map(({ e, f, a }) => <div key={e.id} className="mb-2 flex flex-wrap items-center gap-3 rounded-lg border border-border p-3"><Avatar name={e.name} size={32} /><div className="flex-1"><p className="text-sm font-medium">{e.name} <span className="text-xs text-muted-foreground">· {e.job} · {e.site}</span></p><p className="text-xs text-muted-foreground">Facteurs : {f.join(" · ")}</p><p className="text-xs">Action recommandée : <b>{a}</b></p></div>{rev.includes(e.id) ? <StatusBadge label="Examiné" /> : <><Button size="sm" variant="outline" onClick={() => setRev([...rev, e.id])}>Marquer examiné</Button><Button size="sm" onClick={() => toast.success("Plan d'action créé")}>Créer un plan d'action</Button></>}</div>)}<AiDisclaimer /></Section> },
        { label: "Départs", content: <DataTable id="to" rows={departures} filters={[{ key: "type", label: "Motif", options: motifs.map((m) => m.m) }, { key: "site", label: "Site", options: [...SITES] }]} columns={[{ key: "emp", header: "Collaborateur" }, { key: "site", header: "Site" }, { key: "type", header: "Motif" }, { key: "seniority", header: "Ancienneté", render: (r) => `${r.seniority} ans` }, { key: "lastDay", header: "Dernier jour", render: (r) => fmtDate(r.lastDay) }]} /> },
        { label: "Méthode de calcul", content: <Section title="Formules"><div className="space-y-3 text-sm"><p><b>Turnover</b> = départs sur 12 mois ÷ effectif moyen × 100</p><p className="rounded-lg bg-muted/40 p-3 tnum">Exemple : {KPI.departures} ÷ 595 (effectif moyen) × 100 = <b>7,4 %</b></p><p><b>Rétention à 90 jours</b> = recrues présentes à J+90 ÷ recrues de la période × 100</p><p className="rounded-lg bg-muted/40 p-3 tnum">Exemple : 44 ÷ 50 × 100 = <b>88 %</b></p></div></Section> },
      ]} />
  );
}
