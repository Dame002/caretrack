import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-primary pulse-dot" style={{ color: "var(--primary)" }} />
          Chargement...
        </div>
      </div>
    );
  }

  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return null;
  }

  if (!user.actif) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="mx-auto max-w-2xl px-6 py-20 text-center">
          <ShieldAlert className="mx-auto h-12 w-12 text-[var(--triage-orange)]" />
          <h1 className="mt-6 font-display text-3xl font-bold">Compte désactivé</h1>
          <p className="mt-3 text-muted-foreground">
            Votre compte n'est pas actif. Contactez un administrateur pour le réactiver.
          </p>
          <Link
            to="/"
            className="mt-8 inline-flex rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition"
          >
            Retour à l'accueil
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none -z-10" />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}
