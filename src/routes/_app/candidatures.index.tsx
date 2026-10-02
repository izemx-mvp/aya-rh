import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Columns, LayoutList, Scale, SlidersHorizontal, Sparkles, Upload, UserPlus, GitCompare, ShieldCheck, Copy as CopyIcon, FileUp } from "lucide-react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DataTable, DetailGrid, hl, useUrlState, type Col } from "@/components/app/DataTable";
import { PageHeader, StatusBadge, ScoreRing, Avatar, AiDisclaimer, AiBadge, Glass, Bar, EASE } from "@/components/app/kit";
import { RefuseDialog, ScheduleDialog } from "@/components/cand/CandModals";
import { candidates, positions, posById, SOURCES, RECRUITERS, CRITERIA, recoOf, fmtDate, type Candidate, type CandStatus } from "@/data/mock";
import { setCandidateStatus, settings, useStore, emit } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/candidatures/")({
  head: () => ({ meta: [{ title: "Candidatures — AYA RH IA" }, { name: "description", content: "Pipeline de candidatures analysées par l'IA." }, { property: "og:title", content: "Candidatures — AYA RH IA" }, { property: "og:description", content: "312 candidatures analysées par l'IA." }] }),
  component: Page,
});

const STAGES: CandStatus[] = ["Nouvelle", "Présélectionnée", "Entretien", "Offre", "Recrutée", "Refusée", "Vivier"];
const weights: Record<string, number> = Object.fromEntries(CRITERIA.map((c) => [c.k, c.w]));
const wScore = (c: Candidate) => Math.round(c.criteria.reduce((a, k) => a + k.s * (weights[k.k] ?? 0), 0) / 100);
const isDefault = () => CRITERIA.every((c) => weights[c.k] === c.w);

function Page() {
  useStore();
  const nav = useNavigate();
  const { get, set } = useUrlState("c.");
  const view = get("mode") ?? "table";
  const [refuse, setRefuse] = useState<string[] | null>(null);
  const [schedule, setSchedule] = useState<string[] | null>(null);
  const [compare, setCompare] = useState<string[] | null>(null);
  const [grid, setGrid] = useState(false);
  const [batch, setBatch] = useState(false);
  const [imp, setImp] = useState(false);
  const [add, setAdd] = useState(false);
  useEffect(() => { const f = () => setAdd(true); window.addEventListener("aya:new", f); return () => window.removeEventListener("aya:new", f); }, []);

  const rows = useMemo(() => candidates.map((c) => (isDefault() ? c : Object.assign(c, { score: wScore(c), reco: recoOf(wScore(c)) }))), [useStore()]); // eslint-disable-line

  const cols: Col<Candidate>[] = [
    { key: "ref", header: "Référence", render: (r, q) => <span className="font-mono text-xs">{hl(r.ref, q)}</span> },
    { key: "name", header: "Candidat", width: 220, render: (r, q) => <div className="flex items-center gap-2"><Avatar name={r.name} size={30} /><div className="min-w-0"><p className="truncate font-medium">{hl(settings.viewAs ? "Candidat " + r.ref.slice(-4) : r.name, q)}{r.duplicate && <span className="ml-1 rounded bg-warning/15 px-1 text-[10px] text-warning">Doublon</span>}</p><p className="truncate text-xs text-muted-foreground">{r.currentJob}</p></div></div> },
    { key: "position", header: "Poste visé", value: (r) => posById(r.positionId).title, render: (r, q) => hl(posById(r.positionId).title, q) },
    { key: "site", header: "Site" },
    { key: "source", header: "Source", hidden: true },
    { key: "applied", header: "Dépôt", value: (r) => r.applied, render: (r) => <span className="tnum text-xs">{fmtDate(r.applied)}</span> },
    { key: "score", header: "Score IA", render: (r) => <ScoreRing value={r.score} size={34} animateIn={false} /> },
    { key: "reco", header: "Recommandation", render: (r) => <StatusBadge label={r.reco} /> },
    { key: "status", header: "Statut", render: (r) => <StatusBadge label={r.status} /> },
    { key: "recruiter", header: "Recruteur", hidden: true },
    { key: "lastActionDays", header: "Dernière action", render: (r) => <span className={cn("text-xs", r.status === "Nouvelle" && r.lastActionDays > 5 && "font-semibold text-danger")}>{r.lastAction} · {r.lastActionDays === 0 ? "aujourd'hui" : `il y a ${r.lastActionDays} j`}</span> },
  ];

  const filters = [
    { key: "position", label: "Poste", options: positions.map((p) => p.title), value: (r: Candidate) => posById(r.positionId).title },
    { key: "site", label: "Site", options: ["Zgounder", "Boumadine", "Marrakech", "Siège"] },
    { key: "status", label: "Statut", options: STAGES },
    { key: "score", label: "Score minimum", type: "range" as const, predicate: (r: Candidate, v: string) => r.score >= +v },
    { key: "reco", label: "Recommandation", options: ["Fortement recommandé", "Recommandé", "Sous réserve", "Non retenu"] },
    { key: "source", label: "Source", options: SOURCES },
    { key: "mobility", label: "Mobilité vers le site", type: "bool" as const, predicate: (r: Candidate) => r.mobility },
    { key: "recruiter", label: "Recruteur", options: RECRUITERS },
    { key: "stale", label: "Sans décision depuis plus de 5 jours", type: "bool" as const, predicate: (r: Candidate) => r.status === "Nouvelle" && r.lastActionDays > 5 },
  ];

  const onDrop = (id: string, to: CandStatus) => {
    if (to === "Refusée") setRefuse([id]); else if (to === "Entretien") setSchedule([id]); else setCandidateStatus([id], to);
  };

  return (
    <div>
      <PageHeader title="Candidatures" subtitle={`${candidates.length} candidatures · ${candidates.filter((c) => c.status === "Nouvelle").length} à décider · conversion globale 1,9 %`}
        actions={<>
          <div className="flex rounded-lg border border-border p-0.5">
            <Button size="sm" variant={view === "table" ? "secondary" : "ghost"} onClick={() => set({ mode: undefined })}><LayoutList className="mr-1 h-4 w-4" />Tableau</Button>
            <Button size="sm" variant={view === "kanban" ? "secondary" : "ghost"} onClick={() => set({ mode: "kanban" })}><Columns className="mr-1 h-4 w-4" />Pipeline</Button>
          </div>
          <Button variant="outline" size="sm" onClick={() => setGrid(true)}><SlidersHorizontal className="mr-1 h-4 w-4" />Grille de scoring</Button>
          <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" size="sm">Plus d'actions</Button></DropdownMenuTrigger>
            <DropdownMenuContent><DropdownMenuItem onClick={() => setImp(true)}><Upload className="mr-2 h-4 w-4" />Importer des CV</DropdownMenuItem><DropdownMenuItem onClick={() => setAdd(true)}><UserPlus className="mr-2 h-4 w-4" />Nouvelle candidature</DropdownMenuItem></DropdownMenuContent>
          </DropdownMenu>
          <Button className="bg-gold-gradient text-primary-foreground" onClick={() => setBatch(true)}><Sparkles className="mr-1 h-4 w-4" />Lancer l'analyse IA</Button>
        </>} />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-xs text-success"><ShieldCheck className="h-3.5 w-3.5" />Critères non discriminants (âge, genre, nom exclus du score)</span>
        {!isDefault() && <span className="inline-flex items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs text-gold">Grille personnalisée active</span>}
        <div className="flex-1"><AiDisclaimer /></div>
      </div>

      {view === "table" ? (
        <DataTable id="c" rows={rows} columns={cols} filters={filters} search={(r) => `${r.name} ${r.ref} ${posById(r.positionId).title} ${r.currentJob} ${r.source}`}
          onRowClick={(r) => nav({ to: "/candidatures/$id", params: { id: r.id } })}
          rowActions={(r) => [
            { label: "Ouvrir", onClick: () => nav({ to: "/candidatures/$id", params: { id: r.id } }) },
            { label: "Présélectionner", onClick: () => setCandidateStatus([r.id], "Présélectionnée") },
            { label: "Planifier un entretien", onClick: () => setSchedule([r.id]) },
            { label: "Ajouter au vivier", onClick: () => setCandidateStatus([r.id], "Vivier") },
            { label: "Refuser", onClick: () => setRefuse([r.id]), danger: true },
          ]}
          bulkActions={(ids, clear) => <>
            <Button size="sm" onClick={() => { setCandidateStatus(ids, "Présélectionnée"); clear(); }}>Présélectionner</Button>
            <Button size="sm" variant="outline" onClick={() => setSchedule(ids)}>Planifier des entretiens</Button>
            <Button size="sm" variant="outline" onClick={() => { setCandidateStatus(ids, "Vivier"); clear(); }}>Ajouter au vivier</Button>
            <Button size="sm" variant="outline" disabled={ids.length < 2 || ids.length > 3} onClick={() => setCompare(ids)}><GitCompare className="mr-1 h-4 w-4" />Comparer</Button>
            <DropdownMenu><DropdownMenuTrigger asChild><Button size="sm" variant="outline">Assigner</Button></DropdownMenuTrigger><DropdownMenuContent>{RECRUITERS.map((r) => <DropdownMenuItem key={r} onClick={() => { ids.forEach((id) => (candidates.find((c) => c.id === id)!.recruiter = r)); emit(); toast.success(`${ids.length} candidature(s) assignée(s) à ${r}`); clear(); }}>{r}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu>
            <Button size="sm" variant="destructive" onClick={() => setRefuse(ids)}>Refuser</Button>
          </>}
        />
      ) : <Kanban onDrop={onDrop} />}

      {refuse && <RefuseDialog ids={refuse} open onOpenChange={(o) => !o && setRefuse(null)} />}
      {schedule && <ScheduleDialog ids={schedule} open onOpenChange={(o) => !o && setSchedule(null)} />}
      {compare && <CompareDialog ids={compare} onClose={() => setCompare(null)} />}
      <ScoringGrid open={grid} onOpenChange={setGrid} />
      <BatchAnalysis open={batch} onOpenChange={setBatch} />
      <ImportDialog open={imp} onOpenChange={setImp} />
      <AddDialog open={add} onOpenChange={setAdd} />
    </div>
  );
}

function Kanban({ onDrop }: { onDrop: (id: string, s: CandStatus) => void }) {
  useStore();
  const nav = useNavigate();
  const [limit, setLimit] = useState<Record<string, number>>({});
  const [over, setOver] = useState<string | null>(null);
  const list = candidates.filter((c) => settings.site === "Tous" || c.site === settings.site);
  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {STAGES.map((s) => {
        const items = list.filter((c) => c.status === s).sort((a, b) => b.score - a.score); const n = limit[s] ?? 8;
        return (
          <div key={s} onDragOver={(e) => { e.preventDefault(); setOver(s); }} onDragLeave={() => setOver(null)} onDrop={(e) => { setOver(null); onDrop(e.dataTransfer.getData("id"), s); }}
            className={cn("glass flex w-72 shrink-0 flex-col rounded-2xl transition-shadow", over === s && "shadow-[var(--shadow-glow)]")}>
            <div className="flex items-center justify-between border-b border-border p-3"><StatusBadge label={s} /><span className="text-sm font-semibold tnum">{items.length}</span></div>
            <div className="max-h-[65vh] space-y-2 overflow-y-auto p-2">
              <AnimatePresence>
                {items.slice(0, n).map((c) => (
                  <motion.div layout key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} draggable onDragStart={(e: any) => e.dataTransfer.setData("id", c.id)}
                    onClick={() => nav({ to: "/candidatures/$id", params: { id: c.id } })} className="cursor-grab rounded-xl border border-border bg-card/70 p-3 hover:border-gold/40 active:cursor-grabbing">
                    <div className="flex items-center gap-2"><Avatar name={c.name} size={28} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{c.name}</p><p className="truncate text-xs text-muted-foreground">{posById(c.positionId).title}</p></div><ScoreRing value={c.score} size={30} animateIn={false} /></div>
                    <p className="mt-2 text-[11px] text-muted-foreground">{c.site} · {c.source}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
              {items.length > n && <Button variant="ghost" size="sm" className="w-full" onClick={() => setLimit({ ...limit, [s]: n + 20 })}>Charger plus · Voir tout ({items.length})</Button>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CompareDialog({ ids, onClose }: { ids: string[]; onClose: () => void }) {
  const cs = ids.map((id) => candidates.find((c) => c.id === id)!);
  const data = CRITERIA.map((k, i) => Object.fromEntries([["k", k.k], ...cs.map((c) => [c.name, c.criteria[i].s])]));
  const colors = ["var(--gold)", "var(--slate)", "var(--silver)"];
  const best = [...cs].sort((a, b) => b.score - a.score)[0];
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader><DialogTitle>Comparaison de candidats</DialogTitle><DialogDescription>Vue côte à côte des critères IA</DialogDescription></DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-72" role="img" aria-label="Radar des critères"><ResponsiveContainer><RadarChart data={data}><PolarGrid stroke="var(--border)" /><PolarAngleAxis dataKey="k" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />{cs.map((c, i) => <Radar key={c.id} dataKey={c.name} stroke={colors[i]} fill={colors[i]} fillOpacity={0.15} />)}<Legend /></RadarChart></ResponsiveContainer></div>
          <table className="text-sm"><thead><tr><th className="text-left text-xs text-muted-foreground">Critère</th>{cs.map((c) => <th key={c.id} className="text-left">{c.name.split(" ")[0]}</th>)}</tr></thead>
            <tbody>{CRITERIA.map((k, i) => { const m = Math.max(...cs.map((c) => c.criteria[i].s)); return <tr key={k.k} className="border-t border-border"><td className="py-1.5 text-xs">{k.k}</td>{cs.map((c) => <td key={c.id} className={cn("tnum", c.criteria[i].s === m && "font-bold text-gold")}>{c.criteria[i].s}</td>)}</tr>; })}
              <tr className="border-t border-border"><td className="py-1.5 text-xs font-semibold">Score global</td>{cs.map((c) => <td key={c.id} className={cn("tnum font-semibold", c === best && "text-gold")}>{c.score}</td>)}</tr></tbody></table>
        </div>
        <div className="rounded-lg border border-gold/25 bg-gold/5 p-3 text-sm"><AiBadge className="mr-2" />Verdict : <b>{best.name}</b> présente le meilleur équilibre, notamment en {best.criteria.sort((a, b) => b.s - a.s)[0].k.toLowerCase()}. Les autres profils restent pertinents pour un second entretien.</div>
        <AiDisclaimer />
      </DialogContent>
    </Dialog>
  );
}

function ScoringGrid({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [w, setW] = useState({ ...weights });
  const total = Object.values(w).reduce((a, b) => a + b, 0);
  const adjust = (k: string, v: number) => {
    const others = Object.keys(w).filter((x) => x !== k); const rest = 100 - v; const sumO = others.reduce((a, x) => a + w[x], 0) || 1;
    const n: Record<string, number> = { [k]: v }; let acc = 0;
    others.forEach((x, i) => { n[x] = i === others.length - 1 ? rest - acc : Math.round((w[x] / sumO) * rest); acc += n[x]; });
    setW(n);
  };
  const preview = [...candidates].filter((c) => c.status !== "Refusée").map((c) => ({ c, s: Math.round(c.criteria.reduce((a, k) => a + k.s * (w[k.k] ?? 0), 0) / 100) })).sort((a, b) => b.s - a.s).slice(0, 8);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Scale className="h-4 w-4 text-gold" />Grille de scoring</DialogTitle><DialogDescription>Total fixé à 100 % · le classement se met à jour en direct</DialogDescription></DialogHeader>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">{Object.entries(w).map(([k, v]) => <div key={k}><div className="mb-1 flex justify-between text-sm"><span>{k}</span><span className="tnum font-semibold text-gold">{v} %</span></div><Slider value={[v]} max={60} step={1} onValueChange={([x]) => adjust(k, x)} aria-label={k} /></div>)}<p className={cn("text-xs", total === 100 ? "text-success" : "text-danger")}>Total : {total} %</p></div>
          <ul className="space-y-1">{preview.map(({ c, s }, i) => <motion.li layout transition={{ duration: 0.4, ease: EASE }} key={c.id} className="flex items-center gap-2 rounded-lg bg-muted/40 px-2 py-1.5 text-sm"><span className="w-5 text-xs text-muted-foreground tnum">{i + 1}</span><span className="flex-1 truncate">{c.name}</span><span className="tnum font-semibold">{s}</span></motion.li>)}</ul>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => { CRITERIA.forEach((c) => (weights[c.k] = c.w)); candidates.forEach((c) => { c.score = wScore(c); c.reco = recoOf(c.score); }); setW({ ...weights }); emit(); toast("Grille réinitialisée"); }}>Réinitialiser</Button>
          <Button onClick={() => { Object.assign(weights, w); candidates.forEach((c) => { c.score = wScore(c); c.reco = recoOf(c.score); }); emit(); onOpenChange(false); toast.success("Grille enregistrée comme grille de scoring du poste"); }}>Enregistrer comme grille de scoring</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BatchAnalysis({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [pos, setPos] = useState(""); const [n, setN] = useState(-1);
  const list = candidates.filter((c) => !pos || c.positionId === pos);
  useEffect(() => { if (n < 0 || n >= list.length) return; const t = setTimeout(() => setN(Math.min(list.length, n + Math.ceil(list.length / 40))), 60); return () => clearTimeout(t); }, [n, list.length]);
  const ranking = list.slice(0, Math.max(0, n)).sort((a, b) => b.score - a.score).slice(0, 6);
  const done = n >= list.length;
  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setN(-1); }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-gold" />Analyse IA des CV</DialogTitle><DialogDescription>Choisissez un poste puis lancez l'analyse.</DialogDescription></DialogHeader>
        {n < 0 ? (
          <div className="space-y-4"><select value={pos} onChange={(e) => setPos(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="">Tous les postes ({candidates.length} CV)</option>{positions.map((p) => <option key={p.id} value={p.id}>{p.title} · {p.site} ({candidates.filter((c) => c.positionId === p.id).length} CV)</option>)}</select><Button className="w-full bg-gold-gradient text-primary-foreground" onClick={() => setN(0)}>Lancer l'analyse</Button></div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm"><span className="tnum font-semibold">{n} / {list.length} CV analysés</span>{done && <StatusBadge label="Terminé" />}</div>
            <Bar value={n} max={list.length} />
            <div className="grid gap-3 md:grid-cols-2">
              <div className="relative h-48 overflow-hidden rounded-xl border border-border bg-card/60 p-4">{!done && <div className="scanline" style={{ animationIterationCount: "infinite" }} />}{Array.from({ length: 9 }).map((_, i) => <div key={i} className="mb-2 h-2 rounded bg-muted" style={{ width: `${50 + ((i * 37) % 50)}%` }} />)}</div>
              <ul className="space-y-1.5">{ranking.map((c, i) => <motion.li layout key={c.id} className="flex items-center gap-2 text-sm"><span className="w-4 text-xs text-muted-foreground">{i + 1}</span><Avatar name={c.name} size={24} /><span className="flex-1 truncate">{c.name}</span><ScoreRing value={c.score} size={28} /></motion.li>)}</ul>
            </div>
            {done && <Glass className="p-4 text-sm"><p className="font-semibold">Résumé</p><p className="mt-1 text-muted-foreground">{list.filter((c) => c.score >= 80).length} fortement recommandés · {list.filter((c) => c.score >= 68 && c.score < 80).length} recommandés · {list.filter((c) => c.score < 52).length} non retenus.</p></Glass>}
            <AiDisclaimer />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [files, setFiles] = useState<string[]>([]); const [parsed, setParsed] = useState(0);
  useEffect(() => { if (parsed < files.length) { const t = setTimeout(() => setParsed(parsed + 1), 450); return () => clearTimeout(t); } }, [parsed, files.length]);
  const pick = (list: FileList | null) => { if (!list) return; setFiles([...list].map((f) => f.name)); setParsed(0); };
  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setFiles([]); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Importer des CV</DialogTitle><DialogDescription>PDF, DOCX — plusieurs fichiers acceptés.</DialogDescription></DialogHeader>
        <label onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files); }} className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gold/40 p-8 text-center hover:bg-gold/5">
          <FileUp className="h-8 w-8 text-gold" /><span className="text-sm">Glissez vos fichiers ici ou cliquez pour parcourir</span>
          <input type="file" multiple className="sr-only" onChange={(e) => pick(e.target.files)} />
        </label>
        {files.length === 0 && <Button variant="outline" onClick={() => { setFiles(["cv_hamza_amzil.pdf", "cv_salma_rami.pdf", "cv_omar_tahiri.docx", "cv_salma_rami (1).pdf"]); setParsed(0); }}>Utiliser des CV d'exemple</Button>}
        <ul className="space-y-1 text-sm">{files.map((f, i) => <li key={i} className="flex items-center justify-between"><span className="truncate">{f}</span>{i < parsed ? (f.includes("(1)") ? <StatusBadge label="Doublon détecté" tone="warning" /> : <StatusBadge label="Analysé" tone="success" />) : <span className="text-xs text-muted-foreground">Analyse…</span>}</li>)}</ul>
        {files.length > 0 && parsed === files.length && <p className="rounded-lg bg-muted/50 p-3 text-xs">Rapport : {files.filter((f) => !f.includes("(1)")).length} CV importés, {files.filter((f) => f.includes("(1)")).length} doublon(s) ignoré(s).</p>}
        <DialogFooter><Button disabled={parsed < files.length || !files.length} onClick={() => { onOpenChange(false); toast.success("CV importés dans la file « Nouvelle »"); }}>Terminer</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [touched, setTouched] = useState(false);
  const errs = [!name.trim() && "Le nom est obligatoire", !/^\S+@\S+\.\S+$/.test(email) && "Email invalide"].filter(Boolean) as string[];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Nouvelle candidature</DialogTitle><DialogDescription>Ajout manuel avec CV</DialogDescription></DialogHeader>
        {touched && errs.length > 0 && <div className="rounded-lg border border-danger/40 bg-danger/10 p-2 text-xs text-danger">{errs.map((e) => <p key={e}>• {e}</p>)}</div>}
        <div className="space-y-3">
          <div><label className="text-xs font-medium">Nom complet *</label><Input value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setTouched(true)} aria-invalid={touched && !name} /></div>
          <div><label className="text-xs font-medium">Email *</label><Input value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setTouched(true)} /></div>
          <div><label className="text-xs font-medium">Poste</label><select className="w-full rounded-md border border-input bg-background px-2 py-2 text-sm">{positions.map((p) => <option key={p.id}>{p.title}</option>)}</select></div>
          <label className="flex items-center gap-2 rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground"><CopyIcon className="h-4 w-4" />Joindre le CV<input type="file" className="sr-only" /></label>
        </div>
        <DialogFooter><Button onClick={() => { setTouched(true); if (errs.length) return; onOpenChange(false); toast.success(`Candidature de ${name} créée — analyse IA en cours`); setName(""); setEmail(""); setTouched(false); }}>Créer</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { DetailGrid };
