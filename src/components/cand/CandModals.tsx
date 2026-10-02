import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { candidates, posById, RECRUITERS, employees } from "@/data/mock";
import { setCandidateStatus } from "@/lib/store";
import { confetti, Avatar } from "@/components/app/kit";
import { Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const REASONS = ["Score insuffisant", "Expérience insuffisante", "Profil non adapté au site", "Prétentions salariales", "Poste pourvu", "Autre"];
const TEMPLATES: Record<string, string> = {
  Standard: "Bonjour {{nom}},\n\nNous vous remercions pour l'intérêt porté à AYA Gold & Silver et au poste de {{poste}}. Après étude attentive, nous ne donnerons pas suite à votre candidature.\n\nNous conservons votre profil et ne manquerons pas de revenir vers vous.\n\nCordialement,\nL'équipe RH",
  "Après entretien": "Bonjour {{nom}},\n\nMerci pour le temps accordé lors de nos échanges pour le poste de {{poste}}. Nous avons retenu un autre profil, plus proche de nos besoins actuels.\n\nCordialement,\nL'équipe RH",
};

export function RefuseDialog({ ids, open, onOpenChange, onDone }: { ids: string[]; open: boolean; onOpenChange: (o: boolean) => void; onDone?: () => void }) {
  const [reason, setReason] = useState(REASONS[0]); const [tpl, setTpl] = useState("Standard"); const [err, setErr] = useState(false);
  const c = candidates.find((x) => x.id === ids[0]);
  const preview = TEMPLATES[tpl].replace("{{nom}}", c?.name ?? "").replace("{{poste}}", c ? posById(c.positionId).title : "");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Refuser {ids.length > 1 ? `${ids.length} candidatures` : c?.name}</DialogTitle><DialogDescription>Le motif est obligatoire et tracé dans le journal d'audit.</DialogDescription></DialogHeader>
        <div className="space-y-3">
          <div><label className="text-xs font-medium">Motif *</label><select className={cn("mt-1 w-full rounded-md border border-input bg-background px-2 py-2 text-sm", err && "border-danger")} value={reason} onChange={(e) => { setReason(e.target.value); setErr(false); }}>{REASONS.map((r) => <option key={r}>{r}</option>)}</select></div>
          <div><label className="text-xs font-medium">Modèle d'email</label><select className="mt-1 w-full rounded-md border border-input bg-background px-2 py-2 text-sm" value={tpl} onChange={(e) => setTpl(e.target.value)}>{Object.keys(TEMPLATES).map((t) => <option key={t}>{t}</option>)}</select></div>
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs whitespace-pre-wrap">{preview}</div>
        </div>
        <DialogFooter><Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button><Button variant="destructive" onClick={() => { if (!reason) return setErr(true); setCandidateStatus(ids, "Refusée", `Refus : ${reason}`); onOpenChange(false); onDone?.(); }}>Refuser et envoyer</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ScheduleDialog({ ids, open, onOpenChange, onDone }: { ids: string[]; open: boolean; onOpenChange: (o: boolean) => void; onDone?: () => void }) {
  const [step, setStep] = useState(0); const [slot, setSlot] = useState(-1); const [mode, setMode] = useState("Visio"); const [parts, setParts] = useState<string[]>([RECRUITERS[0]]);
  const c = candidates.find((x) => x.id === ids[0]);
  const pos = c ? posById(c.positionId) : null;
  const suggested = employees.filter((e) => e.dept === pos?.dept && /Ingénieur|Chef|Responsable/.test(e.job)).slice(0, 3).map((e) => e.name);
  const slots = ["Demain 10:00 – 11:00", "Jeudi 14:30 – 15:30", "Lundi 09:00 – 10:00"];
  const close = () => { onOpenChange(false); setStep(0); setSlot(-1); };
  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Planifier un entretien</DialogTitle><DialogDescription>Étape {step + 1} / 4 · {ids.length} candidat(s)</DialogDescription></DialogHeader>
        <div className="flex gap-1">{[0, 1, 2, 3].map((i) => <span key={i} className={cn("h-1 flex-1 rounded-full", i <= step ? "bg-gold" : "bg-muted")} />)}</div>
        {step === 0 && <div className="space-y-2">{ids.slice(0, 6).map((id) => { const x = candidates.find((k) => k.id === id)!; return <div key={id} className="flex items-center gap-2 text-sm"><Avatar name={x.name} size={28} />{x.name}<span className="text-muted-foreground">· {posById(x.positionId).title}</span></div>; })}{ids.length > 6 && <p className="text-xs text-muted-foreground">+ {ids.length - 6} autres</p>}</div>}
        {step === 1 && <div className="space-y-2"><p className="flex items-center gap-1 text-xs text-gold"><Sparkles className="h-3 w-3" />Intervenants suggérés par l'IA selon les compétences</p>{[...RECRUITERS.slice(0, 2), ...suggested].map((p) => <label key={p} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={parts.includes(p)} onChange={() => setParts((s) => s.includes(p) ? s.filter((x) => x !== p) : [...s, p])} />{p}{suggested.includes(p) && <span className="text-xs text-gold">suggéré</span>}</label>)}</div>}
        {step === 2 && <div className="space-y-2"><p className="flex items-center gap-1 text-xs text-gold"><Sparkles className="h-3 w-3" />3 créneaux proposés (agendas et congés vérifiés)</p>{slots.map((s, i) => <button key={s} onClick={() => setSlot(i)} className={cn("flex w-full items-center justify-between rounded-lg border p-3 text-sm", slot === i ? "border-gold bg-gold/10" : "border-border")}>{s}{i === 2 && <span className="text-xs text-warning">1 conflit : Karim Tazi en congé</span>}{slot === i && <Check className="h-4 w-4 text-gold" />}</button>)}<div className="flex gap-2 pt-2">{["Présentiel", "Visio"].map((m) => <Button key={m} size="sm" variant={mode === m ? "default" : "outline"} onClick={() => setMode(m)}>{m}</Button>)}</div><p className="text-xs text-muted-foreground">{mode === "Visio" ? "Lien généré : https://meet.aya-demo.ma/ent-" + (c?.ref ?? "") : "Salle : Salle de réunion RH — " + (pos?.site ?? "")}</p></div>}
        {step === 3 && <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs whitespace-pre-wrap">{`Objet : Invitation à un entretien — ${pos?.title}\n\nBonjour ${c?.name},\n\nNous avons le plaisir de vous inviter à un entretien le ${slots[Math.max(0, slot)]} (${mode}).\nIntervenants : ${parts.join(", ")}.\n\nCordialement,\nL'équipe RH AYA`}</div>}
        <DialogFooter>
          {step > 0 && <Button variant="outline" onClick={() => setStep(step - 1)}>Précédent</Button>}
          {step < 3 ? <Button disabled={step === 2 && slot < 0} onClick={() => setStep(step + 1)}>Suivant</Button> : <Button onClick={() => { setCandidateStatus(ids, "Entretien", "Entretien planifié"); close(); onDone?.(); }}>Envoyer les invitations</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function OfferDialog({ id, open, onOpenChange }: { id: string; open: boolean; onOpenChange: (o: boolean) => void }) {
  const c = candidates.find((x) => x.id === id)!; const pos = posById(c.positionId);
  const [salary, setSalary] = useState("18000"); const [start, setStart] = useState(new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10)); const [contract, setContract] = useState("CDI");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Envoyer une offre à {c.name}</DialogTitle><DialogDescription>{pos.title} · {pos.site}</DialogDescription></DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div><label className="text-xs font-medium">Salaire mensuel brut (MAD) *</label><Input value={salary} onChange={(e) => setSalary(e.target.value.replace(/\D/g, ""))} /></div>
            <div><label className="text-xs font-medium">Date de début *</label><Input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></div>
            <div><label className="text-xs font-medium">Contrat</label><select value={contract} onChange={(e) => setContract(e.target.value)} className="w-full rounded-md border border-input bg-background px-2 py-2 text-sm">{["CDI", "CDD", "Stage"].map((x) => <option key={x}>{x}</option>)}</select></div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 text-xs leading-relaxed">
            <img src="/aya-logo.png" alt="" className="mb-3 h-8" />
            <p className="font-semibold">Lettre d'offre</p>
            <p className="mt-2">Madame, Monsieur {c.name},</p>
            <p className="mt-2">Nous avons le plaisir de vous proposer le poste de <b>{pos.title}</b> à {pos.site}, en {contract}, à compter du {new Date(start).toLocaleDateString("fr-FR")}, pour une rémunération mensuelle brute de <b>{Number(salary).toLocaleString("fr-FR")} MAD</b>.</p>
            <p className="mt-2">Mme Baroudi, DRH</p>
          </div>
        </div>
        <DialogFooter><Button variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button><Button disabled={!salary} onClick={() => { setCandidateStatus([id], "Offre", "Offre envoyée"); onOpenChange(false); confetti(); }}>Envoyer l'offre</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function NotesBox() {
  const [notes, setNotes] = useState([{ who: "Karim Tazi", t: "Profil solide, @Salma Idrissi peux-tu valider la mobilité ?", when: "il y a 2 j" }]);
  const [v, setV] = useState("");
  return (
    <div className="space-y-3">
      {notes.map((n, i) => <div key={i} className="rounded-lg bg-muted/50 p-3 text-sm"><p className="text-xs text-muted-foreground">{n.who} · {n.when}</p><p>{n.t.split(/(@\w+ \w+)/).map((p, j) => p.startsWith("@") ? <b key={j} className="text-gold">{p}</b> : p)}</p></div>)}
      <Textarea value={v} onChange={(e) => setV(e.target.value)} placeholder="Ajouter une note (utilisez @ pour mentionner)…" maxLength={500} />
      <div className="flex justify-between text-xs text-muted-foreground"><span>{v.length}/500</span><Button size="sm" disabled={!v.trim()} onClick={() => { setNotes([...notes, { who: "Mme Baroudi", t: v, when: "à l'instant" }]); setV(""); }}>Publier</Button></div>
    </div>
  );
}
