import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Youtube } from "lucide-react";
import logoNome from "@/assets/brand-logo-nome.png";

export function SiteFooter() {
  return (
    <footer className="bg-panel border-t border-border">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-3">
        <div>
          <img src={logoNome} alt="JPA" className="h-24 w-auto" />
          <p className="mt-3 text-sm text-muted-foreground max-w-xs">
            O HUB definitivo para mestres e jogadores de RPG de mesa.
          </p>
          <div className="mt-5 flex items-center gap-3">
            {[Facebook, Instagram, Youtube].map((Icon, i) => (
              <a key={i} href="#" aria-label="social" className="grid h-9 w-9 place-items-center rounded-full bg-secondary hover:bg-accent-gradient transition-colors">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-display text-lg tracking-widest text-accent">Institucional</h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link to="/sobre" className="hover:text-accent">Sobre a JPA</Link></li>
            <li><Link to="/novidades" className="hover:text-accent">Novidades</Link></li>
            <li><Link to="/trabalhe-conosco" className="hover:text-accent">Trabalhe Conosco</Link></li>
            <li><Link to="/contato" className="hover:text-accent">Contato</Link></li>
            <li><Link to="/politica-de-privacidade" className="hover:text-accent">Política de Privacidade</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-lg tracking-widest text-accent">Contato</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>Franca - SP</li>
            <li>Av. Santa Cruz, 3255</li>
            <li>jparpg@gmail.com</li>
            <li>(16) 99341-2323</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © 2026 JPA. Todos os direitos reservados.
      </div>
    </footer>
  );
}
