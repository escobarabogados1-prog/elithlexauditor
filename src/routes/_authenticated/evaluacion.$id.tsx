import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { STATUS_LABEL, useAuth } from "@/lib/auth";
import { computeScores, loadAssessment } from "@/lib/assessment";
import type { Database } from "@/integrations/supabase/types";

type Status = Database["public"]["Enums"]["answer_status"];

export const Route = createFileRoute("/_authenticated/evaluacion/$id")({
  head: () => ({ meta: [{ title: "Cuestionario | ELITH LEX GROUP" }, { name: "description", content: "Cuestionario de diagnóstico de la norma." }] }),
  component: Evaluacion,
});

function Evaluacion() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { isStaff } = useAuth();
  const q = useQuery({ queryKey: ["assessment", id], queryFn: () => loadAssessment(id) });
  if (q.isLoading) return <p>Cargando…</p>;
  if (q.error || !q.data) return <p>No se encontró la auditoría.</p>;
  const d = q.data;
  const sc = computeScores(d);

  const save = async (requirement_id: string, patch: { status?: Status; comment?: string; evidence?: string; finding?: string }) => {
    const { error } = await supabase.from("answers").upsert(
      { assessment_id: id, requirement_id, ...patch, updated_at: new Date().toISOString() },
      { onConflict: "assessment_id,requirement_id" },
    );
    if (error) return toast.error("No se pudo guardar");
    qc.invalidateQueries({ queryKey: ["assessment", id] });
  };

  const finish = async () => {
    await supabase.from("assessments").update({ status: "completada", completed_at: new Date().toISOString() }).eq("id", id);
    toast.success("Diagnóstico finalizado");
    navigate({ to: "/informe/$id", params: { id } });
  };

  return (
    <div>
      <p className="text-sm uppercase tracking-widest text-gold">{d.profile?.company_name}</p>
      <h1 className="text-4xl font-semibold text-primary">{d.assessment.standards?.name}</h1>
      <div className="sticky top-16 z-30 mt-4 rounded-md border border-border bg-card p-4">
        <div className="flex items-center justify-between text-sm">
          <span>{sc.answered} de {sc.total} respondidas · Cumplimiento actual: <b>{sc.overall}%</b></span>
          <Link to="/informe/$id" params={{ id }} className="text-primary underline">Ver informe</Link>
        </div>
        <Progress className="mt-2" value={(sc.answered / Math.max(sc.total, 1)) * 100} />
      </div>

      {d.chapters.map((c) => (
        <section key={c.id} className="mt-8">
          <h2 className="border-b border-gold pb-2 text-2xl font-semibold">{c.code}. {c.title}</h2>
          <div className="mt-4 space-y-4">
            {c.requirements.map((r) => {
              const a = sc.map.get(r.id);
              return (
                <div key={r.id} className="rounded-md border border-border bg-card p-4">
                  <p className="font-medium"><span className="text-gold">{r.code}</span> {r.question}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
                      <Button key={s} size="sm" variant={a?.status === s ? "default" : "outline"} onClick={() => save(r.id, { status: s })}>
                        {STATUS_LABEL[s]}
                      </Button>
                    ))}
                  </div>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    <Textarea rows={2} placeholder="Comentario / descripción" defaultValue={a?.comment ?? ""} onBlur={(e) => e.target.value !== (a?.comment ?? "") && save(r.id, { comment: e.target.value })} />
                    <Input placeholder="Evidencia (documento, enlace, ubicación)" defaultValue={a?.evidence ?? ""} onBlur={(e) => e.target.value !== (a?.evidence ?? "") && save(r.id, { evidence: e.target.value })} />
                    {isStaff && (
                      <Textarea className="md:col-span-2" rows={2} placeholder="Hallazgo del auditor" defaultValue={a?.finding ?? ""} onBlur={(e) => e.target.value !== (a?.finding ?? "") && save(r.id, { finding: e.target.value })} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
      <div className="mt-10 text-right">
        <Button size="lg" className="bg-gold text-ink hover:bg-gold-soft" onClick={finish}>Finalizar y generar informe</Button>
      </div>
    </div>
  );
}
