import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Area, AreaChart, Bar as RBar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Sparkles, Clock, BellOff, Check, Settings2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { KpiCard, Section, Typing, AiBadge, Stagger, staggerItem, EASE } from "@/components/app/kit";
import { Pagination } from "@/components/app/DataTable";
import { KPI, candidates, positions, employees, SITES, SITE_COUNTS, DEPTS, interviews, jobDescs, departures } from "@/data/mock";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Tableau de bord — AYA RH IA" }, { name: "description", content: "Vue d'ensemble RH : recrutement, effectif, formation, HSE." }, { property: "og:title", content: "Tableau de bord — AYA RH IA" }, { property: "og:description", content: "Pilotage RH augmenté par l'IA." }] }),
  component: Page,
});

const tip = { contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }, labelStyle: { color: "var(--foreground)" } };
const FEED = ["L'IA vient d'analyser 12 CV pour le poste Ingénieur Géologue", "Fiche FP-0031 standardisée : qualité 62 → 89", "3 habilitations « Travail en hauteur » arrivent à échéance", "Nouveau candidat fortement recommandé : Technicien maintenance", "Résumé IA généré pour l'entretien ENT-004", "Anomalie détectée : heures sup. inhabituelles (Zgounder, équipe C)", "Plan de formation : 2 sessions proposées pour combler un écart HSE"];
type W = { id: string; label: string; on: boolean };

function Page() {
  useStore();
  const [period, setPeriod] = useState("30 jours");
  const [feed, setFeed] = useState(() => FEED.slice(0, 4).map((t, i) => ({ id: i, t, when: `il y a ${i * 7 + 2} min` })));
  const [feedAll, setFeedAll] = useState(false); const [fp, setFp] = useState(1);
  const [custom, setCustom] = useState(false);
  const [widgets, setWidgets] = useState<W[]>(() => { try { return JSON.parse(sessionStorage.getItem("aya-widgets")!) ?? null; } catch { return null; } } ?? [{ id: "kpi", label: "Indicateurs clés", on: true }, { id: "todo", label: "À traiter aujourd'hui", on: true }, { id: "charts", label: "Graphiques", on: true }, { id: "feed", label: "Activité IA", on: true }]);
  useEffect(() => { sessionStorage.setItem("aya-widgets", JSON.stringify(widgets)); }, [widgets]);
  useEffect(() => { let k = 4; const id = setInterval(() => { setFeed((f) => [{ id: Date.now(), t: FEED[k++ % FEED.length], when: "à l'instant" }, ...f].slice(0, 30)); }, 6000); return () => clearInterval(id); }, []);
  const [todo, setTodo] = useState([
    { k: "12 candidatures sans décision depuis plus de 5 jours", n: 12, owner: "Salma Idrissi", to: "/candidatures", search: { "c.f_stale": "1" } },
    { k: "Entretiens sans compte rendu", n: interviews.filter((i) => i.status === "Réalisé" && !i.report).length, owner: "Karim Tazi", to: "/entretiens", search: {} },
    { k: "Fiches en attente de validation", n: jobDescs.filter((j) => j.status === "En validation").length, owner: "Mme Baroudi", to: "/fiches-de-poste", search: { "fp.f_status": "En validation" } },
    { k: "Demandes de poste à valider", n: 5, owner: "Mme Baroudi", to: "/demandes-de-poste", search: {} },
    { k: "Habilitations expirées", n: KPI.habs.expired, owner: "Responsable HSE", to: "/habilitations", search: {} },
  ]);
  const date = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const mult = { "7 jours": 0.3, "30 jours": 1, trimestre: 2.6, "année": 9 }[period] ?? 1;
  const weekly = Array.from({ length: 10 }, (_, i) => ({ s: `S${i + 1}`, Candidatures: Math.round((22 + Math.sin(i) * 8 + i * 1.5) * Math.min(mult, 1.5)) }));
  const funnel = [["Candidatures", 312], ["Analysées IA", 312], ["Présélectionnées", 74], ["Entretiens", 28], ["Offres", 9], ["Recrutés", 6]] as const;
  const bySite = SITES.map((s) => ({ site: s, Candidats: candidates.filter((c) => c.site === s).length, Cible: SITE_COUNTS[s] + Math.round(SITE_COUNTS[s] * 0.04), Affecté: employees.filter((e) => e.site === s).length }));
  const byDept = DEPTS.map((d) => ({ d: d.split(" ")[0], Postes: positions.filter((p) => p.dept === d).length })).filter((x) => x.Postes);
  const turn = Array.from({ length: 12 }, (_, i) => ({ m: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"][i], Départs: [3, 4, 2, 5, 4, 3, 6, 4, 3, 4, 3, 3][i] }));
  const on = (id: string) => widgets.find((w) => w.id === id)?.on;

  const blocks: Record<string, React.ReactNode> = {
    kpi: (
      <Stagger className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {[
          <KpiCard key={1} label="Postes ouverts" value={KPI.openPositions} trend={9} to="/offres" />,
          <KpiCard key={2} label="Candidatures" value={KPI.applications} trend={14} to="/candidatures" />,
          <KpiCard key={3} label="Présélectionnées" value={KPI.shortlisted} trend={6} to="/candidatures" search={{ "c.f_status": "Présélectionnée" }} />,
          <KpiCard key={4} label="Entretiens à venir" value={interviews.filter((i) => i.status !== "Réalisé").length} to="/entretiens" />,
          <KpiCard key={5} label="Fiches révisées" value={KPI.fp.revised} sub="/ 148" ring={Math.round((KPI.fp.revised / 148) * 100)} to="/fiches-de-poste" />,
          <KpiCard key={6} label="Délai moyen recrutement" value={KPI.avgDays} suffix=" j" trend={-8} to="/rapports" />,
          <KpiCard key={7} label="Effectif" value={KPI.effectif} trend={2} to="/employes" />,
          <KpiCard key={8} label="Budget formation consommé" value={KPI.training.consumed} suffix=" %" to="/formation" />,
          <KpiCard key={9} label="Habilitations expirant" value={KPI.habs.expiring} sub="sous 60 j" to="/habilitations" />,
          <KpiCard key={10} label="Entretiens annuels" value={KPI.reviews.done} sub="/ 600" ring={Math.round((412 / 600) * 100)} to="/entretiens-annuels" />,
          <KpiCard key={11} label="Intégrations en cours" value={KPI.onboarding} to="/integration" />,
          <KpiCard key={12} label="Turnover 12 mois" value={7.4} decimals={1} suffix=" %" trend={-1} to="/turnover" />,
        ].map((k, i) => <motion.div key={i} variants={staggerItem}>{k}</motion.div>)}
      </Stagger>
    ),
    todo: (
      <Section title="À traiter aujourd'hui" action={<span className="text-xs text-muted-foreground">{todo.length} éléments</span>}>
        <ul className="divide-y divide-border">
          <AnimatePresence>{todo.map((t) => (
            <motion.li key={t.k} layout exit={{ opacity: 0, x: 40 }} className="flex flex-wrap items-center gap-3 py-2.5">
              <span className="flex h-8 w-10 items-center justify-center rounded-lg bg-gold/15 font-bold text-gold tnum">{t.n}</span>
              <div className="min-w-0 flex-1"><p className="text-sm font-medium">{t.k}</p><p className="text-xs text-muted-foreground">Responsable : {t.owner}</p></div>
              <Button size="sm" variant="ghost" aria-label="Reporter" onClick={() => setTodo(todo.filter((x) => x !== t))}><BellOff className="h-4 w-4" /></Button>
              <Button size="sm" variant="ghost" aria-label="Marquer fait" onClick={() => setTodo(todo.filter((x) => x !== t))}><Check className="h-4 w-4" /></Button>
              <Button size="sm" asChild><Link to={t.to as any} search={t.search as any}>Traiter</Link></Button>
            </motion.li>))}</AnimatePresence>
          {todo.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">Tout est traité. Belle journée !</li>}
        </ul>
      </Section>
    ),
    charts: (
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Section title="Entonnoir de recrutement" action={<Link to="/candidatures" className="text-xs text-gold">Voir le détail</Link>}>
          <div className="space-y-2" role="img" aria-label="Entonnoir : 312 candidatures, 312 analysées, 74 présélectionnées, 28 entretiens, 9 offres, 6 recrutés">
            {funnel.map(([l, v], i) => <div key={l} className="flex items-center gap-3"><span className="w-28 text-xs text-muted-foreground">{l}</span><div className="flex-1"><motion.div className="flex h-7 items-center justify-end rounded-md bg-gold-gradient pr-2 text-xs font-bold text-primary-foreground" initial={{ width: 0 }} animate={{ width: `${Math.max(8, (v / 312) * 100)}%` }} transition={{ duration: 0.9, delay: i * 0.12, ease: EASE }}>{v}</motion.div></div></div>)}
            <p className="pt-1 text-xs text-muted-foreground">Conversion globale 1,9 %</p>
          </div>
        </Section>
        <Section title="Candidatures par semaine" action={<Link to="/rapports" className="text-xs text-gold">Voir le détail</Link>}>
          <div className="h-56" role="img" aria-label="Évolution hebdomadaire des candidatures"><ResponsiveContainer><AreaChart data={weekly}><defs><linearGradient id="ga" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--gold)" stopOpacity={0.5} /><stop offset="1" stopColor="var(--gold)" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="s" stroke="var(--muted-foreground)" fontSize={11} /><YAxis stroke="var(--muted-foreground)" fontSize={11} /><Tooltip {...tip} /><Area dataKey="Candidatures" stroke="var(--gold)" fill="url(#ga)" strokeWidth={2} /></AreaChart></ResponsiveContainer></div>
        </Section>
        <Section title="Candidats par site" action={<Link to="/candidatures" className="text-xs text-gold">Voir le détail</Link>}>
          <div className="h-56" role="img" aria-label="Répartition des candidats par site"><ResponsiveContainer><BarChart data={bySite}><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="site" stroke="var(--muted-foreground)" fontSize={11} /><YAxis stroke="var(--muted-foreground)" fontSize={11} /><Tooltip {...tip} /><RBar dataKey="Candidats" fill="var(--slate)" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </Section>
        <Section title="Effectif cible vs affecté" action={<Link to="/employes" className="text-xs text-gold">Voir le détail</Link>}>
          <div className="h-56" role="img" aria-label="Effectif cible et affecté par site"><ResponsiveContainer><BarChart data={bySite}><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="site" stroke="var(--muted-foreground)" fontSize={11} /><YAxis stroke="var(--muted-foreground)" fontSize={11} /><Tooltip {...tip} /><Legend wrapperStyle={{ fontSize: 11 }} /><RBar dataKey="Cible" fill="var(--silver)" radius={[4, 4, 0, 0]} /><RBar dataKey="Affecté" fill="var(--gold)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </Section>
        <Section title="Postes ouverts par département" action={<Link to="/offres" className="text-xs text-gold">Voir le détail</Link>}>
          <div className="h-56" role="img" aria-label="Postes ouverts par département"><ResponsiveContainer><BarChart data={byDept} layout="vertical"><XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} allowDecimals={false} /><YAxis type="category" dataKey="d" stroke="var(--muted-foreground)" fontSize={11} width={90} /><Tooltip {...tip} /><RBar dataKey="Postes" fill="var(--chart-4)" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer></div>
        </Section>
        <Section title="Départs (12 mois)" action={<Link to="/turnover" className="text-xs text-gold">Voir le détail</Link>}>
          <div className="h-56" role="img" aria-label={`${departures.length} départs sur 12 mois, turnover 7,4 %`}><ResponsiveContainer><LineChart data={turn}><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="m" stroke="var(--muted-foreground)" fontSize={11} /><YAxis stroke="var(--muted-foreground)" fontSize={11} /><Tooltip {...tip} /><Line dataKey="Départs" stroke="var(--danger)" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div>
        </Section>
      </div>
    ),
    feed: (
      <Section title="Activité IA en direct" action={<Button size="sm" variant="ghost" onClick={() => setFeedAll(true)}>Voir tout</Button>}>
        <ul className="space-y-2">
          <AnimatePresence initial={false}>{feed.slice(0, 5).map((f) => <motion.li key={f.id} layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-3 rounded-lg p-2 hover:bg-accent/40"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-gold" /><span className="flex-1 text-sm">{f.t}</span><span className="text-xs text-muted-foreground">{f.when}</span></motion.li>)}</AnimatePresence>
        </ul>
      </Section>
    ),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm capitalize text-muted-foreground">{date}</p>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Bonjour <span className="text-gold-gradient">Mme Baroudi</span></h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground"><AiBadge /><Typing text="12 candidatures attendent une décision, 9 habilitations sont expirées et 31 fiches de poste sont en validation." /></p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border p-0.5">{["7 jours", "30 jours", "trimestre", "année"].map((p) => <Button key={p} size="sm" variant={period === p ? "secondary" : "ghost"} onClick={() => setPeriod(p)} className="capitalize">{p}</Button>)}</div>
          <Button variant="outline" size="sm" onClick={() => setCustom(true)}><Settings2 className="mr-1 h-4 w-4" />Personnaliser</Button>
        </div>
      </div>
      {widgets.filter((w) => w.on).map((w) => <div key={w.id}>{blocks[w.id]}</div>)}

      <Sheet open={feedAll} onOpenChange={setFeedAll}>
        <SheetContent className="glass w-full sm:max-w-lg"><SheetHeader><SheetTitle>Activité IA</SheetTitle><SheetDescription>{feed.length} événements</SheetDescription></SheetHeader>
          <ul className="mt-4 space-y-2">{feed.slice((fp - 1) * 10, fp * 10).map((f) => <li key={f.id} className="flex gap-2 border-b border-border py-2 text-sm"><Clock className="mt-0.5 h-4 w-4 text-muted-foreground" /><span className="flex-1">{f.t}</span><span className="text-xs text-muted-foreground">{f.when}</span></li>)}</ul>
          <Pagination page={fp} pages={Math.max(1, Math.ceil(feed.length / 10))} size={10} total={feed.length} onPage={setFp} onSize={() => {}} sizes={[10]} />
        </SheetContent>
      </Sheet>
      <Dialog open={custom} onOpenChange={setCustom}>
        <DialogContent><DialogHeader><DialogTitle>Personnaliser le tableau de bord</DialogTitle><DialogDescription>Glissez pour réordonner, activez ou masquez les widgets.</DialogDescription></DialogHeader>
          <Reorder.Group axis="y" values={widgets} onReorder={setWidgets} className="space-y-2">{widgets.map((w) => <Reorder.Item key={w.id} value={w} className={cn("flex cursor-grab items-center gap-3 rounded-lg border border-border bg-card p-3", !w.on && "opacity-50")}><GripVertical className="h-4 w-4 text-muted-foreground" /><span className="flex-1 text-sm">{w.label}</span><Switch checked={w.on} onCheckedChange={(v) => setWidgets(widgets.map((x) => x.id === w.id ? { ...x, on: v } : x))} /></Reorder.Item>)}</Reorder.Group>
        </DialogContent>
      </Dialog>
    </div>
  );
}
export { on as _unused };
var on: any;
