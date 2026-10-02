import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ModulePage, meta } from "@/components/app/Module";
import { DataTable } from "@/components/app/DataTable";
import { StatusBadge, Glass, Avatar, ScoreRing, Typing, AiDisclaimer } from "@/components/app/kit";
import { candidates, positions, posById } from "@/data/mock";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/vivier")({ head: () => meta("Vivier de talents", "Profils qualifiés à recontacter."), component: Page });

function Page() {
  useStore();
  const nav = useNavigate();
  const [relance, setRelance] = useState(false);
  const pool = candidates.filter((c) => c.status === "Vivier" || (c.status === "Refusée" && c.score >= 60) || c.detail === "Refusée après entretien");
  return (
    <ModulePage title="Vivier de talents" subtitle={`${pool.length} profils qualifiés`} actions={[{ label: "Relancer le vivier", primary: true, run: () => setRelance(true) }, { label: "Enregistrer la recherche", run: () => toast.success("Recherche enregistrée") }]}>
      <DataTable id="v" rows={pool} onRowClick={(r) => nav({ to: "/candidatures/$id", params: { id: r.id } })} search={(r) => `${r.name} ${r.currentJob} ${posById(r.positionId).title}`}
        filters={[{ key: "site", label: "Site", options: ["Zgounder", "Boumadine", "Marrakech", "Siège"] }, { key: "consent", label: "Consentement valide", type: "bool", predicate: (r) => r.consent }]}
        cards={(r) => <Glass className="p-4"><div className="flex items-center gap-3"><Avatar name={r.name} size={40} /><div className="flex-1"><p className="font-semibold">{r.name}</p><p className="text-xs text-muted-foreground">{r.currentJob}</p></div><ScoreRing value={r.score} size={36} animateIn={false} /></div><div className="mt-3 flex flex-wrap gap-1"><span className="rounded-full bg-muted px-2 text-xs">{posById(r.positionId).dept}</span><span className="rounded-full bg-muted px-2 text-xs">{r.site}</span><span className="rounded-full bg-muted px-2 text-xs">{r.experience} ans</span></div><div className="mt-2 flex justify-between"><StatusBadge label={r.consent ? "Consentement OK" : "Consentement manquant"} /><span className="text-xs text-muted-foreground">Expire dans {r.retentionDays} j</span></div></Glass>}
        columns={[{ key: "name", header: "Profil", render: (r) => <span className="flex items-center gap-2"><Avatar name={r.name} size={26} />{r.name}</span> }, { key: "currentJob", header: "Poste actuel" }, { key: "site", header: "Site" }, { key: "experience", header: "Expérience", render: (r) => `${r.experience} ans` }, { key: "score", header: "Score", render: (r) => <ScoreRing value={r.score} size={30} animateIn={false} /> }, { key: "consent", header: "Consentement", render: (r) => <StatusBadge label={r.consent ? "Valide" : "Manquant"} /> }, { key: "retentionDays", header: "Rétention", render: (r) => <span className={r.retentionDays < 60 ? "text-warning" : ""}>Expire dans {r.retentionDays} j</span> }]} />
      <Relance open={relance} onOpenChange={setRelance} pool={pool} />
    </ModulePage>
  );
}

function Relance({ open, onOpenChange, pool }: { open: boolean; onOpenChange: (o: boolean) => void; pool: typeof candidates }) {
  const [pos, setPos] = useState(positions[0].id);
  const p = positions.find((x) => x.id === pos)!;
  const matches = pool.map((c) => ({ c, m: Math.min(97, c.score + (c.positionId === pos ? 12 : -5)) })).sort((a, b) => b.m - a.m).slice(0, 6);
  const [sel, setSel] = useState<string[]>([]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Relancer le vivier</DialogTitle><DialogDescription>L'IA rapproche les profils du poste choisi.</DialogDescription></DialogHeader>
        <select value={pos} onChange={(e) => setPos(e.target.value)} className="w-full rounded-md border border-input bg-background px-2 py-2 text-sm">{positions.map((x) => <option key={x.id} value={x.id}>{x.title} · {x.site}</option>)}</select>
        <ul className="space-y-1">{matches.map(({ c, m }) => <li key={c.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-accent/40"><Checkbox checked={sel.includes(c.id)} onCheckedChange={() => setSel((s) => s.includes(c.id) ? s.filter((x) => x !== c.id) : [...s, c.id])} disabled={!c.consent} /><span className="flex-1 text-sm">{c.name}{!c.consent && <span className="ml-2 text-xs text-danger">sans consentement</span>}</span><span className="font-semibold text-gold tnum">{m} %</span></li>)}</ul>
        <div className="rounded-lg bg-muted/40 p-3 text-xs"><Typing text={`Bonjour {{prénom}},\n\nVotre profil avait retenu notre attention. Un poste de ${p.title} vient d'ouvrir à ${p.site} et correspond à votre expérience. Seriez-vous disponible pour en discuter ?\n\nL'équipe RH AYA`} /></div>
        <AiDisclaimer />
        <DialogFooter><Button disabled={!sel.length} onClick={() => { onOpenChange(false); toast.success(`${sel.length} email(s) personnalisé(s) envoyé(s)`); setSel([]); }}>Envoyer ({sel.length})</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
