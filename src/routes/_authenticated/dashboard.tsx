import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Mis auditorías | ELITH LEX GROUP" }, { name: "description", content: "Panel de auditorías y diagnósticos." }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user, isStaff } = useAuth();
  const navigate = useNavigate();
  const [std, setStd] = useState("");
  const standards = useQuery({
    queryKey: ["standards"],
    queryFn: async () => (await supabase.from("standards").select("*").order("sort")).data ?? [],
  });
  const list = useQuery({
    queryKey: ["assessments", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("assessments")
        .select("*, standards(name)")
        .order("created_at", { ascending: false });
      const ids = [...new Set((data ?? []).map((a) => a.user_id))];
      const { data: profs } = ids.length ? await supabase.from("profiles").select("id, company_name").in("id", ids) : { data: [] };
      return (data ?? []).map((a) => ({ ...a, company: profs?.find((p) => p.id === a.user_id)?.company_name }));
    },
  });

  const start = async () => {
    if (!std || !user) return toast.error("Seleccione una norma");
    const { data, error } = await supabase.from("assessments").insert({ standard_id: std, user_id: user.id }).select().single();
    if (error) return toast.error(error.message);
    navigate({ to: "/evaluacion/$id", params: { id: data.id } });
  };

  return (
    <div>
      <h1 className="text-4xl font-semibold text-primary">{isStaff ? "Auditorías de clientes" : "Mis auditorías"}</h1>
      <div className="mt-6 flex flex-wrap items-end gap-3 rounded-md border border-border bg-card p-5">
        <div className="min-w-64 flex-1">
          <p className="mb-2 text-sm font-medium">Iniciar nuevo diagnóstico</p>
          <Select value={std} onValueChange={setStd}>
            <SelectTrigger><SelectValue placeholder="Seleccione la norma" /></SelectTrigger>
            <SelectContent>
              {standards.data?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} — {s.description}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={start} className="bg-gold text-ink hover:bg-gold-soft">Comenzar</Button>
      </div>

      <div className="mt-8 overflow-hidden rounded-md border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-left">
            <tr><th className="p-3">Norma</th>{isStaff && <th className="p-3">Empresa</th>}<th className="p-3">Fecha</th><th className="p-3">Estado</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {list.data?.length === 0 && <tr><td className="p-6 text-muted-foreground" colSpan={5}>Aún no hay diagnósticos.</td></tr>}
            {list.data?.map((a) => (
              <tr key={a.id} className="border-t border-border">
                <td className="p-3 font-medium">{a.standards?.name}</td>
                {isStaff && <td className="p-3">{a.company ?? "—"}</td>}
                <td className="p-3">{new Date(a.created_at).toLocaleDateString("es-CO")}</td>
                <td className="p-3">{a.status === "completada" ? "Completada" : "En progreso"}</td>
                <td className="space-x-3 p-3 text-right">
                  <Link to="/evaluacion/$id" params={{ id: a.id }} className="text-primary underline">Cuestionario</Link>
                  <Link to="/informe/$id" params={{ id: a.id }} className="text-primary underline">Informe</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
