import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Copy, Maximize2, Minimize2, Mic, Paperclip, Plus, Send, Sparkles, ThumbsDown, ThumbsUp, X, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { setSetting, settings, useStore, setCandidateStatus } from "@/lib/store";
import { candidates, jobDescs, employees, positions, KPI, posById, SITES, habilitations } from "@/data/mock";
import { Typing } from "./kit";
import { toast } from "sonner";

type Msg = { id: number; role: "user" | "ai"; text: string; table?: { head: string[]; rows: (string | number)[][] }; bars?: { label: string; value: number }[]; actions?: { label: string; run: () => void }[]; follow?: string[] };

const CHIPS: Record<string, string[]> = {
  "/dashboard": ["Résume ma journée", "Combien de postes sont ouverts ?", "Quelles habilitations expirent bientôt ?"],
  "/candidatures": ["Qui sont les 5 meilleurs candidats pour Ingénieur Géologue ?", "Combien de candidatures sans décision depuis 5 jours ?", "Présélectionner ces candidats"],
  "/fiches-de-poste": ["Combien de fiches restent à réviser à Zgounder ?", "Quelles fiches ont le score qualité le plus bas ?", "Rédige une annonce pour un technicien de maintenance"],
  "/employes": ["Effectif par site", "Combien de collaborateurs en intégration ?", "Ouvrir la fiche de Samira Baroudi"],
};
const DEFAULT_CHIPS = ["Résume ma journée", "Effectif par site", "Rédige une annonce pour un technicien de maintenance"];

export function Assistant() {
  useStore();
  const loc = useLocation();
  const nav = useNavigate();
  const open = settings.assistantOpen;
  const [big, setBig] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [hist, setHist] = useState(false);
  const [convs, setConvs] = useState<string[]>(["Préparation comité RH", "Analyse turnover Zgounder"]);
  const ctx = useRef<{ intent?: string; site?: string; top?: string[] }>({});
  const end = useRef<HTMLDivElement>(null);
  const base = "/" + loc.pathname.split("/")[1];
  const chips = CHIPS[base] ?? DEFAULT_CHIPS;
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, thinking]);
  useEffect(() => { const f = (e: KeyboardEvent) => { if (e.key === "Escape" && open) setSetting("assistantOpen", false); }; window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f); }, [open]);

  const answer = (q: string): Omit<Msg, "id" | "role"> => {
    const s = q.toLowerCase();
    const site = SITES.find((x) => s.includes(x.toLowerCase()));
    if (s.startsWith("et pour") && ctx.current.intent) return answer(`${ctx.current.intent} ${site ?? ""}`);
    if (/résume|journée/.test(s)) { ctx.current.intent = "résume"; return { text: `Voici votre journée :\n• 12 candidatures sans décision depuis plus de 5 jours\n• ${KPI.pendingLeave} demandes de congé en attente\n• ${KPI.habs.expired} habilitations expirées et ${KPI.habs.expiring} qui expirent sous 60 jours\n• ${jobDescs.filter((j) => j.status === "En validation").length} fiches de poste en validation\n• ${KPI.hrOpen} demandes RH ouvertes`, actions: [{ label: "Voir les candidatures en retard", run: () => nav({ to: "/candidatures", search: { "c.f_stale": "1" } as any }) }], follow: ["Quelles habilitations expirent bientôt ?", "Et pour Boumadine ?"] }; }
    if (/meilleurs candidats|top/.test(s)) {
      const pos = positions.find((p) => s.includes(p.title.toLowerCase())) ?? positions[0];
      const list = candidates.filter((c) => c.positionId === pos.id && c.status !== "Refusée").sort((a, b) => b.score - a.score).slice(0, 5);
      ctx.current = { intent: "meilleurs candidats " + pos.title, top: list.map((c) => c.id) };
      return { text: `Les 5 meilleurs candidats pour ${pos.title} (${pos.site}) selon l'analyse IA :`, table: { head: ["Candidat", "Score", "Statut"], rows: list.map((c) => [c.name, c.score, c.status]) }, actions: [{ label: "Présélectionner ces candidats", run: () => setCandidateStatus(list.filter((c) => c.status === "Nouvelle").map((c) => c.id), "Présélectionnée", "Présélectionné(e) via Assistant IA") }, { label: "Voir dans l'application", run: () => nav({ to: "/candidatures", search: { "c.f_position": pos.title, "c.sort": "score:desc" } as any }) }], follow: ["Présélectionner ces candidats", "Et pour Technicien maintenance ?"] };
    }
    if (/présélectionner ces/.test(s)) {
      const ids = (ctx.current.top ?? []).filter((id) => candidates.find((c) => c.id === id)?.status === "Nouvelle");
      if (!ctx.current.top) return { text: "De quels candidats parlez-vous ? Demandez-moi d'abord les meilleurs candidats pour un poste." };
      setCandidateStatus(ids, "Présélectionnée", "Présélectionné(e) via Assistant IA");
      return { text: ids.length ? `${ids.length} candidat(s) présélectionné(s). Vous pouvez annuler depuis la notification.` : "Ces candidats sont déjà au-delà du statut « Nouvelle »." };
    }
    if (/sans décision/.test(s)) return { text: `${candidates.filter((c) => c.status === "Nouvelle" && c.lastActionDays > 5).length} candidatures n'ont reçu aucune décision depuis plus de 5 jours (sur ${candidates.filter((c) => c.status === "Nouvelle").length} nouvelles).`, actions: [{ label: "Voir dans l'application", run: () => nav({ to: "/candidatures", search: { "c.f_stale": "1" } as any }) }] };
    if (/fiches?.*(réviser|reste)/.test(s)) {
      ctx.current.intent = "fiches à réviser";
      const l = jobDescs.filter((j) => j.status === "À réviser" && (!site || j.site === site));
      return { text: `${l.length} fiche(s) à réviser${site ? ` à ${site}` : " au total"} (sur ${KPI.fp.toRevise} au global).`, bars: SITES.map((x) => ({ label: x, value: jobDescs.filter((j) => j.status === "À réviser" && j.site === x).length })), actions: [{ label: "Voir dans l'application", run: () => nav({ to: "/fiches-de-poste", search: { "fp.f_status": "À réviser" } as any }) }], follow: ["Et pour Boumadine ?"] };
    }
    if (/qualité/.test(s)) { const l = [...jobDescs].sort((a, b) => a.quality - b.quality).slice(0, 5); return { text: "Les 5 fiches avec le score qualité le plus bas :", table: { head: ["Réf.", "Intitulé", "Score"], rows: l.map((j) => [j.ref, j.title, j.quality]) } }; }
    if (/effectif/.test(s)) { ctx.current.intent = "effectif"; if (site) return { text: `Effectif à ${site} : ${employees.filter((e) => e.site === site).length} collaborateurs.` }; return { text: `Effectif total : ${KPI.effectif} collaborateurs.`, bars: SITES.map((x) => ({ label: x, value: employees.filter((e) => e.site === x).length })) }; }
    if (/postes? (sont )?ouverts?/.test(s)) return { text: `${KPI.openPositions} postes sont ouverts, pour ${KPI.applications} candidatures reçues.`, table: { head: ["Poste", "Site", "Candidatures"], rows: positions.map((p) => [p.title, p.site, candidates.filter((c) => c.positionId === p.id).length]) } };
    if (/habilitation/.test(s)) return { text: `${KPI.habs.expiring} habilitations expirent dans les 60 jours et ${KPI.habs.expired} sont déjà expirées.`, bars: ["Travail en hauteur", "Conduite d'engins", "Secourisme", "Espaces confinés"].map((t) => ({ label: t, value: habilitations.filter((h) => h.type === t && h.status !== "Valide").length })), actions: [{ label: "Voir dans l'application", run: () => nav({ to: "/habilitations" }) }] };
    if (/intégration/.test(s)) return { text: `${KPI.onboarding} collaborateurs sont actuellement en intégration.`, actions: [{ label: "Voir dans l'application", run: () => nav({ to: "/integration" }) }] };
    if (/ouvrir la fiche de/.test(s)) { const n = q.replace(/.*fiche de /i, "").trim().toLowerCase(); const e = employees.find((x) => x.name.toLowerCase().includes(n)); const c = candidates.find((x) => x.name.toLowerCase().includes(n)); if (e) { nav({ to: "/employes/$id", params: { id: e.id } }); return { text: `J'ouvre le dossier de ${e.name}.` }; } if (c) { nav({ to: "/candidatures/$id", params: { id: c.id } }); return { text: `J'ouvre la candidature de ${c.name}.` }; } return { text: `Je ne trouve personne nommé « ${n} ». Pouvez-vous préciser le nom complet ?` }; }
    if (/annonce/.test(s)) return { text: "Technicien de maintenance — Zgounder (CDI)\n\nMissions : assurer la maintenance préventive et corrective des équipements miniers et de l'usine de traitement, diagnostiquer les pannes, appliquer les consignes HSE.\n\nProfil : Bac+2/3 en électromécanique, 3 ans d'expérience en milieu industriel, habilitation électrique, mobilité sur site en rotation.", actions: [{ label: "Accepter", run: () => { toast.success("Annonce créée en brouillon"); nav({ to: "/offres" }); } }, { label: "Modifier", run: () => nav({ to: "/offres" }) }] };
    return { text: "Je n'ai pas bien compris votre demande. Souhaitez-vous des informations sur les candidatures, les fiches de poste, l'effectif ou les habilitations ?", follow: chips };
  };

  const ask = (q: string) => {
    if (!q.trim()) return;
    setMsgs((m) => [...m, { id: Date.now(), role: "user", text: q }]); setInput(""); setThinking(true);
    setTimeout(() => { setThinking(false); setMsgs((m) => [...m, { id: Date.now() + 1, role: "ai", ...answer(q) }]); }, 900);
  };

  return (
    <TooltipProvider>
      <AnimatePresence>
        {!open && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="fixed bottom-6 right-6 z-40 no-print">
            <Tooltip><TooltipTrigger asChild>
              <button onClick={() => setSetting("assistantOpen", true)} aria-label="Assistant IA (Ctrl+J)" className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gold-silver text-primary-foreground shadow-2xl animate-pulse-ring hover:scale-105 transition-transform">
                <Sparkles className="h-6 w-6" /><span className="absolute -right-1 -top-1 rounded-full bg-background px-1.5 text-[10px] font-bold text-gold ring-1 ring-gold">IA</span>
              </button>
            </TooltipTrigger><TooltipContent side="left">Assistant IA (Ctrl+J)</TooltipContent></Tooltip>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {open && (
          <motion.aside initial={{ x: 460, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 460, opacity: 0 }} transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className={cn("glass fixed bottom-4 right-4 top-4 z-50 flex flex-col rounded-2xl", big ? "left-4 md:left-[20%]" : "w-[calc(100%-2rem)] sm:w-[420px]")} role="dialog" aria-label="Assistant IA">
            <header className="flex items-center gap-2 border-b border-border p-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-silver text-primary-foreground"><Bot className="h-4 w-4" /></span>
              <div className="flex-1"><p className="text-sm font-semibold">Assistant AYA</p><p className="text-[11px] text-muted-foreground">Contexte : {base.slice(1) || "accueil"}</p></div>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setHist(!hist)} aria-label="Historique"><History className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { if (msgs.length) setConvs((c) => [msgs[0].text.slice(0, 40), ...c]); setMsgs([]); ctx.current = {}; }} aria-label="Nouvelle conversation"><Plus className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setBig(!big)} aria-label="Agrandir">{big ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}</Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setSetting("assistantOpen", false)} aria-label="Fermer"><X className="h-4 w-4" /></Button>
            </header>
            <AnimatePresence>{hist && <motion.ul initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden border-b border-border text-sm">{convs.map((c, i) => <li key={i} className="truncate px-4 py-2 text-muted-foreground hover:bg-accent/50">{c}</li>)}</motion.ul>}</AnimatePresence>
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {msgs.length === 0 && (
                <div className="py-6 text-center"><Sparkles className="mx-auto h-8 w-8 text-gold" /><p className="mt-2 font-semibold">Bonjour Mme Baroudi</p><p className="text-sm text-muted-foreground">Posez une question sur vos données RH.</p></div>
              )}
              {msgs.map((m) => <Bubble key={m.id} m={m} onAsk={ask} />)}
              {thinking && <div className="flex items-center gap-2 text-sm text-muted-foreground"><span className="flex gap-1">{[0, 1, 2].map((i) => <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-gold" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }} />)}</span>L'IA réfléchit…</div>}
              <div ref={end} />
            </div>
            <div className="border-t border-border p-3">
              <div className="mb-2 flex flex-wrap gap-1.5">{chips.map((c) => <button key={c} onClick={() => ask(c)} className="rounded-full border border-gold/30 bg-gold/5 px-2.5 py-1 text-left text-xs hover:bg-gold/15">{c}</button>)}</div>
              <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="flex items-center gap-1 rounded-xl border border-input bg-background/60 p-1">
                <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => toast("Pièce jointe (simulée)")} aria-label="Joindre"><Paperclip className="h-4 w-4" /></Button>
                <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Posez votre question…" className="flex-1 bg-transparent px-1 text-sm outline-none" aria-label="Message" />
                <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => toast("Dictée vocale (simulée)")} aria-label="Dictée vocale"><Mic className="h-4 w-4" /></Button>
                <Button type="submit" size="icon" className="h-8 w-8" aria-label="Envoyer"><Send className="h-4 w-4" /></Button>
              </form>
              <p className="mt-2 text-center text-[10px] text-muted-foreground">L'IA peut se tromper. Vérifiez les informations importantes.</p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </TooltipProvider>
  );
}

function Bubble({ m, onAsk }: { m: Msg; onAsk: (q: string) => void }) {
  const [fb, setFb] = useState<0 | 1 | -1>(0);
  if (m.role === "user") return <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground">{m.text}</div>;
  const max = Math.max(1, ...(m.bars?.map((b) => b.value) ?? [1]));
  return (
    <div className="max-w-[95%] space-y-2">
      <div className="rounded-2xl rounded-bl-sm bg-card/80 px-3 py-2 text-sm"><Typing text={m.text} /></div>
      {m.table && <table className="w-full overflow-hidden rounded-lg text-xs"><thead><tr className="bg-muted">{m.table.head.map((h) => <th key={h} className="px-2 py-1 text-left">{h}</th>)}</tr></thead><tbody>{m.table.rows.map((r, i) => <tr key={i} className="border-t border-border">{r.map((v, j) => <td key={j} className="px-2 py-1 tnum">{v}</td>)}</tr>)}</tbody></table>}
      {m.bars && <div className="space-y-1">{m.bars.map((b) => <div key={b.label} className="flex items-center gap-2 text-xs"><span className="w-24 truncate">{b.label}</span><div className="h-2 flex-1 rounded bg-muted"><motion.div className="h-2 rounded bg-gold" initial={{ width: 0 }} animate={{ width: `${(b.value / max) * 100}%` }} /></div><span className="w-8 text-right tnum">{b.value}</span></div>)}</div>}
      <div className="flex flex-wrap items-center gap-1">
        {m.actions?.map((a) => <Button key={a.label} size="sm" variant="outline" className="h-7 text-xs" onClick={a.run}>{a.label}</Button>)}
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { navigator.clipboard?.writeText(m.text); toast("Copié"); }} aria-label="Copier"><Copy className="h-3 w-3" /></Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => toast.success("Rapport créé à partir de la réponse")}>Transformer en rapport</Button>
        <Button size="icon" variant="ghost" className={cn("h-7 w-7", fb === 1 && "text-success")} onClick={() => setFb(1)} aria-label="Utile"><ThumbsUp className="h-3 w-3" /></Button>
        <Button size="icon" variant="ghost" className={cn("h-7 w-7", fb === -1 && "text-danger")} onClick={() => setFb(-1)} aria-label="Pas utile"><ThumbsDown className="h-3 w-3" /></Button>
      </div>
      {m.follow && <div className="flex flex-wrap gap-1">{m.follow.map((f) => <button key={f} onClick={() => onAsk(f)} className="rounded-full bg-muted px-2 py-0.5 text-[11px] hover:bg-accent">{f}</button>)}</div>}
    </div>
  );
}

export type { ReactNode };
