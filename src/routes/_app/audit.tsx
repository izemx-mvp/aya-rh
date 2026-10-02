import { createFileRoute } from "@tanstack/react-router";
import { ModulePage, meta } from "@/components/app/Module";
import { DataTable } from "@/components/app/DataTable";
import { StatusBadge } from "@/components/app/kit";
import { auditLog } from "@/data/mock";
import { useStore } from "@/lib/store";
import { exportCsv } from "@/lib/pdf";

export const Route = createFileRoute("/_app/audit")({ head: () => meta("Journal d'audit", "Traçabilité des actions sensibles."), component: Page });

function Page() {
  useStore();
  return (
    <ModulePage title="Journal d'audit" subtitle={`${auditLog.length} événements tracés`} actions={[{ label: "Exporter CSV", primary: true, run: () => exportCsv("journal_audit", ["Qui", "Quoi", "Objet", "Quand", "Avant", "Après", "IP"], auditLog.map((a) => [a.who, a.what, a.object, a.when, a.before, a.after, a.ip])) }]}>
      <DataTable id="aud" rows={[...auditLog]} ignoreSite noSelect defaultSort="when:desc"
        filters={[{ key: "what", label: "Action", options: [...new Set(auditLog.map((a) => a.what))] }, { key: "who", label: "Utilisateur", options: [...new Set(auditLog.map((a) => a.who))] }]}
        columns={[{ key: "when", header: "Quand", render: (a) => <span className="tnum text-xs">{new Date(a.when).toLocaleString("fr-FR")}</span> }, { key: "who", header: "Qui" }, { key: "what", header: "Quoi", render: (a) => <StatusBadge label={a.what} tone="info" /> }, { key: "object", header: "Objet", render: (a) => <span className="font-mono text-xs">{a.object}</span> }, { key: "before", header: "Avant" }, { key: "after", header: "Après" }, { key: "ip", header: "Adresse IP", render: (a) => <span className="font-mono text-xs">{a.ip}</span> }]} />
    </ModulePage>
  );
}
