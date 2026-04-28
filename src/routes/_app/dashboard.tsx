import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Users, Clock, AlertTriangle, Bed, TrendingUp, Stethoscope } from "lucide-react";
import { api, type Passage, type DashboardStats, STATUT_LABELS } from "@/lib/api";
import { TRIAGE, ageFromBirth, minutesSince } from "@/lib/triage";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/dashboard")({ component: Dashboard });

function Dashboard() {
  const { isMedecin, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [passages, setPassages] = useState<Passage[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [, setTick] = useState(0);

  const load = async () => {
    try {
      // file d'attente triage + tous les passages actifs via /triages (incluant ceux déjà triés)
      const [triages, attente, dash] = await Promise.all([
        api.get<{ passage: Passage }[]>("/triages").catch(() => []),
        api.get<Passage[]>("/triage/en-attente"),
        api.get<DashboardStats>("/dashboard/stats"),
      ]);
      setStats(dash);

      // Construire la liste : passages en attente + passages triés (via leurs triages)
      const triagedPassages = (triages as any[])
        .map((t) => t.passage)
        .filter((p): p is Passage => !!p && p.statut !== "sorti");

      const all = new Map<number, Passage>();
      attente.forEach((p) => all.set(p.id, p));
      triagedPassages.forEach((p) => all.set(p.id, p));
      setPassages(Array.from(all.values()));
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur de chargement");
    }
  };

  useEffect(() => {
    load();
    const poll = setInterval(load, 5000);
    const t = setInterval(() => setTick((x) => x + 1), 30000);
    return () => {
      clearInterval(poll);
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sorted = [...passages].sort((a, b) => {
    const order: Record<string, number> = { rouge: 0, orange: 1, jaune: 2, vert: 3 };
    const ao = a.triage_couleur ? order[a.triage_couleur] : 99;
    const bo = b.triage_couleur ? order[b.triage_couleur] : 99;
    if (ao !== bo) return ao - bo;
    return new Date(a.date_arrivee).getTime() - new Date(b.date_arrivee).getTime();
  });

  const overdueCount = passages.filter((v) => {
    if (!v.triage_couleur) return false;
    const wait = minutesSince(v.date_arrivee);
    return wait > TRIAGE[v.triage_couleur].deadlineMin && v.statut !== "en_consultation" && v.statut !== "sorti";
  }).length;

  const cloreConsultation = async (passageId: number) => {
    // Trouve la dernière consultation de ce passage et la clôture
    try {
      const all = await api.get<any[]>("/consultations");
      const consult = all
        .filter((c) => c.passage_id === passageId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
      if (!consult) {
        toast.error("Aucune consultation à clôturer");
        return;
      }
      await api.post(`/consultations/${consult.id}/cloture`);
      toast.success("Patient sorti");
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur");
    }
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="font-mono text-xs text-primary uppercase tracking-widest">Service des urgences</div>
          <h1 className="mt-2 font-display text-4xl font-bold">Tableau de bord</h1>
          <p className="mt-1 text-muted-foreground text-sm">{new Date().toLocaleString("fr-FR")}</p>
        </div>
        <div className="flex items-center gap-2 glass rounded-full px-4 py-2 text-xs font-mono">
          <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full" style={{ background: "var(--triage-green)", color: "var(--triage-green)" }} />
          LIVE · polling 5s
        </div>
      </motion.div>

      <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Users} label="Patients aujourd'hui" value={stats?.patients_aujourdhui ?? 0} color="var(--primary)" />
        <Stat icon={Clock} label="En attente triage" value={stats?.en_attente_triage ?? 0} color="var(--triage-yellow)" />
        <Stat icon={AlertTriangle} label="Délais dépassés" value={overdueCount} color="var(--triage-red)" />
        <Stat icon={Bed} label="En consultation" value={stats?.en_consultation ?? 0} color="var(--accent)" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-8 glass rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl font-semibold">File d'attente — temps réel</h2>
          </div>
          <span className="text-xs font-mono text-muted-foreground">{passages.length} passages</span>
        </div>

        {sorted.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <TrendingUp className="mx-auto h-10 w-10 opacity-30 mb-3" />
            Aucun passage actif. Créez un patient depuis « Nouveau patient ».
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/30">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">Triage</th>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Attente</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((v, i) => {
                  const wait = minutesSince(v.date_arrivee);
                  const deadline = v.triage_couleur ? TRIAGE[v.triage_couleur].deadlineMin : Infinity;
                  const overdue = wait > deadline;
                  return (
                    <motion.tr
                      key={v.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 + i * 0.04 }}
                      className="border-t border-border hover:bg-secondary/20 transition cursor-pointer"
                      onClick={() => navigate({ to: "/visits/$visitId", params: { visitId: String(v.id) } })}
                    >
                      <td className="px-4 py-3">
                        {v.triage_couleur ? (
                          <Badge color={TRIAGE[v.triage_couleur].color} label={TRIAGE[v.triage_couleur].label} />
                        ) : (
                          <span className="text-xs text-muted-foreground italic">à trier</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{v.patient?.prenom} {v.patient?.nom}</div>
                        <div className="text-xs text-muted-foreground font-mono">{v.patient?.numero_dossier} · {ageFromBirth(v.patient?.date_naissance) ?? "?"} ans</div>
                      </td>
                      <td className="px-4 py-3 text-xs">{STATUT_LABELS[v.statut]}</td>
                      <td className={`px-4 py-3 font-mono text-sm ${overdue ? "text-[var(--triage-red)] font-bold" : ""}`}>
                        {wait} min
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        {v.statut === "en_attente_triage" && (
                          <button
                            onClick={() => navigate({ to: "/visits/$visitId/triage", params: { visitId: String(v.id) } })}
                            className="text-xs rounded-md bg-primary px-3 py-1.5 text-primary-foreground hover:opacity-90 transition"
                          >
                            Trier
                          </button>
                        )}
                        {v.statut === "en_attente_medecin" && (isMedecin || isAdmin) && (
                          <button
                            onClick={() => navigate({ to: "/visits/$visitId", params: { visitId: String(v.id) } })}
                            className="text-xs rounded-md glass px-3 py-1.5 hover:bg-secondary transition inline-flex items-center gap-1.5"
                          >
                            <Stethoscope className="h-3 w-3" /> Consulter
                          </button>
                        )}
                        {v.statut === "en_consultation" && (
                          <button
                            onClick={() => cloreConsultation(v.id)}
                            className="text-xs rounded-md glass px-3 py-1.5 hover:bg-secondary transition"
                          >
                            Marquer sortie
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </>
  );
}

function Stat({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number | string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5 relative overflow-hidden"
    >
      <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full blur-2xl opacity-30" style={{ background: color }} />
      <div className="relative">
        <Icon className="h-5 w-5" style={{ color }} />
        <div className="mt-4 font-display text-3xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground mt-1">{label}</div>
      </div>
    </motion.div>
  );
}

function Badge({ color, label }: { color: string; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ background: `color-mix(in oklab, ${color} 15%, transparent)`, color }}>
      <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full" style={{ background: color, color }} />
      {label}
    </div>
  );
}
