import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState, useRef } from "react";
import {
  ClipboardList,
  Search,
  ChevronRight,
  RefreshCw,
  Calendar,
  Clock,
  Stethoscope,
  CheckCircle2,
  XCircle,
  AlertCircle,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { api, type Passage, type TriageCouleur, STATUT_LABELS } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/visits/")({
  component: VisitsHistoryPage,
});

// ─── Couleurs ──────────────────────────────────────────────────────────────
const TC: Record<TriageCouleur, string> = {
  rouge: "#ef4444",
  orange: "#f97316",
  jaune: "#eab308",
  vert: "#22c55e",
};

const TRIAGE_LABELS: Record<TriageCouleur, string> = {
  rouge: "Critique",
  orange: "Urgent",
  jaune: "Semi-urgent",
  vert: "Non urgent",
};

const STATUT_ICON = {
  en_attente_triage: AlertCircle,
  en_attente_medecin: Clock,
  en_consultation: Stethoscope,
  sorti: CheckCircle2,
};

const STATUT_COLOR: Record<string, string> = {
  en_attente_triage: "#f97316",
  en_attente_medecin: "#eab308",
  en_consultation: "#a855f7",
  sorti: "#22c55e",
};

type PeriodFilter = "today" | "week" | "month" | "all";
type SortKey = "date" | "nom" | "triage";
type SortDir = "asc" | "desc";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function duree(debut: string, fin: string | null): string {
  if (!fin) return "—";
  const ms = new Date(fin).getTime() - new Date(debut).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h${String(mins % 60).padStart(2, "0")}`;
}

function isInPeriod(dateStr: string, period: PeriodFilter): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  if (period === "today") {
    return date.toDateString() === now.toDateString();
  }
  if (period === "week") {
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return date >= weekAgo;
  }
  if (period === "month") {
    const monthAgo = new Date(now);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return date >= monthAgo;
  }
  return true;
}

// ─── Badge triage ────────────────────────────────────────────────────────────
function TriageBadge({ couleur }: { couleur: TriageCouleur | null }) {
  if (!couleur) return <span className="font-mono text-[10px] text-muted-foreground">—</span>;
  const color = TC[couleur];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider"
      style={{ backgroundColor: `${color}18`, color, border: `1px solid ${color}33` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {TRIAGE_LABELS[couleur]}
    </span>
  );
}

// ─── Badge statut ────────────────────────────────────────────────────────────
function StatutBadge({ statut }: { statut: string }) {
  const color = STATUT_COLOR[statut] ?? "#94a3b8";
  const Icon = STATUT_ICON[statut as keyof typeof STATUT_ICON] ?? AlertCircle;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-mono"
      style={{ backgroundColor: `${color}15`, color, border: `1px solid ${color}30` }}
    >
      <Icon className="h-3 w-3" />
      {STATUT_LABELS[statut as keyof typeof STATUT_LABELS] ?? statut}
    </span>
  );
}

// ─── Row ─────────────────────────────────────────────────────────────────────
function PassageRow({ p, index, onClick }: { p: Passage; index: number; onClick: () => void }) {
  const col = TC[p.triage_couleur ?? "vert"] ?? "#22c55e";
  const initials = `${p.patient?.prenom?.[0] ?? ""}${p.patient?.nom?.[0] ?? ""}`;

  return (
    <motion.tr
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      onClick={onClick}
      className="group cursor-pointer border-b border-border/40 hover:bg-secondary/30 transition-colors"
    >
      {/* Patient */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold"
            style={{ backgroundColor: `${col}18`, color: col, border: `1px solid ${col}33` }}
          >
            {initials}
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">
              {p.patient?.prenom} {p.patient?.nom}
            </div>
            <div className="text-[10px] font-mono text-muted-foreground">
              #{p.patient?.numero_dossier ?? p.patient_id}
            </div>
          </div>
        </div>
      </td>

      {/* Triage */}
      <td className="px-4 py-3.5">
        <TriageBadge couleur={p.triage_couleur} />
      </td>

      {/* Statut */}
      <td className="px-4 py-3.5">
        <StatutBadge statut={p.statut} />
      </td>

      {/* Date arrivée */}
      <td className="px-4 py-3.5">
        <div className="text-xs text-foreground font-mono">{formatDate(p.date_arrivee)}</div>
        <div className="text-[10px] text-muted-foreground font-mono">
          {formatTime(p.date_arrivee)}
        </div>
      </td>

      {/* Durée */}
      <td className="px-4 py-3.5">
        <span className="text-xs font-mono text-muted-foreground">
          {duree(p.date_arrivee, p.date_sortie)}
        </span>
      </td>

      {/* Action */}
      <td className="px-4 py-3.5 text-right">
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground group-hover:text-foreground transition font-mono">
          Voir
          <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </td>
    </motion.tr>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
function VisitsHistoryPage() {
  const navigate = useNavigate();
  const [passages, setPassages] = useState<Passage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [triageFilter, setTriageFilter] = useState<TriageCouleur | "all">("all");
  const [statutFilter, setStatutFilter] = useState<string>("all");
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const searchRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      const data = await api.get<Passage[]>("/passages");
      setPassages(data);
      setLastRefresh(new Date());
    } catch (e: any) {
      toast.error(e.message ?? "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // ─── Filtrage + tri ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...passages];

    // Recherche
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.patient?.nom?.toLowerCase().includes(q) ||
          p.patient?.prenom?.toLowerCase().includes(q) ||
          p.patient?.numero_dossier?.toLowerCase().includes(q),
      );
    }

    // Triage
    if (triageFilter !== "all") {
      list = list.filter((p) => p.triage_couleur === triageFilter);
    }

    // Statut
    if (statutFilter !== "all") {
      list = list.filter((p) => p.statut === statutFilter);
    }

    // Période
    list = list.filter((p) => isInPeriod(p.date_arrivee, period));

    // Tri
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "date") {
        cmp = new Date(a.date_arrivee).getTime() - new Date(b.date_arrivee).getTime();
      } else if (sortKey === "nom") {
        cmp = (a.patient?.nom ?? "").localeCompare(b.patient?.nom ?? "");
      } else if (sortKey === "triage") {
        const order: Record<string, number> = { rouge: 0, orange: 1, jaune: 2, vert: 3 };
        cmp = (order[a.triage_couleur ?? "vert"] ?? 3) - (order[b.triage_couleur ?? "vert"] ?? 3);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [passages, search, triageFilter, statutFilter, period, sortKey, sortDir]);

  // ─── Stats rapides ───────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = filtered.length;
    const sortis = filtered.filter((p) => p.statut === "sorti").length;
    const critiques = filtered.filter((p) => p.triage_couleur === "rouge").length;
    return { total, sortis, critiques };
  }, [filtered]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const hasFilters = search || triageFilter !== "all" || statutFilter !== "all" || period !== "all";

  const resetFilters = () => {
    setSearch("");
    setTriageFilter("all");
    setStatutFilter("all");
    setPeriod("all");
  };

  const CYAN = "#22d3ee";
  const GREEN = "#4ade80";
  const RED = "#ef4444";

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="relative flex h-2 w-2">
              <motion.span
                className="absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ backgroundColor: CYAN }}
                animate={{ scale: [1, 2], opacity: [0.7, 0] }}
                transition={{ duration: 1.4, repeat: Infinity }}
              />
              <span
                className="relative inline-flex h-2 w-2 rounded-full"
                style={{ backgroundColor: CYAN }}
              />
            </span>
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              SAU · Historique
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Consultations <span style={{ color: CYAN }}>passées</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground font-mono">
            MAJ {lastRefresh.toLocaleTimeString("fr-FR")} · {passages.length} passage
            {passages.length > 1 ? "s" : ""} total
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

      {/* ── Stats rapides ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-3"
      >
        {[
          { label: "Résultats", value: stats.total, color: CYAN, icon: ClipboardList },
          { label: "Sortis", value: stats.sortis, color: GREEN, icon: CheckCircle2 },
          { label: "Critiques", value: stats.critiques, color: RED, icon: XCircle },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="glass rounded-2xl p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: color }} />
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${color}18`, border: `1px solid ${color}33` }}
              >
                <Icon className="h-4 w-4" style={{ color }} />
              </div>
              <div>
                <div className="font-mono text-xl font-bold" style={{ color }}>
                  {value}
                </div>
                <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                  {label}
                </div>
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* ── Filtres ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass rounded-2xl p-4 space-y-3"
      >
        {/* Recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou numéro de dossier…"
            className="w-full rounded-xl border border-border bg-secondary/20 py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-border transition font-mono"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filtres chips */}
        <div className="flex flex-wrap gap-2 items-center">
          <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />

          {/* Période */}
          {(["today", "week", "month", "all"] as PeriodFilter[]).map((p) => {
            const labels = {
              today: "Aujourd'hui",
              week: "7 jours",
              month: "30 jours",
              all: "Tout",
            };
            const active = period === p;
            return (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className="rounded-lg border px-2.5 py-1 text-[11px] font-mono transition"
                style={{
                  backgroundColor: active ? `${CYAN}18` : "transparent",
                  borderColor: active ? `${CYAN}44` : "var(--border)",
                  color: active ? CYAN : "var(--muted-foreground)",
                }}
              >
                {labels[p]}
              </button>
            );
          })}

          <div className="h-4 w-px bg-border/50 mx-1" />

          {/* Triage */}
          {(["all", "rouge", "orange", "jaune", "vert"] as const).map((c) => {
            const active = triageFilter === c;
            const color = c === "all" ? "#94a3b8" : TC[c];
            const label = c === "all" ? "Tous" : TRIAGE_LABELS[c];
            return (
              <button
                key={c}
                onClick={() => setTriageFilter(c)}
                className="rounded-lg border px-2.5 py-1 text-[11px] font-mono transition flex items-center gap-1.5"
                style={{
                  backgroundColor: active ? `${color}18` : "transparent",
                  borderColor: active ? `${color}44` : "var(--border)",
                  color: active ? color : "var(--muted-foreground)",
                }}
              >
                {c !== "all" && (
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
                )}
                {label}
              </button>
            );
          })}

          {hasFilters && (
            <button
              onClick={resetFilters}
              className="ml-auto flex items-center gap-1.5 rounded-lg border border-border/50 px-2.5 py-1 text-[11px] font-mono text-muted-foreground hover:text-foreground hover:border-border transition"
            >
              <X className="h-3 w-3" />
              Réinitialiser
            </button>
          )}
        </div>
      </motion.div>

      {/* ── Table ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-2xl overflow-hidden"
      >
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
            <Stethoscope className="h-4 w-4 animate-pulse" style={{ color: CYAN }} />
            <span className="font-mono text-sm">Chargement…</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-secondary/10">
                  {[
                    { key: "nom" as SortKey, label: "Patient" },
                    { key: "triage" as SortKey, label: "Triage" },
                    { key: null, label: "Statut" },
                    { key: "date" as SortKey, label: "Arrivée" },
                    { key: null, label: "Durée" },
                    { key: null, label: "" },
                  ].map(({ key, label }, i) => (
                    <th key={i} className="px-4 py-3">
                      {key ? (
                        <button
                          onClick={() => toggleSort(key)}
                          className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition"
                        >
                          {label}
                          <SlidersHorizontal
                            className="h-3 w-3 opacity-40"
                            style={{ color: sortKey === key ? CYAN : undefined }}
                          />
                        </button>
                      ) : (
                        <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                          {label}
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <ClipboardList className="h-8 w-8 text-muted-foreground/30 mb-3" />
                          <p className="text-sm text-muted-foreground font-mono">
                            Aucun résultat pour ces filtres
                          </p>
                          {hasFilters && (
                            <button
                              onClick={resetFilters}
                              className="mt-3 text-xs font-mono underline text-muted-foreground/60 hover:text-muted-foreground transition"
                            >
                              Réinitialiser les filtres
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((p, i) => (
                      <PassageRow
                        key={p.id}
                        p={p}
                        index={i}
                        onClick={() =>
                          navigate({
                            to: "/visits/$visitId",
                            params: { visitId: String(p.id) },
                          })
                        }
                      />
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* ── Footer count ── */}
      {!loading && filtered.length > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-[11px] font-mono text-muted-foreground"
        >
          {filtered.length} passage{filtered.length > 1 ? "s" : ""} affiché
          {filtered.length > 1 ? "s" : ""}
          {hasFilters ? ` sur ${passages.length}` : ""}
        </motion.p>
      )}
    </div>
  );
}
