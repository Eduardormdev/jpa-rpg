import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { Heart, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/doe")({
  head: () => ({
    meta: [
      { title: "Nos torne real — HUB JPA" },
      { name: "description", content: "Apoie o HUB JPA e ajude a tornar este projeto realidade para a comunidade de RPG." },
    ],
  }),
  component: DoePage,
});

function DoePage() {
  const [url, setUrl] = useState("");

  useEffect(() => {
    supabase.from("site_settings").select("donation_url").eq("id", 1).maybeSingle().then(({ data }) => {
      if (data?.donation_url) setUrl(data.donation_url);
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="relative bg-hero pt-32 pb-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-accent-gradient shadow-glow">
            <Heart className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="mt-6 font-display text-5xl md:text-6xl tracking-widest">
            NOS TORNE <span className="text-accent text-glow">REAL</span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            O HUB JPA nasce do sonho de transformar a jornada de mestres e jogadores de RPG. Com o seu apoio,
            podemos criar mais conteúdo, lançar ferramentas e construir uma comunidade ainda maior.
          </p>
          <div className="mt-10 rounded-2xl border border-border bg-card/70 p-8 shadow-glow">
            <h2 className="font-display text-2xl tracking-widest text-accent">Apoie o projeto</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Em breve estaremos no Patreon e em outras plataformas de apoio. Por enquanto, sua mensagem,
              compartilhamento e participação já fazem toda a diferença.
            </p>
            {url ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 rounded-md bg-accent-gradient px-6 py-3 font-display tracking-widest text-primary-foreground shadow-glow hover:opacity-90"
              >
                Apoiar agora <ExternalLink className="h-4 w-4" />
              </a>
            ) : (
              <p className="mt-6 inline-flex items-center gap-2 rounded-md border border-dashed border-border px-6 py-3 font-display tracking-widest text-muted-foreground">
                Link de apoio em breve
              </p>
            )}
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
