import { Link, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  LogOut,
  Shield,
  BarChart3,
  Users,
  UserPlus,
  ClipboardList,
  Sun,
  Moon,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import { useTheme } from "@/lib/useTheme";
import { ROLE_LABELS } from "@/lib/api";

// ── Couleur & badge par rôle ──────────────────────────────────────────────────
const ROLE_CONFIG: Record<string, { color: string; badge: string }> = {
  direction: { color: "#f59e0b", badge: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  admin: { color: "#a855f7", badge: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  medecin: { color: "#22d3ee", badge: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" },
  infirmier: { color: "#4ade80", badge: "bg-green-500/15 text-green-400 border-green-500/30" },
  secretaire: { color: "#f472b6", badge: "bg-pink-500/15 text-pink-400 border-pink-500/30" },
};

// ── Liens par rôle ────────────────────────────────────────────────────────────
type NavLink = { to: string; label: string; icon: typeof Shield };

const NAV_LINKS: Record<string, NavLink[]> = {
  direction: [
    { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { to: "/patients", label: "Patients", icon: Users },
  ],
  admin: [
    { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { to: "/patients", label: "Patients", icon: Users },
    { to: "/patients/new", label: "Nouveau", icon: UserPlus },
    { to: "/admin", label: "Admin", icon: Shield },
  ],
  medecin: [
    { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { to: "/patients", label: "Patients", icon: Users },
    { to: "/patients/new", label: "Nouveau", icon: UserPlus },
  ],
  infirmier: [
    { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { to: "/patients", label: "Patients", icon: Users },
    { to: "/patients/new", label: "Nouveau", icon: UserPlus },
    { to: "/triage", label: "Triage", icon: ClipboardList },
  ],
  secretaire: [
    { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { to: "/patients", label: "Patients", icon: Users },
    { to: "/patients/new", label: "Nouveau", icon: UserPlus },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────

export function Navbar() {
  const { user, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const role = user?.role ?? "medecin";
  const config = ROLE_CONFIG[role] ?? ROLE_CONFIG.medecin;
  const links = NAV_LINKS[role] ?? NAV_LINKS.medecin;

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
      {/* Barre de couleur rôle */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, transparent, ${config.color}, transparent)` }}
      />

      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div
            className="relative flex h-9 w-9 items-center justify-center rounded-xl glow"
            style={{ background: `linear-gradient(135deg, ${config.color}cc, ${config.color}66)` }}
          >
            <Activity className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display text-xl font-semibold tracking-tight">
            Care<span className="text-gradient">Track</span>
          </span>
        </Link>

        {/* Nav links filtrés par rôle */}
        {user && (
          <nav className="hidden items-center gap-1 md:flex">
            {links.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition"
                activeProps={{ className: "text-foreground font-medium bg-secondary/70" }}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            ))}
          </nav>
        )}

        {/* Actions droite */}
        <div className="flex items-center gap-2">
          {/* Toggle thème */}
          <motion.button
            onClick={toggle}
            whileTap={{ scale: 0.88 }}
            whileHover={{ scale: 1.05 }}
            className="rounded-lg glass px-3 py-2 transition hover:bg-secondary/50"
            aria-label="Basculer le thème"
          >
            <motion.div
              key={theme}
              initial={{ rotate: -20, opacity: 0, scale: 0.8 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4" style={{ color: config.color }} />
              )}
            </motion.div>
          </motion.button>

          {user ? (
            <>
              {/* Infos utilisateur */}
              <div className="hidden sm:block text-right">
                <div className="text-sm font-medium leading-tight">
                  {user.prenom} {user.nom}
                </div>
                <div
                  className={`mt-0.5 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${config.badge}`}
                >
                  {ROLE_LABELS[user.role]}
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="rounded-lg glass px-3 py-2 text-sm transition hover:bg-secondary/50"
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
