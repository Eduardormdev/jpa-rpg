import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import ankin from "@/assets/ankin-vrt.png";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({ redirect: typeof s.redirect === "string" ? s.redirect : undefined }),
  head: () => ({
    meta: [
      { title: "Entrar — HUB JPA" },
      { name: "description", content: "Acesse sua conta no HUB JPA e continue sua jornada de RPG." },
    ],
  }),
  component: LoginPage,
});

const schema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(6).max(72),
  name: z.string().max(120).optional(),
});

function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const search = useSearch({ from: "/login" }) as { redirect?: string };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password, name });
    if (!parsed.success) { toast.error("Verifique os dados informados."); return; }
    setLoading(true);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      setLoading(false);
      if (error) { toast.error("Credenciais inválidas."); return; }
      toast.success("Bem-vindo!");
      navigate({ to: (search.redirect as "/admin") || "/" });
    } else {
      const { error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { emailRedirectTo: `${window.location.origin}/`, data: { name } },
      });
      setLoading(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Cadastro realizado! Verifique seu e-mail se necessário.");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="relative bg-hero pt-32 pb-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 md:grid-cols-2">
          <div className="relative hidden md:block">
            <div className="absolute inset-0 bg-accent/30 blur-3xl rounded-full" />
            <img src={ankin} alt="Personagem JPA" className="relative mx-auto max-h-[640px] object-contain drop-shadow-[0_0_40px_hsl(var(--accent)/0.4)]" />
          </div>
          <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-card/80 backdrop-blur p-8 shadow-glow">
            <h1 className="font-display text-4xl tracking-widest">
              {mode === "login" ? "Entrar" : "Criar conta"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === "login" ? "Acesse sua jornada no HUB JPA." : "Cadastre-se e comece sua jornada."}
            </p>
            <form className="mt-6 space-y-4" onSubmit={submit}>
              {mode === "signup" && (
                <div>
                  <label className="font-display text-xs tracking-widest text-muted-foreground">Nome</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:border-accent" />
                </div>
              )}
              <div>
                <label className="font-display text-xs tracking-widest text-muted-foreground">E-mail</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:border-accent" />
              </div>
              <div>
                <label className="font-display text-xs tracking-widest text-muted-foreground">Senha</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:border-accent" />
              </div>
              <button type="submit" disabled={loading} className="w-full rounded-md bg-accent-gradient px-5 py-3 font-display tracking-widest text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-50">
                {loading ? "Carregando..." : mode === "login" ? "Entrar" : "Cadastrar"}
              </button>
            </form>
            <p className="mt-5 text-center text-sm text-muted-foreground">
              {mode === "login" ? "Ainda não tem conta?" : "Já tem conta?"}{" "}
              <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="text-accent hover:underline font-display tracking-widest">
                {mode === "login" ? "Cadastre-se" : "Entrar"}
              </button>
            </p>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Ao continuar você concorda com a{" "}
              <Link to="/politica-de-privacidade" className="text-accent hover:underline">Política de Privacidade</Link>.
            </p>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
