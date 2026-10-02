import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Loader2, Check, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ModulePage, meta } from "@/components/app/Module";
import { DataTable, DetailGrid } from "@/components/app/DataTable";
import { StatusBadge, Glass, Typing, AiDisclaimer } from "@/components/app/kit";
import { jobAds, posById, fmtDate } from "@/data/mock";
import { useStore, emit } from "@/lib/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/offres")({ head: () => meta("Offres d'emploi", "Rédaction, publication et performance des offres d'emploi."), component: Page });
type Ad = (typeof jobAds)[number];

function Page() {
  useStore();
  const [edit, setEdit] = useState<Ad | null>(null);
  return (
    <ModulePage title="Offres d'emploi" subtitle={`${jobAds.filter((a) => a.status === "En ligne").length} offres en ligne`} actions={[{ label: "Nouvelle offre", primary: true, run: () => setEdit({ ...jobAds[0], id: "NEW", title: "", status: "Brouillon" }) }]}>
      <DataTable id="of" rows={jobAds} onRowClick={setEdit} filters={[{ key: "status", label: "Statut", options: ["Brouillon", "Planifiée", "En ligne", "Clôturée", "Expirée"] }, { key: "site", label: "Site", options: ["Zgounder", "Boumadine", "Marrakech", "Siège"] }]}
        cards={(r) => <Glass className="p-4"><p className="font-semibold">{r.title}</p><p className="text-xs text-muted-foreground">{r.site}</p><div className="mt-2 flex justify-between"><StatusBadge label={r.status} /><span className="text-xs tnum">{r.applications} candidatures</span></div></Glass>}
        rowActions={(r) => [{ label: "Modifier", onClick: () => setEdit(r) }, { label: "Dupliquer", onClick: () => toast.success("Offre dupliquée") }, { label: "Clôturer l'offre", onClick: () => { if (confirm("Clôturer cette offre ? Les candidats pourront être notifiés.")) { r.status = "Clôturée"; emit(); toast.success("Offre clôturée"); } }, danger: true }]}
        columns={[{ key: "id", header: "Réf." }, { key: "title", header: "Titre" }, { key: "site", header: "Site" }, { key: "status", header: "Statut", render: (r) => <StatusBadge label={r.status} /> }, { key: "published", header: "Publication", render: (r) => fmtDate(r.published) }, { key: "closing", header: "Clôture", render: (r) => fmtDate(r.closing) }, { key: "views", header: "Vues", render: (r) => <span className="tnum">{r.views.toLocaleString("fr-FR")}</span> }, { key: "applications", header: "Candidatures" },
          { key: "channels", header: "Canaux", sortable: false, render: (r) => <div className="flex h-6 items-end gap-0.5" title={Object.entries(r.channels).map(([k, v]) => `${k}: ${v}`).join(", ")}>{Object.values(r.channels).map((v, i) => <span key={i} className={cn("w-2 rounded-sm", ["bg-gold", "bg-slate", "bg-silver", "bg-info"][i])} style={{ height: `${(v as number) / 60 * 100}%` }} />)}</div> }]} />
      {edit && <Editor ad={edit} onClose={() => setEdit(null)} />}
    </ModulePage>
  );
}

function Editor({ ad, onClose }: { ad: Ad; onClose: () => void }) {
  const pos = posById(ad.positionId);
  const [f, setF] = useState({ title: ad.title, missions: ad.title ? `Rattaché(e) au responsable du département ${pos.dept}, vous assurez les missions clés du poste à ${pos.site}.` : "", profil: ad.title ? "Bac+3 minimum, 3 ans d'expérience en environnement industriel ou minier." : "", skills: ad.title ? "Sécurité HSE, rigueur, travail en équipe" : "", conditions: "Rotation possible, transport et hébergement sur site", lieu: pos.site, contrat: "CDI", closing: ad.closing.slice(0, 10) });
  const [ai, setAi] = useState<{ k: string; text: string } | null>(null);
  const [ch, setCh] = useState<Record<string, string>>({ LinkedIn: "", Indeed: "", "Emploi.ma": "", Rekrute: "" });
  const runAi = (k: string) => setAi({ k, text: { "Générer à partir de la demande": `Rejoignez AYA Gold & Silver à ${pos.site} en tant que ${pos.title}. Vous contribuerez à la croissance de l'une des mines d'argent les plus prometteuses d'Afrique, au sein d'une équipe engagée pour la sécurité et l'excellence opérationnelle.`, "Améliorer": f.missions + " Vous participez activement à la culture sécurité et à l'amélioration continue.", "Raccourcir": f.missions.split(",")[0] + ".", "Traduire FR/EN": `As ${pos.title} based in ${pos.site}, you will ensure the key missions of the role in compliance with HSE standards.`, "Rendre inclusif": f.missions.replace(/Rattaché\(e\)/, "Rattaché·e").replace(/vous assurez/, "vous assurerez") + " [« technicien » → « technicien·ne »]", "Ajouter une section": "Pourquoi nous rejoindre : environnement international, formation continue, programme IA interne, plan de carrière." }[k]! });
  const checks = [["Titre", !!f.title], ["Missions", f.missions.length > 20], ["Compétences", !!f.skills], ["Date de clôture", !!f.closing]] as const;
  const ok = checks.every(([, v]) => v);
  const publish = () => Object.keys(ch).forEach((c, i) => { setCh((s) => ({ ...s, [c]: "loading" })); setTimeout(() => setCh((s) => ({ ...s, [c]: i === 3 ? "Erreur" : i === 2 ? "En attente" : "En ligne" })), 900 + i * 400); });
  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-6xl">
        <SheetHeader><SheetTitle>{ad.title || "Nouvelle offre"}</SheetTitle><SheetDescription>Éditeur avec aperçu en direct</SheetDescription></SheetHeader>
        <div className="mt-4 flex flex-wrap gap-1.5">{["Générer à partir de la demande", "Améliorer", "Raccourcir", "Traduire FR/EN", "Rendre inclusif", "Ajouter une section"].map((k) => <Button key={k} size="sm" variant="outline" className="h-7 text-xs" onClick={() => runAi(k)}><Sparkles className="mr-1 h-3 w-3 text-gold" />{k}</Button>)}</div>
        {ai && <div className="mt-3 rounded-xl border border-gold/30 bg-gold/5 p-3 text-sm"><p className="mb-1 text-xs text-gold">{ai.k}</p><Typing text={ai.text} /><div className="mt-2 flex gap-2"><Button size="sm" onClick={() => { setF({ ...f, missions: ai.k === "Ajouter une section" ? f.missions + "\n\n" + ai.text : ai.text }); setAi(null); }}><Check className="mr-1 h-3 w-3" />Accepter</Button><Button size="sm" variant="ghost" onClick={() => setAi(null)}><X className="mr-1 h-3 w-3" />Rejeter</Button></div><div className="mt-2"><AiDisclaimer /></div></div>}
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            {(["title", "missions", "profil", "skills", "conditions", "lieu", "contrat"] as const).map((k) => <div key={k}><label className="text-xs font-medium capitalize">{{ title: "Titre *", missions: "Missions *", profil: "Profil recherché", skills: "Compétences *", conditions: "Conditions", lieu: "Lieu", contrat: "Contrat" }[k]}</label>{["missions", "profil"].includes(k) ? <Textarea rows={4} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /> : <Input value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />}</div>)}
            <div><label className="text-xs font-medium">Date de clôture *</label><Input type="date" value={f.closing} onChange={(e) => setF({ ...f, closing: e.target.value })} /></div>
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-6"><img src="/aya-logo.png" alt="" className="h-8" /><h2 className="mt-4 text-xl font-bold">{f.title || "Titre de l'offre"}</h2><p className="text-sm text-muted-foreground">{f.lieu} · {f.contrat}</p><h3 className="mt-4 font-semibold">Missions</h3><p className="whitespace-pre-wrap text-sm">{f.missions}</p><h3 className="mt-3 font-semibold">Profil</h3><p className="text-sm">{f.profil}</p><h3 className="mt-3 font-semibold">Compétences</h3><div className="mt-1 flex flex-wrap gap-1">{f.skills.split(",").filter(Boolean).map((s) => <span key={s} className="rounded-full bg-gold/15 px-2 py-0.5 text-xs">{s.trim()}</span>)}</div><p className="mt-3 text-xs text-muted-foreground">{f.conditions} · Clôture le {f.closing}</p></div>
            <Glass className="p-4"><p className="mb-2 text-sm font-semibold">Checklist avant publication</p>{checks.map(([k, v]) => <p key={k} className={cn("flex items-center gap-2 text-sm", v ? "text-success" : "text-danger")}>{v ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}{k}</p>)}</Glass>
            <Glass className="p-4"><p className="mb-2 text-sm font-semibold">Publication</p>{Object.entries(ch).map(([c, s]) => <div key={c} className="flex items-center justify-between py-1.5 text-sm"><span className="flex items-center gap-2"><Switch defaultChecked />{c}</span>{s === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : s ? <span className="flex items-center gap-2"><StatusBadge label={s} />{s === "Erreur" && <Button size="sm" variant="ghost" className="h-6" onClick={() => { setCh((x) => ({ ...x, [c]: "loading" })); setTimeout(() => setCh((x) => ({ ...x, [c]: "En ligne" })), 900); }}><RefreshCw className="mr-1 h-3 w-3" />Réessayer</Button>}</span> : null}</div>)}
              <div className="mt-3 flex gap-2"><Input type="datetime-local" className="h-9" aria-label="Programmer" /><Button disabled={!ok} onClick={publish}>Publier</Button></div>{!ok && <p className="mt-1 text-xs text-danger">Complétez la checklist pour publier.</p>}</Glass>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
export { DetailGrid };
