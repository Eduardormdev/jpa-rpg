import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ArrowRight, Dice6, ScrollText, Sparkles, Users, Map, Wand2 } from "lucide-react";
import flame from "@/assets/brand-logo.png";
import mage from "@/assets/ankin.png";
import sheets from "@/assets/jpa-sheets.jpg";
import master from "@/assets/mestre-news.png";
import homebrew from "@/assets/jpa-homebrew.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JPA — Hub de RPG para Mestres e Jogadores" },
      { name: "description", content: "JPA é o hub que conecta mestres, jogadores e mesas de RPG. Consultorias, ferramentas e suporte para sua jornada." },
      { property: "og:title", content: "JPA — Hub de RPG" },
      { property: "og:description", content: "Consultorias, ferramentas e comunidade para sua jornada de RPG de mesa." },
    ],
  }),
  component: Index,
});

const novidades = [
  { title: "Fichas Modulares", desc: "Novo sistema de fichas dinâmicas para qualquer sistema de RPG.", img: sheets },
  { title: "Controle de Mestre", desc: "Acompanhe e ajuste as fichas dos jogadores em tempo real.", img: master, wip: true },
  { title: "Sistema de Homebrews", desc: "Crie e organize suas próprias regras e campanhas.", img: homebrew, wip: true },
];

const servicos = [
  { icon: Wand2, title: "Consultoria de Mestres", desc: "Mentoria personalizada para mestres que querem elevar suas campanhas." },
  { icon: Users, title: "Mestres por Demanda", desc: "Contrate um mestre para sua one-shot ou substitua o seu quando ele faltar." },
  { icon: Map, title: "Aluguel de Mesas", desc: "Encontre o lugar perfeito para reunir seu grupo e jogar sem pressa." },
  { icon: ScrollText, title: "Criação de Aventuras", desc: "Roteiros, NPCs e mapas sob medida para a sua mesa." },
  { icon: Dice6, title: "Ferramentas Digitais", desc: "Fichas, dados e controle de campanha — tudo em um só lugar." },
  { icon: Sparkles, title: "Comunidade Ativa", desc: "Conecte-se com jogadores e mestres da sua região." },
];

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden bg-hero pt-32 pb-24">
        <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:32px_32px]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 md:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-1.5 text-xs font-display tracking-widest text-accent backdrop-blur">
              <Sparkles className="h-3 w-3" /> O HUB do RPG de Mesa
            </span>
            <h1 className="mt-6 font-display text-6xl leading-[0.95] md:text-7xl lg:text-8xl">
              Bem-vindo ao <span className="text-glow text-accent">HUB JPA</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Um hub de RPG onde você aluga lugares para suas sessões, encontra consultorias para mestres, contrata um mestre para aquela one-shot e muito mais. Cadastre-se e comece sua jornada agora.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/contato" className="inline-flex items-center gap-2 rounded-md bg-accent-gradient px-7 py-3.5 font-display tracking-widest text-primary-foreground shadow-glow hover:opacity-90 transition-opacity">
                Cadastre-se! <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/sobre" className="inline-flex items-center gap-2 rounded-md border border-border bg-card/40 px-7 py-3.5 font-display tracking-widest backdrop-blur hover:bg-secondary transition-colors">
                Saiba mais
              </Link>
            </div>
          </div>
          <div className="relative flex justify-center">
            <div className="absolute inset-0 bg-accent/30 blur-3xl rounded-full" />
            <img src={flame} alt="Chama mística JPA" width={520} height={520} className="relative w-full max-w-md animate-flicker" />
          </div>
        </div>
      </section>

      {/* SERVIÇOS */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <p className="font-display tracking-widest text-accent">O que oferecemos</p>
            <h2 className="mt-3 font-display text-5xl md:text-6xl">Sua jornada, nosso suporte</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Da primeira ficha à campanha lendária, a JPA acompanha cada passo de mestres e jogadores.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {servicos.map((s) => (
              <div key={s.title} className="group rounded-xl border border-border bg-card p-7 shadow-card hover:border-accent transition-colors">
                <div className="grid h-12 w-12 place-items-center rounded-lg bg-accent-gradient shadow-glow group-hover:scale-110 transition-transform">
                  <s.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="mt-5 font-display text-2xl tracking-wider">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NOVIDADES */}
      <section className="bg-panel py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <p className="font-display tracking-widest text-accent">Novidades</p>
            <h2 className="mt-3 font-display text-5xl md:text-6xl">Novidades JPA</h2>
          </div>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {novidades.map((n) => (
              <article key={n.title} className="overflow-hidden rounded-xl border border-border bg-card shadow-card hover:-translate-y-1 transition-transform">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img src={n.img} alt={n.title} loading="lazy" className="h-full w-full object-cover" />
                  {n.wip && (
                    <span className="absolute top-3 right-3 rounded-full bg-accent-gradient px-3 py-1 text-xs font-display tracking-widest text-primary-foreground">WIP</span>
                  )}
                </div>
                <div className="p-6 text-center">
                  <h3 className="font-display text-2xl tracking-wider">{n.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{n.desc}</p>
                  <button className="mt-5 inline-flex items-center gap-2 rounded-md bg-background px-5 py-2.5 font-display text-sm tracking-widest hover:bg-accent-gradient transition-colors">
                    Acessar <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA com mage */}
      <section className="relative overflow-hidden py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 md:grid-cols-2">
          <div className="relative">
            <div className="absolute inset-0 bg-accent/20 blur-3xl rounded-full" />
            <img src={mage} alt="Mestre mago JPA" loading="lazy" className="relative w-full max-w-lg mx-auto rounded-2xl shadow-glow" />
          </div>
          <div>
            <h2 className="font-display text-5xl md:text-6xl">Pronto para rolar os dados?</h2>
            <p className="mt-5 text-lg text-muted-foreground max-w-lg">
              Junte-se ao HUB JPA e encontre tudo o que sua mesa precisa — de mestres experientes a ferramentas digitais que tornam cada sessão inesquecível.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/contato" className="inline-flex items-center gap-2 rounded-md bg-accent-gradient px-7 py-3.5 font-display tracking-widest text-primary-foreground shadow-glow hover:opacity-90 transition-opacity">
                Falar com a equipe <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/sobre" className="inline-flex items-center gap-2 rounded-md border border-border px-7 py-3.5 font-display tracking-widest hover:bg-secondary transition-colors">
                Conheça a JPA
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
