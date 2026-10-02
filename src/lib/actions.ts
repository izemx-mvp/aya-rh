// Workflow cascades (Annex D3). Each action = one `cascade` call.
import * as M from "@/data/mock";
import { cascade } from "./cascade";

const today = () => new Date().toISOString();
const cand = (id: string) => M.candidates.find((c) => c.id === id)!;
const dem = (id?: string) => M.jobRequests.find((d) => d.id === id);
const fiche = (id?: string) => M.jobDescs.find((j) => j.id === id);
const addDoc = (map: Record<string, M.Doc[]>, id: string, t: string, s = "Généré") => { (map[id] ??= []).unshift({ t, s, v: `v${(map[id]?.filter((d) => d.t === t).length ?? 0) + 1}`, d: today() }); };

/** A8 — send a hiring proposal. */
export function sendProposition(candId: string, salary: number, start: string) {
  const c = cand(candId); const d = dem(c.demandeId); const f = fiche(d?.ficheId);
  cascade(`Proposition d'embauche envoyée à ${c.name}`, `Proposition ${c.ref}`, (x) => {
    c.status = "Offre"; c.detail = "Proposition en attente"; c.stageReached = "Proposition"; c.lastAction = "Proposition envoyée"; c.lastActionDays = 0;
    const id = `PE-${M.pad(M.propositions.length + 1, 4)}`;
    M.propositions.unshift({ id, candId, salary, start, status: "Envoyée" });
    addDoc(M.candDocs, candId, `Proposition d'embauche ${id} (${f?.ref ?? ""} ${f?.version ?? ""})`, "Envoyée");
    (M.candMessages[candId] ??= []).unshift({ when: today(), title: "Proposition d'embauche", body: `Nous avons le plaisir de vous proposer le poste de ${d?.title} à ${d?.site}, salaire ${M.fmtMAD(salary)}, prise de poste le ${M.fmtDate(start)}.` });
    x.event(candId, "Proposition", `Proposition ${id} envoyée`);
    x.audit("Proposition d'embauche envoyée", c.ref, "Entretien", "Proposition en attente");
    x.step("lettre générée et classée"); x.step("candidat en « Proposition en attente »");
  });
}

export function setPropositionStatus(candId: string, status: "Négociation" | "Refusée") {
  const c = cand(candId); const p = M.propositions.find((x) => x.candId === candId);
  cascade(`Proposition ${status === "Refusée" ? "refusée" : "en négociation"} — ${c.name}`, `Proposition ${p?.id}`, (x) => {
    if (p) p.status = status;
    if (status === "Refusée") { c.status = "Refusée"; c.detail = "Proposition refusée par le candidat"; }
    x.event(candId, "Proposition", `Proposition ${status.toLowerCase()}`);
    x.audit("Statut de proposition", p?.id ?? c.ref, "Envoyée", status);
  });
}

/** A9 — the key cascade: proposal accepted → employee, onboarding, habilitations, demande & ad closure. */
export function acceptProposition(candId: string) {
  const c = cand(candId); const d = dem(c.demandeId); const f = fiche(d?.ficheId);
  const p = M.propositions.find((x) => x.candId === candId);
  cascade(`Candidat recruté : ${c.name}`, `Proposition ${p?.id ?? c.ref} acceptée`, (x) => {
    c.status = "Recrutée"; c.detail = "Recrutée"; c.stageReached = "Recrutée"; c.lastAction = "Proposition acceptée"; c.lastActionDays = 0;
    if (p) p.status = "Acceptée";
    x.audit("Candidat recruté", c.ref, "Proposition en attente", "Recrutée");
    if (d) {
      d.filled = (d.filled ?? 0) + 1;
      if (d.filled >= d.count) {
        d.status = "Pourvue";
        M.jobAds.filter((a) => a.demandeId === d.id && a.status === "En ligne").forEach((a) => { a.status = "Clôturée"; x.audit("Annonce clôturée automatiquement", a.id, "En ligne", "Clôturée"); });
        x.step("annonce clôturée"); x.audit("Demande pourvue", d.id, "Publiée", "Pourvue");
      }
    }
    // Convert to employee
    const n = M.employees.length;
    const e: M.Employee = {
      id: `E${M.pad(n + 1, 4)}`, matricule: `AYA-${M.pad(1000 + n, 5)}`, name: c.name, gender: c.gender, site: d?.site ?? c.site, dept: d?.dept ?? "Production minière", job: d?.title ?? "Nouveau poste",
      status: "En intégration", contract: d?.contract ?? "CDI", hireDate: p?.start ?? today(), seniority: 0, team: (d?.site ?? c.site) === "Zgounder" ? "Équipe A" : "Horaires standard",
      email: c.email, phone: c.phone, completeness: 70, review: "Non démarré", manager: M.employees.find((m) => m.dept === d?.dept && /Chef|Responsable|Ingénieur|Directeur/.test(m.job))?.name ?? "Direction générale",
      age: c.age, perf: 2, potential: 2, ficheId: f?.id, fromCandId: c.id,
    };
    M.employees.push(e); c.employeeId = e.id;
    M.onboarding.push({ ...e, progress: 0, buddy: e.manager, start: e.hireDate } as any);
    if (f) f.holders += 1;
    addDoc(M.empDocs, e.id, "Contrat de travail", "À signer"); addDoc(M.empDocs, e.id, "CV (importé de la candidature)", "Valide");
    (M.candDocs[c.id] ?? []).forEach((doc) => (M.empDocs[e.id] ??= []).push({ ...doc }));
    x.step("dossier employé créé"); x.step("intégration planifiée");
    const certs = (f && M.ficheCerts[f.id]) || [];
    certs.forEach((t) => M.habilitations.push({ id: `H${M.habilitations.length + 1}`, empId: e.id, type: t, expires: today(), status: "Manquante" }));
    if (certs.length) x.step(`${certs.length} habilitation(s) à obtenir`);
    x.event(c.id, "Recrutement", `Recruté(e) — dossier ${e.matricule} créé`, `/employes/${e.id}`);
    x.event(e.id, "Embauche", `Embauche · ${e.job} (${e.site}) depuis ${c.ref}`, `/candidatures/${c.id}`);
    x.event(e.id, "Intégration", "Parcours d'intégration créé (badge, EPI, accès, visite médicale, induction sécurité)", "/integration");
    x.notify(`Nouvelle recrue : ${e.name}`, `${e.job} · arrivée le ${M.fmtDate(e.hireDate)}`, `/employes/${e.id}`);
    x.notify("Tâches d'intégration IT / HSE / achats", `Préparer accès, EPI et induction pour ${e.name}`, "/integration");
    x.audit("Création du dossier employé", e.matricule, "—", "En intégration");
    x.audit("Création de l'intégration", e.matricule);
  }, { celebrate: true });
}

/** A9.7 — inform the other active candidates of the same demande. */
export function informOthers(demandeId: string) {
  const others = M.candidates.filter((c) => c.demandeId === demandeId && ["Nouvelle", "Présélectionnée", "Entretien"].includes(c.status));
  cascade(`${others.length} autres candidats informés`, `Clôture ${demandeId}`, (x) => {
    let v = 0;
    others.forEach((c) => { if (c.score >= 75 && c.consent) { c.status = "Vivier"; c.detail = "Vivier"; v++; } else { c.status = "Refusée"; c.detail = "Refusée — poste pourvu"; } x.audit("Candidat informé (poste pourvu)", c.ref, "Actif", c.status); });
    x.step(`${v} ajoutés au vivier`); x.step(`${others.length - v} emails de refus envoyés`);
  });
}

/** A2 — approve the next step of a demande. */
export function approveDemande(id: string) {
  const d = dem(id)!; const order = M.DP_STAGES; const i = order.indexOf(d.status);
  const next = order[Math.min(i + 1, 4)];
  cascade(`${d.id} → ${next}`, `Approbation ${d.id}`, (x) => {
    const before = d.status; d.status = next;
    x.audit("Approbation demande de poste", d.id, before, next);
    x.notify(next === "Approuvée" ? `${d.id} approuvée` : `${d.id} à valider`, next === "Approuvée" ? "Créez l'annonce depuis la demande" : `Étape : ${next}`, "/demandes-de-poste");
    if (next === "Approuvée") x.step("bouton « Créer l'annonce » disponible");
  });
}

/** A2 — create & publish the ad from the demande (pre-filled from the fiche). */
export function createAnnonce(id: string) {
  const d = dem(id)!; const f = fiche(d.ficheId);
  cascade(`Annonce publiée pour ${d.title}`, `Demande ${d.id}`, (x) => {
    const a = { ...M.jobAds[0], id: `AN-${M.pad(M.jobAds.length + 1, 4)}`, title: d.title, positionId: "", site: d.site, status: "En ligne", published: today(), closing: M.daysFrom(30).toISOString(), views: 0, applications: 0, demandeId: d.id, ficheVersion: f?.version ?? "", channels: { LinkedIn: 0, Indeed: 0, "Emploi.ma": 0, Rekrute: 0 } };
    M.jobAds.unshift(a); d.status = "Publiée";
    x.step(`source : ${f?.ref ?? "—"} ${f?.version ?? ""}`); x.step("postes ouverts +1");
    x.audit("Annonce publiée", a.id, "—", "En ligne"); x.audit("Demande publiée", d.id, "Approuvée", "Publiée");
    x.notify(`Annonce ${a.id} en ligne`, d.title, "/offres");
  });
}

/** B2 — initiate a departure. */
export function startDeparture(empId: string, type: string, lastDay: string, reason = "") {
  const e = M.empById(empId)!;
  cascade(`Départ lancé : ${e.name}`, `Départ ${e.matricule}`, (x) => {
    const before = e.status; e.status = "En préavis";
    const id = `DEP-${M.pad(M.departures.length + 1, 3)}`;
    M.departures.unshift({ id, emp: e.name, site: e.site, dept: e.dept, type, lastDay, empId, reason, status: "En cours", progress: 10, seniority: e.seniority } as any);
    const pend = M.leaveRequests.filter((l) => l.empId === empId && l.status === "En attente").length;
    x.step("statut « En préavis »"); x.step("checklist IT / HSE / achats / paie assignée"); if (pend) x.step(`${pend} congé(s) en attente signalé(s)`);
    x.event(empId, "Départ", `Départ initié (${type}) — dernier jour ${M.fmtDate(lastDay)}`, "/departs");
    x.notify(`Départ de ${e.name}`, `Dernier jour : ${M.fmtDate(lastDay)}`, "/departs");
    x.audit("Départ initié", e.matricule, before, "En préavis");
  });
}

/** B2 — close a departure. */
export function closeDeparture(depId: string) {
  const d = M.departures.find((x) => x.id === depId)!; const e = d.empId ? M.empById(d.empId) : undefined;
  cascade(`Départ clôturé : ${d.emp}`, `Départ ${d.id}`, (x) => {
    d.status = "Clôturé"; d.progress = 100;
    if (e) {
      const before = e.status; e.status = "Parti";
      const f = fiche(e.ficheId); if (f) f.holders = Math.max(0, f.holders - 1);
      addDoc(M.empDocs, e.id, "Certificat de travail"); addDoc(M.empDocs, e.id, "Solde de tout compte");
      x.event(e.id, "Départ", "Départ clôturé — certificat de travail et solde générés");
      x.audit("Départ clôturé", e.matricule, before, "Parti");
      x.step("effectif −1");
    }
    x.step("documents finaux générés"); x.step("compté dans le turnover");
  });
}

/** B3 — replacement demande from a departure. */
export function createReplacement(depId: string) {
  const d = M.departures.find((x) => x.id === depId)!; const e = d.empId ? M.empById(d.empId) : undefined; const f = fiche(e?.ficheId);
  cascade(`Demande de remplacement créée`, `Départ ${d.id}`, (x) => {
    const id = `DP-2026-${M.pad(M.jobRequests.length + 1, 3)}`;
    M.jobRequests.unshift({ id, title: e?.job ?? f?.title ?? "Poste", dept: d.dept, site: d.site, requester: "Mme Baroudi", motif: "Remplacement", count: 1, contract: "CDI", level: f?.level ?? "Technicien", budget: 180000, date: M.daysFrom(30).toISOString(), priority: "Haute", status: "À valider manager", ficheId: f?.id ?? "", ficheVersion: f?.version ?? "", filled: 0, replacesEmployeeId: e?.id ?? "", departureId: d.id });
    x.step(`${id} pré-remplie (${f?.ref ?? "fiche"})`); x.step("envoyée au manager");
    x.audit("Demande de remplacement", id, "—", "À valider manager");
    x.notify(`${id} à valider`, `Remplacement de ${d.emp}`, "/demandes-de-poste");
  });
}

/** B1 — trial period decision. */
export function trialDecision(empId: string, decision: string) {
  const e = M.empById(empId)!;
  if (decision === "Mettre fin") return startDeparture(empId, "Fin de période d'essai", M.daysFrom(8).toISOString(), "Période d'essai non concluante");
  cascade(decision === "Confirmer" ? `${e.name} confirmé(e)` : `Période d'essai prolongée — ${e.name}`, `Décision période d'essai ${e.matricule}`, (x) => {
    if (decision === "Confirmer") {
      e.status = "Actif"; e.review = "Non démarré";
      const i = M.onboarding.findIndex((o) => o.id === empId); if (i >= 0) M.onboarding.splice(i, 1);
      x.step("statut Actif"); x.step("entretien annuel planifié"); x.step("intégration clôturée");
      x.event(empId, "Intégration", "Période d'essai confirmée");
    } else { x.step("nouvelle date + rappel créés"); x.event(empId, "Intégration", "Période d'essai prolongée"); }
    x.audit("Décision période d'essai", e.matricule, "En intégration", decision);
  });
}

/** E1 — approve / refuse leave. */
export function decideLeave(ids: string[], status: "Approuvée" | "Refusée") {
  cascade(`${ids.length} congé(s) ${status === "Approuvée" ? "approuvé(s)" : "refusé(s)"}`, `Validation congés`, (x) => {
    let onNow = 0;
    ids.forEach((id) => {
      const l = M.leaveRequests.find((r) => r.id === id)!; const before = l.status; l.status = status;
      if (status === "Approuvée") {
        const e = M.empById(l.empId); const s = new Date(l.start).getTime(); const end = s + l.days * 864e5; const now = Date.now();
        if (e && s <= now && now <= end && e.status === "Actif") { e.status = "En congé"; onNow++; }
        x.event(l.empId, "Congés", `${l.type} approuvé · ${l.days} j à partir du ${M.fmtDate(l.start)}`, "/conges");
      }
      x.audit("Décision de congé", l.id, before, status);
    });
    if (status === "Approuvée") { x.step("calendrier et planning mis à jour"); if (onNow) x.step(`${onNow} en congé aujourd'hui`); x.step("soldes décomptés"); }
  });
}

/** F1 — generate an attestation for an HR request. */
export function generateAttestation(hrId: string) {
  const r = M.hrRequests.find((x) => x.id === hrId)!;
  cascade(`${r.type} générée pour ${r.emp}`, `Demande ${r.id}`, (x) => {
    addDoc(M.empDocs, r.empId, r.type, "Valide");
    const before = r.status; r.status = "Résolue";
    x.step("modèle Documents appliqué"); x.step("classée dans le dossier employé"); x.step("demande résolue");
    x.event(r.empId, "Demandes RH", `${r.type} générée et envoyée`, "/demandes-rh");
    x.audit("Génération d'attestation", r.id, before, "Résolue");
  });
}

/** C1 — fiche status change. */
export function setFicheStatus(id: string, status: M.JobDesc["status"]) {
  const j = fiche(id)!;
  cascade(`${j.ref} : ${status}`, `Fiche ${j.ref}`, (x) => {
    const before = j.status; j.status = status; j.modified = today(); if (status === "Révisée") { j.quality = Math.max(j.quality, 86); j.version = `v${parseInt(j.version.slice(1)) + 1}.0`; }
    M.jobAds.filter((a) => M.jobRequests.find((d) => d.id === a.demandeId)?.ficheId === id && a.status === "En ligne").forEach(() => x.step("annonce liée signalée (fiche mise à jour)"));
    x.audit("Modification de fiche de poste", j.ref, before, status);
    x.step("progression, badges et KPI mis à jour");
  });
}

/** C3 — reorganization scenario. */
export function applyReorg(n = 6) {
  const targets = M.jobDescs.filter((j) => j.status === "Révisée" && j.dept === "Maintenance").slice(0, n);
  cascade(`Scénario de réorganisation appliqué`, `Réorganisation Maintenance`, (x) => {
    targets.forEach((j) => { j.status = "À réviser"; x.audit("Fiche à réviser (réorganisation)", j.ref, "Révisée", "À réviser"); x.notify(`Révision requise : ${j.ref}`, j.title, `/fiches-de-poste/${j.id}`); });
    const emps = M.employees.filter((e) => targets.some((t) => t.id === e.ficheId));
    const mgr = M.employees.find((e) => e.dept === "Maintenance" && /Ingénieur maintenance|Chef d'atelier/.test(e.job));
    emps.forEach((e) => { if (mgr) e.manager = mgr.name; });
    x.step(`${emps.length} rattachements modifiés`); x.step(`${targets.length} fiches → À réviser`); x.step("managers notifiés");
  });
}

/** A6 — interview scheduled. */
export function scheduleInterview(ids: string[], date: string, hour: string, type = "Technique") {
  cascade(`${ids.length} entretien(s) planifié(s)`, `Planification entretien`, (x) => {
    ids.forEach((id) => {
      const c = cand(id); const d = dem(c.demandeId);
      M.interviews.unshift({ id: `ENT-${M.pad(M.interviews.length + 1, 3)}`, candId: id, cand: c.name, position: d?.title ?? "", site: c.site, type, date, hour, status: "Planifié", recruiter: c.recruiter, report: false, mode: "Présentiel" });
      const before = c.status; c.status = "Entretien"; c.detail = "Entretien planifié ou en cours"; c.lastAction = "Entretien planifié"; c.lastActionDays = 0;
      if (M.STAGE_ORDER.indexOf(c.stageReached ?? "Nouvelle") < 2) c.stageReached = "Entretien";
      (M.candMessages[id] ??= []).unshift({ when: today(), title: "Invitation à un entretien", body: `Bonjour ${c.name}, nous vous invitons à un entretien ${type.toLowerCase()} le ${M.fmtDate(date)} à ${hour}.` });
      x.event(id, "Entretien", `Entretien ${type} planifié le ${M.fmtDate(date)} à ${hour}`, "/entretiens");
      x.audit("Entretien planifié", c.ref, before, "Entretien");
    });
    x.step("invitations envoyées"); x.step("interviewers notifiés");
    x.notify("Nouvel entretien", `${ids.length} entretien(s) le ${M.fmtDate(date)}`, "/entretiens");
  });
}
