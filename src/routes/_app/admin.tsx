import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { api, type User, type Role, ROLE_LABELS } from "@/lib/api";
import { toast } from "sonner";
import { Shield, UserCheck, UserPlus, X } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app/admin")({ component: AdminPage });

const ALL_ROLES: Role[] = ["administrateur", "medecin", "infirmier", "direction"];

function AdminPage() {
  const { isAdmin, loading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ nom: "", prenom: "", email: "", password: "", role: "infirmier" as Role });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const list = await api.get<User[]>("/users");
      setUsers(list);
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur");
    }
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  if (loading) return <div className="text-muted-foreground">Chargement...</div>;
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <Shield className="mx-auto h-12 w-12 text-[var(--triage-orange)]" />
        <h1 className="mt-6 font-display text-2xl font-bold">Accès refusé</h1>
        <p className="mt-2 text-sm text-muted-foreground">Cette page est réservée aux administrateurs.</p>
      </div>
    );
  }

  const updateRole = async (u: User, role: Role) => {
    try {
      await api.put(`/users/${u.id}`, { role });
      toast.success("Rôle modifié");
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur");
    }
  };

  const toggleActif = async (u: User) => {
    try {
      await api.put(`/users/${u.id}`, { actif: !u.actif });
      toast.success(u.actif ? "Compte désactivé" : "Compte activé");
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur");
    }
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/users", form);
      toast.success("Utilisateur créé");
      setShowCreate(false);
      setForm({ nom: "", prenom: "", email: "", password: "", role: "infirmier" });
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur");
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="font-mono text-xs text-primary uppercase tracking-widest flex items-center gap-2">
            <Shield className="h-3 w-3" /> Administration
          </div>
          <h1 className="mt-2 font-display text-4xl font-bold">Gestion des comptes</h1>
          <p className="mt-1 text-muted-foreground text-sm">{users.length} utilisateurs</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-xl bg-primary text-primary-foreground px-5 py-3 font-medium hover:opacity-90 transition glow flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" /> Créer un compte
        </button>
      </div>

      {showCreate && (
        <motion.form
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={createUser}
          className="mt-6 glass rounded-2xl p-6 relative"
        >
          <button type="button" onClick={() => setShowCreate(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
          <h2 className="font-display text-xl font-semibold mb-4">Nouvel utilisateur</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label="Prénom" value={form.prenom} onChange={(v) => setForm({ ...form, prenom: v })} required />
            <Input label="Nom" value={form.nom} onChange={(v) => setForm({ ...form, nom: v })} required />
            <Input label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
            <Input label="Mot de passe" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} required />
            <div className="md:col-span-2">
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Rôle</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                className="mt-1.5 w-full rounded-lg bg-input border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {ALL_ROLES.map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="mt-4 w-full rounded-lg bg-primary text-primary-foreground py-3 font-medium hover:opacity-90 transition disabled:opacity-60"
          >
            {busy ? "Création..." : "Créer le compte"}
          </button>
        </motion.form>
      )}

      <div className="mt-8 space-y-3">
        {users.map((u, i) => (
          <motion.div
            key={u.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="glass rounded-2xl p-5"
          >
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-display font-bold">
                  {(u.prenom[0] + u.nom[0]).toUpperCase()}
                </div>
                <div>
                  <div className="font-display font-semibold">{u.prenom} {u.nom}</div>
                  <div className="text-xs text-muted-foreground font-mono">{u.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={u.role}
                  onChange={(e) => updateRole(u, e.target.value as Role)}
                  className="text-xs rounded-lg bg-input border border-border px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {ALL_ROLES.map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
                <button
                  onClick={() => toggleActif(u)}
                  className="text-xs rounded-full px-3 py-1.5 font-medium flex items-center gap-1 border border-border hover:bg-secondary transition"
                  style={{
                    background: u.actif
                      ? "color-mix(in oklab, var(--triage-green) 15%, transparent)"
                      : "color-mix(in oklab, var(--triage-orange) 15%, transparent)",
                    color: u.actif ? "var(--triage-green)" : "var(--triage-orange)",
                  }}
                >
                  <UserCheck className="h-3 w-3" /> {u.actif ? "Actif" : "Désactivé"}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function Input({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-muted-foreground">{label}{required && " *"}</label>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-lg bg-input border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );
}
