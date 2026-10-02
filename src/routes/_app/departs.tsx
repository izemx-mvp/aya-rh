import { useStore } from "@/lib/store";
import { closeDeparture, createReplacement, startDeparture } from "@/lib/actions";
import { toast } from "sonner";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ModulePage, meta } from "@/components/app/Module";
import { DataTable, DetailGrid } from "@/components/app/DataTable";
import { StatusBadge, Bar, Typing, AiDisclaimer } from "@/components/app/kit";
import { departures, fmtDate, SITES, KPI, employees } from "@/data/mock";
import { exportPdf } from "@/lib/pdf";

export const Route = createFileRoute("/_app/departs")({ head: () => meta("Départs", "Processus de départ et entretiens de sortie."), component: Page });
const CHECK = ["Restitution matériel", "Restitution EPI", "Désactivation des accès", "Solde de tout compte", "Certificat de travail", "Attestation"];

function Detail({ d }: { d: (typeof departures)[number] }) {
  const [c, setC] = useState<boolean[]>(CHECK.map((_, i) => d.progress === 100 || i < 2));
  return (
    <div className="space-y-4">
      <DetailGrid items={[["Type", d.type], ["Dernier jour", fmtDate(d.lastDay)], ["Site", d.site], ["Ancienneté", `${d.seniority} ans`]]} />
      <div><p className="mb-2 text-sm font-semibold">Checklist</p>{CHECK.map((k, i) => <label key={k} className="flex items-center gap-2 py-1 text-sm"><Checkbox checked={c[i]} onCheckedChange={(v) => setC(c.map((x, j) => j === i ? !!v : x))} />{k}</label>)}<Bar value={c.filter(Boolean).length} max={CHECK.length} /></div>
      <div><p className="mb-1 text-sm font-semibold">Entretien de sortie — synthèse IA</p><p className="rounded-lg bg-muted/40 p-3 text-sm"><Typing text="Motifs principaux : éloignement familial lié au site isolé, opportunité d'évolution externe. Points positifs : culture sécurité, ambiance d'équipe. Suggestion : renforcer les perspectives de mobilité interne." /></p><AiDisclaimer /></div>
      <div><p className="mb-1 text-sm font-semibold">Transfert de connaissances</p><p className="text-sm text-muted-foreground">Successeur : à désigner · 3 tâches de passation</p></div>
      {d.status !== "Clôturé" && <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => createReplacement(d.id)}>Créer une demande de remplacement</Button></div>}
      {d.status !== "Clôturé" && <Button disabled={!c.every(Boolean)} onClick={() => { closeDeparture(d.id); exportPdf(`Clôture de départ — ${d.emp}`, [["Certificat de travail", `${d.emp} a été employé(e) jusqu'au ${fmtDate(d.lastDay)}.`], ["Solde de tout compte", "Arrêté et réglé."]]); }}>Clôturer et générer les documents</Button>}
    </div>
  );
}

function Page() {
  useStore();
  return (
    <ModulePage title="Départs" subtitle={`${KPI.departures} départs sur 12 mois · turnover ${KPI.turnover}`}
      actions={[{ label: "Initier un départ", primary: true, steps: [[{ name: "emp", label: "Collaborateur", required: true }, { name: "type", label: "Type", type: "select", options: ["Démission", "Fin de contrat", "Rupture conventionnelle", "Licenciement", "Retraite"], required: true }], [{ name: "last", label: "Dernier jour", type: "date", required: true }, { name: "notice", label: "Préavis (jours)", type: "number", def: "30" }]], confirm: "Lancer", cascade: true, onSubmit: (v) => { const e = employees.find((x) => x.status !== "Parti" && (x.name.toLowerCase().includes(v.emp.toLowerCase()) || x.matricule === v.emp)); if (!e) { toast.error(`Collaborateur « ${v.emp} » introuvable`); return; } startDeparture(e.id, v.type, new Date(v.last).toISOString()); } }, { label: "Formulaire d'entretien de sortie", fields: [{ name: "r", label: "Motif principal", type: "select", options: ["Rémunération", "Évolution", "Éloignement", "Management", "Conditions de travail", "Autre"], required: true }, { name: "n", label: "Satisfaction globale (1-5)", type: "number" }, { name: "c", label: "Commentaires", type: "textarea" }], success: "Entretien de sortie enregistré" }]}>
      <DataTable id="dep" rows={departures} drawer={(d) => <Detail d={d} />} drawerTitle={(d) => d.emp} filters={[{ key: "type", label: "Type", options: ["Démission", "Fin de contrat", "Rupture conventionnelle", "Licenciement", "Retraite"] }, { key: "site", label: "Site", options: [...SITES] }, { key: "status", label: "Statut", options: ["En cours", "Clôturé"] }]}
        columns={[{ key: "id", header: "Réf." }, { key: "emp", header: "Collaborateur" }, { key: "site", header: "Site" }, { key: "dept", header: "Département" }, { key: "type", header: "Type" }, { key: "lastDay", header: "Dernier jour", render: (r) => fmtDate(r.lastDay) }, { key: "status", header: "Statut", render: (r) => <StatusBadge label={r.status} /> }, { key: "progress", header: "Progression", render: (r) => <div className="w-24"><Bar value={r.progress} /></div> }]} />
    </ModulePage>
  );
}
