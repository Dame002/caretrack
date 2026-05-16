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
  Menu,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/useTheme";
import { ROLE_LABELS } from "@/lib/api";

// ── Couleur & badge par rôle ──────────────────────────────────────────────────
const ROLE_CONFIG: Record<string, { color: string; badge: string }> = {
  direction: { color: "#f59e0b", badge: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  administrateur: {
    color: "#a855f7",
    badge: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  },
  medecin: { color: "#22d3ee", badge: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" },
  infirmier: { color: "#4ade80", badge: "bg-green-500/15 text-green-400 border-green-500/30" },
};

// ── Liens par rôle ────────────────────────────────────────────────────────────
type NavLink = { to: string; label: string; icon: typeof Shield };

const NAV_LINKS: Record<string, NavLink[]> = {
  direction: [
    { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { to: "/patients", label: "Patients", icon: Users },
  ],
  administrateur: [
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
};

// ─────────────────────────────────────────────────────────────────────────────

export function Navbar() {
  const { user, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  // Fermer le drawer si on passe en desktop
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) setMobileOpen(false);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Bloquer le scroll du body quand le drawer est ouvert
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const role = user?.role ?? "medecin";
  const config = ROLE_CONFIG[role] ?? ROLE_CONFIG.medecin;
  const links = NAV_LINKS[role] ?? NAV_LINKS.medecin;

  const handleLogout = async () => {
    setMobileOpen(false);
    await signOut();
    navigate({ to: "/" });
  };

  const handleNavClick = () => setMobileOpen(false);

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="sticky top-0 z-50 glass"
      >
        {/* Barre de couleur rôle */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background: `linear-gradient(90deg, transparent, ${config.color}, transparent)`,
          }}
        />

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div
              className="relative flex h-9 w-9 items-center justify-center rounded-xl glow"
              style={{
                background: `linear-gradient(135deg, ${config.color}cc, ${config.color}66)`,
              }}
            >
              <Activity className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display text-xl font-semibold tracking-tight">
              Care<span className="text-gradient">Track</span>
            </span>
          </Link>

          {/* Nav links — desktop uniquement */}
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
              {mounted ? (
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
              ) : (
                <Sun className="h-4 w-4 text-amber-400" />
              )}
            </motion.button>

            {/* Infos user — desktop */}
            {user && (
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
            )}

            {/* Logout — desktop */}
            {user && (
              <button
                onClick={handleLogout}
                className="hidden sm:flex rounded-lg glass px-3 py-2 text-sm transition hover:bg-secondary/50"
                aria-label="Déconnexion"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}

            {/* Connexion si non authentifié */}
            {!user && (
              <Link
                to="/login"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              >
                Connexion
              </Link>
            )}

            {/* Hamburger — mobile uniquement */}
            {user && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setMobileOpen((v) => !v)}
                className="flex md:hidden rounded-lg glass px-2.5 py-2 transition hover:bg-secondary/50"
                aria-label="Menu"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={mobileOpen ? "close" : "open"}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                  </motion.div>
                </AnimatePresence>
              </motion.button>
            )}
          </div>
        </div>
      </motion.header>

      {/* ── Drawer mobile ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />

            {/* Panneau */}
            <motion.div
              key="drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-72 glass flex flex-col md:hidden"
              style={{
                borderLeft: `1px solid color-mix(in oklab, ${config.color} 20%, transparent)`,
              }}
            >
              {/* Ligne couleur rôle */}
              <div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{ background: `linear-gradient(90deg, transparent, ${config.color})` }}
              />

              {/* Header drawer */}
              <div className="flex items-center justify-between px-5 pt-6 pb-4 border-b border-border">
                <div>
                  <div className="text-sm font-semibold">
                    {user?.prenom} {user?.nom}
                  </div>
                  <div
                    className={`mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${config.badge}`}
                  >
                    {ROLE_LABELS[user!.role]}
                  </div>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg glass p-2 hover:bg-secondary/50 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Liens nav */}
              <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                {links.map(({ to, label, icon: Icon }, i) => (
                  <motion.div
                    key={to}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.05 }}
                  >
                    <Link
                      to={to}
                      onClick={handleNavClick}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition"
                      activeProps={{
                        className: "text-foreground font-medium bg-secondary/70",
                        style: { color: config.color },
                      }}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {label}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              {/* Footer drawer — logout */}
              <div className="px-3 py-4 border-t border-border">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  Déconnexion
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
