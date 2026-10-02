import { applyReorg } from "@/lib/actions";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ZoomIn, ZoomOut, Maximize, Shuffle, Save, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ModulePage, meta } from "@/components/app/Module";
import { StatusBadge, Glass, Avatar, confetti } from "@/components/app/kit";
import { DEPTS, DEPT_COUNTS, employees, jobDescs, positions } from "@/data/mock";
import { exportPdf } from "@/lib/pdf";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/organigramme")({ head: () => meta("Organigramme", "Organigramme interactif et simulation de réorganisation."), component: Page });

type Node = { id: string; title: string; holder: string; head: number; vacancy: boolean; fp: string; fpId: string; parent: string | null };
const DIRS: Record<string, string> = { "Production minière": "DOP", "Usines de traitement": "DOP", Maintenance: "DOP", "Géologie & exploration": "DOP", HSE: "DG", Logistique: "DOP", "Approvisionnement & achats": "DAF", "Finance & comptabilité": "DAF", RH: "DG", "IT & services généraux": "DAF", Direction: "DG" };
const base = (): Node[] => [
  { id: "DG", title: "Direction générale Maroc", holder: employees.find((e) => e.dept === "Direction")!.name, head: 600, vacancy: false, fp: "Révisée", fpId: "FP-0001", parent: null },
  { id: "DOP", title: "Direction des opérations", holder: employees.filter((e) => e.dept === "Direction")[1].name, head: 450, vacancy: false, fp: "Révisée", fpId: "FP-0002", parent: "DG" },
  { id: "DAF", title: "Direction administrative et financière", holder: employees.filter((e) => e.dept === "Direction")[2].name, head: 90, vacancy: false, fp: "En validation", fpId: "FP-0004", parent: "DG" },
  ...DEPTS.filter((d) => d !== "Direction").map((d, i) => { const fp = jobDescs.find((j) => j.dept === d)!; return { id: d, title: d, holder: employees.find((e) => e.dept === d && /Chef|Responsable|Ingénieur|DRH/.test(e.job))?.name ?? "—", head: DEPT_COUNTS[d], vacancy: positions.some((p) => p.dept === d), fp: fp.status, fpId: fp.id, parent: DIRS[d] }; }),
];

function Page() {
  const [nodes, setNodes] = useState<Node[]>(base);
  const [zoom, setZoom] = useState(1); const [pan, setPan] = useState({ x: 0, y: 0 }); const drag = useRef<{ x: number; y: number } | null>(null);
  const [sel, setSel] = useState<Node | null>(null);
  const [sim, setSim] = useState(false); const [q, setQ] = useState("");
  const [scen, setScen] = useState<Record<string, Node[]>>({}); const [apply, setApply] = useState(false);
  const orig = base();
  const moved = nodes.filter((n) => orig.find((o) => o.id === n.id)?.parent !== n.parent);
  const kids = (id: string | null) => nodes.filter((n) => n.parent === id);
  const card = (n: Node) => (
    <div draggable={sim} onDragStart={(e) => e.dataTransfer.setData("id", n.id)} onDragOver={(e) => sim && e.preventDefault()} onDrop={(e) => { const id = e.dataTransfer.getData("id"); if (id && id !== n.id) setNodes(nodes.map((x) => x.id === id ? { ...x, parent: n.id } : x)); }}
      onClick={() => setSel(n)} className={cn("glass w-52 cursor-pointer rounded-xl p-3 text-left transition-shadow hover:shadow-[var(--shadow-glow)]", q && n.title.toLowerCase().includes(q.toLowerCase()) && "ring-2 ring-gold", moved.includes(n) && "ring-2 ring-info", sim && "cursor-grab")}>
      <p className="truncate text-sm font-semibold">{n.title}</p><p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground"><Avatar name={n.holder} size={18} />{n.holder}</p>
      <div className="mt-2 flex items-center justify-between text-xs"><span className="tnum">{n.head} pers.</span>{n.vacancy && <StatusBadge label="Poste vacant" tone="warning" />}</div>
      <div className="mt-1"><StatusBadge label={`Fiche ${n.fp.toLowerCase()}`} tone={n.fp === "Révisée" ? "success" : n.fp === "En validation" ? "warning" : "danger"} /></div>
    </div>
  );
  const tree = (id: string | null): React.ReactNode => kids(id).map((n) => (
    <li key={n.id} className="flex flex-col items-center px-2"><div className="h-4 w-px bg-border" />{card(n)}{kids(n.id).length > 0 && <><div className="h-4 w-px bg-border" /><ul className="flex border-t border-border pt-0">{tree(n.id)}</ul></>}</li>
  ));
  return (
    <ModulePage title="Organigramme" subtitle="AYA Gold & Silver — Maroc"
      actions={[{ label: sim ? "Quitter la simulation" : "Mode simulation", primary: true, run: () => { setSim(!sim); if (sim) setNodes(base()); } }, { label: "Exporter PDF", run: () => exportPdf("Organigramme AYA Maroc", nodes.map((n) => [n.title, `Titulaire : ${n.holder} · Effectif : ${n.head} · Rattachement : ${n.parent ?? "—"}`])) }, { label: "Exporter PNG", run: () => toast.success("Organigramme exporté en PNG") }]}>
      <div className="flex flex-wrap items-center gap-2">
        <Input placeholder="Rechercher une unité…" value={q} onChange={(e) => setQ(e.target.value)} className="h-9 max-w-xs" />
        <Button size="icon" variant="outline" onClick={() => setZoom(Math.min(1.6, zoom + 0.1))} aria-label="Zoom avant"><ZoomIn className="h-4 w-4" /></Button>
        <Button size="icon" variant="outline" onClick={() => setZoom(Math.max(0.4, zoom - 0.1))} aria-label="Zoom arrière"><ZoomOut className="h-4 w-4" /></Button>
        <Button size="icon" variant="outline" onClick={() => { setZoom(0.7); setPan({ x: 0, y: 0 }); }} aria-label="Ajuster à l'écran"><Maximize className="h-4 w-4" /></Button>
        {sim && <><Button size="sm" variant="outline" onClick={() => { const k = `Scénario ${String.fromCharCode(65 + Object.keys(scen).length)}`; setScen({ ...scen, [k]: nodes }); toast.success(`${k} enregistré`); }}><Save className="mr-1 h-4 w-4" />Enregistrer le scénario</Button>{Object.keys(scen).map((k) => <Button key={k} size="sm" variant="ghost" onClick={() => setNodes(scen[k])}>{k}</Button>)}<Button size="sm" onClick={() => setApply(true)} disabled={!moved.length}><Shuffle className="mr-1 h-4 w-4" />Appliquer le scénario</Button></>}
      </div>
      {sim && <Glass className="grid gap-3 p-4 sm:grid-cols-4">{[["Postes concernés", moved.length], ["Fiches à réviser", moved.length * 3], ["Collaborateurs impactés", moved.reduce((a, n) => a + n.head, 0)], ["Managers sans équipe", nodes.filter((n) => n.parent && !["DG"].includes(n.id) && kids(n.id).length === 0 && ["DOP", "DAF"].includes(n.id)).length]].map(([k, v]) => <div key={k as string}><p className="text-2xl font-bold tnum">{v}</p><p className="text-xs text-muted-foreground">{k}</p></div>)}<p className="text-xs text-muted-foreground sm:col-span-4">Glissez une unité sur un autre responsable pour simuler un rattachement. Avant/après : les unités déplacées sont encadrées en bleu.</p></Glass>}
      <div className="glass relative h-[65vh] cursor-move overflow-hidden rounded-2xl" onMouseDown={(e) => (drag.current = { x: e.clientX - pan.x, y: e.clientY - pan.y })} onMouseMove={(e) => drag.current && setPan({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y })} onMouseUp={() => (drag.current = null)} onMouseLeave={() => (drag.current = null)} onWheel={(e) => setZoom(Math.max(0.4, Math.min(1.6, zoom - e.deltaY * 0.001)))}>
        <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "top center" }} className="absolute left-0 right-0 top-6 flex justify-center transition-transform duration-75"><ul className="flex">{tree(null)}</ul></div>
        <div className="absolute bottom-3 right-3 h-20 w-32 rounded-lg border border-border bg-card/80 p-1" aria-label="Mini-carte"><div className="h-full w-full rounded bg-muted/50"><div className="h-6 w-10 rounded border border-gold" style={{ transform: `translate(${44 - pan.x / 20}px, ${20 - pan.y / 20}px)` }} /></div></div>
      </div>
      <Sheet open={!!sel} onOpenChange={(o) => !o && setSel(null)}><SheetContent className="glass">{sel && <><SheetHeader><SheetTitle>{sel.title}</SheetTitle><SheetDescription>{sel.head} collaborateurs</SheetDescription></SheetHeader><div className="mt-4 space-y-3 text-sm"><p className="flex items-center gap-2"><Avatar name={sel.holder} size={32} />{sel.holder}</p><Link to="/fiches-de-poste/$id" params={{ id: sel.fpId }} className="block text-gold hover:underline">Fiche de poste {sel.fpId} →</Link>{positions.filter((p) => p.dept === sel.id).map((p) => <Link key={p.id} to="/candidatures" search={{ "c.f_position": p.title } as any} className="block text-gold hover:underline">Poste ouvert : {p.title} →</Link>)}<p className="font-semibold">Rattachements directs</p>{kids(sel.id).map((k) => <p key={k.id}>• {k.title}</p>)}{!kids(sel.id).length && <p className="text-muted-foreground">Aucun</p>}</div></>}</SheetContent></Sheet>
      <Dialog open={apply} onOpenChange={setApply}><DialogContent><DialogHeader><DialogTitle>Appliquer le scénario ?</DialogTitle><DialogDescription>Les fiches suivantes seront marquées « À réviser » :</DialogDescription></DialogHeader><ul className="text-sm">{moved.map((m) => <li key={m.id}>• {m.fpId} — {m.title}</li>)}</ul><DialogFooter><Button onClick={() => { setApply(false); applyReorg(Math.max(6, moved.length)); }}>Confirmer</Button></DialogFooter></DialogContent></Dialog>
    </ModulePage>
  );
}
export { Download };
