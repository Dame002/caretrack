import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Stethoscope,
  Users,
  Clock,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  Activity,
  FileText,
  ArrowRight,
} from "lucide-react";
import { api, type Passage, type DashboardStats, STATUT_LABELS } from "@/lib/api";
import { EkgLine } from "@/components/EkgLine";
import { minutesSince } from "@/lib/triage";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

const TC: Record<string, string> = {
  rouge: "var(--triage-red)",
  orange: "var(--triage-orange)",
  jaune: "var(--triage-yellow)",
  vert: "var(--triage-green)",
};
const PURPLE = "#a855f7";
const CYAN = "#22d3ee";
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
        className="flex h-9 w-9 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${color}18`, border: `1px solid ${color}44` }}
      >
        <Icon className="h-4 w-4" style={{ color }} />
      </div>
      <div className="mt-4">
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
      </div>
    </motion.div>
  );
}

function PatientCard({
  p,
  onSelect,
  index,
}: {
  p: Passage;
  onSelect: (id: number) => void;
  index: number;
}) {
  const col = TC[p.triage_couleur ?? "vert"] ?? TC.vert;
  const mins = minutesSince(p.created_at);

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      whileHover={{ y: -2, boxShadow: `0 8px 32px ${col}18` }}
      onClick={() => onSelect(p.id)}
      className="w-full rounded-2xl border border-border bg-secondary/20 p-4 text-left transition hover:bg-secondary/40"
    >
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl font-bold text-sm"
            style={{ backgroundColor: `${col}18`, color: col, border: `1px solid ${col}33` }}
          >
            {p.patient?.prenom?.[0]}
            {p.patient?.nom?.[0]}
          </div>
          <div
            className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background"
            style={{ backgroundColor: col }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-foreground">
            {p.patient?.prenom} {p.patient?.nom}
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <span
              className="text-[10px] font-mono px-1.5 py-0.5 rounded-md"
              style={{ backgroundColor: `${col}18`, color: col }}
            >
              {p.triage_couleur ?? "—"}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              {STATUT_LABELS[p.statut] ?? p.statut}
            </span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-xs font-mono text-muted-foreground">{mins} min</div>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 mt-1 ml-auto" />
        </div>
      </div>
    </motion.button>
  );
}

export function DashboardMedecin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [consults, setConsults] = useState<Passage[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = async () => {
    try {
      const [s, c] = await Promise.all([
        api.get<DashboardStats>("/dashboard/stats"),
        api.get<Passage[]>("/consultations/file-attente"),
      ]);
      setStats(s);
      setConsults(c);
      setLastRefresh(new Date());
    } catch {
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  const toVisit = (id: number) =>
    navigate({ to: "/visits/$visitId", params: { visitId: String(id) } });

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Stethoscope className="h-4 w-4 animate-pulse" style={{ color: PURPLE }} />
          <span className="font-mono text-sm">Chargement du tableau de bord…</span>
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
            <div
              className="h-2 w-2 rounded-full animate-pulse"
              style={{ backgroundColor: PURPLE }}
            />
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              Espace médecin
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Dr. <span style={{ color: PURPLE }}>{user?.nom ?? "—"}</span>
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
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          onClick={load}
          className="flex items-center gap-2 glass rounded-xl px-3.5 py-2 text-sm text-muted-foreground hover:text-foreground transition"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </motion.button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Stethoscope}
          label="En consultation"
          value={stats?.en_consultation ?? consults.length}
          sub="patients actifs"
          color={PURPLE}
          delay={0.05}
        />
        <StatCard
          icon={Users}
          label="Passages aujourd'hui"
          value={stats?.patients_aujourdhui ?? 0}
          sub="total journée"
          color={CYAN}
          delay={0.1}
        />
        <StatCard
          icon={CheckCircle2}
          label="Sortis aujourd'hui"
          value={stats?.sortis_aujourdhui ?? 0}
          sub="consultations clôturées"
          color={GREEN}
          delay={0.15}
        />
        <StatCard
          icon={Clock}
          label="En attente"
          value={stats?.en_attente_triage ?? 0}
          sub="file triage"
          color="var(--triage-orange)"
          delay={0.2}
        />
      </div>

      {/* Corps */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Mes patients */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="lg:col-span-2 glass rounded-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <div
                className="h-2 w-2 rounded-full animate-pulse"
                style={{ backgroundColor: PURPLE }}
              />
              <span className="text-sm font-semibold text-foreground">Consultations en cours</span>
              {consults.length > 0 && (
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-mono border"
                  style={{
                    backgroundColor: `${PURPLE}22`,
                    borderColor: `${PURPLE}44`,
                    color: PURPLE,
                  }}
                >
                  {consults.length}
                </span>
              )}
            </div>
          </div>

          <div className="h-6 border-b border-border/40 opacity-20">
            <EkgLine className="w-full h-full" />
          </div>

          <div className="p-4 space-y-2.5 max-h-96 overflow-y-auto">
            <AnimatePresence>
              {consults.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-14 text-center"
                >
                  <Stethoscope className="h-8 w-8 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground font-mono">
                    Aucune consultation active
                  </p>
                </motion.div>
              ) : (
                consults.map((p, i) => (
                  <PatientCard key={p.id} p={p} onSelect={toVisit} index={i} />
                ))
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Panel droit */}
        <div className="space-y-4">
          {/* Statuts */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-2xl p-4"
          >
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Répartition statuts
            </div>
            <div className="space-y-2.5">
              {[
                { label: "En cours", value: stats?.en_consultation ?? 0, color: PURPLE },
                {
                  label: "En attente",
                  value: stats?.en_attente_triage ?? 0,
                  color: "var(--triage-orange)",
                },
                { label: "Sortis", value: stats?.sortis_aujourdhui ?? 0, color: GREEN },
              ].map(({ label, value, color }) => {
                const total = stats?.patients_aujourdhui ?? 1;
                const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                return (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-mono text-muted-foreground">{label}</span>
                      <span className="text-[11px] font-mono font-bold" style={{ color }}>
                        {value}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary/50 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Accès rapides */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="glass rounded-2xl p-4"
          >
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Accès rapides
            </div>
            <div className="space-y-2">
              {[
                { to: "/patients", icon: Users, label: "Tous les patients", color: CYAN },
                { to: "/patients/new", icon: FileText, label: "Nouveau dossier", color: PURPLE },
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
                  <ArrowRight className="ml-auto h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground transition" />
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
