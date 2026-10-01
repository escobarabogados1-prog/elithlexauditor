import { supabase } from "@/integrations/supabase/client";
import { scoreOf } from "@/lib/auth";

export async function loadAssessment(id: string) {
  const { data: a, error } = await supabase.from("assessments").select("*, standards(*)").eq("id", id).single();
  if (error) throw error;
  const { data: chapters } = await supabase
    .from("chapters")
    .select("*, requirements(*)")
    .eq("standard_id", a.standard_id)
    .order("sort");
  const { data: answers } = await supabase.from("answers").select("*").eq("assessment_id", id);
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", a.user_id).maybeSingle();
  const chs = (chapters ?? []).map((c) => ({ ...c, requirements: [...c.requirements].sort((x, y) => x.sort - y.sort) }));
  return { assessment: a, chapters: chs, answers: answers ?? [], profile };
}

export type Loaded = Awaited<ReturnType<typeof loadAssessment>>;

export function computeScores(d: Loaded) {
  const map = new Map(d.answers.map((x) => [x.requirement_id, x]));
  let tot = 0, got = 0, answered = 0, total = 0;
  const byChapter = d.chapters.map((c) => {
    let ct = 0, cg = 0;
    for (const r of c.requirements) {
      total++;
      const s = map.get(r.id)?.status;
      if (s) answered++;
      const v = scoreOf(s);
      if (v !== null) { ct += r.weight; cg += v * r.weight; }
    }
    tot += ct; got += cg;
    return { id: c.id, name: `${c.code}. ${c.title}`, pct: ct ? Math.round((cg / ct) * 100) : 0 };
  });
  return { overall: tot ? Math.round((got / tot) * 100) : 0, byChapter, answered, total, map };
}
