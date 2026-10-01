import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { loadAllScored } from "@/lib/assessment";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Administración | ELITH LEX GROUP" }, { name: "description", content: "Panel administrativo." }] }),
  component: Admin,
});

function Admin() {
  const { isStaff, isAdmin, loading } = useAuth();
  const qc = useQueryClient();
  const scored = useQuery({ queryKey: ["all-scored"], enabled: isStaff, queryFn: loadAllScored });
  const roles = useQuery({ queryKey: ["all-roles"], enabled: isStaff, queryFn: async () => (await supabase.from("user_roles").select("user_id, role")).data ?? [] });
  const setRole = async (uid: string, role: "admin" | "auditor" | "empresa") => {
    const del = await supabase.from("user_roles").delete().eq("user_id", uid);
    const ins = await supabase.from("user_roles").insert({ user_id: uid, role });
    if (del.error || ins.error) toast.error((del.error ?? ins.error)!.message); else toast.success("Rol actualizado");
    qc.invalidateQueries({ queryKey: ["all-roles"] });
  };
  const stats = useQuery({
    queryKey: ["admin-stats"],
    enabled: isStaff,
    queryFn: async () => {
      const [{ data: profiles }, { data: assess }, { data: msgs }, { data: actions }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("assessments").select("id, status"),
        supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("action_items").select("id, due_date, status"),
      ]);
      const today = new Date().toISOString().slice(0, 10);
      return {
        profiles: profiles ?? [], msgs: msgs ?? [],
        total: assess?.length ?? 0,
        progress: assess?.filter((a) => a.status !== "completada").length ?? 0,
        late: actions?.filter((a) => a.due_date && a.due_date < today && a.status !== "cerrada").length ?? 0,
      };
    },
  });
  if (loading) return <p>Cargando…</p>;
  if (!isStaff) return <p>Solo administradores y auditores pueden ver esta sección.</p>;
  const s = stats.data;
  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-semibold text-primary">Administración</h1>
      <div className="grid gap-4 md:grid-cols-4">
        {[["Empresas", s?.profiles.length], ["Auditorías", s?.total], ["En curso", s?.progress], ["Acciones vencidas", s?.late]].map(([l, v]) => (
          <div key={l as string} className="rounded-md border border-border bg-card p-5 text-center">
            <p className="text-sm text-muted-foreground">{l}</p><p className="font-display text-5xl font-semibold">{v ?? "—"}</p>
          </div>
        ))}
      </div>
      <section className="rounded-md border border-border bg-card p-6">
        <h2 className="text-2xl font-semibold">Cumplimiento promedio por norma</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {Object.entries((scored.data ?? []).reduce<Record<string, number[]>>((m, r) => { const k = r.a.standards?.name ?? "—"; (m[k] ??= []).push(r.scores.overall); return m; }, {})).map(([k, v]) => (
            <div key={k} className="flex justify-between rounded border border-border px-3 py-2 text-sm"><span>{k} <span className="text-muted-foreground">({v.length})</span></span><b>{Math.round(v.reduce((a, b) => a + b, 0) / v.length)}%</b></div>
          ))}
          {scored.data?.length === 0 && <p className="text-muted-foreground">Sin datos.</p>}
        </div>
      </section>
      <section className="rounded-md border border-border bg-card p-6">
        <h2 className="text-2xl font-semibold">Empresas registradas</h2>
        <table className="mt-4 w-full text-sm"><thead className="bg-secondary text-left"><tr><th className="p-2">Empresa</th><th className="p-2">NIT</th><th className="p-2">Responsable</th><th className="p-2">Teléfono</th><th className="p-2">Rol</th></tr></thead>
          <tbody>{s?.profiles.map((p) => <tr key={p.id} className="border-t border-border"><td className="p-2">{p.company_name ?? "—"}</td><td className="p-2">{p.nit ?? "—"}</td><td className="p-2">{p.full_name ?? "—"}</td><td className="p-2">{p.phone ?? "—"}</td><td className="p-2">{(() => { const r = roles.data?.find((x) => x.user_id === p.id)?.role ?? "empresa"; return isAdmin ? <select className="rounded border border-input bg-background px-1 py-0.5" value={r} onChange={(e) => setRole(p.id, e.target.value as "empresa")}><option value="empresa">Empresa</option><option value="auditor">Auditor</option><option value="admin">Administrador</option></select> : r; })()}</td></tr>)}</tbody>
        </table>
      </section>
      <section className="rounded-md border border-border bg-card p-6">
        <h2 className="text-2xl font-semibold">Mensajes de contacto</h2>
        <div className="mt-4 space-y-3">
          {s?.msgs.length === 0 && <p className="text-muted-foreground">Sin mensajes.</p>}
          {s?.msgs.map((m) => (
            <div key={m.id} className="rounded border border-border p-3 text-sm">
              <p className="font-medium">{m.name} · {m.email} {m.phone && `· ${m.phone}`} {m.company && `· ${m.company}`}</p>
              <p className="mt-1 text-muted-foreground">{m.message}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
