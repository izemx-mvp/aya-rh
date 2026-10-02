import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModulePage, meta } from "@/components/app/Module";
import { DataTable } from "@/components/app/DataTable";
import { StatusBadge, Glass, Section, Bar } from "@/components/app/kit";
import { documentsLib, employees, fmtDate } from "@/data/mock";
import { exportPdf } from "@/lib/pdf";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/documents")({ head: () => meta("Documents", "Bibliothèque documentaire, accusés de lecture et modèles."), component: Page });
const TPL: Record<string, string> = { Attestation: "Nous soussignés, AYA Gold & Silver Maroc, attestons que {{nom}} occupe le poste de {{poste}} depuis le {{date}}.", Convocation: "{{nom}}, vous êtes convoqué(e) le {{date}} pour un entretien relatif à votre poste de {{poste}}.", Avenant: "Le présent avenant modifie le contrat de {{nom}}, {{poste}}, à compter du {{date}}.", "Lettre d'avertissement": "{{nom}}, nous avons constaté un manquement aux règles de sécurité le {{date}} dans le cadre de votre poste de {{poste}}.", Contrat: "Entre AYA Gold & Silver Maroc et {{nom}}, il est convenu un contrat pour le poste de {{poste}} à compter du {{date}}." };

function Page() {
  const [tpl, setTpl] = useState("Attestation"); const [emp, setEmp] = useState(employees[3].id); const [soft, setSoft] = useState(false);
  const e = employees.find((x) => x.id === emp)!;
  const text = TPL[tpl].replace("{{nom}}", e.name).replace("{{poste}}", e.job).replace("{{date}}", fmtDate(e.hireDate)) + (soft ? "\n\nNous restons à votre disposition pour échanger à ce sujet dans un esprit constructif." : "");
  return (
    <ModulePage title="Documents" subtitle={`${documentsLib.length} documents · ${documentsLib.filter((d) => d.status === "À revoir").length} à revoir`}
      actions={[{ label: "Téléverser une version", primary: true, fields: [{ name: "d", label: "Document", type: "select", options: documentsLib.map((d) => d.title), required: true }, { name: "v", label: "Nouvelle version", required: true, def: "v2.0" }], success: "Nouvelle version enregistrée" }, { label: "Envoyer pour accusé de lecture", fields: [{ name: "d", label: "Document", type: "select", options: documentsLib.map((d) => d.title), required: true }, { name: "a", label: "Audience", type: "select", options: ["Tous", "Zgounder", "Boumadine", "Marrakech", "Siège", "Managers"], required: true }], success: "Envoyé pour lecture et accusé" }]}
      tabs={[
        { label: "Bibliothèque", content: <DataTable id="doc" rows={documentsLib} filters={[{ key: "category", label: "Catégorie", options: ["Règlement", "Politique RH", "Modèle de contrat", "Procédure"] }, { key: "status", label: "Statut", options: ["À jour", "À revoir"] }]}
          cards={(d) => <Glass className="p-4"><StatusBadge label={d.category} tone="info" /><p className="mt-2 font-semibold">{d.title}</p><p className="text-xs text-muted-foreground">{d.version} · revue {fmtDate(d.review)}</p><div className="mt-2"><StatusBadge label={d.status} /></div></Glass>}
          drawerTitle={(d) => d.title} drawer={(d) => <div className="space-y-3 text-sm"><p>Lu par {d.ack} % de l'audience</p><Bar value={d.ack} /><Button size="sm" onClick={() => toast.success("Relance envoyée aux non-lecteurs")}>Relancer les non-lecteurs</Button><p className="font-semibold">Versions</p>{[d.version, "v1.0"].map((v, i) => <div key={v} className="flex justify-between">{v}{i > 0 && <Button size="sm" variant="ghost" onClick={() => toast.success(`${v} restaurée`)}>Restaurer</Button>}</div>)}<Button size="sm" variant="outline" onClick={() => exportPdf(d.title, [[d.title, `${d.category} — ${d.version}`]])}>Télécharger</Button></div>}
          columns={[{ key: "title", header: "Document" }, { key: "category", header: "Catégorie" }, { key: "version", header: "Version" }, { key: "review", header: "Revue", render: (d) => fmtDate(d.review) }, { key: "owner", header: "Propriétaire" }, { key: "status", header: "Statut", render: (d) => <StatusBadge label={d.status} /> }, { key: "ack", header: "Lecture", render: (d) => <div className="w-20"><Bar value={d.ack} /></div> }]} /> },
        { label: "Générateur de modèles", content: <div className="grid gap-4 lg:grid-cols-2">
          <Section title="Paramètres"><div className="space-y-3"><select value={tpl} onChange={(x) => setTpl(x.target.value)} className="w-full rounded-md border border-input bg-background px-2 py-2 text-sm">{Object.keys(TPL).map((t) => <option key={t}>{t}</option>)}</select><select value={emp} onChange={(x) => setEmp(x.target.value)} className="w-full rounded-md border border-input bg-background px-2 py-2 text-sm">{employees.slice(0, 80).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select><p className="text-xs text-muted-foreground">Variables : {"{{nom}}"}, {"{{poste}}"}, {"{{date}}"}</p><Button variant="outline" onClick={() => setSoft(!soft)}><Sparkles className="mr-1 h-4 w-4 text-gold" />Adapter le ton</Button></div></Section>
          <Section title="Aperçu"><div className="rounded-xl bg-card p-5 text-sm"><img src="/aya-logo.png" alt="" className="mb-3 h-8" /><p className="font-semibold">{tpl}</p><p className="mt-3 whitespace-pre-wrap">{text}</p></div><div className="mt-3 flex gap-2"><Button onClick={() => exportPdf(`${tpl} — ${e.name}`, [[tpl, text]])}>Exporter PDF</Button><Button variant="outline" onClick={() => toast.success(`Classé dans le dossier de ${e.name}`)}>Classer dans le dossier</Button></div></Section>
        </div> },
      ]} />
  );
}
