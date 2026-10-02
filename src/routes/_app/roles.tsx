import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ModulePage, meta } from "@/components/app/Module";
import { DataTable } from "@/components/app/DataTable";
import { Section, StatusBadge, Avatar } from "@/components/app/kit";
import { users, fmtDate } from "@/data/mock";
import { setSetting, emit, audit } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/roles")({ head: () => meta("Rôles & accès", "Rôles, permissions et utilisateurs."), component: Page });
const ROLES = ["DRH", "Responsable RH", "Manager", "Collaborateur", "Direction", "Lecture seule"];
const MODS = ["Recrutement", "Fiches de poste", "Collaborateurs", "Formation", "Paie", "Rapports", "Administration"];
const ACTS = ["voir", "créer", "modifier", "supprimer", "exporter"];

function Page() {
  const nav = useNavigate();
  const [role, setRole] = useState("Manager");
  const [perm, setPerm] = useState<Record<string, boolean>>({});
  const def = (m: string, a: string) => role === "DRH" || (role === "Responsable RH" && m !== "Administration") || (role === "Direction" && (a === "voir" || a === "exporter")) || (role === "Manager" && a === "voir" && m !== "Paie" && m !== "Administration") || (role === "Lecture seule" && a === "voir" && m === "Rapports") || (role === "Collaborateur" && a === "voir" && m === "Formation");
  return (
    <ModulePage title="Rôles & accès" subtitle={`${ROLES.length} rôles · ${users.length} utilisateurs`}
      actions={[{ label: "Inviter un utilisateur", primary: true, fields: [{ name: "e", label: "Email", required: true }, { name: "r", label: "Rôle", type: "select", options: ROLES, required: true }], success: "Invitation envoyée (simulée)" }, { label: "Voir en tant que Manager", run: () => { setSetting("viewAs", "Manager"); nav({ to: "/dashboard" }); } }, { label: "Voir en tant que Collaborateur", run: () => { setSetting("viewAs", "Collaborateur"); nav({ to: "/dashboard" }); } }]}
      tabs={[
        { label: "Permissions", content: <Section title="Matrice des permissions" action={<div className="flex flex-wrap gap-1">{ROLES.map((r) => <Button key={r} size="sm" variant={role === r ? "secondary" : "ghost"} onClick={() => setRole(r)}>{r}</Button>)}</div>}>
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-xs text-muted-foreground"><th className="text-left">Module</th>{ACTS.map((a) => <th key={a} className="capitalize">{a}</th>)}</tr></thead><tbody>{MODS.map((m) => <tr key={m} className="border-t border-border"><td className="py-2">{m}</td>{ACTS.map((a) => { const k = `${role}|${m}|${a}`; return <td key={a} className="text-center"><Switch checked={perm[k] ?? def(m, a)} onCheckedChange={(v) => { setPerm({ ...perm, [k]: v }); audit("Changement de permission", `${role} · ${m}`, String(!v), String(v)); }} aria-label={`${m} ${a}`} /></td>; })}</tr>)}</tbody></table></div>
          <Button variant="outline" className="mt-3" onClick={() => { setSetting("viewAs", role === "Collaborateur" ? "Collaborateur" : "Manager"); nav({ to: "/dashboard" }); }}><Eye className="mr-1 h-4 w-4" />Voir en tant que {role === "Collaborateur" ? "Collaborateur" : "Manager"}</Button>
        </Section> },
        { label: "Utilisateurs", content: <DataTable id="usr" rows={users} filters={[{ key: "role", label: "Rôle", options: ROLES }, { key: "site", label: "Site", options: ["Zgounder", "Boumadine", "Marrakech", "Siège"] }]}
          rowActions={(u) => ROLES.map((r) => ({ label: `Rôle : ${r}`, onClick: () => { audit("Changement de rôle", u.name, u.role, r); u.role = r; emit(); toast.success(`${u.name} → ${r}`); } }))}
          columns={[{ key: "name", header: "Utilisateur", render: (u) => <span className="flex items-center gap-2"><Avatar name={u.name} size={26} />{u.name}</span> }, { key: "email", header: "Email" }, { key: "site", header: "Site" }, { key: "role", header: "Rôle", render: (u) => <StatusBadge label={u.role} tone="info" /> }, { key: "last", header: "Dernière connexion", render: (u) => fmtDate(u.last) }]} /> },
      ]} />
  );
}
