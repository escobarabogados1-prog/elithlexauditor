import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/components/Brand";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Ingresar | ELITH LEX GROUP" },
      { name: "description", content: "Acceda a su plataforma de auditoría y diagnóstico de normas." },
      { property: "og:title", content: "Ingresar | ELITH LEX GROUP" },
      { property: "og:description", content: "Plataforma de auditoría y compliance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [f, setF] = useState({ email: "", password: "", full_name: "", company_name: "", nit: "", phone: "" });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email: f.email, password: f.password });
      setBusy(false);
      if (error) return toast.error("Correo o contraseña incorrectos");
      navigate({ to: "/dashboard" });
    } else {
      if (f.password.length < 8) { setBusy(false); return toast.error("La contraseña debe tener al menos 8 caracteres"); }
      const { error } = await supabase.auth.signUp({
        email: f.email,
        password: f.password,
        options: {
          emailRedirectTo: window.location.origin + "/dashboard",
          data: { full_name: f.full_name, company_name: f.company_name, nit: f.nit, phone: f.phone },
        },
      });
      setBusy(false);
      if (error) return toast.error(error.message);
      setSent(true);
    }
  };

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="text-4xl font-semibold text-primary">{mode === "in" ? "Ingresar" : "Registrar empresa"}</h1>
        {sent ? (
          <p className="mt-6 rounded-md border border-gold bg-secondary p-4">Revise su correo y confirme su cuenta para continuar.</p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "up" && (
              <>
                <div><Label>Nombre del responsable</Label><Input required value={f.full_name} onChange={set("full_name")} /></div>
                <div><Label>Razón social</Label><Input required value={f.company_name} onChange={set("company_name")} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>NIT</Label><Input value={f.nit} onChange={set("nit")} /></div>
                  <div><Label>Teléfono</Label><Input value={f.phone} onChange={set("phone")} /></div>
                </div>
              </>
            )}
            <div><Label>Correo</Label><Input type="email" required value={f.email} onChange={set("email")} /></div>
            <div><Label>Contraseña</Label><Input type="password" required value={f.password} onChange={set("password")} /></div>
            <Button className="w-full" disabled={busy}>{busy ? "..." : mode === "in" ? "Ingresar" : "Crear cuenta"}</Button>
          </form>
        )}
        <button className="mt-4 text-sm text-primary underline" onClick={() => { setMode(mode === "in" ? "up" : "in"); setSent(false); }}>
          {mode === "in" ? "¿Su empresa no tiene cuenta? Regístrese" : "¿Ya tiene cuenta? Ingrese"}
        </button>
      </div>
    </div>
  );
}
