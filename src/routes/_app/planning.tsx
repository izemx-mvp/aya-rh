import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ModulePage, meta } from "@/components/app/Module";
import { Section, Avatar, Typing, AiDisclaimer, StatusBadge } from "@/components/app/kit";
import { employees, habilitations } from "@/data/mock";
import { exportPdf } from "@/lib/pdf";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/planning")({ head: () => meta("Planning équipes", "Planification des quarts 3x8 à Zgounder."), component: Page });
const SHIFTS = ["Matin 06h–14h", "Après-midi 14h–22h", "Nuit 22h–06h", "Repos"];
const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MIN = [8, 8, 6];

function Page() {
  const zg = employees.filter((e) => e.site === "Zgounder" && ["Production minière", "Usines de traitement", "Maintenance"].includes(e.dept)).slice(0, 36);
  const [plan, setPlan] = useState<Record<string, number>>(() => Object.fromEntries(zg.map((e, i) => [e.id, i % 4])));
  const [day, setDay] = useState(0); const [ai, setAi] = useState(false); const [drag, setDrag] = useState<string | null>(null);
  const expired = new Set(habilitations.filter((h) => h.status === "Expirée").map((h) => h.empId));
  const conflict = (id: string) => expired.has(id) ? "Habilitation expirée" : employees.find((e) => e.id === id)?.status === "En congé" ? "En congé" : null;
  return (
    <ModulePage title="Planning équipes" subtitle="Zgounder · équipes A, B, C, D en 3x8"
      actions={[{ label: "Auto-planifier avec l'IA", primary: true, icon: <Sparkles className="mr-1 h-4 w-4" />, run: () => setAi(true) }, { label: "Publier et notifier", run: () => toast.success("Planning publié — 4 équipes notifiées (v12)") }, { label: "Exporter PDF", run: () => exportPdf("Planning Zgounder — semaine", SHIFTS.slice(0, 3).map((s, i) => [s, zg.filter((e) => plan[e.id] === i).map((e) => e.name).join(", ")])) }, { label: "Demande d'échange", fields: [{ name: "a", label: "Collaborateur A", type: "select", options: zg.map((e) => e.name), required: true }, { name: "b", label: "Collaborateur B", type: "select", options: zg.map((e) => e.name), required: true }], success: "Échange approuvé" }, { label: "Historique des versions", run: () => toast("v12 (aujourd'hui) · v11 (semaine dernière) · v10") }]}>
      <div className="flex gap-1">{DAYS.map((d, i) => <Button key={d} size="sm" variant={day === i ? "default" : "outline"} onClick={() => setDay(i)}>{d}</Button>)}</div>
      <div className="grid gap-3 lg:grid-cols-4">{SHIFTS.map((s, si) => { const list = zg.filter((e) => (plan[e.id] + day) % 4 === si); const ok = si === 3 || list.length >= MIN[si]; return (
        <div key={s} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (drag) { setPlan({ ...plan, [drag]: (si - day + 8) % 4 }); const c = conflict(drag); c ? toast.error(`Conflit : ${c}`) : toast.success("Affectation modifiée"); } }}>
          <Section title={s} action={si < 3 && <StatusBadge label={`${list.length}/${MIN[si]} min.`} tone={ok ? "success" : "danger"} />}>
            <div className="space-y-1.5">{list.map((e) => { const c = conflict(e.id); return <div key={e.id} draggable onDragStart={() => setDrag(e.id)} className={cn("flex cursor-grab items-center gap-2 rounded-lg border p-1.5 text-xs", c ? "border-danger/50 bg-danger/10" : "border-border bg-card/60")}><Avatar name={e.name} size={22} /><span className="flex-1 truncate">{e.name}</span><span className="text-muted-foreground">{e.team.replace("Équipe ", "")}</span>{c && <span className="text-danger" title={c}>!</span>}</div>; })}</div>
          </Section>
        </div>); })}</div>
      <Dialog open={ai} onOpenChange={setAi}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-gold" />Proposition de planning IA</DialogTitle><DialogDescription>Semaine prochaine · 36 postes</DialogDescription></DialogHeader>
        <p className="text-sm"><Typing text="Rotation équilibrée sur 4 équipes, couverture minimale assurée sur tous les quarts. Les collaborateurs avec une habilitation expirée sont affectés en repos ou en formation." /></p>
        <ul className="space-y-1 text-sm">{[["Couverture minimale par poste", true], ["Repos de 11 h entre deux quarts", true], ["Max. 3 nuits consécutives", true], ["Habilitations valides", true], ["Préférences individuelles (2 non satisfaites)", false]].map(([k, v]) => <li key={k as string} className={cn("flex items-center gap-2", v ? "text-success" : "text-warning")}>{v ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}{k}</li>)}</ul>
        <AiDisclaimer />
        <DialogFooter><Button variant="ghost" onClick={() => setAi(false)}>Annuler</Button><Button variant="outline" onClick={() => setAi(false)}>Ajuster</Button><Button onClick={() => { setPlan(Object.fromEntries(zg.map((e, i) => [e.id, expired.has(e.id) ? 3 : i % 3]))); setAi(false); toast.success("Planning IA appliqué"); }}>Accepter</Button></DialogFooter>
      </DialogContent></Dialog>
    </ModulePage>
  );
}
