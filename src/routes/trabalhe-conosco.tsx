import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Briefcase, Code, PenTool, Swords } from "lucide-react";

export const Route = createFileRoute("/trabalhe-conosco")({
  head: () => ({
    meta: [
      { title: "Trabalhe Conosco — JPA RPG" },
      { name: "description", content: "Faça parte da equipe JPA. Vagas para mestres, criadores de conteúdo, desenvolvedores e mais." },
    ],
  }),
  component: Trabalhe,
});

const vagas = [
  { icon: Swords, title: "Mestre Parceiro", desc: "Conduza one-shots e campanhas para clientes da JPA." },
  { icon: PenTool, title: "Criador de Aventuras", desc: "Escreva roteiros, NPCs e cenários originais." },
  { icon: Code, title: "Desenvolvedor(a) Web", desc: "Construa as ferramentas digitais que rodam no HUB." },
  { icon: Briefcase, title: "Consultor de Mesas", desc: "Ajude mestres a evoluírem suas campanhas." },
];

function Trabalhe() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="bg-hero pt-40 pb-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="font-display tracking-widest text-accent">Carreiras</p>
          <h1 className="mt-3 font-display text-6xl md:text-7xl">Vem fazer parte da nossa equipe</h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Se você ama RPG tanto quanto a gente, esse pode ser o seu lugar. Confira nossas oportunidades abertas.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 sm:grid-cols-2">
          {vagas.map((v) => (
            <div key={v.title} className="rounded-xl border border-border bg-card p-7 shadow-card hover:border-accent transition-colors">
              <div className="grid h-12 w-12 place-items-center rounded-lg bg-accent-gradient shadow-glow">
                <v.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="mt-5 font-display text-2xl tracking-wider">{v.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{v.desc}</p>
              <Link to="/contato" className="mt-5 inline-flex font-display tracking-widest text-accent hover:underline">
                Candidatar-se →
              </Link>
            </div>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
