import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Lock, Mail, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { EkgLine } from "@/components/EkgLine";
import { useAuth } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({ component: LoginPage });

const ROLE_CONFIG: Record<string, { color: string; label: string }> = {
  direction: { color: "#f59e0b", label: "Direction" },
  medecin: { color: "#22d3ee", label: "Médecin" },
  infirmier: { color: "#4ade80", label: "Infirmier" },
  administrateur: { color: "#a855f7", label: "Administrateur" },
};

interface DemoAccount {
  nom: string;
  prenom: string;
  email: string;
  role: string;
}

function LoginPage() {
  const navigate = useNavigate();
  const { user, signIn, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([]);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  // Fetch des comptes démo depuis le backend
  useEffect(() => {
    fetch(`${API_BASE_URL}/auth/demo-accounts`, {
      headers: { Accept: "application/json" },
    })
      .then((r) => r.json())
      .then((data: DemoAccount[]) => setDemoAccounts(data))
      .catch(() => {}); // silencieux si le backend est down
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await signIn(email, password);
    setBusy(false);
    if (error) toast.error(error);
    else {
      toast.success("Connexion réussie");
      navigate({ to: "/dashboard" });
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-10">
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
      <div className="absolute bottom-0 left-0 right-0 h-40 opacity-50">
        <EkgLine className="w-full h-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] glow">
            <Activity className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="font-display text-2xl font-semibold">
            Care<span className="text-gradient">Track</span>
          </span>
        </Link>

        <div className="glass rounded-2xl p-8">
          <h1 className="font-display text-2xl font-bold">Bon retour</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Accédez à votre espace soignant. Les comptes sont gérés par l'administrateur.
          </p>

          {/* Comptes démo */}
          {demoAccounts.length > 0 && (
            <div className="mt-5">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
                Connexion rapide — démo
              </p>
              <div className="grid grid-cols-2 gap-2">
                {demoAccounts.map((account) => {
                  const cfg = ROLE_CONFIG[account.role] ?? { color: "#888", label: account.role };
                  const isActive = activeDemo === account.role;
                  return (
                    <motion.button
                      key={account.role}
                      type="button"
                      whileTap={{ scale: 0.96 }}
                      onClick={() => {
                        setEmail(account.email);
                        setPassword("password");
                        setActiveDemo(account.role);
                      }}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs transition ${
                        isActive
                          ? "border-current bg-current/10"
                          : "border-border bg-secondary/30 hover:bg-secondary/60"
                      }`}
                      style={isActive ? { color: cfg.color, borderColor: cfg.color } : {}}
                    >
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ background: cfg.color }}
                      />
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{cfg.label}</div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          {account.prenom} {account.nom}
                        </div>
                      </div>
                      {isActive && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="ml-auto shrink-0 text-[10px] font-mono"
                        >
                          ✓
                        </motion.span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Séparateur */}
          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              ou saisir manuellement
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Email" icon={Mail}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setActiveDemo(null);
                }}
                placeholder="vous@hopital.sn"
                className="w-full bg-transparent pl-10 pr-4 py-3 text-sm focus:outline-none"
              />
            </Field>

            <Field label="Mot de passe" icon={Lock}>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setActiveDemo(null);
                }}
                placeholder="••••••••"
                className="w-full bg-transparent pl-10 pr-4 py-3 text-sm focus:outline-none"
              />
            </Field>

            <AnimatePresence>
              {activeDemo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <p className="text-xs text-muted-foreground font-mono bg-secondary/40 rounded-lg px-3 py-2">
                    Compte{" "}
                    <span className="text-foreground font-semibold">
                      {ROLE_CONFIG[activeDemo]?.label ?? activeDemo}
                    </span>{" "}
                    sélectionné — cliquez sur Se connecter
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-primary text-primary-foreground py-3.5 font-medium hover:opacity-90 transition glow flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {busy ? (
                "Connexion en cours…"
              ) : (
                <>
                  Se connecter <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-5 border-t border-border flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">
              © {new Date().getFullYear()} CareTrack
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              Système de gestion des urgences
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </label>
      <div className="mt-1.5 relative rounded-lg bg-input border border-border focus-within:ring-2 focus-within:ring-primary transition">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        {children}
      </div>
    </div>
  );
}
