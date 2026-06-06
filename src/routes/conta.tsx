import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Shield } from "lucide-react";

export const Route = createFileRoute("/conta")({
  ssr: false,
  head: () => ({ meta: [{ title: "Minha conta — HUB JPA" }] }),
  component: AccountPage,
});

function AccountPage() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate({ to: "/login" }); return; }
      setEmail(session.user.email ?? "");
      const meta = (session.user.user_metadata ?? {}) as Record<string, unknown>;
      setName((meta.name as string) || (meta.full_name as string) || "");
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);
      setIsAdmin(roles?.some((r) => r.role === "admin") ?? false);
      setLoading(false);
    })();
  }, [navigate]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ data: { name } });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Conta atualizada.");
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 pt-36 pb-24">
        <h1 className="font-display text-4xl md:text-5xl tracking-widest text-glow">Minha conta</h1>
        <p className="mt-3 text-muted-foreground">Gerencie seus dados na HUB JPA.</p>

        {loading ? (
          <div className="mt-12 grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
        ) : (
          <form onSubmit={save} className="mt-10 space-y-5 rounded-2xl border border-border bg-card/60 backdrop-blur p-6 md:p-8">
            <div>
              <label className="font-display text-xs tracking-widest text-muted-foreground">Nome de aventureiro</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="font-display text-xs tracking-widest text-muted-foreground">E-mail</label>
              <input value={email} disabled className="mt-1 w-full rounded-md border border-border bg-background/50 px-3 py-2.5 text-sm text-muted-foreground" />
            </div>
            {isAdmin && (
              <div className="flex items-center gap-2 rounded-md border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-accent">
                <Shield className="h-4 w-4" /> Você é administrador.{" "}
                <Link to="/admin" className="underline ml-1">Abrir painel</Link>
              </div>
            )}
            <button type="submit" disabled={saving} className="w-full rounded-md bg-accent-gradient px-5 py-3 font-display tracking-widest text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-50">
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>
          </form>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
