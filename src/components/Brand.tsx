import { Link, useNavigate } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import logo from "@/assets/elith-logo.png.asset.json";
import { Button } from "@/components/ui/button";
import { useAuth, WHATSAPP } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const logoUrl = logo.url;

export function SiteHeader() {
  const { user, isStaff } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="no-print sticky top-0 z-40 border-b border-border/60 bg-ink-gradient text-ink-foreground">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-3">
          <span className="font-display text-xl font-semibold tracking-wider text-gold">ELITH LEX GROUP</span>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          {user ? (
            <>
              <Link to="/dashboard" className="px-3 py-2 hover:text-gold">Auditorías</Link>
              <Link to="/historial" className="px-3 py-2 hover:text-gold">Historial</Link>
              <Link to="/acciones" className="px-3 py-2 hover:text-gold">Plan de acción</Link>
              {isStaff && <Link to="/admin" className="px-3 py-2 hover:text-gold">Administración</Link>}
              {isAdmin && <Link to="/normas" className="px-3 py-2 hover:text-gold">Normas</Link>}
              <Button
                size="sm"
                variant="outline"
                className="border-gold/60 bg-transparent text-gold hover:bg-gold hover:text-ink"
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate({ to: "/auth", replace: true });
                }}
              >
                Salir
              </Button>
            </>
          ) : (
            <>
              <a href="/#servicios" className="hidden px-3 py-2 hover:text-gold sm:inline">Servicios</a>
              <a href="/#contacto" className="hidden px-3 py-2 hover:text-gold sm:inline">Contacto</a>
              <Button asChild size="sm" className="bg-gold text-ink hover:bg-gold-soft">
                <Link to="/auth">Ingresar</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export function WhatsAppButton() {
  return (
    <a
      href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Hola ELITH LEX GROUP, quiero información sobre auditorías.")}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      className="no-print fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-success text-primary-foreground shadow-lg transition hover:scale-105"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
