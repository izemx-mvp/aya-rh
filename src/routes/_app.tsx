import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/app/AppShell";
import { MiningScene, type Intensity } from "@/components/scene/MiningScene";
import { EASE } from "@/components/app/kit";

export const Route = createFileRoute("/_app")({
  ssr: false,
  component: Layout,
});

const DENSE = ["/employes", "/audit", "/paie", "/roles", "/parametres", "/habilitations", "/planning"];

function Layout() {
  const loc = useLocation();
  const intensity: Intensity = DENSE.some((d) => loc.pathname.startsWith(d)) || /\/(candidatures|fiches-de-poste|employes)\/.+/.test(loc.pathname) ? "off" : "ambient";
  return (
    <>
      <MiningScene intensity={intensity} drillCore={loc.pathname === "/dashboard"} />
      <AppShell>
        <AnimatePresence mode="wait">
          <motion.div key={loc.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.35, ease: EASE }}>
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </AppShell>
    </>
  );
}
