import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LogOut, Mail, MessageSquare, Settings, Send, Download, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({ meta: [{ title: "Painel Admin — HUB JPA" }] }),
  component: AdminPage,
});

type Tab = "newsletter" | "mensagens" | "campanhas" | "config";

function AdminPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tab, setTab] = useState<Tab>("newsletter");

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate({ to: "/login", search: { redirect: "/admin" } as never }); return; }
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id);
      const admin = roles?.some((r) => r.role === "admin") ?? false;
      setIsAdmin(admin);
      setLoading(false);
      if (!admin) toast.error("Acesso restrito a administradores.");
    })();
  }, [navigate]);

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  if (loading) return <div className="min-h-screen grid place-items-center bg-background">Carregando...</div>;
  if (!isAdmin) return (
    <div className="min-h-screen grid place-items-center bg-background px-4 text-center">
      <div>
        <h1 className="font-display text-3xl tracking-widest">Acesso negado</h1>
        <p className="mt-3 text-muted-foreground">Você precisa ser administrador.</p>
        <Link to="/" className="mt-6 inline-block text-accent hover:underline">Voltar ao site</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-panel">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="font-display text-xl tracking-widest">JPA <span className="text-accent">— ADMIN</span></Link>
          <button onClick={logout} className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary">
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <nav className="flex flex-wrap gap-2 border-b border-border">
          {[
            { k: "newsletter", l: "Newsletter", I: Mail },
            { k: "mensagens", l: "Mensagens", I: MessageSquare },
            { k: "campanhas", l: "Envio em Massa", I: Send },
            { k: "config", l: "Configurações", I: Settings },
          ].map(({ k, l, I }) => (
            <button
              key={k}
              onClick={() => setTab(k as Tab)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 font-display tracking-widest text-sm border-b-2 transition-colors ${
                tab === k ? "border-accent text-accent" : "border-transparent hover:text-accent"
              }`}
            >
              <I className="h-4 w-4" /> {l}
            </button>
          ))}
        </nav>
        <div className="mt-8">
          {tab === "newsletter" && <NewsletterPanel />}
          {tab === "mensagens" && <MessagesPanel />}
          {tab === "campanhas" && <CampaignsPanel />}
          {tab === "config" && <SettingsPanel />}
        </div>
      </div>
    </div>
  );
}

function NewsletterPanel() {
  const [subs, setSubs] = useState<Array<{ id: string; email: string; name: string | null; created_at: string }>>([]);
  async function load() {
    const { data } = await supabase.from("newsletter_subscribers").select("*").order("created_at", { ascending: false });
    setSubs(data ?? []);
  }
  useEffect(() => { load(); }, []);

  async function remove(id: string) {
    if (!confirm("Remover inscrito?")) return;
    await supabase.from("newsletter_subscribers").delete().eq("id", id);
    load();
  }

  function exportCsv() {
    const rows = [["email", "name", "created_at"], ...subs.map((s) => [s.email, s.name ?? "", s.created_at])];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "newsletter.csv";
    a.click();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl tracking-widest">Inscritos ({subs.length})</h2>
        <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-secondary">
          <Download className="h-4 w-4" /> Exportar CSV
        </button>
      </div>
      <div className="mt-6 rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 font-display tracking-widest text-xs">
            <tr><th className="px-4 py-3 text-left">Email</th><th className="px-4 py-3 text-left">Nome</th><th className="px-4 py-3 text-left">Data</th><th /></tr>
          </thead>
          <tbody>
            {subs.map((s) => (
              <tr key={s.id} className="border-t border-border">
                <td className="px-4 py-3">{s.email}</td>
                <td className="px-4 py-3 text-muted-foreground">{s.name ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(s.created_at).toLocaleDateString("pt-BR")}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => remove(s.id)} className="text-destructive hover:opacity-70"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
            {subs.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Nenhum inscrito ainda.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MessagesPanel() {
  const [msgs, setMsgs] = useState<Array<{ id: string; name: string; email: string; subject: string | null; message: string; created_at: string; read: boolean }>>([]);
  async function load() {
    const { data } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
    setMsgs(data ?? []);
  }
  useEffect(() => { load(); }, []);

  async function toggleRead(id: string, read: boolean) {
    await supabase.from("contact_messages").update({ read: !read }).eq("id", id);
    load();
  }
  async function remove(id: string) {
    if (!confirm("Excluir mensagem?")) return;
    await supabase.from("contact_messages").delete().eq("id", id);
    load();
  }

  return (
    <div>
      <h2 className="font-display text-2xl tracking-widest">Mensagens de contato ({msgs.length})</h2>
      <div className="mt-6 space-y-4">
        {msgs.map((m) => (
          <div key={m.id} className={`rounded-lg border p-5 ${m.read ? "border-border bg-card/40" : "border-accent/50 bg-card/80 shadow-glow"}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-display tracking-widest">{m.name} <span className="text-muted-foreground text-sm">&lt;{m.email}&gt;</span></p>
                {m.subject && <p className="text-sm text-accent">{m.subject}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggleRead(m.id, m.read)} className="rounded-md border border-border px-2 py-1 text-xs hover:bg-secondary">
                  {m.read ? "Marcar não lida" : "Marcar lida"}
                </button>
                <button onClick={() => remove(m.id)} className="text-destructive hover:opacity-70"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <p className="mt-3 text-sm whitespace-pre-wrap">{m.message}</p>
            <p className="mt-2 text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString("pt-BR")}</p>
          </div>
        ))}
        {msgs.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhuma mensagem.</p>}
      </div>
    </div>
  );
}

function CampaignsPanel() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [campaigns, setCampaigns] = useState<Array<{ id: string; subject: string; body: string; created_at: string; sent_at: string | null }>>([]);

  async function load() {
    const { data } = await supabase.from("email_campaigns").select("*").order("created_at", { ascending: false });
    setCampaigns(data ?? []);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!subject || !body) return;
    const { error } = await supabase.from("email_campaigns").insert({ subject, body });
    if (error) { toast.error("Erro ao salvar."); return; }
    toast.success("Campanha salva.");
    setSubject(""); setBody(""); load();
  }

  async function openMailto(c: { subject: string; body: string }) {
    const { data: subs } = await supabase.from("newsletter_subscribers").select("email");
    const bcc = (subs ?? []).map((s) => s.email).join(",");
    const href = `mailto:?bcc=${encodeURIComponent(bcc)}&subject=${encodeURIComponent(c.subject)}&body=${encodeURIComponent(c.body)}`;
    window.location.href = href;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <h2 className="font-display text-2xl tracking-widest">Nova campanha</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Componha sua mensagem. Ao clicar em "Enviar via e-mail", o seu cliente de e-mail abrirá com todos os inscritos em cópia oculta.
        </p>
        <div className="mt-4 space-y-3">
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Assunto" className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:border-accent" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Mensagem..." rows={10} className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:border-accent" />
          <button onClick={save} className="rounded-md bg-accent-gradient px-5 py-2.5 font-display tracking-widest text-sm text-primary-foreground shadow-glow hover:opacity-90">
            Salvar campanha
          </button>
        </div>
      </div>
      <div>
        <h2 className="font-display text-2xl tracking-widest">Campanhas salvas</h2>
        <div className="mt-4 space-y-3">
          {campaigns.map((c) => (
            <div key={c.id} className="rounded-lg border border-border bg-card/40 p-4">
              <p className="font-display tracking-widest">{c.subject}</p>
              <p className="mt-1 text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString("pt-BR")}</p>
              <p className="mt-2 text-sm line-clamp-3 whitespace-pre-wrap">{c.body}</p>
              <button onClick={() => openMailto(c)} className="mt-3 inline-flex items-center gap-2 rounded-md border border-accent px-3 py-1.5 text-xs text-accent hover:bg-accent/10">
                <Send className="h-3 w-3" /> Enviar via e-mail
              </button>
            </div>
          ))}
          {campaigns.length === 0 && <p className="text-muted-foreground text-sm">Nenhuma campanha ainda.</p>}
        </div>
      </div>
    </div>
  );
}

function SettingsPanel() {
  const [whatsapp_number, setWa] = useState("");
  const [whatsapp_message, setWaMsg] = useState("");
  const [notification_email, setNoti] = useState("");
  const [donation_url, setDonation] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("site_settings").select("*").eq("id", 1).maybeSingle().then(({ data }) => {
      if (data) {
        setWa(data.whatsapp_number ?? "");
        setWaMsg(data.whatsapp_message ?? "");
        setNoti(data.notification_email ?? "");
        setDonation(data.donation_url ?? "");
      }
    });
  }, []);

  async function save() {
    setSaving(true);
    const { error } = await supabase.from("site_settings").update({
      whatsapp_number, whatsapp_message, notification_email, donation_url, updated_at: new Date().toISOString(),
    }).eq("id", 1);
    setSaving(false);
    if (error) toast.error("Erro ao salvar.");
    else toast.success("Configurações atualizadas.");
  }

  return (
    <div className="max-w-2xl">
      <h2 className="font-display text-2xl tracking-widest">Configurações do site</h2>
      <div className="mt-6 space-y-5">
        <Field label="WhatsApp (com DDI, ex: 5516993412323)" value={whatsapp_number} onChange={setWa} placeholder="5516993412323" />
        <Field label="Mensagem padrão do WhatsApp" value={whatsapp_message} onChange={setWaMsg} placeholder="Olá! Vim pelo site." />
        <Field label="E-mail que receberá mensagens do site" value={notification_email} onChange={setNoti} placeholder="contato@jpa.com" type="email" />
        <Field label="Link de doação (Patreon, etc)" value={donation_url} onChange={setDonation} placeholder="https://patreon.com/..." />
        <button onClick={save} disabled={saving} className="rounded-md bg-accent-gradient px-5 py-2.5 font-display tracking-widest text-sm text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-50">
          {saving ? "Salvando..." : "Salvar configurações"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="font-display text-xs tracking-widest text-muted-foreground">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:border-accent" />
    </div>
  );
}
