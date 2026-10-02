import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Bar as RBar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ModulePage, meta } from "@/components/app/Module";
import { DataTable } from "@/components/app/DataTable";
import { StatusBadge, Section, Bar, Typing } from "@/components/app/kit";
import { announcements, employees, fmtDate, SITES, DEPTS } from "@/data/mock";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/communication")({ head: () => meta("Communication", "Annonces internes et enquêtes pulse."), component: Page });

function Page() {
  const [site, setSite] = useState("Tous"); const [dept, setDept] = useState("Tous");
  const [body, setBody] = useState("Rappel : le port du casque et des lunettes est obligatoire dans toutes les zones de production.");
  const [q, setQ] = useState(["Comment évaluez-vous la sécurité sur votre site ?", "Recommanderiez-vous AYA comme employeur ?", "Que pourrions-nous améliorer ?"]);
  const count = employees.filter((e) => (site === "Tous" || e.site === site) && (dept === "Tous" || e.dept === dept)).length;
  return (
    <ModulePage title="Communication" subtitle="Annonces, notes de service et enquêtes"
      tabs={[
        { label: "Annonces", content: <DataTable id="ann" rows={announcements} filters={[{ key: "status", label: "Statut", options: ["Brouillon", "Planifiée", "Envoyée"] }, { key: "type", label: "Type", options: ["Note de service", "Nouveauté", "Rappel HSE"] }]} drawerTitle={(a) => a.title} drawer={(a) => <div className="space-y-3 text-sm"><p>Taux de lecture : <b>{a.readRate} %</b></p><Bar value={a.readRate} /><div className="h-40"><ResponsiveContainer><BarChart data={SITES.map((s, i) => ({ s, v: Math.max(0, a.readRate - i * 6) }))}><XAxis dataKey="s" fontSize={10} stroke="var(--muted-foreground)" /><YAxis fontSize={10} stroke="var(--muted-foreground)" /><Tooltip /><RBar dataKey="v" fill="var(--gold)" radius={4} /></BarChart></ResponsiveContainer></div><p className="font-semibold">Non-lecteurs ({Math.round((100 - a.readRate) * 6)})</p><p className="text-muted-foreground">{employees.slice(40, 46).map((e) => e.name).join(", ")}…</p><Button size="sm" onClick={() => toast.success("Relance envoyée")}>Relancer</Button></div>} columns={[{ key: "title", header: "Titre" }, { key: "type", header: "Type" }, { key: "audience", header: "Audience" }, { key: "date", header: "Date", render: (a) => fmtDate(a.date) }, { key: "status", header: "Statut", render: (a) => <StatusBadge label={a.status} /> }, { key: "readRate", header: "Lecture", render: (a) => a.status === "Envoyée" ? `${a.readRate} %` : "—" }]} /> },
        { label: "Rédiger", content: <div className="grid gap-4 lg:grid-cols-2">
          <Section title="Composer"><div className="space-y-3"><select className="w-full rounded-md border border-input bg-background px-2 py-2 text-sm">{["Note de service", "Nouveauté", "Rappel HSE"].map((t) => <option key={t}>{t}</option>)}</select><Input placeholder="Titre" defaultValue="Rappel port des EPI" /><Textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} /><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => setBody(body + " Merci à toutes et à tous pour votre vigilance : la sécurité est l'affaire de chacun.")}><Sparkles className="mr-1 h-3 w-3 text-gold" />Réécrire</Button><Button size="sm" variant="outline" onClick={() => setBody("Reminder: helmets and safety glasses are mandatory in all production areas.")}>Traduire FR/EN</Button><Button size="sm" variant="outline" onClick={() => toast("Pièce jointe ajoutée (simulée)")}>Joindre</Button></div>
            <div className="grid grid-cols-2 gap-2"><select value={site} onChange={(e) => setSite(e.target.value)} className="rounded-md border border-input bg-background px-2 py-2 text-sm">{["Tous", ...SITES].map((s) => <option key={s}>{s}</option>)}</select><select value={dept} onChange={(e) => setDept(e.target.value)} className="rounded-md border border-input bg-background px-2 py-2 text-sm">{["Tous", ...DEPTS].map((s) => <option key={s}>{s}</option>)}</select></div><p className="text-sm">Destinataires : <b className="text-gold tnum">{count}</b> collaborateurs</p><div className="flex gap-2"><Input type="datetime-local" className="h-9" /><Button onClick={() => toast.success(`Annonce envoyée à ${count} collaborateurs`)}>Envoyer</Button></div></div></Section>
          <Section title="Aperçu collaborateur"><div className="rounded-xl bg-card p-4 text-sm"><StatusBadge label="Rappel HSE" tone="warning" /><p className="mt-2 font-semibold">Rappel port des EPI</p><p className="mt-1 text-muted-foreground"><Typing text={body} /></p></div></Section>
        </div> },
        { label: "Enquête pulse", content: <div className="grid gap-4 lg:grid-cols-2">
          <Section title="Questions (3 à 5)">{q.map((x, i) => <Input key={i} value={x} onChange={(e) => setQ(q.map((y, j) => j === i ? e.target.value : y))} className="mb-2" />)}<div className="flex gap-2"><Button size="sm" variant="outline" disabled={q.length >= 5} onClick={() => setQ([...q, "Nouvelle question"])}>Ajouter</Button><Button size="sm" onClick={() => toast.success("Enquête envoyée — échéance dans 7 jours")}>Envoyer</Button></div></Section>
          <Section title="Résultats (simulés)"><div className="h-40"><ResponsiveContainer><BarChart data={[1, 2, 3, 4, 5].map((n) => ({ n: `${n}★`, v: [4, 9, 22, 41, 24][n - 1] }))}><XAxis dataKey="n" fontSize={10} stroke="var(--muted-foreground)" /><YAxis fontSize={10} stroke="var(--muted-foreground)" /><Tooltip /><RBar dataKey="v" fill="var(--slate)" radius={4} /></BarChart></ResponsiveContainer></div><p className="mt-2 text-sm"><Sparkles className="mr-1 inline h-3 w-3 text-gold" /><Typing text="Thèmes IA : forte adhésion à la culture sécurité ; attentes sur le transport vers Zgounder et la restauration sur site." /></p></Section>
        </div> },
      ]} />
  );
}
