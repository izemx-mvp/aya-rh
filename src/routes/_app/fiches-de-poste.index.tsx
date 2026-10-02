import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Wand2, Layers, RefreshCw, Check, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DataTable, DetailGrid, hl, type Col } from "@/components/app/DataTable";
import { PageHeader, StatusBadge, ScoreRing, Glass, Bar, Typing, AiDisclaimer, AiBadge, CountUp } from "@/components/app/kit";
import { jobDescs, DEPTS, SITES, LEVELS, fmtDate, type JobDesc } from "@/data/mock";
import { setJobDescStatus, useStore, emit, audit } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/fiches-de-poste/")({
  head: () => ({ meta: [{ title: "Fiches de poste — AYA RH IA" }, { name: "description", content: "Réorganisation et standardisation des fiches de poste avec l'IA." }, { property: "og:title", content: "Fiches de poste — AYA RH IA" }, { property: "og:description", content: "148 fiches de poste, révision assistée par IA." }] }),
  component: Page,
});

export const SECTIONS = ["Mission principale", "Responsabilités", "Activités", "Compétences techniques", "Compétences comportementales", "Formation et expérience requises", "Exigences HSE et habilitations", "Conditions de travail", "Indicateurs de performance", "Relations internes / externes"];
export function genSection(title: string, s: string, site = "Zgounder") {
  const m: Record<string, string> = {
    "Mission principale": `Le/la ${title} garantit l'atteinte des objectifs opérationnels de son périmètre à ${site}, dans le respect strict des standards HSE et de la politique qualité d'AYA Gold & Silver.`,
    "Responsabilités": "• Planifier et superviser les activités de son périmètre\n• Garantir la sécurité des personnes et des équipements\n• Assurer le reporting quotidien de performance\n• Contribuer à l'amélioration continue",
    "Activités": "• Préparer les ordres de travail\n• Contrôler la conformité des opérations\n• Animer les briefings sécurité de début de poste\n• Mettre à jour les indicateurs",
    "Compétences techniques": "Maîtrise des procédés miniers, lecture de plans, outils bureautiques, connaissance des équipements du site.",
    "Compétences comportementales": "Rigueur, sens des responsabilités, leadership de proximité, communication claire, capacité à travailler en rotation.",
    "Formation et expérience requises": "Bac+2 à Bac+5 selon niveau, 3 à 5 ans d'expérience en environnement industriel ou minier.",
    "Exigences HSE et habilitations": "Induction sécurité site, travail en hauteur, secourisme SST, port des EPI obligatoire, aptitude médicale valide.",
    "Conditions de travail": `Poste basé à ${site}. Travail en rotation possible (3x8), environnement souterrain et/ou usine.`,
    "Indicateurs de performance": "Taux de fréquence des accidents, respect du plan de production, disponibilité des équipements, taux de réalisation des actions.",
    "Relations internes / externes": "Internes : production, maintenance, HSE, RH. Externes : sous-traitants, fournisseurs, autorités locales.",
  };
  return m[s] ?? "";
}

function Page() {
  useStore();
  const nav = useNavigate();
  const [gen, setGen] = useState(false);
  const [rev, setRev] = useState<JobDesc | null | "pick">(null);
  const [batch, setBatch] = useState<string[] | null>(null);
  useEffect(() => { const f = () => setGen(true); window.addEventListener("aya:new", f); return () => window.removeEventListener("aya:new", f); }, []);
  const c = { r: jobDescs.filter((j) => j.status === "Révisée").length, v: jobDescs.filter((j) => j.status === "En validation").length, a: jobDescs.filter((j) => j.status === "À réviser").length };

  const cols: Col<JobDesc>[] = [
    { key: "ref", header: "Référence", render: (r, q) => <span className="font-mono text-xs">{hl(r.ref, q)}</span> },
    { key: "title", header: "Intitulé", width: 220, render: (r, q) => <span className="font-medium">{hl(r.title, q)}</span> },
    { key: "dept", header: "Département" }, { key: "site", header: "Site" },
    { key: "reportsTo", header: "Rattachement", hidden: true },
    { key: "status", header: "Statut", render: (r) => <StatusBadge label={r.status} /> },
    { key: "version", header: "Version" },
    { key: "modified", header: "Modifiée", render: (r) => <span className="text-xs tnum">{fmtDate(r.modified)}</span> },
    { key: "owner", header: "Propriétaire" },
    { key: "quality", header: "Qualité IA", render: (r) => <ScoreRing value={r.quality} size={32} animateIn={false} /> },
  ];

  return (
    <div>
      <PageHeader title="Fiches de poste" subtitle="Réorganisation et standardisation selon le modèle AYA"
        actions={<>
          <Button variant="outline" onClick={() => setRev("pick")}><Wand2 className="mr-1 h-4 w-4" />Réviser avec l'IA</Button>
          <Button className="bg-gold-gradient text-primary-foreground" onClick={() => setGen(true)}><Sparkles className="mr-1 h-4 w-4" />Générer une fiche de poste</Button>
        </>} />
      <Glass className="mb-5 p-5">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Avancement de la réorganisation</p><p className="text-3xl font-bold"><CountUp value={c.r} /> <span className="text-lg text-muted-foreground">/ {jobDescs.length} révisées</span></p></div>
          <div className="flex gap-4 text-sm">{[["Révisée", c.r, "bg-success"], ["En validation", c.v, "bg-warning"], ["À réviser", c.a, "bg-danger"]].map(([l, n, b]) => <button key={l as string} onClick={() => nav({ to: ".", search: { "fp.f_status": l } as any })} className="flex items-center gap-2"><span className={cn("h-2.5 w-2.5 rounded-full", b as string)} />{l} <b className="tnum">{n}</b></button>)}</div>
        </div>
        <div className="flex h-3 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${c.r} révisées, ${c.v} en validation, ${c.a} à réviser`}>
          <motion.div className="bg-success" initial={{ width: 0 }} animate={{ width: `${(c.r / 148) * 100}%` }} transition={{ duration: 1 }} />
          <motion.div className="bg-warning" initial={{ width: 0 }} animate={{ width: `${(c.v / 148) * 100}%` }} transition={{ duration: 1, delay: 0.2 }} />
          <motion.div className="bg-danger" initial={{ width: 0 }} animate={{ width: `${(c.a / 148) * 100}%` }} transition={{ duration: 1, delay: 0.4 }} />
        </div>
        <p className="mt-3 flex items-center gap-2 text-xs text-warning"><AlertTriangle className="h-3.5 w-3.5" />Détecteur de chevauchement : FP-0003 et FP-0045 ont 86 % de contenu similaire. <button className="underline" onClick={() => nav({ to: "/fiches-de-poste/$id", params: { id: "FP-0003" }, search: { compare: "FP-0045" } as any })}>Comparer</button></p>
      </Glass>
      <DataTable id="fp" rows={jobDescs} columns={cols} search={(r) => `${r.ref} ${r.title} ${r.dept} ${r.owner}`}
        filters={[{ key: "dept", label: "Département", options: DEPTS }, { key: "site", label: "Site", options: [...SITES] }, { key: "status", label: "Statut", options: ["Révisée", "En validation", "À réviser"] }, { key: "family", label: "Famille de métiers", options: ["Mine & géologie", "Traitement", "Maintenance", "Support"] }, { key: "level", label: "Niveau", options: LEVELS }, { key: "owner", label: "Responsable de la révision", options: ["Nadia Berrada", "Karim Tazi", "Imane Alaoui", "Hicham Lahlou"] }]}
        onRowClick={(r) => nav({ to: "/fiches-de-poste/$id", params: { id: r.id } })}
        cards={(r, q) => <Glass className="p-4"><div className="flex items-start justify-between gap-2"><div><p className="font-mono text-xs text-muted-foreground">{r.ref}</p><p className="font-semibold">{hl(r.title, q)}</p><p className="text-xs text-muted-foreground">{r.dept} · {r.site}</p></div><ScoreRing value={r.quality} size={36} animateIn={false} /></div><div className="mt-3 flex items-center justify-between"><StatusBadge label={r.status} /><span className="text-xs text-muted-foreground">{r.version}</span></div></Glass>}
        rowActions={(r) => [{ label: "Ouvrir", onClick: () => nav({ to: "/fiches-de-poste/$id", params: { id: r.id } }) }, { label: "Réviser avec l'IA", onClick: () => setRev(r) }, { label: "Envoyer en validation", onClick: () => setJobDescStatus(r.id, "En validation") }, { label: "Dupliquer", onClick: () => toast.success(`${r.ref} dupliquée`) }]}
        bulkActions={(ids, clear) => <><Button size="sm" className="bg-gold-gradient text-primary-foreground" onClick={() => { setBatch(ids); clear(); }}><Layers className="mr-1 h-4 w-4" />Standardiser en lot</Button><Button size="sm" variant="outline" onClick={() => { ids.forEach((id) => setJobDescStatus(id, "En validation")); clear(); }}>Envoyer en validation</Button></>}
      />
      <GenerateWizard open={gen} onOpenChange={setGen} />
      {rev && <ReviseDialog jd={rev === "pick" ? null : rev} onClose={() => setRev(null)} />}
      {batch && <BatchDialog ids={batch} onClose={() => setBatch(null)} />}
    </div>
  );
}

function GenerateWizard({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [f, setF] = useState({ title: "", dept: DEPTS[0], site: "Zgounder", reportsTo: "", level: "Technicien", context: "" });
  const [touched, setTouched] = useState(false);
  const [secs, setSecs] = useState<Record<string, string>>({});
  const [genIdx, setGenIdx] = useState(0);
  const [saved, setSaved] = useState<string | null>(null);
  useEffect(() => { if (step !== 2 || genIdx >= SECTIONS.length) return; const t = setTimeout(() => { setSecs((s) => ({ ...s, [SECTIONS[genIdx]]: genSection(f.title, SECTIONS[genIdx], f.site) })); setGenIdx(genIdx + 1); }, 450); return () => clearTimeout(t); }, [step, genIdx]); // eslint-disable-line
  useEffect(() => { if (open && f.title) { const t = setTimeout(() => setSaved(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })), 800); return () => clearTimeout(t); } }, [f, open]);
  const errs = step === 0 ? [!f.title.trim() && "L'intitulé est obligatoire", !f.reportsTo.trim() && "Le rattachement est obligatoire"].filter(Boolean) as string[] : [];
  const next = () => { setTouched(true); if (errs.length) return; setTouched(false); setStep(step + 1); };
  const close = () => { onOpenChange(false); setStep(0); setGenIdx(0); setSecs({}); };
  const steps = ["Informations", "Contexte", "Génération", "Récapitulatif"];
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && f.title && step < 3 && !confirm("Quitter sans enregistrer ? Le brouillon sera conservé.")) return; o ? onOpenChange(true) : close(); }}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-gold" />Générer une fiche de poste</DialogTitle><DialogDescription>{saved ? `Brouillon enregistré à ${saved}` : "Assistant en 4 étapes"}</DialogDescription></DialogHeader>
        <ol className="flex gap-2">{steps.map((s, i) => <li key={s} className="flex-1"><div className={cn("h-1 rounded-full", i <= step ? "bg-gold" : "bg-muted")} /><p className={cn("mt-1 text-xs", i === step ? "font-semibold text-foreground" : "text-muted-foreground")}>{i + 1}. {s}</p></li>)}</ol>
        {touched && errs.length > 0 && <div className="rounded-lg border border-danger/40 bg-danger/10 p-2 text-xs text-danger">{errs.map((e) => <p key={e}>• {e}</p>)}</div>}
        {step === 0 && <div className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2"><label className="text-xs font-medium">Intitulé du poste *</label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} onBlur={() => setTouched(true)} placeholder="ex. Ingénieur géotechnicien" aria-invalid={touched && !f.title} /></div>
          <div><label className="text-xs font-medium">Département</label><select className="w-full rounded-md border border-input bg-background px-2 py-2 text-sm" value={f.dept} onChange={(e) => setF({ ...f, dept: e.target.value })}>{DEPTS.map((d) => <option key={d}>{d}</option>)}</select></div>
          <div><label className="text-xs font-medium">Site</label><select className="w-full rounded-md border border-input bg-background px-2 py-2 text-sm" value={f.site} onChange={(e) => setF({ ...f, site: e.target.value })}>{SITES.map((d) => <option key={d}>{d}</option>)}</select></div>
          <div><label className="text-xs font-medium">Rattachement hiérarchique *</label><Input value={f.reportsTo} onChange={(e) => setF({ ...f, reportsTo: e.target.value })} onBlur={() => setTouched(true)} /></div>
          <div><label className="text-xs font-medium">Niveau</label><select className="w-full rounded-md border border-input bg-background px-2 py-2 text-sm" value={f.level} onChange={(e) => setF({ ...f, level: e.target.value })}>{LEVELS.map((d) => <option key={d}>{d}</option>)}</select></div>
        </div>}
        {step === 1 && <div className="space-y-3"><label className="text-xs font-medium">Missions clés en quelques mots</label><Textarea value={f.context} onChange={(e) => setF({ ...f, context: e.target.value })} maxLength={400} placeholder="ex. suivi de stabilité des galeries, instrumentation, rapports…" /><p className="text-right text-xs text-muted-foreground">{f.context.length}/400</p><label className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border p-4 text-sm text-muted-foreground">Importer une ancienne fiche (optionnel)<input type="file" className="sr-only" onChange={() => toast.success("Ancienne fiche importée")} /></label></div>}
        {step === 2 && <div className="space-y-3">{SECTIONS.map((s, i) => (
          <div key={s} className={cn("rounded-xl border border-border p-3 transition-opacity", i >= genIdx && "opacity-40")}>
            <div className="mb-1 flex items-center justify-between"><p className="text-sm font-semibold">{s}</p>{secs[s] && <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSecs({ ...secs, [s]: genSection(f.title, s, f.site) + " (version alternative)" })}><RefreshCw className="mr-1 h-3 w-3" />Régénérer</Button>}</div>
            {secs[s] ? (i === genIdx - 1 ? <p className="text-sm text-muted-foreground"><Typing text={secs[s]} /></p> : <Textarea value={secs[s]} onChange={(e) => setSecs({ ...secs, [s]: e.target.value })} className="text-sm" />) : <div className="h-4 w-2/3 rounded skeleton-shimmer" />}
          </div>))}<AiDisclaimer /></div>}
        {step === 3 && <div className="space-y-2 text-sm">{[["Informations", `${f.title} · ${f.dept} · ${f.site} · ${f.level}`, 0], ["Contexte", f.context || "—", 1], ["Sections générées", `${Object.keys(secs).length} / ${SECTIONS.length}`, 2]].map(([k, v, s]) => <div key={k as string} className="flex justify-between rounded-lg bg-muted/40 p-3"><div><p className="text-xs text-muted-foreground">{k}</p><p>{v}</p></div><button className="text-xs text-gold" onClick={() => setStep(s as number)}>Modifier</button></div>)}</div>}
        <DialogFooter>
          <Button variant="ghost" onClick={() => toast.success("Brouillon enregistré")}>Enregistrer le brouillon</Button>
          {step > 0 && <Button variant="outline" onClick={() => setStep(step - 1)}>Précédent</Button>}
          {step < 3 ? <Button onClick={next} disabled={step === 2 && genIdx < SECTIONS.length}>Suivant</Button> : <Button className="bg-gold-gradient text-primary-foreground" onClick={() => {
            const id = `FP-${String(jobDescs.length + 1).padStart(4, "0")}`;
            jobDescs.unshift({ id, ref: id, title: f.title, dept: f.dept, site: f.site, reportsTo: f.reportsTo, status: "En validation", version: "v1.0", modified: new Date().toISOString(), owner: "Samira Baroudi", quality: 91, family: "Support", level: f.level, holders: 0 });
            audit("Création de fiche de poste", id); emit(); close(); toast.success(`${id} envoyée en validation`, { action: { label: "Ouvrir", onClick: () => nav({ to: "/fiches-de-poste/$id", params: { id } }) } });
          }}>Envoyer en validation</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type Change = { sec: string; before: string; after: string; why: string; state: "pending" | "ok" | "ko" };
function ReviseDialog({ jd, onClose }: { jd: JobDesc | null; onClose: () => void }) {
  const [target, setTarget] = useState<JobDesc | null>(jd);
  const [changes, setChanges] = useState<Change[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => { if (!target) return; setLoading(true); const t = setTimeout(() => { setLoading(false); setChanges([
    { sec: "Mission principale", before: `Gérer les tâches du poste ${target.title}.`, after: genSection(target.title, "Mission principale", target.site), why: "Mission trop vague : ajout du périmètre, du site et de l'exigence HSE.", state: "pending" },
    { sec: "Exigences HSE et habilitations", before: "—", after: genSection(target.title, "Exigences HSE et habilitations"), why: "Section obligatoire du modèle AYA absente.", state: "pending" },
    { sec: "Indicateurs de performance", before: "Bon travail, respect des délais.", after: genSection(target.title, "Indicateurs de performance"), why: "Indicateurs non mesurables remplacés par des KPI quantifiables.", state: "pending" },
    { sec: "Conditions de travail", before: "Horaires normaux.", after: genSection(target.title, "Conditions de travail", target.site), why: "Précision de la rotation 3x8 applicable au site.", state: "pending" },
  ]); }, 1200); return () => clearTimeout(t); }, [target]);
  const accepted = changes.filter((c) => c.state === "ok").length;
  const after = target ? Math.min(98, target.quality + accepted * 8) : 0;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Wand2 className="h-4 w-4 text-gold" />Réviser avec l'IA</DialogTitle><DialogDescription>Standardisation selon le modèle AYA</DialogDescription></DialogHeader>
        {!target ? (
          <div className="space-y-3"><select className="w-full rounded-md border border-input bg-background px-2 py-2 text-sm" onChange={(e) => setTarget(jobDescs.find((j) => j.id === e.target.value) ?? null)} defaultValue=""><option value="" disabled>Choisir une fiche à réviser…</option>{jobDescs.filter((j) => j.status === "À réviser").map((j) => <option key={j.id} value={j.id}>{j.ref} · {j.title}</option>)}</select><p className="text-center text-xs text-muted-foreground">ou</p><Textarea placeholder="Collez une fiche de poste existante…" onBlur={(e) => e.target.value && setTarget(jobDescs.find((j) => j.status === "À réviser")!)} /></div>
        ) : loading ? (
          <div className="relative h-48 overflow-hidden rounded-xl border border-border p-4"><div className="scanline" style={{ animationIterationCount: "infinite" }} /><p className="text-sm text-muted-foreground">Analyse de {target.ref} en cours…</p></div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-around rounded-xl bg-muted/40 p-4">
              <div className="text-center"><ScoreRing value={target.quality} size={60} /><p className="mt-1 text-xs text-muted-foreground">Qualité avant</p></div>
              <span className="text-2xl text-gold">→</span>
              <div className="text-center"><ScoreRing value={after} size={60} key={after} /><p className="mt-1 text-xs text-muted-foreground">Qualité après</p></div>
              <Button variant="outline" onClick={() => setChanges(changes.map((c) => ({ ...c, state: "ok" })))}>Tout accepter</Button>
            </div>
            {changes.map((c, i) => (
              <div key={c.sec} className={cn("rounded-xl border p-3", c.state === "ok" ? "border-success/40" : c.state === "ko" ? "border-border opacity-60" : "border-border")}>
                <div className="mb-2 flex items-center justify-between"><p className="text-sm font-semibold">{c.sec}</p><div className="flex gap-1"><Button size="sm" variant={c.state === "ok" ? "default" : "outline"} className="h-7" onClick={() => setChanges(changes.map((x, j) => j === i ? { ...x, state: "ok" } : x))}><Check className="mr-1 h-3 w-3" />Accepter</Button><Button size="sm" variant="outline" className="h-7" onClick={() => setChanges(changes.map((x, j) => j === i ? { ...x, state: "ko" } : x))}><X className="mr-1 h-3 w-3" />Rejeter</Button></div></div>
                <div className="grid gap-2 text-sm md:grid-cols-2"><p className="rounded-lg bg-danger/10 p-2 line-through decoration-danger/60">{c.before}</p><p className="whitespace-pre-wrap rounded-lg bg-success/10 p-2">{c.after}</p></div>
                <p className="mt-2 flex items-start gap-1 text-xs text-muted-foreground"><AiBadge className="mr-1" />{c.why}</p>
              </div>
            ))}
            <AiDisclaimer />
          </div>
        )}
        <DialogFooter><Button variant="ghost" onClick={onClose}>Fermer</Button>{target && !loading && <Button disabled={!accepted} onClick={() => { target.quality = after; setJobDescStatus(target.id, "En validation"); onClose(); }}>Appliquer et envoyer en validation</Button>}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BatchDialog({ ids, onClose }: { ids: string[]; onClose: () => void }) {
  const [n, setN] = useState(0); const [queue, setQueue] = useState(0);
  useEffect(() => { if (n < ids.length) { const t = setTimeout(() => setN(n + 1), 350); return () => clearTimeout(t); } }, [n, ids.length]);
  const done = n >= ids.length; const items = ids.map((id) => jobDescs.find((j) => j.id === id)!);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Standardiser en lot</DialogTitle><DialogDescription>{ids.length} fiches sélectionnées</DialogDescription></DialogHeader>
        <p className="text-sm tnum">{n} / {ids.length} fiches traitées</p><Bar value={n} max={ids.length} />
        {done && <>
          <div className="grid grid-cols-3 gap-2 text-center">{[["Modifiées", ids.length], ["Problèmes détectés", Math.ceil(ids.length * 1.6)], ["Doublons", Math.floor(ids.length / 5)]].map(([k, v]) => <div key={k} className="rounded-lg bg-muted/40 p-3"><p className="text-2xl font-bold tnum">{v}</p><p className="text-xs text-muted-foreground">{k}</p></div>)}</div>
          {queue < items.length ? <div className="rounded-xl border border-border p-3"><p className="text-xs text-muted-foreground">File de revue · {queue + 1}/{items.length}</p><p className="font-semibold">{items[queue].ref} · {items[queue].title}</p><p className="text-xs text-muted-foreground">Qualité {items[queue].quality} → {Math.min(97, items[queue].quality + 24)}</p><div className="mt-2 flex gap-2"><Button size="sm" onClick={() => { items[queue].quality = Math.min(97, items[queue].quality + 24); setJobDescStatus(items[queue].id, "En validation"); setQueue(queue + 1); }}>Approuver</Button><Button size="sm" variant="outline" onClick={() => setQueue(queue + 1)}>Passer</Button></div></div> : <p className="text-sm text-success">File de revue terminée.</p>}
        </>}
      </DialogContent>
    </Dialog>
  );
}
export { DetailGrid };
