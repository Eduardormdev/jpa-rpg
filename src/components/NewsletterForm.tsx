import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail } from "lucide-react";

export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.from("newsletter_subscribers").insert({ email: email.trim().toLowerCase(), name: name || null });
    setLoading(false);
    if (error) {
      if (error.code === "23505") toast.error("Este e-mail já está inscrito.");
      else toast.error("Erro ao inscrever. Tente novamente.");
      return;
    }
    toast.success("Inscrição confirmada! Bem-vindo à jornada.");
    setEmail("");
    setName("");
  }

  return (
    <form onSubmit={onSubmit} className={compact ? "flex flex-col sm:flex-row gap-2" : "space-y-3"}>
      {!compact && (
        <input
          type="text"
          placeholder="Seu nome (opcional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:border-accent"
        />
      )}
      <input
        type="email"
        required
        placeholder="seu@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex-1 rounded-md border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:border-accent"
      />
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-accent-gradient px-5 py-2.5 font-display tracking-widest text-sm text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-50"
      >
        <Mail className="h-4 w-4" />
        {loading ? "Enviando..." : "Inscrever"}
      </button>
    </form>
  );
}
