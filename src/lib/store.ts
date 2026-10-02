import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import { candidates, jobDescs, auditLog, type CandStatus } from "@/data/mock";

type Settings = {
  site: string; theme: "dark" | "light"; reducedMotion: boolean; lang: "FR" | "EN"; sidebarCollapsed: boolean;
  viewAs: null | "Manager" | "Collaborateur"; tourDone: boolean; assistantOpen: boolean;
};
export const settings: Settings = { site: "Tous", theme: "dark", reducedMotion: false, lang: "FR", sidebarCollapsed: false, viewAs: null, tourDone: false, assistantOpen: false };

export type Notif = { id: number; title: string; body: string; to: string; read: boolean; when: string };
export const notifications: Notif[] = [
  { id: 1, title: "12 candidatures sans décision", body: "Depuis plus de 5 jours", to: "/candidatures?stale=1", read: false, when: "il y a 10 min" },
  { id: 2, title: "Fiche FP-0012 à valider", body: "En attente de votre validation", to: "/fiches-de-poste/FP-0012", read: false, when: "il y a 1 h" },
  { id: 3, title: "9 habilitations expirées", body: "Zgounder et Boumadine", to: "/habilitations", read: false, when: "il y a 2 h" },
  { id: 4, title: "Nouvelle demande de poste", body: "DP-2026-014 — Maintenance", to: "/demandes-de-poste", read: true, when: "hier" },
  { id: 5, title: "Compte rendu manquant", body: "Entretien technique — Ingénieur Géologue", to: "/entretiens", read: false, when: "hier" },
  { id: 6, title: "14 demandes de congé en attente", body: "À valider", to: "/conges", read: true, when: "il y a 2 j" },
];

let version = 0;
const listeners = new Set<() => void>();
export function emit() { version++; listeners.forEach((l) => l()); }
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
export function useStore() { return useSyncExternalStore(subscribe, () => version, () => version); }

export function setSetting<K extends keyof Settings>(k: K, v: Settings[K]) {
  settings[k] = v;
  if (typeof window !== "undefined") {
    try { sessionStorage.setItem("aya-settings", JSON.stringify(settings)); } catch {}
    if (k === "theme") applyTheme();
  }
  emit();
}
export function loadSettings() {
  try { Object.assign(settings, JSON.parse(sessionStorage.getItem("aya-settings") || "{}"), { assistantOpen: false }); } catch {}
  applyTheme();
  emit();
}
function applyTheme() { document.documentElement.classList.toggle("light", settings.theme === "light"); }

export function audit(what: string, object: string, before = "—", after = "—") {
  auditLog.unshift({ id: `AUD-${auditLog.length + 1}`, who: "Samira Baroudi", what, object, when: new Date().toISOString(), before, after, ip: "10.20.1.15" });
}

const STATUS_DETAIL: Record<CandStatus, string> = {
  Nouvelle: "Nouvelle (à décider)", "Présélectionnée": "En attente d'entretien", Entretien: "Entretien planifié ou en cours",
  Offre: "Proposition en attente", "Recrutée": "Recrutée", "Refusée": "Refusée", Vivier: "Vivier",
};
/** Change candidate statuses with a 6s undo toast. */
export function setCandidateStatus(ids: string[], status: CandStatus, label?: string) {
  const prev = ids.map((id) => { const c = candidates.find((x) => x.id === id)!; return { c, s: c.status, d: c.detail, a: c.lastAction, l: c.lastActionDays }; });
  prev.forEach(({ c }) => { c.status = status; c.detail = STATUS_DETAIL[status]; c.lastAction = label ?? `Statut : ${status}`; c.lastActionDays = 0; audit("Changement de statut candidat", c.ref, prev.find((p) => p.c === c)!.s, status); });
  emit();
  toast.success(`${ids.length} candidature(s) → ${status}`, {
    duration: 6000,
    action: { label: "Annuler", onClick: () => { prev.forEach(({ c, s, d, a, l }) => { c.status = s; c.detail = d; c.lastAction = a; c.lastActionDays = l; }); emit(); toast("Action annulée"); } },
  });
}
export function setJobDescStatus(id: string, status: (typeof jobDescs)[number]["status"]) {
  import("./actions").then((m) => m.setFicheStatus(id, status));
}
export function undoToast(msg: string, undo?: () => void) {
  toast.success(msg, { duration: 6000, action: undo ? { label: "Annuler", onClick: () => { undo(); emit(); } } : undefined });
}
