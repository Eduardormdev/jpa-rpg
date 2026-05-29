import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

const KEY = "jpa-privacy-consent-v1";

export function PrivacyConsent() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(KEY)) setOpen(true);
  }, []);

  const decide = (value: "accepted" | "rejected") => {
    localStorage.setItem(KEY, value);
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6">
      <div className="mx-auto max-w-3xl rounded-xl border border-border bg-card/95 backdrop-blur p-5 shadow-glow">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Usamos cookies e dados para melhorar sua experiência no HUB JPA. Ao continuar, você concorda com nossa{" "}
            <Link to="/politica-de-privacidade" className="text-accent hover:underline">
              Política de Privacidade
            </Link>.
          </p>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => decide("rejected")} className="rounded-md border border-border px-4 py-2 text-sm font-display tracking-widest hover:bg-secondary transition-colors">
              Recusar
            </button>
            <button onClick={() => decide("accepted")} className="rounded-md bg-accent-gradient px-4 py-2 text-sm font-display tracking-widest text-primary-foreground shadow-glow hover:opacity-90 transition-opacity">
              Aceitar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
