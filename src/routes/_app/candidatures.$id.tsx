import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Download, EyeOff, Gem, Send, UserCheck, X, ZoomIn, ZoomOut, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { PageHeader, StatusBadge, ScoreRing, Avatar, AiDisclaimer, AiBadge, Glass, Bar, Typing, EASE } from "@/components/app/kit";
import { RefuseDialog, ScheduleDialog, OfferDialog, NotesBox } from "@/components/cand/CandModals";
import { candidates, posById, fmtDate, interviews, candDocs, candMessages, propositions, empById } from "@/data/mock";
import { acceptProposition, setPropositionStatus, informOthers } from "@/lib/actions";
import { JobChain, PersonTimeline } from "@/components/app/Links";
import { setCandidateStatus, useStore } from "@/lib/store";
import { exportPdf } from "@/lib/pdf";

export const Route = createFileRoute("/_app/candidatures/$id")({
  head: () => ({ meta: [{ title: "Candidature — AYA RH IA" }, { name: "description", content: "Détail de candidature et analyse IA." }, { property: "og:title", content: "Candidature — AYA RH IA" }, { property: "og:description", content: "Analyse IA détaillée du candidat." }] }),
  loader: ({ params }) => { if (!candidates.find((c) => c.id === params.id)) throw notFound(); },
  component: Page,
});

const SKILLS = ["Géologie minière", "Modélisation 3D (Leapfrog)", "Échantillonnage", "Sécurité HSE", "Gestion d'équipe", "AutoCAD", "Excel avancé"];

function Page() {
  useStore();
  const { id } = Route.useParams();
  const c = candidates.find((x) => x.id === id)!;
  const pos = posById(c.positionId);
  const [anon, setAnon] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [page, setPage] = useState(1);
  const [refuse, setRefuse] = useState(false);
  const [sched, setSched] = useState(false);
  const [offer, setOffer] = useState(false);
  const name = anon ? `Candidat ${c.ref.slice(-4)}` : c.name;
  const missing = c.score < 70 ? ["Certification travail en hauteur", "Anglais technique B2"] : ["Anglais technique B2"];
  const explanation = `${name} obtient ${c.score}/100 pour le poste ${pos.title}. Le profil se distingue par ${c.experience} ans d'expérience dont une partie en environnement minier, et une bonne maîtrise des compétences techniques clés. ${c.mobility ? `La mobilité vers ${pos.site} est confirmée.` : `La mobilité vers ${pos.site} reste à confirmer.`} Points à approfondir en entretien : ${missing.join(", ").toLowerCase()}.`;
  const ivs = interviews.filter((i) => i.candId === c.id);
  const prop = propositions.find((p) => p.candId === c.id);
  const emp = c.employeeId ? empById(c.employeeId) : undefined;
  const others = candidates.filter((x) => x.demandeId === c.demandeId && x.id !== c.id && ["Nouvelle", "Présélectionnée", "Entretien"].includes(x.status)).length;

  return (
    <div>
      <PageHeader title={name} crumbs={[{ label: "Candidatures", to: "/candidatures" }, { label: c.ref }]} subtitle={`${c.ref} · ${pos.title} · ${pos.site}`}
        actions={<>
          <label className="flex items-center gap-2 text-xs"><EyeOff className="h-4 w-4" />Anonymiser<Switch checked={anon} onCheckedChange={setAnon} /></label>
          <Button variant="outline" size="sm" onClick={() => setCandidateStatus([c.id], "Présélectionnée")}><UserCheck className="mr-1 h-4 w-4" />Présélectionner</Button>
          <Button variant="outline" size="sm" onClick={() => setSched(true)}><Calendar className="mr-1 h-4 w-4" />Entretien</Button>
          <Button variant="outline" size="sm" onClick={() => setCandidateStatus([c.id], "Vivier")}><Gem className="mr-1 h-4 w-4" />Vivier</Button>
          <Button variant="outline" size="sm" onClick={() => exportPdf(`Synthèse candidat ${c.ref}`, [["Candidat", `${name} — ${pos.title} (${pos.site})`], ["Score IA", `${c.score}/100 — ${c.reco}`], ["Explication", explanation], ["Avertissement", "L'analyse IA est une aide à la décision. La décision finale appartient aux RH."]])}><Download className="mr-1 h-4 w-4" />Télécharger</Button>
          <Button variant="destructive" size="sm" onClick={() => setRefuse(true)}><X className="mr-1 h-4 w-4" />Refuser</Button>
          <Button size="sm" className="bg-gold-gradient text-primary-foreground" onClick={() => setOffer(true)}><Send className="mr-1 h-4 w-4" />Envoyer une proposition d'embauche</Button>
        </>} />

      <JobChain demandeId={c.demandeId} current={c.status === "Recrutée" ? "Recrutement" : c.status === "Offre" ? "Proposition" : c.status === "Entretien" ? "Entretiens" : "Candidatures"} />
      {c.status === "Offre" && <Glass className="mb-5 flex flex-wrap items-center gap-3 border border-gold/40 p-4 text-sm"><span className="flex-1">Proposition d'embauche {prop?.id} envoyée · <b>{prop?.status}</b></span><Button size="sm" className="bg-gold-gradient text-primary-foreground" onClick={() => acceptProposition(c.id)}><CheckCircle2 className="mr-1 h-4 w-4" />Marquer comme acceptée</Button><Button size="sm" variant="outline" onClick={() => setPropositionStatus(c.id, "Négociation")}>En négociation</Button><Button size="sm" variant="outline" className="text-danger" onClick={() => setPropositionStatus(c.id, "Refusée")}>Refusée</Button></Glass>}
      {c.status === "Recrutée" && <Glass className="mb-5 flex flex-wrap items-center gap-3 border border-success/40 p-4 text-sm"><CheckCircle2 className="h-5 w-5 text-success" /><span className="flex-1">Recruté(e){emp && <> — dossier <Link to="/employes/$id" params={{ id: emp.id }} className="text-gold hover:underline">{emp.matricule}</Link> · {emp.status}</>}</span>{others > 0 && <Button size="sm" variant="outline" onClick={() => informOthers(c.demandeId!)}>Informer les {others} autres candidats</Button>}</Glass>}
      <Glass className="mb-5 flex flex-wrap items-center gap-5 p-5">
        {anon ? <div className="h-16 w-16 rounded-full bg-muted" /> : <Avatar name={c.name} size={64} />}
        <div className="flex-1"><p className="text-lg font-semibold">{name}</p><p className="text-sm text-muted-foreground">{c.currentJob}{!anon && ` · ${c.city} · ${c.age} ans`}</p><div className="mt-2 flex flex-wrap gap-2"><StatusBadge label={c.status} /><StatusBadge label={c.reco} />{c.duplicate && <StatusBadge label="Doublon potentiel" tone="warning" />}<Link to="/candidatures" search={{ "c.f_position": pos.title } as any} className="text-xs text-gold hover:underline">Voir le poste {pos.title} →</Link></div></div>
        <div className="text-center"><ScoreRing value={c.score} size={84} stroke={7} /><p className="mt-1 text-xs text-muted-foreground">Score IA</p></div>
      </Glass>

      <div className="grid gap-5 xl:grid-cols-[1fr_1.1fr]">
        {/* CV viewer */}
        <Glass className="p-4">
          <div className="mb-3 flex items-center justify-between text-sm"><span className="font-semibold">CV · page {page}/2</span><div className="flex gap-1"><Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setZoom(Math.max(0.7, zoom - 0.1))} aria-label="Zoom arrière"><ZoomOut className="h-4 w-4" /></Button><Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setZoom(Math.min(1.4, zoom + 0.1))} aria-label="Zoom avant"><ZoomIn className="h-4 w-4" /></Button><Button size="sm" variant="ghost" onClick={() => setPage(page === 1 ? 2 : 1)}>Page {page === 1 ? 2 : 1}</Button></div></div>
          <div className="relative max-h-[70vh] overflow-auto rounded-xl bg-[oklch(0.97_0.004_85)] p-8 text-[oklch(0.25_0.01_260)]">
            <div className="scanline" />
            <div style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }} className="space-y-4 text-sm">
              {page === 1 ? <>
                <div><p className="text-2xl font-bold">{name}</p><p>{c.currentJob.split(" · ")[0]}{!anon && ` — ${c.city} — ${c.email}`}</p></div>
                <div><p className="border-b font-semibold uppercase tracking-wider">Expérience</p><p className="mt-2"><b>{c.currentJob}</b> — {c.experience} ans</p><p>Supervision des opérations, <mark className="bg-[oklch(0.85_0.12_85)] px-0.5">{SKILLS[0]}</mark>, <mark className="bg-[oklch(0.85_0.12_85)] px-0.5">{SKILLS[2]}</mark>, reporting de production et respect des normes <mark className="bg-[oklch(0.85_0.12_85)] px-0.5">{SKILLS[3]}</mark>.</p><p className="mt-2"><b>Technicien junior</b> — 2 ans</p><p>Utilisation d'<mark className="bg-[oklch(0.85_0.12_85)] px-0.5">{SKILLS[5]}</mark> et d'<mark className="bg-[oklch(0.85_0.12_85)] px-0.5">{SKILLS[6]}</mark>.</p></div>
                <div><p className="border-b font-semibold uppercase tracking-wider">Formation</p><p className="mt-2">Diplôme d'ingénieur — École Nationale de l'Industrie Minérale, Rabat</p></div>
              </> : <>
                <div><p className="border-b font-semibold uppercase tracking-wider">Certifications</p><p className="mt-2">Secourisme SST (2024) · Conduite d'engins</p><p className="mt-1 rounded bg-[oklch(0.9_0.08_25)] px-1">Manquant : {missing.join(" · ")}</p></div>
                <div><p className="border-b font-semibold uppercase tracking-wider">Langues</p><p className="mt-2">Arabe, Amazigh, Français courant, Anglais intermédiaire</p></div>
              </>}
            </div>
          </div>
          <p className="mt-2 flex gap-4 text-xs text-muted-foreground"><span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-gold" />Compétences correspondantes</span><span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-danger" />Exigences manquantes</span></p>
        </Glass>

        <Glass className="p-4">
          <Tabs defaultValue="ai">
            <TabsList className="flex-wrap"><TabsTrigger value="ai">Analyse IA</TabsTrigger><TabsTrigger value="path">Parcours</TabsTrigger><TabsTrigger value="int">Entretiens</TabsTrigger><TabsTrigger value="notes">Notes</TabsTrigger><TabsTrigger value="msg">Messages</TabsTrigger><TabsTrigger value="hist">Historique</TabsTrigger><TabsTrigger value="docs">Documents</TabsTrigger></TabsList>
            <TabsContent value="ai" className="space-y-5 pt-3">
              <div className="flex items-center gap-2"><AiBadge /><span className="text-sm font-semibold">Détail des critères</span></div>
              <div className="space-y-3">{c.criteria.map((k, i) => (
                <motion.div key={k.k} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.12, ease: EASE }}>
                  <div className="mb-1 flex justify-between text-sm"><span>{k.k} <span className="text-xs text-muted-foreground">· poids {k.w} %</span></span><span className="tnum font-semibold">{k.s}</span></div>
                  <Bar value={k.s} tone={k.s >= 75 ? "success" : k.s >= 55 ? "gold" : "danger"} />
                </motion.div>))}</div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-success/25 bg-success/5 p-3"><p className="mb-1 flex items-center gap-1 text-sm font-semibold text-success"><CheckCircle2 className="h-4 w-4" />Points forts</p><ul className="list-disc pl-4 text-sm"><li>{c.experience} ans d'expérience terrain</li><li>Maîtrise de {SKILLS[0].toLowerCase()}</li><li>Culture sécurité affirmée</li></ul></div>
                <div className="rounded-xl border border-warning/25 bg-warning/5 p-3"><p className="mb-1 flex items-center gap-1 text-sm font-semibold text-warning"><AlertTriangle className="h-4 w-4" />Points d'attention</p><ul className="list-disc pl-4 text-sm">{missing.map((m) => <li key={m}>{m}</li>)}{c.experience > 10 && <li>Interruption de 8 mois (2021)</li>}</ul></div>
              </div>
              <div><p className="mb-1 text-sm font-semibold">Explication du score</p><p className="text-sm text-muted-foreground"><Typing text={explanation} /></p></div>
              <div><p className="mb-1 text-sm font-semibold">Questions d'entretien suggérées</p><ol className="list-decimal space-y-1 pl-4 text-sm"><li>Décrivez une situation où vous avez dû arrêter une opération pour raison de sécurité.</li><li>Comment organisez-vous le travail en rotation 3x8 à {pos.site} ?</li><li>Quelle est votre expérience de {SKILLS[1]} ?</li></ol></div>
              <AiDisclaimer />
            </TabsContent>
            <TabsContent value="path" className="pt-3"><ol className="relative space-y-4 border-l border-border pl-5 text-sm">{[["2019 – aujourd'hui", c.currentJob], ["2016 – 2019", "Technicien junior · Société minière"], ["2016", "Diplôme d'ingénieur — ENIM Rabat"], ["2024", "Certification Secourisme SST"]].map(([d, t]) => <li key={d}><span className="absolute -left-1.5 mt-1 h-3 w-3 rounded-full bg-gold" /><p className="text-xs text-muted-foreground">{d}</p><p>{t}</p></li>)}</ol></TabsContent>
            <TabsContent value="int" className="pt-3">{ivs.length ? ivs.map((i) => <div key={i.id} className="flex items-center justify-between border-b border-border py-2 text-sm"><span>{i.type} · {fmtDate(i.date)} {i.hour}</span><StatusBadge label={i.status} /></div>) : <p className="text-sm text-muted-foreground">Aucun entretien. <button className="text-gold underline" onClick={() => setSched(true)}>Planifier</button></p>}</TabsContent>
            <TabsContent value="notes" className="pt-3"><NotesBox /></TabsContent>
            <TabsContent value="msg" className="space-y-2 pt-3 text-sm">{(candMessages[c.id] ?? []).map((m, i) => <div key={i} className="rounded-lg border border-gold/20 bg-gold/5 p-3"><p className="text-xs text-muted-foreground">{m.title} · {fmtDate(m.when)}</p>{m.body}</div>)}<div className="rounded-lg bg-muted/40 p-3"><p className="text-xs text-muted-foreground">Accusé de réception · {fmtDate(c.applied)}</p>Merci pour votre candidature au poste de {pos.title}.</div></TabsContent>
            <TabsContent value="hist" className="pt-3"><PersonTimeline id={c.id} /><ul className="hidden" data-x="space-y-2 text-sm">{[[fmtDate(c.applied), "Candidature déposée via " + c.source], [fmtDate(c.applied), "CV analysé par l'IA — score " + c.score], ["Récemment", c.lastAction]].map(([d, t], i) => <li key={i} className="flex gap-3"><span className="w-28 shrink-0 text-xs text-muted-foreground">{d}</span>{t}</li>)}</ul></TabsContent>
            <TabsContent value="docs" className="pt-3 text-sm">{(candDocs[c.id] ?? []).map((d, i) => <div key={"g" + i} className="flex items-center justify-between border-b border-border py-2"><span>{d.t} <span className="text-xs text-muted-foreground">· {d.v} · {fmtDate(d.d)}</span></span><StatusBadge label={d.s} /></div>)}{["CV.pdf", "Lettre de motivation.pdf", "Diplôme.pdf"].map((d) => <div key={d} className="flex items-center justify-between border-b border-border py-2">{d}<Button size="sm" variant="ghost" onClick={() => exportPdf(d.replace(".pdf", ""), [["Document", `${d} — ${name}`]])}>Télécharger</Button></div>)}</TabsContent>
          </Tabs>
        </Glass>
      </div>
      <RefuseDialog ids={[c.id]} open={refuse} onOpenChange={setRefuse} />
      <ScheduleDialog ids={[c.id]} open={sched} onOpenChange={setSched} />
      <OfferDialog id={c.id} open={offer} onOpenChange={setOffer} />
    </div>
  );
}
