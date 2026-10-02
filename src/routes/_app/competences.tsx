import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ModulePage, meta } from "@/components/app/Module";
import { DataTable } from "@/components/app/DataTable";
import { StatusBadge, Section, Avatar, Typing, AiDisclaimer } from "@/components/app/kit";
import { employees, positions } from "@/data/mock";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/competences")({ head: () => meta("Compétences & carrières", "Matrice de compétences, succession et mobilité interne."), component: Page });
const SK = ["Sécurité HSE", "Forage", "Géologie", "Maintenance", "Électricité", "Management", "Outils IA"];
const lvl = (i: number, j: number) => ((i * 7 + j * 3) % 5) + 1;

function Page() {
  const [target, setTarget] = useState<Record<string, number>>(Object.fromEntries(SK.map((s) => [s, 3])));
  const team = employees.filter((e) => e.dept === "Production minière").slice(0, 10);
  const crit = ["Directeur de site Zgounder", "Responsable HSE", "Chef d'atelier maintenance", "Ingénieur procédés senior", "Responsable achats"].map((r, i) => ({ id: r, role: r, holder: employees[i * 11 + 5].name, succ: [employees[i * 13 + 7].name, employees[i * 17 + 9].name], ready: ["Prêt maintenant", "1 à 2 ans", "3 ans et plus"][i % 3], risk: ["Élevé", "Moyen", "Faible"][i % 3] }));
  return (
    <ModulePage title="Compétences & carrières" subtitle="Équipe de référence : Production minière — Zgounder"
      tabs={[
        { label: "Matrice", content: <Section title="Compétences × collaborateurs (écarts vs niveau cible)"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr><th className="p-2 text-left text-xs text-muted-foreground">Collaborateur</th>{SK.map((s) => <th key={s} className="p-2 text-xs font-medium">{s}<div className="mt-1 flex justify-center gap-0.5">{[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => setTarget({ ...target, [s]: n })} className={cn("h-2 w-2 rounded-full", n <= target[s] ? "bg-gold" : "bg-muted")} aria-label={`Cible ${n}`} />)}</div></th>)}</tr></thead><tbody>{team.map((e, i) => <tr key={e.id} className="border-t border-border"><td className="p-2"><Link to="/employes/$id" params={{ id: e.id }} className="hover:text-gold">{e.name}</Link></td>{SK.map((s, j) => { const v = lvl(i, j); const gap = v < target[s]; return <td key={s} className="p-1 text-center"><span className={cn("inline-flex h-8 w-8 items-center justify-center rounded-md text-xs font-semibold", gap ? "bg-danger/20 text-danger ring-1 ring-danger/40" : v >= 4 ? "bg-success/25" : "bg-muted")}>{v}</span></td>; })}</tr>)}</tbody></table></div><p className="mt-2 text-xs text-muted-foreground">Cliquez sur les points d'un en-tête pour modifier le niveau cible. Encadré rouge = écart.</p></Section> },
        { label: "Succession", content: <DataTable id="succ" rows={crit} noSelect columns={[{ key: "role", header: "Rôle critique" }, { key: "holder", header: "Titulaire" }, { key: "succ", header: "Successeurs", render: (r) => r.succ.join(", ") }, { key: "ready", header: "Disponibilité", render: (r) => <StatusBadge label={r.ready} tone={r.ready === "Prêt maintenant" ? "success" : r.ready === "1 à 2 ans" ? "warning" : "neutral"} /> }, { key: "risk", header: "Risque de vacance", render: (r) => <StatusBadge label={r.risk} tone={r.risk === "Élevé" ? "danger" : r.risk === "Moyen" ? "warning" : "success"} /> }]} rowActions={(r) => [{ label: "Créer un plan de développement", onClick: () => toast.success(`Plan créé pour ${r.succ[0]}`) }]} /> },
        { label: "Mobilité interne", content: <div className="grid gap-3 md:grid-cols-2">{positions.slice(0, 6).map((p, i) => <Section key={p.id} title={`${p.title} · ${p.site}`}>{[0, 1].map((k) => { const e = employees[i * 9 + k * 31 + 20]; return <div key={k} className="flex items-center gap-3 border-b border-border py-2 text-sm"><Avatar name={e.name} size={28} /><div className="flex-1"><p>{e.name}</p><p className="text-xs text-muted-foreground">{e.job} · {e.site}</p></div><b className="text-gold tnum">{88 - i * 3 - k * 9} %</b></div>; })}<p className="mt-2 text-xs text-muted-foreground"><Typing text="Compétences techniques proches, habilitations déjà valides, ancienneté suffisante." /></p></Section>)}<div className="md:col-span-2"><AiDisclaimer /></div></div> },
        { label: "Revue des talents", content: <Section title="Notes de revue"><p className="text-sm text-muted-foreground">La calibration 9-box est disponible dans <Link to="/entretiens-annuels" search={{ tab: "Calibration 9-box" } as any} className="text-gold">Entretiens annuels → Calibration</Link>. 6 hauts potentiels identifiés en Production minière.</p></Section> },
      ]} />
  );
}
