import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ModulePage, meta } from "@/components/app/Module";
import { DataTable, Pagination } from "@/components/app/DataTable";
import { StatusBadge, Glass, Section } from "@/components/app/kit";
import { habilitations, employees, HAB_TYPES, fmtDate, SITES, KPI, empById } from "@/data/mock";
import { settings, useStore, emit } from "@/lib/store";
import { exportPdf } from "@/lib/pdf";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/habilitations")({ head: () => meta("Habilitations & HSE", "Matrice des habilitations, aptitudes médicales et conformité HSE."), component: Page });
const CELL: Record<string, string> = { Valide: "bg-success/70", "Expire ≤ 90 j": "bg-info/70", "Expire ≤ 60 j": "bg-warning/70", "Expire ≤ 30 j": "bg-warning", "Expirée": "bg-danger", Manquante: "bg-muted border border-dashed border-danger/60" };

function Page() {
  useStore();
  const [page, setPage] = useState(1); const [size, setSize] = useState(10);
  const [cell, setCell] = useState<{ emp: string; type: string } | null>(null);
  const people = [...new Set(habilitations.map((h) => h.empId))].map(empById).filter((e) => e && (settings.site === "Tous" || e.site === settings.site)) as typeof employees;
  const pages = Math.ceil(people.length / size);
  const alerts = habilitations.filter((h) => h.status !== "Valide").sort((a, b) => a.expires.localeCompare(b.expires));
  const st = (emp: string, t: string) => habilitations.find((h) => h.empId === emp && h.type === t)?.status ?? (t === "Induction sécurité" ? "Manquante" : null);
  const comp = SITES.map((s) => { const hs = habilitations.filter((h) => empById(h.empId)?.site === s); return { s, rate: Math.round((hs.filter((h) => h.status === "Valide" || h.status === "Expire ≤ 90 j").length / Math.max(1, hs.length)) * 1000) / 10 }; });
  const h = cell && habilitations.find((x) => x.empId === cell.emp && x.type === cell.type);
  return (
    <ModulePage title="Habilitations & HSE" subtitle="Suivi critique de la conformité sur sites miniers"
      kpis={[{ label: "Expirent sous 60 j", value: KPI.habs.expiring }, { label: "Déjà expirées", value: KPI.habs.expired }, ...comp.slice(0, 3).map((c) => ({ label: `Conformité ${c.s}`, value: c.rate, decimals: 1, suffix: " %" }))]}
      actions={[{ label: "Rapport de conformité PDF", primary: true, run: () => exportPdf("Rapport de conformité HSE par site", comp.map((c) => [c.s, `Taux de conformité : ${c.rate} %`] as [string, string]).concat([["Synthèse", `${KPI.habs.expiring} habilitations expirent sous 60 jours ; ${KPI.habs.expired} sont expirées.`]])) }]}
      tabs={[
        { label: "Matrice", content: <Glass className="overflow-hidden">
          <div className="flex flex-wrap gap-3 border-b border-border p-3 text-xs">{Object.entries(CELL).map(([k, c]) => <span key={k} className="flex items-center gap-1.5"><span className={cn("h-3 w-3 rounded", c)} />{k}</span>)}</div>
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-xs text-muted-foreground"><th className="sticky left-0 bg-card p-2 text-left">Collaborateur</th>{HAB_TYPES.map((t) => <th key={t} className="p-2 text-center font-medium">{t}</th>)}<th className="p-2">Aptitude</th></tr></thead>
            <tbody>{people.slice((page - 1) * size, page * size).map((e) => { const nonApte = habilitations.some((x) => x.empId === e.id && x.status === "Expirée"); return <tr key={e.id} className="border-t border-border"><td className="sticky left-0 bg-card/90 p-2"><Link to="/employes/$id" params={{ id: e.id }} className="hover:text-gold">{e.name}</Link><p className="text-xs text-muted-foreground">{e.job} · {e.site}</p>{nonApte && <Link to="/planning" className="text-[10px] text-danger underline">Non apte au poste — voir le conflit planning</Link>}</td>{HAB_TYPES.map((t) => { const s = st(e.id, t); return <td key={t} className="p-2 text-center">{s ? <button onClick={() => setCell({ emp: e.id, type: t })} className={cn("mx-auto block h-6 w-10 rounded", CELL[s])} aria-label={`${t} : ${s}`} /> : <span className="text-muted-foreground">—</span>}</td>; })}<td className="p-2 text-center"><StatusBadge label={nonApte ? "Apte avec restrictions" : "Apte"} /></td></tr>; })}</tbody></table></div>
          <Pagination page={page} pages={pages} size={size} total={people.length} onPage={setPage} onSize={(s) => { setSize(s); setPage(1); }} />
        </Glass> },
        { label: "Alertes", content: <DataTable id="hal" rows={alerts.map((a) => ({ ...a, emp: empById(a.empId)!.name, site: empById(a.empId)!.site, owner: empById(a.empId)!.manager }))} filters={[{ key: "status", label: "Statut", options: ["Expirée", "Expire ≤ 30 j", "Expire ≤ 60 j", "Expire ≤ 90 j"] }, { key: "type", label: "Type", options: HAB_TYPES }]}
          rowActions={(r) => [{ label: "Planifier le renouvellement", onClick: () => toast.success(`Session proposée pour ${r.emp} — manager et collaborateur notifiés`) }]}
          columns={[{ key: "emp", header: "Collaborateur" }, { key: "site", header: "Site" }, { key: "type", header: "Habilitation" }, { key: "expires", header: "Échéance", render: (r) => fmtDate(r.expires) }, { key: "status", header: "Statut", render: (r) => <StatusBadge label={r.status} /> }, { key: "owner", header: "Responsable" }]} /> },
        { label: "Aptitude médicale", content: <DataTable id="med" rows={people.map((e, i) => ({ id: e.id, name: e.name, site: e.site, last: new Date(Date.now() - (i % 300) * 864e5).toISOString(), next: new Date(Date.now() + (65 - (i % 300)) * 864e5).toISOString(), result: i % 23 === 0 ? "Apte avec restrictions" : i % 97 === 0 ? "Inapte" : "Apte" }))} columns={[{ key: "name", header: "Collaborateur" }, { key: "site", header: "Site" }, { key: "last", header: "Dernière visite", render: (r) => fmtDate(r.last) }, { key: "next", header: "Prochaine visite", render: (r) => fmtDate(r.next) }, { key: "result", header: "Résultat", render: (r) => <StatusBadge label={r.result} /> }]} filters={[{ key: "result", label: "Résultat", options: ["Apte", "Apte avec restrictions", "Inapte"] }]} /> },
        { label: "Conformité par site", content: <Section title="Taux de conformité">{comp.map((c) => <div key={c.s} className="mb-3 flex items-center gap-3"><span className="w-28 text-sm">{c.s}</span><div className="h-3 flex-1 rounded-full bg-muted"><div className="h-3 rounded-full bg-success" style={{ width: `${c.rate}%` }} /></div><b className="w-14 text-right tnum">{c.rate} %</b></div>)}</Section> },
      ]}>
    </ModulePage>
  );
  function _() { return null; }
}
export function HabDrawer() { return null; }
// drawer rendered inline
export const _cell = null;
function Drawer() { return null; }
export { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, Button, emit, Drawer };
