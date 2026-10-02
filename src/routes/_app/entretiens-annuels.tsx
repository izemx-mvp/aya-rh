import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ModulePage, meta } from "@/components/app/Module";
import { DataTable } from "@/components/app/DataTable";
import { StatusBadge, Section, Bar, Avatar, Typing, AiDisclaimer, confetti } from "@/components/app/kit";
import { employees, DEPTS, KPI, type Employee } from "@/data/mock";
import { useStore, emit } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/entretiens-annuels")({ head: () => meta("Entretiens annuels", "Campagne 2026, évaluations et calibration 9-box."), component: Page });
const BOX = ["Talent à confirmer", "Futur leader", "Haut potentiel", "À accompagner", "Contributeur clé", "Performer", "Insuffisant", "Expert stable", "Pilier"];

function Page() {
  useStore();
  const [ev, setEv] = useState<Employee | null>(null);
  const [drag, setDrag] = useState<string | null>(null);
  const late = employees.filter((e) => e.review === "Non démarré").slice(0, 8);
  const cal = employees.filter((e) => e.review === "Terminé").slice(0, 45);
  return (
    <ModulePage title="Entretiens annuels" subtitle="Cycle 2026"
      kpis={[{ label: "Terminés", value: KPI.reviews.done, ring: Math.round((412 / 600) * 100) }, { label: "En cours", value: KPI.reviews.ongoing }, { label: "Non démarrés", value: KPI.reviews.notStarted }, { label: "Taux de complétion", value: 68.7, decimals: 1, suffix: " %" }]}
      actions={[{ label: "Lancer une campagne", primary: true, steps: [[{ name: "p", label: "Période", required: true, def: "Janvier – Mars 2027" }], [{ name: "pop", label: "Population", type: "select", options: ["Tous les collaborateurs", "Cadres", "Zgounder", "Siège"], required: true }], [{ name: "f", label: "Formulaire modèle", type: "select", options: ["Standard 2026", "Cadres", "Opérateurs"], required: true }], [{ name: "e1", label: "Fin auto-évaluation", type: "date" }, { name: "e2", label: "Fin entretiens", type: "date" }]], confirm: "Lancer la campagne", success: "Campagne lancée — invitations envoyées", celebrate: true }]}
      tabs={[
        { label: "Campagne", content: <div className="grid gap-4 lg:grid-cols-2">
          <Section title="Avancement par département">{DEPTS.map((d) => { const es = employees.filter((e) => e.dept === d); const p = Math.round((es.filter((e) => e.review === "Terminé").length / es.length) * 100); return <div key={d} className="mb-2"><div className="flex justify-between text-sm"><span>{d}</span><b className="tnum">{p} %</b></div><Bar value={p} tone={p === 100 ? "success" : "gold"} /></div>; })}</Section>
          <Section title="En retard" action={<Button size="sm" onClick={() => toast.success(`${KPI.reviews.notStarted} relances envoyées`)}>Relancer tous</Button>}>{late.map((e) => <div key={e.id} className="flex items-center gap-3 border-b border-border py-2 text-sm"><Avatar name={e.name} size={28} /><span className="flex-1">{e.name}<span className="block text-xs text-muted-foreground">Manager : {e.manager}</span></span><Button size="sm" variant="outline" onClick={() => toast.success(`Relance envoyée à ${e.manager}`)}>Relancer</Button></div>)}</Section>
        </div> },
        { label: "Évaluations", content: <DataTable id="rev" rows={employees} defaultPageSize={25} onRowClick={setEv} filters={[{ key: "review", label: "Statut", options: ["Terminé", "En cours", "Non démarré"] }, { key: "dept", label: "Département", options: DEPTS }, { key: "site", label: "Site", options: ["Zgounder", "Boumadine", "Marrakech", "Siège"] }]} columns={[{ key: "name", header: "Collaborateur" }, { key: "job", header: "Poste" }, { key: "dept", header: "Département" }, { key: "manager", header: "Manager" }, { key: "review", header: "Statut", render: (r) => <StatusBadge label={r.review} /> }]} /> },
        { label: "Calibration 9-box", content: <Section title="Performance × Potentiel"><div className="grid grid-cols-3 gap-2">{BOX.map((b, i) => { const pot = 3 - Math.floor(i / 3); const perf = (i % 3) + 1; const list = cal.filter((e) => e.potential === pot && e.perf === perf); return <div key={b} onDragOver={(e) => e.preventDefault()} onDrop={() => { const e = employees.find((x) => x.id === drag); if (e) { e.potential = pot; e.perf = perf; emit(); toast.success(`${e.name} → ${b}`); } }} className={cn("min-h-32 rounded-xl border border-border p-2", i === 2 && "bg-gold/10", i === 6 && "bg-danger/5")}><p className="mb-1 text-xs font-semibold">{b} <span className="text-muted-foreground">({list.length})</span></p><div className="flex flex-wrap gap-1">{list.map((e) => <span key={e.id} draggable onDragStart={() => setDrag(e.id)} title={e.name} className="cursor-grab"><Avatar name={e.name} size={26} /></span>)}</div></div>; })}</div><p className="mt-2 text-xs text-muted-foreground">↑ Potentiel · Performance →  · Glissez un collaborateur pour le recalibrer.</p></Section> },
      ]}>
      <EvalSheet e={ev} onClose={() => setEv(null)} />
    </ModulePage>
  );
}

function EvalSheet({ e, onClose }: { e: Employee | null; onClose: () => void }) {
  const [obj, setObj] = useState([{ t: "Réduire le taux d'accidents de 15 %", p: 70, w: 40 }, { t: "Atteindre 95 % de disponibilité des équipements", p: 85, w: 35 }, { t: "Former 2 collaborateurs juniors", p: 50, w: 25 }]);
  const [fb, setFb] = useState("Il ne communique pas assez avec l'équipe.");
  const [ai, setAi] = useState("");
  const [locked, setLocked] = useState(false);
  return (
    <Sheet open={!!e} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">{e && <>
        <SheetHeader><SheetTitle>Entretien annuel 2026 — {e.name}</SheetTitle><SheetDescription>Auto-évaluation → Manager → Entretien → Validation RH</SheetDescription></SheetHeader>
        <div className="mt-3 flex gap-1">{["Auto-évaluation", "Manager", "Entretien", "Validation RH"].map((s, i) => <span key={s} className={cn("flex-1 rounded-full py-1 text-center text-[10px]", i < (e.review === "Terminé" ? 4 : e.review === "En cours" ? 2 : 0) ? "bg-gold/20 text-gold" : "bg-muted")}>{s}</span>)}</div>
        <fieldset disabled={locked} className="mt-5 space-y-5">
          <div><div className="mb-2 flex items-center justify-between"><p className="font-semibold">Objectifs SMART</p><Button size="sm" variant="outline" className="h-7" type="button" onClick={() => setObj([...obj, { t: `Appliquer les standards de la fiche ${e.job}`, p: 0, w: 10 }])}><Sparkles className="mr-1 h-3 w-3 text-gold" />Suggérer depuis la fiche de poste</Button></div>{obj.map((o, i) => <div key={i} className="mb-3"><div className="flex justify-between text-sm"><span>{o.t}</span><span className="text-xs text-muted-foreground">poids {o.w} % · {o.p} %</span></div><Slider value={[o.p]} onValueChange={([v]) => setObj(obj.map((x, j) => j === i ? { ...x, p: v } : x))} /></div>)}</div>
          <div><p className="mb-2 font-semibold">Compétences</p>{["Sécurité", "Expertise technique", "Travail en équipe", "Initiative"].map((c) => <div key={c} className="mb-1 flex items-center justify-between text-sm"><span>{c}</span><div className="flex gap-1">{[1, 2, 3, 4, 5].map((n) => <button type="button" key={n} className="h-6 w-6 rounded border border-border text-xs hover:bg-gold/20" title={["Insuffisant", "À développer", "Maîtrisé", "Avancé", "Expert"][n - 1]}>{n}</button>)}</div></div>)}</div>
          <div><div className="mb-1 flex items-center justify-between"><p className="font-semibold">Axes d'amélioration</p><Button type="button" size="sm" variant="outline" className="h-7" onClick={() => setAi("Développer la communication avec l'équipe, par exemple en animant un point hebdomadaire de 10 minutes pour partager les priorités.")}><Sparkles className="mr-1 h-3 w-3 text-gold" />Reformuler de façon constructive</Button></div><Textarea value={fb} onChange={(x) => setFb(x.target.value)} />{ai && <div className="mt-2 rounded-lg bg-gold/5 p-2 text-sm"><Typing text={ai} /><Button type="button" size="sm" className="mt-1 h-7" onClick={() => { setFb(ai); setAi(""); }}>Accepter</Button></div>}</div>
          <p className="rounded-lg bg-warning/10 p-2 text-xs text-warning">Incohérence détectée : note « Travail en équipe » élevée mais commentaire critique sur la communication.</p>
          <div><p className="mb-1 font-semibold">Souhaits d'évolution & plan de développement</p><Textarea placeholder="Mobilité, formations souhaitées…" /></div>
          <AiDisclaimer />
        </fieldset>
        <div className="mt-4 flex gap-2">{locked ? <p className="flex items-center gap-1 text-sm text-success"><Lock className="h-4 w-4" />Validé et signé — verrouillé</p> : <><Button variant="outline" onClick={() => toast.success("Brouillon enregistré")}>Enregistrer le brouillon</Button><Button onClick={() => { if (!confirm("Soumettre et signer ? L'évaluation sera verrouillée.")) return; e.review = "Terminé"; emit(); setLocked(true); toast.success("Évaluation validée et signée électroniquement"); if (employees.every((x) => x.review === "Terminé")) confetti(); }}>Soumettre et signer</Button></>}</div>
      </>}</SheetContent>
    </Sheet>
  );
}
