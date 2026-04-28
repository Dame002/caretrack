import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Activity, Lock, Mail, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { EkgLine } from "@/components/EkgLine";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const navigate = useNavigate();
  const { user, signIn, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

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
            Accédez à votre espace soignant. Les comptes sont créés par l'administrateur.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Field label="Email" icon={Mail}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 caractères"
                className="w-full bg-transparent pl-10 pr-4 py-3 text-sm focus:outline-none"
              />
            </Field>

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-primary text-primary-foreground py-3.5 font-medium hover:opacity-90 transition glow flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {busy ? "Patientez..." : (<>Se connecter <ArrowRight className="h-4 w-4" /></>)}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-xs text-muted-foreground text-center font-mono">
            Sanctum · Bearer token · Laravel API
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Field({ label, icon: Icon, children }: { label: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      <div className="mt-1.5 relative rounded-lg bg-input border border-border focus-within:ring-2 focus-within:ring-primary transition">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        {children}
      </div>
    </div>
  );
}
