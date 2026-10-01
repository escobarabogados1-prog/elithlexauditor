import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ShieldCheck, ClipboardCheck, BarChart3, Scale, Leaf, HardHat, Lock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SiteHeader, WhatsAppButton, logoUrl } from "@/components/Brand";
import { supabase } from "@/integrations/supabase/client";
import { EMAIL, WHATSAPP } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ELITH LEX GROUP | Auditoría de normas ISO, ICONTEC y Compliance B2B" },
      { name: "description", content: "Auditorías ISO 9001, 27001, 14001, 45001, SG-SST y compliance legal para empresas en Colombia. Diagnóstico en línea con informe automático." },
      { property: "og:title", content: "ELITH LEX GROUP | Auditoría y Compliance" },
      { property: "og:description", content: "Diagnóstico en línea de normas ISO, SG-SST y compliance legal B2B con informe de cumplimiento." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const services = [
  { icon: ClipboardCheck, t: "ISO 9001 · Calidad", d: "Diagnóstico, auditoría interna y acompañamiento a la certificación del SGC." },
  { icon: Lock, t: "ISO/IEC 27001 · Seguridad de la información", d: "Evaluación de riesgos, Declaración de Aplicabilidad y controles del Anexo A." },
  { icon: Leaf, t: "ISO 14001 · Ambiental", d: "Aspectos e impactos, cumplimiento legal ambiental y planes de emergencia." },
  { icon: HardHat, t: "ISO 45001 y SG-SST", d: "Estándares mínimos Res. 0312 de 2019, matriz de peligros y COPASST." },
  { icon: Scale, t: "Compliance legal B2B", d: "SAGRILAFT, PTEE, Habeas Data (Ley 1581) y gobierno corporativo." },
  { icon: ShieldCheck, t: "Preparación ICONTEC", d: "Pre-auditorías y cierre de brechas antes del ente certificador." },
];

const contactSchema = z.object({
  name: z.string().trim().min(1, "Escribe tu nombre").max(120),
  email: z.string().trim().email("Correo no válido").max(255),
  company: z.string().trim().max(150).optional(),
  phone: z.string().trim().max(30).optional(),
  message: z.string().trim().min(1, "Escribe tu mensaje").max(2000),
});

function Home() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="bg-ink-gradient text-ink-foreground">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 md:grid-cols-2">
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-gold">Auditoría · Compliance · Legaltech</p>
            <h1 className="text-5xl font-semibold leading-tight md:text-6xl">Su camino a la certificación, medido requisito por requisito.</h1>
            <p className="mt-6 max-w-lg text-ink-foreground/80">
              Responda en línea el cuestionario de la norma que necesita y obtenga al instante su porcentaje de cumplimiento, brechas y plan de acción. Nuestros auditores validan cada evidencia.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-gold text-ink hover:bg-gold-soft">
                <Link to="/auth">Iniciar diagnóstico gratuito</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-gold/60 bg-transparent text-gold hover:bg-gold hover:text-ink">
                <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer">Hablar con un asesor</a>
              </Button>
            </div>
          </div>
          <img src={logoUrl} alt="Logo ELITH LEX GROUP" className="mx-auto w-full max-w-md rounded-md shadow-2xl" />
        </div>
      </section>

      <section id="servicios" className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-4xl font-semibold text-primary">Servicios</h2>
        <p className="mt-2 text-muted-foreground">Lo que hace una firma de auditoría y compliance, ahora con diagnóstico digital.</p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <div key={s.t} className="rounded-md border border-border bg-card p-6 transition hover:border-gold">
              <s.icon className="h-8 w-8 text-gold" />
              <h3 className="mt-4 text-xl font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-secondary">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-4">
          {[
            { i: FileText, t: "1. Elija la norma" },
            { i: ClipboardCheck, t: "2. Responda en línea" },
            { i: BarChart3, t: "3. Reciba su informe" },
            { i: ShieldCheck, t: "4. Cierre brechas" },
          ].map((s) => (
            <div key={s.t} className="text-center">
              <s.i className="mx-auto h-10 w-10 text-primary" />
              <p className="mt-3 font-display text-xl font-semibold">{s.t}</p>
            </div>
          ))}
        </div>
      </section>

      <ContactSection />

      <footer className="bg-ink-gradient py-8 text-center text-sm text-ink-foreground/70">
        <p className="font-display text-lg text-gold">ELITH LEX GROUP</p>
        <p>Bogotá, Colombia · {EMAIL} · +57 316 782 4217</p>
      </footer>
      <WhatsAppButton />
    </div>
  );
}

function ContactSection() {
  const [form, setForm] = useState({ name: "", email: "", company: "", phone: "", message: "" });
  const [sending, setSending] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = contactSchema.safeParse(form);
    if (!r.success) return toast.error(r.error.issues[0].message);
    setSending(true);
    const { error } = await supabase.from("contact_messages").insert({
      name: r.data.name, email: r.data.email, company: r.data.company || null, phone: r.data.phone || null, message: r.data.message,
    });
    setSending(false);
    if (error) return toast.error("No se pudo enviar. Intente por WhatsApp.");
    toast.success("Mensaje recibido. Le contactaremos pronto.");
    setForm({ name: "", email: "", company: "", phone: "", message: "" });
  };
  return (
    <section id="contacto" className="mx-auto max-w-3xl px-4 py-20">
      <h2 className="text-4xl font-semibold text-primary">Contáctenos</h2>
      <p className="mt-2 text-muted-foreground">Escríbanos a {EMAIL} o deje sus datos.</p>
      <form onSubmit={submit} className="mt-8 grid gap-4 sm:grid-cols-2">
        <Input placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input placeholder="Correo" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input placeholder="Empresa" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
        <Input placeholder="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Textarea className="sm:col-span-2" rows={5} placeholder="¿Qué norma o servicio le interesa?" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
        <Button type="submit" disabled={sending} className="sm:col-span-2">{sending ? "Enviando..." : "Enviar mensaje"}</Button>
      </form>
    </section>
  );
}
