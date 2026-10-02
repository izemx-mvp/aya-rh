import { generateAttestation } from "@/lib/actions";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ModulePage, meta } from "@/components/app/Module";
import { DataTable, DetailGrid } from "@/components/app/DataTable";
import { StatusBadge, Typing, AiDisclaimer } from "@/components/app/kit";
import { hrRequests, fmtDate, RECRUITERS, empById } from "@/data/mock";
import { useStore, emit } from "@/lib/store";
import { exportPdf } from "@/lib/pdf";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/demandes-rh")({ head: () => meta("Demandes RH", "Boîte de réception des demandes des collaborateurs."), component: Page });
type R = (typeof hrRequests)[number];

function Detail({ r }: { r: R }) {
  const [reply, setReply] = useState(""); const [rating, setRating] = useState(0);
  const e = empById(r.empId)!;
  return (
    <div className="space-y-4">
      <DetailGrid items={[["Collaborateur", r.emp], ["Type", r.type], ["Priorité", <StatusBadge label={r.priority} />], ["SLA", <StatusBadge label={r.sla} />], ["Statut", <StatusBadge label={r.status} />], ["Assigné à", r.assignee]]} />
      <p className="flex items-center gap-1 text-xs text-gold"><Sparkles className="h-3 w-3" />Classée automatiquement : {r.type} · priorité suggérée {r.priority}</p>
      <div className="space-y-2"><div className="rounded-lg bg-muted/40 p-3 text-sm"><p className="text-xs text-muted-foreground">{r.emp} · {fmtDate(r.created)}</p>Bonjour, pourriez-vous me fournir une {r.type.toLowerCase()} s'il vous plaît ? Merci.</div><div className="rounded-lg border border-dashed border-warning/40 p-2 text-xs text-warning">Commentaire interne (privé) : vérifier l'ancienneté avant envoi.</div></div>
      <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => setReply(`Bonjour ${r.emp.split(" ")[0]},\n\nVous trouverez ci-joint votre ${r.type.toLowerCase()}. N'hésitez pas à nous contacter pour toute question.\n\nCordialement,\nService RH`)}><Sparkles className="mr-1 h-3 w-3 text-gold" />Rédiger une réponse</Button><select className="rounded-md border border-input bg-background px-2 text-xs" onChange={(x) => setReply(x.target.value)} defaultValue=""><option value="" disabled>Modèles de réponse</option><option>Votre demande est en cours de traitement.</option><option>Merci de nous transmettre un justificatif.</option></select></div>
      {reply && <div className="rounded-lg bg-gold/5 p-2 text-sm"><Typing text={reply} /></div>}
      <Textarea value={reply} onChange={(x) => setReply(x.target.value)} placeholder="Votre réponse…" />
      {r.type.startsWith("Attestation") && !["Résolue", "Clôturée"].includes(r.status) && <Button size="sm" variant="outline" onClick={() => { generateAttestation(r.id); exportPdf(`${r.type} — ${r.emp}`, [["Attestation", `Nous attestons que ${e.name}, matricule ${e.matricule}, occupe le poste de ${e.job} depuis le ${fmtDate(e.hireDate)}${r.type.includes("salaire") ? ", pour une rémunération conforme à son contrat" : ""}.`]]); }}>Générer le document (modèle Documents)</Button>}
      <div className="flex gap-2"><Button size="sm" disabled={!reply} onClick={() => { r.status = "Résolue"; emit(); toast.success("Réponse validée et envoyée"); }}>Valider et envoyer</Button><Button size="sm" variant="outline" onClick={() => { r.status = "Clôturée"; emit(); toast("Demande clôturée"); }}>Clôturer</Button></div>
      {["Résolue", "Clôturée"].includes(r.status) && <div className="flex items-center gap-1 text-sm">Satisfaction : {[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => setRating(n)} aria-label={`${n} étoiles`}><Star className={n <= rating ? "h-4 w-4 fill-gold text-gold" : "h-4 w-4"} /></button>)}</div>}
      <AiDisclaimer />
    </div>
  );
}

function Page() {
  useStore();
  return (
    <ModulePage title="Demandes RH" subtitle={`${hrRequests.filter((r) => !["Résolue", "Clôturée"].includes(r.status)).length} demandes ouvertes`} actions={[{ label: "Créer une demande", primary: true, fields: [{ name: "e", label: "Collaborateur", required: true }, { name: "t", label: "Type", type: "select", options: ["Attestation de travail", "Attestation de salaire", "Changement d'informations", "Avance", "Question", "Autre"], required: true }, { name: "m", label: "Message", type: "textarea" }], success: "Demande créée et classée par l'IA" }]}>
      <DataTable id="hr" rows={hrRequests} drawer={(r) => <Detail r={r} />} drawerTitle={(r) => `${r.id} · ${r.type}`}
        filters={[{ key: "status", label: "Statut", options: ["Nouvelle", "En cours", "En attente employé", "Résolue", "Clôturée"] }, { key: "type", label: "Type", options: ["Attestation de travail", "Attestation de salaire", "Changement d'informations", "Avance", "Question", "Autre"] }, { key: "priority", label: "Priorité", options: ["Haute", "Moyenne", "Basse"] }, { key: "assignee", label: "Assigné à", options: RECRUITERS }]}
        bulkActions={(ids, clear) => <><Button size="sm" onClick={() => { ids.forEach((id) => (hrRequests.find((r) => r.id === id)!.assignee = "Salma Idrissi")); emit(); toast.success("Assignées à Salma Idrissi"); clear(); }}>Assigner</Button><Button size="sm" variant="outline" onClick={() => { ids.forEach((id) => (hrRequests.find((r) => r.id === id)!.status = "Clôturée")); emit(); toast.success(`${ids.length} clôturées`); clear(); }}>Clôturer</Button><Button size="sm" variant="outline" onClick={() => { ids.forEach((id) => (hrRequests.find((r) => r.id === id)!.priority = "Haute")); emit(); clear(); }}>Priorité haute</Button></>}
        columns={[{ key: "id", header: "Réf." }, { key: "emp", header: "Collaborateur" }, { key: "type", header: "Type" }, { key: "priority", header: "Priorité", render: (r) => <StatusBadge label={r.priority} /> }, { key: "status", header: "Statut", render: (r) => <StatusBadge label={r.status} /> }, { key: "sla", header: "SLA", render: (r) => <StatusBadge label={r.sla} tone={r.sla === "OK" ? "success" : r.sla === "En retard" ? "danger" : "warning"} /> }, { key: "assignee", header: "Assigné à" }, { key: "created", header: "Créée", render: (r) => fmtDate(r.created) }]} />
    </ModulePage>
  );
}
