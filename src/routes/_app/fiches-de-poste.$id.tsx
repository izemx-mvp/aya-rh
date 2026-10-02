import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Download, Archive, Pencil, Check, MessageSquare, History, Send, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PageHeader, StatusBadge, ScoreRing, Glass, Avatar, AiDisclaimer } from "@/components/app/kit";
import { DetailGrid } from "@/components/app/DataTable";
import { jobDescs, employees, positions, fmtDate, jobRequests, jobAds, ficheCerts, candidates } from "@/data/mock";
import { RelatedItems, JobChain } from "@/components/app/Links";
import { setJobDescStatus, useStore } from "@/lib/store";
import { exportPdf } from "@/lib/pdf";
import { genSection, SECTIONS } from "./fiches-de-poste.index";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/fiches-de-poste/$id")({
  head: () => ({ meta: [{ title: "Fiche de poste — AYA RH IA" }, { name: "description", content: "Détail, versions et validation de la fiche de poste." }, { property: "og:title", content: "Fiche de poste — AYA RH IA" }, { property: "og:description", content: "Détail de la fiche de poste." }] }),
  loader: ({ params }) => { if (!jobDescs.find((j) => j.id === params.id)) throw notFound(); },
  component: Page,
});

const content: Record<string, Record<string, string>> = {};

function Page() {
  useStore();
  const { id } = Route.useParams();
  const search = Route.useSearch() as any;
  const j = jobDescs.find((x) => x.id === id)!;
  content[id] ??= Object.fromEntries(SECTIONS.map((s) => [s, genSection(j.title, s, j.site)]));
  const [edit, setEdit] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [comments, setComments] = useState<Record<string, string[]>>({ "Mission principale": ["Karim Tazi : préciser le périmètre géographique."] });
  const [cmtOpen, setCmtOpen] = useState<string | null>(null);
  const [cmt, setCmt] = useState("");
  const [cmp, setCmp] = useState<boolean>(!!search.compare);
  const [archive, setArchive] = useState(false);
  const [confirmTxt, setConfirmTxt] = useState("");
  const holders = employees.filter((e) => e.job === j.title.split(" (")[0]).slice(0, 3);
  const openPos = positions.find((p) => p.fpId === j.id);
  const stepIdx = j.status === "Révisée" ? 3 : j.status === "En validation" ? 1 : 0;

  return (
    <div>
      <PageHeader title={j.title} crumbs={[{ label: "Fiches de poste", to: "/fiches-de-poste" }, { label: j.ref }]} subtitle={`${j.ref} · ${j.version} · ${j.dept} · ${j.site}`}
        actions={<>
          <Button variant="outline" size="sm" onClick={() => exportPdf(`Fiche de poste ${j.ref} — ${j.title}`, SECTIONS.map((s) => [s, content[id][s]] as [string, string]), `${j.ref}.pdf`)}><Download className="mr-1 h-4 w-4" />Export PDF</Button>
          <Button variant="outline" size="sm" onClick={() => toast.success(`${j.ref} dupliquée en brouillon`)}><Copy className="mr-1 h-4 w-4" />Dupliquer</Button>
          <Button variant="outline" size="sm" onClick={() => setArchive(true)}><Archive className="mr-1 h-4 w-4" />Archiver</Button>
          {j.status !== "Révisée" && <Button size="sm" className="bg-gold-gradient text-primary-foreground" onClick={() => setJobDescStatus(j.id, j.status === "À réviser" ? "En validation" : "Révisée")}><Check className="mr-1 h-4 w-4" />{j.status === "À réviser" ? "Envoyer en validation" : "Approuver"}</Button>}
        </>} />
      {(() => { const d = jobRequests.find((x) => x.ficheId === j.id && x.status === "Publiée"); return d ? <JobChain demandeId={d.id} current="Fiche" /> : null; })()}
      {jobAds.some((a) => a.status === "En ligne" && jobRequests.find((d) => d.id === a.demandeId)?.ficheId === j.id && a.ficheVersion !== j.version) && <p className="mb-4 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm text-warning">La fiche a été mise à jour depuis la création de l'annonce — l'annonce et la grille de scoring liées affichent « Critères différents de la fiche ».</p>}
      <div className="mb-5"><RelatedItems items={[
        ...jobRequests.filter((d) => d.ficheId === j.id).map((d) => ({ group: "Demandes de poste", ref: d.id, label: `${d.title} · ${d.site}`, status: d.status, to: "/demandes-de-poste?dp.mode=table" })),
        ...jobAds.filter((a) => jobRequests.find((d) => d.id === a.demandeId)?.ficheId === j.id).map((a) => ({ group: "Annonces", ref: a.id, label: a.title, status: a.status, to: "/offres" })),
        ...candidates.filter((c) => jobRequests.find((d) => d.id === c.demandeId)?.ficheId === j.id && c.status !== "Refusée").slice(0, 8).map((c) => ({ group: "Candidatures actives", ref: c.ref, label: c.name, status: c.status, to: `/candidatures/${c.id}` })),
        ...employees.filter((e) => e.ficheId === j.id && e.status !== "Parti").map((e) => ({ group: "Titulaires", ref: e.matricule, label: e.name, status: e.status, to: `/employes/${e.id}` })),
        ...(ficheCerts[j.id] ?? []).map((t) => ({ group: "Habilitations requises", ref: t, to: "/habilitations" })),
      ]} /></div>
      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="space-y-3">
          {SECTIONS.map((s) => (
            <Glass key={s} className="p-4">
              <div className="mb-2 flex items-center justify-between"><h2 className="font-semibold">{s}</h2>
                <div className="flex gap-1"><Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Commentaires" onClick={() => setCmtOpen(cmtOpen === s ? null : s)}><MessageSquare className="h-3.5 w-3.5" />{comments[s]?.length ? <span className="ml-0.5 text-[10px]">{comments[s].length}</span> : null}</Button><Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Modifier" onClick={() => { setEdit(s); setDraft(content[id][s]); }}><Pencil className="h-3.5 w-3.5" /></Button></div></div>
              {edit === s ? <div className="space-y-2"><Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={4} /><div className="flex gap-2"><Button size="sm" onClick={() => { content[id][s] = draft; setEdit(null); toast.success("Section enregistrée", { action: { label: "Annuler", onClick: () => {} } }); }}>Enregistrer</Button><Button size="sm" variant="ghost" onClick={() => setEdit(null)}>Annuler</Button></div></div> : <p className="whitespace-pre-wrap text-sm text-muted-foreground">{content[id][s]}</p>}
              {cmtOpen === s && <div className="mt-3 space-y-2 border-t border-border pt-3">{(comments[s] ?? []).map((c, i) => <p key={i} className="rounded bg-muted/50 p-2 text-xs">{c}</p>)}<div className="flex gap-2"><Input value={cmt} onChange={(e) => setCmt(e.target.value)} placeholder="Ajouter un commentaire…" className="h-8" /><Button size="sm" onClick={() => { if (!cmt) return; setComments({ ...comments, [s]: [...(comments[s] ?? []), `Mme Baroudi : ${cmt}`] }); setCmt(""); }}>Envoyer</Button></div></div>}
            </Glass>
          ))}
        </div>
        <div className="space-y-4">
          <Glass className="p-4"><div className="flex items-center justify-between"><StatusBadge label={j.status} /><ScoreRing value={j.quality} size={52} /></div><div className="mt-4"><DetailGrid items={[["Rattachement", j.reportsTo], ["Niveau", j.level], ["Famille", j.family], ["Propriétaire", j.owner], ["Modifiée", fmtDate(j.modified)], ["Titulaires", j.holders]]} /></div><div className="mt-3"><AiDisclaimer /></div></Glass>
          <Glass className="p-4"><h3 className="mb-3 font-semibold">Circuit de validation</h3><ol className="space-y-3">{["Manager", "RH", "Direction"].map((s, i) => <li key={s} className="flex items-center gap-3"><span className={cn("flex h-7 w-7 items-center justify-center rounded-full text-xs", i < stepIdx ? "bg-success/20 text-success" : i === stepIdx && j.status !== "Révisée" ? "bg-warning/20 text-warning" : "bg-muted text-muted-foreground")}>{i < stepIdx ? <Check className="h-3.5 w-3.5" /> : i + 1}</span><div className="flex-1 text-sm"><p>{s}</p><p className="text-xs text-muted-foreground">{i < stepIdx ? "Approuvé · il y a " + (5 - i) + " j" : i === stepIdx && j.status !== "Révisée" ? "En attente" : "—"}</p></div></li>)}</ol>
            {j.status === "En validation" && <div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => toast.success("Relance envoyée au valideur")}><Send className="mr-1 h-3 w-3" />Relancer</Button><Button size="sm" variant="outline" onClick={() => setJobDescStatus(j.id, "À réviser")}><Undo2 className="mr-1 h-3 w-3" />Renvoyer pour correction</Button></div>}
          </Glass>
          <Glass className="p-4"><h3 className="mb-3 flex items-center gap-2 font-semibold"><History className="h-4 w-4" />Historique des versions</h3><ul className="space-y-2 text-sm">{[j.version, "v1.2", "v1.0"].map((v, i) => <li key={i} className="flex items-center justify-between"><span>{v} <span className="text-xs text-muted-foreground">· {i === 0 ? "actuelle" : `il y a ${i * 4} mois`}</span></span>{i > 0 && <span className="flex gap-1"><Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setCmp(true)}>Comparer</Button><Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => toast.success(`${v} restaurée`)}>Restaurer</Button></span>}</li>)}</ul></Glass>
          <Glass className="p-4"><h3 className="mb-3 font-semibold">Éléments liés</h3><div className="space-y-2 text-sm"><Link to="/organigramme" className="block text-gold hover:underline">Case dans l'organigramme →</Link>{openPos ? <Link to="/candidatures" search={{ "c.f_position": openPos.title } as any} className="block text-gold hover:underline">Poste ouvert : {openPos.title} →</Link> : <p className="text-muted-foreground">Aucun poste ouvert</p>}{holders.map((h) => <Link key={h.id} to="/employes/$id" params={{ id: h.id }} className="flex items-center gap-2 hover:text-gold"><Avatar name={h.name} size={24} />{h.name}</Link>)}</div></Glass>
        </div>
      </div>
      <Dialog open={cmp} onOpenChange={setCmp}>
        <DialogContent className="max-w-4xl"><DialogHeader><DialogTitle>Comparaison</DialogTitle><DialogDescription>{search.compare ? `${j.ref} vs ${search.compare} — 86 % de similarité` : `${j.version} vs v1.2`}</DialogDescription></DialogHeader>
          <div className="grid max-h-[60vh] gap-3 overflow-y-auto md:grid-cols-2">{SECTIONS.slice(0, 5).map((s) => <div key={s} className="contents"><div className="rounded-lg bg-muted/40 p-2 text-xs"><b>{s}</b><p>{content[id][s]}</p></div><div className="rounded-lg bg-muted/40 p-2 text-xs"><b>{s}</b><p>{content[id][s].replace(/garantit/, "assure").replace(/Planifier/, "Organiser")}</p></div></div>)}</div>
        </DialogContent>
      </Dialog>
      <Dialog open={archive} onOpenChange={setArchive}>
        <DialogContent><DialogHeader><DialogTitle>Archiver {j.ref}</DialogTitle><DialogDescription>Tapez « {j.ref} » pour confirmer.</DialogDescription></DialogHeader><Input value={confirmTxt} onChange={(e) => setConfirmTxt(e.target.value)} /><DialogFooter><Button variant="destructive" disabled={confirmTxt !== j.ref} onClick={() => { setArchive(false); toast.success(`${j.ref} archivée`, { action: { label: "Annuler", onClick: () => {} } }); }}>Archiver</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  );
}
