import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Users,
  Activity,
  Settings,
  Plus,
  ChevronRight,
  RefreshCw,
  UserCheck,
  Cpu,
  ArrowRight,
  Database,
} from "lucide-react";
import { api, type DashboardStats, type Patient } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

const BLUE = "#3b82f6";
const CYAN = "#22d3ee";
const PURPLE = "#a855f7";
const GREEN = "#4ade80";

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  delay,
}: {
  icon: typeof Activity;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45 }}
      className="glass relative rounded-2xl p-5 overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: color }} />
      <div
        className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full opacity-10 blur-2xl"
        style={{ background: color }}
      />
      <div
        className="flex h-9 w-9 items-center justify-center rounded-xl mb-4"
        style={{ backgroundColor: `${color}18`, border: `1px solid ${color}44` }}
      >
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <motion.div
        key={String(value)}
        initial={{ opacity: 0.4, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="font-mono text-3xl font-bold leading-none"
        style={{ color }}
      >
        {value}
      </motion.div>
      <div className="mt-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </div>
      {sub && <div className="mt-0.5 text-[10px] text-muted-foreground/60 font-mono">{sub}</div>}
    </motion.div>
  );
}

export function DashboardAdmin() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = async () => {
    try {
      const [s, p] = await Promise.all([
        api.get<DashboardStats>("/dashboard/stats"),
        api.get<{ data: Patient[] }>("/patients?per_page=8&sort=created_at&order=desc"),
      ]);
      setStats(s);
      setPatients(p.data ?? []);
      setLastRefresh(new Date());
    } catch {
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Database className="h-4 w-4 animate-pulse" style={{ color: BLUE }} />
          <span className="font-mono text-sm">Chargement…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: BLUE }} />
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              Administration
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Bonjour, <span style={{ color: BLUE }}>{user?.prenom ?? "Admin"}</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground font-mono">
            {new Date().toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
            {" · MAJ "}
            {lastRefresh.toLocaleTimeString("fr-FR")}
          </p>
        </motion.div>
        <div className="flex gap-2">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            onClick={load}
            className="flex items-center gap-2 glass rounded-xl px-3.5 py-2 text-sm text-muted-foreground hover:text-foreground transition"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </motion.button>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
          >
            <Link
              to="/patients/new"
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition glow"
              style={{ backgroundColor: BLUE }}
            >
              <Plus className="h-4 w-4" />
              Enregistrer
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Passages aujourd'hui"
          value={stats?.patients_aujourdhui ?? 0}
          sub="dossiers ouverts"
          color={BLUE}
          delay={0.05}
        />
        <StatCard
          icon={Activity}
          label="En consultation"
          value={stats?.en_consultation ?? 0}
          sub="boxes actifs"
          color={PURPLE}
          delay={0.1}
        />
        <StatCard
          icon={UserCheck}
          label="Sortis aujourd'hui"
          value={stats?.sortis_aujourdhui ?? 0}
          sub="depuis 00h00"
          color={GREEN}
          delay={0.15}
        />
        <StatCard
          icon={Cpu}
          label="En attente triage"
          value={stats?.en_attente_triage ?? 0}
          sub="file active"
          color={CYAN}
          delay={0.2}
        />
      </div>

      {/* Corps */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Patients récents */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="lg:col-span-2 glass rounded-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5" style={{ color: BLUE }} />
              <span className="text-sm font-semibold text-foreground">
                Derniers patients enregistrés
              </span>
            </div>
            <Link
              to="/patients"
              className="text-[11px] font-mono text-muted-foreground hover:text-foreground transition flex items-center gap-1"
            >
              Voir tout <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {patients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <Users className="h-8 w-8 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground font-mono">Aucun patient enregistré</p>
              </div>
            ) : (
              patients.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    to="/patients/$patientId"
                    params={{ patientId: String(p.id) }}
                    className="group flex items-center gap-4 px-5 py-3 hover:bg-secondary/30 transition"
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-sm"
                      style={{
                        backgroundColor: `${BLUE}18`,
                        color: BLUE,
                        border: `1px solid ${BLUE}33`,
                      }}
                    >
                      {p.prenom?.[0]}
                      {p.nom?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-foreground">
                        {p.prenom} {p.nom}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                        {p.telephone ?? "—"} ·{" "}
                        {p.date_naissance
                          ? new Date(p.date_naissance).toLocaleDateString("fr-FR")
                          : "—"}
                      </div>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition" />
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Actions rapides */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-2xl p-4"
          >
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Gestion
            </div>
            <div className="space-y-2">
              {[
                { to: "/patients/new", icon: Plus, label: "Nouveau patient", color: BLUE },
                { to: "/patients", icon: Users, label: "Liste patients", color: CYAN },
                { to: "/admin", icon: Settings, label: "Administration", color: PURPLE },
              ].map(({ to, icon: Icon, label, color }) => (
                <Link
                  key={to}
                  to={to}
                  className="group flex items-center gap-3 rounded-xl border border-border bg-secondary/20 px-3.5 py-2.5 transition hover:bg-secondary/50"
                >
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${color}18`, border: `1px solid ${color}33` }}
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color }} />
                  </div>
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition">
                    {label}
                  </span>
                  <ChevronRight className="ml-auto h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground transition" />
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Répartition triage */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="glass rounded-2xl p-4"
          >
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Triage du jour
            </div>
            <div className="space-y-2.5">
              {(
                [
                  ["rouge", "var(--triage-red)"],
                  ["orange", "var(--triage-orange)"],
                  ["jaune", "var(--triage-yellow)"],
                  ["vert", "var(--triage-green)"],
                ] as const
              ).map(([c, col]) => {
                const count = stats?.par_couleur?.find((x) => x.triage_couleur === c)?.total ?? 0;
                const total = Math.max(
                  stats?.par_couleur?.reduce((s, x) => s + x.total, 0) ?? 1,
                  1,
                );
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={c}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: col }} />
                        <span className="text-[11px] font-mono text-muted-foreground capitalize">
                          {c}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono font-bold" style={{ color: col }}>
                        {count}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary/50 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: col }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
