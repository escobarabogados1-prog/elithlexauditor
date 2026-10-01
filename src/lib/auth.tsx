import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Role = "admin" | "auditor" | "empresa";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async (u: User | null) => {
      setUser(u);
      if (u) {
        const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.id);
        setRoles((data ?? []).map((r) => r.role as Role));
      } else setRoles([]);
      setLoading(false);
    };
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setTimeout(() => load(s?.user ?? null), 0);
    });
    supabase.auth.getUser().then(({ data }) => load(data.user));
    return () => sub.subscription.unsubscribe();
  }, []);

  const isStaff = roles.includes("admin") || roles.includes("auditor");
  return { user, roles, isStaff, isAdmin: roles.includes("admin"), loading };
}

export const STATUS_LABEL: Record<string, string> = {
  cumple: "Cumple",
  parcial: "Cumple parcialmente",
  no_cumple: "No cumple",
  no_aplica: "No aplica",
};

export function scoreOf(status: string | null | undefined): number | null {
  if (status === "cumple") return 1;
  if (status === "parcial") return 0.5;
  if (status === "no_cumple") return 0;
  return null;
}

export function semaforo(pct: number) {
  if (pct >= 85) return { label: "Conforme", cls: "bg-success text-primary-foreground" };
  if (pct >= 60) return { label: "En proceso", cls: "bg-warning text-foreground" };
  return { label: "Crítico", cls: "bg-destructive text-destructive-foreground" };
}

export const WHATSAPP = "573167824217";
export const EMAIL = "elithlex@gmail.com";
