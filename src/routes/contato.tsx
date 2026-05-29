import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Mail, MapPin, Phone, Send } from "lucide-react";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato — JPA RPG" },
      { name: "description", content: "Fale com a equipe da JPA. Tire dúvidas, contrate consultorias ou agende sua próxima sessão." },
    ],
  }),
  component: Contato,
});

function Contato() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="bg-hero pt-40 pb-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="font-display tracking-widest text-accent">Entre em contato</p>
          <h1 className="mt-3 font-display text-6xl md:text-7xl">Vamos conversar</h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Quer saber mais? Entre em contato com nossa equipe pelas informações abaixo ou nos envie uma mensagem.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-2">
          <div className="space-y-6">
            {[
              { icon: MapPin, title: "Endereço", val: "Franca - SP · Av. Santa Cruz, 3255 · Ap 402 Bl 40" },
              { icon: Mail, title: "E-mail", val: "jparpg@gmail.com" },
              { icon: Phone, title: "Telefone", val: "(16) 99341-2323" },
            ].map((c) => (
              <div key={c.title} className="flex items-start gap-4 rounded-xl border border-border bg-card p-6 shadow-card">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-accent-gradient shadow-glow">
                  <c.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-display text-xl tracking-wider">{c.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{c.val}</p>
                </div>
              </div>
            ))}
          </div>
          <form className="rounded-xl border border-border bg-card p-8 shadow-card space-y-5">
            <div>
              <label className="font-display tracking-widest text-sm">Nome</label>
              <input type="text" className="mt-2 w-full rounded-md border border-border bg-input px-4 py-3 outline-none focus:border-accent" placeholder="Seu nome" />
            </div>
            <div>
              <label className="font-display tracking-widest text-sm">E-mail</label>
              <input type="email" className="mt-2 w-full rounded-md border border-border bg-input px-4 py-3 outline-none focus:border-accent" placeholder="voce@email.com" />
            </div>
            <div>
              <label className="font-display tracking-widest text-sm">Mensagem</label>
              <textarea rows={5} className="mt-2 w-full rounded-md border border-border bg-input px-4 py-3 outline-none focus:border-accent" placeholder="Conte sobre sua mesa..." />
            </div>
            <button type="button" className="inline-flex items-center gap-2 rounded-md bg-accent-gradient px-6 py-3 font-display tracking-widest text-primary-foreground shadow-glow hover:opacity-90 transition-opacity">
              Enviar <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
