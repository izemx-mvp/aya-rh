import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, MessageCircle, Send, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ModulePage, meta } from "@/components/app/Module";
import { DataTable, DetailGrid, useUrlState } from "@/components/app/DataTable";
import { StatusBadge, Avatar, Glass } from "@/components/app/kit";
import { jobRequests, DP_STAGES, DEPTS, SITES, fmtDate, fmtMAD, employees } from "@/data/mock";
import { useStore, emit, undoToast } from "@/lib/store";
import { approveDemande, createAnnonce } from "@/lib/actions";
import { JobChain } from "@/components/app/Links";
import { jobDescs } from "@/data/mock";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/demandes-de-poste")({ head: () => meta("Demandes de poste", "Circuit d'approbation des demandes de poste."), component: Page });
type R = (typeof jobRequests)[number];

function Page() {
  useStore();
  const { get, set } = useUrlState("dp.");
  const view = get("mode") ?? "kanban";
  const [move, setMove] = useState<{ r: R; to: string } | null>(null);
  const [reason, setReason] = useState("");
  const [over, setOver] = useState<string | null>(null);
  const doMove = (r: R, to: string) => { const prev = r.status; r.status = to; emit(); undoToast(`${r.id} → ${to}`, () => (r.status = prev)); };
  const drop = (id: string, to: string) => { const r = jobRequests.find((x) => x.id === id)!; if (r.status === to) return; setReason(""); setMove({ r, to }); };
  const backward = move && DP_STAGES.indexOf(move.to) < DP_STAGES.indexOf(move.r.status);

  const drawer = (r: R) => (
    <>
      {jobRequests.filter((x) => x.title === r.title && x.id !== r.id).length > 0 && <p className="flex items-center gap-2 rounded-lg bg-warning/10 p-2 text-xs text-warning"><AlertTriangle className="h-4 w-4" />Doublon possible : une autre demande existe pour ce poste.</p>}
      {r.ficheId && <JobChain demandeId={r.id} current="Demande" />}
      {(() => { const f = jobDescs.find((j) => j.id === r.ficheId); return f ? <p className="text-xs"><span className="rounded-full bg-gold/15 px-2 py-0.5 text-gold">Basée sur {f.ref} {r.ficheVersion || f.version}</span>{f.status !== "Révisée" && <span className="ml-2 text-warning">Fiche non validée ({f.status})</span>}</p> : null; })()}
      <DetailGrid items={[["Intitulé", r.title], ["Département", r.dept], ["Site", r.site], ["Demandeur", r.requester], ["Motif", r.motif], ["Postes", `${r.filled ?? 0} pourvu(s) / ${r.count}`], ["Contrat", r.contract], ["Niveau", r.level], ["Budget annuel", fmtMAD(r.budget)], ["Date souhaitée", fmtDate(r.date)], ["Priorité", <StatusBadge label={r.priority} />], ["Statut", <StatusBadge label={r.status} />]]} />
      <div><p className="mb-2 text-sm font-semibold">Circuit d'approbation</p><ol className="space-y-3">{["Manager", "RH", "Direction"].map((s, i) => { const done = DP_STAGES.indexOf(r.status) > i + 1; return <li key={s} className="flex items-center gap-3"><Avatar name={employees[i * 7 + 3].name} size={28} /><div className="flex-1 text-sm"><p>{s} · {employees[i * 7 + 3].name}</p><p className="text-xs text-muted-foreground">{done ? `Approuvé le ${fmtDate(new Date(Date.now() - (3 - i) * 864e5))} — « OK, budget validé »` : "En attente"}</p></div><StatusBadge label={done ? "Approuvé" : "En attente"} /></li>; })}</ol></div>
      <div className="flex flex-wrap gap-2">{r.status === "Approuvée" && <Button size="sm" className="bg-gold-gradient text-primary-foreground" onClick={() => createAnnonce(r.id)}><Send className="mr-1 h-3 w-3" />Créer l'annonce</Button>}{DP_STAGES.indexOf(r.status) < 4 && <Button size="sm" onClick={() => approveDemande(r.id)}><Check className="mr-1 h-3 w-3" />Approuver</Button>}<Button size="sm" variant="destructive" onClick={() => { setReason(""); setMove({ r, to: "Brouillon" }); }}><X className="mr-1 h-3 w-3" />Refuser</Button><Button size="sm" variant="outline" onClick={() => toast.success("Demande de précisions envoyée")}><MessageCircle className="mr-1 h-3 w-3" />Demander des précisions</Button><Button size="sm" variant="outline" onClick={() => toast.success("Approbateur relancé")}><Send className="mr-1 h-3 w-3" />Relancer</Button></div>
    </>
  );

  return (
    <ModulePage title="Demandes de poste" subtitle={`${jobRequests.length} demandes · ${jobRequests.filter((r) => r.status.startsWith("À valider")).length} en attente d'approbation`}
      actions={[{ label: "Nouvelle demande", primary: true, success: "Demande envoyée au premier approbateur (manager)", confirm: "Soumettre", onSubmit: (v) => { const f = jobDescs.find((j) => j.ref === (v.fiche || "").split(" ")[0]); jobRequests.unshift({ ficheId: f?.id ?? "", ficheVersion: f?.version ?? "", filled: 0, replacesEmployeeId: "", departureId: "", id: `DP-2026-${String(jobRequests.length + 1).padStart(3, "0")}`, title: v.title, dept: v.dept, site: v.site, requester: "Mme Baroudi", motif: v.motif, count: +v.count || 1, contract: v.contract, level: "Technicien", budget: +v.budget || 150000, date: v.date || new Date().toISOString(), priority: "Moyenne", status: "À valider manager" }); emit(); },
        ai: "Résumé IA : création d'un poste justifiée par la hausse de production à Zgounder. Compétences suggérées : maintenance préventive, habilitation électrique B1, travail en hauteur, français/arabe, anglais technique.",
        steps: [[{ name: "fiche", label: "Partir d'une fiche existante (pré-remplit le poste)", type: "select", options: jobDescs.slice(0, 60).map((j) => `${j.ref} ${j.title} (${j.status})`) }, { name: "title", label: "Intitulé du poste", required: true }, { name: "dept", label: "Département", type: "select", options: DEPTS, required: true }, { name: "site", label: "Site", type: "select", options: [...SITES], required: true }], [{ name: "motif", label: "Motif", type: "select", options: ["Création", "Remplacement", "Renfort temporaire"], required: true }, { name: "departing", label: "Collaborateur remplacé (si remplacement)" }], [{ name: "skills", label: "Compétences clés (suggérées par l'IA)", type: "textarea", def: "Maintenance préventive, Habilitation électrique, Travail en hauteur, Anglais technique" }, { name: "contract", label: "Contrat", type: "select", options: ["CDI", "CDD", "Intérim", "Stage"], def: "CDI" }], [{ name: "budget", label: "Budget annuel (MAD)", type: "number", required: true }, { name: "date", label: "Date souhaitée", type: "date" }, { name: "count", label: "Nombre de postes", type: "number", def: "1" }]] },
        { label: view === "kanban" ? "Vue tableau" : "Vue Kanban", run: () => set({ mode: view === "kanban" ? "table" : undefined }) }]}>
      {view === "kanban" ? (
        <div className="flex gap-3 overflow-x-auto pb-4">{DP_STAGES.map((s) => { const items = jobRequests.filter((r) => r.status === s); return (
          <div key={s} onDragOver={(e) => { e.preventDefault(); setOver(s); }} onDragLeave={() => setOver(null)} onDrop={(e) => { setOver(null); drop(e.dataTransfer.getData("id"), s); }} className={cn("glass w-64 shrink-0 rounded-2xl", over === s && "shadow-[var(--shadow-glow)]")}>
            <div className="flex justify-between border-b border-border p-3"><StatusBadge label={s} /><b className="tnum">{items.length}</b></div>
            <div className="space-y-2 p-2">{items.map((r) => <motion.div layout key={r.id} draggable onDragStart={(e: any) => e.dataTransfer.setData("id", r.id)} className="cursor-grab rounded-xl border border-border bg-card/70 p-3 text-sm"><p className="font-mono text-[10px] text-muted-foreground">{r.id}</p><p className="font-medium">{r.title}</p><p className="text-xs text-muted-foreground">{r.site} · {r.motif}</p><div className="mt-2 flex justify-between"><StatusBadge label={r.priority} /><span className="text-xs">{r.count} poste(s)</span></div></motion.div>)}</div>
          </div>); })}</div>
      ) : (
        <DataTable id="dp" rows={jobRequests} drawer={drawer} drawerTitle={(r) => `${r.id} · ${r.title}`} filters={[{ key: "status", label: "Statut", options: DP_STAGES }, { key: "site", label: "Site", options: [...SITES] }, { key: "motif", label: "Motif", options: ["Création", "Remplacement", "Renfort temporaire"] }]}
          columns={[{ key: "id", header: "Référence" }, { key: "title", header: "Intitulé" }, { key: "dept", header: "Département" }, { key: "site", header: "Site" }, { key: "requester", header: "Demandeur" }, { key: "motif", header: "Motif" }, { key: "count", header: "Postes" }, { key: "contract", header: "Contrat" }, { key: "budget", header: "Budget", render: (r) => <span className="tnum">{fmtMAD(r.budget)}</span> }, { key: "priority", header: "Priorité", render: (r) => <StatusBadge label={r.priority} /> }, { key: "status", header: "Statut", render: (r) => <StatusBadge label={r.status} /> }]} />
      )}
      <Dialog open={!!move} onOpenChange={(o) => !o && setMove(null)}>
        <DialogContent><DialogHeader><DialogTitle>{backward ? "Retour en arrière" : "Confirmer le passage"}</DialogTitle><DialogDescription>{move?.r.id} → {move?.to}</DialogDescription></DialogHeader>
          {backward && <Textarea placeholder="Motif (obligatoire)" value={reason} onChange={(e) => setReason(e.target.value)} />}
          <DialogFooter><Button variant="ghost" onClick={() => setMove(null)}>Annuler</Button><Button disabled={!!backward && !reason.trim()} onClick={() => { doMove(move!.r, move!.to); setMove(null); }}>Confirmer</Button></DialogFooter></DialogContent>
      </Dialog>
    </ModulePage>
  );
}
export { Glass };
