import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Swords, Skull } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/nossas-historias")({
  head: () => ({
    meta: [
      { title: "Nossas Histórias — HUB JPA" },
      { name: "description", content: "Os livros do Mestre, do Jogador e dos Monstros. Folheie as histórias da HUB JPA." },
      { property: "og:title", content: "Nossas Histórias — HUB JPA" },
      { property: "og:description", content: "Folheie os livros do Mestre, do Jogador e dos Monstros." },
    ],
  }),
  component: NossasHistoriasPage,
});

const books = [
  { slug: "mestre", title: "Livro do Mestre", desc: "Crônicas, segredos e bastidores das mesas conduzidas pela HUB JPA.", Icon: BookOpen, accent: "from-purple-700 to-fuchsia-500" },
  { slug: "jogador", title: "Livro do Jogador", desc: "Aventuras vividas, personagens marcantes e momentos memoráveis dos heróis.", Icon: Swords, accent: "from-indigo-700 to-purple-500" },
  { slug: "monstros", title: "Livro dos Monstros", desc: "Bestiário ilustrado das criaturas que cruzaram nossas campanhas.", Icon: Skull, accent: "from-fuchsia-700 to-rose-500" },
] as const;

function NossasHistoriasPage() {
  return (
    <div className="min-h-screen bg-hero">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 pt-36 pb-24">
        <header className="text-center">
          <p className="font-display tracking-[0.4em] text-accent text-sm">A BIBLIOTECA</p>
          <h1 className="mt-3 font-display text-5xl md:text-7xl tracking-widest text-glow">Nossas Histórias</h1>
          <p className="mt-5 max-w-2xl mx-auto text-muted-foreground">
            Escolha um dos três tomos sagrados. Cada livro guarda capítulos vivos da HUB JPA — folheie página por página.
          </p>
        </header>

        <div className="mt-20 grid gap-10 md:grid-cols-3">
          {books.map(({ slug, title, desc, Icon, accent }) => (
            <Link
              key={slug}
              to="/nossas-historias/$book"
              params={{ book: slug }}
              className="group relative flex flex-col items-center text-center"
            >
              <div className="relative">
                <div className={`absolute inset-0 -z-10 blur-3xl opacity-40 bg-gradient-to-br ${accent} rounded-full group-hover:opacity-70 transition-opacity`} />
                <div className="relative w-56 h-72 md:w-64 md:h-80 rounded-r-md rounded-l-sm bg-gradient-to-br from-[#2a1647] to-[#1a0b2e] border border-accent/40 shadow-glow flex items-center justify-center transition-transform duration-500 group-hover:-rotate-3 group-hover:scale-105">
                  <div className="absolute left-2 top-0 bottom-0 w-2 bg-black/40 rounded-l-sm" />
                  <div className="absolute inset-3 border border-accent/30 rounded-sm flex items-center justify-center">
                    <Icon className="h-24 w-24 text-accent drop-shadow-[0_0_20px_hsl(var(--accent)/0.8)]" strokeWidth={1.2} />
                  </div>
                </div>
              </div>
              <h2 className="mt-8 font-display text-2xl tracking-widest text-glow">{title}</h2>
              <p className="mt-3 max-w-xs text-sm text-muted-foreground">{desc}</p>
              <span className="mt-4 inline-flex items-center gap-2 text-accent font-display tracking-widest text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                Abrir livro →
              </span>
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
