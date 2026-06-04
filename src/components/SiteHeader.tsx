import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import logo from "@/assets/brand-logo.png";

export function SiteHeader() {
  return (
    <header className="absolute top-0 left-0 right-0 z-20">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-3 group">
          <img src={logo} alt="JPA" className="h-12 w-12 object-contain group-hover:scale-110 transition-transform drop-shadow-[0_0_12px_hsl(var(--accent)/0.6)]" />
          <span className="font-display text-2xl tracking-widest">JPA <span className="text-accent">— RPG</span></span>
        </Link>
        <nav className="hidden md:flex items-center gap-7 font-display text-sm tracking-widest">
          <Link to="/" className="hover:text-accent transition-colors">Início</Link>
          <Link to="/novidades" className="hover:text-accent transition-colors">Novidades</Link>
          <Link to="/nossas-historias" className="hover:text-accent transition-colors">Histórias</Link>
          <Link to="/sobre" className="hover:text-accent transition-colors">Sobre</Link>
          <Link to="/contato" className="hover:text-accent transition-colors">Contato</Link>
          <Link to="/trabalhe-conosco" className="hover:text-accent transition-colors">Trabalhe</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            to="/doe"
            className="hidden md:inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-purple-600 to-fuchsia-500 px-4 py-2 font-display tracking-widest text-sm text-white shadow-[0_0_18px_rgba(168,85,247,0.55)] hover:opacity-90 transition-opacity animate-pulse"
          >
            <Heart className="h-4 w-4 fill-current" /> Nos torne real
          </Link>
          <Link to="/login" className="hidden sm:inline-flex rounded-md border border-border px-4 py-2 font-display tracking-widest text-sm hover:bg-secondary transition-colors">
            Cadastrar
          </Link>
          <Link to="/login" className="inline-flex rounded-md bg-accent-gradient px-4 py-2 font-display tracking-widest text-sm text-primary-foreground shadow-glow hover:opacity-90 transition-opacity">
            Entrar
          </Link>
        </div>
      </div>
    </header>
  );
}
