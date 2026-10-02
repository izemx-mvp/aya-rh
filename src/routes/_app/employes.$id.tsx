import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileUp, Mail, Pencil, Repeat, CalendarPlus, FileText, LogOut, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader, StatusBadge, Glass, Avatar, ScoreRing, Bar } from "@/components/app/kit";
import { DetailGrid } from "@/components/app/DataTable";
import { ActionButtons } from "@/components/app/Module";
import { employees, habilitations, leaveRequests, trainings, fmtDate, jobDescs, empDocs, departures, hrRequests, ficheCerts, onboarding } from "@/data/mock";
import { startDeparture } from "@/lib/actions";
import { PersonTimeline, RelatedItems } from "@/components/app/Links";
import { useStore, audit } from "@/lib/store";
import { exportPdf } from "@/lib/pdf";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/employes/$id")({
  head: () => ({ meta: [{ title: "Dossier employé — AYA RH IA" }, { name: "description", content: "Dossier complet du collaborateur." }, { property: "og:title", content: "Dossier employé — AYA RH IA" }, { property: "og:description", content: "Dossier collaborateur." }] }),
  loader: ({ params }) => { if (!employees.find((e) => e.id === params.id)) throw notFound(); },
  component: Page,
});

function Page() {
  useStore();
  const { id } = Route.useParams();
  const e = employees.find((x) => x.id === id)!;
  const habs = habilitations.filter((h) => h.empId === id);
  const [docs, setDocs] = useState([{ t: "Contrat de travail", s: "Valide", v: "v1", d: e.hireDate }, { t: "CIN", s: "Valide", v: "v2", d: e.hireDate }, { t: "Diplôme", s: e.completeness < 90 ? "Manquant" : "Valide", v: "v1", d: e.hireDate }, { t: "Certificat médical d'aptitude", s: "Expire bientôt", v: "v3", d: new Date().toISOString() }]);
  const [scan, setScan] = useState(0);
  useEffect(() => { audit("Consultation de dossier", e.matricule); }, [e.matricule]);
  const fp = jobDescs.find((j) => j.id === e.ficheId) ?? jobDescs.find((j) => j.title.startsWith(e.job));
  const allDocs = [...(empDocs[e.id] ?? []), ...docs];
  const req = fp ? ficheCerts[fp.id] ?? [] : [];
  const related = [
    ...(fp ? [{ group: "Fiche de poste", ref: fp.ref, label: `${fp.title} ${fp.version}`, status: fp.status, to: `/fiches-de-poste/${fp.id}` }] : []),
    ...req.map((t) => { const h = habs.find((x) => x.type === t); return { group: "Habilitations requises", ref: t, status: h?.status ?? "Manquante", to: "/habilitations" }; }),
    ...(e.fromCandId ? [{ group: "Recrutement", ref: e.fromCandId, label: "Candidature d'origine", to: `/candidatures/${e.fromCandId}` }] : []),
    ...(onboarding.some((o) => o.id === e.id) ? [{ group: "Intégration", ref: e.matricule, label: "Parcours d'intégration", status: "En cours", to: "/integration" }] : []),
    ...leaveRequests.filter((l) => l.empId === e.id).map((l) => ({ group: "Congés", ref: l.id, label: `${l.type} · ${l.days} j`, status: l.status, to: "/conges" })),
    ...hrRequests.filter((r) => r.empId === e.id).map((r) => ({ group: "Demandes RH", ref: r.id, label: r.type, status: r.status, to: "/demandes-rh" })),
    ...departures.filter((d) => d.empId === e.id).map((d) => ({ group: "Départ", ref: d.id, label: d.type, status: d.status, to: "/departs" })),
  ];
  const missing = allDocs.filter((d) => d.s === "Manquant").map((d) => d.t).concat(e.completeness < 80 ? ["RIB", "Photo d'identité"] : []);

  return (
    <div>
      <PageHeader title={e.name} crumbs={[{ label: "Dossiers employés", to: "/employes" }, { label: e.matricule }]} subtitle={`${e.job} · ${e.dept} · ${e.site}`}
        actions={<ActionButtons actions={[
          { label: "Modifier", fields: [{ name: "phone", label: "Téléphone", def: e.phone }, { name: "email", label: "Email", def: e.email }], success: "Dossier mis à jour" },
          { label: "Changer de poste", steps: [[{ name: "job", label: "Nouveau poste", required: true }, { name: "fp", label: "Nouvelle fiche de poste", type: "select", options: jobDescs.slice(0, 20).map((j) => j.ref + " " + j.title) }], [{ name: "date", label: "Date d'effet", type: "date", required: true }]], success: "Changement de poste enregistré", confirm: "Valider" },
          { label: "Prolonger le contrat", fields: [{ name: "end", label: "Nouvelle date de fin", type: "date", required: true }], success: "Contrat prolongé" },
          { label: "Générer une attestation", run: () => exportPdf(`Attestation de travail — ${e.name}`, [["Attestation", `Nous soussignés, AYA Gold & Silver Maroc, attestons que ${e.name}, matricule ${e.matricule}, est employé(e) au sein de notre société depuis le ${fmtDate(e.hireDate)} en qualité de ${e.job}, en contrat ${e.contract}.\n\nCette attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit.`], ["Fait à Marrakech", new Date().toLocaleDateString("fr-FR")]]) },
          { label: "Lancer un départ", cascade: true, onSubmit: (v) => startDeparture(e.id, v.type, new Date(v.last).toISOString(), v.reason), steps: [[{ name: "type", label: "Type", type: "select", options: ["Démission", "Fin de contrat", "Rupture conventionnelle", "Licenciement", "Retraite"], required: true }], [{ name: "last", label: "Dernier jour", type: "date", required: true }, { name: "notice", label: "Préavis (jours)", type: "number", def: "30" }, { name: "reason", label: "Motif (entretien de sortie)", type: "select", options: ["Rémunération", "Évolution de carrière", "Conditions de travail", "Éloignement géographique", "Personnel"] }]], confirm: "Lancer" },
        ]} />} />
      <Glass className="mb-5 flex flex-wrap items-center gap-5 p-5"><Avatar name={e.name} size={64} /><div className="flex-1"><p className="text-lg font-semibold">{e.name}</p><p className="text-sm text-muted-foreground">{e.matricule} · {e.team}</p><div className="mt-2 flex gap-2"><StatusBadge label={e.status} />{habs.some((h) => h.status === "Expirée") && <StatusBadge label="Non apte au poste" tone="danger" />}</div></div>
        <div className="flex items-center gap-4"><ScoreRing value={e.completeness} size={72} stroke={6} /><div className="text-sm"><p className="font-semibold">Complétude du dossier</p>{missing.length ? <><p className="text-xs text-muted-foreground">Manquant : {missing.join(", ")}</p><Button size="sm" variant="outline" className="mt-1 h-7" onClick={() => toast.success(`Email de relance envoyé à ${e.email}`, { description: `« Merci de nous transmettre : ${missing.join(", ")} »` })}><Mail className="mr-1 h-3 w-3" />Relancer le collaborateur</Button></> : <p className="text-xs text-success">Dossier complet</p>}</div></div></Glass>
      <Tabs defaultValue="profil">
        <TabsList className="flex h-auto flex-wrap justify-start">{["Profil", "Frise", "Liens", "Parcours", "Documents", "Compétences", "Formations", "Habilitations", "Évaluations", "Feedback", "Absences", "Notes RH"].map((t) => <TabsTrigger key={t} value={t.toLowerCase()}>{t}</TabsTrigger>)}</TabsList>
        <TabsContent value="profil"><Glass className="p-5"><DetailGrid items={[["Matricule", e.matricule], ["Email", e.email], ["Téléphone", e.phone], ["Poste", fp ? <Link to="/fiches-de-poste/$id" params={{ id: fp.id }} className="text-gold hover:underline">{e.job}</Link> : e.job], ["Département", e.dept], ["Site", e.site], ["Rattachement", e.manager], ["Contrat", e.contract], ["Embauche", fmtDate(e.hireDate)], ["Ancienneté", `${e.seniority} ans`], ["Équipe", e.team], ["Âge", e.age]]} /></Glass></TabsContent>
        <TabsContent value="frise"><PersonTimeline id={e.id} /></TabsContent>
        <TabsContent value="liens"><RelatedItems items={related} /></TabsContent>
        <TabsContent value="parcours"><Glass className="p-5"><ol className="space-y-3 border-l border-border pl-5 text-sm">{[["Candidature", "Portail carrière"], ["Embauche", `${e.job} · ${fmtDate(e.hireDate)}`], ["Formation", "Induction sécurité"], ...(e.seniority > 5 ? [["Promotion", "Passage agent de maîtrise"], ["Mobilité", "Boumadine → Zgounder"]] : [])].map(([k, v], i) => <li key={i}><p className="text-xs text-gold">{k}</p><p>{v}</p></li>)}</ol></Glass></TabsContent>
        <TabsContent value="documents"><Glass className="p-5"><div className="mb-3 flex justify-end"><Button size="sm" onClick={() => setScan(1)}><ScanLine className="mr-1 h-4 w-4" />Scanner un document</Button></div><table className="w-full text-sm"><thead><tr className="text-left text-xs text-muted-foreground"><th>Type</th><th>Statut</th><th>Version</th><th>Date</th><th /></tr></thead><tbody>{allDocs.map((d, i) => <tr key={i} className="border-t border-border"><td className="py-2">{d.t}</td><td><StatusBadge label={d.s} /></td><td>{d.v}</td><td>{fmtDate(d.d)}</td><td className="text-right"><Button size="sm" variant="ghost" onClick={() => exportPdf(d.t, [[d.t, e.name]])}>Voir</Button><Button size="sm" variant="ghost" onClick={() => setScan(1)}>Remplacer</Button><Button size="sm" variant="ghost" className="text-danger" onClick={() => { if (confirm(`Supprimer « ${d.t} » ?`)) { setDocs(docs.filter((_, j) => j !== i)); toast.success("Document supprimé"); } }}>Supprimer</Button></td></tr>)}</tbody></table></Glass></TabsContent>
        <TabsContent value="compétences"><Glass className="space-y-3 p-5">{["Sécurité HSE", "Compétences métier", "Travail en équipe", "Outils numériques"].map((s, i) => <div key={s}><div className="flex justify-between text-sm"><span>{s}</span><span>{3 + (i % 2)}/5</span></div><Bar value={(3 + (i % 2)) * 20} /></div>)}</Glass></TabsContent>
        <TabsContent value="formations"><Glass className="p-5 text-sm">{trainings.slice(0, 4).map((t) => <div key={t.id} className="flex justify-between border-b border-border py-2">{t.title}<StatusBadge label="Réalisé" /></div>)}<Link to="/formation" className="mt-2 block text-gold">Recommander des formations →</Link></Glass></TabsContent>
        <TabsContent value="habilitations"><Glass className="p-5 text-sm">{habs.length ? habs.map((h) => <div key={h.id} className="flex justify-between border-b border-border py-2">{h.type}<span className="flex items-center gap-2 text-xs">{fmtDate(h.expires)}<StatusBadge label={h.status} /></span></div>) : <p className="text-muted-foreground">Aucune habilitation requise pour ce poste.</p>}</Glass></TabsContent>
        <TabsContent value="évaluations"><Glass className="p-5 text-sm"><p>Entretien annuel 2026 : <StatusBadge label={e.review} /></p><Link to="/entretiens-annuels" className="mt-2 block text-gold">Ouvrir l'entretien annuel →</Link></Glass></TabsContent>
        <TabsContent value="feedback"><Glass className="p-5 text-sm">« Collaborateur fiable, très impliqué dans la sécurité. » — {e.manager}</Glass></TabsContent>
        <TabsContent value="absences"><Glass className="p-5 text-sm">{leaveRequests.filter((l) => l.empId === id).map((l) => <div key={l.id} className="flex justify-between border-b border-border py-2">{l.type} · {l.days} j<StatusBadge label={l.status} /></div>)}<p className="pt-2 text-muted-foreground">Solde congés annuels : 18 j</p></Glass></TabsContent>
        <TabsContent value="notes rh"><Glass className="p-5 text-sm"><p className="mb-2 text-xs text-warning">Visible uniquement par les rôles RH</p><p>Aucune note confidentielle.</p></Glass></TabsContent>
      </Tabs>
      <Dialog open={scan > 0} onOpenChange={(o) => !o && setScan(0)}>
        <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Scanner un document</DialogTitle><DialogDescription>Extraction automatique (OCR) des informations</DialogDescription></DialogHeader>
          {scan === 1 && <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gold/40 p-8" onDragOver={(ev) => ev.preventDefault()} onDrop={(ev) => { ev.preventDefault(); setScan(2); setTimeout(() => setScan(3), 1600); }}><FileUp className="h-8 w-8 text-gold" />Glissez le document ou cliquez<input type="file" className="sr-only" onChange={() => { setScan(2); setTimeout(() => setScan(3), 1600); }} /></label>}
          {scan >= 2 && <div className="grid gap-4 md:grid-cols-2"><div className="relative h-56 overflow-hidden rounded-xl bg-[oklch(0.95_0.005_85)] p-4">{scan === 2 && <div className="scanline" style={{ animationIterationCount: "infinite" }} />}{Array.from({ length: 8 }).map((_, i) => <div key={i} className="mb-2 h-2 rounded bg-[oklch(0.8_0.01_260)]" style={{ width: `${40 + (i * 23) % 55}%` }} />)}</div>
            {scan === 3 ? <div className="space-y-2">{[["Type", "Certificat médical d'aptitude"], ["Nom", e.name], ["Résultat", "Apte"], ["Date de visite", new Date().toLocaleDateString("fr-FR")], ["Validité", "12 mois"]].map(([k, v]) => <div key={k}><label className="text-xs text-muted-foreground">{k}</label><Input defaultValue={v} className="h-8" /></div>)}</div> : <p className="text-sm text-muted-foreground">Analyse en cours…</p>}</div>}
          {scan === 3 && <DialogFooter><Button onClick={() => { setDocs([...docs, { t: "Certificat médical d'aptitude", s: "Valide", v: "v4", d: new Date().toISOString() }]); audit("Ajout de document", e.matricule, "—", "Certificat médical v4"); setScan(0); toast.success("Document classé — tracé par Mme Baroudi, v4"); }}>Confirmer les informations</Button></DialogFooter>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
export { Pencil, Repeat, CalendarPlus, FileText, LogOut };
