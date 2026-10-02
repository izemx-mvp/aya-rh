import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Columns3, Download, Filter,
  MoreHorizontal, RefreshCw, Rows3, Search, Bookmark, X, ExternalLink, LayoutGrid, Table2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { settings, useStore } from "@/lib/store";
import { exportCsv } from "@/lib/pdf";
import { EmptyState } from "./kit";
import { toast } from "sonner";

export type Col<T> = { key: string; header: string; render?: (r: T, q: string) => ReactNode; value?: (r: T) => any; sortable?: boolean; hidden?: boolean; className?: string; width?: number };
export type FilterDef<T> = { key: string; label: string; options?: string[]; type?: "select" | "range" | "bool"; value?: (r: T) => any; predicate?: (r: T, v: string) => boolean; max?: number };
export type RowAction = { label: string; onClick: () => void; danger?: boolean };

export function hl(text: any, q: string): ReactNode {
  const s = String(text ?? "");
  if (!q) return s;
  const i = s.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return s;
  return <>{s.slice(0, i)}<mark className="rounded bg-gold/30 px-0.5 text-foreground">{s.slice(i, i + q.length)}</mark>{s.slice(i + q.length)}</>;
}

/** URL-backed state helper (namespaced per table) */
export function useUrlState(ns: string) {
  const search = useRouterState({ select: (s) => s.location.search as Record<string, any> });
  const navigate = useNavigate();
  const get = (k: string) => { const v = search[`${ns}${k}`]; return v === undefined ? undefined : String(v); };
  const set = (patch: Record<string, string | number | undefined | null>) =>
    navigate({ to: ".", replace: true, search: (prev: any) => { const n = { ...prev }; for (const [k, v] of Object.entries(patch)) { const kk = `${ns}${k}`; if (v === undefined || v === null || v === "") delete n[kk]; else n[kk] = v; } return n; } } as any);
  return { search, get, set };
}

const savedViews: Record<string, { name: string; search: Record<string, any> }[]> = {};

export function Pagination({ page, pages, size, total, onPage, onSize, sizes = [10, 25, 50, 100] }: { page: number; pages: number; size: number; total: number; onPage: (p: number) => void; onSize: (s: number) => void; sizes?: number[] }) {
  const [go, setGo] = useState("");
  const [err, setErr] = useState(false);
  const from = total === 0 ? 0 : (page - 1) * size + 1; const to = Math.min(total, page * size);
  const nums: (number | "…")[] = [];
  for (let p = 1; p <= pages; p++) { if (p === 1 || p === pages || Math.abs(p - page) <= 1) nums.push(p); else if (nums[nums.length - 1] !== "…") nums.push("…"); }
  return (
    <nav aria-label="Pagination" tabIndex={0} onKeyDown={(e) => { if (e.key === "ArrowRight" && page < pages) onPage(page + 1); if (e.key === "ArrowLeft" && page > 1) onPage(page - 1); }}
      className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm">
      <div className="flex items-center gap-3 text-muted-foreground">
        <span className="tnum">Affichage {from}–{to} sur {total.toLocaleString("fr-FR")} résultats</span>
        <select aria-label="Lignes par page" value={size} onChange={(e) => onSize(+e.target.value)} className="rounded-md border border-input bg-background px-2 py-1 text-xs">
          {sizes.map((s) => <option key={s} value={s}>{s} / page</option>)}
        </select>
      </div>
      {pages > 1 && (
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" className="h-8 w-8" disabled={page === 1} onClick={() => onPage(1)} aria-label="Première page"><ChevronsLeft className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" disabled={page === 1} onClick={() => onPage(page - 1)} aria-label="Page précédente"><ChevronLeft className="h-4 w-4" /></Button>
          {nums.map((n, i) => n === "…" ? <span key={i} className="px-1 text-muted-foreground">…</span> : (
            <Button key={i} size="sm" variant={n === page ? "default" : "ghost"} className="h-8 min-w-8 px-2 tnum" onClick={() => onPage(n)} aria-current={n === page ? "page" : undefined}>{n}</Button>
          ))}
          <Button size="icon" variant="ghost" className="h-8 w-8" disabled={page === pages} onClick={() => onPage(page + 1)} aria-label="Page suivante"><ChevronRight className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" disabled={page === pages} onClick={() => onPage(pages)} aria-label="Dernière page"><ChevronsRight className="h-4 w-4" /></Button>
          <form className="ml-2 flex items-center gap-1" onSubmit={(e) => { e.preventDefault(); const n = parseInt(go); if (!n || n < 1 || n > pages) { setErr(true); return; } setErr(false); onPage(n); setGo(""); }}>
            <label className="text-xs text-muted-foreground" htmlFor="goto">Aller à la page</label>
            <Input id="goto" value={go} onChange={(e) => setGo(e.target.value)} className={cn("h-8 w-14 text-center", err && "border-danger")} aria-invalid={err} title={err ? `Entre 1 et ${pages}` : undefined} />
          </form>
        </div>
      )}
    </nav>
  );
}

type Props<T> = {
  id: string; rows: T[]; columns: Col<T>[]; filters?: FilterDef<T>[]; rowKey?: (r: T) => string; search?: (r: T) => string;
  onRowClick?: (r: T) => void; drawer?: (r: T) => ReactNode; drawerTitle?: (r: T) => string; fullLink?: (r: T) => { to: string; params?: any };
  rowActions?: (r: T) => RowAction[]; bulkActions?: (ids: string[], clear: () => void) => ReactNode; defaultPageSize?: number;
  toolbarExtra?: ReactNode; emptyAction?: ReactNode; defaultSort?: string; cards?: (r: T, q: string) => ReactNode; ignoreSite?: boolean; noSelect?: boolean;
};

export function DataTable<T extends Record<string, any>>(p: Props<T>) {
  useStore();
  const ns = p.id + ".";
  const { search, get, set } = useUrlState(ns);
  const rowKey = p.rowKey ?? ((r: T) => r.id);
  const qUrl = get("q") ?? "";
  const [q, setQ] = useState(qUrl);
  useEffect(() => setQ(qUrl), [qUrl]);
  useEffect(() => { const t = setTimeout(() => { if (q !== qUrl) set({ q, page: undefined }); }, 300); return () => clearTimeout(t); }, [q]); // eslint-disable-line
  const page = +(get("page") ?? 1); const size = +(get("size") ?? p.defaultPageSize ?? 10);
  const sortRaw = get("sort") ?? p.defaultSort ?? ""; const [sortKey, sortDir] = sortRaw.split(":");
  const density = get("density") ?? "comfortable"; const view = get("view") ?? "table";
  const [hidden, setHidden] = useState<Set<string>>(() => new Set(p.columns.filter((c) => c.hidden).map((c) => c.key)));
  const [sel, setSel] = useState<Set<string>>(new Set()); const [allSel, setAllSel] = useState(false);
  const [loading, setLoading] = useState(false); const [drawerRow, setDrawerRow] = useState<T | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const activeFilters = (p.filters ?? []).map((f) => ({ f, v: get(`f_${f.key}`) })).filter((x) => x.v !== undefined);
  const filtered = useMemo(() => {
    let r = p.rows;
    if (!p.ignoreSite && settings.site !== "Tous" && r[0] && "site" in r[0]) r = r.filter((x) => x.site === settings.site);
    for (const { f, v } of activeFilters) r = r.filter((x) => f.predicate ? f.predicate(x, v!) : String(f.value ? f.value(x) : x[f.key]) === v);
    if (qUrl) { const s = qUrl.toLowerCase(); r = r.filter((x) => (p.search ? p.search(x) : Object.values(x).join(" ")).toLowerCase().includes(s)); }
    if (sortKey) { const col = p.columns.find((c) => c.key === sortKey); const val = col?.value ?? ((x: T) => x[sortKey]); r = [...r].sort((a, b) => { const A = val(a), B = val(b); return (A > B ? 1 : A < B ? -1 : 0) * (sortDir === "desc" ? -1 : 1); }); }
    return r;
  }, [p.rows, JSON.stringify(search), settings.site, useStore()]); // eslint-disable-line
  const total = filtered.length; const pages = Math.max(1, Math.ceil(total / size)); const cur = Math.min(page, pages);
  const pageRows = filtered.slice((cur - 1) * size, cur * size);
  useEffect(() => { if (page > pages) set({ page: pages > 1 ? pages : undefined }); }, [pages]); // eslint-disable-line
  useEffect(() => { setLoading(true); const t = setTimeout(() => setLoading(false), 220); return () => clearTimeout(t); }, [cur, size, qUrl, activeFilters.length, sortRaw]);

  const cols = p.columns.filter((c) => !hidden.has(c.key));
  const clear = () => { setSel(new Set()); setAllSel(false); };
  const selIds = allSel ? filtered.map(rowKey) : [...sel];
  const pageAllSel = pageRows.length > 0 && pageRows.every((r) => sel.has(rowKey(r)));
  const cycleSort = (k: string) => set({ sort: sortKey !== k ? `${k}:asc` : sortDir === "asc" ? `${k}:desc` : undefined, page: undefined });
  const py = density === "compact" ? "py-1.5" : "py-3";
  const openRow = (r: T) => { if (p.onRowClick) p.onRowClick(r); else if (p.drawer) setDrawerRow(r); };

  return (
    <div className="glass overflow-hidden rounded-2xl">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…" className="h-9 pl-8" aria-label="Rechercher dans le tableau" />
        </div>
        {p.filters && (
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild><Button variant="outline" size="sm" className="h-9"><Filter className="mr-1 h-4 w-4" />Filtres{activeFilters.length > 0 && <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">{activeFilters.length}</span>}</Button></PopoverTrigger>
            <PopoverContent className="w-80 space-y-3" align="start">
              {p.filters.map((f) => (
                <div key={f.key} className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">{f.label}</label>
                  {f.type === "range" ? (
                    <div className="flex items-center gap-2"><Slider value={[+(get(`f_${f.key}`) ?? 0)]} max={f.max ?? 100} step={5} onValueChange={([v]) => set({ [`f_${f.key}`]: v || undefined, page: undefined })} /><span className="w-8 text-xs tnum">{get(`f_${f.key}`) ?? 0}</span></div>
                  ) : f.type === "bool" ? (
                    <label className="flex items-center gap-2 text-sm"><Checkbox checked={get(`f_${f.key}`) === "1"} onCheckedChange={(v) => set({ [`f_${f.key}`]: v ? "1" : undefined, page: undefined })} />Oui</label>
                  ) : (
                    <select className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm" value={get(`f_${f.key}`) ?? ""} onChange={(e) => set({ [`f_${f.key}`]: e.target.value || undefined, page: undefined })}>
                      <option value="">Tous</option>{f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  )}
                </div>
              ))}
            </PopoverContent>
          </Popover>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="h-9"><Bookmark className="mr-1 h-4 w-4" />Vues</Button></DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => { const name = `Vue ${(savedViews[p.id]?.length ?? 0) + 1}`; (savedViews[p.id] ??= []).push({ name, search }); toast.success(`« ${name} » enregistrée`); }}>Enregistrer la vue actuelle</DropdownMenuItem>
            <DropdownMenuSeparator /><DropdownMenuLabel className="text-xs">Vues par défaut</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => set(Object.fromEntries(Object.keys(search).filter((k) => k.startsWith(ns)).map((k) => [k.slice(ns.length), undefined])))}>Toutes les lignes</DropdownMenuItem>
            {savedViews[p.id]?.map((v) => <DropdownMenuItem key={v.name} onClick={() => set(Object.fromEntries(Object.entries(v.search).filter(([k]) => k.startsWith(ns)).map(([k, x]) => [k.slice(ns.length), x])))}>{v.name}</DropdownMenuItem>)}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="outline" size="icon" className="h-9 w-9" aria-label="Colonnes"><Columns3 className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent>{p.columns.map((c) => <DropdownMenuCheckboxItem key={c.key} checked={!hidden.has(c.key)} onCheckedChange={() => setHidden((h) => { const n = new Set(h); n.has(c.key) ? n.delete(c.key) : n.add(c.key); return n; })}>{c.header}</DropdownMenuCheckboxItem>)}</DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" size="icon" className="h-9 w-9" aria-label="Densité" title={density === "compact" ? "Confortable" : "Compact"} onClick={() => set({ density: density === "compact" ? undefined : "compact" })}><Rows3 className="h-4 w-4" /></Button>
        {p.cards && <Button variant="outline" size="icon" className="h-9 w-9" aria-label="Changer de vue" onClick={() => set({ view: view === "cards" ? undefined : "cards" })}>{view === "cards" ? <Table2 className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}</Button>}
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="outline" size="icon" className="h-9 w-9" aria-label="Exporter"><Download className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => exportCsv(p.id, p.columns.map((c) => c.header), filtered.map((r) => p.columns.map((c) => c.value ? c.value(r) : r[c.key])))}>Exporter CSV</DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.success("Export Excel généré (simulé)", { description: `${total} lignes` })}>Exporter Excel</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" size="icon" className="h-9 w-9" aria-label="Actualiser" onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 600); }}><RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /></Button>
        {p.toolbarExtra}
      </div>
      {(activeFilters.length > 0 || qUrl) && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
          {qUrl && <Chip label={`Recherche : ${qUrl}`} onRemove={() => set({ q: undefined })} />}
          {activeFilters.map(({ f, v }) => <Chip key={f.key} label={`${f.label} : ${f.type === "bool" ? "Oui" : f.type === "range" ? `≥ ${v}` : v}`} onRemove={() => set({ [`f_${f.key}`]: undefined, page: undefined })} />)}
          <button className="text-xs text-gold hover:underline" onClick={() => set({ q: undefined, page: undefined, ...Object.fromEntries((p.filters ?? []).map((f) => [`f_${f.key}`, undefined])) })}>Tout effacer</button>
          {loading && <span className="ml-auto text-xs text-muted-foreground">Mise à jour…</span>}
        </div>
      )}
      {pageAllSel && !allSel && total > pageRows.length && (
        <div className="border-b border-border bg-gold/10 px-4 py-2 text-center text-sm">{pageRows.length} lignes sélectionnées sur cette page. <button className="font-semibold text-gold underline" onClick={() => setAllSel(true)}>Sélectionner les {total} résultats</button></div>
      )}
      {allSel && <div className="border-b border-border bg-gold/10 px-4 py-2 text-center text-sm">Les {total} résultats sont sélectionnés. <button className="font-semibold text-gold underline" onClick={clear}>Effacer la sélection</button></div>}

      {total === 0 ? (
        <EmptyState action={p.emptyAction ?? <Button variant="outline" onClick={() => set({ q: undefined, ...Object.fromEntries((p.filters ?? []).map((f) => [`f_${f.key}`, undefined])) })}>Effacer les filtres</Button>} />
      ) : view === "cards" && p.cards ? (
        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
          {pageRows.map((r) => <div key={rowKey(r)} onClick={() => openRow(r)} className="cursor-pointer">{p.cards!(r, qUrl)}</div>)}
        </div>
      ) : (
        <div className="max-h-[68vh] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                {!p.noSelect && <th className="sticky left-0 z-10 w-10 bg-card/95 px-3 py-2.5"><Checkbox aria-label="Tout sélectionner sur la page" checked={pageAllSel} onCheckedChange={(v) => setSel((s) => { const n = new Set(s); pageRows.forEach((r) => v ? n.add(rowKey(r)) : n.delete(rowKey(r))); return n; })} /></th>}
                {cols.map((c, i) => (
                  <th key={c.key} className={cn("whitespace-nowrap px-3 py-2.5 font-medium", i === 0 && "sticky left-10 z-10 bg-card/95", c.className)} style={{ minWidth: c.width }}>
                    {c.sortable !== false ? (
                      <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => cycleSort(c.key)} aria-label={`Trier par ${c.header}`}>
                        {c.header}{sortKey === c.key ? (sortDir === "asc" ? <ArrowUp className="h-3 w-3 text-gold" /> : <ArrowDown className="h-3 w-3 text-gold" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                      </button>
                    ) : c.header}
                  </th>
                ))}
                {p.rowActions && <th className="w-10" />}
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: pageRows.length }).map((_, i) => (
                <tr key={i} className="border-t border-border">{!p.noSelect && <td className="px-3 py-3"><div className="h-4 w-4 rounded skeleton-shimmer" /></td>}{cols.map((c) => <td key={c.key} className={cn("px-3", py)}><div className="h-4 w-full max-w-[140px] rounded skeleton-shimmer" /></td>)}{p.rowActions && <td />}</tr>
              )) : (
                <AnimatePresence initial={false}>
                  {pageRows.map((r) => {
                    const k = rowKey(r); const checked = allSel || sel.has(k);
                    return (
                      <motion.tr layout key={k} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
                        onClick={() => openRow(r)} className={cn("group border-t border-border transition-colors hover:bg-accent/50", (p.onRowClick || p.drawer) && "cursor-pointer", checked && "bg-gold/5")}>
                        {!p.noSelect && <td className="sticky left-0 bg-card/60 px-3" onClick={(e) => e.stopPropagation()}><Checkbox aria-label="Sélectionner la ligne" checked={checked} onCheckedChange={(v) => { setAllSel(false); setSel((s) => { const n = new Set(s); v ? n.add(k) : n.delete(k); return n; }); }} /></td>}
                        {cols.map((c, i) => <td key={c.key} className={cn("px-3", py, i === 0 && "sticky left-10 bg-card/60 backdrop-blur-sm", c.className)}>{c.render ? c.render(r, qUrl) : hl(r[c.key], qUrl)}</td>)}
                        {p.rowActions && (
                          <td className="px-2" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Actions"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">{p.rowActions(r).map((a) => <DropdownMenuItem key={a.label} onClick={a.onClick} className={a.danger ? "text-danger" : ""}>{a.label}</DropdownMenuItem>)}</DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        )}
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      )}
      {total > 0 && <Pagination page={cur} pages={pages} size={size} total={total} onPage={(n) => set({ page: n === 1 ? undefined : n })} onSize={(s) => set({ size: s, page: undefined })} />}

      <AnimatePresence>
        {selIds.length > 0 && p.bulkActions && (
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} className="glass fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 flex-wrap items-center gap-2 rounded-2xl px-4 py-3">
            <span className="text-sm font-semibold tnum">{selIds.length} sélectionné(s)</span>
            <span className="h-5 w-px bg-border" />
            {p.bulkActions(selIds, clear)}
            <Button variant="ghost" size="sm" onClick={clear}>Désélectionner</Button>
          </motion.div>
        )}
      </AnimatePresence>

      <Sheet open={!!drawerRow} onOpenChange={(o) => !o && setDrawerRow(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl glass">
          {drawerRow && (
            <>
              <SheetHeader><SheetTitle>{p.drawerTitle?.(drawerRow) ?? rowKey(drawerRow)}</SheetTitle><SheetDescription>Aperçu rapide</SheetDescription></SheetHeader>
              <div className="mt-4 space-y-4">{p.drawer?.(drawerRow)}</div>
              {p.fullLink && <Link {...(p.fullLink(drawerRow) as any)} className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-gold hover:underline">Ouvrir la fiche complète <ExternalLink className="h-3.5 w-3.5" /></Link>}
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return <span className="inline-flex items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-2.5 py-0.5 text-xs">{label}<button onClick={onRemove} aria-label={`Retirer ${label}`}><X className="h-3 w-3" /></button></span>;
}

export function DetailGrid({ items }: { items: [string, ReactNode][] }) {
  return <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">{items.map(([k, v]) => <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>)}</dl>;
}
