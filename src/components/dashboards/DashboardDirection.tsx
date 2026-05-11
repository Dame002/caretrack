import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  TrendingUp,
  Users,
  Clock,
  CheckCircle2,
  BarChart3,
  Activity,
  Eye,
  RefreshCw,
} from "lucide-react";
import { api, type DashboardStats } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const GOLD = "#f59e0b";
const CYAN = "#22d3ee";
const PURPLE = "#a855f7";
const GREEN = "#4ade80";

const TC: Record<string, string> = {
  rouge: "var(--triage-red)",
  orange: "var(--triage-orange)",
  jaune: "var(--triage-yellow)",
  vert: "var(--triage-green)",
};

// Compteur animé
function AnimatedNumber({ value, color }: { value: number; color: string }) {
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 60, damping: 20 });
  const display = useTransform(spring, (v) => Math.round(v).toString());
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    motionVal.set(value);
  }, [value, motionVal]);

  return (
    <motion.span ref={ref} style={{ color }}>
      {display}
    </motion.span>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  delay,
  unit,
}: {
  icon: typeof Activity;
  label: string;
  value: number;
  sub?: string;
  color: string;
  delay: number;
  unit?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.55 }}
      whileHover={{ y: -4, boxShadow: `0 16px 48px ${color}22` }}
      className="relative rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 overflow-hidden cursor-default"
    >
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
      />
      <div
        className="pointer-events-none absolute -bottom-8 -right-8 h-32 w-32 rounded-full opacity-8 blur-2xl"
        style={{ background: color }}
      />

      <div className="flex items-center justify-between mb-6">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${color}15`, border: `1px solid ${color}33` }}
        >
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        <Eye className="h-3.5 w-3.5 text-white/15" />
      </div>

      <div className="font-mono text-4xl font-bold leading-none">
        <AnimatedNumber value={value} color={color} />
        {unit && <span className="text-lg text-white/30 ml-1 font-normal">{unit}</span>}
      </div>
      <div className="mt-2 text-[11px] font-semibold text-white/50 uppercase tracking-wider">
        {label}
      </div>
      {sub && <div className="mt-1 text-[10px] text-white/25 font-mono">{sub}</div>}
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-black/80 backdrop-blur-xl px-3 py-2 text-xs font-mono">
      <div className="text-white/50 mb-1 capitalize">{label}</div>
      <div className="font-bold" style={{ color: payload[0]?.fill }}>
        {payload[0]?.value} patients
      </div>
    </div>
  );
};

export function DashboardDirection() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = async () => {
    try {
      const s = await api.get<DashboardStats>("/dashboard/stats");
      setStats(s);
      setLastRefresh(new Date());
    } catch {
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-white/40">
          <BarChart3 className="h-4 w-4 animate-pulse" style={{ color: GOLD }} />
          <span className="font-mono text-sm">Chargement des indicateurs…</span>
        </div>
      </div>
    );
  }

  const chartData = (["rouge", "orange", "jaune", "vert"] as const).map((c) => ({
    name: c,
    total: stats?.par_couleur?.find((x) => x.triage_couleur === c)?.total ?? 0,
    fill: TC[c],
  }));

  const tauxOccupation = stats?.patients_aujourdhui
    ? Math.min(
        Math.round(((stats.en_consultation ?? 0) / Math.max(stats.patients_aujourdhui, 1)) * 100),
        100,
      )
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: GOLD }} />
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
              Vue Direction · Lecture seule
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Tableau de bord <span style={{ color: GOLD }}>Direction</span>
          </h1>
          <p className="mt-1 text-sm text-white/40 font-mono">
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
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3.5 py-2 text-sm text-white/50 hover:text-white/80 transition"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Actualiser
        </motion.button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Users}
          label="Passages aujourd'hui"
          value={stats?.patients_aujourdhui ?? 0}
          sub="total journée en cours"
          color={GOLD}
          delay={0.05}
        />
        <KpiCard
          icon={Activity}
          label="En consultation"
          value={stats?.en_consultation ?? 0}
          sub="boxes actifs"
          color={PURPLE}
          delay={0.1}
        />
        <KpiCard
          icon={CheckCircle2}
          label="Sortis"
          value={stats?.sortis_aujourdhui ?? 0}
          sub="consultations clôturées"
          color={GREEN}
          delay={0.15}
        />
        <KpiCard
          icon={TrendingUp}
          label="Taux d'occupation"
          value={tauxOccupation}
          unit="%"
          sub="consultations / passages"
          color={CYAN}
          delay={0.2}
        />
      </div>

      {/* Graphiques */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Bar chart triage */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-5 overflow-hidden"
        >
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="h-4 w-4" style={{ color: GOLD }} />
            <span className="text-sm font-semibold text-white/70">
              Répartition par niveau de triage
            </span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} barSize={32}>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11, fontFamily: "monospace" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10 }}
                width={24}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Indicateurs qualitatifs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-5"
        >
          <div className="flex items-center gap-2 mb-6">
            <Clock className="h-4 w-4" style={{ color: GOLD }} />
            <span className="text-sm font-semibold text-white/70">Indicateurs de performance</span>
          </div>
          <div className="space-y-4">
            {[
              {
                label: "Patients rouge",
                value: stats?.par_couleur?.find((x) => x.triage_couleur === "rouge")?.total ?? 0,
                max: stats?.patients_aujourdhui ?? 1,
                color: TC.rouge,
                desc: "urgences vitales",
              },
              {
                label: "En attente triage",
                value: stats?.en_attente_triage ?? 0,
                max: stats?.patients_aujourdhui ?? 1,
                color: "var(--triage-orange)",
                desc: "file active",
              },
              {
                label: "Consultations",
                value: stats?.en_consultation ?? 0,
                max: stats?.patients_aujourdhui ?? 1,
                color: PURPLE,
                desc: "boxes occupés",
              },
              {
                label: "Sortis",
                value: stats?.sortis_aujourdhui ?? 0,
                max: stats?.patients_aujourdhui ?? 1,
                color: GREEN,
                desc: "flux sortant",
              },
            ].map(({ label, value, max, color, desc }) => {
              const pct = max > 0 ? Math.round((value / max) * 100) : 0;
              return (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div>
                      <span className="text-[11px] font-semibold text-white/60">{label}</span>
                      <span className="ml-2 text-[10px] text-white/25 font-mono">{desc}</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-mono font-bold" style={{ color }}>
                        {value}
                      </span>
                      <span className="text-[10px] text-white/25 font-mono">/ {max}</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-white/8 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, ${color}88, ${color})` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Footer info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center justify-between rounded-xl border border-white/7 bg-white/2 px-5 py-3"
      >
        <div className="flex items-center gap-2 text-[11px] font-mono text-white/25">
          <Eye className="h-3 w-3" />
          Accès lecture seule · Direction
        </div>
        <div className="text-[11px] font-mono text-white/20">
          Actualisation automatique toutes les 60s
        </div>
      </motion.div>
    </div>
  );
}
