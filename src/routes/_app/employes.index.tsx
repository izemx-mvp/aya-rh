import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ModulePage, meta } from "@/components/app/Module";
import { DataTable, DetailGrid } from "@/components/app/DataTable";
import { StatusBadge, Glass, Avatar, ScoreRing } from "@/components/app/kit";
import { employees, habilitations, DEPTS, SITES, CONTRACTS, fmtDate, KPI, type Employee } from "@/data/mock";
import { useStore, emit } from "@/lib/store";

export const Route = createFileRoute("/_app/employes/")({ head: () => meta("Dossiers employés", "Dossiers des 600 collaborateurs."), component: Page });
const expired = new Set(habilitations.filter((h) => h.status === "Expirée").map((h) => h.empId));

function Page() {
  useStore();
  const nav = useNavigate();
  return (
    <ModulePage title="Dossiers employés" subtitle={`${employees.length} collaborateurs`}
      kpis={[{ label: "Effectif", value: KPI.effectif }, { label: "En intégration", value: KPI.onboarding, to: "/integration" }, { label: "En congé aujourd'hui", value: KPI.onLeave, to: "/conges" }, { label: "Dossiers complets", value: employees.filter((e) => e.completeness === 100).length }, { label: "Habilitation expirée", value: expired.size, to: "/habilitations" }]}
      actions={[{ label: "Nouveau collaborateur", primary: true, success: "Collaborateur créé", confirm: "Créer", fields: [{ name: "name", label: "Nom complet", required: true }, { name: "job", label: "Poste", required: true }, { name: "site", label: "Site", type: "select", options: [...SITES], required: true }, { name: "dept", label: "Département", type: "select", options: DEPTS, required: true }, { name: "contract", label: "Contrat", type: "select", options: CONTRACTS, def: "CDI" }, { name: "date", label: "Date d'embauche", type: "date" }],
        onSubmit: (v) => { employees.unshift({ ...employees[1], id: `E${employees.length + 1}`, matricule: `AYA-${10000 + employees.length}`, name: v.name, job: v.job, site: v.site, dept: v.dept, contract: v.contract, status: "En intégration", completeness: 40, seniority: 0 }); emit(); } }]}>
      <DataTable id="emp" rows={employees} defaultPageSize={25} onRowClick={(r) => nav({ to: "/employes/$id", params: { id: r.id } })} search={(r) => `${r.name} ${r.matricule} ${r.job} ${r.dept}`}
        filters={[{ key: "site", label: "Site", options: [...SITES] }, { key: "dept", label: "Département", options: DEPTS }, { key: "status", label: "Statut", options: ["Actif", "En intégration", "En congé", "En préavis"] }, { key: "contract", label: "Contrat", options: CONTRACTS }, { key: "seniority", label: "Ancienneté min. (ans)", type: "range", max: 25, predicate: (r, v) => r.seniority >= +v }, { key: "complete", label: "Dossier incomplet", type: "bool", predicate: (r) => r.completeness < 100 }, { key: "hab", label: "Habilitation expirée", type: "bool", predicate: (r) => expired.has(r.id) }]}
        cards={(r) => <Glass className="p-4"><div className="flex items-center gap-3"><Avatar name={r.name} size={40} /><div className="min-w-0 flex-1"><p className="truncate font-semibold">{r.name}</p><p className="truncate text-xs text-muted-foreground">{r.job} · {r.site}</p></div><ScoreRing value={r.completeness} size={34} animateIn={false} /></div><div className="mt-2"><StatusBadge label={r.status} /></div></Glass>}
        columns={[{ key: "matricule", header: "Matricule", render: (r) => <span className="font-mono text-xs">{r.matricule}</span> }, { key: "name", header: "Collaborateur", render: (r: Employee) => <span className="flex items-center gap-2"><Avatar name={r.name} size={26} />{r.name}{expired.has(r.id) && <StatusBadge label="Non apte" tone="danger" />}</span> }, { key: "job", header: "Poste" }, { key: "dept", header: "Département" }, { key: "site", header: "Site" }, { key: "contract", header: "Contrat" }, { key: "hireDate", header: "Embauche", render: (r) => fmtDate(r.hireDate) }, { key: "status", header: "Statut", render: (r) => <StatusBadge label={r.status} /> }, { key: "completeness", header: "Complétude", render: (r) => <ScoreRing value={r.completeness} size={30} animateIn={false} /> }]} />
    </ModulePage>
  );
}
export { DetailGrid };
