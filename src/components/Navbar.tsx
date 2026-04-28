import { Link, useNavigate } from "@tanstack/react-router";
import { Activity, LogOut, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/api";

export function Navbar() {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="sticky top-0 z-50 glass"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] glow">
            <Activity className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="font-display text-xl font-semibold tracking-tight">
            Care<span className="text-gradient">Track</span>
          </span>
        </Link>

        {user && (
          <nav className="hidden items-center gap-6 md:flex">
            <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition" activeProps={{ className: "text-foreground font-medium" }}>Dashboard</Link>
            <Link to="/patients" className="text-sm text-muted-foreground hover:text-foreground transition" activeProps={{ className: "text-foreground font-medium" }}>Patients</Link>
            <Link to="/patients/new" className="text-sm text-muted-foreground hover:text-foreground transition" activeProps={{ className: "text-foreground font-medium" }}>Nouveau patient</Link>
            {isAdmin && (
              <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground transition flex items-center gap-1" activeProps={{ className: "text-foreground font-medium" }}>
                <Shield className="h-3.5 w-3.5" /> Admin
              </Link>
            )}
          </nav>
        )}

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="hidden sm:block text-right">
                <div className="text-sm font-medium leading-tight">{user.prenom} {user.nom}</div>
                <div className="text-[10px] text-muted-foreground font-mono uppercase">
                  {ROLE_LABELS[user.role]}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="rounded-lg glass px-3 py-2 text-sm transition hover:bg-secondary"
                aria-label="Déconnexion"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              Connexion
            </Link>
          )}
        </div>
      </div>
    </motion.header>
  );
}
