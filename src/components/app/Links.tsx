// Cross-navigation components (Annex D0/D9): RelatedItems, PersonTimeline, JobChain.
import { Link } from "@tanstack/react-router";
import { ChevronRight, Link2 } from "lucide-react";
import * as M from "@/data/mock";
import { StatusBadge } from "./kit";
import { cn } from "@/lib/utils";

export type Related = { group: string; ref: string; label?: string; status?: string; to?: string };

export function RelatedItems({ items, title = "Éléments liés" }: { items: Related[]; title?: string }) {
  const groups = [...new Set(items.map((i) => i.group))];
  return (
    <div className="glass rounded-2xl p-4">
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold"><Link2 className="h-4 w-4 text-gold" />{title}</p>
      {!items.length && <p className="text-sm text-muted-foreground">Aucun élément lié.</p>}
      <div className="space-y-3">{groups.map((g) => (
        <div key={g}><p className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">{g} · {items.filter((i) => i.group === g).length}</p>
          <ul className="space-y-1">{items.filter((i) => i.group === g).slice(0, 8).map((i, k) => (
            <li key={k} className="flex items-center gap-2 text-sm">
              {i.to ? <a href={i.to} className="font-mono text-xs text-gold hover:underline">{i.ref}</a> : <span className="font-mono text-xs">{i.ref}</span>}
              <span className="flex-1 truncate">{i.label}</span>{i.status && <StatusBadge label={i.status} />}
            </li>))}</ul></div>))}</div>
    </div>
  );
}

/** All events of one person across modules (seed-derived + action-generated). */
export function personEvents(id: string) {
  const out: { when: string; module: string; label: string; to?: string }[] = M.events.filter((e) => e.personId === id).map((e) => ({ ...e }));
  const c = M.candidates.find((x) => x.id === id);
  if (c) {
    out.push({ when: c.applied, module: "Candidature", label: `Candidature ${c.ref} via ${c.source} — score IA ${c.score}` });
    M.interviews.filter((i) => i.candId === id && !M.events.some((e) => e.personId === id && e.module === "Entretien")).forEach((i) => out.push({ when: i.date, module: "Entretien", label: `Entretien ${i.type} · ${i.status}`, to: "/entretiens" }));
    M.propositions.filter((p) => p.candId === id && !M.events.some((e) => e.personId === id && e.module === "Proposition")).forEach((p) => out.push({ when: p.start, module: "Proposition", label: `Proposition ${p.id} · ${p.status}` }));
  }
  const e = M.empById(id);
  if (e) {
    if (e.fromCandId) out.push({ when: M.candidates.find((x) => x.id === e.fromCandId)!.applied, module: "Candidature", label: "Candidature via la plateforme", to: `/candidatures/${e.fromCandId}` });
    if (!M.events.some((x) => x.personId === id && x.module === "Embauche")) out.push({ when: e.hireDate, module: "Embauche", label: `Embauche · ${e.job} (${e.site})` });
    M.habilitations.filter((h) => h.empId === id).forEach((h) => out.push({ when: h.expires, module: "Habilitation", label: `${h.type} · ${h.status}`, to: "/habilitations" }));
    M.leaveRequests.filter((l) => l.empId === id && !M.events.some((x) => x.personId === id && x.label.includes(M.fmtDate(l.start)))).forEach((l) => out.push({ when: l.start, module: "Congés", label: `${l.type} · ${l.days} j · ${l.status}`, to: "/conges" }));
    M.departures.filter((d) => d.empId === id && !M.events.some((x) => x.personId === id && x.module === "Départ")).forEach((d) => out.push({ when: d.lastDay, module: "Départ", label: `${d.type} · ${d.status}`, to: "/departs" }));
  }
  return out.sort((a, b) => +new Date(b.when) - +new Date(a.when));
}

export function PersonTimeline({ id }: { id: string }) {
  const ev = personEvents(id);
  return (
    <div className="glass rounded-2xl p-4">
      <p className="mb-3 text-sm font-semibold">Frise du parcours <span className="text-xs font-normal text-muted-foreground">· {ev.length} événements, tous modules</span></p>
      <ol className="relative max-h-80 space-y-3 overflow-y-auto border-l border-border pl-5">{ev.map((x, i) => (
        <li key={i} className="text-sm"><span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-gold" />
          <p className="text-xs text-muted-foreground">{M.fmtDate(x.when)} · <span className="text-gold">{x.module}</span></p>
          {x.to ? <a href={x.to} className="hover:underline">{x.label}</a> : <p>{x.label}</p>}
        </li>))}</ol>
    </div>
  );
}

/** Demande → Fiche → Annonce → Candidatures → Entretiens → Proposition → Recrutement → Intégration */
export function JobChain({ demandeId, current }: { demandeId?: string; current: string }) {
  const d = M.jobRequests.find((x) => x.id === demandeId);
  if (!d) return null;
  const f = M.jobDescs.find((j) => j.id === d.ficheId);
  const ad = M.jobAds.find((a) => a.demandeId === d.id);
  const cs = M.candidates.filter((c) => c.demandeId === d.id);
  const ids = new Set(cs.map((c) => c.id));
  const ivs = M.interviews.filter((i) => ids.has(i.candId));
  const props = M.propositions.filter((p) => ids.has(p.candId));
  const hires = cs.filter((c) => c.status === "Recrutée");
  const emps = M.employees.filter((e) => e.fromCandId && ids.has(e.fromCandId));
  const steps = [
    { k: "Demande", v: d.status, to: "/demandes-de-poste?dp.mode=table" },
    { k: "Fiche", v: f ? `${f.ref} ${f.version}` : "—", to: f ? `/fiches-de-poste/${f.id}` : undefined },
    { k: "Annonce", v: ad ? `${ad.id} · ${ad.status}` : "À créer", to: "/offres" },
    { k: "Candidatures", v: `${cs.length}`, to: `/candidatures` },
    { k: "Entretiens", v: `${ivs.length}`, to: "/entretiens" },
    { k: "Proposition", v: `${props.length}`, to: undefined },
    { k: "Recrutement", v: `${hires.length}/${d.count}`, to: hires[0] ? `/candidatures/${hires[0].id}` : undefined },
    { k: "Intégration", v: `${emps.filter((e) => e.status === "En intégration").length}`, to: "/integration" },
  ];
  return (
    <div className="glass mb-5 flex flex-wrap items-center gap-1 rounded-2xl p-3 text-xs">
      <span className="mr-2 font-semibold text-muted-foreground">Chaîne du poste · {d.id}</span>
      {steps.map((s, i) => {
        const inner = <span className={cn("flex flex-col rounded-lg px-2.5 py-1.5", s.k === current ? "bg-gold/20 text-gold ring-1 ring-gold/50" : "hover:bg-muted/50")}><span className="font-semibold">{s.k}</span><span className="tnum text-muted-foreground">{s.v}</span></span>;
        return <span key={s.k} className="flex items-center">{s.to ? <a href={s.to}>{inner}</a> : inner}{i < steps.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}</span>;
      })}
    </div>
  );
}
export { Link };
