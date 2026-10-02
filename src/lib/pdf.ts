import { toast } from "sonner";

async function loadLogo(): Promise<string | null> {
  try {
    const res = await fetch("/aya-logo.png"); const blob = await res.blob();
    return await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result as string); fr.readAsDataURL(blob); });
  } catch { return null; }
}

/** Generates a real PDF with the AYA logo. sections: [heading, body][] */
export async function exportPdf(title: string, sections: [string, string][], filename?: string, table?: { head: string[]; rows: (string | number)[][] }) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const logo = await loadLogo();
  const W = doc.internal.pageSize.getWidth(); const H = doc.internal.pageSize.getHeight();
  const header = () => {
    if (logo) doc.addImage(logo, "PNG", 40, 28, 58, 40);
    doc.setDrawColor(190, 160, 90); doc.setLineWidth(1); doc.line(40, 80, W - 40, 80);
    doc.setFontSize(8); doc.setTextColor(120); doc.text("AYA Gold & Silver — Plateforme RH IA — Document de démonstration", W - 40, 50, { align: "right" });
  };
  header();
  let y = 110;
  doc.setTextColor(30); doc.setFontSize(18); doc.text(title, 40, y); y += 14;
  doc.setFontSize(9); doc.setTextColor(120); doc.text(`Généré le ${new Date().toLocaleString("fr-FR")}`, 40, y); y += 24;
  const ensure = (h: number) => { if (y + h > H - 50) { doc.addPage(); header(); y = 110; } };
  for (const [h, body] of sections) {
    ensure(40); doc.setFontSize(12); doc.setTextColor(150, 115, 40); doc.text(h, 40, y); y += 16;
    doc.setFontSize(10); doc.setTextColor(40);
    for (const line of doc.splitTextToSize(body, W - 80)) { ensure(14); doc.text(line, 40, y); y += 14; }
    y += 10;
  }
  if (table) {
    const cw = (W - 80) / table.head.length;
    ensure(30); doc.setFontSize(9); doc.setTextColor(150, 115, 40);
    table.head.forEach((h, i) => doc.text(String(h).slice(0, 22), 40 + i * cw, y)); y += 14;
    doc.setTextColor(40);
    table.rows.forEach((r) => { ensure(14); r.forEach((v, i) => doc.text(String(v).slice(0, 24), 40 + i * cw, y)); y += 13; });
  }
  doc.setFontSize(8); doc.setTextColor(150); doc.text("Signature RH : ____________________", 40, H - 40);
  doc.save(filename ?? `${title.replace(/[^\w]+/g, "_")}.pdf`);
  toast.success("PDF généré", { description: filename ?? title });
}

export function exportCsv(name: string, head: string[], rows: (string | number)[][]) {
  const csv = [head, ...rows].map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";")).join("\n");
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv" })); a.download = `${name}.csv`; a.click();
  toast.success(`Export CSV : ${rows.length} lignes`);
}
