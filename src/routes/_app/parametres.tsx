import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ModulePage, meta } from "@/components/app/Module";
import { Section } from "@/components/app/kit";
import { SITES, SITE_COUNTS, DEPTS, DEPT_COUNTS, CONTRACTS, CRITERIA, candidates } from "@/data/mock";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/parametres")({ head: () => meta("Paramètres", "Configuration de la plateforme RH."), component: Page });
const save = () => toast.success("Paramètres enregistrés");

function Page() {
  const [tpl, setTpl] = useState("Bonjour {{nom}},\n\nNous vous confirmons la réception de votre candidature au poste de {{poste}}.\n\nL'équipe RH AYA");
  const [circ, setCirc] = useState<Record<string, string[]>>({ "Demande de poste": ["Manager", "RH", "Direction"], "Fiche de poste": ["Manager", "RH", "Direction"], "Congé": ["Manager", "RH"], Formation: ["Manager", "RH"] });
  return (
    <ModulePage title="Paramètres" subtitle="Administration de la plateforme"
      tabs={[
        { label: "Entreprise", content: <Section title="Entreprise"><div className="grid gap-3 md:grid-cols-2">{[["Raison sociale", "AYA Gold & Silver Maroc"], ["Siège", "Marrakech"], ["Effectif", "600"], ["Langue par défaut", "Français"]].map(([k, v]) => <div key={k}><label className="text-xs">{k}</label><Input defaultValue={v} /></div>)}</div><Button className="mt-3" onClick={save}>Enregistrer</Button></Section> },
        { label: "Sites", content: <Section title="Sites">{SITES.map((s) => <p key={s} className="flex justify-between border-b border-border py-2 text-sm">{s}<span className="tnum text-muted-foreground">{SITE_COUNTS[s]} collaborateurs</span></p>)}</Section> },
        { label: "Départements", content: <Section title="Départements">{DEPTS.map((d) => <p key={d} className="flex justify-between border-b border-border py-2 text-sm">{d}<span className="tnum text-muted-foreground">{DEPT_COUNTS[d]}</span></p>)}</Section> },
        { label: "Contrats", content: <Section title="Types de contrat">{CONTRACTS.map((c) => <p key={c} className="border-b border-border py-2 text-sm">{c}</p>)}</Section> },
        { label: "Jours fériés", content: <Section title="Jours fériés 2026"><p className="text-sm text-muted-foreground">Calendrier marocain officiel appliqué (fêtes nationales et religieuses). Voir Congés → Règles.</p></Section> },
        { label: "Modèles d'emails", content: <div className="grid gap-4 lg:grid-cols-2"><Section title="Accusé de réception"><Textarea rows={8} value={tpl} onChange={(e) => setTpl(e.target.value)} /><p className="mt-1 text-xs text-muted-foreground">Variables : {"{{nom}} {{poste}} {{date}}"}</p><Button className="mt-2" onClick={save}>Enregistrer</Button></Section><Section title="Aperçu"><p className="whitespace-pre-wrap text-sm">{tpl.replace("{{nom}}", candidates[0].name).replace("{{poste}}", "Ingénieur Géologue")}</p></Section></div> },
        { label: "Grilles de scoring", content: <Section title="Grille par défaut">{CRITERIA.map((c) => <p key={c.k} className="flex justify-between border-b border-border py-2 text-sm">{c.k}<b>{c.w} %</b></p>)}<p className="mt-2 text-xs text-muted-foreground">Modifiable par poste depuis Candidatures → Grille de scoring.</p></Section> },
        { label: "Circuits de validation", content: <div className="grid gap-3 md:grid-cols-2">{Object.entries(circ).map(([k, steps]) => <Section key={k} title={k}><ol className="space-y-1">{steps.map((s, i) => <li key={i} className="flex items-center gap-2 text-sm"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold/20 text-xs text-gold">{i + 1}</span><Input value={s} className="h-8" onChange={(e) => setCirc({ ...circ, [k]: steps.map((x, j) => j === i ? e.target.value : x) })} /><Button size="sm" variant="ghost" onClick={() => setCirc({ ...circ, [k]: steps.filter((_, j) => j !== i) })}>Retirer</Button></li>)}</ol><Button size="sm" variant="outline" className="mt-2" onClick={() => setCirc({ ...circ, [k]: [...steps, "Nouvel approbateur"] })}>Ajouter une étape</Button></Section>)}</div> },
        { label: "Notifications", content: <Section title="Notifications"><table className="w-full text-sm"><thead><tr className="text-xs text-muted-foreground"><th className="text-left">Événement</th><th>Application</th><th>Email</th></tr></thead><tbody>{["Nouvelle candidature", "Fiche à valider", "Habilitation expirante", "Demande de congé", "Demande RH"].map((e) => <tr key={e} className="border-t border-border"><td className="py-2">{e}</td><td className="text-center"><Switch defaultChecked /></td><td className="text-center"><Switch defaultChecked={e !== "Nouvelle candidature"} /></td></tr>)}</tbody></table></Section> },
        { label: "Confidentialité", content: <Section title="Confidentialité & conservation"><div className="space-y-3 text-sm"><p className="flex items-center justify-between">Masquer salaires et notes RH aux managers<Switch defaultChecked /></p><p className="flex items-center justify-between">Suivi du consentement candidats<Switch defaultChecked /></p><p>Durée de conservation des candidatures : <b>24 mois</b></p><p className="rounded-lg bg-muted/40 p-3">{candidates.filter((c) => c.retentionDays < 30).length} candidatures arrivent au terme de la conservation.</p><Button variant="destructive" onClick={() => { if (confirm(`Anonymiser ${candidates.filter((c) => c.retentionDays < 30).length} candidatures de plus de 24 mois ?`)) toast.success("Candidatures anonymisées — action journalisée"); }}>Anonymiser les candidats après 24 mois</Button></div></Section> },
      ]} />
  );
}
