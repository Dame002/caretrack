import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  Users,
  Clock,
  ChevronRight,
  Plus,
  RefreshCw,
  Cpu,
  Zap,
  Heart,
} from "lucide-react";
import { api, type Passage, type DashboardStats } from "@/lib/api";
import { EkgLine } from "@/components/EkgLine";
import { minutesSince, TRIAGE } from "@/lib/triage";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

const TC: Record<string, string> = {
  rouge: "var(--triage-red)",
  orange: "var(--triage-orange)",
  jaune: "var(--triage-yellow)",
  vert: "var(--triage-green)",
};
const CYAN = "#22d3ee";

function PulseRing({ color }: { color: string }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <motion.span
        className="absolute inline-flex h-full w-full rounded-full opacity-75"
        style={{ backgroundColor: color }}
        animate={{ scale: [1, 2], opacity: [0.7, 0] }}
        transition={{ duration: 1.2, repeat: Infinity }}
      />
      <span
        className="relative inline-flex h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  delay,
  alert,
}: {
  icon: typeof Activity;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  delay: number;
  alert?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45 }}
      className="glass relative rounded-2xl p-5 overflow-hidden"
      style={alert ? { boxShadow: `0 0 24px ${color}44` } : undefined}
    >
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: color }} />
      <div
        className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full opacity-10 blur-2xl"
        style={{ background: color }}
      />
      <div className="flex items-start justify-between">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${color}18`, border: `1px solid ${color}44` }}
        >
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        {alert && <PulseRing color={color} />}
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

function TriageRow({
  p,
  onSelect,
  index,
}: {
  p: Passage;
  onSelect: (id: number) => void;
  index: number;
}) {
  const mins = minutesSince(p.created_at);
  const cfg = TRIAGE[p.triage_couleur as keyof typeof TRIAGE];
  const over = cfg && mins > cfg.deadlineMin;
  const col = TC[p.triage_couleur ?? "vert"] ?? TC.vert;

  return (
    <motion.button
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ x: 4 }}
      onClick={() => onSelect(p.id)}
      className="w-full flex items-center gap-3 rounded-xl border border-border bg-secondary/20 px-4 py-3 text-left transition hover:bg-secondary/40"
      style={
        over ? { borderColor: `${TC.rouge}44`, boxShadow: `0 0 12px ${TC.rouge}22` } : undefined
      }
    >
      <div
        className="h-3 w-3 rounded-full shrink-0"
        style={{ backgroundColor: col, boxShadow: `0 0 8px ${col}` }}
      />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-foreground truncate">
          {p.patient?.prenom} {p.patient?.nom}
        </div>
        <div className="text-[10px] text-muted-foreground truncate font-mono mt-0.5">
          {p.triage?.symptomes ?? "—"}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-sm font-mono font-bold" style={{ color: over ? TC.rouge : col }}>
          {mins} min
        </div>
        {over && (
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 0.9, repeat: Infinity }}
            className="text-[8px] text-triage-red font-mono uppercase tracking-wider"
          >
            DÉPASSÉ
          </motion.div>
        )}
      </div>
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
    </motion.button>
  );
}

export function DashboardInfirmier() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [triage, setTriage] = useState<Passage[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = async () => {
    try {
      const [s, t] = await Promise.all([
        api.get<DashboardStats>("/dashboard/stats"),
        api.get<Passage[]>("/triage/en-attente"),
      ]);
      setStats(s);
      setTriage(t);
      setLastRefresh(new Date());
    } catch {
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const refresh = setInterval(load, 15_000);
    return () => clearInterval(refresh);
  }, []);

  const alertCount = triage.filter((p) => {
    const cfg = TRIAGE[p.triage_couleur as keyof typeof TRIAGE];
    return cfg && minutesSince(p.created_at) > cfg.deadlineMin;
  }).length;

  const toTriage = (id: number) =>
    navigate({ to: "/visits/$visitId/triage", params: { visitId: String(id) } });

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Heart className="h-4 w-4 animate-pulse" style={{ color: CYAN }} />
          <span className="font-mono text-sm">Connexion au SAU…</span>
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
            <PulseRing color={CYAN} />
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              Poste infirmier · SAU
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Bonjour, <span className="text-gradient">{user?.prenom ?? "Infirmier(e)"}</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground font-mono">
            {new Date().toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
            {" · "}
            {lastRefresh.toLocaleTimeString("fr-FR")}
          </p>
        </motion.div>
        <div className="flex items-center gap-2 shrink-0">
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
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition glow"
            >
              <Plus className="h-4 w-4" />
              Nouveau patient
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
          color={CYAN}
          delay={0.05}
        />
        <StatCard
          icon={AlertTriangle}
          label="En attente triage"
          value={stats?.en_attente_triage ?? triage.length}
          sub={alertCount > 0 ? `${alertCount} délai dépassé` : "dans les délais"}
          color="var(--triage-orange)"
          delay={0.1}
          alert={alertCount > 0}
        />
        <StatCard
          icon={Activity}
          label="En consultation"
          value={stats?.en_consultation ?? 0}
          sub="boxes actifs"
          color="#a855f7"
          delay={0.15}
        />
        <StatCard
          icon={Clock}
          label="Sortis aujourd'hui"
          value={stats?.sortis_aujourdhui ?? 0}
          sub="depuis 00h00"
          color="#4ade80"
          delay={0.2}
        />
      </div>

      {/* Corps */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* File triage */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="lg:col-span-2 glass rounded-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <PulseRing color="var(--triage-orange)" />
              <span className="text-sm font-semibold text-foreground">File d'attente triage</span>
              <AnimatePresence>
                {triage.length > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="rounded-full px-2 py-0.5 text-[10px] font-mono border"
                    style={{
                      backgroundColor: "var(--triage-orange)22",
                      borderColor: "var(--triage-orange)44",
                      color: "var(--triage-orange)",
                    }}
                  >
                    {triage.length}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <div className="hidden md:flex items-center gap-3">
              {(["rouge", "orange", "jaune", "vert"] as const).map((c) => (
                <div key={c} className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: TC[c] }} />
                  <span className="text-[9px] font-mono text-muted-foreground capitalize">{c}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="h-8 border-b border-border/50 opacity-25">
            <EkgLine className="w-full h-full" />
          </div>

          <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
            <AnimatePresence>
              {triage.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-14 text-center"
                >
                  <Activity className="h-8 w-8 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground font-mono">
                    Aucun patient en attente
                  </p>
                </motion.div>
              ) : (
                triage.map((p, i) => <TriageRow key={p.id} p={p} onSelect={toTriage} index={i} />)
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Panel droit */}
        <div className="space-y-4">
          {/* Répartition */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-2xl p-4"
          >
            <div className="flex items-center gap-2 mb-4">
              <Cpu className="h-3.5 w-3.5 text-muted-foreground/50" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Répartition triage
              </span>
            </div>
            <div className="space-y-3">
              {(["rouge", "orange", "jaune", "vert"] as const).map((c) => {
                const count = stats?.par_couleur?.find((x) => x.triage_couleur === c)?.total ?? 0;
                const total = stats?.par_couleur?.reduce((s, x) => s + x.total, 0) ?? 1;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={c}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: TC[c], boxShadow: `0 0 5px ${TC[c]}` }}
                        />
                        <span className="text-[11px] font-mono text-muted-foreground capitalize">
                          {c}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono font-bold" style={{ color: TC[c] }}>
                        {count}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary/50 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: TC[c] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Alertes dépassement */}
          {alertCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35 }}
              className="rounded-2xl border border-triage-red/30 bg-triage-red/5 p-4"
              style={{ boxShadow: "0 0 20px var(--triage-red)22" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-triage-red" />
                <span className="text-xs font-bold text-triage-red uppercase tracking-wider">
                  {alertCount} délai{alertCount > 1 ? "s" : ""} dépassé{alertCount > 1 ? "s" : ""}
                </span>
              </div>
              <div className="space-y-1.5">
                {triage
                  .filter((p) => {
                    const cfg = TRIAGE[p.triage_couleur as keyof typeof TRIAGE];
                    return cfg && minutesSince(p.created_at) > cfg.deadlineMin;
                  })
                  .map((p) => (
                    <motion.button
                      key={p.id}
                      whileHover={{ x: 3 }}
                      onClick={() => toTriage(p.id)}
                      className="w-full flex items-center justify-between rounded-lg bg-triage-red/10 border border-triage-red/20 px-3 py-2 text-left"
                    >
                      <span className="text-xs font-medium text-foreground">
                        {p.patient?.prenom} {p.patient?.nom}
                      </span>
                      <span className="text-xs font-mono text-triage-red">
                        {minutesSince(p.created_at)} min
                      </span>
                    </motion.button>
                  ))}
              </div>
            </motion.div>
          )}

          {/* Actions rapides */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass rounded-2xl p-4"
          >
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Actions rapides
            </div>
            <div className="space-y-2">
              {[
                { to: "/patients/new", icon: Plus, label: "Enregistrer un patient", color: CYAN },
                {
                  to: "/visits/new",
                  icon: Zap,
                  label: "Nouveau passage",
                  color: "var(--triage-orange)",
                },
                { to: "/patients", icon: Users, label: "Liste patients", color: "#4ade80" },
              ].map(({ to, icon: Icon, label, color }) => (
                <Link
                  key={to}
                  to={to}
                  className="group flex items-center gap-3 rounded-xl border border-border bg-secondary/20 px-3.5 py-2.5 transition hover:bg-secondary/50"
                >
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition group-hover:scale-110"
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
        </div>
      </div>
    </div>
  );
}
