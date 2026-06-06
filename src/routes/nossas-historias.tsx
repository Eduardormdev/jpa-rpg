import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/nossas-historias")({
  ssr: false,
  component: () => <Outlet />,
});
