// Central dispatcher (Annex D0): every workflow action runs through `cascade`,
// which snapshots all entities, applies the effects, pushes notifications and
// audit entries ("déclenché par"), and shows ONE toast with a 6s undo.
import { toast } from "sonner";
import * as M from "@/data/mock";
import { notifications, emit, settings } from "@/lib/store";
import { confetti } from "@/components/app/kit";

const ARRAYS = () => [M.employees, M.candidates, M.jobRequests, M.jobAds, M.jobDescs, M.habilitations, M.leaveRequests, M.hrRequests, M.departures, M.onboarding, M.propositions, M.interviews, M.events, M.auditLog, notifications] as unknown as any[][];
const MAPS = () => [M.empDocs, M.candDocs, M.candMessages, M.ficheCerts, M.departureLinks] as Record<string, any>[];

function snapshot() {
  const a = ARRAYS().map((x) => structuredClone(x));
  const m = MAPS().map((x) => structuredClone(x));
  return () => {
    ARRAYS().forEach((arr, i) => arr.splice(0, arr.length, ...a[i]));
    MAPS().forEach((obj, i) => { Object.keys(obj).forEach((k) => delete obj[k]); Object.assign(obj, m[i]); });
  };
}

export type Ctx = {
  step: (label: string) => void;
  notify: (title: string, body: string, to: string) => void;
  audit: (what: string, object: string, before?: string, after?: string) => void;
  event: (personId: string, module: string, label: string, to?: string) => void;
};

export function cascade(title: string, trigger: string, fn: (c: Ctx) => void, opts: { celebrate?: boolean } = {}) {
  const restore = snapshot();
  const steps: string[] = [];
  const now = new Date().toISOString();
  const ctx: Ctx = {
    step: (l) => steps.push(l),
    notify: (t, b, to) => notifications.unshift({ id: Date.now() + Math.random(), title: t, body: b, to, read: false, when: "à l'instant" }),
    audit: (what, object, before = "—", after = "—") => M.auditLog.unshift({ id: `AUD-${M.auditLog.length + 1}`, who: settings.viewAs ? `Samira Baroudi (vue ${settings.viewAs})` : "Samira Baroudi", what: `${what} · déclenché par ${trigger}`, object, when: now, before, after, ip: "10.20.1.15" }),
    event: (personId, module, label, to) => M.events.unshift({ personId, when: now, module, label, to }),
  };
  fn(ctx);
  emit();
  if (opts.celebrate) confetti();
  toast.success(title, {
    description: steps.join(" · ") || undefined, duration: 6000,
    action: { label: "Annuler", onClick: () => { restore(); emit(); toast("Action annulée — toute la chaîne a été rétablie"); } },
  });
}
