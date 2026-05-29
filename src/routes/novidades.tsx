import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ArrowRight, Calendar } from "lucide-react";
import mestre from "@/assets/mestre-news.png";
import ankin from "@/assets/ankin.png";
import sheets from "@/assets/jpa-sheets.jpg";
import master from "@/assets/jpa-master.jpg";
import homebrew from "@/assets/jpa-homebrew.jpg";

export const Route = createFileRoute("/novidades")({
  head: () => ({
    meta: [
      { title: "Novidades — HUB JPA" },
      { name: "description", content: "Fique por dentro das últimas novidades, atualizações e posts do HUB JPA." },
      { property: "og:title", content: "Novidades — HUB JPA" },
      { property: "og:description", content: "Posts, atualizações e bastidores do HUB JPA." },
    ],
    links: [{ rel: "canonical", href: "/novidades" }],
  }),
  component: Novidades,
});

const posts = [
  { title: "A arte de ser Mestre", excerpt: "Reflexões sobre conduzir histórias e equilibrar narrativa, regras e diversão.", date: "28 Mai 2026", img: mestre, tag: "Mestres" },
  { title: "Ankin chega ao HUB JPA", excerpt: "Conheça nosso novo mascote e o que ele representa para a comunidade.", date: "20 Mai 2026", img: ankin, tag: "Comunidade" },
  { title: "Fichas Modulares: primeiros passos", excerpt: "Como o novo sistema de fichas dinâmicas vai mudar suas mesas.", date: "12 Mai 2026", img: sheets, tag: "Ferramentas" },
  { title: "Painel do Mestre em tempo real", excerpt: "Acompanhe e ajuste fichas dos jogadores durante a sessão.", date: "05 Mai 2026", img: master, tag: "Ferramentas" },
  { title: "Homebrews sem dor de cabeça", excerpt: "Crie, organize e compartilhe suas próprias regras com a comunidade.", date: "28 Abr 2026", img: homebrew, tag: "Ferramentas" },
];

function Novidades() {
  const [featured, ...rest] = posts;
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="relative bg-hero pt-32 pb-16">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <p className="font-display tracking-widest text-accent">Blog</p>
          <h1 className="mt-3 font-display text-6xl md:text-7xl">Novidades JPA</h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Atualizações, bastidores, dicas para mestres e jogadores — tudo em um só lugar.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          <article className="grid gap-8 overflow-hidden rounded-2xl border border-border bg-card shadow-card md:grid-cols-2">
            <div className="relative aspect-video md:aspect-auto">
              <img src={featured.img} alt={featured.title} className="h-full w-full object-cover" />
            </div>
            <div className="flex flex-col justify-center p-8">
              <span className="font-display tracking-widest text-accent text-sm">{featured.tag}</span>
              <h2 className="mt-2 font-display text-4xl md:text-5xl">{featured.title}</h2>
              <p className="mt-4 text-muted-foreground">{featured.excerpt}</p>
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" /> {featured.date}
              </div>
              <Link to="/novidades" className="mt-6 inline-flex w-fit items-center gap-2 rounded-md bg-accent-gradient px-6 py-3 font-display tracking-widest text-primary-foreground shadow-glow hover:opacity-90 transition-opacity">
                Ler post <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </article>

          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((p) => (
              <article key={p.title} className="overflow-hidden rounded-xl border border-border bg-card shadow-card hover:-translate-y-1 transition-transform">
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={p.img} alt={p.title} loading="lazy" className="h-full w-full object-cover" />
                </div>
                <div className="p-6">
                  <span className="font-display tracking-widest text-accent text-xs">{p.tag}</span>
                  <h3 className="mt-2 font-display text-2xl tracking-wider">{p.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{p.excerpt}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {p.date}
                    </span>
                    <Link to="/novidades" className="text-sm font-display tracking-widest text-accent hover:underline">
                      Ler mais
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
