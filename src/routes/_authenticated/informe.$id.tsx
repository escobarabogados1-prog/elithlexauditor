import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { STATUS_LABEL, semaforo } from "@/lib/auth";
import { computeScores, loadAssessment } from "@/lib/assessment";
import { logoUrl } from "@/components/Brand";

export const Route = createFileRoute("/_authenticated/informe/$id")({
  head: () => ({ meta: [{ title: "Informe de cumplimiento | ELITH LEX GROUP" }, { name: "description", content: "Informe de brechas y plan de acción." }] }),
  component: Informe,
});

const color = (p: number) => (p >= 85 ? "var(--success)" : p >= 60 ? "var(--warning)" : "var(--destructive)");

function Informe() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["assessment", id], queryFn: () => loadAssessment(id) });
  const actions = useQuery({
    queryKey: ["actions", id],
    queryFn: async () => (await supabase.from("action_items").select("*").eq("assessment_id", id).order("created_at")).data ?? [],
  });
  const [na, setNa] = useState({ action: "", responsible: "", due_date: "" });

  if (q.isLoading) return <p>Cargando…</p>;
  if (!q.data) return <p>No se encontró la auditoría.</p>;
  const d = q.data;
  const sc = computeScores(d);
  const sem = semaforo(sc.overall);
  const gaps = d.chapters.flatMap((c) =>
    c.requirements.filter((r) => ["no_cumple", "parcial"].includes(sc.map.get(r.id)?.status ?? "")).map((r) => ({ r, a: sc.map.get(r.id)! })),
  );

  const addAction = async () => {
    if (!na.action.trim()) { toast.error("Describa la acción"); return; }
    const { error } = await supabase.from("action_items").insert({ assessment_id: id, action: na.action.trim().slice(0, 500), responsible: na.responsible || null, due_date: na.due_date || null });
    if (error) { toast.error(error.message); return; }
    setNa({ action: "", responsible: "", due_date: "" });
    qc.invalidateQueries({ queryKey: ["actions", id] });
  };
  const setStatus = async (aid: string, status: "pendiente" | "en_curso" | "cerrada") => {
    await supabase.from("action_items").update({ status }).eq("id", aid);
    qc.invalidateQueries({ queryKey: ["actions", id] });
  };
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <img src={logoUrl} alt="ELITH LEX GROUP" className="h-20 w-24 rounded object-cover" />
          <div>
            <p className="text-sm uppercase tracking-widest text-gold">Informe de diagnóstico</p>
            <h1 className="text-4xl font-semibold text-primary">{d.assessment.standards?.name}</h1>
            <p className="text-sm text-muted-foreground">{d.profile?.company_name} {d.profile?.nit && `· NIT ${d.profile.nit}`} · {new Date(d.assessment.created_at).toLocaleDateString("es-CO")}</p>
          </div>
        </div>
        <Button className="no-print" onClick={() => window.print()}>Descargar PDF</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-md border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">Cumplimiento general</p>
          <p className="font-display text-6xl font-semibold text-primary">{sc.overall}%</p>
          <span className={`mt-2 inline-block rounded px-3 py-1 text-xs font-semibold ${sem.cls}`}>{sem.label}</span>
        </div>
        <div className="rounded-md border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">Requisitos evaluados</p>
          <p className="font-display text-6xl font-semibold">{sc.answered}/{sc.total}</p>
        </div>
        <div className="rounded-md border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">Brechas identificadas</p>
          <p className="font-display text-6xl font-semibold text-destructive">{gaps.length}</p>
        </div>
      </div>

      <section className="rounded-md border border-border bg-card p-6">
        <h2 className="text-2xl font-semibold">Cumplimiento por capítulo</h2>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sc.byChapter} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} unit="%" />
              <YAxis type="category" dataKey="name" width={200} tick={{ fontSize: 11 }} />
              <Bar dataKey="pct">{sc.byChapter.map((c) => <Cell key={c.id} fill={color(c.pct)} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {sc.byChapter.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded border border-border px-3 py-2 text-sm">
              <span>{c.name}</span>
              <span className={`rounded px-2 py-0.5 text-xs font-semibold ${semaforo(c.pct).cls}`}>{c.pct}%</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-md border border-border bg-card p-6">
        <h2 className="text-2xl font-semibold">Análisis de brechas</h2>
        {gaps.length === 0 ? <p className="mt-2 text-muted-foreground">Sin brechas registradas.</p> : (
          <table className="mt-4 w-full text-sm">
            <thead className="bg-secondary text-left"><tr><th className="p-2">Req.</th><th className="p-2">Requisito</th><th className="p-2">Estado</th><th className="p-2">Hallazgo / comentario</th></tr></thead>
            <tbody>
              {gaps.map(({ r, a }) => (
                <tr key={r.id} className="border-t border-border align-top">
                  <td className="p-2 text-gold">{r.code}</td>
                  <td className="p-2">{r.question}</td>
                  <td className="p-2">{STATUS_LABEL[a.status!]}</td>
                  <td className="p-2">{a.finding || a.comment || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="rounded-md border border-border bg-card p-6">
        <h2 className="text-2xl font-semibold">Plan de acción</h2>
        <div className="no-print mt-4 grid gap-2 md:grid-cols-[1fr_200px_160px_auto]">
          <Input placeholder="Acción a realizar" value={na.action} onChange={(e) => setNa({ ...na, action: e.target.value })} />
          <Input placeholder="Responsable" value={na.responsible} onChange={(e) => setNa({ ...na, responsible: e.target.value })} />
          <Input type="date" value={na.due_date} onChange={(e) => setNa({ ...na, due_date: e.target.value })} />
          <Button onClick={addAction}>Agregar</Button>
        </div>
        <table className="mt-4 w-full text-sm">
          <thead className="bg-secondary text-left"><tr><th className="p-2">Acción</th><th className="p-2">Responsable</th><th className="p-2">Fecha límite</th><th className="p-2">Estado</th></tr></thead>
          <tbody>
            {actions.data?.map((x) => {
              const late = x.due_date && x.due_date < today && x.status !== "cerrada";
              return (
                <tr key={x.id} className="border-t border-border">
                  <td className="p-2">{x.action}</td>
                  <td className="p-2">{x.responsible ?? "—"}</td>
                  <td className={`p-2 ${late ? "font-semibold text-destructive" : ""}`}>{x.due_date ?? "—"}{late && " (vencida)"}</td>
                  <td className="p-2">
                    <select className="rounded border border-input bg-background px-2 py-1" value={x.status} onChange={(e) => setStatus(x.id, e.target.value as "pendiente")}>
                      <option value="pendiente">Pendiente</option><option value="en_curso">En curso</option><option value="cerrada">Cerrada</option>
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
      <p className="text-center text-xs text-muted-foreground">ELITH LEX GROUP · Bogotá, Colombia · elithlex@gmail.com · +57 316 782 4217</p>
    </div>
  );
}
