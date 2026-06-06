import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, User as UserIcon, LogOut, Shield, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import logo from "@/assets/brand-logo.png";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

type SessionInfo = {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  isAdmin: boolean;
};

export function SiteHeader() {
  const [user, setUser] = useState<SessionInfo | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function hydrate(session: Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]) {
      if (!session) { setUser(null); return; }
      const u = session.user;
      const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", u.id);
      const isAdmin = roles?.some((r) => r.role === "admin") ?? false;
      setUser({
        id: u.id,
        email: u.email ?? "",
        name: (meta.name as string) || (meta.full_name as string) || (u.email ?? "Aventureiro").split("@")[0],
        avatar: (meta.avatar_url as string) ?? null,
        isAdmin,
      });
    }
    supabase.auth.getSession().then(({ data }) => hydrate(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => hydrate(session));
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Sessão encerrada.");
    navigate({ to: "/" });
  }

  const initials = (user?.name ?? "JPA").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

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

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="group inline-flex items-center gap-2 rounded-full border border-border bg-card/60 backdrop-blur pl-1.5 pr-3 py-1.5 hover:bg-card transition-colors focus:outline-none focus:ring-2 focus:ring-accent">
                <Avatar className="h-8 w-8 ring-2 ring-accent/40">
                  {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                  <AvatarFallback className="bg-accent-gradient text-primary-foreground text-xs font-display tracking-widest">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline font-display text-sm tracking-widest max-w-[120px] truncate">{user.name}</span>
                {user.isAdmin && <Shield className="hidden sm:block h-3.5 w-3.5 text-accent" />}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>
                  <div className="font-display tracking-widest text-sm">{user.name}</div>
                  <div className="text-xs text-muted-foreground truncate font-normal">{user.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/conta" className="cursor-pointer">
                    <UserIcon className="mr-2 h-4 w-4" /> Minha conta
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/novidades" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" /> Minhas preferências
                  </Link>
                </DropdownMenuItem>
                {user.isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs text-accent font-display tracking-widest">ADMIN</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="cursor-pointer">
                        <Shield className="mr-2 h-4 w-4" /> Painel admin
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link to="/login" className="hidden sm:inline-flex rounded-md border border-border px-4 py-2 font-display tracking-widest text-sm hover:bg-secondary transition-colors">
                Cadastrar
              </Link>
              <Link to="/login" className="inline-flex rounded-md bg-accent-gradient px-4 py-2 font-display tracking-widest text-sm text-primary-foreground shadow-glow hover:opacity-90 transition-opacity">
                Entrar
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
