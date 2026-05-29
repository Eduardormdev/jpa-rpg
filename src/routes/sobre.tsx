import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Target, Heart, Compass } from "lucide-react";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre a JPA — Hub de RPG" },
      { name: "description", content: "Conheça a história e a missão da JPA, o hub que conecta a comunidade de RPG de mesa." },
    ],
  }),
  component: Sobre,
});

function Sobre() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="bg-hero pt-40 pb-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="font-display tracking-widest text-accent">Nossa história</p>
          <h1 className="mt-3 font-display text-6xl md:text-7xl">Sobre a JPA</h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Bem-vindo à JPA — o lugar onde a magia do RPG encontra a tecnologia. Nascemos da paixão por mesas memoráveis e da vontade de tornar o RPG mais acessível, organizado e divertido para todos.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 md:grid-cols-3">
          {[
            { icon: Target, title: "Missão", desc: "Auxiliar mestres e jogadores em cada etapa da jornada de RPG de mesa." },
            { icon: Heart, title: "Valores", desc: "Comunidade, criatividade e respeito por cada estilo de jogo." },
            { icon: Compass, title: "Visão", desc: "Ser o maior hub de RPG do Brasil, conectando mesas pelo país inteiro." },
          ].map((c) => (
            <div key={c.title} className="rounded-xl border border-border bg-card p-8 shadow-card text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-lg bg-accent-gradient shadow-glow">
                <c.icon className="h-7 w-7 text-primary-foreground" />
              </div>
              <h3 className="mt-5 font-display text-2xl tracking-wider">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
