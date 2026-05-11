import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { api, type User, type Role, type Service, ROLE_LABELS } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Shield, UserCheck, UserPlus, X, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_app/admin")({ component: AdminPage });

const ROLES: Role[] = ["infirmier", "medecin", "administrateur", "direction"];

const emptyForm = {
  nom: "",
  prenom: "",
  email: "",
  password: "",
  role: "infirmier" as Role,
  service_id: "" as string | number,
};

function AdminPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  useEffect(() => {
    if (!isAdmin) {
      toast.error("Accès réservé aux administrateurs");
      navigate({ to: "/dashboard" });
    }
  }, [isAdmin, navigate]);

  const [users, setUsers] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  // ── Chargement ──────────────────────────────────────────────────────────────
  const loadUsers = async () => {
    try {
      const data = await api.get<User[]>("/users");
      setUsers(data);
    } catch {
      toast.error("Impossible de charger les utilisateurs");
    }
  };

  const loadServices = async () => {
    try {
      const data = await api.get<Service[]>("/services");
      setServices(data);
    } catch {
      // services optionnels
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    Promise.all([loadUsers(), loadServices()]).finally(() => setLoading(false));
  }, [isAdmin]);

  // ── Créer un utilisateur ────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.nom || !form.prenom || !form.email || !form.password) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/users", {
        ...form,
        service_id: form.service_id !== "" ? Number(form.service_id) : null,
      });
      toast.success("Utilisateur créé avec succès");
      setForm(emptyForm);
      setShowForm(false);
      loadUsers();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de la création");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Toggle actif ────────────────────────────────────────────────────────────
  const toggleActif = async (user: User) => {
    try {
      const res = await api.post<{ user: User; message: string }>(`/users/${user.id}/toggle-actif`);
      toast.success(res.message);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? res.user : u)));
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur lors du changement de statut");
    }
  };

  // ── Supprimer un utilisateur ────────────────────────────────────────────────
  const deleteUser = async (user: User) => {
    if (!confirm(`Supprimer ${user.prenom} ${user.nom} ?`)) return;
    try {
      await api.delete(`/users/${user.id}`);
      toast.success("Utilisateur supprimé");
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de la suppression");
    }
  };

  // ── Si pas admin ────────────────────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-muted-foreground">
        <ShieldAlert className="h-12 w-12 text-triage-orange" />
        <p className="text-lg font-medium">Accès réservé aux administrateurs</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        Chargement…
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="font-display text-2xl font-bold">Administration</h1>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition"
        >
          {showForm ? <X className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
          {showForm ? "Annuler" : "Nouvel utilisateur"}
        </button>
      </div>

      {/* Formulaire création */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="glass rounded-2xl p-6 space-y-4"
        >
          <h2 className="font-semibold text-lg">Créer un utilisateur</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(["nom", "prenom", "email"] as const).map((field) => (
              <div key={field}>
                <label className="mb-1.5 block text-sm font-medium capitalize">
                  {field === "email" ? "Email" : field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                <input
                  type={field === "email" ? "email" : "text"}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                  value={form[field]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                />
              </div>
            ))}

            <div>
              <label className="mb-1.5 block text-sm font-medium">Mot de passe</label>
              <input
                type="password"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Rôle</label>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>

            {services.length > 0 && (
              <div>
                <label className="mb-1.5 block text-sm font-medium">Service (optionnel)</label>
                <select
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                  value={form.service_id}
                  onChange={(e) => setForm({ ...form, service_id: e.target.value })}
                >
                  <option value="">— Aucun service —</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nom}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition"
            >
              {submitting ? "Création…" : "Créer l'utilisateur"}
            </button>
          </div>
        </motion.div>
      )}

      {/* Statistique rapide */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {ROLES.map((r) => {
          const count = users.filter((u) => u.role === r).length;
          return (
            <div key={r} className="glass rounded-2xl p-4 text-center">
              <div className="font-display text-3xl font-bold">{count}</div>
              <div className="text-xs text-muted-foreground mt-1">{ROLE_LABELS[r]}</div>
            </div>
          );
        })}
      </div>

      {/* Tableau des utilisateurs */}
      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Utilisateur</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Rôle</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b border-border/50 hover:bg-secondary/30 transition"
              >
                <td className="px-4 py-3 font-medium">
                  {user.prenom} {user.nom}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {ROLE_LABELS[user.role]}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{user.service?.nom ?? "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      user.actif ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        user.actif ? "bg-green-400" : "bg-red-400"
                      }`}
                    />
                    {user.actif ? "Actif" : "Désactivé"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => toggleActif(user)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition"
                      title={user.actif ? "Désactiver" : "Activer"}
                    >
                      <UserCheck className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteUser(user)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition"
                      title="Supprimer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  Aucun utilisateur trouvé
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
