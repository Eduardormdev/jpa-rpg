import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function WhatsAppButton() {
  const [number, setNumber] = useState("");
  const [message, setMessage] = useState("Olá! Vim pelo site HUB JPA.");

  useEffect(() => {
    supabase.from("site_settings").select("whatsapp_number, whatsapp_message").eq("id", 1).maybeSingle().then(({ data }) => {
      if (data?.whatsapp_number) setNumber(data.whatsapp_number);
      if (data?.whatsapp_message) setMessage(data.whatsapp_message);
    });
  }, []);

  if (!number) return null;
  const clean = number.replace(/\D/g, "");
  const href = `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Fale conosco no WhatsApp"
      className="fixed bottom-6 right-6 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_0_24px_rgba(37,211,102,0.6)] hover:scale-110 transition-transform"
    >
      <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current" aria-hidden="true">
        <path d="M20.52 3.48A11.93 11.93 0 0012.04 0C5.46 0 .12 5.34.12 11.92c0 2.1.55 4.15 1.6 5.96L0 24l6.27-1.64a11.9 11.9 0 005.77 1.47h.01c6.58 0 11.92-5.34 11.92-11.92 0-3.18-1.24-6.17-3.45-8.43zM12.05 21.8h-.01a9.87 9.87 0 01-5.03-1.38l-.36-.21-3.72.97 1-3.62-.24-.37a9.86 9.86 0 01-1.51-5.27c0-5.46 4.45-9.91 9.92-9.91 2.65 0 5.14 1.03 7.01 2.91a9.83 9.83 0 012.9 7.01c0 5.46-4.45 9.91-9.96 9.91zm5.44-7.42c-.3-.15-1.76-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.67-2.07-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.8.37-.27.3-1.05 1.02-1.05 2.49 0 1.47 1.07 2.89 1.22 3.09.15.2 2.11 3.22 5.11 4.52.71.31 1.27.49 1.7.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35z"/>
      </svg>
    </a>
  );
}
