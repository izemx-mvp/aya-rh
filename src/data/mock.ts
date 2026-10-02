// Single source of truth for all demo data. Deterministic (seeded) so every
// count matches the KPIs. Mutations go through src/lib/store.ts.

function mulberry32(a: number) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(2026);
const pick = <T,>(a: readonly T[]): T => a[Math.floor(rnd() * a.length)];
const int = (min: number, max: number) => Math.floor(rnd() * (max - min + 1)) + min;
function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const expand = (m: Record<string, number>) => Object.entries(m).flatMap(([k, n]) => Array(n).fill(k) as string[]);
export const pad = (n: number, w: number) => String(n).padStart(w, "0");
const DAY = 86400000;
export const TODAY = new Date(); TODAY.setHours(9, 0, 0, 0);
export const daysAgo = (d: number) => new Date(TODAY.getTime() - d * DAY);
export const daysFrom = (d: number) => new Date(TODAY.getTime() + d * DAY);
export const fmtDate = (d: Date | string) => new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
export const fmtNum = (n: number) => n.toLocaleString("fr-FR");
export const fmtMAD = (n: number) => n.toLocaleString("fr-FR") + " MAD";

export const SITES = ["Zgounder", "Boumadine", "Marrakech", "Siège"] as const;
export const SITE_COUNTS: Record<string, number> = { Zgounder: 410, Boumadine: 70, Marrakech: 45, "Siège": 75 };
export const DEPT_COUNTS: Record<string, number> = {
  "Production minière": 150, "Usines de traitement": 110, Maintenance: 95, "Géologie & exploration": 45, HSE: 30,
  "Approvisionnement & achats": 35, "Finance & comptabilité": 30, RH: 15, Logistique: 40, "IT & services généraux": 25, Direction: 25,
};
export const DEPTS = Object.keys(DEPT_COUNTS);

const FIRST_M = ["Youssef", "Mohamed", "Hamza", "Omar", "Karim", "Anas", "Mehdi", "Rachid", "Said", "Hicham", "Abdelilah", "Ayoub", "Brahim", "Hassan", "Khalid", "Mustapha", "Nabil", "Othmane", "Reda", "Soufiane", "Tarik", "Zakaria", "Ilyas", "Jamal", "Adil", "Driss", "Lahcen", "Aziz"];
const FIRST_F = ["Fatima", "Khadija", "Salma", "Meryem", "Imane", "Nadia", "Sanaa", "Hajar", "Zineb", "Loubna", "Asmae", "Ghita", "Houda", "Kawtar", "Leila", "Samira", "Siham", "Wafae", "Yasmine", "Amina", "Rim", "Nora"];
const LAST = ["El Amrani", "Bennani", "Alaoui", "Idrissi", "Tazi", "Berrada", "Chraibi", "El Fassi", "Ouazzani", "Benjelloun", "Lahlou", "Sqalli", "Ait Ahmed", "Ait Brahim", "Amzil", "Boukhari", "El Ouardi", "Hajji", "Kettani", "Mansouri", "Naciri", "Ouahbi", "Rami", "Saidi", "Tahiri", "Zahraoui", "Belkadi", "Ezzahraoui", "Ouchen", "Agouram", "Id Lahcen", "Bakkali"];

const JOBS: Record<string, string[]> = {
  "Production minière": ["Conducteur d'engins", "Chef d'équipe production", "Mineur boutefeu", "Ingénieur mines", "Opérateur jumbo", "Superviseur de quart"],
  "Usines de traitement": ["Opérateur usine", "Ingénieur procédés", "Technicien laboratoire", "Chef de poste usine", "Métallurgiste"],
  Maintenance: ["Technicien maintenance", "Électromécanicien", "Mécanicien engins", "Chef d'atelier", "Ingénieur maintenance"],
  "Géologie & exploration": ["Géologue", "Ingénieur géologue", "Géotechnicien", "Échantillonneur", "Topographe"],
  HSE: ["Animateur HSE", "Responsable HSE", "Infirmier de site", "Ingénieur environnement"],
  "Approvisionnement & achats": ["Acheteur", "Magasinier", "Gestionnaire de stock", "Responsable achats"],
  "Finance & comptabilité": ["Comptable", "Contrôleur de gestion", "Trésorier", "Auditeur interne"],
  RH: ["Chargé RH", "Gestionnaire paie", "Responsable formation", "DRH"],
  Logistique: ["Chauffeur", "Agent logistique", "Responsable transport", "Répartiteur"],
  "IT & services généraux": ["Technicien IT", "Administrateur systèmes", "Agent services généraux"],
  Direction: ["Directeur de site", "Assistant de direction", "Directeur des opérations", "Juriste"],
};

export type Employee = {
  id: string; matricule: string; name: string; gender: "H" | "F"; site: string; dept: string; job: string;
  status: "Actif" | "En intégration" | "En congé" | "En préavis" | "Parti"; contract: string; hireDate: string; seniority: number;
  team: string; email: string; phone: string; completeness: number; review: "Terminé" | "En cours" | "Non démarré";
  manager: string; age: number; perf: number; potential: number;
  ficheId?: string; fromCandId?: string;
};
export type Habilitation = { id: string; empId: string; type: string; expires: string; status: string };

function personName() {
  const f = rnd() < 0.27;
  return { gender: (f ? "F" : "H") as "H" | "F", name: `${pick(f ? FIRST_F : FIRST_M)} ${pick(LAST)}` };
}
const initials = (n: string) => n.split(" ").slice(0, 2).map((s) => s[0]).join("");
export { initials };

// ---------- Employees (600) ----------
const deptList = shuffle(expand(DEPT_COUNTS));
const siteList = shuffle(expand(SITE_COUNTS));
const empStatus = shuffle([...Array(9).fill("En intégration"), ...Array(38).fill("En congé"), ...Array(5).fill("En préavis"), ...Array(548).fill("Actif")]);
const reviewList = shuffle([...Array(412).fill("Terminé"), ...Array(118).fill("En cours"), ...Array(70).fill("Non démarré")]);
export const employees: Employee[] = deptList.map((dept, i) => {
  const p = personName();
  const site = dept === "Direction" && rnd() < 0.5 ? siteList[i] : siteList[i];
  const status = empStatus[i] as Employee["status"];
  const sen = status === "En intégration" ? 0 : int(1, 22);
  const name = i === 0 ? "Samira Baroudi" : p.name;
  return {
    id: `E${pad(i + 1, 4)}`, matricule: `AYA-${pad(1000 + i, 5)}`, name, gender: i === 0 ? "F" : p.gender, site, dept,
    job: i === 0 ? "DRH" : pick(JOBS[dept]), status,
    contract: status === "En intégration" ? pick(["CDI", "CDD"]) : rnd() < 0.82 ? "CDI" : pick(["CDD", "Intérim", "Stage"]),
    hireDate: daysAgo(status === "En intégration" ? int(2, 40) : sen * 365 + int(0, 300)).toISOString(), seniority: sen,
    team: site === "Zgounder" ? `Équipe ${"ABCD"[i % 4]}` : "Horaires standard",
    email: name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z ]/g, "").trim().replace(/\s+/g, ".") + "@aya-demo.ma",
    phone: `+212 6${int(10, 99)} ${int(10, 99)} ${int(10, 99)} ${int(10, 99)}`,
    completeness: int(55, 100), review: reviewList[i] as Employee["review"], manager: "", age: int(22, 60),
    perf: int(1, 3), potential: int(1, 3),
  };
});
employees.forEach((e) => {
  const mgr = employees.find((m) => m.dept === e.dept && m.id !== e.id && /Chef|Responsable|Directeur|Ingénieur|Superviseur|DRH/.test(m.job));
  e.manager = mgr?.name ?? "Direction générale";
});
export const empById = (id: string) => employees.find((e) => e.id === id);

// ---------- Habilitations: 47 expire ≤60j, 9 expirées ----------
export const HAB_TYPES = ["Travail en hauteur", "Espaces confinés", "Conduite d'engins", "Secourisme", "Habilitation électrique", "Explosifs", "Induction sécurité"];
const field = employees.filter((e) => ["Production minière", "Usines de traitement", "Maintenance", "Géologie & exploration", "HSE", "Logistique"].includes(e.dept));
export const habilitations: Habilitation[] = [];
field.forEach((e) => {
  const n = int(2, 4);
  shuffle([...HAB_TYPES]).slice(0, n).forEach((t) => habilitations.push({ id: `H${habilitations.length + 1}`, empId: e.id, type: t, expires: daysFrom(int(91, 900)).toISOString(), status: "Valide" }));
});
const habIdx = shuffle(habilitations.map((_, i) => i));
habIdx.slice(0, 9).forEach((i) => { habilitations[i].expires = daysAgo(int(1, 40)).toISOString(); habilitations[i].status = "Expirée"; });
habIdx.slice(9, 56).forEach((i) => { const d = int(3, 60); habilitations[i].expires = daysFrom(d).toISOString(); habilitations[i].status = d <= 30 ? "Expire ≤ 30 j" : "Expire ≤ 60 j"; });
habIdx.slice(56, 80).forEach((i) => { habilitations[i].expires = daysFrom(int(61, 90)).toISOString(); habilitations[i].status = "Expire ≤ 90 j"; });

// ---------- Postes ouverts (12) ----------
export type Position = { id: string; title: string; dept: string; site: string; recruiter: string; openedDays: number; fpId: string; status: string };
const RECRUITERS = ["Salma Idrissi", "Karim Tazi", "Nadia Berrada", "Omar Chraibi"];
export { RECRUITERS };
const POS_DEF: [string, string, string][] = [
  ["Ingénieur Géologue", "Géologie & exploration", "Zgounder"], ["Technicien maintenance", "Maintenance", "Zgounder"],
  ["Chef d'équipe production", "Production minière", "Zgounder"], ["Conducteur d'engins", "Production minière", "Boumadine"],
  ["Ingénieur procédés", "Usines de traitement", "Zgounder"], ["Responsable HSE", "HSE", "Boumadine"],
  ["Acheteur", "Approvisionnement & achats", "Marrakech"], ["Comptable", "Finance & comptabilité", "Siège"],
  ["Électromécanicien", "Maintenance", "Boumadine"], ["Géotechnicien", "Géologie & exploration", "Boumadine"],
  ["Technicien laboratoire", "Usines de traitement", "Zgounder"], ["Contrôleur de gestion", "Finance & comptabilité", "Siège"],
];
export const positions: Position[] = POS_DEF.map(([title, dept, site], i) => ({ id: `P${pad(i + 1, 2)}`, title, dept, site, recruiter: RECRUITERS[i % 4], openedDays: int(10, 70), fpId: `FP-${pad(i * 7 + 3, 4)}`, status: "Ouvert" }));

// ---------- Candidatures (312) ----------
export type CandStatus = "Nouvelle" | "Présélectionnée" | "Entretien" | "Offre" | "Recrutée" | "Refusée" | "Vivier";
export type Candidate = {
  id: string; ref: string; name: string; gender: "H" | "F"; currentJob: string; positionId: string; site: string; source: string;
  applied: string; score: number; reco: string; status: CandStatus; detail: string; recruiter: string; lastAction: string; lastActionDays: number;
  criteria: { k: string; w: number; s: number }[]; experience: number; mobility: boolean; city: string; age: number; email: string; phone: string;
  consent: boolean; retentionDays: number; duplicate?: boolean;
  demandeId?: string; stageReached?: Stage; employeeId?: string;
};
export type Stage = "Nouvelle" | "Présélectionnée" | "Entretien" | "Proposition" | "Recrutée";
export const STAGE_ORDER: Stage[] = ["Nouvelle", "Présélectionnée", "Entretien", "Proposition", "Recrutée"];
export const SOURCES = ["Portail carrière", "Cooptation", "LinkedIn", "Rekrute", "Emploi.ma", "Candidature spontanée", "Cabinet"];
export const CRITERIA = [
  { k: "Expérience", w: 30 }, { k: "Diplômes", w: 15 }, { k: "Compétences techniques", w: 25 },
  { k: "Certifications HSE", w: 10 }, { k: "Langues", w: 10 }, { k: "Mobilité vers le site", w: 10 },
];
const CITIES = ["Marrakech", "Agadir", "Ouarzazate", "Casablanca", "Rabat", "Errachidia", "Taroudant", "Fès", "Khouribga", "Tinghir"];
export const recoOf = (s: number) => (s >= 80 ? "Fortement recommandé" : s >= 68 ? "Recommandé" : s >= 52 ? "Sous réserve" : "Non retenu");
const statusPlan: [CandStatus, string, number][] = [
  ["Nouvelle", "Nouvelle (à décider)", 100], ["Refusée", "Refusée (score insuffisant)", 138], ["Présélectionnée", "En attente d'entretien", 30],
  ["Refusée", "Refusée après présélection", 8], ["Vivier", "Vivier", 8], ["Entretien", "Entretien planifié ou en cours", 8],
  ["Refusée", "Refusée après entretien", 11], ["Offre", "Offre en attente", 3], ["Recrutée", "Recrutée", 6],
];
const candPlan = shuffle(statusPlan.flatMap(([s, d, n]) => Array.from({ length: n }, () => ({ s, d }))));
let nouvelleSeen = 0;
export const candidates: Candidate[] = candPlan.map(({ s, d }, i) => {
  const p = personName();
  const pos = positions[i % 12 === 0 ? 0 : int(0, 11)];
  let score: number;
  if (d.includes("score insuffisant")) score = int(22, 51);
  else if (s === "Nouvelle") score = int(35, 94);
  else score = int(66, 96);
  const criteria = CRITERIA.map((c) => ({ ...c, s: Math.max(10, Math.min(100, score + int(-18, 14))) }));
  let lad = s === "Nouvelle" ? int(0, 5) : int(1, 30);
  if (s === "Nouvelle") { if (nouvelleSeen < 12) lad = int(6, 14); nouvelleSeen++; }
  const action = { Nouvelle: "CV analysé par l'IA", "Présélectionnée": "Présélectionné(e)", Entretien: "Entretien planifié", Offre: "Offre envoyée", "Recrutée": "Offre acceptée", "Refusée": "Email de refus envoyé", Vivier: "Ajouté(e) au vivier" }[s];
  return {
    id: `C${pad(i + 1, 4)}`, ref: `CAN-2026-${pad(i + 1, 4)}`, name: p.name, gender: p.gender,
    currentJob: pick(JOBS[pos.dept]) + " · " + pick(["Managem", "OCP", "Lafarge", "Holcim", "Indépendant", "SNI", "Cosumar"]).replace(/Managem|OCP|Lafarge|Holcim|SNI|Cosumar/, "Société minière"),
    positionId: pos.id, site: pos.site, source: pick(SOURCES), applied: daysAgo(lad + int(0, 25)).toISOString(), score, reco: recoOf(score),
    status: s, detail: d, recruiter: pos.recruiter, lastAction: action, lastActionDays: lad, criteria, experience: int(1, 18),
    mobility: rnd() < 0.7, city: pick(CITIES), age: int(23, 52),
    email: `${p.name.split(" ")[0].toLowerCase()}.${int(10, 99)}@mail.ma`, phone: `+212 6${int(10, 99)} ${int(10, 99)} ${int(10, 99)} ${int(10, 99)}`,
    consent: rnd() < 0.9, retentionDays: int(20, 700), duplicate: rnd() < 0.03,
  };
});
export const posById = (id: string) => positions.find((p) => p.id === id)!;

// ---------- Fiches de poste (148) ----------
export type JobDesc = { id: string; ref: string; title: string; dept: string; site: string; reportsTo: string; status: "Révisée" | "En validation" | "À réviser" | "En révision"; version: string; modified: string; owner: string; quality: number; family: string; level: string; holders: number };
const fpStatus = shuffle([...Array(96).fill("Révisée"), ...Array(31).fill("En validation"), ...Array(21).fill("À réviser")]);
const allJobs = DEPTS.flatMap((d) => JOBS[d].map((j) => [d, j] as [string, string]));
export const LEVELS = ["Opérateur", "Technicien", "Agent de maîtrise", "Cadre", "Cadre supérieur"];
export const jobDescs: JobDesc[] = fpStatus.map((st, i) => {
  const [dept, job] = allJobs[i % allJobs.length];
  const site = SITES[i % 4 === 3 ? 1 : i % 5 === 4 ? 3 : i % 7 === 6 ? 2 : 0];
  const lvl = /Ingénieur|Responsable|Directeur|Contrôleur|Géologue|DRH|Juriste/.test(job) ? "Cadre" : /Chef|Superviseur/.test(job) ? "Agent de maîtrise" : /Technicien|Géotechnicien|Comptable|Acheteur|Topographe/.test(job) ? "Technicien" : "Opérateur";
  return {
    id: `FP-${pad(i + 1, 4)}`, ref: `FP-${pad(i + 1, 4)}`, title: i >= allJobs.length ? `${job} (${site})` : job, dept, site,
    reportsTo: JOBS[dept].find((j) => /Chef|Responsable|Directeur|Ingénieur/.test(j)) ?? "Directeur de site", status: st as JobDesc["status"],
    version: st === "Révisée" ? `v${int(2, 4)}.0` : `v${int(1, 2)}.${int(0, 3)}`, modified: daysAgo(int(0, 120)).toISOString(),
    owner: pick(["Nadia Berrada", "Karim Tazi", "Imane Alaoui", "Hicham Lahlou"]), quality: st === "Révisée" ? int(80, 98) : st === "En validation" ? int(68, 88) : int(34, 64),
    family: dept === "Production minière" || dept === "Géologie & exploration" ? "Mine & géologie" : dept === "Usines de traitement" ? "Traitement" : dept === "Maintenance" ? "Maintenance" : "Support",
    level: lvl, holders: int(0, 12),
  };
});
positions.forEach((p) => { const fp = jobDescs.find((j) => j.title.startsWith(p.title)); if (fp) p.fpId = fp.id; });

// ---------- Demandes de poste ----------
export const DP_STAGES = ["Brouillon", "À valider manager", "À valider RH", "À valider Direction", "Approuvée", "Publiée", "Pourvue"];
export const jobRequests = Array.from({ length: 26 }, (_, i) => {
  const pos = i < 12 ? positions[i] : { title: pick(allJobs)[1], dept: pick(DEPTS), site: pick(SITES) };
  return {
    id: `DP-2026-${pad(i + 1, 3)}`, title: pos.title, dept: pos.dept, site: pos.site, requester: pick(employees.slice(1, 80)).name,
    motif: pick(["Création", "Remplacement", "Renfort temporaire"]), count: int(1, 3), contract: pick(["CDI", "CDI", "CDD", "Intérim", "Stage"]),
    level: pick(LEVELS), budget: int(9, 40) * 10000, date: daysFrom(int(10, 90)).toISOString(), priority: pick(["Haute", "Moyenne", "Basse"]),
    status: i < 12 ? "Publiée" : i < 18 ? "Pourvue" : DP_STAGES[i % 5],
    ficheId: "" as string, ficheVersion: "" as string, filled: 0, replacesEmployeeId: "" as string, departureId: "" as string,
  };
});

// ---------- Offres d'emploi ----------
export const jobAds = Array.from({ length: 18 }, (_, i) => {
  const pos = positions[i % 12];
  const cands = candidates.filter((c) => c.positionId === pos.id).length;
  const st = i < 12 ? "En ligne" : pick(["Brouillon", "Planifiée", "Clôturée", "Expirée"]);
  return { id: `AN-${pad(i + 1, 4)}`, demandeId: "", ficheVersion: "" as string, title: pos.title + (i >= 12 ? " (2025)" : ""), positionId: pos.id, site: pos.site, status: st, published: daysAgo(int(5, 60)).toISOString(), closing: daysFrom(int(-20, 40)).toISOString(), views: int(300, 4200), applications: i < 12 ? cands : int(10, 60), channels: { LinkedIn: int(10, 60), Indeed: int(5, 40), "Emploi.ma": int(5, 40), Rekrute: int(5, 40) } };
});

// ---------- Entretiens ----------
export const interviews = candidates.filter((c) => ["Entretien", "Offre", "Recrutée"].includes(c.status) || c.detail === "Refusée après entretien").flatMap((c, i) => {
  const done = c.status !== "Entretien";
  return [{ id: `ENT-${pad(i + 1, 3)}`, candId: c.id, cand: c.name, position: posById(c.positionId).title, site: c.site, type: pick(["RH", "Technique", "Final", "Collectif"]), date: (done ? daysAgo(int(2, 30)) : daysFrom(int(0, 10))).toISOString(), hour: `${int(8, 16)}:${pick(["00", "30"])}`, status: done ? "Réalisé" : pick(["Planifié", "Confirmé"]), recruiter: c.recruiter, report: done ? (i % 6 === 0 ? false : true) : false, mode: pick(["Présentiel", "Visio"]) }];
});

// ---------- Others ----------
export const trainings = Array.from({ length: 36 }, (_, i) => ({ id: `FOR-${pad(i + 1, 3)}`, title: pick(["Travail en hauteur", "Conduite défensive", "Secourisme SST", "Management d'équipe", "Excel avancé", "IA générative au quotidien", "Anglais technique", "Lean maintenance", "Habilitation électrique B1", "Espaces confinés", "Prompt engineering RH", "Gestion des explosifs"])+ (i>=12?` – niv. ${1+(i%3)}`:""), category: pick(["HSE", "Technique", "Management", "Digital & IA", "Langues"]), duration: `${int(1, 5)} j`, provider: pick(["Interne", "Institut Mines Maroc", "OFPPT", "Centre HSE Agadir"]), cost: int(2, 25) * 1000, prereq: pick(["Aucun", "Visite médicale", "Niveau 1 validé"]) }));
export const sessions = Array.from({ length: 42 }, (_, i) => ({ id: `SES-${pad(i + 1, 3)}`, course: trainings[i % 36].title, date: daysFrom(int(-5, 80)).toISOString(), trainer: pick(employees).name, place: pick(SITES), capacity: int(8, 20), registered: int(4, 20), status: pick(["Planifiée", "Convocations envoyées", "En cours"]) }));
export const leaveRequests = Array.from({ length: 60 }, (_, i) => { const e = pick(employees); return { id: `CG-${pad(i + 1, 3)}`, empId: e.id, emp: e.name, site: e.site, type: pick(["Congé annuel", "Maladie", "Événement familial", "Sans solde", "Formation", "Maternité/paternité"]), start: daysFrom(int(-10, 40)).toISOString(), days: int(1, 15), status: i < 14 ? "En attente" : pick(["Approuvée", "Refusée", "Approuvée"]) }; });
export const hrRequests = Array.from({ length: 48 }, (_, i) => { const e = pick(employees); return { id: `DRH-${pad(i + 1, 3)}`, emp: e.name, empId: e.id, site: e.site, type: pick(["Attestation de travail", "Attestation de salaire", "Changement d'informations", "Avance", "Question", "Autre"]), priority: pick(["Haute", "Moyenne", "Basse"]), status: i < 23 ? pick(["Nouvelle", "En cours", "En attente employé"]) : pick(["Résolue", "Clôturée"]), sla: i < 23 ? pick(["OK", "Bientôt dû", "En retard"]) : "OK", assignee: pick(RECRUITERS), created: daysAgo(int(0, 20)).toISOString() }; });
export const departures = Array.from({ length: 44 }, (_, i) => { const p = personName(); return { id: `DEP-${pad(i + 1, 3)}`, emp: p.name, site: pick(SITES), dept: pick(DEPTS), type: pick(["Démission", "Démission", "Fin de contrat", "Rupture conventionnelle", "Licenciement", "Retraite"]), lastDay: daysAgo(int(-30, 360)).toISOString(), empId: "" as string, reason: "" as string, status: i < 5 ? "En cours" : "Clôturé", progress: i < 5 ? int(20, 80) : 100, seniority: int(0, 20) }; });
export const onboarding = employees.filter((e) => e.status === "En intégration").map((e) => ({ ...e, progress: int(10, 90), buddy: pick(employees).name, start: e.hireDate }));
export const documentsLib = Array.from({ length: 34 }, (_, i) => ({ id: `DOC-${pad(i + 1, 3)}`, title: pick(["Règlement intérieur", "Politique HSE", "Politique de mobilité", "Modèle CDI", "Modèle CDD", "Procédure de recrutement", "Charte informatique", "Procédure congés", "Code de conduite", "Politique anti-harcèlement"]) + (i > 9 ? ` ${2020 + (i % 6)}` : ""), category: pick(["Règlement", "Politique RH", "Modèle de contrat", "Procédure"]), version: `v${int(1, 5)}.${int(0, 9)}`, review: daysFrom(int(-60, 300)).toISOString(), owner: pick(RECRUITERS), status: i % 4 === 0 ? "À revoir" : "À jour", ack: int(40, 100) }));
export const announcements = Array.from({ length: 25 }, (_, i) => ({ id: `COM-${pad(i + 1, 3)}`, title: pick(["Rappel port des EPI", "Nouvelle cantine Zgounder", "Campagne d'entretiens annuels", "Calendrier Aïd", "Formation IA : inscriptions", "Bilan sécurité trimestriel", "Bienvenue aux nouvelles recrues"]), type: pick(["Note de service", "Nouveauté", "Rappel HSE"]), audience: pick(["Tous", ...SITES]), status: i < 3 ? "Brouillon" : i < 6 ? "Planifiée" : "Envoyée", readRate: i < 6 ? 0 : int(42, 97), date: daysAgo(int(-10, 120)).toISOString() }));
export const auditLog = Array.from({ length: 220 }, (_, i) => ({ id: `AUD-${pad(i + 1, 4)}`, who: pick(["Samira Baroudi", ...RECRUITERS]), what: pick(["Changement de statut candidat", "Modification de fiche de poste", "Export de données", "Consultation de dossier", "Changement de rôle", "Validation variables de paie"]), object: pick([...candidates.slice(0, 40).map((c) => c.ref), ...jobDescs.slice(0, 30).map((j) => j.ref)]), when: new Date(TODAY.getTime() - i * 3.3 * 3600000).toISOString(), before: pick(["Nouvelle", "v1.2", "Manager", "—"]), after: pick(["Présélectionnée", "v2.0", "Responsable RH", "—"]), ip: `10.20.${int(1, 9)}.${int(2, 250)}` }));
export const users = employees.filter((e) => ["RH", "Direction"].includes(e.dept) || /Chef|Responsable|Directeur/.test(e.job)).slice(0, 64).map((e, i) => ({ id: e.id, name: e.name, email: e.email, site: e.site, role: i === 0 ? "DRH" : pick(["Responsable RH", "Manager", "Manager", "Direction", "Lecture seule", "Collaborateur"]), last: daysAgo(int(0, 30)).toISOString() }));

// ---------- D2 — Relations between entities ----------
const ficheFor = (job: string, dept: string) => (jobDescs.find((j) => j.title === job) ?? jobDescs.find((j) => j.title.startsWith(job)) ?? jobDescs.find((j) => j.dept === dept) ?? jobDescs[0]).id;
employees.forEach((e) => { e.ficheId = ficheFor(e.job, e.dept); });
// Required certifications of a fiche = certifications held by its holders (seed stays consistent).
export const ficheCerts: Record<string, string[]> = {};
habilitations.forEach((h) => { const f = empById(h.empId)!.ficheId!; (ficheCerts[f] ??= []); if (!ficheCerts[f].includes(h.type)) ficheCerts[f].push(h.type); });

// Candidates → demandes. 12 open demandes (positions) + 6 "Pourvue" demandes holding the 6 recruits.
const STAGE_OF: Record<string, Stage> = {
  "Nouvelle (à décider)": "Nouvelle", "Refusée (score insuffisant)": "Nouvelle", "En attente d'entretien": "Présélectionnée", "Refusée après présélection": "Présélectionnée",
  Vivier: "Présélectionnée", "Entretien planifié ou en cours": "Entretien", "Refusée après entretien": "Entretien", "Offre en attente": "Proposition", "Recrutée": "Recrutée",
};
jobRequests.forEach((d, i) => { if (i < 12) { d.ficheId = positions[i].fpId; } else d.ficheId = ficheFor(d.title, d.dept); const f = jobDescs.find((j) => j.id === d.ficheId)!; d.ficheVersion = f.version; });
const recruits = candidates.filter((c) => c.status === "Recrutée");
candidates.forEach((c) => {
  c.stageReached = STAGE_OF[c.detail] ?? "Nouvelle";
  if (c.status === "Offre") c.detail = "Proposition en attente";
  c.demandeId = jobRequests[positions.findIndex((p) => p.id === c.positionId)].id;
});
recruits.forEach((c, k) => {
  const d = jobRequests[12 + k]; const pos = posById(c.positionId);
  Object.assign(d, { title: pos.title, dept: pos.dept, site: pos.site, count: 1, filled: 1, ficheId: pos.fpId });
  c.demandeId = d.id;
});
jobRequests.slice(0, 12).forEach((d) => { d.count = Math.max(d.count, 1); d.filled = 0; });
jobAds.forEach((a, i) => {
  const d = jobRequests[i]; a.demandeId = d.id; a.ficheVersion = d.ficheVersion;
  if (i >= 12) { a.status = "Clôturée"; a.title = d.title; a.applications = candidates.filter((c) => c.demandeId === d.id).length; }
});

// Hiring proposals: 6 accepted (recruits) + 3 sent.
export type Proposition = { id: string; candId: string; salary: number; start: string; status: "Envoyée" | "Négociation" | "Acceptée" | "Refusée" };
export const propositions: Proposition[] = candidates.filter((c) => c.status === "Recrutée" || c.status === "Offre").map((c, i) => ({ id: `PE-${pad(i + 1, 4)}`, candId: c.id, salary: int(9, 30) * 1000, start: daysFrom(c.status === "Offre" ? int(15, 40) : -int(2, 30)).toISOString(), status: c.status === "Recrutée" ? "Acceptée" : "Envoyée" }));

// 9 onboardings = 6 platform recruits + 3 earlier hires.
const onbEmps = employees.filter((e) => e.status === "En intégration");
recruits.forEach((c, k) => {
  const e = onbEmps[k]; const pos = posById(c.positionId);
  Object.assign(e, { name: c.name, gender: c.gender, job: pos.title, dept: pos.dept, ficheId: pos.fpId, fromCandId: c.id });
  c.employeeId = e.id;
});
onboarding.forEach((o) => { const e = empById(o.id)!; Object.assign(o, { name: e.name, job: e.job, dept: e.dept, site: e.site, ficheId: e.ficheId }); });
jobDescs.forEach((j) => { j.holders = employees.filter((e) => e.ficheId === j.id).length; });

// Person-level stores (documents, messages, timeline events created by actions).
export type Doc = { t: string; s: string; v: string; d: string };
export const empDocs: Record<string, Doc[]> = {};
export const candDocs: Record<string, Doc[]> = {};
export const candMessages: Record<string, { when: string; title: string; body: string }[]> = {};
export type TEvent = { personId: string; when: string; module: string; label: string; to?: string };
export const events: TEvent[] = [];
export const departureLinks: Record<string, { empId?: string; reason?: string }> = {};

// ---------- KPIs — all DERIVED from the data above ----------
const reached = (s: Stage) => candidates.filter((c) => STAGE_ORDER.indexOf(c.stageReached ?? "Nouvelle") >= STAGE_ORDER.indexOf(s)).length;
export const KPI = {
  get effectif() { return employees.filter((e) => e.status !== "Parti").length; },
  get openPositions() { return jobRequests.filter((d) => d.status === "Publiée").length; },
  get applications() { return candidates.length; },
  get analyzed() { return candidates.length; },
  get shortlisted() { return reached("Présélectionnée"); },
  get interviews() { return reached("Entretien"); },
  get offers() { return propositions.filter((p) => p.status !== "Refusée").length; },
  get hired() { return reached("Recrutée"); },
  get conversion() { return ((reached("Recrutée") / candidates.length) * 100).toFixed(1).replace(".", ",") + " %"; },
  avgDays: 34,
  fp: {
    get total() { return jobDescs.length; },
    get revised() { return jobDescs.filter((j) => j.status === "Révisée").length; },
    get validation() { return jobDescs.filter((j) => j.status === "En validation").length; },
    get toRevise() { return jobDescs.filter((j) => j.status === "À réviser" || j.status === "En révision").length; },
  },
  reviews: { done: 412, ongoing: 118, notStarted: 70 },
  training: { sessions: 42, trained: 380, budget: 1200000, consumed: 61, realization: 85 },
  habs: {
    get expiring() { return habilitations.filter((h) => h.status === "Expire ≤ 30 j" || h.status === "Expire ≤ 60 j").length; },
    get expired() { return habilitations.filter((h) => h.status === "Expirée").length; },
  },
  get onboarding() { return employees.filter((e) => e.status === "En intégration").length; },
  get departures() { return departures.length; },
  get turnover() { return ((departures.length / 595) * 100).toFixed(1).replace(".", ",") + " %"; },
  retention90: 88,
  get onLeave() { return employees.filter((e) => e.status === "En congé").length; },
  get pendingLeave() { return leaveRequests.filter((l) => l.status === "En attente").length; },
  absenteeism: "3,1 %",
  get hrOpen() { return hrRequests.filter((r) => !["Résolue", "Clôturée"].includes(r.status)).length; },
};

export const CONTRACTS = ["CDI", "CDD", "Intérim", "Stage"];
