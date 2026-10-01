import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { loadAllScored } from "@/lib/assessment";
import { semaforo } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/historial")({
  head: () => ({ meta: [{ title: "Historial y comparativas | ELITH LEX GROUP" }, { name: "description", content: "Evolución del cumplimiento por norma y empresa." }] }),
  component: Historial,
});

function Historial() {
  const q = useQuery({ queryKey: ["all-scored"], queryFn: loadAllScored });
  if (q.isLoading) return <p>Cargando…</p>;
  const rows = q.data ?? [];
  const groups = new Map<string, typeof rows>();
  for (const r of rows) {
    const k = `${r.a.user_id}|${r.a.standard_id}`;
    groups.set(k, [...(groups.get(k) ?? []), r]);
  }
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-semibold text-primary">Historial y comparativas</h1>
        <p className="text-muted-foreground">Evolución del cumplimiento de cada empresa por norma (antes / después).</p>
      </div>
      {groups.size === 0 && <p className="text-muted-foreground">Aún no hay auditorías.</p>}
      {[...groups.values()].map((g) => {
        const first = g[0], last = g[g.length - 1];
        const diff = last.scores.overall - first.scores.overall;
        const data = g.map((r) => ({ fecha: new Date(r.a.created_at).toLocaleDateString("es-CO"), pct: r.scores.overall }));
        return (
          <section key={first.a.id} className="rounded-md border border-border bg-card p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-2xl font-semibold">{first.a.standards?.name} <span className="text-base text-muted-foreground">· {first.profile?.company_name ?? "Empresa"}</span></h2>
              <p className="text-sm">{g.length} auditoría(s) · Variación: <b className={diff >= 0 ? "text-success" : "text-destructive"}>{diff >= 0 ? "+" : ""}{diff} pts</b></p>
            </div>
            {g.length > 1 && (
              <div className="mt-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="fecha" /><YAxis domain={[0, 100]} unit="%" /><Tooltip /><Line dataKey="pct" stroke="var(--primary)" strokeWidth={2} /></LineChart>
                </ResponsiveContainer>
              </div>
            )}
            <table className="mt-4 w-full text-sm">
              <thead className="bg-secondary text-left"><tr><th className="p-2">Capítulo</th><th className="p-2">Primera</th><th className="p-2">Última</th><th className="p-2">Cambio</th></tr></thead>
              <tbody>
                {last.scores.byChapter.map((c) => {
                  const f = first.scores.byChapter.find((x) => x.id === c.id)?.pct ?? 0;
                  return (
                    <tr key={c.id} className="border-t border-border">
                      <td className="p-2">{c.name}</td><td className="p-2">{f}%</td>
                      <td className="p-2"><span className={`rounded px-2 py-0.5 text-xs font-semibold ${semaforo(c.pct).cls}`}>{c.pct}%</span></td>
                      <td className="p-2">{c.pct - f >= 0 ? "+" : ""}{c.pct - f}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              {g.map((r) => <Link key={r.a.id} to="/informe/$id" params={{ id: r.a.id }} className="text-primary underline">{new Date(r.a.created_at).toLocaleDateString("es-CO")} · {r.scores.overall}%</Link>)}
            </div>
          </section>
        );
      })}
    </div>
  );
}
