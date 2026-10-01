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

/** Loads every visible assessment with its computed scores (RLS limits the set). */
export async function loadAllScored() {
  const { data: as } = await supabase.from("assessments").select("*, standards(id, name, code)").order("created_at");
  const list = as ?? [];
  if (!list.length) return [];
  const stdIds = [...new Set(list.map((a) => a.standard_id))];
  const [{ data: chapters }, { data: answers }, { data: profs }] = await Promise.all([
    supabase.from("chapters").select("*, requirements(*)").in("standard_id", stdIds).order("sort"),
    supabase.from("answers").select("*").in("assessment_id", list.map((a) => a.id)),
    supabase.from("profiles").select("*").in("id", [...new Set(list.map((a) => a.user_id))]),
  ]);
  return list.map((a) => {
    const d = {
      assessment: a,
      chapters: (chapters ?? []).filter((c) => c.standard_id === a.standard_id),
      answers: (answers ?? []).filter((x) => x.assessment_id === a.id),
      profile: profs?.find((p) => p.id === a.user_id) ?? null,
    } as unknown as Loaded;
    return { a, profile: d.profile, scores: computeScores(d) };
  });
}
