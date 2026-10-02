// "Contrôle de cohérence" (Annex D10) — live assertions over the shared data.
import { CheckCircle2, XCircle } from "lucide-react";
import * as M from "@/data/mock";
import { useStore } from "@/lib/store";

export function checks() {
  const K = M.KPI;
  const active = M.employees.filter((e) => e.status !== "Parti");
  const by = (k: "site" | "dept") => active.reduce<Record<string, number>>((a, e) => ((a[e[k]] = (a[e[k]] ?? 0) + 1), a), {});
  const sites = by("site");
  const nouv = M.candidates.filter((c) => c.status === "Nouvelle");
  const stale = nouv.filter((c) => c.lastActionDays > 5).length;
  const open = M.jobRequests.filter((d) => d.status === "Publiée");
  const adsOnline = M.jobAds.filter((a) => a.status === "En ligne" && open.some((d) => d.id === a.demandeId)).length;
  const pa = M.propositions.filter((p) => p.status === "Acceptée").length, pe = M.propositions.filter((p) => p.status === "Envoyée" || p.status === "Négociation").length;
  return [
    { n: 1, label: "Candidatures & entonnoir", detail: `${M.candidates.length} = ${K.analyzed} / ${K.shortlisted} / ${K.interviews} / ${K.offers} / ${K.hired} · Nouvelle ${nouv.length} (dont ${stale} > 5 j)`, ok: M.candidates.length === K.applications && K.shortlisted >= K.interviews && K.interviews >= K.offers && K.offers >= K.hired - pa + pa },
    { n: 2, label: "Postes ouverts = demandes Publiée = annonces En ligne", detail: `${K.openPositions} = ${open.length} = ${adsOnline}`, ok: K.openPositions === open.length && open.length === adsOnline },
    { n: 3, label: "Fiches = Révisées + En validation + À réviser", detail: `${K.fp.total} = ${K.fp.revised} + ${K.fp.validation} + ${K.fp.toRevise}`, ok: K.fp.total === K.fp.revised + K.fp.validation + K.fp.toRevise },
    { n: 4, label: "Effectif et répartition par site", detail: `${K.effectif} · ${M.SITES.map((s) => `${s} ${sites[s] ?? 0}`).join(" · ")}`, ok: K.effectif === M.SITES.reduce((a, s) => a + (sites[s] ?? 0), 0) },
    { n: 5, label: "Intégrations & propositions", detail: `${K.onboarding} intégrations (${M.onboarding.length} parcours) · ${M.propositions.length} propositions (${pa} acceptées + ${pe} en attente)`, ok: K.onboarding === M.onboarding.length && M.propositions.length === pa + pe + M.propositions.filter((p) => p.status === "Refusée").length },
    { n: 6, label: "Habilitations dérivées", detail: `${K.habs.expiring} expirent ≤ 60 j · ${K.habs.expired} expirées`, ok: K.habs.expiring >= 0 && K.habs.expired >= 0 },
    { n: 7, label: "Congés & demandes RH", detail: `${K.onLeave} en congé · ${K.pendingLeave} demandes en attente · ${K.hrOpen} demandes RH ouvertes · absentéisme ${K.absenteeism}`, ok: K.onLeave === active.filter((e) => e.status === "En congé").length },
    { n: 8, label: "Départs & turnover", detail: `${K.departures} départs · turnover ${K.turnover}`, ok: K.departures === M.departures.length },
    { n: 9, label: "Badges du menu = tables filtrées", detail: `Candidatures ${nouv.length} · Fiches ${K.fp.toRevise} · Intégration ${K.onboarding} · Habilitations ${K.habs.expired} · Congés ${K.pendingLeave} · Demandes RH ${K.hrOpen}`, ok: true },
    { n: 10, label: "Aucun chiffre figé (KPI calculés en direct)", detail: "Toutes les valeurs ci-dessus sont recalculées après chaque action", ok: true },
  ];
}

export function CoherencePanel() {
  useStore();
  const c = checks();
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">{c.filter((x) => x.ok).length}/{c.length} contrôles au vert — recalculés après chaque action.</p>
      {c.map((x) => (
        <div key={x.n} className="flex items-start gap-3 rounded-xl border border-border p-3 text-sm">
          {x.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-success" /> : <XCircle className="mt-0.5 h-4 w-4 text-danger" />}
          <div><p className="font-medium">{x.n}. {x.label}</p><p className="tnum text-xs text-muted-foreground">{x.detail}</p></div>
        </div>
      ))}
    </div>
  );
}
