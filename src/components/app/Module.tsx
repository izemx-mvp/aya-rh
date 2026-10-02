import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PageHeader, KpiCard, Stagger, staggerItem, confetti, Typing, AiDisclaimer } from "./kit";
import { useUrlState } from "./DataTable";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type Field = { name: string; label: string; type?: "text" | "textarea" | "select" | "date" | "number"; options?: string[]; required?: boolean; def?: string };
export type ActionDef = { label: string; primary?: boolean; icon?: ReactNode; title?: string; description?: string; fields?: Field[]; steps?: Field[][]; confirm?: string; success?: string; onSubmit?: (v: Record<string, string>) => void; ai?: string; celebrate?: boolean; run?: () => void };

export function ActionDialog({ a, open, onOpenChange }: { a: ActionDef; open: boolean; onOpenChange: (o: boolean) => void }) {
  const steps = a.steps ?? [a.fields ?? []];
  const [step, setStep] = useState(0);
  const [v, setV] = useState<Record<string, string>>({});
  const [errs, setErrs] = useState<string[]>([]);
  const isRecap = a.steps && step === steps.length;
  const validate = (fs: Field[]) => fs.filter((f) => f.required && !(v[f.name] ?? f.def)).map((f) => `« ${f.label} » est obligatoire`);
  const close = () => { onOpenChange(false); setStep(0); setV({}); setErrs([]); };
  const submit = () => { const e = steps.flatMap(validate); if (e.length) return setErrs(e); a.onSubmit?.(Object.fromEntries(steps.flat().map((f) => [f.name, v[f.name] ?? f.def ?? ""]))); close(); toast.success(a.success ?? "Enregistré", { duration: 6000, action: { label: "Annuler", onClick: () => toast("Action annulée") } }); if (a.celebrate) confetti(); };
  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader><DialogTitle>{a.title ?? a.label}</DialogTitle>{(a.description || a.steps) && <DialogDescription>{a.steps ? `Étape ${Math.min(step + 1, steps.length + 1)} / ${steps.length + 1}` : a.description}</DialogDescription>}</DialogHeader>
        {a.steps && <div className="flex gap-1">{[...steps, []].map((_, i) => <span key={i} className={cn("h-1 flex-1 rounded-full", i <= step ? "bg-gold" : "bg-muted")} />)}</div>}
        {errs.length > 0 && <div className="rounded-lg border border-danger/40 bg-danger/10 p-2 text-xs text-danger">{errs.map((e) => <p key={e}>• {e}</p>)}</div>}
        {isRecap ? (
          <div className="space-y-2 text-sm">{steps.map((fs, i) => <div key={i} className="flex justify-between rounded-lg bg-muted/40 p-3"><div>{fs.map((f) => <p key={f.name}><span className="text-muted-foreground">{f.label} : </span>{v[f.name] ?? f.def ?? "—"}</p>)}</div><button className="text-xs text-gold" onClick={() => setStep(i)}>Modifier</button></div>)}{a.ai && <div className="rounded-lg border border-gold/25 bg-gold/5 p-3 text-sm"><Typing text={a.ai} /></div>}</div>
        ) : (
          <div className="space-y-3">
            {steps[step].map((f) => (
              <div key={f.name}>
                <label className="text-xs font-medium">{f.label}{f.required && " *"}</label>
                {f.type === "textarea" ? <Textarea value={v[f.name] ?? f.def ?? ""} onChange={(e) => setV({ ...v, [f.name]: e.target.value })} /> :
                  f.type === "select" ? <select className="w-full rounded-md border border-input bg-background px-2 py-2 text-sm" value={v[f.name] ?? f.def ?? ""} onChange={(e) => setV({ ...v, [f.name]: e.target.value })}><option value="">—</option>{f.options?.map((o) => <option key={o}>{o}</option>)}</select> :
                    <Input type={f.type ?? "text"} value={v[f.name] ?? f.def ?? ""} onChange={(e) => setV({ ...v, [f.name]: e.target.value })} onBlur={() => setErrs(validate(steps[step]))} />}
              </div>
            ))}
            {!a.steps && a.ai && <div className="rounded-lg border border-gold/25 bg-gold/5 p-3 text-sm"><Typing text={a.ai} /></div>}
            {a.ai && <AiDisclaimer />}
          </div>
        )}
        <DialogFooter>
          {a.steps && step > 0 && <Button variant="outline" onClick={() => setStep(step - 1)}>Précédent</Button>}
          {a.steps && !isRecap ? <Button onClick={() => { const e = validate(steps[step]); if (e.length) return setErrs(e); setErrs([]); setStep(step + 1); }}>Suivant</Button> : <Button onClick={submit}>{a.confirm ?? "Confirmer"}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ActionButtons({ actions }: { actions: ActionDef[] }) {
  const [open, setOpen] = useState<ActionDef | null>(null);
  const primary = actions.filter((a) => a.primary); const rest = actions.filter((a) => !a.primary);
  const go = (a: ActionDef) => (a.run ? a.run() : setOpen(a));
  return (
    <>
      {rest.length > 0 && <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" size="sm">Plus d'actions</Button></DropdownMenuTrigger><DropdownMenuContent>{rest.map((a) => <DropdownMenuItem key={a.label} onClick={() => go(a)}>{a.label}</DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu>}
      {primary.map((a) => <Button key={a.label} className="bg-gold-gradient text-primary-foreground" onClick={() => go(a)}>{a.icon}{a.label}</Button>)}
      {open && <ActionDialog a={open} open onOpenChange={(o) => !o && setOpen(null)} />}
    </>
  );
}

export type Kpi = { label: string; value: number; suffix?: string; decimals?: number; sub?: string; trend?: number; ring?: number; to?: string };

export function ModulePage({ title, subtitle, crumbs, kpis, actions = [], tabs, children }: { title: string; subtitle?: string; crumbs?: { label: string; to?: string }[]; kpis?: Kpi[]; actions?: ActionDef[]; tabs?: { label: string; content: ReactNode }[]; children?: ReactNode }) {
  const { get, set } = useUrlState("");
  const tab = get("tab") ?? tabs?.[0]?.label;
  return (
    <div className="space-y-5">
      <PageHeader title={title} subtitle={subtitle} crumbs={crumbs} actions={<ActionButtons actions={actions} />} />
      {kpis && <Stagger className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">{kpis.map((k) => <motion.div key={k.label} variants={staggerItem}><KpiCard {...k} /></motion.div>)}</Stagger>}
      {tabs ? (
        <Tabs value={tab} onValueChange={(t) => set({ tab: t === tabs[0].label ? undefined : t })}>
          <TabsList className="flex h-auto flex-wrap justify-start">{tabs.map((t) => <TabsTrigger key={t.label} value={t.label}>{t.label}</TabsTrigger>)}</TabsList>
          {tabs.map((t) => <TabsContent key={t.label} value={t.label} className="mt-4 space-y-4">{t.content}</TabsContent>)}
        </Tabs>
      ) : null}
      {children}
    </div>
  );
}

export const meta = (title: string, description: string) => ({ meta: [{ title: `${title} — AYA RH IA` }, { name: "description", content: description }, { property: "og:title", content: `${title} — AYA RH IA` }, { property: "og:description", content: description }] });
