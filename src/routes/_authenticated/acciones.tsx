import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/acciones")({
  head: () => ({ meta: [{ title: "Seguimiento del plan de acción | ELITH LEX GROUP" }, { name: "description", content: "Seguimiento de acciones correctivas." }] }),
  component: Acciones,
});

const COLS = [["pendiente", "Pendiente"], ["en_curso", "En curso"], ["cerrada", "Cerrada"]] as const;

function Acciones() {
  const qc = useQueryClient();
  const [onlyLate, setOnlyLate] = useState(false);
  const q = useQuery({
    queryKey: ["all-actions"],
    queryFn: async () => (await supabase.from("action_items").select("*, assessments(id, standards(name))").order("due_date", { nullsFirst: false })).data ?? [],
  });
  const today = new Date().toISOString().slice(0, 10);
  const move = async (id: string, status: (typeof COLS)[number][0]) => {
    await supabase.from("action_items").update({ status }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["all-actions"] });
  };
  const items = (q.data ?? []).filter((x) => !onlyLate || (x.due_date && x.due_date < today && x.status !== "cerrada"));
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-4xl font-semibold text-primary">Plan de acción</h1><p className="text-muted-foreground">Seguimiento de todas las acciones correctivas.</p></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={onlyLate} onChange={(e) => setOnlyLate(e.target.checked)} /> Solo vencidas</label>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {COLS.map(([k, label]) => (
          <div key={k} className="rounded-md border border-border bg-secondary/40 p-3">
            <h2 className="mb-3 text-lg font-semibold">{label} ({items.filter((x) => x.status === k).length})</h2>
            <div className="space-y-2">
              {items.filter((x) => x.status === k).map((x) => {
                const late = x.due_date && x.due_date < today && x.status !== "cerrada";
                return (
                  <div key={x.id} className={`rounded border bg-card p-3 text-sm ${late ? "border-destructive" : "border-border"}`}>
                    <p className="font-medium">{x.action}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{x.responsible ?? "Sin responsable"} · {x.due_date ?? "Sin fecha"}{late && <b className="text-destructive"> · Vencida</b>}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <Link to="/informe/$id" params={{ id: x.assessment_id }} className="text-xs text-primary underline">{x.assessments?.standards?.name}</Link>
                      <select className="rounded border border-input bg-background px-1 py-0.5 text-xs" value={x.status} onChange={(e) => move(x.id, e.target.value as "pendiente")}>
                        {COLS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
