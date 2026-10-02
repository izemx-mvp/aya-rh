import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState, Component, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { MiningScene } from "@/components/scene/MiningScene";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EASE } from "@/components/app/kit";
import { loadSettings } from "@/lib/store";

const Crystal = lazy(() => import("@/components/scene/Crystal"));

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Connexion — AYA Plateforme RH IA" },
      { name: "description", content: "Connectez-vous à la plateforme RH IA d'AYA Gold & Silver." },
      { property: "og:title", content: "Connexion — AYA Plateforme RH IA" },
      { property: "og:description", content: "Plateforme RH augmentée par l'IA pour AYA Gold & Silver." },
    ],
  }),
  component: Login,
});

class GLBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { err: boolean }> {
  state = { err: false };
  static getDerivedStateFromError() { return { err: true }; }
  render() { return this.state.err ? this.props.fallback : this.props.children; }
}
const CrystalFallback = () => (
  <svg viewBox="0 0 200 220" className="h-full w-full animate-float" aria-hidden>
    <defs><linearGradient id="s" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#eef1f5" /><stop offset="1" stopColor="#7d8796" /></linearGradient></defs>
    <polygon points="100,10 170,80 140,200 60,200 30,80" fill="url(#s)" opacity=".9" />
    <polygon points="100,10 120,90 100,200 60,200 30,80" fill="#fff" opacity=".18" />
    <polygon points="140,140 175,170 150,205 125,185" fill="#d8b469" />
  </svg>
);

function Login() {
  const nav = useNavigate();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [boot, setBoot] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [webgl, setWebgl] = useState(false);
  useEffect(() => {
    loadSettings();
    try { const c = document.createElement("canvas"); setWebgl(!!(c.getContext("webgl2") || c.getContext("webgl"))); } catch { setWebgl(false); }
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    setTimeout(() => { setBoot(true); sessionStorage.setItem("aya-auth", "1"); setTimeout(() => nav({ to: "/dashboard" }), 1500); }, 700);
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <MiningScene intensity="hero" />
      <div className="pointer-events-none absolute right-[6%] top-1/2 hidden h-[460px] w-[460px] -translate-y-1/2 lg:block">
        <div className="absolute inset-10 rounded-full bg-silver/10 blur-3xl" />
        <GLBoundary fallback={<CrystalFallback />}>
          {webgl ? <Suspense fallback={<CrystalFallback />}><Crystal /></Suspense> : <CrystalFallback />}
        </GLBoundary>
      </div>

      <motion.div initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.8, ease: EASE }}
        className="glass relative z-10 w-full max-w-md rounded-3xl p-8 lg:mr-[30%]">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="rounded-2xl bg-silver/90 px-5 py-3 shadow-lg"><img src="/aya-logo.png" alt="AYA Gold & Silver" className="h-14 w-auto" /></div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight">Plateforme <span className="text-gold-gradient">RH IA</span></h1>
          <p className="mt-1 text-sm text-muted-foreground">Zgounder · Boumadine · Marrakech · Siège</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <div className="relative"><Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input id="email" defaultValue="rh@aya-demo.ma" className="h-10 pl-9" /></div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="pw" className="text-sm font-medium">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input id="pw" type={show ? "text" : "password"} defaultValue="Demo2026!" className="h-10 pl-9 pr-10" />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-2.5 text-muted-foreground" aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}>{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
            </div>
          </div>
          <div className="flex justify-end"><button type="button" onClick={() => setForgot(true)} className="text-xs text-gold hover:underline">Mot de passe oublié ?</button></div>
          <Button type="submit" className="h-11 w-full bg-gold-gradient text-base font-semibold text-primary-foreground hover:opacity-95" disabled={loading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Connexion…</> : "Se connecter"}
          </Button>
        </form>
        <p className="mt-6 text-center text-xs text-muted-foreground">Environnement de démonstration</p>
      </motion.div>

      <Dialog open={forgot} onOpenChange={setForgot}>
        <DialogContent>
          <DialogHeader><DialogTitle>Réinitialiser le mot de passe</DialogTitle><DialogDescription>Un lien de réinitialisation a été envoyé à rh@aya-demo.ma (simulation). Vérifiez votre boîte de réception.</DialogDescription></DialogHeader>
          <Button onClick={() => setForgot(false)}>Compris</Button>
        </DialogContent>
      </Dialog>

      <AnimatePresence>{boot && <BootScreen />}</AnimatePresence>
    </main>
  );
}

export function BootScreen() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      <div className="rounded-2xl bg-silver/90 px-5 py-3"><img src="/aya-logo.png" alt="AYA" className="h-16" /></div>
      <svg viewBox="0 0 300 60" className="mt-8 w-72" aria-hidden>
        {["M0 30 C60 10 90 50 150 30 S240 10 300 30", "M150 30 C170 50 200 55 230 58", "M80 28 C95 10 110 5 130 2"].map((d, i) => (
          <motion.path key={i} d={d} fill="none" stroke={i ? "var(--gold)" : "var(--silver)"} strokeWidth={i ? 1.2 : 2} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.3, delay: i * 0.15, ease: EASE }} />
        ))}
      </svg>
      <p className="mt-4 text-sm text-muted-foreground">Préparation de votre espace…</p>
    </motion.div>
  );
}
