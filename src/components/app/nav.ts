import {
  LayoutDashboard, FilePlus2, Megaphone, Users, CalendarClock, Gem, FileText, Network, Contact, UserPlus, LogOut,
  GraduationCap, ShieldCheck, ClipboardCheck, Sparkle, CalendarDays, CalendarRange, Wallet, Inbox, FolderOpen, Send, BarChart3,
  TrendingDown, Settings, KeyRound, ScrollText, type LucideIcon,
} from "lucide-react";

export type NavItem = { to: string; label: string; en: string; icon: LucideIcon; badge?: () => number; manager?: boolean; collab?: boolean };
export type NavSection = { title: string; en: string; items: NavItem[] };

export const NAV: NavSection[] = [
  { title: "Pilotage", en: "Overview", items: [{ to: "/dashboard", label: "Tableau de bord", en: "Dashboard", icon: LayoutDashboard, manager: true, collab: true }] },
  { title: "Recrutement", en: "Recruitment", items: [
    { to: "/demandes-de-poste", label: "Demandes de poste", en: "Job requests", icon: FilePlus2, manager: true },
    { to: "/offres", label: "Offres d'emploi", en: "Job ads", icon: Megaphone },
    { to: "/candidatures", label: "Candidatures", en: "Applications", icon: Users, badge: () => 100, manager: true },
    { to: "/entretiens", label: "Entretiens", en: "Interviews", icon: CalendarClock, manager: true },
    { to: "/vivier", label: "Vivier de talents", en: "Talent pool", icon: Gem },
  ] },
  { title: "Organisation", en: "Organization", items: [
    { to: "/fiches-de-poste", label: "Fiches de poste", en: "Job descriptions", icon: FileText, badge: () => 21, manager: true },
    { to: "/organigramme", label: "Organigramme", en: "Org chart", icon: Network, manager: true, collab: true },
  ] },
  { title: "Collaborateurs", en: "Employees", items: [
    { to: "/employes", label: "Dossiers employés", en: "Employee files", icon: Contact, manager: true },
    { to: "/integration", label: "Intégration", en: "Onboarding", icon: UserPlus, badge: () => 9, manager: true },
    { to: "/departs", label: "Départs", en: "Offboarding", icon: LogOut },
  ] },
  { title: "Développement", en: "Development", items: [
    { to: "/formation", label: "Formation", en: "Training", icon: GraduationCap, manager: true, collab: true },
    { to: "/habilitations", label: "Habilitations & HSE", en: "Certifications & HSE", icon: ShieldCheck, badge: () => 9, manager: true },
    { to: "/entretiens-annuels", label: "Entretiens annuels", en: "Annual reviews", icon: ClipboardCheck, manager: true, collab: true },
    { to: "/competences", label: "Compétences & carrières", en: "Skills & careers", icon: Sparkle, manager: true },
  ] },
  { title: "Temps & paie", en: "Time & payroll", items: [
    { to: "/conges", label: "Congés & absences", en: "Leave & absences", icon: CalendarDays, badge: () => 14, manager: true, collab: true },
    { to: "/planning", label: "Planning équipes", en: "Shift planning", icon: CalendarRange, manager: true },
    { to: "/paie", label: "Variables de paie", en: "Payroll variables", icon: Wallet },
  ] },
  { title: "Services RH", en: "HR services", items: [
    { to: "/demandes-rh", label: "Demandes RH", en: "HR requests", icon: Inbox, badge: () => 23, collab: true },
    { to: "/documents", label: "Documents", en: "Documents", icon: FolderOpen, collab: true },
    { to: "/communication", label: "Communication", en: "Communication", icon: Send },
  ] },
  { title: "Analyses", en: "Analytics", items: [
    { to: "/rapports", label: "Rapports", en: "Reports", icon: BarChart3, manager: true },
    { to: "/turnover", label: "Turnover & rétention", en: "Turnover & retention", icon: TrendingDown },
  ] },
  { title: "Administration", en: "Administration", items: [
    { to: "/parametres", label: "Paramètres", en: "Settings", icon: Settings },
    { to: "/roles", label: "Rôles & accès", en: "Roles & access", icon: KeyRound },
    { to: "/audit", label: "Journal d'audit", en: "Audit log", icon: ScrollText },
  ] },
];
export const ALL_NAV = NAV.flatMap((s) => s.items);
