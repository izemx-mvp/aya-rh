import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, ChevronDown, ChevronsLeft, Command as CmdIcon, Keyboard, LogOut, Moon, PlayCircle, Search, Sun, User, Zap, Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { loadSettings, notifications, setSetting, settings, useStore, emit } from "@/lib/store";
import { candidates, employees, jobDescs, positions } from "@/data/mock";
import { NAV, ALL_NAV } from "./nav";
import { Avatar, EASE } from "./kit";
import { Assistant } from "./Assistant";

export function AppShell({ children }: { children: ReactNode }) {
  useStore();
  const nav = useNavigate();
  const loc = useLocation();
  const [cmd, setCmd] = useState(false);
  const [help, setHelp] = useState(false);
  const [tour, setTour] = useState(-1);
  const [closed, setClosed] = useState<Set<string>>(new Set());
  const gKey = useRef(0);

  useEffect(() => { loadSettings(); if (!settings.tourDone) setTimeout(() => setTour(0), 900); }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName; const typing = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setCmd(true); return; }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "j") { e.preventDefault(); setSetting("assistantOpen", !settings.assistantOpen); return; }
      if (typing) return;
      if (e.key === "/") { e.preventDefault(); setCmd(true); }
      else if (e.key === "?") setHelp(true);
      else if (e.key === "g") gKey.current = Date.now();
      else if (Date.now() - gKey.current < 800 && e.key === "d") nav({ to: "/dashboard" });
      else if (Date.now() - gKey.current < 800 && e.key === "c") nav({ to: "/candidatures" });
      else if (e.key === "n") window.dispatchEvent(new CustomEvent("aya:new"));
    };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [nav]);

  const collapsed = settings.sidebarCollapsed;
  const en = settings.lang === "EN";
  const unread = notifications.filter((n) => !n.read).length;
  const visibleNav = NAV.map((s) => ({ ...s, items: s.items.filter((i) => !settings.viewAs || (settings.viewAs === "Manager" ? i.manager : i.collab)) })).filter((s) => s.items.length);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <motion.aside animate={{ width: collapsed ? 76 : 268 }} transition={{ duration: 0.35, ease: EASE }} className="sticky top-0 z-30 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar backdrop-blur-xl md:flex" data-tour="sidebar">
        <div className="flex h-16 items-center gap-3 px-4">
          <div className="rounded-lg bg-silver/90 p-1.5"><img src="/aya-logo.png" alt="AYA" className="h-7 w-auto" /></div>
          {!collapsed && <div className="leading-tight"><p className="text-sm font-bold">AYA</p><p className="text-[11px] text-muted-foreground">Plateforme RH IA</p></div>}
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4" aria-label="Navigation principale">
          {visibleNav.map((s) => (
            <div key={s.title} className="pt-3">
              {!collapsed && (
                <button className="flex w-full items-center justify-between px-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground"
                  onClick={() => setClosed((c) => { const n = new Set(c); n.has(s.title) ? n.delete(s.title) : n.add(s.title); return n; })} aria-expanded={!closed.has(s.title)}>
                  {en ? s.en : s.title}<ChevronDown className={cn("h-3 w-3 transition-transform", closed.has(s.title) && "-rotate-90")} />
                </button>
              )}
              <AnimatePresence initial={false}>
                {(!closed.has(s.title) || collapsed) && (
                  <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-0.5 overflow-hidden">
                    {s.items.map((i) => {
                      const active = loc.pathname === i.to || loc.pathname.startsWith(i.to + "/");
                      return (
                        <li key={i.to}>
                          <Link to={i.to as any} title={collapsed ? i.label : undefined} className={cn("relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors", active ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground" : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}>
                            {active && <motion.span layoutId="nav-ind" className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-gold-gradient" />}
                            <i.icon className={cn("h-4 w-4 shrink-0", active && "text-gold")} />
                            {!collapsed && <span className="flex-1 truncate">{en ? i.en : i.label}</span>}
                            {!collapsed && i.badge && <span className="rounded-full bg-gold/15 px-1.5 text-[10px] font-semibold text-gold tnum">{i.badge()}</span>}
                          </Link>
                        </li>
                      );
                    })}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          ))}
        </nav>
        <button onClick={() => setSetting("sidebarCollapsed", !collapsed)} className="m-3 flex items-center justify-center gap-2 rounded-lg border border-border py-2 text-xs text-muted-foreground hover:text-foreground" aria-label="Réduire la barre latérale">
          <ChevronsLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />{!collapsed && "Réduire"}
        </button>
      </motion.aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {settings.viewAs && (
          <div className="flex items-center justify-center gap-3 bg-gold-gradient px-4 py-1.5 text-sm font-medium text-primary-foreground">
            <Eye className="h-4 w-4" />Aperçu en tant que {settings.viewAs} — menus et données limités
            <button onClick={() => setSetting("viewAs", null)} className="rounded-full bg-background/20 px-2 py-0.5 text-xs">Quitter l'aperçu</button>
          </div>
        )}
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/60 px-4 backdrop-blur-xl md:px-6">
          <button onClick={() => setCmd(true)} data-tour="search" className="flex h-9 max-w-md flex-1 items-center gap-2 rounded-lg border border-input bg-card/50 px-3 text-sm text-muted-foreground hover:border-gold/40">
            <Search className="h-4 w-4" /><span className="flex-1 truncate text-left">{en ? "Search…" : "Rechercher un candidat, employé, fiche…"}</span>
            <kbd className="hidden rounded border border-border px-1.5 text-[10px] sm:inline">Ctrl K</kbd>
          </button>
          <select aria-label="Filtre site" value={settings.site} onChange={(e) => setSetting("site", e.target.value)} data-tour="site" className="h-9 rounded-lg border border-input bg-card/50 px-2 text-sm">
            {["Tous", "Zgounder", "Boumadine", "Marrakech", "Siège"].map((s) => <option key={s}>{s}</option>)}
          </select>
          <div className="ml-auto flex items-center gap-1">
            <NotificationsBell unread={unread} />
            <Button variant="ghost" size="sm" onClick={() => setSetting("lang", en ? "FR" : "EN")} aria-label="Changer de langue" className="font-semibold">{settings.lang}</Button>
            <Button variant="ghost" size="icon" onClick={() => setSetting("theme", settings.theme === "dark" ? "light" : "dark")} aria-label="Changer de thème">{settings.theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="ml-1 flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-accent" data-tour="user"><Avatar name="Samira Baroudi" size={32} /><span className="hidden text-left text-xs leading-tight lg:block"><span className="block font-semibold">Mme Baroudi</span><span className="text-muted-foreground">DRH</span></span></button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>Mme Baroudi · DRH</DropdownMenuLabel><DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => nav({ to: "/employes/$id", params: { id: "E0001" } })}><User className="mr-2 h-4 w-4" />Profil</DropdownMenuItem>
                <DropdownMenuCheckboxItem checked={settings.reducedMotion} onCheckedChange={(v) => setSetting("reducedMotion", !!v)}><Zap className="mr-2 h-4 w-4" />Réduire les animations</DropdownMenuCheckboxItem>
                <DropdownMenuItem onClick={() => setTour(0)}><PlayCircle className="mr-2 h-4 w-4" />Rejouer la visite guidée</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setHelp(true)}><Keyboard className="mr-2 h-4 w-4" />Raccourcis clavier</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { sessionStorage.removeItem("aya-auth"); nav({ to: "/" }); }}><LogOut className="mr-2 h-4 w-4" />Déconnexion</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>

      <Assistant />

      <CommandDialog open={cmd} onOpenChange={setCmd}>
        <CommandInput placeholder="Aller à une page, un candidat, un employé, une fiche…" />
        <CommandList>
          <CommandEmpty>Aucun résultat.</CommandEmpty>
          <CommandGroup heading="Pages">{ALL_NAV.map((i) => <CommandItem key={i.to} value={`page ${i.label}`} onSelect={() => { setCmd(false); nav({ to: i.to as any }); }}><i.icon className="mr-2 h-4 w-4" />{i.label}</CommandItem>)}</CommandGroup>
          <CommandGroup heading="Postes ouverts">{positions.map((p) => <CommandItem key={p.id} value={`poste ${p.title} ${p.site}`} onSelect={() => { setCmd(false); nav({ to: "/candidatures", search: { "c.f_position": p.title } as any }); }}>{p.title} · {p.site}</CommandItem>)}</CommandGroup>
          <CommandGroup heading="Candidats">{candidates.slice(0, 120).map((c) => <CommandItem key={c.id} value={`candidat ${c.name} ${c.ref}`} onSelect={() => { setCmd(false); nav({ to: "/candidatures/$id", params: { id: c.id } }); }}>{c.name} <span className="ml-2 text-xs text-muted-foreground">{c.ref}</span></CommandItem>)}</CommandGroup>
          <CommandGroup heading="Employés">{employees.slice(0, 120).map((e) => <CommandItem key={e.id} value={`employe ${e.name} ${e.matricule}`} onSelect={() => { setCmd(false); nav({ to: "/employes/$id", params: { id: e.id } }); }}>{e.name} <span className="ml-2 text-xs text-muted-foreground">{e.job}</span></CommandItem>)}</CommandGroup>
          <CommandGroup heading="Fiches de poste">{jobDescs.slice(0, 80).map((j) => <CommandItem key={j.id} value={`fiche ${j.title} ${j.ref}`} onSelect={() => { setCmd(false); nav({ to: "/fiches-de-poste/$id", params: { id: j.id } }); }}>{j.title} <span className="ml-2 text-xs text-muted-foreground">{j.ref}</span></CommandItem>)}</CommandGroup>
        </CommandList>
      </CommandDialog>

      <Dialog open={help} onOpenChange={setHelp}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><CmdIcon className="h-4 w-4" />Raccourcis clavier</DialogTitle></DialogHeader>
          <ul className="space-y-2 text-sm">{[["G puis D", "Tableau de bord"], ["G puis C", "Candidatures"], ["N", "Nouvel élément"], ["/ ou Ctrl+K", "Recherche"], ["?", "Cette aide"], ["Ctrl+J", "Assistant IA"], ["Échap", "Fermer"]].map(([k, v]) => <li key={k} className="flex justify-between"><span>{v}</span><kbd className="rounded border border-border px-2 text-xs">{k}</kbd></li>)}</ul>
        </DialogContent>
      </Dialog>

      <Tour step={tour} setStep={setTour} />
    </div>
  );
}

function NotificationsBell({ unread }: { unread: number }) {
  const nav = useNavigate();
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [open, setOpen] = useState(false);
  const list = notifications.filter((n) => tab === "all" || !n.read);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications, ${unread} non lues`} data-tour="notif">
          <Bell className="h-4 w-4" />{unread > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-destructive-foreground">{unread}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b border-border p-3">
          <div className="flex gap-1">{(["all", "unread"] as const).map((t) => <button key={t} onClick={() => setTab(t)} className={cn("rounded-md px-2 py-1 text-xs", tab === t ? "bg-accent font-semibold" : "text-muted-foreground")}>{t === "all" ? "Toutes" : "Non lues"}</button>)}</div>
          <button className="text-xs text-gold" onClick={() => { notifications.forEach((n) => (n.read = true)); emit(); }}>Tout marquer comme lu</button>
        </div>
        <ul className="max-h-96 overflow-y-auto">
          {list.length === 0 && <li className="p-6 text-center text-sm text-muted-foreground">Aucune notification</li>}
          {list.map((n) => (
            <li key={n.id}><button onClick={() => { n.read = true; emit(); setOpen(false); const [p, q] = n.to.split("?"); nav({ to: p as any, search: q ? (Object.fromEntries(new URLSearchParams(q)) as any) : undefined }); }} className="flex w-full gap-3 border-b border-border p-3 text-left hover:bg-accent/50">
              <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-gold")} />
              <span className="flex-1"><span className="block text-sm font-medium">{n.title}</span><span className="block text-xs text-muted-foreground">{n.body} · {n.when}</span></span>
            </button></li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

const TOUR = [
  { t: "Bienvenue sur la Plateforme RH IA", d: "Une visite rapide en 6 étapes pour découvrir l'essentiel." },
  { t: "Navigation", d: "La barre latérale regroupe les modules par section. Elle se réduit et mémorise son état." },
  { t: "Recherche globale", d: "Ctrl+K ouvre la palette pour sauter vers n'importe quel candidat, employé ou fiche." },
  { t: "Filtre site", d: "Choisissez Zgounder, Boumadine, Marrakech ou Siège : le filtre s'applique à toutes les pages." },
  { t: "Notifications", d: "Chaque notification mène directement à l'élément concerné." },
  { t: "Assistant IA", d: "Le bouton doré en bas à droite (Ctrl+J) répond à vos questions avec les données de la plateforme." },
];
function Tour({ step, setStep }: { step: number; setStep: (n: number) => void }) {
  if (step < 0) return null;
  const s = TOUR[step];
  const close = () => { setStep(-1); setSetting("tourDone", true); };
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-background/50 p-6 backdrop-blur-sm md:items-center" role="dialog" aria-label="Visite guidée">
      <motion.div key={step} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass w-full max-w-md rounded-2xl p-6">
        <div className="flex items-start justify-between"><p className="text-xs text-gold">Étape {step + 1} / 6</p><button onClick={close} aria-label="Fermer la visite"><X className="h-4 w-4" /></button></div>
        <h3 className="mt-2 text-lg font-bold">{s.t}</h3><p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
        <div className="mt-4 flex gap-1">{TOUR.map((_, i) => <span key={i} className={cn("h-1 flex-1 rounded-full", i <= step ? "bg-gold" : "bg-muted")} />)}</div>
        <div className="mt-5 flex justify-between">
          <Button variant="ghost" onClick={close}>Passer</Button>
          <div className="flex gap-2">{step > 0 && <Button variant="outline" onClick={() => setStep(step - 1)}>Précédent</Button>}<Button onClick={() => (step === 5 ? close() : setStep(step + 1))}>{step === 5 ? "Terminer" : "Suivant"}</Button></div>
        </div>
      </motion.div>
    </div>
  );
}

export { DialogDescription };
