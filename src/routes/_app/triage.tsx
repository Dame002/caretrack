import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { api, type Passage } from "@/lib/api";
import { toast } from "sonner";
import { ClipboardList, Clock, RefreshCw, ArrowRight, UserRound } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ageFromBirth } from "@/lib/triage";

export const Route = createFileRoute("/_app/triage")({ component: TriagePage });

function minutesEcoulees(dateArrivee: string): number {
  return Math.floor((Date.now() - new Date(dateArrivee).getTime()) / 60000);
}

function BadgeAttente({ minutes }: { minutes: number }) {
  const color =
    minutes >= 30
      ? "bg-red-500/15 text-red-400 border-red-500/30"
      : minutes >= 15
        ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
        : "bg-green-500/15 text-green-400 border-green-500/30";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-mono font-medium ${color}`}
    >
      <Clock className="h-3 w-3" />
      {minutes < 60
        ? `${minutes} min`
        : `${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, "0")}`}
    </span>
  );
}

function TriagePage() {
  const { isInfirmier, isAdmin } = useAuth();
  const readOnly = !isInfirmier && !isAdmin;
  const navigate = useNavigate();
  const [passages, setPassages] = useState<Passage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const charger = async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const data = await api.get<Passage[]>("/triage/en-attente");
      setPassages(data);
    } catch (e: any) {
      toast.error(e?.message ?? "Impossible de charger la file de triage");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    charger();
    const interval = setInterval(() => charger(), 60_000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        Chargement de la file…
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* En-tête */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="font-mono text-xs text-primary uppercase tracking-widest">
            Module · Triage
          </div>
          <h1 className="mt-2 font-display text-4xl font-bold">File d'attente</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {passages.length === 0
              ? "Aucun patient en attente de triage"
              : `${passages.length} patient${passages.length > 1 ? "s" : ""} en attente`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {readOnly ? (
            <span className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm font-mono text-amber-400">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
              Mode observation
            </span>
          ) : (
            <Link
              to="/visits/new"
              className="rounded-xl bg-primary text-primary-foreground px-5 py-3 font-medium hover:opacity-90 transition glow flex items-center gap-2 text-sm"
            >
              <UserRound className="h-4 w-4" />
              Nouvelle admission
            </Link>
          )}
          <button
            onClick={() => charger(true)}
            disabled={refreshing}
            className="rounded-xl glass px-4 py-3 text-sm font-medium hover:bg-secondary/50 transition flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Résumé compteurs */}
      {passages.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: "< 15 min",
              count: passages.filter((p) => minutesEcoulees(p.date_arrivee) < 15).length,
              color: "text-green-400",
              bg: "bg-green-500/10",
            },
            {
              label: "15 – 30 min",
              count: passages.filter((p) => {
                const m = minutesEcoulees(p.date_arrivee);
                return m >= 15 && m < 30;
              }).length,
              color: "text-amber-400",
              bg: "bg-amber-500/10",
            },
            {
              label: "> 30 min",
              count: passages.filter((p) => minutesEcoulees(p.date_arrivee) >= 30).length,
              color: "text-red-400",
              bg: "bg-red-500/10",
            },
          ].map((item) => (
            <div key={item.label} className={`glass rounded-2xl p-4 text-center ${item.bg}`}>
              <div className={`font-display text-3xl font-bold ${item.color}`}>{item.count}</div>
              <div className="text-xs text-muted-foreground mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Liste des passages */}
      {passages.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass rounded-2xl p-16 text-center"
        >
          <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <p className="mt-4 font-medium">Aucun patient en attente de triage</p>
          <p className="mt-1 text-sm text-muted-foreground">
            La file est vide. Les nouvelles admissions apparaîtront ici.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {passages
            .slice()
            .sort((a, b) => new Date(a.date_arrivee).getTime() - new Date(b.date_arrivee).getTime())
            .map((passage, i) => {
              const minutes = minutesEcoulees(passage.date_arrivee);
              const patient = passage.patient;
              const age = patient ? ageFromBirth(patient.date_naissance) : null;

              return (
                <motion.div
                  key={passage.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`glass rounded-2xl p-5 flex items-center justify-between gap-4 group transition ${
                    readOnly ? "cursor-default" : "hover:bg-secondary/20 cursor-pointer"
                  }`}
                  onClick={() => {
                    if (!readOnly)
                      navigate({
                        to: "/visits/$visitId/triage",
                        params: { visitId: String(passage.id) },
                      });
                  }}
                >
                  {/* Indicateur urgence temps */}
                  <div
                    className="h-full w-1 rounded-full self-stretch min-h-[48px]"
                    style={{
                      background:
                        minutes >= 30
                          ? "var(--triage-red)"
                          : minutes >= 15
                            ? "var(--triage-orange)"
                            : "var(--triage-green)",
                    }}
                  />

                  {/* Avatar initiales */}
                  <div className="h-12 w-12 rounded-xl flex items-center justify-center font-display font-bold shrink-0 bg-primary/15 text-primary text-sm">
                    {patient ? (patient.prenom[0] + patient.nom[0]).toUpperCase() : "??"}
                  </div>

                  {/* Infos patient */}
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-semibold truncate">
                      {patient ? `${patient.prenom} ${patient.nom}` : `Passage #${passage.id}`}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {patient && <span className="font-mono">{patient.numero_dossier}</span>}
                      {age !== null && <span>{age} ans</span>}
                      <span>
                        Arrivée à{" "}
                        {new Date(passage.date_arrivee).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Badge attente + bouton conditionnel */}
                  <div className="flex items-center gap-3 shrink-0">
                    <BadgeAttente minutes={minutes} />
                    {!readOnly && (
                      <span className="flex items-center gap-1 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition">
                        Trier
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
        </div>
      )}
    </motion.div>
  );
}
