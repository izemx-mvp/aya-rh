import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { ModulePage, meta } from "@/components/app/Module";
import { DataTable, DetailGrid, useUrlState } from "@/components/app/DataTable";
import { StatusBadge, Glass, Typing, AiDisclaimer } from "@/components/app/kit";
import { ScheduleDialog } from "@/components/cand/CandModals";
import { interviews, fmtDate, RECRUITERS, candidates } from "@/data/mock";
import { useStore, emit, undoToast } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/entretiens")({ head: () => meta("Entretiens", "Calendrier, planification et comptes rendus d'entretiens."), component: Page });
type I = (typeof interviews)[number];

function Page() {
  useStore();
  const { get, set } = useUrlState("e.");
  const view = get("mode") ?? "calendar";
  const [sched, setSched] = useState(false);
  const missing = interviews.filter((i) => i.status === "Réalisé" && !i.report);
  const days = Array.from({ length: 14 }, (_, i) => new Date(Date.now() + (i - 3) * 864e5));
  return (
    <ModulePage title="Entretiens" subtitle={`${interviews.length} entretiens · ${missing.length} sans compte rendu`}
      actions={[{ label: "Planifier un entretien", primary: true, run: () => setSched(true) }, { label: view === "calendar" ? "Vue liste" : "Vue calendrier", run: () => set({ mode: view === "calendar" ? "list" : undefined }) }]}>
      {missing.length > 0 && <Glass className="flex flex-wrap items-center gap-3 p-4"><Bell className="h-5 w-5 text-warning" /><p className="flex-1 text-sm">{missing.length} compte(s) rendu(s) manquant(s) : {missing.map((m) => m.cand).join(", ")}</p><Button size="sm" onClick={() => toast.success(`${missing.length} relance(s) envoyée(s) aux intervenants`)}>Relancer en un clic</Button></Glass>}
      {view === "calendar" ? (
        <Glass className="overflow-x-auto p-4"><div className="grid min-w-[900px] grid-cols-7 gap-2">{days.map((d) => { const its = interviews.filter((i) => new Date(i.date).toDateString() === d.toDateString()); const today = d.toDateString() === new Date().toDateString(); return (
          <div key={d.toISOString()} className={cn("min-h-28 rounded-xl border p-2", today ? "border-gold" : "border-border")}><p className={cn("text-xs capitalize", today ? "font-bold text-gold" : "text-muted-foreground")}>{d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}</p>{its.map((i) => <div key={i.id} className="mt-1 rounded-md bg-slate/20 px-1.5 py-1 text-[11px]"><b>{i.hour}</b> {i.cand}<br /><span className="text-muted-foreground">{i.type}</span></div>)}</div>); })}</div></Glass>
      ) : null}
      <DataTable id="e" rows={interviews} drawer={(i) => <Detail i={i} />} drawerTitle={(i) => `${i.type} · ${i.cand}`}
        filters={[{ key: "recruiter", label: "Recruteur", options: RECRUITERS }, { key: "site", label: "Site", options: ["Zgounder", "Boumadine", "Marrakech", "Siège"] }, { key: "type", label: "Type", options: ["RH", "Technique", "Collectif", "Final"] }, { key: "status", label: "Statut", options: ["À planifier", "Planifié", "Confirmé", "Réalisé", "Annulé", "No-show"] }, { key: "noreport", label: "Sans compte rendu", type: "bool", predicate: (r) => r.status === "Réalisé" && !r.report }]}
        columns={[{ key: "id", header: "Réf." }, { key: "cand", header: "Candidat", render: (r) => <Link to="/candidatures/$id" params={{ id: r.candId }} className="hover:text-gold" onClick={(e) => e.stopPropagation()}>{r.cand}</Link> }, { key: "position", header: "Poste" }, { key: "site", header: "Site" }, { key: "type", header: "Type" }, { key: "date", header: "Date", render: (r) => `${fmtDate(r.date)} ${r.hour}` }, { key: "mode", header: "Mode" }, { key: "recruiter", header: "Recruteur" }, { key: "status", header: "Statut", render: (r) => <StatusBadge label={r.status} /> }, { key: "report", header: "Compte rendu", render: (r) => <StatusBadge label={r.report ? "Reçu" : r.status === "Réalisé" ? "Manquant" : "—"} tone={r.report ? "success" : r.status === "Réalisé" ? "danger" : "neutral"} /> }]} />
      <ScheduleDialog ids={[candidates.find((c) => c.status === "Présélectionnée")!.id]} open={sched} onOpenChange={setSched} />
    </ModulePage>
  );
}

function Detail({ i }: { i: I }) {
  const [sc, setSc] = useState({ "Compétences techniques": 3, Communication: 3, "Culture sécurité": 4, Motivation: 3 });
  const [sum, setSum] = useState("");
  const [dec, setDec] = useState("");
  return (
    <div className="space-y-4">
      <DetailGrid items={[["Poste", i.position], ["Date", `${fmtDate(i.date)} ${i.hour}`], ["Mode", i.mode], ["Statut", <StatusBadge label={i.status} />]]} />
      <div className="space-y-3"><p className="text-sm font-semibold">Grille d'évaluation</p>{Object.entries(sc).map(([k, v]) => <div key={k}><div className="flex justify-between text-sm"><span>{k}</span><b>{v}/5</b></div><Slider value={[v]} min={1} max={5} step={1} onValueChange={([x]) => setSc({ ...sc, [k]: x })} /></div>)}<p className="text-sm">Note globale : <b className="text-gold">{(Object.values(sc).reduce((a, b) => a + b, 0) / 4).toFixed(1)} / 5</b></p></div>
      <div><div className="mb-1 flex items-center justify-between"><p className="text-sm font-semibold">Compte rendu</p><Button size="sm" variant="outline" className="h-7" onClick={() => setSum(`Entretien ${i.type.toLowerCase()} avec ${i.cand} : profil solide techniquement, bonne culture sécurité. Points à approfondir : management en rotation. Recommandation : second entretien avec le manager.`)}><Sparkles className="mr-1 h-3 w-3 text-gold" />Générer le résumé IA</Button></div>{sum ? <div className="rounded-lg bg-muted/40 p-3 text-sm"><Typing text={sum} /></div> : <Textarea placeholder="Notes de l'entretien…" />}</div>
      <div className="flex gap-2">{["Go", "No go", "À revoir"].map((d) => <Button key={d} size="sm" variant={dec === d ? "default" : "outline"} onClick={() => { setDec(d); i.report = true; emit(); toast.success(`Décision : ${d}${d === "Go" ? " — étape suivante suggérée : envoyer une offre" : ""}`); }}>{d}</Button>)}</div>
      <div className="flex flex-wrap gap-2 border-t border-border pt-3"><Button size="sm" variant="outline" onClick={() => toast.success("Nouveau créneau proposé au candidat")}>Reprogrammer</Button><Button size="sm" variant="outline" onClick={() => { const p = i.status; i.status = "Annulé"; emit(); undoToast("Entretien annulé — notification envoyée", () => (i.status = p)); }}>Annuler</Button><Button size="sm" variant="outline" onClick={() => { i.status = "No-show"; emit(); toast("Marqué no-show"); }}>Marquer no-show</Button><Button size="sm" variant="ghost" onClick={() => toast("Aperçu du rappel : « Rappel : entretien demain à " + i.hour + " »")}>Aperçu du rappel</Button></div>
      <AiDisclaimer />
    </div>
  );
}
