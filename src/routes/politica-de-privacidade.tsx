import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/politica-de-privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — HUB JPA" },
      { name: "description", content: "Política de Privacidade do HUB JPA: como tratamos seus dados pessoais." },
    ],
    links: [{ rel: "canonical", href: "/politica-de-privacidade" }],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="bg-hero pt-32 pb-12">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="font-display tracking-widest text-accent">Legal</p>
          <h1 className="mt-3 font-display text-5xl md:text-6xl">Política de Privacidade</h1>
          <p className="mt-3 text-sm text-muted-foreground">Última atualização: 29 de maio de 2026</p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-3xl space-y-8 px-6 text-muted-foreground">
          <div>
            <h2 className="font-display text-2xl text-foreground tracking-wider">1. Quem somos</h2>
            <p className="mt-2">O HUB JPA é uma plataforma direcionada ao público de RPG, oferecendo consultorias, ferramentas e conteúdo para mestres e jogadores de RPG de mesa.</p>
          </div>
          <div>
            <h2 className="font-display text-2xl text-foreground tracking-wider">2. Dados que coletamos</h2>
            <p className="mt-2">Coletamos dados fornecidos por você (nome, e-mail, telefone) ao se cadastrar, contratar serviços ou entrar em contato, e dados de navegação (cookies, IP, páginas acessadas) para melhorar a experiência.</p>
          </div>
          <div>
            <h2 className="font-display text-2xl text-foreground tracking-wider">3. Como usamos seus dados</h2>
            <p className="mt-2">Utilizamos os dados para prestar nossos serviços, personalizar sua experiência, enviar comunicações relevantes e cumprir obrigações legais.</p>
          </div>
          <div>
            <h2 className="font-display text-2xl text-foreground tracking-wider">4. Compartilhamento</h2>
            <p className="mt-2">Não vendemos seus dados. Compartilhamos apenas com parceiros estritamente necessários à operação dos serviços e quando exigido por lei.</p>
          </div>
          <div>
            <h2 className="font-display text-2xl text-foreground tracking-wider">5. Seus direitos (LGPD)</h2>
            <p className="mt-2">Você pode solicitar acesso, correção, anonimização, portabilidade ou exclusão dos seus dados a qualquer momento pelo e-mail jparpg@gmail.com.</p>
          </div>
          <div>
            <h2 className="font-display text-2xl text-foreground tracking-wider">6. Cookies</h2>
            <p className="mt-2">Usamos cookies para autenticação, preferências e análise. Você pode gerenciá-los nas configurações do seu navegador.</p>
          </div>
          <div>
            <h2 className="font-display text-2xl text-foreground tracking-wider">7. Contato</h2>
            <p className="mt-2">Dúvidas sobre privacidade? Fale com a gente em jparpg@gmail.com.</p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
