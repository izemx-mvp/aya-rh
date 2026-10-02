import { useEffect, useRef } from "react";
import { settings, useStore } from "@/lib/store";

export type Intensity = "hero" | "ambient" | "off";

type Vein = { pts: [number, number][]; grow: number; life: number; fade: number; pulse: number; w: number };

/** Layered canvas mining scene: sky + aurora, Anti-Atlas ridges, strata, silver veins, contours, particles. */
export function MiningScene({ intensity, drillCore = false }: { intensity: Intensity; drillCore?: boolean }) {
  useStore();
  const ref = useRef<HTMLCanvasElement>(null);
  const eff: Intensity = settings.reducedMotion ? "off" : intensity;
  const light = settings.theme === "light";

  useEffect(() => {
    if (eff === "off" || light) return;
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext("2d"); if (!ctx) return;
    const hero = eff === "hero";
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, raf = 0, t = 0, running = true;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    const stars = Array.from({ length: hero ? 140 : 60 }, () => ({ x: Math.random(), y: Math.random() * 0.5, r: rand(0.3, 1.3), p: rand(0, 6) }));
    const ridges = Array.from({ length: 5 }, (_, i) => ({ ph: [rand(0, 6), rand(0, 6), rand(0, 6)], amp: 40 + i * 14, base: 0.42 + i * 0.07, depth: (i + 1) / 5 }));
    const parts = Array.from({ length: hero ? 120 : 45 }, () => ({ x: Math.random(), y: Math.random(), v: rand(0.0002, 0.0008), r: rand(0.5, 2), g: Math.random() < 0.25, d: rand(0.3, 1) }));
    const veins: Vein[] = [];
    const newVein = (): Vein => {
      const pts: [number, number][] = []; let x = rand(0, 1), y = rand(0.72, 0.98), a = rand(-0.6, 0.6) - Math.PI / 2 * (Math.random() < 0.5 ? 0.2 : -0.2);
      for (let i = 0; i < 26; i++) { pts.push([x, y]); a += rand(-0.45, 0.45); x += Math.cos(a) * 0.02; y += Math.sin(a) * 0.008; }
      return { pts, grow: 0, life: rand(6, 12), fade: 1, pulse: Math.random(), w: rand(0.6, 1.6) };
    };
    for (let i = 0; i < (hero ? 9 : 4); i++) { const v = newVein(); v.grow = Math.random(); veins.push(v); }

    const resize = () => { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    resize();
    const onMove = (e: MouseEvent) => { mouse.tx = e.clientX / W - 0.5; mouse.ty = e.clientY / H - 0.5; };
    const onVis = () => { running = !document.hidden; if (running) loop(); };
    window.addEventListener("resize", resize); window.addEventListener("mousemove", onMove); document.addEventListener("visibilitychange", onVis);

    const ridgeY = (r: (typeof ridges)[number], x: number) => H * r.base - (Math.sin(x * 0.004 + r.ph[0]) * 0.5 + Math.sin(x * 0.011 + r.ph[1]) * 0.3 + Math.sin(x * 0.027 + r.ph[2]) * 0.2 + 0.6) * r.amp;

    const draw = () => {
      t += 1 / 60;
      mouse.x += (mouse.tx - mouse.x) * 0.03; mouse.y += (mouse.ty - mouse.y) * 0.03;
      const alpha = hero ? 1 : 0.55;
      // sky
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#07090f"); g.addColorStop(0.55, "#121722"); g.addColorStop(1, "#0c0e13");
      ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // aurora
      ctx.globalAlpha = 0.18 * alpha;
      for (let k = 0; k < 2; k++) {
        const ag = ctx.createLinearGradient(0, 0, W, 0);
        ag.addColorStop(0, "transparent"); ag.addColorStop(0.5, k ? "rgba(214,178,94,0.5)" : "rgba(150,175,215,0.6)"); ag.addColorStop(1, "transparent");
        ctx.fillStyle = ag; ctx.beginPath(); ctx.moveTo(0, H * 0.12);
        for (let x = 0; x <= W; x += 30) ctx.lineTo(x, H * (0.14 + k * 0.06) + Math.sin(x * 0.004 + t * 0.15 + k) * 40);
        for (let x = W; x >= 0; x -= 30) ctx.lineTo(x, H * (0.24 + k * 0.06) + Math.sin(x * 0.003 + t * 0.12 + k) * 50);
        ctx.fill();
      }
      // stars
      stars.forEach((s) => { ctx.globalAlpha = (0.4 + Math.sin(t * 1.5 + s.p) * 0.35) * alpha; ctx.fillStyle = "#dfe6f2"; ctx.beginPath(); ctx.arc(s.x * W, s.y * H, s.r, 0, 7); ctx.fill(); });
      // ridges
      ridges.forEach((r, i) => {
        const ox = mouse.x * 30 * r.depth; const oy = mouse.y * 10 * r.depth + (window.scrollY || 0) * -0.05 * r.depth;
        ctx.globalAlpha = alpha; const c = 14 + i * 5;
        ctx.fillStyle = `rgb(${c},${c + 2},${c + 7})`; ctx.beginPath(); ctx.moveTo(0, H);
        for (let x = -40; x <= W + 40; x += 12) ctx.lineTo(x + ox, ridgeY(r, x) + oy);
        ctx.lineTo(W, H); ctx.fill();
        ctx.strokeStyle = `rgba(200,210,225,${0.08 + i * 0.03})`; ctx.lineWidth = 1; ctx.beginPath();
        for (let x = -40; x <= W + 40; x += 12) { const y = ridgeY(r, x) + oy; x === -40 ? ctx.moveTo(x + ox, y) : ctx.lineTo(x + ox, y); }
        ctx.stroke();
        // fog
        const fg = ctx.createLinearGradient(0, H * r.base - 20, 0, H * r.base + 80); fg.addColorStop(0, "rgba(120,135,160,0.05)"); fg.addColorStop(1, "transparent");
        ctx.fillStyle = fg; ctx.fillRect(0, H * r.base - 20, W, 100);
      });
      // strata
      const top = H * 0.72;
      for (let i = 0; i < 7; i++) {
        const y = top + i * (H - top) / 7 + Math.sin(t * 0.1 + i) * 2;
        ctx.globalAlpha = alpha; ctx.fillStyle = i % 2 ? "rgba(26,24,24,0.9)" : "rgba(20,20,24,0.9)";
        ctx.beginPath(); ctx.moveTo(0, y); for (let x = 0; x <= W; x += 40) ctx.lineTo(x, y + Math.sin(x * 0.01 + i * 2) * 4); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
        ctx.strokeStyle = "rgba(160,150,130,0.06)"; ctx.stroke();
      }
      // contours
      ctx.globalAlpha = 0.07 * alpha; ctx.strokeStyle = "#c8b37a"; ctx.lineWidth = 1;
      for (let k = 0; k < 6; k++) { ctx.beginPath(); for (let a = 0; a <= 6.3; a += 0.15) { const rr = 60 + k * 26 + Math.sin(a * 3 + t * 0.2 + k) * 10 + Math.sin(a * 5 - t * 0.13) * 6; const x = W * 0.82 + Math.cos(a) * rr * 1.6; const y = H * 0.2 + Math.sin(a) * rr; a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.closePath(); ctx.stroke(); }
      // veins
      veins.forEach((v, idx) => {
        v.grow = Math.min(1, v.grow + 0.004 * (hero ? 1 : 0.5)); v.life -= 1 / 60;
        if (v.life < 0) v.fade -= 0.01;
        if (v.fade <= 0) { veins[idx] = newVein(); return; }
        const n = Math.floor(v.pts.length * v.grow);
        ctx.globalAlpha = 0.75 * v.fade * alpha; ctx.lineWidth = v.w; ctx.strokeStyle = "rgba(205,215,230,0.8)"; ctx.shadowColor = "rgba(210,220,240,0.8)"; ctx.shadowBlur = 8;
        ctx.beginPath(); for (let i = 0; i < n; i++) { const [x, y] = v.pts[i]; i ? ctx.lineTo(x * W, y * H) : ctx.moveTo(x * W, y * H); } ctx.stroke();
        for (let i = 5; i < n; i += 7) { ctx.fillStyle = "rgba(222,186,104,0.9)"; ctx.beginPath(); ctx.arc(v.pts[i][0] * W, v.pts[i][1] * H, 1.8, 0, 7); ctx.fill(); }
        v.pulse = (v.pulse + 0.006) % 1; const pi = Math.floor(v.pulse * n);
        if (n > 1 && v.pts[pi]) { ctx.fillStyle = "#fff6dc"; ctx.shadowColor = "#e7c46f"; ctx.shadowBlur = 16; ctx.beginPath(); ctx.arc(v.pts[pi][0] * W, v.pts[pi][1] * H, 2.4, 0, 7); ctx.fill(); }
        ctx.shadowBlur = 0;
      });
      // particles
      parts.forEach((p) => {
        p.y -= p.v; if (p.y < 0) { p.y = 1; p.x = Math.random(); }
        const x = p.x * W + mouse.x * 40 * p.d; const y = p.y * H + mouse.y * 20 * p.d;
        ctx.globalAlpha = (p.g ? 0.8 : 0.45) * alpha * (0.6 + Math.sin(t * 2 + p.x * 20) * 0.4);
        ctx.fillStyle = p.g ? "#e2c27a" : "#cfd8e6"; ctx.beginPath(); ctx.arc(x, y, p.r, 0, 7); ctx.fill();
      });
      ctx.globalAlpha = 1;
    };
    const loop = () => { if (!running) return; draw(); if (!reduce) raf = requestAnimationFrame(loop); };
    loop();
    return () => { running = false; cancelAnimationFrame(raf); window.removeEventListener("resize", resize); window.removeEventListener("mousemove", onMove); document.removeEventListener("visibilitychange", onVis); };
  }, [eff, light]);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 no-print" aria-hidden>
      {light ? <div className="absolute inset-0 topo-bg" /> : eff === "off" ? <div className="absolute inset-0 bg-background" /> : (
        <canvas ref={ref} className="h-full w-full transition-opacity duration-700" style={{ opacity: eff === "hero" ? 1 : 0.85 }} />
      )}
      {!light && eff === "ambient" && <div className="absolute inset-0 bg-background/40" />}
      {drillCore && eff !== "off" && !light && (
        <div className="absolute bottom-8 right-3 hidden h-64 w-3 overflow-hidden rounded-full border border-border lg:block" title="Carotte de forage">
          {Array.from({ length: 12 }).map((_, i) => <div key={i} style={{ height: `${100 / 12}%`, opacity: 0.25 + (i % 3) * 0.2 }} className={i % 4 === 1 ? "bg-gold" : i % 2 ? "bg-silver" : "bg-muted"} />)}
          <div className="absolute left-0 right-0 h-0.5 bg-gold shadow-[0_0_8px_var(--gold)]" style={{ animation: "drill-scan 4s linear infinite" }} />
        </div>
      )}
    </div>
  );
}
