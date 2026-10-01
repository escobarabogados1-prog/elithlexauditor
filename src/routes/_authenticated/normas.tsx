import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/normas")({
  head: () => ({ meta: [{ title: "Configuración de normas | ELITH LEX GROUP" }, { name: "description", content: "Administración de normas, capítulos y requisitos." }] }),
  component: Normas,
});

function Normas() {
  const { isAdmin, loading } = useAuth();
  const qc = useQueryClient();
  const [sel, setSel] = useState("");
  const [ns, setNs] = useState({ code: "", name: "", description: "" });
  const [nc, setNc] = useState({ code: "", title: "" });
  const [nr, setNr] = useState<Record<string, { code: string; question: string; weight: string }>>({});
  const stds = useQuery({ queryKey: ["standards"], queryFn: async () => (await supabase.from("standards").select("*").order("sort")).data ?? [] });
  const chs = useQuery({
    queryKey: ["norm-chapters", sel], enabled: !!sel,
    queryFn: async () => (await supabase.from("chapters").select("*, requirements(*)").eq("standard_id", sel).order("sort")).data ?? [],
  });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["standards"] }); qc.invalidateQueries({ queryKey: ["norm-chapters", sel] }); };
  const run = async (p: PromiseLike<{ error: { message: string } | null }>) => { const { error } = await p; if (error) toast.error(error.message); else { toast.success("Guardado"); refresh(); } };

  if (loading) return <p>Cargando…</p>;
  if (!isAdmin) return <p>Solo administradores.</p>;
  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-semibold text-primary">Configuración de normas</h1>
      <section className="rounded-md border border-border bg-card p-5">
        <h2 className="text-xl font-semibold">Nueva norma</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-[140px_1fr_1fr_auto]">
          <Input placeholder="Código (ej. ISO22301)" value={ns.code} onChange={(e) => setNs({ ...ns, code: e.target.value })} />
          <Input placeholder="Nombre" value={ns.name} onChange={(e) => setNs({ ...ns, name: e.target.value })} />
          <Input placeholder="Descripción" value={ns.description} onChange={(e) => setNs({ ...ns, description: e.target.value })} />
          <Button onClick={() => ns.code && ns.name && run(supabase.from("standards").insert({ ...ns, sort: (stds.data?.length ?? 0) + 1 })).then(() => setNs({ code: "", name: "", description: "" }))}>Crear</Button>
        </div>
      </section>
      <div className="flex flex-wrap gap-2">
        {stds.data?.map((s) => <Button key={s.id} variant={sel === s.id ? "default" : "outline"} size="sm" onClick={() => setSel(s.id)}>{s.name}</Button>)}
      </div>
      {sel && (
        <section className="space-y-4">
          {chs.data?.map((c) => {
            const r = nr[c.id] ?? { code: "", question: "", weight: "1" };
            return (
              <div key={c.id} className="rounded-md border border-border bg-card p-5">
                <div className="flex items-center justify-between"><h3 className="text-lg font-semibold">{c.code}. {c.title}</h3>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => confirm("¿Eliminar capítulo?") && run(supabase.from("chapters").delete().eq("id", c.id))}>Eliminar</Button></div>
                <ul className="mt-2 space-y-1 text-sm">
                  {[...c.requirements].sort((a, b) => a.sort - b.sort).map((q) => (
                    <li key={q.id} className="flex items-start justify-between gap-2 border-t border-border pt-1">
                      <span><b className="text-gold">{q.code}</b> {q.question} <span className="text-muted-foreground">(peso {q.weight})</span></span>
                      <button className="text-xs text-destructive" onClick={() => confirm("¿Eliminar requisito?") && run(supabase.from("requirements").delete().eq("id", q.id))}>Eliminar</button>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 grid gap-2 md:grid-cols-[100px_1fr_80px_auto]">
                  <Input placeholder="Código" value={r.code} onChange={(e) => setNr({ ...nr, [c.id]: { ...r, code: e.target.value } })} />
                  <Input placeholder="Pregunta / requisito" value={r.question} onChange={(e) => setNr({ ...nr, [c.id]: { ...r, question: e.target.value } })} />
                  <Input type="number" min={1} max={10} value={r.weight} onChange={(e) => setNr({ ...nr, [c.id]: { ...r, weight: e.target.value } })} />
                  <Button size="sm" onClick={() => r.code && r.question && run(supabase.from("requirements").insert({ chapter_id: c.id, code: r.code, question: r.question, weight: Math.max(1, Number(r.weight) || 1), sort: c.requirements.length + 1 })).then(() => setNr({ ...nr, [c.id]: { code: "", question: "", weight: "1" } }))}>Agregar</Button>
                </div>
              </div>
            );
          })}
          <div className="grid gap-2 rounded-md border border-dashed border-border p-4 md:grid-cols-[120px_1fr_auto]">
            <Input placeholder="Código" value={nc.code} onChange={(e) => setNc({ ...nc, code: e.target.value })} />
            <Input placeholder="Título del capítulo" value={nc.title} onChange={(e) => setNc({ ...nc, title: e.target.value })} />
            <Button onClick={() => nc.code && nc.title && run(supabase.from("chapters").insert({ standard_id: sel, ...nc, sort: (chs.data?.length ?? 0) + 1 })).then(() => setNc({ code: "", title: "" }))}>Agregar capítulo</Button>
          </div>
        </section>
      )}
    </div>
  );
}
