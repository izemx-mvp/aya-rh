import { trialDecision } from "@/lib/actions";
import { useStore } from "@/lib/store";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Reorder } from "framer-motion";
import { GripVertical, Trash2, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ModulePage, meta, ActionButtons } from "@/components/app/Module";
import { DataTable } from "@/components/app/DataTable";
import { StatusBadge, Glass, Avatar, Bar, Typing, Section } from "@/components/app/kit";
import { onboarding, fmtDate } from "@/data/mock";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/integration")({ head: () => meta("Intégration", "Parcours d'intégration des nouvelles recrues."), component: Page });
const PHASES = ["Avant l'arrivée", "Jour 1", "Semaine 1", "Mois 1", "Fin de période d'essai"];
const TASKS = [["Badge d'accès", "IT", 0], ["Commande EPI", "Achats", 0], ["Accès systèmes", "IT", 0], ["Visite médicale", "HSE", 1], ["Induction sécurité", "HSE", 1], ["Présentation d'équipe", "Manager", 1], ["Remise du matériel", "IT", 1], ["Formation poste", "Manager", 2], ["Point RH", "RH", 3], ["Évaluation 30 jours", "Manager", 3], ["Évaluation 90 jours", "Manager", 4]] as const;

function Page() {
  useStore();
  const [selId, setSel0] = useState(onboarding[0]?.id);
  const sel = onboarding.find((o) => o.id === selId) ?? onboarding[0];
  const setSel = (o: (typeof onboarding)[number]) => setSel0(o.id);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [tpl, setTpl] = useState<{ id: number; name: string; owner: string; phase: number }[]>(TASKS.map((t, i) => ({ id: i, name: t[0], owner: t[1], phase: t[2] })));
  const [newT, setNewT] = useState("");
  const prog = (id: string, base: number) => Math.round(((tpl.filter((t) => done[id + t.id]).length + (base / 100) * tpl.length) / tpl.length) * 100) % 101;
  return (
    <ModulePage title="Intégration" subtitle={`${onboarding.length} collaborateurs en intégration`}
      tabs={[
        { label: "Tableau", content: <>
          <div className="grid gap-3 md:grid-cols-3">{onboarding.map((o) => <Glass key={o.id} tilt className={cn("cursor-pointer p-4", sel.id === o.id && "ring-2 ring-gold")} onClick={() => setSel(o)}><div className="flex items-center gap-3"><Avatar name={o.name} size={36} /><div className="flex-1"><p className="font-semibold">{o.name}</p><p className="text-xs text-muted-foreground">{o.job} · {o.site}</p></div></div><div className="mt-3 flex justify-between text-xs"><span>Arrivée {fmtDate(o.start)}</span><b>{Math.min(100, prog(o.id, o.progress))} %</b></div><Bar value={Math.min(100, prog(o.id, o.progress))} /></Glass>)}</div>
          <Section title={`Parcours de ${sel.name}`} action={<ActionButtons actions={[{ label: "Email de bienvenue IA", ai: `Bienvenue ${sel.name.split(" ")[0]} ! Toute l'équipe ${sel.dept} est ravie de vous accueillir à ${sel.site}. Votre parrain, ${sel.buddy}, vous accompagnera durant vos premières semaines. Rendez-vous lundi à 8h à l'accueil sécurité.`, confirm: "Envoyer", success: "Email de bienvenue envoyé" }, { label: "Évaluation période d'essai", fields: [{ name: "r", label: "Note globale (1-5)", type: "number", required: true }, { name: "c", label: "Commentaires", type: "textarea" }, { name: "d", label: "Décision", type: "select", options: ["Confirmer", "Prolonger", "Mettre fin"], required: true }], confirm: "Valider la décision", cascade: true, onSubmit: (v) => trialDecision(sel.id, v.d) }]} />}>
            <p className="mb-3 text-sm text-muted-foreground">Parrain : <b>{sel.buddy}</b> · Manager : {sel.manager}</p>
            <div className="grid gap-3 lg:grid-cols-5">{PHASES.map((p, pi) => <div key={p} className="rounded-xl border border-border p-3"><p className="mb-2 text-xs font-semibold text-gold">{p}</p>{tpl.filter((t) => t.phase === pi).map((t) => { const k = sel.id + t.id; const late = pi === 0 && !done[k] && t.id === 1; return <label key={t.id} className={cn("flex items-start gap-2 py-1 text-sm", late && "text-danger")}><Checkbox checked={!!done[k]} onCheckedChange={(v) => setDone({ ...done, [k]: !!v })} /><span className="flex-1">{t.name}<span className="block text-[10px] text-muted-foreground">{t.owner}{late && " · en retard"}</span></span>{late && <button onClick={() => toast.success("Relance envoyée")} aria-label="Relancer"><Bell className="h-3 w-3" /></button>}</label>; })}</div>)}</div>
          </Section>
        </> },
        { label: "Liste", content: <DataTable id="onb" rows={onboarding} columns={[{ key: "name", header: "Collaborateur" }, { key: "job", header: "Poste" }, { key: "site", header: "Site" }, { key: "manager", header: "Manager" }, { key: "buddy", header: "Parrain" }, { key: "start", header: "Arrivée", render: (r) => fmtDate(r.start) }, { key: "progress", header: "Progression", render: (r) => <div className="w-24"><Bar value={r.progress} /></div> }]} filters={[{ key: "site", label: "Site", options: ["Zgounder", "Boumadine", "Marrakech", "Siège"] }]} /> },
        { label: "Modèles", content: <Section title="Modèle : Technicien site (famille Mine & maintenance)" action={<Button size="sm" variant="outline" onClick={() => toast.success("Modèle dupliqué")}>Dupliquer</Button>}>
          <Reorder.Group axis="y" values={tpl} onReorder={setTpl} className="space-y-1.5">{tpl.map((t) => <Reorder.Item key={t.id} value={t} className="flex cursor-grab items-center gap-3 rounded-lg border border-border bg-card/60 p-2 text-sm"><GripVertical className="h-4 w-4 text-muted-foreground" /><span className="flex-1">{t.name}</span><StatusBadge label={PHASES[t.phase]} tone="neutral" /><span className="w-16 text-xs text-muted-foreground">{t.owner}</span><button onClick={() => setTpl(tpl.filter((x) => x.id !== t.id))} aria-label="Supprimer"><Trash2 className="h-4 w-4 text-danger" /></button></Reorder.Item>)}</Reorder.Group>
          <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!newT) return; setTpl([...tpl, { id: Date.now(), name: newT, owner: "RH" as any, phase: 1 as any }]); setNewT(""); }}><Input value={newT} onChange={(e) => setNewT(e.target.value)} placeholder="Nouvelle tâche…" /><Button type="submit">Ajouter</Button></form>
        </Section> },
      ]} />
  );
}
export { Typing };
