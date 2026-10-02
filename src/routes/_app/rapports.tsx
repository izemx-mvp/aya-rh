import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bar as RBar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Sparkles, Star, Send, Download, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ModulePage, meta } from "@/components/app/Module";
import { DataTable } from "@/components/app/DataTable";
import { Glass, Section, Typing, AiDisclaimer, CountUp } from "@/components/app/kit";
import { employees, candidates, jobDescs, SITES, KPI, posById, departures } from "@/data/mock";
import { exportPdf } from "@/lib/pdf";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/rapports")({ head: () => meta("Rapports", "Centre de rapports RH et rapports personnalisés par IA."), component: Page });
const REPORTS = [["Effectif & structure", "Effectif"], ["Recrutement", "Recrutement"], ["Fiches de poste", "Organisation"], ["Formation & budget", "Développement"], ["Habilitations & conformité HSE", "HSE"], ["Absentéisme", "Temps"], ["Entretiens annuels", "Développement"], ["Turnover", "Effectif"], ["Masse salariale (indicative)", "Paie"], ["Diversité", "Effectif"]];
const tip = { contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 } };
type Hist = { id: string; q: string; date: string };

function Page() {
  const [open, setOpen] = useState<string | null>(null);
  const [fav, setFav] = useState<string[]>([]);
  const [cat, setCat] = useState("Toutes");
  const [drill, setDrill] = useState<{ title: string; rows: any[] } | null>(null);
  const [q, setQ] = useState(""); const [phase, setPhase] = useState<"idle" | "confirm" | "loading" | "done">("idle");
  const [refine, setRefine] = useState<string[]>([]); const [rf, setRf] = useState("");
  const [hist, setHist] = useState<Hist[]>(Array.from({ length: 14 }, (_, i) => ({ id: `RPT-${i + 1}`, q: ["Absentéisme par site ce trimestre", "Top 10 candidats Ingénieur Géologue", "Budget formation par département", "Départs par motif"][i % 4], date: new Date(Date.now() - i * 2 * 864e5).toLocaleDateString("fr-FR") })));
  const data = SITES.map((s) => ({ s, Effectif: employees.filter((e) => e.site === s).length, Candidats: candidates.filter((c) => c.site === s).length }));
  const top10 = refine.some((r) => r.includes("top 10"));
  const report = (name: string) => (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => setOpen(null)}><ArrowLeft className="mr-1 h-4 w-4" />Tous les rapports</Button>
      <div className="flex flex-wrap items-center gap-2"><h2 className="flex-1 text-xl font-bold">{name}</h2>{["Période : 12 mois", "Site : tous", "Département : tous"].map((f) => <span key={f} className="rounded-full border border-border px-2 py-0.5 text-xs">{f}</span>)}<Button size="sm" variant="outline" onClick={() => exportPdf(`Rapport ${name}`, [["Indicateurs", `Effectif ${KPI.effectif} · Candidatures ${KPI.applications} · Turnover ${KPI.turnover} · Absentéisme ${KPI.absenteeism}`], ["Résumé IA", "L'effectif est concentré à Zgounder (68 %). Le recrutement progresse avec 6 recrues pour 12 postes ouverts."]], undefined, { head: ["Site", "Effectif", "Candidats"], rows: data.map((d) => [d.s, d.Effectif, d.Candidats]) })}><Download className="mr-1 h-4 w-4" />PDF</Button><Button size="sm" variant="outline" onClick={() => toast.success("Excel généré (simulé)")}>Excel</Button><Button size="sm" variant="outline" onClick={() => toast.success("Envoi hebdomadaire programmé")}><Send className="mr-1 h-4 w-4" />Programmer</Button></div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{[["Effectif", KPI.effectif, employees], ["Candidatures", KPI.applications, candidates], ["Fiches révisées", KPI.fp.revised, jobDescs.filter((j) => j.status === "Révisée")], ["Départs 12 mois", KPI.departures, departures]].map(([k, v, rows]) => <Glass key={k as string} className="cursor-pointer p-4" onClick={() => setDrill({ title: k as string, rows: rows as any[] })}><p className="text-xs text-muted-foreground">{k as string}</p><p className="text-2xl font-bold"><CountUp value={v as number} /></p></Glass>)}</div>
      <Section title="Répartition par site"><div className="h-64" role="img" aria-label="Effectif et candidats par site"><ResponsiveContainer><BarChart data={data}><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="s" stroke="var(--muted-foreground)" fontSize={11} /><YAxis stroke="var(--muted-foreground)" fontSize={11} /><Tooltip {...tip} /><RBar dataKey="Effectif" fill="var(--gold)" radius={[4, 4, 0, 0]} onClick={(d: any) => setDrill({ title: `Effectif ${d.s}`, rows: employees.filter((e) => e.site === d.s) })} /><RBar dataKey="Candidats" fill="var(--slate)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></Section>
      <Section title="Résumé IA"><p className="text-sm"><Typing text={`L'effectif de ${KPI.effectif} collaborateurs est concentré à Zgounder (410). ${KPI.fp.revised} fiches sur 148 sont révisées. Le turnover de ${KPI.turnover} reste maîtrisé.`} /></p><AiDisclaimer /></Section>
      <DataTable id="rd" rows={employees} columns={[{ key: "name", header: "Collaborateur" }, { key: "site", header: "Site" }, { key: "dept", header: "Département" }, { key: "status", header: "Statut" }]} />
    </div>
  );
  if (open) return <div>{report(open)}{drill && <Drill d={drill} onClose={() => setDrill(null)} />}</div>;
  return (
    <ModulePage title="Rapports" subtitle="Rapports prêts à l'emploi et rapports personnalisés par IA"
      tabs={[
        { label: "Centre de rapports", content: <><div className="flex flex-wrap gap-1">{["Toutes", "Effectif", "Recrutement", "Organisation", "Développement", "HSE", "Temps", "Paie"].map((c) => <Button key={c} size="sm" variant={cat === c ? "secondary" : "ghost"} onClick={() => setCat(c)}>{c}</Button>)}</div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{REPORTS.filter(([, c]) => cat === "Toutes" || c === cat).map(([n, c]) => <Glass key={n} tilt className="cursor-pointer p-5" onClick={() => setOpen(n)}><div className="flex justify-between"><span className="text-xs text-muted-foreground">{c}</span><button onClick={(e) => { e.stopPropagation(); setFav(fav.includes(n) ? fav.filter((x) => x !== n) : [...fav, n]); }} aria-label="Favori"><Star className={fav.includes(n) ? "h-4 w-4 fill-gold text-gold" : "h-4 w-4"} /></button></div><p className="mt-3 font-semibold">{n}</p></Glass>)}</div></> },
        { label: "Rapport personnalisé (IA)", content: <Section title="Décrivez le rapport souhaité">
          <form onSubmit={(e) => { e.preventDefault(); if (q) setPhase("confirm"); }} className="flex gap-2"><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ex. Candidatures par site pour le poste Ingénieur Géologue ce trimestre" /><Button type="submit"><Sparkles className="mr-1 h-4 w-4" />Générer</Button></form>
          <div className="mt-2 flex flex-wrap gap-1.5">{["Candidatures par site ce trimestre", "Fiches à réviser par département", "Absentéisme du lundi à Zgounder"].map((x) => <button key={x} onClick={() => { setQ(x); setPhase("confirm"); }} className="rounded-full border border-gold/30 px-2.5 py-1 text-xs hover:bg-gold/10">{x}</button>)}</div>
          {phase === "confirm" && <div className="mt-4 rounded-lg bg-muted/40 p-3 text-sm">J'ai compris : <b>« {q} »</b> — période : 3 derniers mois, tous sites.<div className="mt-2 flex gap-2"><Button size="sm" onClick={() => { setPhase("loading"); setTimeout(() => { setPhase("done"); setHist([{ id: `RPT-${hist.length + 1}`, q, date: new Date().toLocaleDateString("fr-FR") }, ...hist]); }, 1400); }}>Valider</Button><Button size="sm" variant="ghost" onClick={() => setPhase("idle")}>Modifier</Button></div></div>}
          {phase === "loading" && <div className="mt-4 space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-6 rounded skeleton-shimmer" />)}</div>}
          {phase === "done" && <div className="mt-4 space-y-3"><h3 className="text-lg font-bold">{q}</h3><p className="text-xs text-muted-foreground">Période : 3 derniers mois{refine.length ? ` · ajustements : ${refine.join(" ; ")}` : ""}</p>
            <div className="h-56"><ResponsiveContainer><BarChart data={refine.some((r) => r.includes("trimestre")) ? data.map((d) => ({ ...d, Précédent: Math.round(d.Candidats * 0.8) })) : data}><XAxis dataKey="s" stroke="var(--muted-foreground)" fontSize={11} /><YAxis stroke="var(--muted-foreground)" fontSize={11} /><Tooltip {...tip} /><RBar dataKey="Candidats" fill="var(--gold)" radius={4} />{refine.some((r) => r.includes("trimestre")) && <RBar dataKey="Précédent" fill="var(--silver)" radius={4} />}</BarChart></ResponsiveContainer></div>
            <table className="w-full text-sm"><tbody>{[...candidates].sort((a, b) => b.score - a.score).slice(0, top10 ? 10 : 5).map((c) => <tr key={c.id} className="border-t border-border"><td className="py-1">{c.name}</td><td>{posById(c.positionId).title}</td><td>{c.site}</td><td className="tnum">{c.score}</td></tr>)}</tbody></table>
            <p className="text-sm"><b>Résumé IA :</b> <Typing text="Zgounder concentre la majorité des candidatures. Recommandation : renforcer la diffusion sur Rekrute pour Boumadine." /></p>
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (rf) { setRefine([...refine, rf.toLowerCase()]); setRf(""); } }}><Input value={rf} onChange={(e) => setRf(e.target.value)} placeholder="Affiner : « ajoute la comparaison avec le trimestre précédent », « montre seulement le top 10 »" /><Button type="submit">Affiner</Button></form>
            <Button variant="outline" size="sm" onClick={() => toast.success("Enregistré comme modèle")}>Enregistrer comme modèle</Button><AiDisclaimer /></div>}
        </Section> },
        { label: "Historique", content: <DataTable id="rh" rows={hist} rowActions={(r) => [{ label: "Rouvrir", onClick: () => { setQ(r.q); setPhase("done"); } }, { label: "Dupliquer", onClick: () => toast.success("Dupliqué") }, { label: "Régénérer", onClick: () => toast.success("Régénéré") }]} columns={[{ key: "id", header: "Réf." }, { key: "q", header: "Demande" }, { key: "date", header: "Date" }]} /> },
      ]}>
      {drill && <Drill d={drill} onClose={() => setDrill(null)} />}
    </ModulePage>
  );
}

function Drill({ d, onClose }: { d: { title: string; rows: any[] }; onClose: () => void }) {
  return <Sheet open onOpenChange={(o) => !o && onClose()}><SheetContent className="w-full overflow-y-auto sm:max-w-3xl"><SheetHeader><SheetTitle>{d.title}</SheetTitle><SheetDescription>{d.rows.length} lignes sous-jacentes</SheetDescription></SheetHeader><div className="mt-4"><DataTable id="drill" rows={d.rows} noSelect columns={Object.keys(d.rows[0] ?? {}).slice(0, 5).map((k) => ({ key: k, header: k, render: (r: any) => typeof r[k] === "object" ? "…" : String(r[k]) }))} /></div></SheetContent></Sheet>;
}
